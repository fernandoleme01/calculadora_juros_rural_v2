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
  salvarPerfilAdvogado,
  buscarPerfilAdvogado,
  salvarPerfilPerito,
  buscarPerfilPerito,
} from "./db";
import {
  calcularTCRPos,
  calcularTCRPre,
  analisarConformidade,
  calcularAnaliseParcelas,
  calcularAnaliseEncargos,
  getJurisprudenciaRelevante,
  LIMITE_JUROS_REMUNERATORIOS_AA,
  LIMITE_JUROS_MORA_AA,
  FATORES_PROGRAMA,
} from "./calculoTcr";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { buscarDadosBCB, buscarIPCAMensal } from "./bancoCentral";
import { criarSessaoCheckout, criarPortalCliente, obterOuCriarCustomer } from "./stripeService";
import { salvarStripeCustomerId } from "./db";
import { PRODUTOS, type PlanoId } from "./stripeProducts";
import {
  gerarLaudoTecnicoJuridico,
  gerarPeticaoRevisaoContratual,
  JURISPRUDENCIA_CREDITO_RURAL,
  type DadosContrato,
} from "./geradorPeticao";
import {
  calcularAmortizacao,
  type SistemaAmortizacao,
  type PeriodicidadeParcela,
} from "./amortizacao";
import {
  analisarCadeiaContratual,
  gerarLaudoCadeiaContratual,
  type ContratoNaCadeia,
  type TipoContrato,
} from "./analiseCadeia";
import {
  criarCadeiaContratos,
  listarCadeiasPorUsuario,
  buscarCadeiaComContratos,
  deletarCadeia,
  adicionarContratoCadeia,
  atualizarContratoCadeia,
  deletarContratoCadeia,
  salvarLaudoCadeia,
} from "./db";

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
  // Parcelas pagas (análise de excesso)
  numeroParcelas: z.number().int().positive().optional(),
  parcelasPagas: z.number().int().min(0).optional(),
  valorParcelaPaga: z.number().positive().optional(),
  saldoDevedorBanco: z.number().positive().optional(),
  periodicidadeParcela: z.enum(["mensal", "anual"]).default("anual"),
  // Encargos adicionais (IOF, TAC, TEC)
  iofCobrado: z.number().min(0).optional(),
  tacCobrada: z.number().min(0).optional(),
  tecCobrada: z.number().min(0).optional(),
  outrasTagas: z.number().min(0).optional(),
  salvar: z.boolean().default(false),
});

