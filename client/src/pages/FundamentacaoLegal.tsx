import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Scale, AlertTriangle, Gavel } from "lucide-react";

const legislacao = [
  {
    norma: "Lei nº 4.829/65",
    titulo: "Sistema Nacional de Crédito Rural (SNCR)",
    descricao: "Institui o Sistema Nacional de Crédito Rural, definindo suas finalidades, modalidades (custeio, investimento e comercialização), beneficiários e condições de acesso ao crédito rural. Constitui a base normativa do crédito rural no Brasil.",
    artigos: ["Art. 2º — Modalidades do crédito rural", "Art. 3º — Finalidades do crédito rural", "Art. 8º — Condições de financiamento"],
  },
  {
    norma: "Decreto-Lei nº 167/67",
    titulo: "Cédula de Crédito Rural",
    descricao: "Disciplina as cédulas e notas de crédito rural, estabelecendo seus requisitos formais, efeitos jurídicos e limites de juros. O art. 5º é de especial relevância ao fixar o limite de 1% ao ano para os juros de mora, norma de ordem pública que não pode ser afastada por convenção das partes.",
    artigos: [
      "Art. 5º — Juros de mora limitados a 1% ao ano",
      "Art. 9º — Requisitos formais da cédula",
      "Art. 10 — Garantias reais",
      "Art. 14 — Execução extrajudicial",
    ],
  },
  {
    norma: "Decreto nº 22.626/33",
    titulo: "Lei de Usura",
    descricao: "Proíbe a estipulação de juros superiores ao dobro da taxa legal (12% ao ano), vedando a prática usurária. Aplicável subsidiariamente ao crédito rural quando o CMN não fixar taxa específica, conforme jurisprudência consolidada do STJ.",
    artigos: [
      "Art. 1º — Limite de 12% ao ano para juros remuneratórios",
      "Art. 4º — Nulidade das cláusulas usureiras",
    ],
  },
  {
    norma: "Resolução CMN nº 4.883/2020",
    titulo: "Consolidação das Normas do Manual de Crédito Rural",
    descricao: "Consolida e atualiza as normas do Manual de Crédito Rural (MCR), estabelecendo os procedimentos para concessão, controle e recuperação do crédito rural. Define a metodologia de cálculo da TCR pós-fixada com base no IPCA (FAM × FP × FA).",
    artigos: [
      "MCR 3-1 — Condições básicas do crédito rural",
      "MCR 3-2 — Taxa de juros e encargos",
      "MCR 3-4 — Fórmulas de cálculo da TCR pós-fixada",
    ],
  },
  {
    norma: "Resolução CMN nº 4.913/2021",
    titulo: "Metodologia de Cálculo da TCR Prefixada",
    descricao: "Estabelece a metodologia de cálculo da Taxa de Custo Real prefixada (TCRpré) para operações de crédito rural, utilizando a taxa Jm (prefixada de maio), o Fator de Inflação Implícita (FII), o Fator de Programa (FP) e o Fator de Ajuste (FA).",
    artigos: [
      "Fórmula: TCRpré = (1 + Jm/100) × FII × (1 + FP) × (1 + FA) - 1",
      "Vigência: julho do ano corrente a junho do ano seguinte",
      "Divulgação: Jm e FII publicados pelo BCB em maio",
    ],
  },
  {
    norma: "Resolução CMN nº 5.153/2024",
    titulo: "Fatores de Programa Vigentes",
    descricao: "Define os Fatores de Programa (FP) para cada linha de crédito rural, utilizados no cálculo da TCR. Os FPs variam conforme a taxa de juros da linha de crédito e são aplicados tanto na TCRpré quanto na TCRpós.",
    artigos: [
      "FP para taxa 2,5%: -0,4788636",
      "FP para taxa 5,0%: -0,1750162",
      "FP para taxa 8,0%: 0,1896008",
      "FP para taxa 12,5%: 0,7365263",
    ],
  },
  {
    norma: "Lei nº 11.101/2005 (alterada pelas Leis 14.112/2020 e 14.195/2021)",
    titulo: "Lei de Recuperação Judicial e Falência",
    descricao: "Regula a recuperação judicial, extrajudicial e a falência do empresário e da sociedade empresária. Aplicável ao produtor rural que exerce atividade empresarial, conforme alterações introduzidas pela Lei 14.112/2020 e 14.195/2021. No contexto do crédito rural em recuperação judicial, os juros e encargos devem ser calculados conforme os limites legais aplicáveis.",
    artigos: [
      "Art. 6º — Suspensão das ações e execuções",
      "Art. 49 — Créditos sujeitos à recuperação judicial",
      "Art. 50 — Meios de recuperação judicial",
      "Art. 58-A — Recuperação judicial do produtor rural",
    ],
  },
];

