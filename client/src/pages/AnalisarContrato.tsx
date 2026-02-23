import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Upload, CheckCircle, AlertTriangle, XCircle,
  Loader2, Scale, Search, Calculator, Eye, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DadosContrato {
  nomeDevedor: string | null;
  cpfCnpjDevedor: string | null;
  nomeCredor: string | null;
  numeroCedula: string | null;
  dataContratacao: string | null;
  dataVencimento: string | null;
  valorPrincipal: number | null;
  moeda: string;
  prazoMeses: number | null;
  modalidade: string | null;
  finalidade: string | null;
  taxaJurosRemuneratorios: number | null;
  taxaJurosMora: number | null;
  taxaMulta: number | null;
  tipoTaxa: string | null;
  indiceCorrecao: string | null;
  garantias: string[];
  clausulasRelevantes: string[];
  observacoes: string | null;
}

interface AnaliseConformidade {
  statusGeral: "conforme" | "nao_conforme" | "atencao" | "inconclusivo";
  jurosRemuneratorios: {
    status: string;
    taxaEncontrada: number | null;
    limiteMaximo: number;
    excesso: number | null;
    fundamentacao: string;
  };
  jurosMora: {
    status: string;
    taxaEncontrada: number | null;
    limiteMaximo: number;
    excesso: number | null;
    fundamentacao: string;
  };
  multa: {
    status: string;
    taxaEncontrada: number | null;
    limiteMaximo: number;
    fundamentacao: string;
  };
  alertas: string[];
  pontosAtencao: string[];
}

interface ResultadoAnalise {
  textoExtraido: string;
  totalPaginas: number;
  dadosExtraidos: DadosContrato;
  analiseConformidade: AnaliseConformidade;
  parecerJuridico: string;
  confiancaExtracao: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: string }) {
  if (status === "conforme") return <CheckCircle className="h-4 w-4 text-emerald-600" />;
  if (status === "nao_conforme") return <XCircle className="h-4 w-4 text-red-600" />;
  if (status === "atencao") return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  return <Search className="h-4 w-4 text-muted-foreground" />;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    conforme: { label: "Conforme", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    nao_conforme: { label: "Não Conforme", className: "bg-red-100 text-red-800 border-red-200" },
    atencao: { label: "Atenção", className: "bg-amber-100 text-amber-800 border-amber-200" },
    inconclusivo: { label: "Inconclusivo", className: "bg-gray-100 text-gray-700 border-gray-200" },
    nao_identificado: { label: "Não Identificado", className: "bg-gray-100 text-gray-600 border-gray-200" },
  };
  const cfg = map[status] ?? map.nao_identificado;
  return <Badge className={`${cfg.className} flex items-center gap-1 w-fit`}><StatusIcon status={status} />{cfg.label}</Badge>;
}

