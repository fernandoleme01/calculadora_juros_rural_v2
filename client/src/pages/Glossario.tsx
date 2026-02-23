import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search, BookOpen, ChevronRight, Tag, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type GlossaryCategory =
  | "taxa"
  | "contrato"
  | "amortizacao"
  | "encargo"
  | "programa"
  | "juridico"
  | "indice"
  | "orgao";

interface GlossaryTerm {
  term: string;
  definition: string;
  example?: string;
  source?: string;
  category: GlossaryCategory;
  related?: string[];
}

const categoryLabels: Record<GlossaryCategory, string> = {
  taxa: "Taxas e Juros",
  contrato: "Contratos",
  amortizacao: "Amortização",
  encargo: "Encargos",
  programa: "Programas de Crédito",
  juridico: "Termos Jurídicos",
  indice: "Índices Econômicos",
  orgao: "Órgãos e Normas",
};

const categoryColors: Record<GlossaryCategory, string> = {
  taxa: "bg-blue-100 text-blue-700 border-blue-200",
  contrato: "bg-amber-100 text-amber-700 border-amber-200",
  amortizacao: "bg-green-100 text-green-700 border-green-200",
  encargo: "bg-red-100 text-red-700 border-red-200",
  programa: "bg-purple-100 text-purple-700 border-purple-200",
  juridico: "bg-slate-100 text-slate-700 border-slate-200",
  indice: "bg-cyan-100 text-cyan-700 border-cyan-200",
  orgao: "bg-orange-100 text-orange-700 border-orange-200",
};

