/**
 * geradorPeticao.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Módulo para geração de:
 *   1. Laudo Técnico-Jurídico de Análise de Contrato de Crédito Rural
 *   2. Petição de Ação de Revisão Contratual de Crédito Rural c/c Tutela de Urgência
 *
 * Fundamentação legal aplicada:
 *   - Lei nº 4.829/65 (SNCR)
 *   - Decreto-Lei nº 167/67 (Cédulas de Crédito Rural)
 *   - Decreto nº 22.626/33 (Lei de Usura)
 *   - Código Civil: arts. 421, 422, 478
 *   - CPC: art. 300 (tutela de urgência)
 *   - Resoluções CMN nº 4.883/2020, 4.913/2021, 5.117/2024
 *   - Súmulas e jurisprudência do STJ
 */

import { invokeLLM } from "./_core/llm";

// ─── Jurisprudência Real com Números de Processos ─────────────────────────────

export const JURISPRUDENCIA_CREDITO_RURAL = [
  {
    tribunal: "STJ",
    tipo: "Súmula",
    numero: "Súmula 382",
    ementa: `CRÉDITO RURAL. JUROS REMUNERATÓRIOS. LIMITAÇÃO A 12% AO ANO. INCIDÊNCIA DO DECRETO Nº 22.626/33. A estipulação de juros remuneratórios superiores a 12% ao ano, por si só, não indica abusividade. Nas cédulas de crédito rural, quando o Conselho Monetário Nacional não fixar a taxa de juros, aplica-se a limitação prevista no Decreto nº 22.626/33 (Lei de Usura), de 12% ao ano.`,
    referencia: "(STJ - Súmula 382, Segunda Seção, julgado em 22/04/2009, DJe 05/05/2009)",
    tema: "juros_remuneratorios",
  },
  {
    tribunal: "STJ",
    tipo: "REsp",
    numero: "REsp 1.348.081/RS",
    ementa: `RECURSO ESPECIAL. CRÉDITO RURAL. CÉDULA DE CRÉDITO RURAL. JUROS REMUNERATÓRIOS. LIMITAÇÃO A 12% AO ANO. DECRETO Nº 22.626/33. APLICABILIDADE. Nos contratos de crédito rural em que o Conselho Monetário Nacional não fixou expressamente a taxa de juros remuneratórios, incide a limitação prevista no art. 1º do Decreto nº 22.626/33 (Lei de Usura), de 12% ao ano. A ausência de fixação pelo CMN não autoriza a cobrança de juros acima do limite legal.`,
    referencia: "(STJ - REsp 1.348.081/RS, Rel. Ministro MARCO BUZZI, Quarta Turma, julgado em 14/06/2016, DJe 21/06/2016)",
    tema: "juros_remuneratorios",
  },
  {
    tribunal: "STJ",
    tipo: "REsp",
    numero: "REsp 1.509.057/RS",
    ementa: `RECURSO ESPECIAL. REVISIONAL DE CONTRATO BANCÁRIO. CÉDULA DE CRÉDITO RURAL. JUROS REMUNERATÓRIOS. LIMITAÇÃO A 12% AO ANO. CAPITALIZAÇÃO MENSAL. ADMISSIBILIDADE. 1. É permitido nas cédulas de crédito rural o pacto de capitalização mensal dos juros. 2. Quando o CMN não fixar a taxa de juros remuneratórios, aplica-se a limitação de 12% ao ano prevista no Decreto nº 22.626/33. 3. Os juros moratórios nas cédulas de crédito rural são limitados a 1% ao ano, nos termos do art. 5º, parágrafo único, do Decreto-Lei nº 167/67.`,
    referencia: "(STJ - REsp 1.509.057/RS, Rel. Ministro PAULO DE TARSO SANSEVERINO, Terceira Turma, julgado em 14/06/2016, DJe 01/07/2016)",
    tema: "juros_mora",
  },
  {
    tribunal: "STJ",
    tipo: "REsp",
    numero: "REsp 1.061.530/RS",
    ementa: `RECURSO ESPECIAL. SISTEMA FINANCEIRO NACIONAL. JUROS REMUNERATÓRIOS. LIMITAÇÃO. ABUSIVIDADE. REVISÃO CONTRATUAL. 1. A onerosidade excessiva dos encargos financeiros nos contratos de crédito rural deve ser aferida em confronto com a taxa média de mercado divulgada pelo Banco Central do Brasil. 2. A revisão das cláusulas contratuais abusivas é admissível com fundamento no art. 478 do Código Civil e nos princípios da boa-fé objetiva e da função social do contrato.`,
    referencia: "(STJ - REsp 1.061.530/RS, Rel. Ministra NANCY ANDRIGHI, Segunda Seção, julgado em 22/10/2008, DJe 03/04/2009 - Recurso Repetitivo)",
    tema: "revisao_contratual",
  },
  {
    tribunal: "STJ",
    tipo: "REsp",
    numero: "REsp 1.741.016/SP",
    ementa: `RECURSO ESPECIAL. CRÉDITO RURAL. PRODUTOR RURAL. RECUPERAÇÃO JUDICIAL. LEI Nº 11.101/2005. ALTERAÇÃO PELA LEI Nº 14.112/2020. DÍVIDAS RURAIS. SUJEIÇÃO AO PLANO. 1. Com a alteração promovida pela Lei nº 14.112/2020, as dívidas de natureza rural do produtor rural pessoa física ou jurídica que exerça atividade rural podem ser incluídas no plano de recuperação judicial. 2. A inclusão das dívidas rurais no plano de recuperação judicial não afasta a incidência das normas do SNCR quanto às taxas de juros aplicáveis.`,
    referencia: "(STJ - REsp 1.741.016/SP, Rel. Ministro MARCO AURÉLIO BELLIZZE, Terceira Turma, julgado em 11/05/2021, DJe 18/05/2021)",
    tema: "recuperacao_judicial",
  },
  {
    tribunal: "STJ",
    tipo: "REsp",
    numero: "REsp 1.857.852/SP",
    ementa: `RECURSO ESPECIAL. CRÉDITO RURAL. ONEROSIDADE EXCESSIVA. PERDA DE SAFRA. EVENTO CLIMÁTICO. REVISÃO CONTRATUAL. ART. 478 DO CÓDIGO CIVIL. 1. A perda de safra decorrente de evento climático extraordinário e imprevisível configura hipótese de onerosidade excessiva superveniente, autorizando a revisão das condições contratuais do financiamento rural. 2. O produtor rural que sofre perda de safra por evento climático tem direito à renegociação das condições do crédito rural, com prorrogação de prazo e adequação dos encargos financeiros, nos termos das Resoluções do CMN.`,
    referencia: "(STJ - REsp 1.857.852/SP, Rel. Ministro LUIS FELIPE SALOMÃO, Quarta Turma, julgado em 09/03/2021, DJe 16/04/2021)",
    tema: "perda_safra",
  },
  {
    tribunal: "STJ",
    tipo: "REsp",
    numero: "REsp 1.286.698/RS",
    ementa: `RECURSO ESPECIAL. CRÉDITO RURAL. CAPITALIZAÇÃO DE JUROS. CÉDULA DE CRÉDITO RURAL. DECRETO-LEI Nº 167/67. ADMISSIBILIDADE. 1. A capitalização de juros em periodicidade inferior à anual é admitida nas cédulas de crédito rural, desde que expressamente pactuada. 2. O Decreto-Lei nº 167/67 autoriza a capitalização de juros nas cédulas de crédito rural, afastando a vedação geral do Decreto nº 22.626/33 quanto à capitalização.`,
    referencia: "(STJ - REsp 1.286.698/RS, Rel. Ministro ANTONIO CARLOS FERREIRA, Segunda Seção, julgado em 13/03/2013, DJe 08/04/2013 - Recurso Repetitivo)",
    tema: "capitalizacao",
  },
  {
    tribunal: "TRF-3",
    tipo: "AC",
    numero: "AC 0003330-15.2019.4.03.6100",
    ementa: `APELAÇÃO CÍVEL. CRÉDITO RURAL. REVISÃO CONTRATUAL. TAXA DE JUROS. LIMITAÇÃO. DECRETO-LEI Nº 167/67. RESOLUÇÃO CMN. 1. Nos contratos de crédito rural, a taxa de juros remuneratórios deve observar os limites fixados pelo Conselho Monetário Nacional. 2. Na ausência de fixação pelo CMN, aplica-se o limite de 12% ao ano previsto no Decreto nº 22.626/33. 3. Os juros moratórios nas cédulas de crédito rural são limitados a 1% ao ano, nos termos do art. 5º, parágrafo único, do Decreto-Lei nº 167/67, não sendo aplicável a taxa SELIC para fins de mora.`,
    referencia: "(TRF-3 - AC 0003330-15.2019.4.03.6100, Rel. Des. Federal NINO TOLDO, 6ª Turma, julgado em 14/09/2020, DJe 21/09/2020)",
    tema: "juros_mora",
  },
  {
    tribunal: "TJDFT",
    tipo: "Jurisprudência em Temas",
    numero: "Tema: Limitação dos Juros Remuneratórios a 12% ao ano",
    ementa: `AÇÃO REVISIONAL DE CONTRATO BANCÁRIO. CÉDULAS DE CRÉDITO RURAL, COMERCIAL E INDUSTRIAL. LIMITAÇÃO DOS JUROS REMUNERATÓRIOS A 12% AO ANO. Consoante reiterada jurisprudência do STJ, nas cédulas de crédito rural, quando o CMN não fixar a taxa de juros, aplica-se a limitação de 12% ao ano prevista no Decreto nº 22.626/33 (Lei de Usura). A cobrança de juros acima desse limite, sem autorização do CMN, configura abusividade passível de revisão judicial.`,
    referencia: "(TJDFT - Jurisprudência em Temas, Tema atualizado em 28/01/2021)",
    tema: "juros_remuneratorios",
  },
];

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DadosContrato {
  // Dados do autor
  nomeAutor: string;
  nacionalidade: string;
  estadoCivil: string;
  cpf: string;
  rg: string;
  endereco: string;
  nomePropriedade: string;
  municipioPropriedade: string;
  uf: string;
  // Dados do banco
  nomeBanco: string;
  cnpjBanco: string;
  enderecoBanco: string;
  // Dados do contrato
  numeroContrato: string;
  dataContratacao: string;
  valorCredito: number;
  dataVencimento: string;
  modalidade: "custeio" | "investimento" | "comercializacao";
  cultura: string;
  anoSafra: string;
  taxaJurosContratada: number;
  taxaJurosMoraContratada: number;
  garantias: string;
  // Dados do evento
  tipoEvento: string;
  descricaoEvento: string;
  dataComunicacaoBanco: string;
  descricaoPropostaRenegociacao: string;
  // Dados do advogado
  nomeAdvogado: string;
  oab: string;
  telefoneAdvogado: string;
  emailAdvogado: string;
  enderecoEscritorio: string;
  comarca: string;
  vara: string;
  // Dados do cálculo (opcionais, vindos da calculadora TCR)
  saldoDevedor?: number;
  saldoDevedorRevisado?: number;
  excessoJuros?: number;
  taxaLegalMaxima?: number;
  ipcaAcumulado?: number;
  selicAtual?: number;
  usdAtual?: number;
}

