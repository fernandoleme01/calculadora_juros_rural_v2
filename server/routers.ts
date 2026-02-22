import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  salvarCalculo,
  listarCalculos,
  listarCalculosPorUsuario,
  buscarCalculoPorId,
  deletarCalculo,
  getPlanoUsuario,
  incrementarLaudos,
  LIMITES_LAUDO,
  listarTodosUsuarios,
  alterarPlanoUsuario,
  resetarLaudosUsuario,
  getEstatisticasAdmin,
} from "./db";
import {
  calcularTCRPos,
  calcularTCRPre,
  analisarConformidade,
  getJurisprudenciaRelevante,
  LIMITE_JUROS_REMUNERATORIOS_AA,
  LIMITE_JUROS_MORA_AA,
  FATORES_PROGRAMA,
} from "./calculoTcr";
import { invokeLLM } from "./_core/llm";
import { buscarDadosBCB, buscarIPCAMensal } from "./bancoCentral";
import {
  gerarLaudoTecnicoJuridico,
  gerarPeticaoRevisaoContratual,
  JURISPRUDENCIA_CREDITO_RURAL,
  type DadosContrato,
} from "./geradorPeticao";

// ─── Schema de Validação ─────────────────────────────────────────────────────

const dadosFinanciamentoSchema = z.object({
  nomeDevedor: z.string().optional(),
  numeroCedula: z.string().optional(),
  modalidade: z.enum(["custeio", "investimento", "comercializacao"]),
  tipoTaxa: z.enum(["pre_fixada", "pos_fixada"]),
  valorPrincipal: z.number().positive("Valor principal deve ser positivo"),
  dataContratacao: z.string().datetime(),
  dataVencimento: z.string().datetime(),
  dataCalculo: z.string().datetime(),
  prazoMeses: z.number().int().positive(),
  taxaJurosRemuneratorios: z.number().min(0).max(100),
  taxaJurosMora: z.number().min(0).max(100).default(1),
  taxaMulta: z.number().min(0).max(10).default(2),
  // TCRpós
  ipcaMensal: z.array(z.number()).optional(),
  // TCRpré
  taxaJm: z.number().optional(),
  fatorInflacaoImplicita: z.number().optional(),
  fatorPrograma: z.number().optional(),
  fatorAjuste: z.number().optional(),
  salvar: z.boolean().default(false),
});

