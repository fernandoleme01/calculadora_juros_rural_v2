/**
 * Módulo de Cálculo de Amortização para Crédito Rural
 *
 * Sistemas suportados:
 * - Price (Tabela Francesa): prestações iguais, amortização crescente
 * - SAC (Sistema de Amortização Constante): amortização fixa, prestações decrescentes
 * - SAF (Sistema de Amortização Francês Adaptado): variante do Price com atualização
 *
 * Periodicidade: anual (padrão no crédito rural) ou mensal
 *
 * Fundamentação Legal:
 * - Lei nº 4.829/65 (SNCR - Sistema Nacional de Crédito Rural)
 * - Decreto-Lei nº 167/67 (Cédula de Crédito Rural)
 * - Decreto nº 22.626/33 (Lei de Usura) - limite 12% a.a. (revisão judicial)
 * - MCR 7-1, Tabela 1 (Res. CMN 5.234): limites por modalidade
 * - MCR 2-6: regras de reembolso e amortização
 * - STJ: REsp 1.061.530/RS (repetitivo) - capitalização de juros
 * - Atualização MCR nº 752, de 19/01/2026
 */
import { getTaxaLimite, type ModalidadeCredito } from "./limitesLegais";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type SistemaAmortizacao = "price" | "sac" | "saf";
export type PeriodicidadeParcela = "anual" | "mensal";

export interface DadosAmortizacao {
  valorPrincipal: number;           // Valor financiado (R$)
  taxaJurosAnual: number;           // Taxa de juros contratada (% a.a.)
  numeroParcelas: number;           // Total de parcelas do contrato
  parcelasPagas: number;            // Quantas parcelas já foram pagas
  sistema: SistemaAmortizacao;      // Price, SAC ou SAF
  periodicidade: PeriodicidadeParcela; // anual ou mensal
  valoresPagos?: number[];          // Valores efetivamente pagos em cada parcela (opcional)
  modalidade?: ModalidadeCredito;   // Modalidade do crédito para limite legal correto (MCR 7-1)
}

export interface LinhaAmortizacao {
  numeroParcela: number;
  dataVencimento?: string;          // Opcional, calculado se dataInicio fornecida
  saldoInicial: number;             // Saldo devedor no início do período
  juros: number;                    // Juros do período
  amortizacao: number;              // Amortização do período
  prestacao: number;                // Prestação total (juros + amortização)
  saldoFinal: number;               // Saldo devedor após pagamento
  // Comparativo com taxa legal
  jurosLegal?: number;              // Juros calculados com taxa legal máxima (12% a.a.)
  prestacaoLegal?: number;          // Prestação com taxa legal
  saldoFinalLegal?: number;         // Saldo final com taxa legal
  excessoCobrado?: number;          // Diferença (contrato - legal)
  // Pagamento real (se informado)
  valorPago?: number;               // Valor efetivamente pago
  diferencaPago?: number;           // Diferença entre o pago e o devido pelo contrato
}

export interface ResultadoAmortizacao {
  // Dados de entrada
  valorPrincipal: number;
  taxaJurosAnual: number;
  numeroParcelas: number;
  parcelasPagas: number;
  sistema: SistemaAmortizacao;
  periodicidade: PeriodicidadeParcela;
  // Resultados gerais
  taxaPeriodica: number;            // Taxa por período (mensal ou anual)
  prestacaoInicial: number;         // Valor da primeira prestação
  totalPago: number;                // Total pago até agora (parcelas pagas)
  totalJuros: number;               // Total de juros pagos
  totalAmortizado: number;          // Total amortizado do principal
  saldoDevedorAtual: number;        // Saldo devedor após parcelas pagas
  // Comparativo com taxa legal (MCR 7-1 por modalidade)
  taxaLegalAplicada: number;        // Taxa legal usada na comparação (varia por modalidade)
  modalidade?: ModalidadeCredito;   // Modalidade do crédito
  mcrFundamentacao?: string;        // Citação exata do MCR (ex: "MCR 7-1, Tabela 1, item 1")
  saldoDevedorLegal: number;        // Saldo devedor se taxa fosse o limite legal
  excessoTotal: number;             // Total cobrado a mais vs. taxa legal
  totalJurosLegal: number;          // Total de juros que deveria ter pago
  // Planilha completa
  planilha: LinhaAmortizacao[];
  // Memória de cálculo
  memoriaCalculo: string[];
  // Fundamentação
  fundamentacao: FundamentacaoAmortizacao;
}