const terms: GlossaryTerm[] = [
  // TAXAS E JUROS
  {
    term: "TCR — Taxa de Custo Rural",
    category: "taxa",
    definition:
      "Taxa efetiva anual que representa o custo total de um financiamento rural, calculada conforme metodologia do Banco Central. Existem duas modalidades: TCR pós-fixada (vinculada ao IPCA) e TCR pré-fixada (baseada na taxa Jm e no FII). É o principal parâmetro para verificar se os juros cobrados pelo banco estão dentro dos limites legais.",
    example:
      "Um contrato de custeio agrícola com TCR de 14% ao ano está acima do limite de 12% a.a. previsto na Lei de Usura para operações sem deliberação específica do CMN.",
    source: "Res. CMN nº 4.913/2021 · MCR 2-4",
    related: ["TCRpós", "TCRpré", "FP", "FII", "Jm"],
  },
  {
    term: "TCRpós — TCR Pós-Fixada",
    category: "taxa",
    definition:
      "Modalidade de TCR vinculada ao IPCA (inflação). Calculada pela fórmula: TCRpós = FAM × (1 + FP) × (1 + FA) − 1. O FAM é o produto dos fatores mensais do IPCA no período. Usada em contratos com correção monetária pela inflação.",
    source: "Res. CMN nº 4.883/2020 · MCR 2-4",
    related: ["TCR", "FAM", "FP", "IPCA"],
  },
  {
    term: "TCRpré — TCR Pré-Fixada",
    category: "taxa",
    definition:
      "Modalidade de TCR com taxa definida no momento da contratação, sem vinculação a índices futuros. Calculada por: TCRpré = (1 + Jm/100) × FII × (1 + FP) × (1 + FA) − 1. O Jm é divulgado pelo BCB em maio de cada ano e o FII em abril.",
    source: "Res. CMN nº 4.913/2021 · MCR 2-4",
    related: ["TCR", "Jm", "FII", "FP"],
  },
  {
    term: "Jm — Taxa Prefixada do Crédito Rural",
    category: "taxa",
    definition:
      "Taxa de juros prefixada divulgada pelo Banco Central do Brasil em maio de cada ano, vigente de julho do ano corrente a junho do seguinte. Serve como base para o cálculo da TCR pré-fixada. Reflete o custo de captação dos recursos destinados ao crédito rural.",
    source: "Res. CMN nº 4.913/2021",
    related: ["TCRpré", "FII"],
  },
  {
    term: "FP — Fator de Programa",
    category: "taxa",
    definition:
      "Componente da fórmula da TCR que representa a taxa de juros específica de cada linha de crédito rural, definida pelo CMN. Varia conforme o programa (Pronaf, Pronamp, recursos livres, etc.) e a finalidade (custeio, investimento, comercialização). É expresso em decimal: FP = taxa% / 100.",
    source: "Res. CMN nº 4.883/2020 · MCR 7-1",
    related: ["TCR", "FAM", "FII"],
  },
  {
    term: "FII — Fator de Inflação Implícita",
    category: "taxa",
    definition:
      "Fator que representa a inflação esperada embutida na taxa prefixada do crédito rural. Calculado como a razão entre a taxa PRE (prefixada de mercado) e a taxa Jm. Divulgado pelo BCB em abril de cada ano. É utilizado na fórmula da TCR pré-fixada para separar o componente real da taxa do componente inflacionário.",
    source: "Res. CMN nº 4.913/2021",
    related: ["TCRpré", "Jm"],
  },
  {
    term: "FAM — Fator de Atualização Monetária",
    category: "taxa",
    definition:
      "Produto acumulado dos fatores mensais do IPCA durante o período de vigência do contrato. Representa a correção monetária pela inflação acumulada. Calculado como: FAM = Π(1 + IPCA_mensal_k/100) para cada mês k do período.",
    source: "Res. CMN nº 4.883/2020 · MCR 2-4",
    related: ["TCRpós", "IPCA"],
  },
  {
    term: "Taxa de Juros Remuneratórios",
    category: "taxa",
    definition:
      "Juros cobrados pelo banco como remuneração pelo capital emprestado durante o período normal do contrato (antes do vencimento). Nos contratos de crédito rural, o limite legal é de 12% ao ano, conforme o Decreto nº 22.626/33 (Lei de Usura), salvo deliberação específica do CMN fixando taxa diferente para a linha de crédito.",
    example:
      "Um contrato de investimento rural com taxa remuneratória de 18% ao ano pode ser objeto de ação revisional, pois excede o limite de 12% a.a. da Lei de Usura.",
    source: "Decreto nº 22.626/33, art. 1º · STJ — jurisprudência dominante",
    related: ["Taxa de Juros de Mora", "TCR", "Lei de Usura"],
  },
  {
    term: "Taxa de Juros de Mora",
    category: "taxa",
    definition:
      "Juros cobrados em razão do atraso no pagamento das parcelas (inadimplência). Nas cédulas de crédito rural (CCR, CPR, CDCA, etc.), o limite legal é de 1% ao ano, conforme o art. 5º, parágrafo único, do Decreto-Lei nº 167/67. Esta norma é de ordem pública e não pode ser afastada por convenção das partes.",
    example:
      "Se o contrato prevê juros de mora de 12% ao ano, a cláusula é nula de pleno direito, devendo ser reduzida para 1% ao ano.",
    source: "DL nº 167/67, art. 5º, parágrafo único",
    related: ["Taxa de Juros Remuneratórios", "Multa Contratual"],
  },
  {
    term: "CET — Custo Efetivo Total",
    category: "taxa",
    definition:
      "Taxa que representa o custo total do financiamento para o tomador, incluindo juros remuneratórios, IOF, TAC, TEC e todos os demais encargos. É calculada pela taxa interna de retorno (TIR) dos fluxos de pagamento. O CET deve ser informado ao cliente antes da contratação e não pode exceder os limites legais para a modalidade.",
    example:
      "Um contrato com taxa de juros de 10% a.a. pode ter CET de 15% a.a. quando somados IOF, TAC e TEC, configurando abusividade se o limite legal for 12% a.a.",
    source: "Res. CMN 3.919/2010 · Res. BCB 96/2021",
    related: ["IOF", "TAC", "TEC", "TCR"],
  },
  // CONTRATOS
  {
    term: "CCR — Cédula de Crédito Rural",
    category: "contrato",
    definition:
      "Título de crédito emitido pelo produtor rural para formalizar operações de crédito rural. Pode ser: Cédula Rural Pignoratícia (com penhor), Cédula Rural Hipotecária (com hipoteca), Cédula Rural Pignoratícia e Hipotecária ou Cédula Rural sem Garantia Real. Tem força executiva extrajudicial, permitindo execução direta sem processo de conhecimento.",
    source: "DL nº 167/67, arts. 9º a 42",
    related: ["CPR", "CDCA", "LCA"],
  },
  {
    term: "CPR — Cédula de Produto Rural",
    category: "contrato",
    definition:
      "Título de crédito emitido pelo produtor rural representando promessa de entrega futura de produtos agropecuários. Pode ser financeira (liquidação em dinheiro) ou física (entrega do produto). Muito utilizada para financiamento da produção com entrega futura da safra como garantia.",
    source: "Lei nº 8.929/94",
    related: ["CCR", "CDCA"],
  },
  {
    term: "DED/DDC — Documento de Evolução da Dívida",
    category: "contrato",
    definition:
      "Demonstrativo fornecido pelo banco que detalha toda a evolução do débito: valor original, juros cobrados, pagamentos realizados, encargos aplicados e saldo devedor atual. É obrigatório pela Res. CMN 5.004/2022. Sua recusa pelo banco pode ser combatida com petição de exibição de documentos (art. 396 do CPC) e gera presunção de veracidade dos dados do cliente.",
    source: "Res. CMN 5.004/2022 · CPC, arts. 396-399",
    related: ["CCR", "Saldo Devedor"],
  },
  {
    term: "Aditivo Contratual",
    category: "contrato",
    definition:
      "Instrumento que modifica as condições originais do contrato de crédito rural (prazo, taxa, valor, garantias). Deve ser analisado com atenção pois pode configurar capitalização indevida de juros quando encargos vencidos são incorporados ao novo principal, prática conhecida como 'mata-mata' ou rolagem de dívida.",
    source: "CC, arts. 478-480 · CDC, art. 39, I",
    related: ["Mata-Mata", "Anatocismo", "Novação"],
  },
  {
    term: "Novação",
    category: "contrato",
    definition:
      "Extinção de uma obrigação pela criação de uma nova, em substituição à anterior. No crédito rural, ocorre quando um novo contrato é firmado para quitar o anterior. Se o novo principal incluir juros e encargos do contrato antigo, pode configurar anatocismo (capitalização de juros), vedado pelo art. 591 do Código Civil.",
    source: "CC, arts. 360-367 · CC, art. 591",
    related: ["Mata-Mata", "Anatocismo", "Aditivo Contratual"],
  },
  // AMORTIZAÇÃO
  {
    term: "Tabela Price",
    category: "amortizacao",
    definition:
      "Sistema de amortização com prestações constantes (iguais) durante todo o contrato. Cada parcela é composta de amortização do principal (crescente) e juros (decrescentes). A fórmula da parcela é: PMT = PV × [i(1+i)^n] / [(1+i)^n − 1]. É o sistema mais comum no crédito rural com parcelas mensais.",
    example:
      "Em um contrato de R$ 100.000 a 12% a.a. em 12 parcelas mensais, cada parcela é de R$ 8.884,88, sendo que a primeira tem R$ 7.884,88 de amortização e R$ 1.000,00 de juros.",
    source: "MCR 2-6",
    related: ["SAC", "SAF", "Amortização", "Saldo Devedor"],
  },
  {
    term: "SAC — Sistema de Amortização Constante",
    category: "amortizacao",
    definition:
      "Sistema onde a amortização do principal é fixa em cada período (valor do contrato ÷ número de parcelas), enquanto os juros diminuem progressivamente sobre o saldo devedor. As parcelas são decrescentes. Resulta em menor custo total de juros comparado à Tabela Price.",
    example:
      "Em um contrato de R$ 100.000 a 12% a.a. em 12 parcelas, a amortização é sempre R$ 8.333,33. A primeira parcela tem R$ 9.333,33 (amortização + R$ 1.000 de juros) e a última tem R$ 8.416,67.",
    source: "MCR 2-6",
    related: ["Tabela Price", "SAF", "Amortização"],
  },
  {
    term: "SAF — Sistema de Amortização Francês Adaptado",
    category: "amortizacao",
    definition:
      "Variação da Tabela Price com ajustes para operações de crédito rural, especialmente em contratos com carência e periodicidade anual. Durante a carência, apenas os juros são pagos (sem amortização do principal). Após a carência, o saldo devedor é recalculado para as parcelas restantes.",
    source: "MCR 2-6",
    related: ["Tabela Price", "SAC", "Carência"],
  },
  {
    term: "Amortização",
    category: "amortizacao",
    definition:
      "Pagamento parcial do principal de uma dívida. Em cada parcela de um financiamento, parte do valor pago reduz o saldo devedor (amortização) e parte remunera o banco pelos juros. O ritmo de amortização varia conforme o sistema adotado (Price, SAC, SAF).",
    related: ["Tabela Price", "SAC", "SAF", "Saldo Devedor"],
  },
  {
    term: "Saldo Devedor",
    category: "amortizacao",
    definition:
      "Valor ainda devido ao banco em determinada data, após deduzidas todas as amortizações realizadas. Em ações revisionais, o saldo devedor é recalculado aplicando a taxa legal máxima, gerando o 'saldo devedor revisado' — que é comparado com o saldo cobrado pelo banco para apurar o excesso.",
    related: ["Amortização", "DED/DDC", "TCR"],
  },
  {
    term: "Carência",
    category: "amortizacao",
    definition:
      "Período inicial do contrato em que o produtor não precisa pagar parcelas de amortização do principal, pagando apenas os juros (ou nada, dependendo do contrato). Comum em financiamentos de investimento rural, onde o produtor precisa de tempo para a implantação do projeto antes de iniciar os reembolsos.",
    example:
      "Um financiamento para plantio de eucalipto pode ter 7 anos de carência, pois a colheita só ocorre após esse período.",
    source: "MCR 2-6",
    related: ["SAF", "Amortização"],
  },
  // ENCARGOS
  {
    term: "IOF — Imposto sobre Operações Financeiras",
    category: "encargo",
    definition:
      "Imposto federal incidente sobre operações de crédito, câmbio, seguros e títulos. Nas operações de crédito rural, o IOF é cobrado sobre o valor liberado do financiamento. A alíquota varia conforme o prazo e a modalidade. Integra o CET e deve ser considerado na análise de abusividade de encargos.",
    source: "Decreto nº 6.306/2007 · Res. CMN 3.919/2010",
    related: ["CET", "TAC", "TEC"],
  },
  {
    term: "TAC — Tarifa de Abertura de Crédito",
    category: "encargo",
    definition:
      "Tarifa cobrada pelo banco no momento da contratação do crédito, a título de remuneração pelos serviços de análise e concessão do crédito. Sua legalidade é controversa: o STJ tem decisões tanto favoráveis quanto contrárias à sua cobrança em contratos rurais. Quando cobrada em valor desproporcional, pode configurar abusividade.",
    source: "Res. CMN 3.919/2010 · STJ — jurisprudência",
    related: ["CET", "IOF", "TEC"],
  },
  {
    term: "TEC — Tarifa de Emissão de Carnê",
    category: "encargo",
    definition:
      "Tarifa cobrada pelo banco pela emissão do carnê ou boleto de cobrança das parcelas. Assim como a TAC, sua legalidade é questionada quando cobrada de forma abusiva ou em duplicidade com outras tarifas. Integra o CET e deve ser considerada na análise de conformidade.",
    source: "Res. CMN 3.919/2010",
    related: ["CET", "IOF", "TAC"],
  },
  {
    term: "Multa Contratual",
    category: "encargo",
    definition:
      "Penalidade prevista no contrato para o caso de inadimplência. Nos contratos de crédito rural, o limite legal é de 2% sobre o valor da dívida, conforme o art. 412 do Código Civil. Cláusulas que prevejam multa superior são nulas de pleno direito, devendo ser reduzidas ao limite legal.",
    source: "CC, art. 412",
    related: ["Taxa de Juros de Mora", "Anatocismo"],
  },
  {
    term: "Anatocismo",
    category: "encargo",
    definition:
      "Capitalização de juros sobre juros, ou seja, a cobrança de juros sobre os juros já vencidos e não pagos. É vedada nos contratos de crédito rural pelo art. 591 do Código Civil (que remete ao art. 322 do CC). A incorporação de juros ao principal em renegociações ('mata-mata') é a forma mais comum de anatocismo no crédito rural.",
    source: "CC, art. 591 · CC, art. 322 · Súmula 121 STF",
    related: ["Mata-Mata", "Novação", "Juros Compostos"],
  },
  {
    term: "Mata-Mata",
    category: "encargo",
    definition:
      "Prática de liquidar um contrato de crédito rural com os recursos de um novo contrato, incorporando ao novo principal os juros e encargos do contrato anterior. Resulta em capitalização de juros (anatocismo) vedada pelo art. 591 do CC. O nome vem da expressão popular 'matar uma dívida com outra'.",
    example:
      "Contrato 1: R$ 100.000 de principal + R$ 20.000 de juros vencidos. Contrato 2 (mata-mata): R$ 120.000 de principal. Os R$ 20.000 de juros foram capitalizados.",
    source: "CC, art. 591 · CDC, art. 39, I",
    related: ["Anatocismo", "Novação", "Aditivo Contratual"],
  },
  // PROGRAMAS DE CRÉDITO
  {
    term: "Pronaf — Programa Nacional de Fortalecimento da Agricultura Familiar",
    category: "programa",
    definition:
      "Programa governamental de crédito rural destinado a agricultores familiares, com taxas de juros subsidiadas pelo governo federal. Os beneficiários são divididos em grupos (A, B, C, D, E, V, Agroindústria, etc.) com taxas diferenciadas. O Grupo B (microcrédito) tem taxa de 3% a.a. e os demais grupos têm taxas entre 4% e 6% a.a.",
    source: "Lei nº 11.326/2006 · MCR 7-6",
    related: ["Pronamp", "FCO", "FNE", "FDA"],
  },
  {
    term: "Pronamp — Programa Nacional de Apoio ao Médio Produtor Rural",
    category: "programa",
    definition:
      "Programa de crédito rural destinado a médios produtores rurais com renda bruta anual entre R$ 360 mil e R$ 2 milhões. Oferece taxas de juros diferenciadas (menores que as do mercado livre), com recursos provenientes de fontes controladas. As taxas são definidas pelo CMN e variam conforme a finalidade.",
    source: "MCR 7-7",
    related: ["Pronaf", "FCO", "FNE"],
  },
  {
    term: "FCO — Fundo Constitucional de Financiamento do Centro-Oeste",
    category: "programa",
    definition:
      "Fundo constitucional destinado ao financiamento de atividades produtivas nos estados do Centro-Oeste (MT, MS, GO e DF). Oferece crédito rural com taxas diferenciadas para produtores da região. Administrado pelo Banco do Brasil.",
    source: "Lei nº 7.827/89 · CF, art. 159, I, c",
    related: ["FNE", "FDA", "Pronaf"],
  },
  {
    term: "FNE — Fundo Constitucional de Financiamento do Nordeste",
    category: "programa",
    definition:
      "Fundo constitucional destinado ao financiamento de atividades produtivas na região Nordeste e norte de Minas Gerais e Espírito Santo. Administrado pelo Banco do Nordeste (BNB). Oferece crédito rural com taxas subsidiadas para produtores da região.",
    source: "Lei nº 7.827/89 · CF, art. 159, I, c",
    related: ["FCO", "FDA", "Pronaf"],
  },
  {
    term: "Moderfrota",
    category: "programa",
    definition:
      "Programa de financiamento para aquisição de tratores, colheitadeiras e implementos agrícolas. Oferece taxas de juros subsidiadas com recursos do BNDES. As taxas são definidas pelo CMN e variam conforme o porte do produtor e o tipo de equipamento.",
    source: "MCR 7-1 · Res. CMN vigente",
    related: ["Pronaf", "Pronamp"],
  },
  // TERMOS JURÍDICOS
  {
    term: "Lei de Usura",
    category: "juridico",
    definition:
      "Nome popular do Decreto nº 22.626/1933, que limita os juros remuneratórios a 12% ao ano (1% ao mês) em contratos de mútuo. Aplica-se ao crédito rural quando o CMN não fixar taxa específica para a linha de crédito. O STJ consolidou o entendimento de que a Lei de Usura limita os juros em contratos rurais com recursos controlados.",
    source: "Decreto nº 22.626/1933, art. 1º",
    related: ["Taxa de Juros Remuneratórios", "TCR"],
  },
  {
    term: "Ação de Revisão Contratual",
    category: "juridico",
    definition:
      "Ação judicial por meio da qual o produtor rural busca a revisão das cláusulas abusivas do contrato de crédito, com recálculo das parcelas e do saldo devedor pela taxa legal máxima. Pode incluir pedido de repetição do indébito (devolução dos valores pagos a maior) e compensação com o saldo devedor.",
    source: "CPC, art. 318 · CDC, arts. 6º, V e 51",
    related: ["Laudo Pericial", "Repetição do Indébito", "DED/DDC"],
  },
  {
    term: "Repetição do Indébito",
    category: "juridico",
    definition:
      "Direito do devedor de receber de volta os valores pagos a maior em razão de cláusulas abusivas ou ilegais. No crédito rural, quando comprovado o excesso de juros, o produtor tem direito à devolução em dobro do valor cobrado indevidamente, conforme o art. 42, parágrafo único do CDC.",
    source: "CDC, art. 42, parágrafo único · CC, art. 876",
    related: ["Ação de Revisão Contratual", "Anatocismo"],
  },
  {
    term: "Laudo Pericial Contábil",
    category: "juridico",
    definition:
      "Documento técnico elaborado por perito contador ou economista nomeado pelo juiz, que analisa os aspectos contábeis e financeiros do contrato em litígio. No crédito rural, o laudo pericial recalcula a dívida pela taxa legal, compara com o cobrado pelo banco e responde aos quesitos formulados pelas partes. É a principal prova técnica nas ações revisionais.",
    source: "CPC, arts. 464-480",
    related: ["Ação de Revisão Contratual", "Quesitos Periciais", "DED/DDC"],
  },
  {
    term: "Quesitos Periciais",
    category: "juridico",
    definition:
      "Perguntas formuladas pelas partes (autor e réu) ao perito judicial, que devem ser respondidas no laudo pericial. No crédito rural, os quesitos típicos perguntam: se a taxa excedeu o limite legal, se houve capitalização de juros, qual o saldo devedor correto e qual o valor pago a maior. O perito deve responder cada quesito de forma objetiva e fundamentada.",
    source: "CPC, art. 469",
    related: ["Laudo Pericial Contábil", "Ação de Revisão Contratual"],
  },
  {
    term: "Tutela de Urgência",
    category: "juridico",
    definition:
      "Medida judicial provisória que pode ser concedida antes do julgamento final do processo, quando há urgência e probabilidade do direito. No crédito rural, é usada para suspender execuções, leilões de imóveis rurais e bloqueios de contas enquanto a ação revisional tramita.",
    source: "CPC, arts. 300-310",
    related: ["Ação de Revisão Contratual"],
  },
  // ÍNDICES ECONÔMICOS
  {
    term: "IPCA — Índice de Preços ao Consumidor Amplo",
    category: "indice",
    definition:
      "Principal índice oficial de inflação do Brasil, calculado pelo IBGE. No crédito rural, o IPCA é utilizado como base para o cálculo do FAM (Fator de Atualização Monetária) nas operações com TCR pós-fixada. Os dados mensais são obtidos do Sistema Gerenciador de Séries Temporais (SGS) do BCB, série 433.",
    source: "BCB — SGS série 433",
    related: ["FAM", "TCRpós", "SELIC"],
  },
  {
    term: "SELIC — Sistema Especial de Liquidação e Custódia",
    category: "indice",
    definition:
      "Taxa básica de juros da economia brasileira, definida pelo Comitê de Política Monetária (COPOM) do BCB. Serve como referência para todas as demais taxas de juros do mercado. No crédito rural, a SELIC é usada como parâmetro de comparação para verificar se as taxas cobradas são razoáveis em relação ao custo do dinheiro na economia.",
    source: "BCB — SGS série 432",
    related: ["IPCA", "CDI", "TR"],
  },
  {
    term: "CDI — Certificado de Depósito Interbancário",
    category: "indice",
    definition:
      "Taxa de juros praticada nas operações entre bancos no mercado interbancário. Muito próxima da SELIC. Usada como referência em contratos de crédito com taxas variáveis. No crédito rural, contratos indexados ao CDI podem ter custo muito superior ao limite legal de 12% a.a. em períodos de alta da SELIC.",
    source: "BCB — SGS série 4391",
    related: ["SELIC", "TR", "IPCA"],
  },
  {
    term: "TR — Taxa Referencial",
    category: "indice",
    definition:
      "Taxa de juros criada em 1991 para servir como referência de remuneração. Atualmente próxima de zero na maioria dos períodos. Ainda é usada como índice de correção em alguns contratos de crédito rural mais antigos e no FGTS. Obtida do SGS do BCB, série 226.",
    source: "BCB — SGS série 226",
    related: ["TJLP", "IPCA", "CDI"],
  },
  {
    term: "TJLP — Taxa de Juros de Longo Prazo",
    category: "indice",
    definition:
      "Taxa de juros definida pelo CMN trimestralmente, usada como referência em operações de longo prazo, especialmente do BNDES. Pode ser utilizada em contratos de investimento rural de longo prazo. Obtida do SGS do BCB, série 256.",
    source: "BCB — SGS série 256",
    related: ["TR", "SELIC", "CDI"],
  },
  // ÓRGÃOS E NORMAS
  {
    term: "CMN — Conselho Monetário Nacional",
    category: "orgao",
    definition:
      "Órgão máximo do Sistema Financeiro Nacional, responsável por formular a política da moeda e do crédito. No crédito rural, o CMN edita Resoluções que definem as taxas de juros máximas por linha de crédito, as condições de financiamento e as normas do Manual de Crédito Rural (MCR). As Resoluções do CMN têm força de lei para as instituições financeiras.",
    source: "Lei nº 4.595/64",
    related: ["BCB", "MCR", "Res. CMN"],
  },
  {
    term: "BCB — Banco Central do Brasil",
    category: "orgao",
    definition:
      "Autarquia federal responsável por executar as políticas monetária, cambial e de crédito definidas pelo CMN. No crédito rural, o BCB fiscaliza o cumprimento das normas do MCR pelas instituições financeiras, divulga os parâmetros Jm e FII anualmente e mantém o Sistema Gerenciador de Séries Temporais (SGS) com os índices econômicos utilizados nos cálculos.",
    source: "Lei nº 4.595/64",
    related: ["CMN", "MCR", "SGS"],
  },
  {
    term: "MCR — Manual de Crédito Rural",
    category: "orgao",
    definition:
      "Conjunto de normas que regulamenta o Sistema Nacional de Crédito Rural (SNCR), consolidado pelo BCB com base nas Resoluções do CMN. É a principal referência normativa para taxas máximas, metodologia de cálculo da TCR, condições de reembolso e programas especiais (Pronaf, Pronamp, etc.). Disponível no site do BCB.",
    source: "BCB — www.bcb.gov.br/estabilidadefinanceira/creditorural",
    related: ["CMN", "BCB", "TCR", "FP"],
  },
  {
    term: "SNCR — Sistema Nacional de Crédito Rural",
    category: "orgao",
    definition:
      "Sistema criado pela Lei nº 4.829/65 para disciplinar o crédito destinado ao setor agropecuário. Integrado pelo BCB, CMN, bancos públicos e privados, cooperativas de crédito e demais instituições autorizadas. Define as finalidades do crédito rural (custeio, investimento e comercialização) e as condições gerais de concessão.",
    source: "Lei nº 4.829/65",
    related: ["CMN", "BCB", "MCR"],
  },
  {
    term: "SICOR — Sistema de Operações do Crédito Rural e do Proagro",
    category: "orgao",
    definition:
      "Sistema do BCB que registra todas as operações de crédito rural contratadas no Brasil. Contém dados sobre programas, subprogramas, taxas, fontes de recursos e volumes de crédito concedido. É a base de dados oficial para estatísticas do crédito rural e pode ser consultado para verificar as condições praticadas no mercado.",
    source: "BCB — SICOR",
    related: ["BCB", "MCR", "SNCR"],
  },
];

