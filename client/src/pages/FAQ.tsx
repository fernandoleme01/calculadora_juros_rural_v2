import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, BookOpen, Calculator, Database, Shield, Scale, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FAQItem {
  question: string;
  answer: string;
  sources?: string[];
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    id: "metodologia",
    title: "Metodologia de Cálculo",
    icon: <Calculator className="w-5 h-5" />,
    color: "text-blue-600",
    items: [
      {
        question: "O que é a TCR (Taxa de Custo Rural) e como ela é calculada?",
        answer: `A TCR é a taxa efetiva anual de custo de um financiamento rural, calculada conforme as Resoluções CMN nº 4.883/2020 e 4.913/2021. Existem duas modalidades:\n\n**TCR Pós-Fixada (TCRpós):** Vinculada ao IPCA, calculada pela fórmula:\nTCRpós = FAM × (1 + FP) × (1 + FA) − 1\n\nOnde FAM é o Fator de Atualização Monetária (produto dos IPCAs mensais do período), FP é o Fator de Programa definido pelo CMN para cada linha de crédito, e FA é o Fator de Ajuste (geralmente zero).\n\n**TCR Pré-Fixada (TCRpré):** Calculada com base na taxa prefixada Jm (divulgada pelo BCB em maio de cada ano) e no Fator de Inflação Implícita (FII):\nTCRpré = (1 + Jm/100) × FII × (1 + FP) × (1 + FA) − 1\n\nTodos os fatores são mantidos constantes durante toda a vigência da operação, conforme determinação das Resoluções CMN.`,
        sources: ["Res. CMN nº 4.883/2020", "Res. CMN nº 4.913/2021", "MCR 2-4"],
      },
      {
        question: "Quais são os limites legais de juros para crédito rural?",
        answer: `Os limites legais aplicáveis ao crédito rural são:\n\n**Juros Remuneratórios:** 12% ao ano, conforme o Decreto nº 22.626/33 (Lei de Usura), aplicável quando o CMN não fixar taxa específica para a linha de crédito. O STJ consolidou esse entendimento em jurisprudência dominante (REsp — múltiplos precedentes).\n\n**Juros de Mora:** 1% ao ano, conforme o art. 5º do Decreto-Lei nº 167/67 (Lei das Cédulas de Crédito Rural). Esta é norma de ordem pública, não podendo ser afastada por convenção das partes.\n\n**Multa Contratual:** 2% sobre o valor da dívida, conforme o art. 412 do Código Civil.\n\n**Linhas específicas (Pronaf, Pronamp, etc.):** As taxas são definidas pelo CMN e variam por grupo de beneficiário e finalidade, podendo ser inferiores ao limite geral de 12% a.a.`,
        sources: ["Decreto nº 22.626/33, art. 1º", "DL 167/67, art. 5º", "CC, art. 412", "STJ — Jurisprudência dominante"],
      },
      {
        question: "Como funciona o cálculo de amortização (Price, SAC, SAF)?",
        answer: `A plataforma suporta três sistemas de amortização:\n\n**Tabela Price (Prestações Constantes):** Cada parcela tem valor fixo, composta de amortização crescente e juros decrescentes. A fórmula da parcela é: PMT = PV × [i(1+i)^n] / [(1+i)^n − 1], onde PV é o valor presente, i a taxa periódica e n o número de períodos.\n\n**SAC (Sistema de Amortização Constante):** A amortização do principal é fixa em cada período (PV/n), enquanto os juros diminuem progressivamente sobre o saldo devedor. As parcelas são decrescentes.\n\n**SAF (Sistema de Amortização Francês Adaptado):** Variação da Price com ajustes para o crédito rural, especialmente em operações com carência e periodicidade anual.\n\nEm todos os sistemas, a plataforma calcula o saldo devedor revisado aplicando a taxa legal máxima (12% a.a. ou o limite da linha de crédito), gerando o comparativo entre o saldo cobrado pelo banco e o saldo correto.`,
        sources: ["MCR 2-6 (Reembolso)", "MCR 7-1 (Encargos Financeiros)"],
      },
      {
        question: "O que é o 'mata-mata' e como a plataforma detecta?",
        answer: `O 'mata-mata' (ou rolagem de dívida) é a prática de liquidar um contrato de crédito rural com os recursos de um novo contrato, incorporando ao novo principal os encargos (juros, multas, tarifas) do contrato anterior. Isso resulta em capitalização de juros vedada pelo art. 591 do Código Civil e pelo art. 39, I do CDC.\n\nA plataforma detecta automaticamente essa prática na análise de Cadeia Contratual ao identificar:\n1. Novo contrato com valor superior ao saldo devedor anterior\n2. Encargos incorporados ao novo principal\n3. Aumento percentual do principal acima do limite legal\n4. Padrão de refinanciamentos sucessivos sem quitação real\n\nQuando detectado, o sistema gera alerta visual e inclui a fundamentação legal no laudo técnico-jurídico.`,
        sources: ["CC, art. 591", "CDC, art. 39, I", "CDC, art. 478"],
      },
      {
        question: "Como é calculado o CET (Custo Efetivo Total)?",
        answer: `O CET é a taxa que iguala o valor presente de todos os fluxos de pagamento ao valor liberado do financiamento, incluindo juros remuneratórios, IOF, TAC, TEC e demais encargos. A plataforma calcula o CET pela fórmula de equivalência financeira:\n\nValor Liberado = Σ [Parcela_k / (1 + CET)^(t_k/365)]\n\nOnde t_k é o número de dias entre a data de liberação e o vencimento de cada parcela k.\n\nO CET é comparado automaticamente com a TCR contratada para verificar se os encargos acessórios (IOF, TAC, TEC) estão dentro dos limites legais. Tarifas que elevam o CET acima da TCR máxima permitida são sinalizadas como potencialmente abusivas, com fundamento na Res. CMN 3.919/2010 e no art. 6º, III do CDC.`,
        sources: ["Res. CMN 3.919/2010", "CDC, art. 6º, III", "Res. BCB 96/2021"],
      },
    ],
  },
  {
    id: "fontes",
    title: "Fontes de Dados",
    icon: <Database className="w-5 h-5" />,
    color: "text-green-600",
    items: [
      {
        question: "De onde vêm os dados do IPCA, SELIC e outros índices?",
        answer: `Todos os índices econômicos utilizados nos cálculos são obtidos diretamente das APIs oficiais do Banco Central do Brasil (BCB):\n\n- **IPCA:** Sistema Gerenciador de Séries Temporais (SGS) do BCB, série 433 (IPCA mensal)\n- **SELIC:** SGS série 432 (SELIC acumulada no mês)\n- **CDI:** SGS série 4391 (CDI mensal)\n- **TR (Taxa Referencial):** SGS série 226\n- **TJLP:** SGS série 256\n- **Taxa Média de Crédito Rural:** SGS série 20714\n- **PTAX (dólar):** API de câmbio do BCB\n\nOs dados são atualizados automaticamente a cada consulta, com cache de 24 horas para evitar sobrecarga nas APIs do BCB. A data de referência de cada dado é sempre exibida na interface para transparência.`,
        sources: ["BCB — API SGS", "BCB — API de Câmbio"],
      },
      {
        question: "De onde vêm as taxas do Manual de Crédito Rural (MCR)?",
        answer: `As taxas do MCR são obtidas das Resoluções do Conselho Monetário Nacional (CMN) e incorporadas manualmente na plataforma, com atualização periódica:\n\n- **Fatores de Programa (FP):** Definidos pelo CMN por linha de crédito (Pronaf, Pronamp, Moderfrota, etc.)\n- **Taxa Jm (prefixada):** Divulgada pelo BCB em maio de cada ano, vigente de julho do ano corrente a junho do ano seguinte\n- **FII (Fator de Inflação Implícita):** Divulgado pelo BCB em abril, calculado como PRE/Jm\n- **Limites de taxas por modalidade:** Conforme MCR 7-1 e Resoluções CMN vigentes\n\nA plataforma mantém um banco de dados interno com os parâmetros históricos e vigentes, permitindo o recálculo retroativo de contratos antigos com os fatores corretos da época de contratação.`,
        sources: ["Res. CMN nº 4.883/2020", "Res. CMN nº 4.913/2021", "Res. CMN nº 5.153/2024", "MCR 7-1"],
      },
      {
        question: "Como funciona a extração automática de dados do DED/DDC?",
        answer: `O módulo de importação do DED/DDC (Documento de Evolução da Dívida / Demonstrativo de Débito do Contrato) utiliza inteligência artificial para extrair automaticamente os dados financeiros do PDF:\n\n1. O arquivo PDF é enviado para o servidor e armazenado temporariamente\n2. O texto é extraído do PDF usando processamento de documentos\n3. Um modelo de linguagem (LLM) analisa o texto com um schema JSON estruturado, identificando: valor principal, taxas de juros, datas, modalidade, banco, parcelas, IOF, TAC, TEC e saldo devedor\n4. Os dados extraídos são apresentados com um checklist de completude\n5. O usuário pode pré-preencher a calculadora com um clique\n\nO DED/DDC é um documento obrigatório pela Res. CMN 5.004/2022. Quando o banco se recusa a fornecê-lo, a plataforma gera automaticamente a petição de exibição com fundamento no art. 396 do CPC.`,
        sources: ["Res. CMN 5.004/2022", "CPC, arts. 396-399", "CDC, art. 6º, III"],
      },
      {
        question: "A jurisprudência citada nos laudos é real?",
        answer: `Sim. A plataforma utiliza jurisprudência real com números de processo verificáveis. Os precedentes incluídos nos laudos e petições são:\n\n- **STJ:** Recursos Especiais com jurisprudência consolidada sobre limites de juros em crédito rural, anatocismo e abusividade de tarifas\n- **STF:** Súmulas e decisões sobre aplicação da Lei de Usura\n- **TRF e TJs:** Acórdãos estaduais relevantes sobre crédito rural\n\nOs números de processo, datas de julgamento e ementas são verificáveis nos sistemas de busca dos respectivos tribunais (STJ: www.stj.jus.br, STF: www.stf.jus.br).\n\n**Importante:** Os documentos gerados pela plataforma são minutas para revisão do advogado responsável. A jurisprudência deve ser verificada e atualizada pelo profissional antes da juntada nos autos, conforme o Provimento OAB 205/2021.`,
        sources: ["STJ — Portal de Jurisprudência", "STF — Portal de Jurisprudência"],
      },
    ],
  },
  {
    id: "uso",
    title: "Uso da Plataforma",
    icon: <BookOpen className="w-5 h-5" />,
    color: "text-amber-600",
    items: [
      {
        question: "Qual é o fluxo recomendado para análise de um contrato?",
        answer: `O fluxo recomendado para análise completa de um contrato de crédito rural é:\n\n**1. Importar o DED/DDC** (menu: Importar DED/DDC)\nFaça upload do Demonstrativo de Evolução da Dívida fornecido pelo banco. A IA extrai automaticamente os dados e verifica se todos os campos obrigatórios estão presentes.\n\n**2. Calcular a TCR** (menu: Calculadora TCR)\nCom os dados pré-preenchidos do DED/DDC, selecione a linha de crédito (Pronaf, Pronamp, recursos livres, etc.) e calcule a TCR. O sistema compara automaticamente com os limites do MCR.\n\n**3. Analisar a Amortização** (menu: Tabela de Amortização)\nGere a planilha completa de amortização (Price/SAC/SAF) com o comparativo entre o saldo cobrado pelo banco e o saldo correto pela taxa legal.\n\n**4. Verificar a Cadeia Contratual** (menu: Cadeia de Contratos)\nSe houver renegociações anteriores, cadastre todos os contratos para detectar operações 'mata-mata' e capitalização indevida de juros.\n\n**5. Gerar o Laudo Pericial** (menu: Laudo Pericial)\nCom todos os dados calculados, gere o laudo pericial contábil completo com as 8 seções formais, respostas aos quesitos das partes e memória de cálculo detalhada.`,
        sources: [],
      },
      {
        question: "O que fazer quando o banco se recusa a fornecer o DED/DDC?",
        answer: `Quando o banco se recusa a fornecer o Demonstrativo de Evolução da Dívida (DED/DDC), use o **Gerador de Petição de Exibição de DED/DDC** (menu: Petição Exibição DED/DDC).\n\nA petição é gerada automaticamente com fundamento em:\n- **Art. 6º, III do CDC:** Direito do consumidor à informação adequada e clara\n- **Art. 6º, VIII do CDC:** Inversão do ônus da prova\n- **Res. CMN 5.004/2022:** Obrigatoriedade de fornecimento do demonstrativo\n- **Art. 396 do CPC:** Exibição de documento em poder de terceiro\n- **Art. 399 do CPC:** Presunção de veracidade dos dados do cliente em caso de não cumprimento\n\nA petição inclui pedido de tutela de urgência e multa diária (astreintes) configurável pelo advogado. A recusa do banco em fornecer o documento pode ser usada como argumento para a inversão do ônus da prova na ação revisional.`,
        sources: ["CDC, art. 6º, III e VIII", "Res. CMN 5.004/2022", "CPC, arts. 396-399"],
      },
      {
        question: "Os documentos gerados podem ser usados diretamente em processos judiciais?",
        answer: `Os documentos gerados pela plataforma (laudos periciais, petições, memórias de cálculo) são **minutas para revisão profissional**, não documentos finais prontos para juntada nos autos.\n\nConforme o **Provimento OAB nº 205/2021** e as diretrizes sobre uso de IA na advocacia, todo documento gerado por inteligência artificial deve ser:\n1. Revisado e validado pelo advogado ou perito responsável\n2. Assinado pelo profissional habilitado (OAB/CRC/CRA)\n3. Adaptado às especificidades do caso concreto\n4. Verificado quanto à jurisprudência citada (atualidade e pertinência)\n\nA plataforma inclui automaticamente o aviso "Minuta para revisão do advogado/perito responsável" em todos os documentos gerados por IA. Os cálculos matemáticos (TCR, amortização, comparativo de taxas) são determinísticos e auditáveis, podendo ser usados como base para o laudo pericial após revisão do profissional.`,
        sources: ["Provimento OAB nº 205/2021", "CPC, art. 473 (laudo pericial)"],
      },
      {
        question: "Como funciona o controle de laudos por plano de assinatura?",
        answer: `A plataforma oferece três planos de assinatura com diferentes limites de laudos gerados por IA:\n\n**Standard (R$ 149/mês):** 10 laudos por mês\n**Premium (R$ 329/mês):** 25 laudos por mês\n**Supreme (R$ 1.990/mês):** Laudos ilimitados\n\nO contador de laudos é incrementado a cada geração de: laudo técnico-jurídico via IA, petição de revisão contratual via IA, análise de contrato PDF via IA e laudo pericial via IA.\n\nCálculos matemáticos (TCR, amortização, comparativo de taxas, cadeia contratual) não consomem laudos e são ilimitados em todos os planos.\n\nO plano anual oferece 25% de desconto sobre o valor mensal.`,
        sources: [],
      },
    ],
  },
  {
    id: "legal",
    title: "Aspectos Jurídicos",
    icon: <Scale className="w-5 h-5" />,
    color: "text-purple-600",
    items: [
      {
        question: "Quais leis fundamentam a revisão de contratos de crédito rural?",
        answer: `A revisão de contratos de crédito rural é fundamentada em um conjunto de normas:\n\n**Legislação Federal:**\n- Lei nº 4.829/65 — Sistema Nacional de Crédito Rural (SNCR)\n- Decreto-Lei nº 167/67 — Cédulas de Crédito Rural (art. 5º: juros de mora 1% a.a.)\n- Decreto nº 22.626/33 — Lei de Usura (art. 1º: juros remuneratórios 12% a.a.)\n- Lei nº 8.078/90 — Código de Defesa do Consumidor (arts. 6º, 39, 51)\n- Lei nº 10.406/02 — Código Civil (arts. 412, 478, 591)\n\n**Normas do CMN:**\n- Res. CMN nº 4.883/2020 — Consolidação das normas do MCR\n- Res. CMN nº 4.913/2021 — Metodologia de cálculo da TCR\n- Res. CMN nº 5.153/2024 — Fatores de programa vigentes\n\n**Jurisprudência:**\n- STJ: Juros remuneratórios limitados a 12% a.a. na ausência de deliberação do CMN\n- STJ: Juros de mora limitados a 1% a.a. nas cédulas de crédito rural\n- STJ: Vedação ao anatocismo (capitalização de juros) em contratos rurais`,
        sources: ["Lei 4.829/65", "DL 167/67", "Decreto 22.626/33", "CDC", "CC"],
      },
      {
        question: "O que é o Manual de Crédito Rural (MCR) e qual sua importância?",
        answer: `O Manual de Crédito Rural (MCR) é o conjunto de normas que regulamenta o Sistema Nacional de Crédito Rural (SNCR), consolidado pelo Banco Central do Brasil com base nas Resoluções do CMN. É a principal referência normativa para:\n\n- Taxas de juros máximas por modalidade e programa (MCR 7-1)\n- Metodologia de cálculo da TCR (MCR 2-4)\n- Condições de reembolso e amortização (MCR 2-6)\n- Encargos financeiros permitidos (MCR 7-1)\n- Programas especiais: Pronaf (MCR 7-6), Pronamp (MCR 7-7), Moderfrota, etc.\n\nO MCR é atualizado continuamente pelo BCB conforme novas Resoluções do CMN são editadas. A versão vigente está disponível no site do BCB (www.bcb.gov.br/estabilidadefinanceira/creditorural).\n\nNa prática pericial, o MCR é a principal fonte para verificar se a taxa contratada está dentro dos limites legais para a linha de crédito específica do contrato em análise.`,
        sources: ["BCB — Manual de Crédito Rural", "Res. CMN nº 4.883/2020"],
      },
    ],
  },
  {
    id: "privacidade",
    title: "Privacidade e Segurança",
    icon: <Shield className="w-5 h-5" />,
    color: "text-red-600",
    items: [
      {
        question: "Os dados dos contratos são armazenados na plataforma?",
        answer: `Sim, os dados inseridos na calculadora são armazenados no banco de dados da plataforma para formar o Histórico de Cálculos do usuário. Isso permite recuperar cálculos anteriores e gerar laudos retroativos.\n\nOs dados armazenados incluem: valor do contrato, taxas, datas, modalidade, banco, resultado do cálculo e conformidade legal. **Não são armazenados** dados pessoais sensíveis do devedor além do nome e CPF/CNPJ informados pelo usuário.\n\nDocumentos PDF enviados (DED/DDC, contratos) são armazenados temporariamente para processamento e excluídos em até 30 dias após o upload, conforme nossa Política de Privacidade.\n\nTodos os dados são tratados conforme a **Lei 13.709/2018 (LGPD)**. O usuário pode solicitar a exclusão de seus dados a qualquer momento pelo e-mail privacidade@jurosrurais.pro.`,
        sources: ["LGPD — Lei 13.709/2018"],
      },
      {
        question: "Como os dados são protegidos?",
        answer: `A plataforma adota as seguintes medidas de segurança:\n\n**Transmissão:** Toda comunicação é criptografada via HTTPS/TLS 1.3, impedindo interceptação dos dados em trânsito.\n\n**Autenticação:** Login via OAuth 2.0 com suporte a autenticação de dois fatores. Sessões são assinadas com JWT e expiram automaticamente.\n\n**Banco de dados:** Hospedado em infraestrutura gerenciada com backups automáticos diários, criptografia em repouso e controle de acesso por role.\n\n**IA e PDFs:** Os documentos enviados para extração via IA são processados por APIs de terceiros que não utilizam os dados para treinamento de modelos, conforme contrato de processamento de dados (DPA).\n\n**Incidentes:** Em caso de violação de dados que possa causar risco aos titulares, a ANPD e os usuários afetados serão notificados em até 72 horas, conforme o art. 48 da LGPD.`,
        sources: ["LGPD, art. 48", "ISO/IEC 27001"],
      },
    ],
  },
];

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium text-foreground leading-snug">{item.question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-border bg-muted/20">
          <div className="pt-4 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {item.answer}
          </div>
          {item.sources && item.sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Fontes:</span>
              {item.sources.map((source, i) => (
                <Badge key={i} variant="outline" className="text-xs font-normal">
                  {source}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<string>("metodologia");

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const currentCategory = faqCategories.find((c) => c.id === activeCategory);

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
            <HelpCircle className="w-7 h-7 text-amber-600" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Perguntas Frequentes</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Metodologia de cálculo, fontes de dados e uso da plataforma Juros Rurais Pro
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar de categorias */}
          <div className="md:w-56 flex-shrink-0">
            <div className="sticky top-4 space-y-1">
              {faqCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    activeCategory === category.id
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className={activeCategory === category.id ? "text-amber-600" : category.color}>
                    {category.icon}
                  </span>
                  {category.title}
                </button>
              ))}
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            {currentCategory && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className={currentCategory.color}>{currentCategory.icon}</span>
                  <h2 className="text-lg font-semibold text-foreground">{currentCategory.title}</h2>
                  <Badge variant="secondary" className="text-xs">
                    {currentCategory.items.length} perguntas
                  </Badge>
                </div>
                <div className="space-y-2">
                  {currentCategory.items.map((item, index) => {
                    const key = `${activeCategory}-${index}`;
                    return (
                      <AccordionItem
                        key={key}
                        item={item}
                        isOpen={!!openItems[key]}
                        onToggle={() => toggleItem(key)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Card de contato */}
            <Card className="mt-8 border-amber-200 bg-amber-50/50">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Não encontrou o que procurava?</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Entre em contato pelo e-mail{" "}
                      <a href="mailto:contato@jurosrurais.pro" className="underline font-medium">
                        contato@jurosrurais.pro
                      </a>{" "}
                      ou acesse a{" "}
                      <Link href="/app/fundamentacao" className="underline font-medium">
                        Fundamentação Legal
                      </Link>{" "}
                      para consultar a legislação e jurisprudência completa.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