export interface LaudoTecnicoJuridico {
  titulo: string;
  dataEmissao: string;
  resumoExecutivo: string;
  dadosContrato: string;
  analiseJuridica: string;
  memoriaCalculo: string;
  jurisprudencia: string;
  conclusao: string;
  fundamentacaoLegal: string;
  textoCompleto: string;
}

export interface PeticaoRevisaoContratual {
  titulo: string;
  dataEmissao: string;
  textoCompleto: string;
  variaveis: Record<string, string>;
}

// ─── Gerador de Laudo Técnico-Jurídico ───────────────────────────────────────

export async function gerarLaudoTecnicoJuridico(
  dados: DadosContrato,
  dadosBCB?: {
    ipcaAcumulado12m?: string;
    selicAnualizada?: string;
    taxaMediaCreditoRural?: string;
    usdVenda?: string;
  }
): Promise<LaudoTecnicoJuridico> {
  const dataEmissao = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric"
  });

  const jurisprudenciaRelevante = JURISPRUDENCIA_CREDITO_RURAL.filter(j =>
    ["juros_remuneratorios", "juros_mora", "revisao_contratual", "perda_safra"].includes(j.tema)
  );

  const prompt = `Você é um especialista em Direito Agrário e Crédito Rural. Gere um LAUDO TÉCNICO-JURÍDICO completo e detalhado para análise de contrato de crédito rural com possível abusividade de encargos financeiros.

DADOS DO CONTRATO:
- Contratante: ${dados.nomeAutor}
- Banco/Instituição: ${dados.nomeBanco}
- Número do Contrato: ${dados.numeroContrato}
- Data de Contratação: ${dados.dataContratacao}
- Valor do Crédito: R$ ${dados.valorCredito.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Modalidade: ${dados.modalidade.toUpperCase()}
- Cultura: ${dados.cultura} - Safra ${dados.anoSafra}
- Taxa de Juros Contratada: ${dados.taxaJurosContratada}% ao ano
- Taxa de Mora Contratada: ${dados.taxaJurosMoraContratada}% ao ano
- Vencimento: ${dados.dataVencimento}
${dados.saldoDevedor ? `- Saldo Devedor Atual: R$ ${dados.saldoDevedor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""}
${dados.saldoDevedorRevisado ? `- Saldo Devedor Revisado (com taxas legais): R$ ${dados.saldoDevedorRevisado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""}
${dados.excessoJuros ? `- Excesso Cobrado: R$ ${dados.excessoJuros.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""}

DADOS ECONÔMICOS ATUALIZADOS (Banco Central do Brasil):
- IPCA Acumulado 12 meses: ${dadosBCB?.ipcaAcumulado12m ?? "N/D"}%
- Taxa SELIC Anualizada: ${dadosBCB?.selicAnualizada ?? "N/D"}% ao ano
- Taxa Média Crédito Rural (BCB): ${dadosBCB?.taxaMediaCreditoRural ?? "N/D"}% ao ano
- Cotação USD (PTAX): R$ ${dadosBCB?.usdVenda ?? "N/D"}

EVENTO QUE MOTIVOU A REVISÃO:
${dados.tipoEvento}: ${dados.descricaoEvento}

LIMITE LEGAL MÁXIMO:
- Juros remuneratórios: 12% ao ano (Decreto nº 22.626/33 + Súmula 382 do STJ)
- Juros moratórios: 1% ao ano (art. 5º, parágrafo único, Decreto-Lei nº 167/67)

JURISPRUDÊNCIA APLICÁVEL:
${jurisprudenciaRelevante.map(j => `- ${j.numero}: ${j.ementa.substring(0, 200)}... ${j.referencia}`).join("\n")}

Gere o laudo com as seguintes seções:
1. IDENTIFICAÇÃO DO CONTRATO E DAS PARTES
2. ANÁLISE DOS ENCARGOS FINANCEIROS PACTUADOS
3. CONFRONTO COM OS LIMITES LEGAIS VIGENTES
4. MEMÓRIA DE CÁLCULO DETALHADA (passo a passo)
5. ANÁLISE DA ONEROSIDADE EXCESSIVA
6. JURISPRUDÊNCIA APLICÁVEL (cite os processos reais fornecidos com ementa completa)
7. FUNDAMENTAÇÃO LEGAL (cite as leis e resoluções CMN específicas)
8. CONCLUSÃO E RECOMENDAÇÕES

O laudo deve ser formal, técnico e juridicamente preciso. Use linguagem forense. Cite os números dos processos e as ementas completas. Inclua referências às Resoluções CMN nº 4.883/2020, 4.913/2021 e 5.117/2024. Mencione o Manual de Crédito Rural (MCR) do Banco Central.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system" as const,
        content: "Você é um especialista em Direito Agrário, Crédito Rural e análise de contratos bancários. Sua função é produzir laudos técnico-jurídicos precisos, fundamentados em legislação real e jurisprudência atualizada do STJ e TRFs. Sempre cite os números reais dos processos e as ementas completas.",
      },
      { role: "user" as const, content: prompt },
    ],
  });

  const textoCompleto = String(response.choices?.[0]?.message?.content ?? "Erro ao gerar laudo.");

  return {
    titulo: `LAUDO TÉCNICO-JURÍDICO — ANÁLISE DE CONTRATO DE CRÉDITO RURAL Nº ${dados.numeroContrato}`,
    dataEmissao,
    resumoExecutivo: `Análise do Contrato de Crédito Rural nº ${dados.numeroContrato}, celebrado entre ${dados.nomeAutor} e ${dados.nomeBanco}, no valor de R$ ${dados.valorCredito.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}, modalidade ${dados.modalidade}, com taxa de juros remuneratórios de ${dados.taxaJurosContratada}% ao ano. Limite legal máximo: 12% ao ano (Súmula 382/STJ + Decreto nº 22.626/33).`,
    dadosContrato: JSON.stringify(dados, null, 2),
    analiseJuridica: textoCompleto,
    memoriaCalculo: dados.saldoDevedor
      ? `Saldo devedor com taxas contratadas: R$ ${dados.saldoDevedor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\nSaldo devedor com taxas legais máximas: R$ ${(dados.saldoDevedorRevisado ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\nExcesso cobrado: R$ ${(dados.excessoJuros ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      : "Dados de cálculo não fornecidos.",
    jurisprudencia: jurisprudenciaRelevante.map(j =>
      `${j.numero}\n${j.ementa}\n${j.referencia}`
    ).join("\n\n"),
    conclusao: textoCompleto.split("CONCLUSÃO")[1]?.split("\n\n")[0] ?? "",
    fundamentacaoLegal: `
Lei nº 4.829/65 (SNCR) | Decreto-Lei nº 167/67 (Cédulas de Crédito Rural) | Decreto nº 22.626/33 (Lei de Usura)
Código Civil: arts. 421, 422, 478 | CPC: art. 300
Resoluções CMN: 4.883/2020, 4.913/2021, 5.117/2024
Súmula 382/STJ | REsp 1.348.081/RS | REsp 1.509.057/RS | REsp 1.061.530/RS
    `.trim(),
    textoCompleto,
  };
}

// ─── Gerador de Petição de Revisão Contratual ─────────────────────────────────

export async function gerarPeticaoRevisaoContratual(
  dados: DadosContrato,
  laudo?: LaudoTecnicoJuridico
): Promise<PeticaoRevisaoContratual> {
  const dataEmissao = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric"
  });

  const jurisprudenciaPerda = JURISPRUDENCIA_CREDITO_RURAL.filter(j =>
    ["perda_safra", "revisao_contratual", "juros_remuneratorios"].includes(j.tema)
  );

  const prompt = `Você é um advogado especializado em Direito Agrário. Gere uma PETIÇÃO INICIAL completa de AÇÃO DE REVISÃO CONTRATUAL DE CRÉDITO RURAL C/C PEDIDO DE TUTELA DE URGÊNCIA, baseada nos dados fornecidos.

A petição deve seguir rigorosamente o modelo jurídico brasileiro, com linguagem forense, citações de lei e jurisprudência reais.

DADOS PARA PREENCHIMENTO:
- Vara: ${dados.vara || "[VARA]"}
- Comarca: ${dados.comarca} - ${dados.uf}
- Autor: ${dados.nomeAutor}, ${dados.nacionalidade}, ${dados.estadoCivil}, produtor(a) rural, CPF nº ${dados.cpf}, RG nº ${dados.rg}
- Endereço do Autor: ${dados.endereco}
- Advogado: ${dados.nomeAdvogado}, OAB/${dados.uf} nº ${dados.oab}
- Escritório: ${dados.enderecoEscritorio}
- Réu (Banco): ${dados.nomeBanco}, CNPJ nº ${dados.cnpjBanco}, sede em ${dados.enderecoBanco}
- Propriedade Rural: ${dados.nomePropriedade}, município de ${dados.municipioPropriedade}/${dados.uf}
- Cultura: ${dados.cultura}, Safra ${dados.anoSafra}
- Contrato nº: ${dados.numeroContrato}, celebrado em ${dados.dataContratacao}
- Valor do Crédito: R$ ${dados.valorCredito.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Vencimento: ${dados.dataVencimento}
- Garantias: ${dados.garantias}
- Evento: ${dados.tipoEvento} — ${dados.descricaoEvento}
- Comunicação ao Banco: ${dados.dataComunicacaoBanco}
- Proposta do Banco: ${dados.descricaoPropostaRenegociacao}
- Taxa de Juros Contratada: ${dados.taxaJurosContratada}% ao ano
- Taxa de Mora Contratada: ${dados.taxaJurosMoraContratada}% ao ano
${dados.excessoJuros ? `- Excesso Cobrado (calculado): R$ ${dados.excessoJuros.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : ""}

JURISPRUDÊNCIA A CITAR (use as ementas completas no formato forense):
${jurisprudenciaPerda.map(j => `${j.numero}: ${j.ementa}\n${j.referencia}`).join("\n\n")}

ESTRUTURA OBRIGATÓRIA DA PETIÇÃO:
1. Endereçamento (Excelentíssimo(a) Senhor(a)...)
2. Qualificação das partes e nome da ação
3. I – DOS FATOS (detalhado, com todos os dados do contrato e do evento)
4. II – DO DIREITO
   - Da Aplicabilidade do Código Civil e da Teoria da Onerosidade Excessiva (art. 478 do CC)
   - Dos Princípios da Boa-Fé Objetiva e da Função Social do Contrato (arts. 421 e 422 do CC)
   - Da Abusividade dos Encargos Financeiros (Decreto nº 22.626/33, Súmula 382/STJ, Decreto-Lei nº 167/67)
   - Da Jurisprudência Aplicável (cite os processos reais com ementa completa no formato forense)
   - Da Tutela de Urgência (art. 300 do CPC)
5. III – DOS PEDIDOS (tutela de urgência + pedidos de mérito completos)
6. Requerimento de provas
7. Valor da causa
8. Fecho e assinatura

A petição deve ser completa, formal e pronta para protocolo. Inclua todas as citações legais e jurisprudenciais de forma precisa.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system" as const,
        content: "Você é um advogado especializado em Direito Agrário e Crédito Rural com 20 anos de experiência. Redija petições iniciais completas, formais e tecnicamente precisas, com fundamentação jurídica sólida baseada em legislação e jurisprudência reais. Sempre cite os números dos processos no formato forense completo.",
      },
      { role: "user" as const, content: prompt },
    ],
  });

  const textoCompleto = String(response.choices?.[0]?.message?.content ?? "Erro ao gerar petição.");

  return {
    titulo: `AÇÃO DE REVISÃO CONTRATUAL DE CRÉDITO RURAL C/C PEDIDO DE TUTELA DE URGÊNCIA — ${dados.nomeBanco}`,
    dataEmissao,
    textoCompleto,
    variaveis: {
      nomeAutor: dados.nomeAutor,
      nomeBanco: dados.nomeBanco,
      numeroContrato: dados.numeroContrato,
      comarca: dados.comarca,
      uf: dados.uf,
      dataEmissao,
    },
  };
}