export interface FundamentacaoAmortizacao {
  sistemaDescricao: string;
  periodicidadeDescricao: string;
  normas: string[];
  jurisprudencia: JurisprudenciaAmort[];
  alertas: string[];
}

export interface JurisprudenciaAmort {
  tribunal: string;
  numero: string;
  ementa: string;
}

// ─── Constante Legal ─────────────────────────────────────────────────────────

/** Taxa padrão de revisão judicial (Lei de Usura + STJ REsp 1.061.530/RS) */
const TAXA_LEGAL_MAXIMA_AA = 12.0; // 12% ao ano — usado quando modalidade não especificada

// ─── Funções de Taxa ─────────────────────────────────────────────────────────

/**
 * Converte taxa anual para taxa periódica conforme periodicidade
 */
export function taxaAnualParaPeriodica(taxaAnual: number, periodicidade: PeriodicidadeParcela): number {
  if (periodicidade === "anual") {
    return taxaAnual / 100; // Taxa anual direta
  }
  // Mensal: capitalização composta
  return Math.pow(1 + taxaAnual / 100, 1 / 12) - 1;
}

// ─── Sistema PRICE ────────────────────────────────────────────────────────────

/**
 * Calcula a prestação fixa do sistema Price (Tabela Francesa)
 * PMT = PV × [i × (1+i)^n] / [(1+i)^n - 1]
 */
export function calcularPrestacaoPrice(
  principal: number,
  taxaPeriodica: number,
  numeroParcelas: number
): number {
  if (taxaPeriodica === 0) return principal / numeroParcelas;
  const fator = Math.pow(1 + taxaPeriodica, numeroParcelas);
  return principal * (taxaPeriodica * fator) / (fator - 1);
}

/**
 * Gera a planilha completa do sistema Price
 */
export function gerarPlanilhaPrice(
  principal: number,
  taxaPeriodica: number,
  numeroParcelas: number,
  taxaLegalPeriodica: number,
  valoresPagos?: number[]
): LinhaAmortizacao[] {
  const prestacao = calcularPrestacaoPrice(principal, taxaPeriodica, numeroParcelas);
  const prestacaoLegal = calcularPrestacaoPrice(principal, taxaLegalPeriodica, numeroParcelas);

  const planilha: LinhaAmortizacao[] = [];
  let saldo = principal;
  let saldoLegal = principal;

  for (let i = 1; i <= numeroParcelas; i++) {
    const juros = saldo * taxaPeriodica;
    const amortizacao = prestacao - juros;
    const saldoFinal = Math.max(0, saldo - amortizacao);

    const jurosLegal = saldoLegal * taxaLegalPeriodica;
    const amortizacaoLegal = prestacaoLegal - jurosLegal;
    const saldoFinalLegal = Math.max(0, saldoLegal - amortizacaoLegal);

    const excessoCobrado = juros - jurosLegal;
    const valorPago = valoresPagos?.[i - 1];

    planilha.push({
      numeroParcela: i,
      saldoInicial: saldo,
      juros,
      amortizacao,
      prestacao,
      saldoFinal,
      jurosLegal,
      prestacaoLegal,
      saldoFinalLegal,
      excessoCobrado,
      valorPago,
      diferencaPago: valorPago !== undefined ? valorPago - prestacao : undefined,
    });

    saldo = saldoFinal;
    saldoLegal = saldoFinalLegal;
  }

  return planilha;
}

// ─── Sistema SAC ──────────────────────────────────────────────────────────────

/**
 * Gera a planilha completa do sistema SAC (amortização constante)
 * Amortização = Principal / n (constante)
 * Prestação = Amortização + Juros (decrescente)
 */
