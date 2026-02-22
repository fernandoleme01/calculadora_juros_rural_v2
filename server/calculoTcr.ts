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

// ─── Constantes Legais ───────────────────────────────────────────────────────

export const LIMITE_JUROS_REMUNERATORIOS_AA = 12.0; // 12% ao ano - Lei de Usura / STJ
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
  tcrEfetiva: number; // TCR efetiva ao ano
  // Conformidade legal
  conformidade: ConformidadeLegal;
  // Memória de cálculo
  memoriaCalculo: MemoriaCalculo;
  // Análise de parcelas pagas (opcional)
  analiseParcelas?: AnaliseParcelas;
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
 * Calcula o número de meses entre duas datas
 */
export function calcularMeses(dataInicio: Date, dataFim: Date): number {
  const anos = dataFim.getFullYear() - dataInicio.getFullYear();
  const meses = dataFim.getMonth() - dataInicio.getMonth();
  return anos * 12 + meses;
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

  // Juros de mora (se houver inadimplência)
  const diasInadimplencia = calcularDiasCorridos(dataVencimento, dataCalculo);
  let jurosMora = 0;
  if (diasInadimplencia > 0) {
    const taxaMoraDiaria = dados.taxaJurosMora / 100 / 365;
    jurosMora = saldoDevedorAtualizado * taxaMoraDiaria * diasInadimplencia;
  }

  // Multa (se houver inadimplência)
  let multa = 0;
  if (diasInadimplencia > 0 && dados.taxaMulta > 0) {
    multa = saldoDevedorAtualizado * (dados.taxaMulta / 100);
  }

  const totalDevido = saldoDevedorAtualizado + jurosRemuneratorios + jurosMora + multa;
  const tcrEfetiva = ((totalDevido / valorPrincipal) - 1) * 100;

  // Análise de conformidade
  const conformidade = analisarConformidade(
    dados.taxaJurosRemuneratorios,
    dados.taxaJurosMora,
    tcrPosAA
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
    tcrEfetiva: tcrPosAA,
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

  // Juros de mora
  const diasInadimplencia = calcularDiasCorridos(dataVencimento, dataCalculo);
  let jurosMora = 0;
  if (diasInadimplencia > 0) {
    const taxaMoraDiaria = dados.taxaJurosMora / 100 / 365;
    jurosMora = saldoDevedorAtualizado * taxaMoraDiaria * diasInadimplencia;
  }

  // Multa
  let multa = 0;
  if (diasInadimplencia > 0 && dados.taxaMulta > 0) {
    multa = saldoDevedorAtualizado * (dados.taxaMulta / 100);
  }

  const totalDevido = saldoDevedorAtualizado + jurosMora + multa;
  const tcrEfetiva = ((totalDevido / valorPrincipal) - 1) * 100;

  // Análise de conformidade
  const conformidade = analisarConformidade(
    dados.taxaJurosRemuneratorios,
    dados.taxaJurosMora,
    tcrPreAA
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
    tcrEfetiva: tcrPreAA,
    conformidade,
    memoriaCalculo,
  };
}

// ─── Análise de Conformidade Legal ───────────────────────────────────────────

export function analisarConformidade(
  taxaRemuneratoriaAA: number,
  taxaMoraAA: number,
  tcrEfetivaAA: number
): ConformidadeLegal {
  const alertas: string[] = [];
  const fundamentacao: string[] = [];

  let limiteRemuneratorios: "conforme" | "nao_conforme" | "atencao" = "conforme";
  let limiteMora: "conforme" | "nao_conforme" | "atencao" = "conforme";

  // Verificação dos juros remuneratórios
  if (taxaRemuneratoriaAA > LIMITE_JUROS_REMUNERATORIOS_AA) {
    limiteRemuneratorios = "nao_conforme";
    alertas.push(
      `ATENÇÃO: Taxa de juros remuneratórios de ${taxaRemuneratoriaAA.toFixed(2)}% a.a. EXCEDE o limite legal de ${LIMITE_JUROS_REMUNERATORIOS_AA}% a.a. estabelecido pela jurisprudência do STJ (Decreto nº 22.626/33 - Lei de Usura).`
    );
    fundamentacao.push(
      "Decreto nº 22.626/33 (Lei de Usura) - Art. 1º: limite de 12% ao ano para juros remuneratórios na ausência de autorização do CMN."
    );
    fundamentacao.push(
      "STJ - Súmula e jurisprudência consolidada: ausência de deliberação do CMN implica aplicação do limite de 12% ao ano para cédulas de crédito rural."
    );
  } else if (taxaRemuneratoriaAA > LIMITE_JUROS_REMUNERATORIOS_AA * 0.9) {
    limiteRemuneratorios = "atencao";
    alertas.push(
      `ATENÇÃO: Taxa de juros remuneratórios de ${taxaRemuneratoriaAA.toFixed(2)}% a.a. está próxima do limite legal de ${LIMITE_JUROS_REMUNERATORIOS_AA}% a.a.`
    );
  } else {
    fundamentacao.push(
      `Taxa de juros remuneratórios de ${taxaRemuneratoriaAA.toFixed(2)}% a.a. está em conformidade com o limite de ${LIMITE_JUROS_REMUNERATORIOS_AA}% a.a. (Decreto nº 22.626/33).`
    );
  }

  // Verificação dos juros de mora
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
  const pmtLegal    = calcPMT(valorPrincipal, taxaLegalPeriodo, numeroParcelas);

  // ── 3. Tabela de amortização parcela a parcela (Price) ───────────────────────
  // Para cada parcela k:
  //   Juros_k       = SD_{k-1} × i
  //   Amortização_k = PMT - Juros_k
  //   SD_k          = SD_{k-1} - Amortização_k
  const tabelaAmortizacao: LinhaTabelaAmortizacao[] = [];
  let sdContrato = valorPrincipal;
  let sdLegal    = valorPrincipal;

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
    sdLegal    = sdFinal_l;
  }

  // ── 4. Totais das parcelas pagas ─────────────────────────────────────────────
  const parcelasAnalisadas = tabelaAmortizacao.slice(0, parcelasPagas);
  const totalPagoContrato  = parcelasAnalisadas.reduce((s, p) => s + p.prestacao, 0);
  const totalLegal         = parcelasAnalisadas.reduce((s, p) => s + p.prestacao_legal, 0);
  const excessoPago        = Math.max(0, totalPagoContrato - totalLegal);
  const percentualExcesso  = totalLegal > 0 ? (excessoPago / totalLegal) * 100 : 0;

  // ── 5. Saldo devedor revisado após N parcelas (pela taxa legal) ──────────────
  // Calculado diretamente da tabela de amortização (mais preciso que a fórmula fechada)
  const saldoDevedorRevisado = parcelasPagas > 0
    ? tabelaAmortizacao[parcelasPagas - 1].saldoFinal_legal
    : valorPrincipal;

  const diferencaSaldo = Math.max(0, saldoDevedorBanco - saldoDevedorRevisado);

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
