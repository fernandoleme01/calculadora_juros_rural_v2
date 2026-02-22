/**
 * Definição centralizada dos produtos e preços do Stripe para o JurosRurais.pro
 * Preços em centavos (BRL): R$ 149,00 = 14900
 */

export type PlanoId = "standard" | "premium" | "supreme";
export type Periodicidade = "mensal" | "anual";

export interface ProdutoStripe {
  nome: string;
  descricao: string;
  planoId: PlanoId;
  laudosPorMes: number | null; // null = ilimitado
  precoMensal: number; // em centavos
  precoAnual: number;  // em centavos (com 25% de desconto)
}

export const PRODUTOS: Record<PlanoId, ProdutoStripe> = {
  standard: {
    nome: "JurosRurais.pro — Standard",
    descricao: "10 laudos técnico-jurídicos por mês. Calculadora TCR, análise de contratos PDF, gerador de petição e dados do BCB em tempo real.",
    planoId: "standard",
    laudosPorMes: 10,
    precoMensal: 14900,  // R$ 149,00
    precoAnual: 134100,  // R$ 1.341,00/ano (R$ 111,75/mês — 25% off)
  },
  premium: {
    nome: "JurosRurais.pro — Premium",
    descricao: "25 laudos técnico-jurídicos por mês. Tudo do Standard mais jurisprudência real com nº de processos, análise comparativa e suporte prioritário.",
    planoId: "premium",
    laudosPorMes: 25,
    precoMensal: 32900,  // R$ 329,00
    precoAnual: 296100,  // R$ 2.961,00/ano (R$ 246,75/mês — 25% off)
  },
  supreme: {
    nome: "JurosRurais.pro — Supreme",
    descricao: "Laudos ilimitados por mês. Tudo do Premium mais múltiplos usuários, API de integração, personalização de modelos e SLA de suporte em 4 horas.",
    planoId: "supreme",
    laudosPorMes: null,
    precoMensal: 199000, // R$ 1.990,00
    precoAnual: 1791000, // R$ 17.910,00/ano (R$ 1.492,50/mês — 25% off)
  },
};

/**
 * Mapeia o plano do banco de dados para os limites de laudos mensais
 */
export function getLimiteLaudos(plano: string): number {
  switch (plano) {
    case "free":     return 1;      // 1 laudo total (não por mês)
    case "standard": return 10;
    case "premium":  return 25;
    case "supreme":  return 999999; // ilimitado
    case "admin":    return 999999;
    default:         return 1;
  }
}

/**
 * Verifica se o plano tem acesso a PDF e impressão
 */
export function temAcessoPdf(plano: string): boolean {
  return plano !== "free";
}