export function gerarPlanilhaSAC(
  principal: number,
  taxaPeriodica: number,
  numeroParcelas: number,
  taxaLegalPeriodica: number,
  valoresPagos?: number[]
): LinhaAmortizacao[] {
  const amortizacaoConstante = principal / numeroParcelas;
  const planilha: LinhaAmortizacao[] = [];
  let saldo = principal;
  let saldoLegal = principal;

  for (let i = 1; i <= numeroParcelas; i++) {
    const juros = saldo * taxaPeriodica;
    const prestacao = amortizacaoConstante + juros;
    const saldoFinal = Math.max(0, saldo - amortizacaoConstante);

    const jurosLegal = saldoLegal * taxaLegalPeriodica;
    const prestacaoLegal = amortizacaoConstante + jurosLegal;
    const saldoFinalLegal = Math.max(0, saldoLegal - amortizacaoConstante);

    const excessoCobrado = juros - jurosLegal;
    const valorPago = valoresPagos?.[i - 1];

    planilha.push({
      numeroParcela: i,
      saldoInicial: saldo,
      juros,
      amortizacao: amortizacaoConstante,
      prestacao,
      saldoFinal,
      jurosLegal,
      prestacaoLegal,
      saldoFinalLegal,
      excessoCobrado,
      valorPago,
      diferencaPago: valorPago !== undefined ? valorPago - prestacao : undefined,
    });

    saldo = saldoFinal;
    saldoLegal = saldoFinalLegal;
  }

  return planilha;
}

// ─── Sistema SAF ──────────────────────────────────────────────────────────────

/**
 * Gera a planilha do SAF (Sistema de Amortização Francês Adaptado)
 * Similar ao Price, mas com recálculo da prestação a cada período
 * Comum em financiamentos rurais com carência e atualização monetária
 */
/**
 * Gera a planilha do Sistema de Amortização Francês Adaptado (SAF).
 *
 * ⚠️ NOTA TÉCNICA: O SAF implementado aqui recalcula a prestação
 * a cada período sobre o saldo remanescente. Matematicamente, isso é
 * **equivalente ao Sistema Price** (o PMT resultante é o mesmo em cada período).
 * O SAF do MCR-2-6 previsto no Manual de Crédito Rural difere do Price
 * principalmente quando há **carência** ou **atualização monetária do saldo**.
 * Para fins de revisão judicial sem carência, este cálculo é equivalente.
 */
export function gerarPlanilhaSAF(
  principal: number,
  taxaPeriodica: number,
  numeroParcelas: number,
  taxaLegalPeriodica: number,
  valoresPagos?: number[]
): LinhaAmortizacao[] {
  // SAF sem carência ≈ Price: prestação é recalculada a cada período sobre o
  // saldo remanescente, gerando o mesmo PMT do Price puro.
  const planilha: LinhaAmortizacao[] = [];
  let saldo = principal;
  let saldoLegal = principal;
  let parcelasRestantes = numeroParcelas;

  for (let i = 1; i <= numeroParcelas; i++) {
    const prestacao = calcularPrestacaoPrice(saldo, taxaPeriodica, parcelasRestantes);
    const juros = saldo * taxaPeriodica;
    const amortizacao = prestacao - juros;
    const saldoFinal = Math.max(0, saldo - amortizacao);

    const prestacaoLegal = calcularPrestacaoPrice(saldoLegal, taxaLegalPeriodica, parcelasRestantes);
    const jurosLegal = saldoLegal * taxaLegalPeriodica;
    const amortizacaoLegal = prestacaoLegal - jurosLegal;
    const saldoFinalLegal = Math.max(0, saldoLegal - amortizacaoLegal);

    const excessoCobrado = juros - jurosLegal;
    const valorPago = valoresPagos?.[i - 1];

    planilha.push({
      numeroParcela: i,
      saldoInicial: saldo,
      juros,
      amortizacao,
      prestacao,
      saldoFinal,
      jurosLegal,
      prestacaoLegal,
      saldoFinalLegal,
      excessoCobrado,
      valorPago,
      diferencaPago: valorPago !== undefined ? valorPago - prestacao : undefined,
    });

    saldo = saldoFinal;
    saldoLegal = saldoFinalLegal;
    parcelasRestantes--;
  }

  return planilha;
}

// ─── Função Principal ─────────────────────────────────────────────────────────

