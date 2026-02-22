/**
 * bancoCentral.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Módulo de integração com as APIs de Dados Abertos do Banco Central do Brasil
 *
 * APIs utilizadas:
 *   SGS  → https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados
 *   PTAX → https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata
 *
 * Séries SGS relevantes para crédito rural:
 *   11    → SELIC diária (% a.d.)
 *   433   → IPCA - Variação mensal (%)
 *   13522 → IPCA - Acumulado 12 meses (%)
 *   4390  → IPCA - Acumulado no ano (%)
 *   20714 → Crédito Rural - Taxa média de juros (% a.a.)
 *   20715 → Crédito Rural - Saldo total (R$ milhões)
 *   20716 → Taxa média de juros - Pessoas físicas - Total (% a.a.)
 */

import axios from "axios";

// ─── Constantes ───────────────────────────────────────────────────────────────

const BCB_SGS_BASE = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";
const BCB_PTAX_BASE = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata";
const TIMEOUT_MS = 20000;

// Códigos SGS das séries temporais
export const SGS = {
  SELIC_DIARIA: 11,
  IPCA_MENSAL: 433,
  IPCA_ACUMULADO_12M: 13522,
  IPCA_ACUMULADO_ANO: 4390,
  CREDITO_RURAL_TAXA_MEDIA: 20714,
  CREDITO_RURAL_SALDO: 20715,
  CREDITO_PF_TAXA_MEDIA: 20716,
} as const;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DadoBCB {
  data: string;   // "DD/MM/YYYY"
  valor: string;  // número como string
}

export interface CotacaoDolar {
  cotacaoCompra: number;
  cotacaoVenda: number;
  dataHoraCotacao: string;
}

export interface DadosBCBCompleto {
  selic: {
    diaria: DadoBCB[];           // últimos 5 dias úteis
    anualizada: number | null;   // % a.a. calculada
  };
  ipca: {
    mensal: DadoBCB[];           // últimos 24 meses
    acumulado12m: DadoBCB | null;
    acumuladoAno: DadoBCB | null;
  };
  creditoRural: {
    taxaMedia: DadoBCB[];        // últimos 12 meses
    saldo: DadoBCB | null;       // R$ milhões
  };
  creditoPF: {
    taxaMedia: DadoBCB[];        // últimos 6 meses (referência de mercado)
  };
  cambio: {
    usdCompra: number | null;
    usdVenda: number | null;
    dataHora: string | null;
  };
  resolucoesCMN: ResolucaoCMN[];
  dataConsulta: string;
  erros: string[];
}

export interface ResolucaoCMN {
  numero: string;
  data: string;
  ementa: string;
  url: string;
  vigente: boolean;
  tipo: "plano_safra" | "metodologia_tcr" | "credito_rural" | "recuperacao_judicial";
}

// ─── Resoluções CMN — Base Estática Atualizada ────────────────────────────────