// ─── Router de Perfil Profissional (declarado antes do appRouter) ───────────
const perfilRouter = router({
  buscarAdvogado: protectedProcedure.query(async ({ ctx }) => {
    return await buscarPerfilAdvogado(ctx.user.id);
  }),
  salvarAdvogado: protectedProcedure
    .input(z.object({
      nome: z.string().min(3, "Nome obrigatório"),
      oab: z.string().min(3, "OAB obrigatória"),
      cpf: z.string().optional(),
      email: z.string().email("E-mail inválido").optional().or(z.literal("")),
      telefone: z.string().optional(),
      escritorio: z.string().optional(),
      endereco: z.string().optional(),
      cidade: z.string().optional(),
      estado: z.string().max(2).optional(),
      cep: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await salvarPerfilAdvogado(ctx.user.id, input);
      return { success: true };
    }),
  buscarPerito: protectedProcedure.query(async ({ ctx }) => {
    return await buscarPerfilPerito(ctx.user.id);
  }),
  salvarPerito: protectedProcedure
    .input(z.object({
      nome: z.string().min(3, "Nome obrigatório"),
      categoria: z.enum(["contador", "economista", "administrador", "tecnico_contabil", "outro"]),
      registroProfissional: z.string().min(3, "Registro profissional obrigatório"),
      cpf: z.string().optional(),
      email: z.string().email("E-mail inválido").optional().or(z.literal("")),
      telefone: z.string().optional(),
      empresa: z.string().optional(),
      endereco: z.string().optional(),
      cidade: z.string().optional(),
      estado: z.string().max(2).optional(),
      cep: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await salvarPerfilPerito(ctx.user.id, input);
      return { success: true };
    }),
});

// ─── Router Principal ────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  perfil: perfilRouter,

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

        // Análise de parcelas pagas (se informadas)
        if (
          input.numeroParcelas &&
          input.parcelasPagas !== undefined &&
          input.valorParcelaPaga &&
          input.saldoDevedorBanco
        ) {
          resultado.analiseParcelas = calcularAnaliseParcelas(
            input.valorPrincipal,
            input.taxaJurosRemuneratorios,
            input.numeroParcelas,
            input.parcelasPagas,
            input.valorParcelaPaga,
            input.saldoDevedorBanco,
            input.periodicidadeParcela
          );
        }

        // Análise de encargos adicionais (IOF, TAC, TEC)
        const temEncargos = (input.iofCobrado ?? 0) > 0 ||
          (input.tacCobrada ?? 0) > 0 ||
          (input.tecCobrada ?? 0) > 0 ||
          (input.outrasTagas ?? 0) > 0;
        if (temEncargos) {
          resultado.analiseEncargos = calcularAnaliseEncargos(
            input.valorPrincipal,
            input.taxaJurosRemuneratorios,
            input.prazoMeses,
            input.iofCobrado,
            input.tacCobrada,
            input.tecCobrada,
            input.outrasTagas
          );
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

  // ─── Assinatura Stripe ─────────────────────────────────────────────────────
  assinatura: router({

    // Cria sessão de checkout para assinar um plano
    criarCheckout: protectedProcedure
      .input(z.object({
        planoId: z.enum(['standard', 'premium', 'supreme']),
        periodicidade: z.enum(['mensal', 'anual']),
        origin: z.string().url(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { url, customerId } = await criarSessaoCheckout({
          userId: ctx.user.id,
          email: ctx.user.email,
          nome: ctx.user.name,
          stripeCustomerId: (ctx.user as Record<string, unknown>).stripeCustomerId as string | null,
          planoId: input.planoId as PlanoId,
          periodicidade: input.periodicidade,
          origin: input.origin,
        });
        // Salvar customerId se for novo
        if (customerId && !(ctx.user as Record<string, unknown>).stripeCustomerId) {
          await salvarStripeCustomerId(ctx.user.id, customerId);
        }
        return { url };
      }),

    // Abre o portal do cliente Stripe para gerenciar assinatura
    abrirPortal: protectedProcedure
      .input(z.object({ origin: z.string().url() }))
      .mutation(async ({ input, ctx }) => {
        const stripeCustomerId = (ctx.user as Record<string, unknown>).stripeCustomerId as string | null;
        if (!stripeCustomerId) {
          // Criar customer se não existir
          const customerId = await obterOuCriarCustomer(
            ctx.user.id,
            ctx.user.email,
            ctx.user.name,
            null
          );
          await salvarStripeCustomerId(ctx.user.id, customerId);
          const url = await criarPortalCliente({ stripeCustomerId: customerId, origin: input.origin });
          return { url };
        }
        const url = await criarPortalCliente({ stripeCustomerId, origin: input.origin });
        return { url };
      }),

    // Retorna os planos disponíveis com preços
    planos: publicProcedure.query(() => {
      return Object.values(PRODUTOS).map(p => ({
        id: p.planoId,
        nome: p.nome,
        descricao: p.descricao,
        laudosPorMes: p.laudosPorMes,
        precoMensal: p.precoMensal,
        precoAnual: p.precoAnual,
        precoMensalReais: p.precoMensal / 100,
        precoAnualReais: p.precoAnual / 100,
        precoMensalAnualizadoReais: (p.precoAnual / 100) / 12,
      }));
    }),
  }),

  // ─── Histórico ────────────────────────────────────────────────────────────
  // ─── Amortização ─────────────────────────────────────────────────────────
  amortizacao: router({
    calcular: publicProcedure
      .input(z.object({
        valorPrincipal: z.number().positive(),
        taxaJurosAnual: z.number().positive(),
        numeroParcelas: z.number().int().positive(),
        parcelasPagas: z.number().int().min(0),
        sistema: z.enum(["price", "sac", "saf"]),
        periodicidade: z.enum(["anual", "mensal"]),
        valoresPagos: z.array(z.number()).optional(),
        // Modalidade para aplicar o limite legal correto (MCR 7-1, Tabela 1)
        modalidade: z.enum([
          "custeio_obrigatorio", "custeio_livre", "investimento_subvencionado",
          "investimento_livre", "comercializacao", "industrializacao",
          "pronaf_b", "pronaf_custeio", "pronaf_investimento", "pronaf_agroecologia",
          "pronamp_custeio", "pronamp_investimento", "nao_controlado"
        ]).optional(),
      }))
      .mutation(({ input }) => {
        return calcularAmortizacao({
          valorPrincipal: input.valorPrincipal,
          taxaJurosAnual: input.taxaJurosAnual,
          numeroParcelas: input.numeroParcelas,
          parcelasPagas: input.parcelasPagas,
          sistema: input.sistema as SistemaAmortizacao,
          periodicidade: input.periodicidade as PeriodicidadeParcela,
          valoresPagos: input.valoresPagos,
          modalidade: input.modalidade as import("./limitesLegais").ModalidadeCredito | undefined,
        });
      }),
  }),

  // ─── Cadeia de Contratos — Análise de Operação Mata-Mata ────────────────────
  cadeia: router({

    criar: protectedProcedure
      .input(z.object({
        nome: z.string().min(3),
        banco: z.string().min(2),
        descricao: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await criarCadeiaContratos(ctx.user.id, input);
      }),

    listar: protectedProcedure
      .query(async ({ ctx }) => {
        return await listarCadeiasPorUsuario(ctx.user.id);
      }),

    buscar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const cadeia = await buscarCadeiaComContratos(input.id);
        if (!cadeia || cadeia.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Cadeia não encontrada" });
        }
        return cadeia;
      }),

    deletar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const cadeia = await buscarCadeiaComContratos(input.id);
        if (!cadeia || cadeia.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Cadeia não encontrada" });
        }
        await deletarCadeia(input.id);
        return { success: true };
      }),

    adicionarContrato: protectedProcedure
      .input(z.object({
        cadeiaId: z.number(),
        ordem: z.number().int().positive(),
        tipo: z.enum(["original", "aditivo", "refinanciamento", "novacao", "renegociacao"]),
        numeroContrato: z.string(),
        dataContratacao: z.string(),
        dataVencimento: z.string(),
        modalidade: z.enum(["custeio", "investimento", "comercializacao", "outro"]),
        valorContrato: z.number().positive(),
        valorPrincipalOriginal: z.number().optional(),
        valorEncargosIncorporados: z.number().optional(),
        taxaJurosAnual: z.number().positive(),
        taxaJurosMora: z.number().optional(),
        numeroParcelas: z.number().int().optional(),
        sistemaAmortizacao: z.enum(["price", "sac", "saf", "outro"]).optional(),
        garantias: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const cadeia = await buscarCadeiaComContratos(input.cadeiaId);
        if (!cadeia || cadeia.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Cadeia não encontrada" });
        }
        // Campos decimal no MySQL são armazenados como string
        const dadosInsert: any = {
          ...input,
          valorContrato: String(input.valorContrato),
          valorPrincipalOriginal: input.valorPrincipalOriginal !== undefined ? String(input.valorPrincipalOriginal) : undefined,
          valorEncargosIncorporados: input.valorEncargosIncorporados !== undefined ? String(input.valorEncargosIncorporados) : undefined,
          taxaJurosAnual: String(input.taxaJurosAnual),
          taxaJurosMora: input.taxaJurosMora !== undefined ? String(input.taxaJurosMora) : undefined,
        };
        return await adicionarContratoCadeia(dadosInsert);
      }),

    atualizarContrato: protectedProcedure
      .input(z.object({
        id: z.number(),
        cadeiaId: z.number(),
        ordem: z.number().int().positive().optional(),
        tipo: z.enum(["original", "aditivo", "refinanciamento", "novacao", "renegociacao"]).optional(),
        numeroContrato: z.string().optional(),
        dataContratacao: z.string().optional(),
        dataVencimento: z.string().optional(),
        modalidade: z.enum(["custeio", "investimento", "comercializacao", "outro"]).optional(),
        valorContrato: z.number().positive().optional(),
        valorPrincipalOriginal: z.number().optional(),
        valorEncargosIncorporados: z.number().optional(),
        taxaJurosAnual: z.number().positive().optional(),
        taxaJurosMora: z.number().optional(),
        numeroParcelas: z.number().int().optional(),
        sistemaAmortizacao: z.enum(["price", "sac", "saf", "outro"]).optional(),
        garantias: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const cadeia = await buscarCadeiaComContratos(input.cadeiaId);
        if (!cadeia || cadeia.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Cadeia não encontrada" });
        }
        const { id: contratoId, cadeiaId: _cadeiaId, ...dadosAtualizar } = input;
        // Campos decimal no MySQL são armazenados como string
        const dadosConvertidos: any = { ...dadosAtualizar };
        if (dadosConvertidos.valorContrato !== undefined) dadosConvertidos.valorContrato = String(dadosConvertidos.valorContrato);
        if (dadosConvertidos.valorPrincipalOriginal !== undefined) dadosConvertidos.valorPrincipalOriginal = String(dadosConvertidos.valorPrincipalOriginal);
        if (dadosConvertidos.valorEncargosIncorporados !== undefined) dadosConvertidos.valorEncargosIncorporados = String(dadosConvertidos.valorEncargosIncorporados);
        if (dadosConvertidos.taxaJurosAnual !== undefined) dadosConvertidos.taxaJurosAnual = String(dadosConvertidos.taxaJurosAnual);
        if (dadosConvertidos.taxaJurosMora !== undefined) dadosConvertidos.taxaJurosMora = String(dadosConvertidos.taxaJurosMora);
        return await atualizarContratoCadeia(contratoId, dadosConvertidos);
      }),

    deletarContrato: protectedProcedure
      .input(z.object({ id: z.number(), cadeiaId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const cadeia = await buscarCadeiaComContratos(input.cadeiaId);
        if (!cadeia || cadeia.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Cadeia não encontrada" });
        }
        await deletarContratoCadeia(input.id);
        return { success: true };
      }),

    analisar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const cadeia = await buscarCadeiaComContratos(input.id);
        if (!cadeia || cadeia.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Cadeia não encontrada" });
        }
        const contratos: ContratoNaCadeia[] = cadeia.contratos.map((c: any) => ({
          id: c.id,
          ordem: c.ordem,
          tipo: c.tipo as TipoContrato,
          numeroContrato: c.numeroContrato,
          dataContratacao: c.dataContratacao,
          dataVencimento: c.dataVencimento,
          modalidade: c.modalidade,
          valorContrato: parseFloat(c.valorContrato),
          valorPrincipalOriginal: c.valorPrincipalOriginal ? parseFloat(c.valorPrincipalOriginal) : undefined,
          valorEncargosIncorporados: c.valorEncargosIncorporados ? parseFloat(c.valorEncargosIncorporados) : undefined,
          taxaJurosAnual: parseFloat(c.taxaJurosAnual),
          taxaJurosMora: c.taxaJurosMora ? parseFloat(c.taxaJurosMora) : undefined,
          numeroParcelas: c.numeroParcelas ?? undefined,
          sistemaAmortizacao: c.sistemaAmortizacao ?? undefined,
          garantias: c.garantias ?? undefined,
          observacoes: c.observacoes ?? undefined,
        }));
        return analisarCadeiaContratual(contratos);
      }),

    gerarLaudo: protectedProcedure
      .input(z.object({
        id: z.number(),
        nomeProdutor: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const cadeia = await buscarCadeiaComContratos(input.id);
        if (!cadeia || cadeia.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Cadeia não encontrada" });
        }
        // Buscar perfil do perito e advogado
        const perito = await buscarPerfilPerito(ctx.user.id);
        const advogado = await buscarPerfilAdvogado(ctx.user.id);
        const contratos: ContratoNaCadeia[] = cadeia.contratos.map((c: any) => ({
          id: c.id,
          ordem: c.ordem,
          tipo: c.tipo as TipoContrato,
          numeroContrato: c.numeroContrato,
          dataContratacao: c.dataContratacao,
          dataVencimento: c.dataVencimento,
          modalidade: c.modalidade,
          valorContrato: parseFloat(c.valorContrato),
          valorPrincipalOriginal: c.valorPrincipalOriginal ? parseFloat(c.valorPrincipalOriginal) : undefined,
          valorEncargosIncorporados: c.valorEncargosIncorporados ? parseFloat(c.valorEncargosIncorporados) : undefined,
          taxaJurosAnual: parseFloat(c.taxaJurosAnual),
          taxaJurosMora: c.taxaJurosMora ? parseFloat(c.taxaJurosMora) : undefined,
          numeroParcelas: c.numeroParcelas ?? undefined,
          sistemaAmortizacao: c.sistemaAmortizacao ?? undefined,
          garantias: c.garantias ?? undefined,
          observacoes: c.observacoes ?? undefined,
        }));
        const analise = analisarCadeiaContratual(contratos);
        const laudo = await gerarLaudoCadeiaContratual({
          nomeCadeia: cadeia.nome,
          banco: cadeia.banco,
          nomeProdutor: input.nomeProdutor,
          nomeAdvogado: advogado?.nome ?? undefined,
          oabAdvogado: advogado?.oab ?? undefined,
          nomePerito: perito?.nome ?? undefined,
          categoriaPerito: perito?.categoria ?? undefined,
          registroPerito: perito?.registroProfissional ?? undefined,
          contratos,
          analise,
        });
        await salvarLaudoCadeia(input.id, laudo);
        return { laudo, analise };
      }),
  }),

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

  // ─── Extração de Dados de Contrato (PDF) ───────────────────────────────────────────
  contrato: router({
    extrairDadosPDF: protectedProcedure
      .input(z.object({
        pdfBase64: z.string(),
        nomeArquivo: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // 1. Upload do PDF para S3
        const buffer = Buffer.from(input.pdfBase64, "base64");
        const suffix = Date.now();
        const fileKey = `contratos/${ctx.user.id}/${suffix}-${input.nomeArquivo ?? "contrato.pdf"}`;
        const { url: pdfUrl } = await storagePut(fileKey, buffer, "application/pdf");

        // 2. LLM extrai dados estruturados do PDF
        const systemPrompt = `Você é um especialista em crédito rural brasileiro. Analise o contrato fornecido e extraia os dados estruturados. Retorne APENAS JSON válido, sem markdown.`;
        const userPrompt = `Extraia os dados do contrato de crédito rural. Se não encontrar um campo, use null.

Retorne exatamente:
{
  "valorPrincipal": <número em reais>,
  "taxaJurosAnual": <% ao ano>,
  "taxaJurosMensal": <% ao mês — calcule se não explícito>,
  "prazoMeses": <número de meses>,
  "prazoAnos": <número de anos>,
  "dataContratacao": <DD/MM/AAAA>,
  "dataVencimento": <DD/MM/AAAA>,
  "banco": <nome da instituição>,
  "modalidade": <custeio_agricola|custeio_pecuario|investimento|comercializacao|pronaf|outros>,
  "sistemaAmortizacao": <price|sac|saf|outros|null>,
  "indexador": <prefixado|selic|ipca|tr|tjlp|igpm|cdi|outros>,
  "numeroCedula": <número do contrato/cédula>,
  "nomeDevedor": <nome do tomador>,
  "cpfCnpjDevedor": <CPF ou CNPJ>,
  "finalidade": <descrição da finalidade>,
  "garantias": <descrição das garantias>,
  "observacoes": <cláusulas suspeitas, encargos adicionais, comissões>
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "file_url", file_url: { url: pdfUrl, mime_type: "application/pdf" } },
                { type: "text", text: userPrompt },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "dados_contrato",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  valorPrincipal: { type: ["number", "null"] },
                  taxaJurosAnual: { type: ["number", "null"] },
                  taxaJurosMensal: { type: ["number", "null"] },
                  prazoMeses: { type: ["integer", "null"] },
                  prazoAnos: { type: ["number", "null"] },
                  dataContratacao: { type: ["string", "null"] },
                  dataVencimento: { type: ["string", "null"] },
                  banco: { type: ["string", "null"] },
                  modalidade: { type: ["string", "null"] },
                  sistemaAmortizacao: { type: ["string", "null"] },
                  indexador: { type: ["string", "null"] },
                  numeroCedula: { type: ["string", "null"] },
                  nomeDevedor: { type: ["string", "null"] },
                  cpfCnpjDevedor: { type: ["string", "null"] },
                  finalidade: { type: ["string", "null"] },
                  garantias: { type: ["string", "null"] },
                  observacoes: { type: ["string", "null"] },
                },
                required: [
                  "valorPrincipal", "taxaJurosAnual", "taxaJurosMensal",
                  "prazoMeses", "prazoAnos", "dataContratacao", "dataVencimento",
                  "banco", "modalidade", "sistemaAmortizacao", "indexador",
                  "numeroCedula", "nomeDevedor", "cpfCnpjDevedor",
                  "finalidade", "garantias", "observacoes",
                ],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices?.[0]?.message?.content;
        if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "LLM não retornou dados" });

        let dados: Record<string, unknown>;
        try {
          dados = typeof content === "string" ? JSON.parse(content) : content;
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao interpretar resposta do LLM" });
        }

        return { dados, pdfUrl, sucesso: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;