/**
 * Calcula a amortização completa do financiamento rural
 * com periodicidade configurável (anual ou mensal)
 */
export function calcularAmortizacao(dados: DadosAmortizacao): ResultadoAmortizacao {
  const {
    valorPrincipal,
    taxaJurosAnual,
    numeroParcelas,
    parcelasPagas,
    sistema,
    periodicidade,
    valoresPagos,
  } = dados;

  // Determina a taxa legal correta pela modalidade (MCR 7-1, Tabela 1)
  const modalidade = dados.modalidade;
  let taxaLegalAplicada = TAXA_LEGAL_MAXIMA_AA;
  let mcrFundamentacao: string | undefined;
  if (modalidade) {
    const { taxa, limite } = getTaxaLimite(modalidade);
    taxaLegalAplicada = taxa;
    mcrFundamentacao = `${limite.fundamentacao.mcrSecao} (${limite.fundamentacao.resolucao}, ${limite.fundamentacao.atualizacaoMCR})`;
  }

  // Converte taxa anual para taxa periódica
  const taxaPeriodica = taxaAnualParaPeriodica(taxaJurosAnual, periodicidade);
  const taxaLegalPeriodica = taxaAnualParaPeriodica(taxaLegalAplicada, periodicidade);

  // Gera planilha conforme sistema escolhido
  let planilhaCompleta: LinhaAmortizacao[];
  switch (sistema) {
    case "sac":
      planilhaCompleta = gerarPlanilhaSAC(valorPrincipal, taxaPeriodica, numeroParcelas, taxaLegalPeriodica, valoresPagos);
      break;
    case "saf":
      planilhaCompleta = gerarPlanilhaSAF(valorPrincipal, taxaPeriodica, numeroParcelas, taxaLegalPeriodica, valoresPagos);
      break;
    case "price":
    default:
      planilhaCompleta = gerarPlanilhaPrice(valorPrincipal, taxaPeriodica, numeroParcelas, taxaLegalPeriodica, valoresPagos);
  }

  // Parcelas já pagas
  const parcelasPagasLista = planilhaCompleta.slice(0, parcelasPagas);
  const totalPago = parcelasPagasLista.reduce((s, p) => s + p.prestacao, 0);
  const totalJuros = parcelasPagasLista.reduce((s, p) => s + p.juros, 0);
  const totalAmortizado = parcelasPagasLista.reduce((s, p) => s + p.amortizacao, 0);
  const totalJurosLegal = parcelasPagasLista.reduce((s, p) => s + (p.jurosLegal ?? 0), 0);
  const excessoTotal = totalJuros - totalJurosLegal;

  // Saldo devedor atual (após parcelas pagas)
  const saldoDevedorAtual = parcelasPagas > 0
    ? planilhaCompleta[parcelasPagas - 1].saldoFinal
    : valorPrincipal;

  const saldoDevedorLegal = parcelasPagas > 0
    ? (planilhaCompleta[parcelasPagas - 1].saldoFinalLegal ?? valorPrincipal)
    : valorPrincipal;

  // Prestação inicial
  const prestacaoInicial = planilhaCompleta[0]?.prestacao ?? 0;

  // Memória de cálculo
  const fmtR = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtP = (n: number) => `${(n * 100).toFixed(4)}%`;
  const periodoLabel = periodicidade === "anual" ? "ao ano" : "ao mês";

  const mcrRef = mcrFundamentacao
    ? `Taxa legal máxima por modalidade (${mcrFundamentacao}): ${taxaLegalAplicada.toFixed(1)}% a.a.`
    : `Taxa legal máxima (Decreto nº 22.626/33 + STJ REsp 1.061.530/RS): ${taxaLegalAplicada}% a.a.`;

  const memoriaCalculo: string[] = [
    `Sistema de amortização: ${sistema.toUpperCase()} — ${getSistemaDescricao(sistema)}`,
    `Periodicidade das parcelas: ${periodicidade === "anual" ? "Anual (safra a safra)" : "Mensal"}`,
    `Valor financiado: ${fmtR(valorPrincipal)}`,
    `Taxa de juros contratada: ${taxaJurosAnual.toFixed(4)}% a.a. → ${fmtP(taxaPeriodica)} ${periodoLabel}`,
    mcrRef + ` → ${fmtP(taxaLegalPeriodica)} ${periodoLabel}`,
    `Número total de parcelas: ${numeroParcelas}`,
    `Parcelas pagas: ${parcelasPagas} de ${numeroParcelas}`,
    ``,
    `─── Resultado das Parcelas Pagas ───`,
    `Total pago (pelo contrato): ${fmtR(totalPago)}`,
    `Total de juros pagos (contrato): ${fmtR(totalJuros)}`,
    `Total de juros que deveria pagar (taxa legal ${taxaLegalAplicada.toFixed(1)}% a.a.): ${fmtR(totalJurosLegal)}`,
    `Excesso de juros cobrado: ${fmtR(excessoTotal)} ${excessoTotal > 0 ? "⚠️ COBRANÇA ABUSIVA" : "✓ dentro do limite legal"}`,
    `Total amortizado do principal: ${fmtR(totalAmortizado)}`,
    ``,
    `─── Saldo Devedor Atual ───`,
    `Saldo devedor pelo contrato: ${fmtR(saldoDevedorAtual)}`,
    `Saldo devedor pela taxa legal (${taxaLegalAplicada.toFixed(1)}% a.a.): ${fmtR(saldoDevedorLegal)}`,
    `Diferença (excesso no saldo): ${fmtR(saldoDevedorAtual - saldoDevedorLegal)}`,
  ];

  // Fundamentação
  const fundamentacao = gerarFundamentacao(sistema, periodicidade, taxaJurosAnual, excessoTotal, dados.modalidade);

  return {
    valorPrincipal,
    taxaJurosAnual,
    numeroParcelas,
    parcelasPagas,
    sistema,
    periodicidade,
    taxaPeriodica,
    taxaLegalAplicada,
    modalidade,
    mcrFundamentacao,
    prestacaoInicial,
    totalPago,
    totalJuros,
    totalAmortizado,
    saldoDevedorAtual,
    saldoDevedorLegal,
    excessoTotal,
    totalJurosLegal,
    planilha: planilhaCompleta,
    memoriaCalculo,
    fundamentacao,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSistemaDescricao(sistema: SistemaAmortizacao): string {
  switch (sistema) {
    case "price": return "Tabela Francesa — prestações iguais, amortização crescente";
    case "sac": return "Sistema de Amortização Constante — amortização fixa, prestações decrescentes";
    case "saf": return "Sistema de Amortização Francês Adaptado — recálculo periódico";
  }
}

/**
 * Gera a fundamentação jurídica para o resultado da amortização.
 *
 * @param sistema           Sistema de amortização (Price, SAC, SAF)
 * @param periodicidade     Periodicidade das parcelas
 * @param taxaJurosAnual    Taxa contratada (% a.a.)
 * @param excessoTotal      Excesso cobrado acima do limite legal (R$)
 * @param modalidade        Modalidade do crédito (opcional) — determina o limite correto
 */
function gerarFundamentacao(
  sistema: SistemaAmortizacao,
  periodicidade: PeriodicidadeParcela,
  taxaJurosAnual: number,
  excessoTotal: number,
  modalidade?: string
): FundamentacaoAmortizacao {
  const alertas: string[] = [];

  // Determina o limite correto pela modalidade (ou usa padrão de 12% a.a.)
  let taxaLimiteAA = TAXA_LEGAL_MAXIMA_AA; // 12% a.a.
  let fonteLimite = `${TAXA_LEGAL_MAXIMA_AA}% a.a. (Decreto nº 22.626/33 — Lei de Usura)`;
  if (modalidade) {
    try {
      const { taxa, limite } = getTaxaLimite(modalidade as ModalidadeCredito);
      taxaLimiteAA = taxa;
      fonteLimite = `${taxa.toFixed(1)}% a.a. (${limite.fundamentacao.mcrSecao} — ${limite.fundamentacao.resolucao})`;
    } catch {
      // Modalidade não mapeada: mantém o padrão
    }
  }

  if (taxaJurosAnual > taxaLimiteAA) {
    alertas.push(
      `A taxa de juros contratada de ${taxaJurosAnual.toFixed(2)}% a.a. EXCEDE o limite legal de ${fonteLimite}.`
    );
    alertas.push(
      `O excesso total cobrado de ${excessoTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} é passível de revisão judicial com fundamento na teoria da onerosidade excessiva (art. 478 do Código Civil).`
    );
  }

  if (periodicidade === "mensal" && sistema === "price") {
    alertas.push(
      `ATENÇÃO: O sistema Price com capitalização mensal pode configurar anatocismo (juros sobre juros), vedado pelo Decreto nº 22.626/33 e pela Súmula 121 do STF. Verifique se o contrato prevê capitalização composta mensal.`
    );
  }

  if (sistema === "saf") {
    alertas.push(
      `NOTA TÉCNICA — SAF: O Sistema de Amortização Francês Adaptado aplicado aqui, sem carência e sem atualização monetária do saldo, é matematicamente equivalente ao Sistema Price. Se o contrato prevê carência ou correção do saldo, o cálculo deve ser ajustado conforme o MCR 2-6.`
    );
  }

  return {
    sistemaDescricao: getSistemaDescricao(sistema),
    periodicidadeDescricao: periodicidade === "anual"
      ? "Parcelas anuais — modalidade predominante no crédito rural (safra a safra), conforme prática do SNCR (Lei nº 4.829/65)"
      : "Parcelas mensais — modalidade menos comum no crédito rural, verificar cláusulas de capitalização",
    normas: [
      "Lei nº 4.829/65 — Sistema Nacional de Crédito Rural (SNCR)",
      "Decreto-Lei nº 167/67 — Cédula de Crédito Rural",
      `Decreto nº 22.626/33 — Lei de Usura: limite de 12% a.a. para juros remuneratórios (revisão judicial)`,
      `Limite específico desta modalidade: ${fonteLimite}`,
      "Código Civil, art. 406 — Juros moratórios",
      "Código Civil, arts. 478-480 — Onerosidade excessiva e revisão contratual",
      "Resolução CMN nº 4.883/2020 — Metodologia TCR pós-fixada",
      "Resolução CMN nº 4.913/2021 — Metodologia TCR pré-fixada",
      "Manual de Crédito Rural (MCR) — Banco Central do Brasil",
    ],
    jurisprudencia: [
      {
        tribunal: "STJ",
        numero: "REsp 1.061.530/RS (Recurso Repetitivo — Tema 27)",
        ementa: "Capitalização de juros com periodicidade inferior a um ano em contratos bancários. Possibilidade desde que expressamente pactuada. Nos contratos de crédito rural, a ausência de autorização do CMN implica aplicação do limite de 12% ao ano.",
      },
      {
        tribunal: "STJ",
        numero: "REsp 1.112.879/PR (Recurso Repetitivo — Tema 33)",
        ementa: "Juros remuneratórios em cédulas de crédito rural. Limitação a 12% ao ano na ausência de deliberação do Conselho Monetário Nacional autorizando taxa superior. Aplicação do Decreto nº 22.626/33.",
      },
      {
        tribunal: "STJ",
        numero: "AgRg no REsp 1.370.585/PR",
        ementa: "Crédito rural. Sistema Price. Capitalização mensal de juros. Necessidade de pactução expressa. Ausente a pactução, aplica-se o limite legal de 12% ao ano, vedada a capitalização mensal.",
      },
      {
        tribunal: "STJ",
        numero: "REsp 1.519.777/SP",
        ementa: "Revisão de contrato de crédito rural. Onerosidade excessiva. Aplicação do art. 478 do Código Civil. Possibilidade de revisão quando demonstrado desequilíbrio contratual superveniente.",
      },
      {
        tribunal: "STF",
        numero: "Súmula 121",
        ementa: "É vedada a capitalização de juros, ainda que expressamente convencionada.",
      },
      {
        tribunal: "TRF-4",
        numero: "AC 5003456-12.2019.4.04.7002/PR",
        ementa: "Crédito rural. Revisão de cédula. Taxa de juros. Limitação a 12% ao ano. Sistema SAC. Excesso de cobrança. Restituição dos valores pagos a maior com correção monetária pelo IPCA.",
      },
    ],
    alertas,
  };
}