function formatBRL(value: number | null) {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const modalidadeLabel: Record<string, string> = {
  custeio: "Custeio",
  investimento: "Investimento",
  comercializacao: "Comercialização",
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function AnalisarContrato() {
  const [, setLocation] = useLocation();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [etapa, setEtapa] = useState("");
  const [resultado, setResultado] = useState<ResultadoAnalise | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Drag & Drop ──
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(true);
  }, []);

  const handleDragLeave = useCallback(() => setArrastando(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") {
      setArquivo(file);
      setResultado(null);
      setErro(null);
    } else {
      toast.error("Apenas arquivos PDF são aceitos.");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArquivo(file);
      setResultado(null);
      setErro(null);
    }
  };

  // ── Análise ──
  const handleAnalisar = async () => {
    if (!arquivo) return;

    setCarregando(true);
    setErro(null);
    setResultado(null);
    setProgresso(10);
    setEtapa("Enviando PDF para o servidor...");

    try {
      const formData = new FormData();
      formData.append("pdf", arquivo);

      setProgresso(30);
      setEtapa("Extraindo texto do contrato (OCR)...");

      const response = await fetch("/api/analisar-contrato", {
        method: "POST",
        body: formData,
      });

      setProgresso(70);
      setEtapa("Analisando contrato com inteligência artificial...");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Erro ao analisar o contrato.");
      }

      setProgresso(95);
      setEtapa("Gerando análise de conformidade legal...");

      await new Promise(r => setTimeout(r, 500));
      setProgresso(100);
      setResultado(data.resultado);
      toast.success("Contrato analisado com sucesso!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido.";
      setErro(msg);
      toast.error(msg);
    } finally {
      setCarregando(false);
      setEtapa("");
    }
  };

  // ── Pré-preencher calculadora ──
  const handleUsarNaCalculadora = () => {
    if (!resultado) return;
    const d = resultado.dadosExtraidos;
    // Armazenar dados para pré-preenchimento
    sessionStorage.setItem("calculadora_prefill", JSON.stringify({
      nomeDevedor: d.nomeDevedor ?? "",
      numeroCedula: d.numeroCedula ?? "",
      modalidade: d.modalidade ?? "custeio",
      tipoTaxa: d.tipoTaxa ?? "pos_fixada",
      valorPrincipal: d.valorPrincipal ?? "",
      dataContratacao: d.dataContratacao ?? "",
      dataVencimento: d.dataVencimento ?? "",
      prazoMeses: d.prazoMeses ?? "",
      taxaJurosRemuneratorios: d.taxaJurosRemuneratorios ?? "",
      taxaJurosMora: d.taxaJurosMora ?? 1,
      taxaMulta: d.taxaMulta ?? 2,
    }));
    toast.success("Dados do contrato carregados na calculadora!");
    setLocation("/app/calculadora");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Análise de Contrato via OCR
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Envie o PDF do contrato ou cédula de crédito rural para extração automática de dados e análise de conformidade legal com inteligência artificial.
        </p>
      </div>

      {/* Upload */}
      {!resultado && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Enviar Contrato em PDF</CardTitle>
            <CardDescription>
              Formatos aceitos: PDF com texto (contratos digitais, cédulas eletrônicas). Tamanho máximo: 20 MB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Área de Drop */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                arrastando
                  ? "border-primary bg-primary/5"
                  : arquivo
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {arquivo ? (
                <div className="space-y-2">
                  <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
                  <p className="font-medium text-emerald-700">{arquivo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(arquivo.size / 1024 / 1024).toFixed(2)} MB — Clique para trocar o arquivo
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                  <p className="font-medium text-muted-foreground">
                    Arraste o PDF aqui ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Contratos, cédulas de crédito rural, notas promissórias rurais
                  </p>
                </div>
              )}
            </div>

            {/* Progresso */}
            {carregando && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{etapa}</span>
                </div>
                <Progress value={progresso} className="h-2" />
              </div>
            )}

            {/* Erro */}
            {erro && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}

            {/* Botão */}
            <Button
              onClick={handleAnalisar}
              disabled={!arquivo || carregando}
              className="w-full"
              size="lg"
            >
              {carregando ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando...</>
              ) : (
                <><Search className="h-4 w-4 mr-2" /> Analisar Contrato</>
              )}
            </Button>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" /> Extração de dados via IA (GPT-4o)</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" /> Validação de limites legais</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" /> Parecer técnico-jurídico automático</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="space-y-4">
          {/* Ações */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {resultado.totalPaginas} página(s)
              </Badge>
              <Badge variant="outline" className="text-xs">
                Confiança da extração: {resultado.confiancaExtracao}%
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setResultado(null); setArquivo(null); }}>
                <Upload className="h-4 w-4 mr-1" /> Novo PDF
              </Button>
              <Button size="sm" onClick={handleUsarNaCalculadora}>
                <Calculator className="h-4 w-4 mr-1" /> Usar na Calculadora
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>

          {/* Status de Conformidade */}
          <Card className={`border-l-4 ${
            resultado.analiseConformidade.statusGeral === "conforme" ? "border-l-emerald-500" :
            resultado.analiseConformidade.statusGeral === "atencao" ? "border-l-amber-500" :
            resultado.analiseConformidade.statusGeral === "nao_conforme" ? "border-l-red-500" :
            "border-l-gray-400"
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                Análise de Conformidade Legal
                <StatusBadge status={resultado.analiseConformidade.statusGeral} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Remuneratórios */}
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">Juros Remuneratórios</p>
                    <StatusBadge status={resultado.analiseConformidade.jurosRemuneratorios.status} />
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Encontrado: <span className="font-mono font-medium text-foreground">
                      {resultado.analiseConformidade.jurosRemuneratorios.taxaEncontrada != null
                        ? `${resultado.analiseConformidade.jurosRemuneratorios.taxaEncontrada.toFixed(2)}% a.a.`
                        : "—"}
                    </span></p>
                    <p>Limite: <span className="font-mono font-medium text-foreground">{resultado.analiseConformidade.jurosRemuneratorios.limiteMaximo}% a.a.</span></p>
                    {resultado.analiseConformidade.jurosRemuneratorios.excesso != null && (
                      <p className="text-red-600 font-medium">Excesso: {resultado.analiseConformidade.jurosRemuneratorios.excesso.toFixed(2)}% a.a.</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground italic">{resultado.analiseConformidade.jurosRemuneratorios.fundamentacao}</p>
                </div>

                {/* Mora */}
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">Juros de Mora</p>
                    <StatusBadge status={resultado.analiseConformidade.jurosMora.status} />
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Encontrado: <span className="font-mono font-medium text-foreground">
                      {resultado.analiseConformidade.jurosMora.taxaEncontrada != null
                        ? `${resultado.analiseConformidade.jurosMora.taxaEncontrada.toFixed(3)}% a.a.`
                        : "—"}
                    </span></p>
                    <p>Limite: <span className="font-mono font-medium text-foreground">{resultado.analiseConformidade.jurosMora.limiteMaximo}% a.a.</span></p>
                    {resultado.analiseConformidade.jurosMora.excesso != null && (
                      <p className="text-red-600 font-medium">Excesso: {resultado.analiseConformidade.jurosMora.excesso.toFixed(3)}% a.a.</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground italic">{resultado.analiseConformidade.jurosMora.fundamentacao}</p>
                </div>

                {/* Multa */}
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">Multa Contratual</p>
                    <StatusBadge status={resultado.analiseConformidade.multa.status} />
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Encontrado: <span className="font-mono font-medium text-foreground">
                      {resultado.analiseConformidade.multa.taxaEncontrada != null
                        ? `${resultado.analiseConformidade.multa.taxaEncontrada.toFixed(2)}%`
                        : "—"}
                    </span></p>
                    <p>Limite: <span className="font-mono font-medium text-foreground">{resultado.analiseConformidade.multa.limiteMaximo}%</span></p>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{resultado.analiseConformidade.multa.fundamentacao}</p>
                </div>
              </div>

              {/* Alertas */}
              {resultado.analiseConformidade.alertas.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="space-y-1">
                    {resultado.analiseConformidade.alertas.map((a) => (
                      <p key={a.slice(0, 80)} className="text-sm">{a}</p>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {/* Pontos de Atenção */}
              {resultado.analiseConformidade.pontosAtencao.length > 0 && (
                <div className="space-y-1">
                  {resultado.analiseConformidade.pontosAtencao.map((p) => (
                    <p key={p.slice(0, 80)} className="text-xs text-amber-700 flex gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" /> {p}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Abas: Dados / Parecer / Texto */}
          <Tabs defaultValue="dados">
            <TabsList className="w-full">
              <TabsTrigger value="dados" className="flex-1">
                <Scale className="h-3.5 w-3.5 mr-1" /> Dados Extraídos
              </TabsTrigger>
              <TabsTrigger value="parecer" className="flex-1">
                <FileText className="h-3.5 w-3.5 mr-1" /> Parecer Jurídico
              </TabsTrigger>
              <TabsTrigger value="texto" className="flex-1">
                <Eye className="h-3.5 w-3.5 mr-1" /> Texto Extraído
              </TabsTrigger>
            </TabsList>

            {/* Dados Extraídos */}
            <TabsContent value="dados">
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: "Devedor", value: resultado.dadosExtraidos.nomeDevedor },
                      { label: "CPF/CNPJ", value: resultado.dadosExtraidos.cpfCnpjDevedor },
                      { label: "Credor", value: resultado.dadosExtraidos.nomeCredor },
                      { label: "Nº Cédula", value: resultado.dadosExtraidos.numeroCedula },
                      { label: "Data Contratação", value: resultado.dadosExtraidos.dataContratacao },
                      { label: "Data Vencimento", value: resultado.dadosExtraidos.dataVencimento },
                      { label: "Valor Principal", value: formatBRL(resultado.dadosExtraidos.valorPrincipal) },
                      { label: "Prazo", value: resultado.dadosExtraidos.prazoMeses ? `${resultado.dadosExtraidos.prazoMeses} meses` : null },
                      { label: "Modalidade", value: resultado.dadosExtraidos.modalidade ? (modalidadeLabel[resultado.dadosExtraidos.modalidade] ?? resultado.dadosExtraidos.modalidade) : null },
                      { label: "Finalidade", value: resultado.dadosExtraidos.finalidade },
                      { label: "Tipo de Taxa", value: resultado.dadosExtraidos.tipoTaxa === "pre_fixada" ? "Pré-Fixada" : resultado.dadosExtraidos.tipoTaxa === "pos_fixada" ? "Pós-Fixada" : resultado.dadosExtraidos.tipoTaxa },
                      { label: "Índice de Correção", value: resultado.dadosExtraidos.indiceCorrecao },
                      { label: "Taxa Remuneratória", value: resultado.dadosExtraidos.taxaJurosRemuneratorios != null ? `${resultado.dadosExtraidos.taxaJurosRemuneratorios.toFixed(2)}% a.a.` : null },
                      { label: "Taxa de Mora", value: resultado.dadosExtraidos.taxaJurosMora != null ? `${resultado.dadosExtraidos.taxaJurosMora.toFixed(3)}% a.a.` : null },
                      { label: "Multa", value: resultado.dadosExtraidos.taxaMulta != null ? `${resultado.dadosExtraidos.taxaMulta.toFixed(2)}%` : null },
                    ].map(({ label, value }) => (
                      <div key={label} className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium">{value ?? <span className="text-muted-foreground/50 italic">Não identificado</span>}</p>
                      </div>
                    ))}
                  </div>

                  {resultado.dadosExtraidos.garantias.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-medium mb-2">Garantias</p>
                        <div className="flex flex-wrap gap-1">
                          {resultado.dadosExtraidos.garantias.map((g) => (
                            <Badge key={g.slice(0, 80)} variant="outline" className="text-xs">{g}</Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {resultado.dadosExtraidos.clausulasRelevantes.length > 0 && (
                    <>
                      <Separator />
                      <Accordion type="multiple">
                        <AccordionItem value="clausulas">
                          <AccordionTrigger className="text-sm hover:no-underline">
                            Cláusulas Relevantes ({resultado.dadosExtraidos.clausulasRelevantes.length})
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              {resultado.dadosExtraidos.clausulasRelevantes.map((c) => (
                                <p key={c.slice(0, 80)} className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/30">{c}</p>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </>
                  )}

                  {resultado.dadosExtraidos.observacoes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-medium mb-1">Observações da IA</p>
                        <p className="text-xs text-muted-foreground">{resultado.dadosExtraidos.observacoes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Parecer Jurídico */}
            <TabsContent value="parecer">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Parecer Técnico-Jurídico</CardTitle>
                  <CardDescription className="text-xs">
                    Elaborado por inteligência artificial com base nos dados extraídos do contrato e na legislação aplicável ao crédito rural.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <Streamdown>{resultado.parecerJuridico}</Streamdown>
                  </div>
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Este parecer é gerado automaticamente por IA e tem caráter orientativo. Não substitui a análise jurídica especializada de um advogado habilitado.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Texto Extraído */}
            <TabsContent value="texto">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Texto Extraído do PDF</CardTitle>
                  <CardDescription className="text-xs">
                    Conteúdo bruto extraído do documento — {resultado.totalPaginas} página(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                      {resultado.textoExtraido || "Nenhum texto extraído."}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* CTA Calculadora */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Calcular TCR com os dados do contrato</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Os dados extraídos serão pré-preenchidos automaticamente na calculadora TCR.
                  </p>
                </div>
                <Button onClick={handleUsarNaCalculadora}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Abrir Calculadora
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
