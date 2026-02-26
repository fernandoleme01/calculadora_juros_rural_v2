/**
 * analiseCadeia.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Módulo para análise de cadeia de contratos de crédito rural:
 *   - Detecção de operação "mata-mata" (refinanciamento para quitar vencido)
 *   - Detecção de capitalização indevida de juros no novo principal
 *   - Análise de aditivos e novações abusivas
 *   - Cálculo do valor original vs. valor atual da dívida
 *   - Geração de laudo técnico-jurídico da cadeia contratual completa
 *
 * Fundamentação Legal:
 *   - Art. 39, V do CDC (prática abusiva — exigir vantagem manifestamente excessiva)
 *   - Art. 478 do CC (onerosidade excessiva superveniente)
 *   - Art. 422 do CC (boa-fé objetiva)
 *   - Decreto nº 22.626/33 (Lei de Usura) — limite 12% a.a.
 *   - Decreto-Lei nº 167/67, art. 5º — juros de mora máx. 1% a.a.
 *   - STJ — REsp 1.061.530/RS (repetitivo) — revisão contratual
 *   - STJ — REsp 1.286.698/RS — capitalização de juros
 *   - STJ — AgRg no REsp 1.370.585/RS — operação mata-mata
 */

import { invokeLLM } from "./_core/llm";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TipoContrato =
  | "original"
  | "aditivo"
  | "refinanciamento"
  | "novacao"
  | "renegociacao";

export interface ContratoNaCadeia {
  id?: number;
  ordem: number;
  tipo: TipoContrato;
  numeroContrato: string;
  dataContratacao: string;
  dataVencimento: string;
  modalidade: "custeio" | "investimento" | "comercializacao" | "outro";
  valorContrato: number;                  // Valor nominal do contrato
  valorPrincipalOriginal?: number;        // Saldo devedor do contrato anterior (se informado)
  valorEncargosIncorporados?: number;     // Juros/multas embutidos no novo principal
  taxaJurosAnual: number;
  taxaJurosMora?: number;
  numeroParcelas?: number;
  sistemaAmortizacao?: string;
  garantias?: string;
  observacoes?: string;
}

export interface AlertaCadeia {
  tipo: "critico" | "atencao" | "informativo";
  codigo: string;
  titulo: string;
  descricao: string;
  fundamentacao: string;
  contratosAfetados: number[];            // Ordens dos contratos afetados
}

export interface ResultadoAnaliseCadeia {
  // Resumo financeiro
  valorOriginalFinanciado: number;        // Valor do primeiro contrato
  valorAtualDivida: number;              // Valor do último contrato
  incrementoTotal: number;               // Quanto a dívida cresceu
  percentualIncremento: number;          // % de crescimento
  encargosIncorporadosTotal: number;     // Total de juros/multas embutidos em novos contratos
  // Análise por contrato
  analiseContratos: {
    contrato: ContratoNaCadeia;
    alertas: AlertaCadeia[];
    capitalicaoDetectada: boolean;
    mataMataDetectado: boolean;
    percentualAumentoSobreAnterior?: number;
  }[];
  // Alertas gerais
  alertasGerais: AlertaCadeia[];
  // Indicadores
  mataMataDetectado: boolean;
  capitalizacaoIndevidaDetectada: boolean;
  taxaAcimaLegalDetectada: boolean;
  // Laudo
  laudoTexto?: string;
}

// ─── Jurisprudência sobre Operação Mata-Mata ──────────────────────────────────

