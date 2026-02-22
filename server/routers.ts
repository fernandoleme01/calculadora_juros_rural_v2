import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  salvarCalculo,
  listarCalculos,
  listarCalculosPorUsuario,
  buscarCalculoPorId,
  deletarCalculo,
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