// ─── Router Principal ────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Cálculo TCR ──────────────────────────────────────────────────────────
  tcr: router({

    // Calcular TCR (pré ou pós-fixada)
    calcular: publicProcedure
      .input(dadosFinanciamentoSchema)
      .mutation(async ({ input, ctx }) => {
        const dados = {
          ...input,
          dataContratacao: new Date(input.dataContratacao),
          dataVencimento: new Date(input.dataVencimento),
          dataCalculo: new Date(input.dataCalculo),
        };

        let resultado;
        if (input.tipoTaxa === "pos_fixada") {
          resultado = calcularTCRPos(dados);
        } else {
          resultado = calcularTCRPre(dados);
        }

        // Salvar no histórico se solicitado
        if (input.salvar) {
          const userId = ctx.user?.id;
          const conformeRem = resultado.conformidade.limiteRemuneratorios;
          const conformeMora = resultado.conformidade.limiteMora;
          await salvarCalculo({
            userId: userId ?? null,
            nomeDevedor: input.nomeDevedor ?? null,
            numeroCedula: input.numeroCedula ?? null,
            modalidade: input.modalidade,
            tipoTaxa: input.tipoTaxa,
            valorPrincipal: String(input.valorPrincipal),
            dataContratacao: new Date(input.dataContratacao),
            dataVencimento: new Date(input.dataVencimento),
            dataCalculo: new Date(input.dataCalculo),
            prazoMeses: input.prazoMeses,
            taxaJurosRemuneratorios: String(input.taxaJurosRemuneratorios),
            taxaJurosMora: String(input.taxaJurosMora),
            taxaMulta: String(input.taxaMulta),
            fatorPrograma: resultado.fp != null ? String(resultado.fp) : null,
            fatorAjuste: resultado.fa != null ? String(resultado.fa) : null,
            fatorInflacaoImplicita: resultado.fii != null ? String(resultado.fii) : null,
            taxaJm: resultado.jm != null ? String(resultado.jm) : null,
            ipcaAcumulado: resultado.ipcaAcumulado != null ? String(resultado.ipcaAcumulado) : null,
            saldoDevedorAtualizado: String(resultado.saldoDevedorAtualizado),
            jurosRemuneratoriosCalculados: String(resultado.jurosRemuneratorios),
            jurosMoraCalculados: String(resultado.jurosMora),
            multaCalculada: String(resultado.multa),
            totalDevido: String(resultado.totalDevido),
            tcrEfetiva: String(resultado.tcrEfetiva),
            conformeLimiteRemuneratorios: conformeRem === "conforme" ? "sim" : conformeRem === "atencao" ? "atencao" : "nao",
            conformeLimiteMora: conformeMora === "conforme" ? "sim" : conformeMora === "atencao" ? "atencao" : "nao",
            alertasConformidade: resultado.conformidade.alertas.join("\n"),
            memoriaCalculo: resultado.memoriaCalculo,
          });
        }

        return resultado;
      }),

    // Validar conformidade legal de uma taxa
    validarConformidade: publicProcedure
      .input(z.object({
        taxaRemuneratoriaAA: z.number(),
        taxaMoraAA: z.number(),
        tcrEfetivaAA: z.number().optional(),
      }))
      .query(({ input }) => {
        return analisarConformidade(
          input.taxaRemuneratoriaAA,
          input.taxaMoraAA,
          input.tcrEfetivaAA ?? input.taxaRemuneratoriaAA
        );
      }),

    // Obter limites legais vigentes
    limitesLegais: publicProcedure.query(() => ({
      jurosRemuneratoriosMaxAA: LIMITE_JUROS_REMUNERATORIOS_AA,
      jurosMoraMaxAA: LIMITE_JUROS_MORA_AA,
      multaMax: 2.0,
      fatoresPrograma: FATORES_PROGRAMA,
      fundamentacao: {
        remuneratorios: "Decreto nº 22.626/33 (Lei de Usura) + Jurisprudência STJ",
        mora: "Decreto-Lei nº 167/67, art. 5º",
        multa: "Código Civil, art. 412 c/c legislação específica",
      },
    })),

    // Obter jurisprudência relevante
    jurisprudencia: publicProcedure.query(() => getJurisprudenciaRelevante()),

    // Gerar parecer técnico-jurídico via LLM
    gerarParecer: publicProcedure
      .input(z.object({
        calculoId: z.number().optional(),
        dadosCalculo: z.object({
          valorPrincipal: z.number(),
          taxaRemuneratoriaAA: z.number(),
          taxaMoraAA: z.number(),
          tcrEfetiva: z.number(),
          totalDevido: z.number(),
          modalidade: z.string(),
          tipoTaxa: z.string(),
          conformidade: z.object({
            limiteRemuneratorios: z.string(),
            limiteMora: z.string(),
            alertas: z.array(z.string()),
          }),
        }),
      }))
      .mutation(async ({ input }) => {
        const { dadosCalculo } = input;
        const prompt = `Você é um especialista em Direito Agrário e Crédito Rural. Elabore um parecer técnico-jurídico sucinto (máximo 400 palavras) sobre o seguinte cálculo de financiamento rural:

DADOS DO FINANCIAMENTO:
- Valor Principal: R$ ${dadosCalculo.valorPrincipal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Modalidade: ${dadosCalculo.modalidade}
- Tipo de Taxa: ${dadosCalculo.tipoTaxa}
- Taxa Remuneratória: ${dadosCalculo.taxaRemuneratoriaAA.toFixed(2)}% a.a.
- Taxa de Mora: ${dadosCalculo.taxaMoraAA.toFixed(2)}% a.a.
- TCR Efetiva: ${dadosCalculo.tcrEfetiva.toFixed(4)}% a.a.
- Total Devido: R$ ${dadosCalculo.totalDevido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

ANÁLISE DE CONFORMIDADE:
- Juros Remuneratórios: ${dadosCalculo.conformidade.limiteRemuneratorios}
- Juros de Mora: ${dadosCalculo.conformidade.limiteMora}
- Alertas: ${dadosCalculo.conformidade.alertas.join("; ") || "Nenhum"}

Fundamente o parecer na Lei nº 4.829/65, Decreto-Lei nº 167/67, Decreto nº 22.626/33 (Lei de Usura), Resoluções CMN nº 4.883/2020 e 4.913/2021, e jurisprudência consolidada do STJ. Seja objetivo e técnico.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um especialista em Direito Agrário e Crédito Rural, com profundo conhecimento da Lei 11.101/2005 e suas alterações. Elabore pareceres técnicos precisos e fundamentados." },
            { role: "user", content: prompt },
          ],
        });

        return {
          parecer: response.choices[0]?.message?.content ?? "Não foi possível gerar o parecer.",
        };
      }),
  }),

  // ─── Banco Central (BCB) ─────────────────────────────────────────────────
  bcb: router({

    // Buscar todos os dados atualizados do BCB
    dadosAtualizados: publicProcedure.query(async () => {
      return await buscarDadosBCB();
    }),

    // Buscar IPCA mensal para uso no cálculo TCR
    ipcaMensal: publicProcedure
      .input(z.object({ meses: z.number().int().min(1).max(60).default(24) }))
      .query(async ({ input }) => {
        return await buscarIPCAMensal(input.meses);
      }),

    // Jurisprudência real com números de processos
    jurisprudenciaReal: publicProcedure.query(() => JURISPRUDENCIA_CREDITO_RURAL),
  }),

  // ─── Laudo Técnico-Jurídico ───────────────────────────────────────────────
  laudo: router({

    gerar: protectedProcedure
      .input(z.object({
        nomeAutor: z.string(),
        nacionalidade: z.string().default("brasileiro(a)"),
        estadoCivil: z.string().default("a informar"),
        cpf: z.string().default(""),
        rg: z.string().default(""),
        endereco: z.string().default(""),
        nomePropriedade: z.string().default(""),
        municipioPropriedade: z.string().default(""),
        uf: z.string().default(""),
        nomeBanco: z.string(),
        cnpjBanco: z.string().default(""),
        enderecoBanco: z.string().default(""),
        numeroContrato: z.string(),
        dataContratacao: z.string(),
        valorCredito: z.number().positive(),
        dataVencimento: z.string(),
        modalidade: z.enum(["custeio", "investimento", "comercializacao"]),
        cultura: z.string().default(""),
        anoSafra: z.string().default(""),
        taxaJurosContratada: z.number(),
        taxaJurosMoraContratada: z.number().default(1),
        garantias: z.string().default(""),
        tipoEvento: z.string().default(""),
        descricaoEvento: z.string().default(""),
        dataComunicacaoBanco: z.string().default(""),
        descricaoPropostaRenegociacao: z.string().default(""),
        nomeAdvogado: z.string().default(""),
        oab: z.string().default(""),
        telefoneAdvogado: z.string().default(""),
        emailAdvogado: z.string().default(""),
        enderecoEscritorio: z.string().default(""),
        comarca: z.string().default(""),
        vara: z.string().default(""),
        saldoDevedor: z.number().optional(),
        saldoDevedorRevisado: z.number().optional(),
        excessoJuros: z.number().optional(),
        taxaLegalMaxima: z.number().optional(),
        ipcaAcumulado: z.number().optional(),
        selicAtual: z.number().optional(),
        usdAtual: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // ─── Verificar limite de laudos do plano ───
        const planoInfo = await getPlanoUsuario(ctx.user.id);
        if (!planoInfo.podeGerar) {
          throw new Error(
            `Limite de laudos atingido para o plano ${planoInfo.plano}. ` +
            `Você utilizou ${planoInfo.laudosUsados} de ${planoInfo.limite} laudo(s). ` +
            `Faça upgrade para continuar.`
          );
        }
        // Buscar dados atualizados do BCB para enriquecer o laudo
        let dadosBCB;
        try {
          const bcb = await buscarDadosBCB();
          dadosBCB = {
            ipcaAcumulado12m: bcb.ipca.acumulado12m?.valor,
            selicAnualizada: bcb.selic.anualizada?.toFixed(2),
            taxaMediaCreditoRural: bcb.creditoRural.taxaMedia[bcb.creditoRural.taxaMedia.length - 1]?.valor,
            usdVenda: bcb.cambio.usdVenda?.toFixed(4),
          };
        } catch {
          dadosBCB = undefined;
        }
        const resultado = await gerarLaudoTecnicoJuridico(input as DadosContrato, dadosBCB);
        // Incrementar contador de laudos após geração bem-sucedida
        await incrementarLaudos(ctx.user.id);
        return {
          ...resultado,
          podePDF: planoInfo.podePDF,
          podeImprimir: planoInfo.podeImprimir,
          plano: planoInfo.plano,
        };
      }),
  }),

  // ─── Petição de Revisão Contratual ───────────────────────────────────────
  peticao: router({

    gerar: publicProcedure
      .input(z.object({
        nomeAutor: z.string(),
        nacionalidade: z.string().default("brasileiro(a)"),
        estadoCivil: z.string().default("a informar"),
        cpf: z.string(),
        rg: z.string().default(""),
        endereco: z.string(),
        nomePropriedade: z.string(),
        municipioPropriedade: z.string(),
        uf: z.string(),
        nomeBanco: z.string(),
        cnpjBanco: z.string(),
        enderecoBanco: z.string().default(""),
        numeroContrato: z.string(),
        dataContratacao: z.string(),
        valorCredito: z.number().positive(),
        dataVencimento: z.string(),
        modalidade: z.enum(["custeio", "investimento", "comercializacao"]),
        cultura: z.string(),
        anoSafra: z.string(),
        taxaJurosContratada: z.number(),
        taxaJurosMoraContratada: z.number().default(1),
        garantias: z.string(),
        tipoEvento: z.string(),
        descricaoEvento: z.string(),
        dataComunicacaoBanco: z.string(),
        descricaoPropostaRenegociacao: z.string(),
        nomeAdvogado: z.string(),
        oab: z.string(),
        telefoneAdvogado: z.string().default(""),
        emailAdvogado: z.string().default(""),
        enderecoEscritorio: z.string(),
        comarca: z.string(),
        vara: z.string().default("[VARA]"),
        saldoDevedor: z.number().optional(),
        saldoDevedorRevisado: z.number().optional(),
        excessoJuros: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return await gerarPeticaoRevisaoContratual(input as DadosContrato);
      }),
  }),

  // ─── Plano do Usuário ──────────────────────────────────────────────────────
  plano: router({

    // Retorna plano, laudos usados e permissões do usuário autenticado
    meuPlano: protectedProcedure.query(async ({ ctx }) => {
      return await getPlanoUsuario(ctx.user.id);
    }),

    // Retorna limites de cada plano (público, para exibir na landing page)
    limites: publicProcedure.query(() => LIMITES_LAUDO),
  }),

  // ─── Administração (apenas role=admin) ──────────────────────────────────────
  admin: router({

    // Verificar se o usuário é admin
    verificar: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administradores.' });
      return { isAdmin: true };
    }),

    // Estatísticas gerais do sistema
    estatisticas: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      return await getEstatisticasAdmin();
    }),

    // Listar todos os usuários
    listarUsuarios: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      return await listarTodosUsuarios();
    }),

    // Alterar plano de um usuário
    alterarPlano: protectedProcedure
      .input(z.object({
        userId: z.number(),
        plano: z.enum(['standard', 'premium', 'supreme', 'admin']),
        expiracao: z.string().datetime().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        await alterarPlanoUsuario(
          input.userId,
          input.plano,
          input.expiracao ? new Date(input.expiracao) : null
        );
        return { success: true };
      }),

    // Resetar contador de laudos de um usuário
    resetarLaudos: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        await resetarLaudosUsuario(input.userId);
        return { success: true };
      }),
  }),

  // ─── Histórico ────────────────────────────────────────────────────────────
  historico: router({

    listar: publicProcedure.query(async ({ ctx }) => {
      if (ctx.user) {
        return await listarCalculosPorUsuario(ctx.user.id);
      }
      return await listarCalculos();
    }),

    buscar: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await buscarCalculoPorId(input.id);
      }),

    deletar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletarCalculo(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