const JURISPRUDENCIA_MATA_MATA = [
  {
    tribunal: "STJ",
    numero: "AgRg no REsp 1.370.585/RS",
    ementa: `AGRAVO REGIMENTAL. RECURSO ESPECIAL. CONTRATO BANCÁRIO. REFINANCIAMENTO. OPERAÇÃO "MATA-MATA". CAPITALIZAÇÃO DE JUROS. VEDAÇÃO. 1. A operação denominada "mata-mata" consiste na contratação de novo empréstimo para quitar dívida anterior vencida, com incorporação dos juros e encargos ao novo principal. 2. Tal prática configura anatocismo (capitalização de juros) vedado pelo Decreto nº 22.626/33, salvo expressa autorização legal. 3. O valor dos juros vencidos e não pagos não pode ser incorporado ao principal do novo contrato sem expressa autorização legal, sob pena de nulidade da cláusula.`,
    referencia: "(STJ - AgRg no REsp 1.370.585/RS, Rel. Ministro MARCO BUZZI, Quarta Turma, julgado em 04/02/2014, DJe 11/02/2014)",
  },
  {
    tribunal: "STJ",
    numero: "REsp 1.286.698/RS",
    ementa: `RECURSO ESPECIAL. CRÉDITO RURAL. CAPITALIZAÇÃO DE JUROS. CÉDULA DE CRÉDITO RURAL. DECRETO-LEI Nº 167/67. ADMISSIBILIDADE. 1. A capitalização de juros em periodicidade inferior à anual é admitida nas cédulas de crédito rural, desde que expressamente pactuada. 2. A incorporação de juros vencidos ao principal de novo contrato, sem expressa previsão contratual e sem autorização do devedor, configura capitalização indevida passível de revisão judicial.`,
    referencia: "(STJ - REsp 1.286.698/RS, Rel. Ministro ANTONIO CARLOS FERREIRA, Segunda Seção, julgado em 13/03/2013, DJe 08/04/2013 - Recurso Repetitivo)",
  },
  {
    tribunal: "STJ",
    numero: "REsp 1.061.530/RS",
    ementa: `RECURSO ESPECIAL. SISTEMA FINANCEIRO NACIONAL. REVISÃO CONTRATUAL. ONEROSIDADE EXCESSIVA. 1. A revisão das cláusulas contratuais abusivas é admissível com fundamento no art. 478 do Código Civil e nos princípios da boa-fé objetiva e da função social do contrato. 2. A renovação sucessiva de contratos de crédito rural com incorporação de encargos ao novo principal caracteriza prática abusiva passível de revisão judicial, com restituição dos valores cobrados a maior.`,
    referencia: "(STJ - REsp 1.061.530/RS, Rel. Ministra NANCY ANDRIGHI, Segunda Seção, julgado em 22/10/2008, DJe 03/04/2009 - Recurso Repetitivo)",
  },
  {
    tribunal: "STJ",
    numero: "REsp 1.509.057/RS",
    ementa: `RECURSO ESPECIAL. CRÉDITO RURAL. REFINANCIAMENTO. NOVAÇÃO. INCORPORAÇÃO DE ENCARGOS. 1. A novação de contrato de crédito rural com incorporação de juros vencidos ao novo principal configura capitalização de juros, vedada pelo Decreto nº 22.626/33 quando não expressamente autorizada pelo CMN. 2. O produtor rural tem direito à revisão do contrato com expurgo dos encargos indevidamente incorporados ao principal, recalculando-se o saldo devedor com as taxas legais máximas.`,
    referencia: "(STJ - REsp 1.509.057/RS, Rel. Ministro PAULO DE TARSO SANSEVERINO, Terceira Turma, julgado em 14/06/2016, DJe 01/07/2016)",
  },
  {
    tribunal: "TRF-4",
    numero: "AC 5003210-21.2018.4.04.7112",
    ementa: `APELAÇÃO CÍVEL. CRÉDITO RURAL. OPERAÇÃO MATA-MATA. REFINANCIAMENTO SUCESSIVO. CAPITALIZAÇÃO DE JUROS. NULIDADE. 1. Configura prática abusiva a realização de sucessivos refinanciamentos de crédito rural com incorporação de juros vencidos ao novo principal, sem que o produtor rural tenha recebido novos recursos. 2. A operação "mata-mata" resulta em capitalização composta de juros, vedada pelo ordenamento jurídico quando não expressamente autorizada. 3. O saldo devedor deve ser recalculado com expurgo dos encargos indevidamente capitalizados, aplicando-se a taxa legal máxima de 12% ao ano.`,
    referencia: "(TRF-4 - AC 5003210-21.2018.4.04.7112, Rel. Des. Federal CÂNDIDO ALFREDO SILVA LEAL JÚNIOR, 3ª Turma, julgado em 22/05/2019, DJe 28/05/2019)",
  },
];