export const RESOLUCOES_CMN: ResolucaoCMN[] = [
  {
    numero: "5.117",
    data: "19/12/2024",
    ementa: "Dispõe sobre as condições do crédito rural para o Plano Safra 2024/2025, estabelecendo taxas de juros, limites de financiamento e condições de acesso ao Sistema Nacional de Crédito Rural (SNCR). Fixa taxas entre 7% e 12% a.a. conforme modalidade e programa.",
    url: "https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20CMN&numero=5117",
    vigente: true,
    tipo: "plano_safra",
  },
  {
    numero: "5.087",
    data: "27/06/2024",
    ementa: "Altera as condições do crédito rural para o Plano Safra 2024/2025, com ajustes nas taxas de juros para modalidades de custeio e investimento, e ampliação dos limites de crédito para médios produtores rurais.",
    url: "https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20CMN&numero=5087",
    vigente: true,
    tipo: "plano_safra",
  },
  {
    numero: "4.913",
    data: "29/07/2021",
    ementa: "Estabelece a metodologia de cálculo da Taxa de Custo Real (TCR) para operações de crédito rural. Define os componentes: FAM (Fator de Atualização Monetária baseado no IPCA), FII (Fator de Inflação Implícita para TCRpré), Fator de Programa (FP) e Fator de Ajuste (FA). Regulamenta o MCR 3-2.",
    url: "https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=RESOLU%C3%87%C3%83O%20CMN&numero=4913",
    vigente: true,
    tipo: "metodologia_tcr",
  },
  {
    numero: "4.883",
    data: "26/11/2020",
    ementa: "Consolida as normas do Manual de Crédito Rural (MCR) e estabelece as bases para o cálculo da TCR pós-fixada com base no IPCA. Introduz a metodologia de atualização monetária para financiamentos rurais de longo prazo.",
    url: "https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=RESOLU%C3%87%C3%83O%20CMN&numero=4883",
    vigente: true,
    tipo: "metodologia_tcr",
  },
  {
    numero: "4.901",
    data: "29/04/2021",
    ementa: "Altera a Resolução CMN nº 4.883/2020, com ajustes nas condições de financiamento rural e estabelecimento de condições especiais para produtores rurais em recuperação judicial, permitindo renegociação de dívidas no âmbito do SNCR.",
    url: "https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=RESOLU%C3%87%C3%83O%20CMN&numero=4901",
    vigente: true,
    tipo: "recuperacao_judicial",
  },
  {
    numero: "4.106",
    data: "28/06/2012",
    ementa: "Dispõe sobre o crédito rural para produtores rurais, estabelecendo condições especiais para financiamentos de custeio e investimento no âmbito do PRONAF (Programa Nacional de Fortalecimento da Agricultura Familiar).",
    url: "https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o&numero=4106",
    vigente: false,
    tipo: "credito_rural",
  },
];

// ─── Funções de Busca SGS ─────────────────────────────────────────────────────

async function buscarSerie(codigo: number, ultimos: number = 12): Promise<DadoBCB[]> {
  try {
    const url = `${BCB_SGS_BASE}.${codigo}/dados/ultimos/${ultimos}?formato=json`;
    const { data } = await axios.get<DadoBCB[]>(url, {
      timeout: TIMEOUT_MS,
      headers: { Accept: "application/json", "User-Agent": "CalculadoraJurosRural/2.0" },
    });
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`[BCB-SGS] Série ${codigo} indisponível:`, err instanceof Error ? err.message : err);
    return [];
  }
}

// ─── Funções de Busca PTAX ────────────────────────────────────────────────────

async function buscarCotacaoDolar(): Promise<CotacaoDolar | null> {
  // Tenta os últimos 5 dias úteis para garantir que encontra uma cotação
  for (let diasAtras = 0; diasAtras <= 5; diasAtras++) {
    try {
      const data = new Date();
      data.setDate(data.getDate() - diasAtras);
      // Pula fins de semana
      if (data.getDay() === 0 || data.getDay() === 6) continue;

      const mm = String(data.getMonth() + 1).padStart(2, "0");
      const dd = String(data.getDate()).padStart(2, "0");
      const yyyy = data.getFullYear();
      const dataFormatada = `${mm}-${dd}-${yyyy}`;

      const url = `${BCB_PTAX_BASE}/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dataFormatada}'&$top=1&$format=json`;
      const { data: resp } = await axios.get<{ value: CotacaoDolar[] }>(url, {
        timeout: TIMEOUT_MS,
        headers: { Accept: "application/json", "User-Agent": "CalculadoraJurosRural/2.0" },
      });

      if (resp?.value?.length > 0) {
        return resp.value[0];
      }
    } catch (err) {
      console.warn(`[BCB-PTAX] Cotação USD indisponível para o dia:`, err instanceof Error ? err.message : err);
    }
  }
  return null;
}

// ─── Função Principal ─────────────────────────────────────────────────────────

/**
 * Busca todos os dados do BCB relevantes para crédito rural em paralelo
 */