const jurisprudencia = [
  {
    tribunal: "STJ — Superior Tribunal de Justiça",
    numero: "REsp (Jurisprudência Consolidada — Múltiplos Precedentes)",
    relator: "Diversas Turmas",
    data: "Jurisprudência Dominante",
    ementa: "CÉDULA DE CRÉDITO RURAL. JUROS REMUNERATÓRIOS. LIMITE DE 12% AO ANO. AUSÊNCIA DE DELIBERAÇÃO DO CMN. APLICAÇÃO DA LEI DE USURA. Consoante reiterada jurisprudência, por ausência de deliberação do Conselho Monetário Nacional, a taxa de juros remuneratórios nas cédulas de crédito rural, industrial e comercial deve respeitar o limite de doze por cento (12%) ao ano, conforme Decreto nº 22.626/33.",
    tema: "Juros Remuneratórios",
  },
  {
    tribunal: "STJ — Superior Tribunal de Justiça",
    numero: "REsp (Jurisprudência Dominante)",
    relator: "Diversas Turmas",
    data: "Jurisprudência Consolidada",
    ementa: "CÉDULA DE CRÉDITO RURAL. JUROS MORATÓRIOS. LIMITE DE 1% AO ANO. DECRETO-LEI Nº 167/67. Os juros moratórios nas cédulas de crédito rural não podem ultrapassar 1% (um por cento) ao ano, conforme art. 5º do Decreto-Lei nº 167/67. A cobrança de juros moratórios de 1% ao mês é absolutamente inadmissível, tendo em vista que a legislação em vigor limita tal taxa ao patamar de 1% ao ano.",
    tema: "Juros de Mora",
  },
  {
    tribunal: "TJDFT — Tribunal de Justiça do Distrito Federal e Territórios",
    numero: "Acórdão 1213739 — 07311809120188070001",
    relator: "Des. ARNOLDO CAMANHO DE ASSIS",
    data: "06/11/2019 — 4ª Turma Cível — DJE: 20/11/2019",
    ementa: "CÉDULA DE CRÉDITO RURAL. JUROS REMUNERATÓRIOS. LIMITAÇÃO A 12% AO ANO. Consoante reiterada jurisprudência, por ausência de deliberação do Conselho Monetário Nacional, a taxa de juros remuneratórios nas cédulas de crédito rural, industrial e comercial deve respeitar o limite de doze por cento (12%) ao ano. As notas de crédito rural estão submetidas a regramento próprio, consubstanciado na Lei nº 6.840/80 e no Decreto-Lei nº 413/69, que conferem ao CMN o dever de fixar a taxa de juros. Na hipótese de omissão do CMN, aplica-se a limitação prevista no Decreto nº 22.626/33 (Lei de Usura).",
    tema: "Juros Remuneratórios",
  },
  {
    tribunal: "TJPR — Tribunal de Justiça do Paraná",
    numero: "0018932-49.2023.8.16.0021",
    relator: "Câmara Cível",
    data: "10/05/2025",
    ementa: "CRÉDITO RURAL. JUROS REMUNERATÓRIOS E MORATÓRIOS. LIMITES LEGAIS. Nos contratos de crédito rural, a limitação dos juros remuneratórios deve ser fixada em 12% ao ano e os juros moratórios em 1% ao ano, conforme legislação específica aplicável às cédulas de crédito rural.",
    tema: "Limites Legais",
  },
  {
    tribunal: "STJ — Superior Tribunal de Justiça",
    numero: "AgRg no REsp 1.392.449/RS",
    relator: "Min. Marco Aurélio Bellizze",
    data: "Jurisprudência Consolidada",
    ementa: "CRÉDITO RURAL. CÉDULA DE CRÉDITO RURAL. CAPITALIZAÇÃO DE JUROS. VEDAÇÃO. DECRETO-LEI 167/67. A capitalização de juros (juros compostos) é vedada nas cédulas de crédito rural, salvo quando expressamente autorizada por lei. A cobrança de juros sobre juros constitui prática abusiva que deve ser coibida pelo Poder Judiciário.",
    tema: "Capitalização de Juros",
  },
];

const doutrina = [
  {
    autor: "REQUIÃO, Rubens",
    obra: "Curso de Direito Comercial, vol. 2",
    editora: "Saraiva, 2014",
    descricao: "Obra clássica do direito comercial brasileiro que trata das cédulas de crédito rural como títulos de crédito especiais, analisando sua natureza jurídica, requisitos formais e regime de juros.",
  },
  {
    autor: "BURANELLO, Renato",
    obra: "Sistema Privado de Financiamento do Agronegócio",
    editora: "Quartier Latin, 2009",
    descricao: "Análise aprofundada dos instrumentos de financiamento do agronegócio, incluindo as cédulas de crédito rural, os mecanismos de garantia e os limites legais aplicáveis aos juros e encargos.",
  },
  {
    autor: "LAZZARINI, Álvaro",
    obra: "Crédito Rural: Aspectos Jurídicos",
    editora: "RT, 2010",
    descricao: "Estudo específico sobre os aspectos jurídicos do crédito rural, com análise da legislação aplicável, jurisprudência dos tribunais superiores e os limites de juros remuneratórios e moratórios.",
  },
];

