/**
 * Módulo de Cálculo de Taxa de Custo Real (TCR) em Crédito Rural
 *
 * Fundamentação Legal:
 * - Lei nº 4.829/65 (Sistema Nacional de Crédito Rural)
 * - Decreto-Lei nº 167/67 (Cédula de Crédito Rural)
 * - Decreto nº 22.626/33 (Lei de Usura)
 * - Resolução CMN nº 4.883/2020 e nº 4.913/2021
 * - Manual de Crédito Rural (MCR) do Banco Central
 */

import { getTaxaLimite, type ModalidadeCredito } from "./limitesLegais";

// ─── Constantes Legais ───────────────────────────────────────────────────────

export const LIMITE_JUROS_REMUNERATORIOS_AA = 12.0; // 12% ao ano - Lei de Usura / STJ (revisão judicial padrão)
export const LIMITE_JUROS_MORA_AA = 1.0; // 1% ao ano - Decreto-Lei 167/67, art. 5º
export const LIMITE_MULTA = 2.0; // 2% sobre saldo devedor

// Fatores de Programa definidos pela Resolução CMN nº 5.153/2024
export const FATORES_PROGRAMA: Record<number, number> = {
  2.5: -0.4788636,
  3.0: -0.4180941,
  5.0: -0.1750162,
  8.0: 0.1896008,
  8.5: 0.2503703,
  10.0: 0.4326788,
  12.5: 0.7365263,
  13.5: 0.8580653,
};

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface DadosFinanciamento {
  valorPrincipal: number;
  dataContratacao: Date;
  dataVencimento: Date;
  dataCalculo: Date;
  prazoMeses: number;
  taxaJurosRemuneratorios: number; // % ao ano
  taxaJurosMora: number; // % ao ano
  taxaMulta: number; // % sobre saldo
  tipoTaxa: "pre_fixada" | "pos_fixada";
  modalidade: "custeio" | "investimento" | "comercializacao";
  // Para TCRpós
  ipcaMensal?: number[]; // Array de variações mensais do IPCA (%)
  // Para TCRpré
  taxaJm?: number; // Taxa prefixada Jm (% ao ano)
  fatorInflacaoImplicita?: number; // FII calculado pelo BCB
  fatorPrograma?: number; // FP definido pelo CMN
  fatorAjuste?: number; // FA definido pelo CMN
  // Parcelas pagas (opcional — para análise de excesso)
  numeroParcelas?: number;       // Total de parcelas do contrato
  parcelasPagas?: number;        // Quantas parcelas já foram pagas
  valorParcelaPaga?: number;     // Valor médio efetivamente pago por parcela (R$)
  saldoDevedorBanco?: number;    // Saldo devedor informado pelo banco (R$)
  // Encargos adicionais (opcional — IOF, TAC, TEC)
  iofCobrado?: number;           // IOF efetivamente cobrado (R$)
  tacCobrada?: number;           // TAC — Tarifa de Abertura de Crédito (R$)
  tecCobrada?: number;           // TEC — Tarifa de Emissão de Carnê (R$)
  outrasTagas?: number;          // Outras tarifas/seguros cobrados (R$)
}

// Análise de parcelas pagas vs. limite legal
export interface AnaliseParcelas {
  numeroParcelas: number;          // Total de parcelas
  parcelasPagas: number;           // Parcelas efetivamente pagas
  valorParcelaPaga: number;        // Valor médio pago por parcela (R$)
  totalPagoContrato: number;       // Total pago pelo contrato (R$)
  parcelaLegal: number;            // Valor da parcela pela taxa legal (R$)
  totalLegal: number;              // Total que deveria ter sido pago (R$)
  excessoPago: number;             // Excesso cobrado = totalPago - totalLegal (R$)
  saldoDevedorBanco: number;       // Saldo informado pelo banco (R$)
  saldoDevedorRevisado: number;    // Saldo recalculado pela taxa legal (R$)
  diferencaSaldo: number;          // Saldo banco - saldo revisado (R$)
  percentualExcesso: number;       // Excesso em % do total legal
}

export interface ResultadoCalculo {
  // Dados de entrada
  valorPrincipal: number;
  dataContratacao: Date;
  dataVencimento: Date;
  dataCalculo: Date;
  diasDecorridos: number;
  mesesDecorridos: number;
  // Componentes de cálculo
  fam?: number; // Fator de Atualização Monetária (TCRpós)
  fii?: number; // Fator de Inflação Implícita (TCRpré)
  fp?: number;  // Fator de Programa
  fa?: number;  // Fator de Ajuste
  jm?: number;  // Taxa Jm
  ipcaAcumulado?: number;
  // Resultados
  saldoDevedorAtualizado: number;
  jurosRemuneratorios: number;
  jurosMora: number;
  multa: number;
  totalDevido: number;
  tcrEfetiva: number;      // TCR calculada pela fórmula CMN (metodologia normativa)
  tcrEfetivaTotal?: number; // Custo efetivo total = (totalDevido/principal - 1): inclui mora e multa
  // Conformidade legal
  conformidade: ConformidadeLegal;
  // Memória de cálculo
  memoriaCalculo: MemoriaCalculo;
  // Análise de parcelas pagas (opcional)
  analiseParcelas?: AnaliseParcelas;
  // Análise de encargos adicionais (opcional)
  analiseEncargos?: AnaliseEncargos;
}

export interface ConformidadeLegal {
  limiteRemuneratorios: "conforme" | "nao_conforme" | "atencao";
  limiteMora: "conforme" | "nao_conforme" | "atencao";
  alertas: string[];
  fundamentacao: string[];
}

export interface MemoriaCalculo {
  etapas: EtapaCalculo[];
  fundamentacaoLegal: FundamentacaoLegal;
  jurisprudencia: Jurisprudencia[];
}

export interface EtapaCalculo {
  descricao: string;
  formula: string;
  valores: Record<string, string | number>;
  resultado: string;
}

export interface FundamentacaoLegal {
  normas: string[];
  descricao: string;
}

export interface Jurisprudencia {
  tribunal: string;
  numero: string;
  relator: string;
  data: string;
  ementa: string;
}

// ─── Funções Auxiliares ──────────────────────────────────────────────────────

/**
 * Calcula o número de dias úteis entre duas datas (aproximação: 252 dias úteis/ano)
 */
export function calcularDiasUteis(dataInicio: Date, dataFim: Date): number {
  const diffMs = dataFim.getTime() - dataInicio.getTime();
  const diffDias = diffMs / (1000 * 60 * 60 * 24);
  // Aproximação: 252 dias úteis / 365 dias corridos
  return Math.round(diffDias * (252 / 365));
}

/**
 * Calcula o número de meses **completos** entre duas datas.
 * Considera o dia do mês: se o dia final for anterior ao dia inicial,
 * desconta 1 mês (o mês ainda não completou).
 *
 * Exemplo: 15/01 → 10/07 = 5 meses completos (e não 6).
 */
export function calcularMeses(dataInicio: Date, dataFim: Date): number {
  const anos = dataFim.getFullYear() - dataInicio.getFullYear();
  const meses = dataFim.getMonth() - dataInicio.getMonth();
  // Se o dia final < dia inicial, o mês corrente ainda não se completou
  const ajusteDia = dataFim.getDate() < dataInicio.getDate() ? -1 : 0;
  return anos * 12 + meses + ajusteDia;
}