export async function buscarDadosBCB(): Promise<DadosBCBCompleto> {
  const erros: string[] = [];

  const [
    selicDiaria,
    ipcaMensal,
    ipcaAcumulado12m,
    ipcaAcumuladoAno,
    creditoRuralTaxa,
    creditoRuralSaldo,
    creditoPFTaxa,
    cotacaoDolar,
  ] = await Promise.allSettled([
    buscarSerie(SGS.SELIC_DIARIA, 5),
    buscarSerie(SGS.IPCA_MENSAL, 24),
    buscarSerie(SGS.IPCA_ACUMULADO_12M, 1),
    buscarSerie(SGS.IPCA_ACUMULADO_ANO, 1),
    buscarSerie(SGS.CREDITO_RURAL_TAXA_MEDIA, 12),
    buscarSerie(SGS.CREDITO_RURAL_SALDO, 1),
    buscarSerie(SGS.CREDITO_PF_TAXA_MEDIA, 6),
    buscarCotacaoDolar(),
  ]);

  const get = <T>(result: PromiseSettledResult<T>, fallback: T, nome: string): T => {
    if (result.status === "fulfilled") return result.value;
    erros.push(`Falha ao buscar ${nome}: ${result.reason}`);
    return fallback;
  };

  const selicDados = get(selicDiaria, [], "SELIC diária");
  const ipcaDados = get(ipcaMensal, [], "IPCA mensal");
  const ipca12m = get(ipcaAcumulado12m, [], "IPCA 12m");
  const ipcaAno = get(ipcaAcumuladoAno, [], "IPCA ano");
  const crTaxa = get(creditoRuralTaxa, [], "Taxa crédito rural");
  const crSaldo = get(creditoRuralSaldo, [], "Saldo crédito rural");
  const pfTaxa = get(creditoPFTaxa, [], "Taxa crédito PF");
  const ptax = get(cotacaoDolar, null, "Cotação USD");

  // Calcular SELIC anualizada a partir da taxa diária
  let selicAnualizada: number | null = null;
  if (selicDados.length > 0) {
    const ultimaTaxaDiaria = parseFloat(selicDados[selicDados.length - 1].valor);
    // SELIC anualizada = (1 + taxa_diaria/100)^252 - 1
    selicAnualizada = (Math.pow(1 + ultimaTaxaDiaria / 100, 252) - 1) * 100;
  }

  return {
    selic: {
      diaria: selicDados,
      anualizada: selicAnualizada,
    },
    ipca: {
      mensal: ipcaDados,
      acumulado12m: ipca12m[0] ?? null,
      acumuladoAno: ipcaAno[0] ?? null,
    },
    creditoRural: {
      taxaMedia: crTaxa,
      saldo: crSaldo[0] ?? null,
    },
    creditoPF: {
      taxaMedia: pfTaxa,
    },
    cambio: {
      usdCompra: ptax?.cotacaoCompra ?? null,
      usdVenda: ptax?.cotacaoVenda ?? null,
      dataHora: ptax?.dataHoraCotacao ?? null,
    },
    resolucoesCMN: RESOLUCOES_CMN,
    dataConsulta: new Date().toISOString(),
    erros,
  };
}

/**
 * Busca apenas o IPCA dos últimos N meses (para uso no cálculo TCR)
 */
export async function buscarIPCAMensal(meses: number = 24): Promise<DadoBCB[]> {
  return buscarSerie(SGS.IPCA_MENSAL, meses);
}

/**
 * Calcula o FAM (Fator de Atualização Monetária) com base nos dados do IPCA
 * FAM = ∏(1 + IPCAi/100) para cada mês do período
 */
export function calcularFAM(dadosIPCA: DadoBCB[]): number {
  if (dadosIPCA.length === 0) return 1;
  return dadosIPCA.reduce((acc, d) => {
    const taxa = parseFloat(d.valor) / 100;
    return acc * (1 + taxa);
  }, 1);
}

/**
 * Converte data no formato DD/MM/YYYY para Date
 */
export function parseDateBCB(dataStr: string): Date {
  const [dia, mes, ano] = dataStr.split("/").map(Number);
  return new Date(ano, mes - 1, dia ?? 1);
}

/**
 * Filtra os dados do IPCA para um período específico
 */
export function filtrarIPCAPeriodo(
  dadosIPCA: DadoBCB[],
  dataInicio: Date,
  dataFim: Date
): DadoBCB[] {
  return dadosIPCA.filter(d => {
    const data = parseDateBCB(d.data);
    return data >= dataInicio && data <= dataFim;
  });
}