export default function FundamentacaoLegal() {
  const { data: jurisprudenciaApi } = trpc.tcr.jurisprudencia.useQuery();
  const { data: limites } = trpc.tcr.limitesLegais.useQuery();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Fundamentação Legal — Crédito Rural
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Legislação, jurisprudência e doutrina aplicáveis ao cálculo de juros em financiamentos rurais.
        </p>
      </div>

      {/* Limites Vigentes */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            Limites Legais Vigentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border">
              <p className="text-2xl font-bold text-primary">{limites?.jurosRemuneratoriosMaxAA ?? 12}% a.a.</p>
              <p className="text-xs font-medium mt-1">Juros Remuneratórios</p>
              <p className="text-xs text-muted-foreground">Decreto nº 22.626/33 + STJ</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <p className="text-2xl font-bold text-amber-600">{limites?.jurosMoraMaxAA ?? 1}% a.a.</p>
              <p className="text-xs font-medium mt-1">Juros de Mora</p>
              <p className="text-xs text-muted-foreground">Decreto-Lei nº 167/67, art. 5º</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <p className="text-2xl font-bold text-emerald-600">{limites?.multaMax ?? 2}%</p>
              <p className="text-xs font-medium mt-1">Multa Contratual</p>
              <p className="text-xs text-muted-foreground">Código Civil, art. 412</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legislação */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Legislação Aplicável
          </CardTitle>
          <CardDescription>
            Normas que regem o crédito rural e os limites de juros no ordenamento jurídico brasileiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={["leg-0", "leg-1", "leg-2"]}>
            {legislacao.map((leg, i) => (
              <AccordionItem key={leg.norma ?? leg.titulo ?? `leg-${i}`} value={`leg-${i}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <Badge variant="outline" className="text-xs font-mono shrink-0">{leg.norma}</Badge>
                    <span className="text-sm font-medium">{leg.titulo}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pl-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">{leg.descricao}</p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Dispositivos Relevantes:</p>
                      {leg.artigos.map((art) => (
                        <p key={art.slice(0, 80)} className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/30">
                          {art}
                        </p>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Jurisprudência */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Gavel className="h-4 w-4" />
            Jurisprudência Consolidada
          </CardTitle>
          <CardDescription>
            Precedentes do STJ e tribunais estaduais sobre limites de juros em crédito rural
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={["juri-0", "juri-1"]}>
            {jurisprudencia.map((j, i) => (
              <AccordionItem key={j.numero ?? `juri-${i}`} value={`juri-${i}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <Badge className="text-xs shrink-0 bg-primary/10 text-primary border-primary/20">{j.tema}</Badge>
                    <div>
                      <p className="text-sm font-medium">{j.tribunal}</p>
                      <p className="text-xs text-muted-foreground">{j.numero} — {j.data}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pl-2">
                    <blockquote className="border-l-4 border-primary/30 pl-4 italic text-sm text-muted-foreground leading-relaxed">
                      {j.ementa}
                    </blockquote>
                    <p className="text-xs text-muted-foreground">Relator: {j.relator}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Doutrina */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Referências Doutrinárias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {doutrina.map((d) => (
            <div key={`${d.autor}-${d.obra}`.slice(0, 80)} className="p-3 border rounded-lg space-y-1">
              <p className="text-sm font-medium">{d.autor}</p>
              <p className="text-sm text-primary italic">{d.obra}</p>
              <p className="text-xs text-muted-foreground">{d.editora}</p>
              <p className="text-xs text-muted-foreground mt-1">{d.descricao}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Metodologia TCR */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Metodologia de Cálculo da TCR
          </CardTitle>
          <CardDescription>
            Conforme Resoluções CMN nº 4.883/2020 e 4.913/2021
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-semibold">TCRpós (Pós-Fixada — IPCA)</p>
              <p className="text-xs font-mono mt-1 text-primary">TCRpós = FAM × (1 + FP) × (1 + FA) - 1</p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p><strong>FAM</strong> = Fator de Atualização Monetária = ∏(1 + IPCAm/100)</p>
                <p><strong>FP</strong> = Fator de Programa (definido pelo CMN para cada linha)</p>
                <p><strong>FA</strong> = Fator de Ajuste (definido pelo CMN, padrão = 0)</p>
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-semibold">TCRpré (Pré-Fixada — LTN/NTN-F)</p>
              <p className="text-xs font-mono mt-1 text-primary">TCRpré = (1 + Jm/100) × FII × (1 + FP) × (1 + FA) - 1</p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p><strong>Jm</strong> = Taxa prefixada calculada em maio (vigência: jul/ano a jun/ano seguinte)</p>
                <p><strong>FII</strong> = Fator de Inflação Implícita = PRE / Jm (divulgado pelo BCB em abril)</p>
                <p><strong>FP</strong> = Fator de Programa (definido pelo CMN para cada linha)</p>
                <p><strong>FA</strong> = Fator de Ajuste (definido pelo CMN, padrão = 0)</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Nota Técnica Importante
            </p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Os Fatores de Programa (FP), Fator de Ajuste (FA), taxa Jm e FII são mantidos constantes durante toda a vigência da operação de crédito rural, conforme determinação das Resoluções CMN nº 4.883/2020 e 4.913/2021. Qualquer alteração unilateral desses fatores pelo agente financeiro constitui violação contratual e legal.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