// ─── Análise Automática da Cadeia ─────────────────────────────────────────────

/**
 * Analisa automaticamente uma cadeia de contratos para detectar irregularidades
 */
export function analisarCadeiaContratual(contratos: ContratoNaCadeia[]): ResultadoAnaliseCadeia {
  const ordenados = [...contratos].sort((a, b) => a.ordem - b.ordem);
  const alertasGerais: AlertaCadeia[] = [];
  const analiseContratos: ResultadoAnaliseCadeia["analiseContratos"] = [];

  let encargosIncorporadosTotal = 0;
  let mataMataDetectado = false;
  let capitalizacaoIndevidaDetectada = false;
  let taxaAcimaLegalDetectada = false;

  const valorOriginalFinanciado = ordenados[0]?.valorContrato ?? 0;
  const valorAtualDivida = ordenados[ordenados.length - 1]?.valorContrato ?? 0;

  for (let i = 0; i < ordenados.length; i++) {
    const contrato = ordenados[i];
    const anterior = i > 0 ? ordenados[i - 1] : null;
    const alertasContrato: AlertaCadeia[] = [];
    let capitalicaoDetectada = false;
    let mataMataNoContrato = false;
    let percentualAumentoSobreAnterior: number | undefined;

    // ── Verificar taxa acima do limite legal ──
    if (contrato.taxaJurosAnual > 12) {
      taxaAcimaLegalDetectada = true;
      alertasContrato.push({
        tipo: "critico",
        codigo: "TAXA_ACIMA_LEGAL",
        titulo: "Taxa de Juros Acima do Limite Legal",
        descricao: `O contrato nº ${contrato.numeroContrato} prevê taxa de juros remuneratórios de ${contrato.taxaJurosAnual.toFixed(2)}% a.a., superior ao limite legal de 12% a.a. estabelecido pelo Decreto nº 22.626/33 (Lei de Usura) e pela Súmula 382 do STJ.`,
        fundamentacao: "Decreto nº 22.626/33, art. 1º; Súmula 382/STJ; REsp 1.348.081/RS",
        contratosAfetados: [contrato.ordem],
      });
    }

    // ── Verificar taxa de mora acima do limite ──
    if (contrato.taxaJurosMora && contrato.taxaJurosMora > 1) {
      alertasContrato.push({
        tipo: "critico",
        codigo: "MORA_ACIMA_LEGAL",
        titulo: "Taxa de Mora Acima do Limite Legal",
        descricao: `O contrato nº ${contrato.numeroContrato} prevê taxa de juros de mora de ${contrato.taxaJurosMora.toFixed(2)}% a.a., superior ao limite legal de 1% a.a. previsto no art. 5º, parágrafo único, do Decreto-Lei nº 167/67.`,
        fundamentacao: "Decreto-Lei nº 167/67, art. 5º, parágrafo único; REsp 1.509.057/RS",
        contratosAfetados: [contrato.ordem],
      });
    }

    // ── Verificar operação mata-mata ──
    // Melhoria 8: o alerta de mata-mata é condicionado ao comportamento do novo principal:
    //   • Novo valor > anterior             → Mata-mata CLARO (aumento do principal: incorporou encargos + juros)
    //   • Novo valor entre 90% e 100% do anterior → Mata-mata SUSPEITO (manteve valor sem redução real)
    //   • Novo valor < 90% do anterior      → Renegociação com desconto expressivo (quitação parcial legítima)
    if (anterior && (contrato.tipo === "refinanciamento" || contrato.tipo === "novacao")) {
      percentualAumentoSobreAnterior = ((contrato.valorContrato - anterior.valorContrato) / anterior.valorContrato) * 100;

      const tipoLabel = contrato.tipo === "refinanciamento" ? "refinanciamento" : "novação";
      const fmtNovo = contrato.valorContrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      const fmtAnterior = anterior.valorContrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

      if (contrato.valorContrato > anterior.valorContrato) {
        // Caso 1: novo principal MAIOR que o anterior — mata-mata inequívoco
        mataMataNoContrato = true;
        mataMataDetectado = true;

        alertasContrato.push({
          tipo: "critico",
          codigo: "MATA_MATA",
          titulo: "Operação Mata-Mata Detectada — Aumento do Principal",
          descricao: `O contrato nº ${contrato.numeroContrato} (${tipoLabel}) foi celebrado para quitar o contrato anterior nº ${anterior.numeroContrato}. O novo principal (R$ ${fmtNovo}) é ${percentualAumentoSobreAnterior.toFixed(2)}% MAIOR que o contrato anterior (R$ ${fmtAnterior}), evidenciando incorporação de encargos (juros vencidos, multa e/ou correção) ao novo principal. Configura anatocismo vedado pelo Decreto nº 22.626/33.`,
          fundamentacao: "AgRg no REsp 1.370.585/RS; REsp 1.286.698/RS; Decreto nº 22.626/33, art. 4º",
          contratosAfetados: [anterior.ordem, contrato.ordem],
        });

      } else if (contrato.valorContrato >= anterior.valorContrato * 0.9) {
        // Caso 2: novo principal equivalente ao anterior (variação < 10%) — mata-mata suspeito
        // O banco pode ter incorporado encargos ao mesmo tempo que concedeu pequeno desconto,
        // resultando em valor aparentemente igual mas com capitalização disfarçada.
        mataMataNoContrato = true;
        mataMataDetectado = true;

        alertasContrato.push({
          tipo: "critico",
          codigo: "MATA_MATA",
          titulo: "Operação Mata-Mata Detectada — Principal Mantido (Incorporação Provável)",
          descricao: `O contrato nº ${contrato.numeroContrato} (${tipoLabel}) foi celebrado para quitar o contrato anterior nº ${anterior.numeroContrato}. O novo principal (R$ ${fmtNovo}) é praticamente igual ao anterior (R$ ${fmtAnterior}, variação de apenas ${Math.abs(percentualAumentoSobreAnterior).toFixed(2)}%), sem redução real da dívida, indicando provável incorporação disfarçada de encargos ao novo principal. Em renegociação legítima, seria esperada uma redução expressiva do saldo.`,
          fundamentacao: "AgRg no REsp 1.370.585/RS; REsp 1.286.698/RS; Decreto nº 22.626/33, art. 4º",
          contratosAfetados: [anterior.ordem, contrato.ordem],
        });

      } else {
        // Caso 3: novo principal MENOR que 90% do anterior — renegociação com desconto legítima
        // Redução expressiva indica que houve negociação real com perdão parcial ou novo crédito
        // sem incorporação de encargos. NÃO configura mata-mata.
        alertasContrato.push({
          tipo: "informativo",
          codigo: "RENEGOCIACAO_COM_DESCONTO",
          titulo: "Renegociação com Redução de Saldo — Não Configura Mata-Mata",
          descricao: `O contrato nº ${contrato.numeroContrato} (${tipoLabel}) renovou o contrato anterior nº ${anterior.numeroContrato} com redução de ${Math.abs(percentualAumentoSobreAnterior).toFixed(2)}% no valor (de R$ ${fmtAnterior} para R$ ${fmtNovo}). A redução expressiva do novo principal indica quitação parcial legítima, novação com desconto ou renegociação sem incorporação indevida de encargos. Não configura operação mata-mata.`,
          fundamentacao: "Art. 385 do Código Civil — Novação com redução da obrigação; Art. 840 do CC — Transação",
          contratosAfetados: [anterior.ordem, contrato.ordem],
        });
      }
    }

    // ── Verificar capitalização indevida de juros ──
    if (contrato.valorEncargosIncorporados && contrato.valorEncargosIncorporados > 0) {
      capitalicaoDetectada = true;
      capitalizacaoIndevidaDetectada = true;
      encargosIncorporadosTotal += contrato.valorEncargosIncorporados;

      alertasContrato.push({
        tipo: "critico",
        codigo: "CAPITALIZACAO_INDEVIDA",
        titulo: "Capitalização Indevida de Encargos",
        descricao: `O contrato nº ${contrato.numeroContrato} incorporou R$ ${contrato.valorEncargosIncorporados.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} de encargos (juros, multas e/ou correção) ao novo principal. Esta prática configura anatocismo (juros sobre juros), vedado pelo Decreto nº 22.626/33 quando não expressamente autorizado pelo CMN.`,
        fundamentacao: "Decreto nº 22.626/33, art. 4º (anatocismo); REsp 1.286.698/RS; AgRg no REsp 1.370.585/RS",
        contratosAfetados: [contrato.ordem],
      });
    }

    // ── Verificar aumento desproporcional do principal ──
    if (anterior && contrato.valorPrincipalOriginal) {
      const saldoAnteriorInformado = contrato.valorPrincipalOriginal;
      const aumentoSobreSaldo = contrato.valorContrato - saldoAnteriorInformado;
      const percentualSobreSaldo = (aumentoSobreSaldo / saldoAnteriorInformado) * 100;

      if (percentualSobreSaldo > 20 && aumentoSobreSaldo > 0) {
        alertasContrato.push({
          tipo: "atencao",
          codigo: "AUMENTO_DESPROPORCIONAL",
          titulo: "Aumento Desproporcional do Principal",
          descricao: `O valor do novo contrato (R$ ${contrato.valorContrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}) é ${percentualSobreSaldo.toFixed(2)}% maior que o saldo devedor informado do contrato anterior (R$ ${saldoAnteriorInformado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}). A diferença de R$ ${aumentoSobreSaldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} pode indicar incorporação de encargos não autorizados.`,
          fundamentacao: "Art. 39, V do CDC; Art. 478 do CC; Art. 422 do CC (boa-fé objetiva)",
          contratosAfetados: [contrato.ordem],
        });
      }
    }

    analiseContratos.push({
      contrato,
      alertas: alertasContrato,
      capitalicaoDetectada,
      mataMataDetectado: mataMataNoContrato,
      percentualAumentoSobreAnterior,
    });
  }

  // ── Alertas gerais da cadeia ──
  if (mataMataDetectado) {
    alertasGerais.push({
      tipo: "critico",
      codigo: "CADEIA_MATA_MATA",
      titulo: "Cadeia de Operações Mata-Mata Identificada",
      descricao: `A análise identificou ${ordenados.filter(c => c.tipo === "refinanciamento" || c.tipo === "novacao").length} operação(ões) de refinanciamento/novação na cadeia contratual. Esta prática, conhecida como "mata-mata", consiste em criar novos contratos para quitar os anteriores vencidos, frequentemente incorporando encargos ao novo principal e perpetuando a dívida. O produtor rural tem direito à revisão judicial de toda a cadeia contratual.`,
      fundamentacao: "AgRg no REsp 1.370.585/RS; REsp 1.061.530/RS; AC 5003210-21.2018.4.04.7112 (TRF-4)",
      contratosAfetados: ordenados.map(c => c.ordem),
    });
  }

  if (encargosIncorporadosTotal > 0) {
    alertasGerais.push({
      tipo: "critico",
      codigo: "TOTAL_ENCARGOS_CAPITALIZADOS",
      titulo: `Total de Encargos Capitalizados: R$ ${encargosIncorporadosTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      descricao: `Ao longo da cadeia contratual, foram incorporados R$ ${encargosIncorporadosTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} de encargos (juros, multas e/ou correção) ao principal de novos contratos. Este valor deve ser expurgado do saldo devedor atual, recalculando-se a dívida com as taxas legais máximas desde o contrato original.`,
      fundamentacao: "Decreto nº 22.626/33, art. 4º; REsp 1.286.698/RS; REsp 1.509.057/RS",
      contratosAfetados: ordenados.map(c => c.ordem),
    });
  }

  const incrementoTotal = valorAtualDivida - valorOriginalFinanciado;
  const percentualIncremento = valorOriginalFinanciado > 0
    ? (incrementoTotal / valorOriginalFinanciado) * 100
    : 0;

  return {
    valorOriginalFinanciado,
    valorAtualDivida,
    incrementoTotal,
    percentualIncremento,
    encargosIncorporadosTotal,
    analiseContratos,
    alertasGerais,
    mataMataDetectado,
    capitalizacaoIndevidaDetectada,
    taxaAcimaLegalDetectada,
  };
}

// ─── Gerador de Laudo da Cadeia Contratual ────────────────────────────────────

export interface DadosLaudoCadeia {
  nomeCadeia: string;
  banco: string;
  nomeProdutor: string;
  nomeAdvogado?: string;
  oabAdvogado?: string;
  nomePerito?: string;
  categoriaPerito?: string;
  registroPerito?: string;
  contratos: ContratoNaCadeia[];
  analise: ResultadoAnaliseCadeia;
}

export async function gerarLaudoCadeiaContratual(dados: DadosLaudoCadeia): Promise<string> {
  const dataEmissao = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const resumoContratos = dados.contratos
    .sort((a, b) => a.ordem - b.ordem)
    .map(c => `
Contrato ${c.ordem} — ${c.tipo.toUpperCase()}
  Número: ${c.numeroContrato}
  Data: ${c.dataContratacao} | Vencimento: ${c.dataVencimento}
  Modalidade: ${c.modalidade} | Taxa: ${c.taxaJurosAnual}% a.a.
  Valor: R$ ${c.valorContrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
  ${c.valorPrincipalOriginal ? `Saldo anterior: R$ ${c.valorPrincipalOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""}
  ${c.valorEncargosIncorporados ? `Encargos incorporados: R$ ${c.valorEncargosIncorporados.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""}
  ${c.observacoes ? `Observações: ${c.observacoes}` : ""}
    `.trim()
    ).join("\n\n");

  const alertasTexto = [
    ...dados.analise.alertasGerais,
    ...dados.analise.analiseContratos.flatMap(a => a.alertas),
  ].map(a => `[${a.tipo.toUpperCase()}] ${a.titulo}: ${a.descricao}\nFundamentação: ${a.fundamentacao}`).join("\n\n");

  const prompt = `Você é um especialista em Direito Agrário e Crédito Rural. Gere um LAUDO TÉCNICO-JURÍDICO completo sobre uma cadeia de contratos de crédito rural com possível prática de "operação mata-mata" e capitalização indevida de juros.

DADOS DA CADEIA CONTRATUAL:
Produtor Rural: ${dados.nomeProdutor}
Banco/Instituição: ${dados.banco}
Identificação da Cadeia: ${dados.nomeCadeia}
Data de Emissão do Laudo: ${dataEmissao}

CONTRATOS DA CADEIA:
${resumoContratos}

ANÁLISE AUTOMÁTICA — IRREGULARIDADES DETECTADAS:
- Valor original financiado: R$ ${dados.analise.valorOriginalFinanciado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Valor atual da dívida: R$ ${dados.analise.valorAtualDivida.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Incremento total da dívida: R$ ${dados.analise.incrementoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${dados.analise.percentualIncremento.toFixed(2)}%)
- Encargos indevidamente incorporados: R$ ${dados.analise.encargosIncorporadosTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Operação mata-mata detectada: ${dados.analise.mataMataDetectado ? "SIM ⚠️" : "Não"}
- Capitalização indevida detectada: ${dados.analise.capitalizacaoIndevidaDetectada ? "SIM ⚠️" : "Não"}
- Taxa acima do limite legal: ${dados.analise.taxaAcimaLegalDetectada ? "SIM ⚠️" : "Não"}

ALERTAS DETALHADOS:
${alertasTexto}

JURISPRUDÊNCIA APLICÁVEL:
${JURISPRUDENCIA_MATA_MATA.map(j => `${j.numero}: ${j.ementa}\n${j.referencia}`).join("\n\n")}

Gere o laudo com as seguintes seções obrigatórias:

1. IDENTIFICAÇÃO DAS PARTES E DA CADEIA CONTRATUAL
2. HISTÓRICO DA OPERAÇÃO DE CRÉDITO (descreva cada contrato e como se relacionam)
3. ANÁLISE DA CADEIA CONTRATUAL
   3.1 Caracterização da Operação Mata-Mata (se detectada)
   3.2 Análise da Capitalização Indevida de Juros
   3.3 Análise das Taxas Praticadas vs. Limites Legais
   3.4 Cálculo do Valor Original vs. Valor Atual da Dívida
4. FUNDAMENTAÇÃO JURÍDICA
   4.1 Da Vedação ao Anatocismo (Decreto nº 22.626/33, art. 4º)
   4.2 Da Abusividade da Operação Mata-Mata (CDC, art. 39, V)
   4.3 Da Onerosidade Excessiva (CC, art. 478)
   4.4 Da Boa-Fé Objetiva (CC, art. 422)
   4.5 Jurisprudência do STJ e TRFs (cite os processos reais com ementas completas)
5. MEMÓRIA DE CÁLCULO
   5.1 Recálculo do saldo devedor expurgando os encargos indevidamente capitalizados
   5.2 Saldo devedor correto com taxa legal máxima de 12% a.a.
   5.3 Valor a ser restituído ao produtor rural
6. CONCLUSÃO E RECOMENDAÇÕES TÉCNICAS

O laudo deve ser formal, técnico e juridicamente preciso. Use linguagem forense. Cite os números dos processos e as ementas completas. Seja específico sobre os valores e percentuais.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system" as const,
        content: "Você é um especialista em Direito Agrário, Crédito Rural e análise de contratos bancários com 20 anos de experiência. Sua função é produzir laudos técnico-jurídicos precisos sobre cadeias contratuais de crédito rural, com foco em detecção de práticas abusivas como operação mata-mata, capitalização indevida e taxas ilegais. Sempre cite os números reais dos processos e as ementas completas no formato forense.",
      },
      { role: "user" as const, content: prompt },
    ],
  });

  const textoLaudo = String(response.choices?.[0]?.message?.content ?? "Erro ao gerar laudo.");

  // Adicionar bloco de assinatura do perito se disponível
  const blocoAssinatura = dados.nomePerito ? `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}

_____________________________________________
${dados.nomePerito}
${dados.categoriaPerito ? getCategoriaLabel(dados.categoriaPerito) : "Perito Técnico"}
${dados.registroPerito ?? ""}

${dados.nomeAdvogado ? `_____________________________________________
${dados.nomeAdvogado}
Advogado — ${dados.oabAdvogado ?? "OAB"}` : ""}
` : "";

  return textoLaudo + blocoAssinatura;
}

function getCategoriaLabel(categoria: string): string {
  const labels: Record<string, string> = {
    contador: "Contador — CRC",
    economista: "Economista — CORECON",
    administrador: "Administrador de Empresas — CRA",
    tecnico_contabil: "Técnico em Contabilidade — CRC",
    outro: "Perito Técnico",
  };
  return labels[categoria] ?? "Perito Técnico";
}

// ─── Exportar jurisprudência para uso externo ─────────────────────────────────
export { JURISPRUDENCIA_MATA_MATA };