/**
 * Calcula o número de dias corridos entre duas datas
 */
export function calcularDiasCorridos(dataInicio: Date, dataFim: Date): number {
  const diffMs = dataFim.getTime() - dataInicio.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Converte taxa anual para taxa diária (convenção 252 dias úteis)
 */
export function taxaAnualParaDiaria252(taxaAnual: number): number {
  return Math.pow(1 + taxaAnual / 100, 1 / 252) - 1;
}

/**
 * Converte taxa anual para taxa mensal
 */
export function taxaAnualParaMensal(taxaAnual: number): number {
  return Math.pow(1 + taxaAnual / 100, 1 / 12) - 1;
}

/**
 * Calcula o FAM (Fator de Atualização Monetária) com base no IPCA
 * Conforme Resolução CMN nº 4.883/2020
 */
export function calcularFAM(ipcaMensal: number[]): number {
  if (!ipcaMensal || ipcaMensal.length === 0) return 1;
  let fam = 1;
  for (const ipca of ipcaMensal) {
    fam *= (1 + ipca / 100);
  }
  return fam;
}

/**
 * Calcula o FII (Fator de Inflação Implícita)
 * FII = PRE / Jm (conforme Resolução CMN nº 4.883/2020)
 */
export function calcularFII(pre: number, jm: number): number {
  if (jm === 0) return 1;
  return (1 + pre / 100) / (1 + jm / 100);
}

// ─── Cálculo Principal TCR Pós-Fixada ────────────────────────────────────────

/**
 * Calcula a TCRpós (Taxa de Juros do Crédito Rural pós-fixada)
 * TCRpós = FAM × (1 + FP) × (1 + FA) - 1
 * Conforme Resolução CMN nº 4.883/2020
 */
export function calcularTCRPos(dados: DadosFinanciamento): ResultadoCalculo {
  const { valorPrincipal, dataContratacao, dataVencimento, dataCalculo } = dados;
  const ipcaMensal = dados.ipcaMensal || [];
  const fp = dados.fatorPrograma ?? 0;
  const fa = dados.fatorAjuste ?? 0;

  const diasCorridos = calcularDiasCorridos(dataContratacao, dataCalculo);
  const mesesDecorridos = calcularMeses(dataContratacao, dataCalculo);
  const diasUteisDecorridos = calcularDiasUteis(dataContratacao, dataCalculo);

  // Cálculo do FAM
  const fam = calcularFAM(ipcaMensal);
  const ipcaAcumulado = (fam - 1) * 100;

  // TCRpós = FAM × (1 + FP) × (1 + FA) - 1
  const tcrPos = fam * (1 + fp) * (1 + fa) - 1;
  const tcrPosAA = (Math.pow(1 + tcrPos, 12 / Math.max(mesesDecorridos, 1)) - 1) * 100;

  // Saldo devedor atualizado
  const saldoDevedorAtualizado = valorPrincipal * fam;

  // Juros remuneratórios sobre o saldo atualizado
  const taxaRemMensal = taxaAnualParaMensal(dados.taxaJurosRemuneratorios);
  const jurosRemuneratorios = saldoDevedorAtualizado * (Math.pow(1 + taxaRemMensal, Math.max(mesesDecorridos, 0)) - 1);

  // Juros de mora (se houver inadimplência) — regime composto (capitalização diária)
  // Fórmula: JM = SD × [(1 + i_diária)^dias - 1]
  // onde i_diária = (1 + taxa_mora_aa)^(1/365) - 1
  // Fundamentação: STJ adota regime composto para mora em contratos bancários/rurais
  const diasInadimplencia = calcularDiasCorridos(dataVencimento, dataCalculo);
  let jurosMora = 0;
  if (diasInadimplencia > 0) {
    const taxaMoraDiaria = Math.pow(1 + dados.taxaJurosMora / 100, 1 / 365) - 1;
    jurosMora = saldoDevedorAtualizado * (Math.pow(1 + taxaMoraDiaria, diasInadimplencia) - 1);
  }

  // Multa (se houver inadimplência)
  let multa = 0;
  if (diasInadimplencia > 0 && dados.taxaMulta > 0) {
    multa = saldoDevedorAtualizado * (dados.taxaMulta / 100);
  }

  const totalDevido = saldoDevedorAtualizado + jurosRemuneratorios + jurosMora + multa;
  // tcrEfetivaTotal: mede o custo efetivo total sobre o principal original
  const tcrEfetivaTotal = ((totalDevido / valorPrincipal) - 1) * 100;

  // Análise de conformidade — usa o limite correto pela modalidade do contrato
  const conformidade = analisarConformidade(
    dados.taxaJurosRemuneratorios,
    dados.taxaJurosMora,
    tcrPosAA,
    dados.modalidade
  );

  // Memória de cálculo
  const memoriaCalculo = gerarMemoriaCalculoPos({
    valorPrincipal, fam, fp, fa, ipcaAcumulado, ipcaMensal,
    saldoDevedorAtualizado, jurosRemuneratorios, jurosMora, multa,
    totalDevido, tcrPos, tcrPosAA, diasCorridos, mesesDecorridos,
    diasInadimplencia, taxaRemMensal: dados.taxaJurosRemuneratorios,
    taxaMora: dados.taxaJurosMora, taxaMulta: dados.taxaMulta,
  });

  return {
    valorPrincipal,
    dataContratacao,
    dataVencimento,
    dataCalculo,
    diasDecorridos: diasCorridos,
    mesesDecorridos,
    fam,
    fp,
    fa,
    ipcaAcumulado,
    saldoDevedorAtualizado,
    jurosRemuneratorios,
    jurosMora,
    multa,
    totalDevido,
    tcrEfetiva: tcrPosAA,        // TCR conforme metodologia CMN (sem JR isolado)
    tcrEfetivaTotal,              // Custo efetivo total sobre o principal
    conformidade,
    memoriaCalculo,
  };
}

// ─── Cálculo Principal TCR Pré-Fixada ────────────────────────────────────────

/**
 * Calcula a TCRpré (Taxa de Juros do Crédito Rural prefixada)
 * TCRpré = Jm × FII × (1 + FP) × (1 + FA) - 1
 * Conforme Resolução CMN nº 4.913/2021
 */
export function calcularTCRPre(dados: DadosFinanciamento): ResultadoCalculo {
  const { valorPrincipal, dataContratacao, dataVencimento, dataCalculo } = dados;
  const jm = dados.taxaJm ?? dados.taxaJurosRemuneratorios;
  const fii = dados.fatorInflacaoImplicita ?? 1;
  const fp = dados.fatorPrograma ?? 0;
  const fa = dados.fatorAjuste ?? 0;

  const diasCorridos = calcularDiasCorridos(dataContratacao, dataCalculo);
  const mesesDecorridos = calcularMeses(dataContratacao, dataCalculo);

  // TCRpré = Jm × FII × (1 + FP) × (1 + FA) - 1
  const tcrPre = (1 + jm / 100) * fii * (1 + fp) * (1 + fa) - 1;
  const tcrPreAA = tcrPre * 100; // Já é anual

  // Saldo devedor com taxa prefixada
  const taxaMensalPre = taxaAnualParaMensal(tcrPreAA);
  const saldoDevedorAtualizado = valorPrincipal * Math.pow(1 + taxaMensalPre, Math.max(mesesDecorridos, 0));

  // Juros remuneratórios
  const jurosRemuneratorios = saldoDevedorAtualizado - valorPrincipal;

  // Juros de mora — regime composto (capitalização diária) — mesmo padrão do TCRpós
  const diasInadimplencia = calcularDiasCorridos(dataVencimento, dataCalculo);
  let jurosMora = 0;
  if (diasInadimplencia > 0) {
    const taxaMoraDiaria = Math.pow(1 + dados.taxaJurosMora / 100, 1 / 365) - 1;
    jurosMora = saldoDevedorAtualizado * (Math.pow(1 + taxaMoraDiaria, diasInadimplencia) - 1);
  }

  // Multa
  let multa = 0;
  if (diasInadimplencia > 0 && dados.taxaMulta > 0) {
    multa = saldoDevedorAtualizado * (dados.taxaMulta / 100);
  }

  const totalDevido = saldoDevedorAtualizado + jurosMora + multa;
  const tcrEfetivaTotal = ((totalDevido / valorPrincipal) - 1) * 100;

  // Análise de conformidade — usa o limite correto pela modalidade do contrato
  const conformidade = analisarConformidade(
    dados.taxaJurosRemuneratorios,
    dados.taxaJurosMora,
    tcrPreAA,
    dados.modalidade
  );

  // Memória de cálculo
  const memoriaCalculo = gerarMemoriaCalculoPre({
    valorPrincipal, jm, fii, fp, fa, tcrPre, tcrPreAA,
    saldoDevedorAtualizado, jurosRemuneratorios, jurosMora, multa,
    totalDevido, diasCorridos, mesesDecorridos, diasInadimplencia,
    taxaRemAA: dados.taxaJurosRemuneratorios,
    taxaMora: dados.taxaJurosMora, taxaMulta: dados.taxaMulta,
  });

  return {
    valorPrincipal,
    dataContratacao,
    dataVencimento,
    dataCalculo,
    diasDecorridos: diasCorridos,
    mesesDecorridos,
    fii,
    fp,
    fa,
    jm,
    saldoDevedorAtualizado,
    jurosRemuneratorios,
    jurosMora,
    multa,
    totalDevido,
    tcrEfetiva: tcrPreAA,         // TCR conforme metodologia CMN
    tcrEfetivaTotal,               // Custo efetivo total sobre o principal
    conformidade,
    memoriaCalculo,
  };
}

// ─── Análise de Conformidade Legal ───────────────────────────────────────────

/**
 * Analisa a conformidade legal de um contrato de crédito rural.
 *
 * @param taxaRemuneratoriaAA  Taxa de juros remuneratórios contratada (% a.a.)
 * @param taxaMoraAA           Taxa de juros de mora contratada (% a.a.)
 * @param tcrEfetivaAA         TCR efetiva calculada (% a.a.) — para referência
 * @param modalidade           Modalidade do crédito (opcional) — determina o limite correto
 *                             Se omitida, usa 12% a.a. (padrão Lei de Usura / STJ)
 */
export function analisarConformidade(
  taxaRemuneratoriaAA: number,
  taxaMoraAA: number,
  tcrEfetivaAA: number,
  modalidade?: string
): ConformidadeLegal {
  const alertas: string[] = [];
  const fundamentacao: string[] = [];

  let limiteRemuneratorios: "conforme" | "nao_conforme" | "atencao" = "conforme";
  let limiteMora: "conforme" | "nao_conforme" | "atencao" = "conforme";

  // ── Determina o limite legal correto pela modalidade ────────────────────────
  // MCR 7-1 (Res. CMN 5.234): custeio/comercialização/industrialização = 14% a.a.
  // MCR 7-6 (Pronaf custeio) = 5% a.a., Pronaf B = 0,5% a.a.
  // Recursos livres / sem modalidade: STJ aplica 12% a.a. (Decreto 22.626/33)
  let limiteRemunAA = LIMITE_JUROS_REMUNERATORIOS_AA; // padrão: 12% a.a.
  let fonteLimite = `${limiteRemunAA}% a.a. (Decreto nº 22.626/33 — Lei de Usura, aplicado pelo STJ como parâmetro de abusividade)`;

  if (modalidade) {
    try {
      const { taxa, limite } = getTaxaLimite(modalidade as ModalidadeCredito);
      limiteRemunAA = taxa;
      fonteLimite = `${taxa.toFixed(1)}% a.a. (${limite.fundamentacao.mcrSecao} — ${limite.fundamentacao.resolucao})`;
    } catch {
      // Modalidade não mapeada: mantém o padrão de 12%
    }
  }

  // ── Verificação dos juros remuneratórios ────────────────────────────────────
  if (taxaRemuneratoriaAA > limiteRemunAA) {
    limiteRemuneratorios = "nao_conforme";
    alertas.push(
      `ATENÇÃO: Taxa de juros remuneratórios de ${taxaRemuneratoriaAA.toFixed(2)}% a.a. EXCEDE o limite legal de ${fonteLimite}.`
    );
    if (limiteRemunAA === LIMITE_JUROS_REMUNERATORIOS_AA) {
      fundamentacao.push(
        "Decreto nº 22.626/33 (Lei de Usura) - Art. 1º: limite de 12% ao ano para juros remuneratórios na ausência de autorização do CMN."
      );
      fundamentacao.push(
        "STJ - Súmula e jurisprudência consolidada: ausência de deliberação do CMN implica aplicação do limite de 12% ao ano para cédulas de crédito rural."
      );
    } else {
      fundamentacao.push(`Limite legal estabelecido pelo ${fonteLimite}.`);
      fundamentacao.push(
        "A cobrança acima deste limite é ilegal e passível de revisão judicial com devolução em dobro (CDC, art. 42, parágrafo único)."
      );
    }
  } else if (taxaRemuneratoriaAA > limiteRemunAA * 0.9) {
    limiteRemuneratorios = "atencao";
    alertas.push(
      `ATENÇÃO: Taxa de juros remuneratórios de ${taxaRemuneratoriaAA.toFixed(2)}% a.a. está próxima do limite legal de ${fonteLimite}.`
    );
  } else {
    fundamentacao.push(
      `Taxa de juros remuneratórios de ${taxaRemuneratoriaAA.toFixed(2)}% a.a. está em conformidade com o limite de ${fonteLimite}.`
    );
  }

  // ── Verificação dos juros de mora ───────────────────────────────────────────
  if (taxaMoraAA > LIMITE_JUROS_MORA_AA) {
    limiteMora = "nao_conforme";
    alertas.push(
      `ATENÇÃO: Taxa de juros de mora de ${taxaMoraAA.toFixed(2)}% a.a. EXCEDE o limite legal de ${LIMITE_JUROS_MORA_AA}% a.a. estabelecido pelo Decreto-Lei nº 167/67, art. 5º.`
    );
    fundamentacao.push(
      "Decreto-Lei nº 167/67 - Art. 5º: juros de mora em cédulas de crédito rural limitados a 1% ao ano."
    );
    fundamentacao.push(
      "STJ - Jurisprudência dominante: juros moratórios nas cédulas de crédito rural não podem ultrapassar 1% ao ano."
    );
  } else {
    fundamentacao.push(
      `Taxa de juros de mora de ${taxaMoraAA.toFixed(2)}% a.a. está em conformidade com o limite de ${LIMITE_JUROS_MORA_AA}% a.a. (Decreto-Lei nº 167/67, art. 5º).`
    );
  }

  return {
    limiteRemuneratorios,
    limiteMora,
    alertas,
    fundamentacao,
  };
}

// ─── Geração de Memória de Cálculo ───────────────────────────────────────────

function gerarMemoriaCalculoPos(params: {
  valorPrincipal: number;
  fam: number;
  fp: number;
  fa: number;
  ipcaAcumulado: number;
  ipcaMensal: number[];
  saldoDevedorAtualizado: number;
  jurosRemuneratorios: number;
  jurosMora: number;
  multa: number;
  totalDevido: number;
  tcrPos: number;
  tcrPosAA: number;
  diasCorridos: number;
  mesesDecorridos: number;
  diasInadimplencia: number;
  taxaRemMensal: number;
  taxaMora: number;
  taxaMulta: number;
}): MemoriaCalculo {
  const fmt = (n: number, d = 2) => n.toFixed(d);
  const fmtR = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const etapas: EtapaCalculo[] = [
    {
      descricao: "1. Cálculo do FAM (Fator de Atualização Monetária)",
      formula: "FAM = ∏(1 + IPCAm/100) para cada mês m",
      valores: {
        "IPCA Acumulado": `${fmt(params.ipcaAcumulado, 4)}%`,
        "Número de meses": params.ipcaMensal.length,
        "Variações mensais IPCA": params.ipcaMensal.map(v => `${v.toFixed(4)}%`).join(", ") || "Não informado",
      },
      resultado: `FAM = ${fmt(params.fam, 6)}`,
    },
    {
      descricao: "2. Cálculo da TCRpós",
      formula: "TCRpós = FAM × (1 + FP) × (1 + FA) - 1",
      valores: {
        "FAM": fmt(params.fam, 6),
        "FP (Fator de Programa)": fmt(params.fp, 7),
        "FA (Fator de Ajuste)": fmt(params.fa, 7),
      },
      resultado: `TCRpós = ${fmt(params.tcrPosAA, 4)}% a.a.`,
    },
    {
      descricao: "3. Atualização do Saldo Devedor",
      formula: "SD_atualizado = Principal × FAM",
      valores: {
        "Principal": fmtR(params.valorPrincipal),
        "FAM": fmt(params.fam, 6),
        "Período": `${params.mesesDecorridos} meses (${params.diasCorridos} dias corridos)`,
      },
      resultado: `Saldo Devedor Atualizado = ${fmtR(params.saldoDevedorAtualizado)}`,
    },
    {
      descricao: "4. Cálculo dos Juros Remuneratórios",
      formula: "JR = SD_atualizado × [(1 + i_mensal)^n - 1]",
      valores: {
        "Saldo Devedor Atualizado": fmtR(params.saldoDevedorAtualizado),
        "Taxa Remuneratória": `${fmt(params.taxaRemMensal, 4)}% a.a.`,
        "Meses": params.mesesDecorridos,
      },
      resultado: `Juros Remuneratórios = ${fmtR(params.jurosRemuneratorios)}`,
    },
  ];

  if (params.diasInadimplencia > 0) {
    etapas.push({
      descricao: "5. Cálculo dos Juros de Mora (Inadimplência)",
      formula: "JM = SD_atualizado × (taxa_mora/365) × dias_inadimplência",
      valores: {
        "Saldo Devedor Atualizado": fmtR(params.saldoDevedorAtualizado),
        "Taxa de Mora": `${fmt(params.taxaMora, 4)}% a.a. (limite legal: 1% a.a. - DL 167/67, art. 5º)`,
        "Dias de Inadimplência": params.diasInadimplencia,
      },
      resultado: `Juros de Mora = ${fmtR(params.jurosMora)}`,
    });

    if (params.taxaMulta > 0) {
      etapas.push({
        descricao: "6. Cálculo da Multa Contratual",
        formula: "Multa = SD_atualizado × taxa_multa",
        valores: {
          "Saldo Devedor Atualizado": fmtR(params.saldoDevedorAtualizado),
          "Taxa de Multa": `${fmt(params.taxaMulta, 2)}%`,
        },
        resultado: `Multa = ${fmtR(params.multa)}`,
      });
    }
  }

  etapas.push({
    descricao: "Consolidação - Total Devido",
    formula: "Total = SD_atualizado + JR + JM + Multa",
    valores: {
      "Saldo Devedor Atualizado": fmtR(params.saldoDevedorAtualizado),
      "Juros Remuneratórios": fmtR(params.jurosRemuneratorios),
      "Juros de Mora": fmtR(params.jurosMora),
      "Multa": fmtR(params.multa),
    },
    resultado: `TOTAL DEVIDO = ${fmtR(params.totalDevido)}`,
  });

  return {
    etapas,
    fundamentacaoLegal: {
      normas: [
        "Lei nº 4.829/65 - Sistema Nacional de Crédito Rural",
        "Decreto-Lei nº 167/67 - Cédula de Crédito Rural (art. 5º: juros de mora máx. 1% a.a.)",
        "Decreto nº 22.626/33 - Lei de Usura (juros remuneratórios máx. 12% a.a.)",
        "Resolução CMN nº 4.883/2020 - Consolidação normas MCR",
        "Resolução CMN nº 4.913/2021 - Metodologia de cálculo TCR",
        "Manual de Crédito Rural (MCR) - Banco Central do Brasil",
      ],
      descricao:
        "O cálculo da TCR pós-fixada foi realizado conforme a metodologia estabelecida pela Resolução CMN nº 4.883/2020, utilizando o Fator de Atualização Monetária (FAM) baseado na variação do IPCA, o Fator de Programa (FP) e o Fator de Ajuste (FA) definidos pelo CMN. Os limites legais de juros remuneratórios (12% a.a.) e de mora (1% a.a.) foram verificados conforme a jurisprudência consolidada do STJ.",
    },
    jurisprudencia: getJurisprudenciaRelevante(),
  };
}

function gerarMemoriaCalculoPre(params: {
  valorPrincipal: number;
  jm: number;
  fii: number;
  fp: number;
  fa: number;
  tcrPre: number;
  tcrPreAA: number;
  saldoDevedorAtualizado: number;
  jurosRemuneratorios: number;
  jurosMora: number;
  multa: number;
  totalDevido: number;
  diasCorridos: number;
  mesesDecorridos: number;
  diasInadimplencia: number;
  taxaRemAA: number;
  taxaMora: number;
  taxaMulta: number;
}): MemoriaCalculo {
  const fmt = (n: number, d = 2) => n.toFixed(d);
  const fmtR = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const etapas: EtapaCalculo[] = [
    {
      descricao: "1. Cálculo da TCRpré",
      formula: "TCRpré = (1 + Jm/100) × FII × (1 + FP) × (1 + FA) - 1",
      valores: {
        "Jm (Taxa prefixada maio)": `${fmt(params.jm, 4)}% a.a.`,
        "FII (Fator de Inflação Implícita)": fmt(params.fii, 7),
        "FP (Fator de Programa)": fmt(params.fp, 7),
        "FA (Fator de Ajuste)": fmt(params.fa, 7),
      },
      resultado: `TCRpré = ${fmt(params.tcrPreAA, 4)}% a.a.`,
    },
    {
      descricao: "2. Atualização do Saldo Devedor (Prefixado)",
      formula: "SD = Principal × (1 + i_mensal)^n",
      valores: {
        "Principal": fmtR(params.valorPrincipal),
        "Taxa Mensal Equivalente": `${fmt(taxaAnualParaMensal(params.tcrPreAA) * 100, 6)}% a.m.`,
        "Meses": params.mesesDecorridos,
        "Período": `${params.diasCorridos} dias corridos`,
      },
      resultado: `Saldo Devedor Atualizado = ${fmtR(params.saldoDevedorAtualizado)}`,
    },
    {
      descricao: "3. Juros Remuneratórios Incorporados",
      formula: "JR = SD_atualizado - Principal",
      valores: {
        "Saldo Devedor Atualizado": fmtR(params.saldoDevedorAtualizado),
        "Principal Original": fmtR(params.valorPrincipal),
      },
      resultado: `Juros Remuneratórios = ${fmtR(params.jurosRemuneratorios)}`,
    },
  ];

  if (params.diasInadimplencia > 0) {
    etapas.push({
      descricao: "4. Cálculo dos Juros de Mora (Inadimplência)",
      formula: "JM = SD_atualizado × (taxa_mora/365) × dias_inadimplência",
      valores: {
        "Saldo Devedor Atualizado": fmtR(params.saldoDevedorAtualizado),
        "Taxa de Mora": `${fmt(params.taxaMora, 4)}% a.a. (limite legal: 1% a.a. - DL 167/67, art. 5º)`,
        "Dias de Inadimplência": params.diasInadimplencia,
      },
      resultado: `Juros de Mora = ${fmtR(params.jurosMora)}`,
    });
  }

  etapas.push({
    descricao: "Consolidação - Total Devido",
    formula: "Total = SD_atualizado + JM + Multa",
    valores: {
      "Saldo Devedor Atualizado": fmtR(params.saldoDevedorAtualizado),
      "Juros de Mora": fmtR(params.jurosMora),
      "Multa": fmtR(params.multa),
    },
    resultado: `TOTAL DEVIDO = ${fmtR(params.totalDevido)}`,
  });

  return {
    etapas,
    fundamentacaoLegal: {
      normas: [
        "Lei nº 4.829/65 - Sistema Nacional de Crédito Rural",
        "Decreto-Lei nº 167/67 - Cédula de Crédito Rural",
        "Decreto nº 22.626/33 - Lei de Usura",
        "Resolução CMN nº 4.913/2021 - Metodologia TCRpré",
        "Resolução BCB nº 241/2022 - Procedimento cálculo taxa PRE",
        "Manual de Crédito Rural (MCR) - Banco Central do Brasil",
      ],
      descricao:
        "O cálculo da TCR prefixada foi realizado conforme a metodologia estabelecida pela Resolução CMN nº 4.913/2021, utilizando a taxa Jm (prefixada calculada em maio), o Fator de Inflação Implícita (FII), o Fator de Programa (FP) e o Fator de Ajuste (FA). Os componentes FP, FA, Jm e FII são mantidos constantes durante toda a vigência da operação, conforme determinação normativa.",
    },
    jurisprudencia: getJurisprudenciaRelevante(),
  };
}

export function getJurisprudenciaRelevante(): Jurisprudencia[] {
  return [
    {
      tribunal: "STJ - Superior Tribunal de Justiça",
      numero: "REsp (Jurisprudência Consolidada)",
      relator: "Diversas Turmas",
      data: "Jurisprudência Dominante",
      ementa:
        "CÉDULA DE CRÉDITO RURAL. JUROS REMUNERATÓRIOS. LIMITE DE 12% AO ANO. AUSÊNCIA DE DELIBERAÇÃO DO CMN. APLICAÇÃO DA LEI DE USURA. Consoante reiterada jurisprudência, por ausência de deliberação do Conselho Monetário Nacional, a taxa de juros remuneratórios nas cédulas de crédito rural, industrial e comercial deve respeitar o limite de doze por cento (12%) ao ano, conforme Decreto nº 22.626/33.",
    },
    {
      tribunal: "STJ - Superior Tribunal de Justiça",
      numero: "REsp (Jurisprudência Dominante)",
      relator: "Diversas Turmas",
      data: "Jurisprudência Consolidada",
      ementa:
        "CÉDULA DE CRÉDITO RURAL. JUROS MORATÓRIOS. LIMITE DE 1% AO ANO. DECRETO-LEI Nº 167/67. Os juros moratórios nas cédulas de crédito rural não podem ultrapassar 1% (um por cento) ao ano, conforme art. 5º do Decreto-Lei nº 167/67. A cobrança de juros moratórios de 1% ao mês é absolutamente inadmissível, tendo em vista que a legislação em vigor limita tal taxa ao patamar de 1% ao ano.",
    },
    {
      tribunal: "TJDFT - Tribunal de Justiça do Distrito Federal e Territórios",
      numero: "Acórdão 1213739 - 07311809120188070001",
      relator: "Des. ARNOLDO CAMANHO DE ASSIS",
      data: "06/11/2019 - 4ª Turma Cível - DJE: 20/11/2019",
      ementa:
        "CÉDULA DE CRÉDITO RURAL. JUROS REMUNERATÓRIOS. LIMITAÇÃO A 12% AO ANO. Consoante reiterada jurisprudência, por ausência de deliberação do Conselho Monetário Nacional, a taxa de juros remuneratórios nas cédulas de crédito rural, industrial e comercial deve respeitar o limite de doze por cento (12%) ao ano. As notas de crédito rural estão submetidas a regramento próprio, consubstanciado na Lei nº 6.840/80 e no Decreto-Lei nº 413/69, que conferem ao CMN o dever de fixar a taxa de juros. Na hipótese de omissão do CMN, aplica-se a limitação prevista no Decreto nº 22.626/33 (Lei de Usura).",
    },
    {
      tribunal: "TJPR - Tribunal de Justiça do Paraná",
      numero: "0018932-49.2023.8.16.0021",
      relator: "Câmara Cível",
      data: "10/05/2025",
      ementa:
        "CRÉDITO RURAL. JUROS REMUNERATÓRIOS E MORATÓRIOS. LIMITES LEGAIS. Nos contratos de crédito rural, a limitação dos juros remuneratórios deve ser fixada em 12% ao ano e os juros moratórios em 1% ao ano, conforme legislação específica aplicável às cédulas de crédito rural.",
    },
  ];
}

// ─── Análise de Parcelas Pagas vs. Limite Legal ──────────────────────────────

/**
 * Calcula o comparativo entre o que foi pago pelo contrato e o que deveria
 * ter sido pago pela taxa legal máxima (12% a.a. — Decreto nº 22.626/33).
 *
 * Usa o sistema Price (prestações iguais) como referência, que é o mais
 * comum em contratos de crédito rural.
 */
// Linha da tabela de amortização parcela a parcela
export interface LinhaTabelaAmortizacao {
  parcela: number;              // Número da parcela
  saldoInicial: number;         // Saldo devedor no início do período
  jurosDevidos: number;         // Juros do período = saldo_inicial × i
  amortizacao: number;          // Amortização = PMT - juros_devidos
  prestacao: number;            // PMT (prestação total)
  saldoFinal: number;           // Saldo devedor após pagamento
  jurosDevidos_legal: number;   // Juros pelo limite legal
  amortizacao_legal: number;    // Amortização pelo limite legal
  prestacao_legal: number;      // PMT pelo limite legal
  saldoFinal_legal: number;     // Saldo devedor legal após pagamento
  excesso: number;              // Excesso cobrado nesta parcela
}

export function calcularAnaliseParcelas(
  valorPrincipal: number,
  taxaContratoAA: number,
  numeroParcelas: number,
  parcelasPagas: number,
  valorParcelaPaga: number,
  saldoDevedorBanco: number,
  periodicidade: "mensal" | "anual" = "anual"
): AnaliseParcelas & { tabelaAmortizacao: LinhaTabelaAmortizacao[]; memoriaCalculo: string } {
  const TAXA_LEGAL_AA = LIMITE_JUROS_REMUNERATORIOS_AA; // 12% a.a.
  const fmtR = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ── 1. Conversão de taxas anuais para a periodicidade do contrato ──────────
  // Fórmula: i_periodo = (1 + i_aa)^(1/n) - 1
  //   Mensal: n = 12  →  i_mensal = (1 + i_aa)^(1/12) - 1
  //   Anual:  n = 1   →  i_anual  = i_aa (sem conversão)
  const taxaContratoPeriodo = periodicidade === "mensal"
    ? Math.pow(1 + taxaContratoAA / 100, 1 / 12) - 1
    : taxaContratoAA / 100;

  const taxaLegalPeriodo = periodicidade === "mensal"
    ? Math.pow(1 + TAXA_LEGAL_AA / 100, 1 / 12) - 1
    : TAXA_LEGAL_AA / 100;

  // ── 2. Cálculo da Prestação Price (PMT) ─────────────────────────────────────
  // Fórmula: PMT = PV × i / (1 - (1 + i)^-n)
  //   PV = valor principal
  //   i  = taxa do período
  //   n  = número total de parcelas
  const calcPMT = (pv: number, i: number, n: number): number => {
    if (i === 0) return pv / n;
    return (pv * i) / (1 - Math.pow(1 + i, -n));
  };

  const pmtContrato = calcPMT(valorPrincipal, taxaContratoPeriodo, numeroParcelas);
  const pmtLegal = calcPMT(valorPrincipal, taxaLegalPeriodo, numeroParcelas);

  // ── 3. Tabela de amortização parcela a parcela (Price) ───────────────────────
  // Para cada parcela k:
  //   Juros_k       = SD_{k-1} × i
  //   Amortização_k = PMT - Juros_k
  //   SD_k          = SD_{k-1} - Amortização_k
  const tabelaAmortizacao: LinhaTabelaAmortizacao[] = [];
  let sdContrato = valorPrincipal;
  let sdLegal = valorPrincipal;

  for (let k = 1; k <= Math.max(numeroParcelas, parcelasPagas); k++) {
    // Contrato
    const juros_c = sdContrato * taxaContratoPeriodo;
    const amort_c = pmtContrato - juros_c;
    const sdFinal_c = Math.max(0, sdContrato - amort_c);

    // Taxa legal
    const juros_l = sdLegal * taxaLegalPeriodo;
    const amort_l = pmtLegal - juros_l;
    const sdFinal_l = Math.max(0, sdLegal - amort_l);

    // Excesso nesta parcela = PMT contrato - PMT legal
    // (usamos o valor informado pelo usuário como PMT real para as parcelas pagas)
    const pmtReal = k <= parcelasPagas ? valorParcelaPaga : pmtContrato;
    const excesso = k <= parcelasPagas ? Math.max(0, pmtReal - pmtLegal) : 0;

    tabelaAmortizacao.push({
      parcela: k,
      saldoInicial: sdContrato,
      jurosDevidos: juros_c,
      amortizacao: amort_c,
      prestacao: pmtReal,
      saldoFinal: sdFinal_c,
      jurosDevidos_legal: juros_l,
      amortizacao_legal: amort_l,
      prestacao_legal: pmtLegal,
      saldoFinal_legal: sdFinal_l,
      excesso,
    });

    sdContrato = sdFinal_c;
    sdLegal = sdFinal_l;
  }

  // ── 4. Totais das parcelas pagas ─────────────────────────────────────────────
  const parcelasAnalisadas = tabelaAmortizacao.slice(0, parcelasPagas);
  const totalPagoContrato = parcelasAnalisadas.reduce((s, p) => s + p.prestacao, 0);
  const totalLegal = parcelasAnalisadas.reduce((s, p) => s + p.prestacao_legal, 0);
  const excessoPago = Math.max(0, totalPagoContrato - totalLegal);
  const percentualExcesso = totalLegal > 0 ? (excessoPago / totalLegal) * 100 : 0;

  // ── 5. Saldo devedor revisado após N parcelas (pela taxa legal) ──────────────
  // Calculado diretamente da tabela de amortização (mais preciso que a fórmula fechada)
  const saldoDevedorRevisado = parcelasPagas > 0
    ? tabelaAmortizacao[parcelasPagas - 1].saldoFinal_legal
    : valorPrincipal;

  // Preserva o sinal: valor positivo = banco cobra a mais; negativo = banco deve ao produtor
  const diferencaSaldo = saldoDevedorBanco - saldoDevedorRevisado;

  // ── 6. Memória de cálculo detalhada ─────────────────────────────────────────
  const memoriaCalculo = [
    `═══════════════════════════════════════════════════════════════`,
    `ANÁLISE DE PARCELAS PAGAS — SISTEMA PRICE`,
    `Fundamento: Decreto nº 22.626/33 (Lei de Usura) · DL 167/67 · MCR 7-1`,
    `═══════════════════════════════════════════════════════════════`,
    ``,
    `1. DADOS DO CONTRATO`,
    `   Valor Principal (PV)   : ${fmtR(valorPrincipal)}`,
    `   Taxa Contratada        : ${taxaContratoAA.toFixed(4)}% a.a.`,
    `   Taxa Legal Máxima      : ${TAXA_LEGAL_AA.toFixed(4)}% a.a. (Decreto nº 22.626/33)`,
    `   Nº Total de Parcelas   : ${numeroParcelas}`,
    `   Periodicidade          : ${periodicidade === "mensal" ? "Mensal" : "Anual (safra a safra)"}`,
    ``,
    `2. CONVERSÃO DE TAXAS`,
    `   Fórmula: i_periodo = (1 + i_aa)^(1/${periodicidade === "mensal" ? 12 : 1}) - 1`,
    `   Taxa Contratada/${periodicidade === "mensal" ? "mês" : "ano"}: ${(taxaContratoPeriodo * 100).toFixed(6)}%`,
    `   Taxa Legal/${periodicidade === "mensal" ? "mês" : "ano"}     : ${(taxaLegalPeriodo * 100).toFixed(6)}%`,
    ``,
    `3. CÁLCULO DA PRESTAÇÃO (SISTEMA PRICE)`,
    `   Fórmula: PMT = PV × i / (1 - (1 + i)^-n)`,
    `   PMT Contrato           : ${fmtR(pmtContrato)}`,
    `   PMT Legal (12% a.a.)   : ${fmtR(pmtLegal)}`,
    `   Valor Informado (pago) : ${fmtR(valorParcelaPaga)}`,
    `   Diferença por parcela  : ${fmtR(Math.max(0, valorParcelaPaga - pmtLegal))}`,
    ``,
    `4. RESULTADO DAS ${parcelasPagas} PARCELAS PAGAS`,
    `   Total pago (contrato)  : ${fmtR(totalPagoContrato)}`,
    `   Total legal (12% a.a.) : ${fmtR(totalLegal)}`,
    `   EXCESSO COBRADO        : ${fmtR(excessoPago)} (${percentualExcesso.toFixed(2)}% acima do limite legal)`,
    ``,
    `5. SALDO DEVEDOR REVISADO`,
    `   Saldo informado banco  : ${fmtR(saldoDevedorBanco)}`,
    `   Saldo revisado (legal) : ${fmtR(saldoDevedorRevisado)}`,
    `   DIFERENÇA NO SALDO     : ${fmtR(diferencaSaldo)}`,
    ``,
    `CONCLUSÃO: O contrato cobrou ${fmtR(excessoPago)} a mais do que o permitido`,
    `pela legislação vigente. O saldo devedor está inflado em ${fmtR(diferencaSaldo)}.`,
    `Fundamento: Decreto nº 22.626/33, art. 1º; DL 167/67, art. 5º; STJ (jurisprudência consolidada).`,
  ].join("\n");

  return {
    numeroParcelas,
    parcelasPagas,
    valorParcelaPaga,
    totalPagoContrato,
    parcelaLegal: pmtLegal,
    totalLegal,
    excessoPago,
    saldoDevedorBanco,
    saldoDevedorRevisado,
    diferencaSaldo,
    percentualExcesso,
    tabelaAmortizacao,
    memoriaCalculo,
  };
}

// ─── Interface: Análise de Encargos Adicionais (IOF, TAC, TEC) ───────────────

export interface ItemEncargo {
  nome: string;                  // Nome do encargo
  valorCobrado: number;          // Valor efetivamente cobrado (R$)
  valorLegal: number;            // Valor máximo permitido por lei (R$), 0 se proibido
  excesso: number;               // Excesso = cobrado - legal
  status: "legal" | "abusivo" | "proibido";
  fundamentacao: string;         // Base legal para o alerta
  sumula?: string;               // Súmula aplicável (ex: "STJ Súmula 566")
}

export interface AnaliseEncargos {
  iof?: ItemEncargo;
  tac?: ItemEncargo;
  tec?: ItemEncargo;
  outrasTagas?: ItemEncargo;
  totalEncargos: number;         // Soma de todos os encargos cobrados
  totalExcesso: number;          // Soma dos excessos
  cetNominal: number;            // CET = taxa nominal + encargos/principal (% a.a.)
  cetEfetivo: number;            // CET efetivo considerando prazo real (% a.a.)
  alertas: string[];             // Alertas jurídicos
  memoriaCalculo: string;        // Texto explicativo passo a passo
}

/**
 * Calcula a análise de encargos adicionais (IOF, TAC, TEC) e o CET
 *
 * Fundamentação:
 * - IOF: Lei 8.894/94, art. 1º — alíquota máxima 0,0082% a.d. + 0,38% adicional
 * - TAC: STJ Súmula 566 — proibida cobrança de tarifa de abertura de crédito
 * - TEC: STJ Súmula 566 — proibida cobrança de tarifa de emissão de carnê
 * - CET: Resolução CMN 3.517/2007 — obrigatória divulgação do Custo Efetivo Total
 */
export function calcularAnaliseEncargos(
  valorPrincipal: number,
  taxaJurosAA: number,
  prazoMeses: number,
  iofCobrado?: number,
  tacCobrada?: number,
  tecCobrada?: number,
  outrasTagas?: number
): AnaliseEncargos {
  const prazoAnos = prazoMeses / 12;
  const alertas: string[] = [];
  const encargos: ItemEncargo[] = [];

  // ── IOF ──────────────────────────────────────────────────────────────────────
  // Lei 8.894/94: alíquota máxima = 0,0082% a.d. + 0,38% adicional
  // Para crédito rural: Decreto 6.306/2007 — alíquota 0% para operações rurais
  // (art. 8º, §3º, II — operações de crédito rural com recursos controlados)
  let iofItem: ItemEncargo | undefined;
  if (iofCobrado !== undefined && iofCobrado > 0) {
    // Crédito rural com recursos controlados: IOF = 0%
    const iofLegal = 0; // Decreto 6.306/2007, art. 8º, §3º, II
    const excesso = iofCobrado - iofLegal;
    const status: "legal" | "abusivo" | "proibido" = excesso > 0 ? "proibido" : "legal";
    if (status !== "legal") {
      alertas.push(
        `IOF INDEVIDO: Contratos de crédito rural com recursos controlados têm alíquota de IOF = 0% (Decreto 6.306/2007, art. 8º, §3º, II). ` +
        `O valor de R$ ${iofCobrado.toFixed(2)} cobrado é integralmente indevido e deve ser restituído em dobro (CDC, art. 42, parágrafo único).`
      );
    }
    iofItem = {
      nome: "IOF — Imposto sobre Operações Financeiras",
      valorCobrado: iofCobrado,
      valorLegal: iofLegal,
      excesso,
      status,
      fundamentacao: "Decreto 6.306/2007, art. 8º, §3º, II — IOF = 0% para crédito rural com recursos controlados",
    };
    encargos.push(iofItem);
  }

  // ── TAC ──────────────────────────────────────────────────────────────────────
  // STJ Súmula 566: "Nos contratos bancários posteriores ao início da vigência da
  // Resolução-CMN n. 3.518/2007, de 25/11/2007, pode ser cobrada a tarifa de
  // cadastro no início do relacionamento entre o consumidor e a instituição
  // financeira, quando não houver relação anterior entre eles, e a de avaliação
  // do bem dado em garantia, bem como o ressarcimento de serviços prestados por
  // terceiros, ficando vedada a cobrança pela confecção do cadastro na abertura
  // de conta-corrente, bem como a de abertura de crédito (TAC) e de emissão de
  // carnê (TEC), ou outra equivalente."
  let tacItem: ItemEncargo | undefined;
  if (tacCobrada !== undefined && tacCobrada > 0) {
    alertas.push(
      `TAC PROIBIDA: A Tarifa de Abertura de Crédito (TAC) é expressamente vedada pela STJ Súmula 566. ` +
      `O valor de R$ ${tacCobrada.toFixed(2)} cobrado é nulo de pleno direito e deve ser restituído em dobro ` +
      `(CDC, art. 42, parágrafo único; STJ REsp 1.251.331/RS — Recurso Repetitivo).`
    );
    tacItem = {
      nome: "TAC — Tarifa de Abertura de Crédito",
      valorCobrado: tacCobrada,
      valorLegal: 0, // Proibida
      excesso: tacCobrada,
      status: "proibido",
      fundamentacao: "STJ Súmula 566 — TAC vedada em contratos bancários",
      sumula: "STJ Súmula 566",
    };
    encargos.push(tacItem);
  }

  // ── TEC ──────────────────────────────────────────────────────────────────────
  let tecItem: ItemEncargo | undefined;
  if (tecCobrada !== undefined && tecCobrada > 0) {
    alertas.push(
      `TEC PROIBIDA: A Tarifa de Emissão de Carnê (TEC) é expressamente vedada pela STJ Súmula 566. ` +
      `O valor de R$ ${tecCobrada.toFixed(2)} cobrado é nulo de pleno direito e deve ser restituído em dobro ` +
      `(CDC, art. 42, parágrafo único; STJ REsp 1.251.331/RS — Recurso Repetitivo).`
    );
    tecItem = {
      nome: "TEC — Tarifa de Emissão de Carnê",
      valorCobrado: tecCobrada,
      valorLegal: 0, // Proibida
      excesso: tecCobrada,
      status: "proibido",
      fundamentacao: "STJ Súmula 566 — TEC vedada em contratos bancários",
      sumula: "STJ Súmula 566",
    };
    encargos.push(tecItem);
  }

  // ── Outras Tarifas ───────────────────────────────────────────────────────────
  let outrasItem: ItemEncargo | undefined;
  if (outrasTagas !== undefined && outrasTagas > 0) {
    outrasItem = {
      nome: "Outras Tarifas / Seguros",
      valorCobrado: outrasTagas,
      valorLegal: outrasTagas, // Presumidamente legais até análise específica
      excesso: 0,
      status: "legal",
      fundamentacao: "Res. CMN 3.518/2007 — tarifas permitidas mediante contratação expressa",
    };
    encargos.push(outrasItem);
  }

  // ── CET — Custo Efetivo Total ─────────────────────────────────────────────────
  // Res. CMN 3.517/2007: CET deve incluir taxa de juros + todos os encargos
  // Fórmula: CET = [(1 + taxaJuros/100)^prazoAnos × (1 + encargos/principal)] - 1
  const totalEncargos = encargos.reduce((s, e) => s + e.valorCobrado, 0);
  const totalExcesso = encargos.reduce((s, e) => s + e.excesso, 0);

  // CET nominal: taxa de juros + encargos como % do principal ao ano
  const encargosPercentualAA = prazoAnos > 0 ? (totalEncargos / valorPrincipal) / prazoAnos * 100 : 0;
  const cetNominal = taxaJurosAA + encargosPercentualAA;

  // CET efetivo: capitalização composta considerando encargos no fluxo
  // Aproximação: (1 + taxaJuros/100) × (1 + encargos/principal)^(1/prazoAnos) - 1
  const fatorJuros = Math.pow(1 + taxaJurosAA / 100, prazoAnos);
  const fatorEncargos = prazoAnos > 0 ? Math.pow(1 + totalEncargos / valorPrincipal, 1 / prazoAnos) : 1;
  const cetEfetivo = prazoAnos > 0 ? (Math.pow(fatorJuros * fatorEncargos, 1 / prazoAnos) - 1) * 100 : taxaJurosAA;

  // ── Memória de Cálculo ────────────────────────────────────────────────────────
  const linhas: string[] = [
    `ANÁLISE DE ENCARGOS ADICIONAIS — CUSTO EFETIVO TOTAL (CET)`,
    `Fundamentação: Res. CMN 3.517/2007 (CET), STJ Súmula 566 (TAC/TEC), Decreto 6.306/2007 (IOF)`,
    ``,
    `DADOS DO CONTRATO:`,
    `  Valor Principal (PV) = R$ ${valorPrincipal.toFixed(2)}`,
    `  Taxa de Juros Nominal = ${taxaJurosAA.toFixed(4)}% a.a.`,
    `  Prazo = ${prazoMeses} meses (${prazoAnos.toFixed(4)} anos)`,
    ``,
    `ENCARGOS COBRADOS:`,
  ];

  if (iofCobrado !== undefined && iofCobrado > 0) {
    linhas.push(`  IOF cobrado = R$ ${iofCobrado.toFixed(2)} | IOF legal = R$ 0,00 (Decreto 6.306/2007) | Excesso = R$ ${iofCobrado.toFixed(2)}`);
  }
  if (tacCobrada !== undefined && tacCobrada > 0) {
    linhas.push(`  TAC cobrada = R$ ${tacCobrada.toFixed(2)} | TAC legal = R$ 0,00 (STJ Súmula 566) | Excesso = R$ ${tacCobrada.toFixed(2)}`);
  }
  if (tecCobrada !== undefined && tecCobrada > 0) {
    linhas.push(`  TEC cobrada = R$ ${tecCobrada.toFixed(2)} | TEC legal = R$ 0,00 (STJ Súmula 566) | Excesso = R$ ${tecCobrada.toFixed(2)}`);
  }
  if (outrasTagas !== undefined && outrasTagas > 0) {
    linhas.push(`  Outras tarifas = R$ ${outrasTagas.toFixed(2)}`);
  }

  linhas.push(`  Total de Encargos Cobrados = R$ ${totalEncargos.toFixed(2)}`);
  linhas.push(`  Total de Encargos Indevidos = R$ ${totalExcesso.toFixed(2)}`);
  linhas.push(``);
  linhas.push(`CÁLCULO DO CET (Custo Efetivo Total):`);
  linhas.push(`  Encargos como % do Principal ao ano = (${totalEncargos.toFixed(2)} / ${valorPrincipal.toFixed(2)}) / ${prazoAnos.toFixed(4)} × 100 = ${encargosPercentualAA.toFixed(4)}% a.a.`);
  linhas.push(`  CET Nominal = Taxa Juros + Encargos/ano = ${taxaJurosAA.toFixed(4)}% + ${encargosPercentualAA.toFixed(4)}% = ${cetNominal.toFixed(4)}% a.a.`);
  linhas.push(`  CET Efetivo (capitalização composta) = ${cetEfetivo.toFixed(4)}% a.a.`);
  linhas.push(`  Limite Legal (Decreto 22.626/33) = 12,0000% a.a.`);
  if (cetEfetivo > 12) {
    linhas.push(`  ⚠ CET ACIMA DO LIMITE LEGAL: ${cetEfetivo.toFixed(4)}% > 12,0000% — Excesso de ${(cetEfetivo - 12).toFixed(4)} pontos percentuais`);
  }

  return {
    iof: iofItem,
    tac: tacItem,
    tec: tecItem,
    outrasTagas: outrasItem,
    totalEncargos,
    totalExcesso,
    cetNominal,
    cetEfetivo,
    alertas,
    memoriaCalculo: linhas.join("\n"),
  };
}