// Ordenar alfabeticamente
const sortedTerms = [...terms].sort((a, b) => a.term.localeCompare(b.term, "pt-BR"));

// Obter letras disponíveis
const availableLetters = Array.from(new Set(sortedTerms.map((t) => t.term[0].toUpperCase()))).sort();

export default function Glossario() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<GlossaryCategory | "all">("all");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return sortedTerms.filter((t) => {
      const matchSearch =
        !search ||
        t.term.toLowerCase().includes(search.toLowerCase()) ||
        t.definition.toLowerCase().includes(search.toLowerCase());
      const matchCategory = activeCategory === "all" || t.category === activeCategory;
      const matchLetter = !activeLetter || t.term[0].toUpperCase() === activeLetter;
      return matchSearch && matchCategory && matchLetter;
    });
  }, [search, activeCategory, activeLetter]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Voltar
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-amber-600" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Glossário de Crédito Rural</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {terms.length} termos técnicos com definições, exemplos e fundamentação legal
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Busca e filtros */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar termo ou definição..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveLetter(null);
              }}
              className="pl-9"
            />
          </div>

          {/* Filtro por categoria */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeCategory === "all"
                  ? "bg-amber-100 text-amber-700 border-amber-300"
                  : "bg-background text-muted-foreground border-border hover:border-amber-300"
              }`}
            >
              Todos ({terms.length})
            </button>
            {(Object.keys(categoryLabels) as GlossaryCategory[]).map((cat) => {
              const count = terms.filter((t) => t.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setActiveLetter(null);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    activeCategory === cat
                      ? categoryColors[cat]
                      : "bg-background text-muted-foreground border-border hover:border-amber-300"
                  }`}
                >
                  {categoryLabels[cat]} ({count})
                </button>
              );
            })}
          </div>

          {/* Índice alfabético */}
          {!search && (
            <div className="flex flex-wrap gap-1">
              {availableLetters.map((letter) => (
                <button
                  key={letter}
                  onClick={() => setActiveLetter(activeLetter === letter ? null : letter)}
                  className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                    activeLetter === letter
                      ? "bg-amber-600 text-white"
                      : "bg-muted text-muted-foreground hover:bg-amber-100 hover:text-amber-700"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contagem de resultados */}
        <p className="text-sm text-muted-foreground mb-4">
          {filtered.length === terms.length
            ? `${terms.length} termos`
            : `${filtered.length} de ${terms.length} termos`}
        </p>

        {/* Lista de termos */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum termo encontrado para "{search}"</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => {
              const isExpanded = expandedTerm === item.term;
              return (
                <div
                  key={item.term}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedTerm(isExpanded ? null : item.term)}
                    className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-xl font-bold text-amber-600 w-6 flex-shrink-0 leading-tight">
                        {item.term[0]}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-foreground leading-snug block">
                          {item.term}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs mt-1 ${categoryColors[item.category]}`}
                        >
                          <Tag className="w-2.5 h-2.5 mr-1" />
                          {categoryLabels[item.category]}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-muted-foreground flex-shrink-0 mt-1 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border bg-muted/10">
                      <p className="text-sm text-foreground leading-relaxed mt-3">
                        {item.definition}
                      </p>

                      {item.example && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-xs font-semibold text-amber-700 mb-1">Exemplo prático</p>
                          <p className="text-sm text-amber-800">{item.example}</p>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-3">
                        {item.source && (
                          <div className="flex items-center gap-1.5">
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{item.source}</span>
                          </div>
                        )}
                        {item.related && item.related.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-muted-foreground font-medium">Ver também:</span>
                            {item.related.map((r) => (
                              <button
                                key={r}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const found = sortedTerms.find((t) => t.term.startsWith(r));
                                  if (found) {
                                    setSearch(r);
                                    setExpandedTerm(found.term);
                                    setActiveCategory("all");
                                    setActiveLetter(null);
                                  }
                                }}
                                className="text-xs text-amber-600 hover:text-amber-800 underline"
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Rodapé informativo */}
        <Card className="mt-8 border-slate-200 bg-slate-50/50">
          <CardContent className="p-5">
            <p className="text-sm text-slate-600">
              <strong className="text-slate-700">Nota:</strong> Este glossário tem finalidade educativa e informativa. As definições são baseadas na legislação vigente e na jurisprudência consolidada. Para análise de casos concretos, consulte sempre um advogado especializado em crédito rural.
              Acesse a{" "}
              <Link href="/app/fundamentacao" className="text-amber-600 underline">
                Fundamentação Legal
              </Link>{" "}
              para consultar os textos completos das normas citadas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
