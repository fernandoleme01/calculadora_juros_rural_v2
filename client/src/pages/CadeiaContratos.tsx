import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Plus,
  Trash2,
  FileText,
  ChevronRight,
  Loader2,
  Link2,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Edit2,
  Eye,
  Download,
  Upload,
  CheckCheck,
} from "lucide-react";
import UploadContratoPDF, { type DadosExtradosPDF } from "@/components/UploadContratoPDF";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtR = (n: number | string | null | undefined) => {
  const num = typeof n === 'string' ? parseFloat(n) : Number(n);
  return (isFinite(num) ? num : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const TIPO_LABELS: Record<string, { label: string; cor: string }> = {
  original: { label: "Contrato Original", cor: "bg-blue-100 text-blue-800 border-blue-200" },
  aditivo: { label: "Aditivo", cor: "bg-purple-100 text-purple-800 border-purple-200" },
  refinanciamento: { label: "Refinanciamento", cor: "bg-red-100 text-red-800 border-red-200" },
  novacao: { label: "Novação", cor: "bg-orange-100 text-orange-800 border-orange-200" },
  renegociacao: { label: "Renegociação", cor: "bg-yellow-100 text-yellow-800 border-yellow-200" },
};

const MODALIDADE_LABELS: Record<string, string> = {
  custeio: "Custeio",
  investimento: "Investimento",
  comercializacao: "Comercialização",
  outro: "Outro",
};

// ─── Schemas ─────────────────────────────────────────────────────────────────

const schemaCadeia = z.object({
  nome: z.string().min(3, "Nome obrigatório (mínimo 3 caracteres)"),
  banco: z.string().min(2, "Nome do banco obrigatório"),
  descricao: z.string().optional(),
});

const schemaContrato = z.object({
  ordem: z.coerce.number().int().positive("Ordem deve ser positiva"),
  tipo: z.enum(["original", "aditivo", "refinanciamento", "novacao", "renegociacao"]),
  numeroContrato: z.string().min(1, "Número do contrato obrigatório"),
  dataContratacao: z.string().min(1, "Data de contratação obrigatória"),
  dataVencimento: z.string().min(1, "Data de vencimento obrigatória"),
  modalidade: z.enum(["custeio", "investimento", "comercializacao", "outro"]),
  valorContrato: z.coerce.number().positive("Valor deve ser positivo"),
  valorPrincipalOriginal: z.coerce.number().optional(),
  valorEncargosIncorporados: z.coerce.number().optional(),
  taxaJurosAnual: z.coerce.number().positive("Taxa deve ser positiva"),
  taxaJurosMora: z.coerce.number().optional(),
  numeroParcelas: z.coerce.number().int().optional(),
  sistemaAmortizacao: z.enum(["price", "sac", "saf", "outro"]).optional(),
  garantias: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormCadeia = z.infer<typeof schemaCadeia>;
type FormContrato = z.infer<typeof schemaContrato>;

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function CadeiaContratos() {
  const [cadeiaAtiva, setCadeiaAtiva] = useState<number | null>(null);
  const [modalNovaCadeia, setModalNovaCadeia] = useState(false);
  const [modalNovoContrato, setModalNovoContrato] = useState(false);
  const [analise, setAnalise] = useState<any>(null);
  const [laudoTexto, setLaudoTexto] = useState<string | null>(null);
  const [nomeProdutor, setNomeProdutor] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("contratos");
  const [modoEntrada, setModoEntrada] = useState<"manual" | "pdf">("manual");
  const [pdfExtraido, setPdfExtraido] = useState(false);

  // ── Queries ──
  const { data: cadeias, refetch: refetchCadeias } = trpc.cadeia.listar.useQuery();
  const { data: cadeiaDetalhe, refetch: refetchDetalhe } = trpc.cadeia.buscar.useQuery(
    { id: cadeiaAtiva! },
    { enabled: cadeiaAtiva !== null }
  );

  // ── Mutations ──
  const criarCadeia = trpc.cadeia.criar.useMutation({
    onSuccess: (data) => {
      toast.success("Cadeia criada com sucesso!");
      setCadeiaAtiva(data.id);
      setModalNovaCadeia(false);
      refetchCadeias();
      formCadeia.reset();
    },
    onError: (e) => toast.error("Erro ao criar cadeia: " + e.message),
  });

  const deletarCadeia = trpc.cadeia.deletar.useMutation({
    onSuccess: () => {
      toast.success("Cadeia excluída.");
      setCadeiaAtiva(null);
      setAnalise(null);
      setLaudoTexto(null);
      refetchCadeias();
    },
    onError: (e) => toast.error("Erro ao excluir: " + e.message),
  });

  const adicionarContrato = trpc.cadeia.adicionarContrato.useMutation({
    onSuccess: () => {
      toast.success("Contrato adicionado!");
      setModalNovoContrato(false);
      refetchDetalhe();
      formContrato.reset();
    },
    onError: (e) => toast.error("Erro ao adicionar contrato: " + e.message),
  });

  const deletarContrato = trpc.cadeia.deletarContrato.useMutation({
    onSuccess: () => {
      toast.success("Contrato removido.");
      refetchDetalhe();
    },
    onError: (e) => toast.error("Erro ao remover: " + e.message),
  });

  const analisarMutation = trpc.cadeia.analisar.useMutation({
    onSuccess: (data) => {
      setAnalise(data);
      setAbaAtiva("analise");
      toast.success("Análise concluída!");
    },
    onError: (e) => toast.error("Erro na análise: " + e.message),
  });

  const gerarLaudoMutation = trpc.cadeia.gerarLaudo.useMutation({
    onSuccess: (data) => {
      setLaudoTexto(data.laudo);
      setAnalise(data.analise);
      setAbaAtiva("laudo");
      toast.success("Laudo gerado com sucesso!");
    },
    onError: (e) => toast.error("Erro ao gerar laudo: " + e.message),
  });

  // ── Forms ──
  const formCadeia = useForm<FormCadeia>({
    resolver: zodResolver(schemaCadeia) as any,
    defaultValues: { nome: "", banco: "", descricao: "" },
  });

  const formContrato = useForm<FormContrato>({
    resolver: zodResolver(schemaContrato) as any,
    defaultValues: {
      tipo: "original",
      modalidade: "custeio",
      ordem: (cadeiaDetalhe?.contratos?.length ?? 0) + 1,
    },
  });

  const tipoContrato = formContrato.watch("tipo");

  // ── Handlers ──
  const onSubmitCadeia = (data: FormCadeia) => criarCadeia.mutate(data);

  const onSubmitContrato = (data: FormContrato) => {
    if (!cadeiaAtiva) return;
    adicionarContrato.mutate({ ...data, cadeiaId: cadeiaAtiva });
  };

  const handlePdfExtraido = (dados: DadosExtradosPDF) => {
    // Pré-preenche o formulário com os dados extraídos do PDF
    if (dados.numeroCedula) formContrato.setValue("numeroContrato", dados.numeroCedula);
    if (dados.dataContratacao) formContrato.setValue("dataContratacao", dados.dataContratacao);
    if (dados.dataVencimento) formContrato.setValue("dataVencimento", dados.dataVencimento);
    if (dados.valorPrincipal) formContrato.setValue("valorContrato", dados.valorPrincipal);
    if (dados.taxaJurosAnual) formContrato.setValue("taxaJurosAnual", dados.taxaJurosAnual);
    if (dados.prazoMeses) formContrato.setValue("numeroParcelas", dados.prazoMeses);
    if (dados.garantias) formContrato.setValue("garantias", dados.garantias);
    if (dados.observacoes) formContrato.setValue("observacoes", dados.observacoes);
    if (dados.sistemaAmortizacao) {
      const sacMap: Record<string, any> = {
        price: "price", sac: "sac", saf: "saf", outro: "outro",
      };
      const s = sacMap[dados.sistemaAmortizacao.toLowerCase()];
      if (s) formContrato.setValue("sistemaAmortizacao", s);
    }
    if (dados.modalidade) {
      const modalMap: Record<string, any> = {
        custeio: "custeio", investimento: "investimento",
        comercializacao: "comercializacao", outro: "outro",
      };
      const m = modalMap[dados.modalidade.toLowerCase()];
      if (m) formContrato.setValue("modalidade", m);
    }
    setPdfExtraido(true);
    setModoEntrada("manual"); // Volta para o formulário com dados pré-preenchidos
    toast.success("Dados extraídos! Revise e confirme antes de salvar.");
  };

  const handleAnalisar = () => {
    if (!cadeiaAtiva) return;
    analisarMutation.mutate({ id: cadeiaAtiva });
  };

  const handleGerarLaudo = () => {
    if (!cadeiaAtiva || !nomeProdutor.trim()) {
      toast.error("Informe o nome do produtor rural para gerar o laudo.");
      return;
    }
    gerarLaudoMutation.mutate({ id: cadeiaAtiva, nomeProdutor });
  };

  const handleDownloadLaudo = () => {
    if (!laudoTexto) return;
    const blob = new Blob([laudoTexto], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laudo-cadeia-contratual-${cadeiaAtiva}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ──
  return (
    <div className="container py-6 max-w-7xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Link2 className="h-6 w-6 text-primary" />
          Análise de Cadeia Contratual
        </h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          Cadastre e analise contratos vinculados — operações de refinanciamento, aditivos e novações.
          O sistema detecta automaticamente práticas abusivas como a <strong>operação mata-mata</strong> e
          capitalização indevida de juros, gerando laudo técnico-jurídico fundamentado em jurisprudência real do STJ.
        </p>
      </div>

      {/* Alerta informativo */}
      <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">O que é a "Operação Mata-Mata"?</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm mt-1">
          Prática bancária em que um novo contrato é criado para quitar o anterior vencido, incorporando juros e multas
          ao novo principal. Configura <strong>anatocismo</strong> (juros sobre juros), vedado pelo Decreto nº 22.626/33.
          O STJ, no AgRg no REsp 1.370.585/RS, reconheceu a ilegalidade desta prática e o direito à revisão judicial.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lista de Cadeias */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Minhas Cadeias</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setModalNovaCadeia(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Nova
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!cadeias || cadeias.length === 0 ? (
                <div className="px-4 pb-4 text-center text-sm text-muted-foreground py-8">
                  <Link2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Nenhuma cadeia cadastrada
                </div>
              ) : (
                <div className="divide-y">
                  {cadeias.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => { setCadeiaAtiva(c.id); setAnalise(null); setLaudoTexto(null); setAbaAtiva("contratos"); }}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${cadeiaAtiva === c.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}
                    >
                      <p className="text-sm font-medium truncate">{c.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.banco}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Painel Principal */}
        <div className="lg:col-span-3">
          {!cadeiaAtiva ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-16">
                <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Selecione uma cadeia ou crie uma nova para começar a análise
                </p>
                <Button onClick={() => setModalNovaCadeia(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Nova Cadeia Contratual
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Header da cadeia */}
              {cadeiaDetalhe && (
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-bold text-lg">{cadeiaDetalhe.nome}</h2>
                        <p className="text-sm text-muted-foreground">{cadeiaDetalhe.banco}</p>
                        {cadeiaDetalhe.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">{cadeiaDetalhe.descricao}</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setModalNovoContrato(true)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Contrato
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleAnalisar}
                          disabled={analisarMutation.isPending || !cadeiaDetalhe.contratos?.length}
                        >
                          {analisarMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                          )}
                          Analisar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deletarCadeia.mutate({ id: cadeiaAtiva })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabs */}
              <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="contratos" className="gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Contratos
                    {cadeiaDetalhe?.contratos?.length ? (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">{cadeiaDetalhe.contratos.length}</Badge>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger value="analise" className="gap-1.5" disabled={!analise}>
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Análise
                    {analise?.alertasGerais?.length ? (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0">{analise.alertasGerais.length}</Badge>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger value="laudo" className="gap-1.5" disabled={!laudoTexto}>
                    <FileText className="h-3.5 w-3.5" />
                    Laudo
                  </TabsTrigger>
                </TabsList>

                {/* ── Aba Contratos ── */}
                <TabsContent value="contratos">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Linha do Tempo Contratual</CardTitle>
                      <CardDescription>
                        Contratos ordenados cronologicamente. Adicione todos os contratos da cadeia, incluindo refinanciamentos e aditivos.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!cadeiaDetalhe?.contratos?.length ? (
                        <div className="text-center py-10 text-muted-foreground">
                          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Nenhum contrato cadastrado ainda.</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={() => setModalNovoContrato(true)}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Contrato Original
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {[...(cadeiaDetalhe?.contratos ?? [])].sort((a: any, b: any) => a.ordem - b.ordem).map((c: any, idx: number) => (
                            <div key={c.id} className="relative">
                              {/* Linha de conexão */}
                              {idx > 0 && (
                                <div className="absolute -top-3 left-6 w-0.5 h-3 bg-border" />
                              )}
                              <div className="flex gap-3">
                                {/* Ícone de ordem */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-sm font-bold border-2 ${
                                  c.tipo === "original" ? "bg-blue-50 border-blue-300 text-blue-700" :
                                  c.tipo === "refinanciamento" || c.tipo === "novacao" ? "bg-red-50 border-red-300 text-red-700" :
                                  "bg-purple-50 border-purple-300 text-purple-700"
                                }`}>
                                  {c.ordem}
                                </div>
                                <div className="flex-1 border rounded-lg p-3 bg-card">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TIPO_LABELS[c.tipo]?.cor}`}>
                                          {TIPO_LABELS[c.tipo]?.label}
                                        </span>
                                        <span className="text-xs text-muted-foreground">Nº {c.numeroContrato}</span>
                                        {(c.tipo === "refinanciamento" || c.tipo === "novacao") && (
                                          <Badge variant="destructive" className="text-xs">
                                            <AlertTriangle className="h-2.5 w-2.5 mr-1" /> Mata-Mata
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                                        <div>
                                          <span className="text-muted-foreground">Valor:</span>{" "}
                                          <span className="font-medium">{fmtR(c.valorContrato)}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Taxa:</span>{" "}
                                          <span className={`font-medium ${parseFloat(c.taxaJurosAnual) > 12 ? "text-destructive" : "text-green-600"}`}>
                                            {(isNaN(parseFloat(c.taxaJurosAnual)) ? 0 : parseFloat(c.taxaJurosAnual)).toFixed(2)}% a.a.
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Contratação:</span>{" "}
                                          <span>{c.dataContratacao}</span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Vencimento:</span>{" "}
                                          <span>{c.dataVencimento}</span>
                                        </div>
                                        {c.valorEncargosIncorporados && parseFloat(c.valorEncargosIncorporados) > 0 && (
                                          <div className="col-span-2 text-destructive">
                                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                                            Encargos incorporados: {fmtR(c.valorEncargosIncorporados)}
                                          </div>
                                        )}
                                        {c.modalidade && (
                                          <div>
                                            <span className="text-muted-foreground">Modalidade:</span>{" "}
                                            <span>{MODALIDADE_LABELS[c.modalidade]}</span>
                                          </div>
                                        )}
                                      </div>
                                      {c.observacoes && (
                                        <p className="text-xs text-muted-foreground mt-1 italic">{c.observacoes}</p>
                                      )}
                                    </div>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                                      onClick={() => deletarContrato.mutate({ id: c.id, cadeiaId: cadeiaAtiva! })}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              {/* Seta de conexão */}
                              {idx < (cadeiaDetalhe?.contratos?.length ?? 0) - 1 && (
                                <div className="flex justify-start ml-6 mt-1">
                                  <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ── Aba Análise ── */}
                <TabsContent value="analise">
                  {analise && (
                    <div className="space-y-4">
                      {/* Cards de resumo */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Card>
                          <CardContent className="pt-4 pb-3">
                            <p className="text-xs text-muted-foreground">Valor Original</p>
                            <p className="text-base font-bold">{fmtR(analise.valorOriginalFinanciado)}</p>
                            <p className="text-xs text-muted-foreground">1º contrato</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 pb-3">
                            <p className="text-xs text-muted-foreground">Valor Atual</p>
                            <p className="text-base font-bold">{fmtR(analise.valorAtualDivida)}</p>
                            <p className="text-xs text-muted-foreground">último contrato</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 pb-3">
                            <p className="text-xs text-muted-foreground">Crescimento</p>
                            <p className={`text-base font-bold ${analise.incrementoTotal > 0 ? "text-destructive" : "text-green-600"}`}>
                              {Number(analise.percentualIncremento || 0).toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">{fmtR(analise.incrementoTotal)}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 pb-3">
                            <p className="text-xs text-muted-foreground">Encargos Capitalizados</p>
                            <p className={`text-base font-bold ${analise.encargosIncorporadosTotal > 0 ? "text-destructive" : "text-green-600"}`}>
                              {fmtR(analise.encargosIncorporadosTotal)}
                            </p>
                            <p className="text-xs text-muted-foreground">indevidamente</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Indicadores */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={analise.mataMataDetectado ? "destructive" : "outline"} className="gap-1">
                          {analise.mataMataDetectado ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                          Operação Mata-Mata: {analise.mataMataDetectado ? "DETECTADA" : "Não detectada"}
                        </Badge>
                        <Badge variant={analise.capitalizacaoIndevidaDetectada ? "destructive" : "outline"} className="gap-1">
                          {analise.capitalizacaoIndevidaDetectada ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                          Capitalização Indevida: {analise.capitalizacaoIndevidaDetectada ? "DETECTADA" : "Não detectada"}
                        </Badge>
                        <Badge variant={analise.taxaAcimaLegalDetectada ? "destructive" : "outline"} className="gap-1">
                          {analise.taxaAcimaLegalDetectada ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                          Taxa acima do limite: {analise.taxaAcimaLegalDetectada ? "SIM" : "Não"}
                        </Badge>
                      </div>

                      {/* Alertas Gerais */}
                      {analise.alertasGerais?.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm">Alertas da Cadeia Contratual</h3>
                          {analise.alertasGerais.map((alerta: any, i: number) => (
                            <Alert key={i} variant={alerta.tipo === "critico" ? "destructive" : "default"} className={alerta.tipo === "atencao" ? "border-amber-300 bg-amber-50" : ""}>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle className="text-sm">{alerta.titulo}</AlertTitle>
                              <AlertDescription className="text-xs mt-1">
                                <p>{alerta.descricao}</p>
                                <p className="mt-1 font-medium opacity-80">Fundamentação: {alerta.fundamentacao}</p>
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      )}

                      {/* Alertas por contrato */}
                      {analise.analiseContratos?.some((a: any) => a.alertas?.length > 0) && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm">Alertas por Contrato</h3>
                          {analise.analiseContratos.map((a: any) =>
                            a.alertas?.length > 0 ? (
                              <div key={a.contrato.ordem} className="border rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TIPO_LABELS[a.contrato.tipo]?.cor}`}>
                                    {TIPO_LABELS[a.contrato.tipo]?.label}
                                  </span>
                                  <span className="text-xs text-muted-foreground">Nº {a.contrato.numeroContrato}</span>
                                </div>
                                <div className="space-y-2">
                                  {a.alertas.map((alerta: any, i: number) => (
                                    <div key={i} className={`text-xs p-2 rounded border ${alerta.tipo === "critico" ? "bg-red-50 border-red-200 text-red-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
                                      <p className="font-semibold">{alerta.titulo}</p>
                                      <p className="mt-0.5">{alerta.descricao}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null
                          )}
                        </div>
                      )}

                      {/* Gerar Laudo */}
                      <Card className="border-primary/30 bg-primary/5">
                        <CardContent className="pt-4 pb-4">
                          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            Gerar Laudo Técnico-Jurídico da Cadeia
                          </h3>
                          <div className="flex gap-3 items-end">
                            <div className="flex-1 space-y-1">
                              <Label htmlFor="nomeProdutor" className="text-xs">Nome do Produtor Rural</Label>
                              <Input
                                id="nomeProdutor"
                                placeholder="Ex: João da Silva"
                                value={nomeProdutor}
                                onChange={(e) => setNomeProdutor(e.target.value)}
                                className="h-9 text-sm"
                              />
                            </div>
                            <Button
                              onClick={handleGerarLaudo}
                              disabled={gerarLaudoMutation.isPending || !nomeProdutor.trim()}
                              className="h-9"
                            >
                              {gerarLaudoMutation.isPending ? (
                                <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Gerando...</>
                              ) : (
                                <><FileText className="h-3.5 w-3.5 mr-1" /> Gerar Laudo</>
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            O laudo será gerado com IA, incluindo fundamentação jurídica completa, jurisprudência do STJ e memória de cálculo.
                            Os dados do perito técnico e advogado serão incluídos automaticamente do seu perfil.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                {/* ── Aba Laudo ── */}
                <TabsContent value="laudo">
                  {laudoTexto && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">Laudo Técnico-Jurídico</CardTitle>
                            <CardDescription>Análise completa da cadeia contratual com fundamentação jurídica</CardDescription>
                          </div>
                          <Button size="sm" variant="outline" onClick={handleDownloadLaudo}>
                            <Download className="h-3.5 w-3.5 mr-1" /> Baixar
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[600px] rounded-md border bg-muted/30 p-4">
                          <pre className="text-xs font-mono whitespace-pre-wrap text-foreground leading-relaxed">
                            {laudoTexto}
                          </pre>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Nova Cadeia ── */}
      <Dialog open={modalNovaCadeia} onOpenChange={setModalNovaCadeia}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Cadeia Contratual</DialogTitle>
            <DialogDescription>
              Crie um grupo para organizar contratos vinculados (original + aditivos/refinanciamentos)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={formCadeia.handleSubmit(onSubmitCadeia)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome da Cadeia *</Label>
              <Input
                id="nome"
                placeholder="Ex: Financiamento Safra 2020/21 — Banco X"
                {...formCadeia.register("nome")}
              />
              {formCadeia.formState.errors.nome && (
                <p className="text-xs text-destructive">{formCadeia.formState.errors.nome.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="banco">Banco / Instituição Financeira *</Label>
              <Input
                id="banco"
                placeholder="Ex: Banco do Brasil S.A."
                {...formCadeia.register("banco")}
              />
              {formCadeia.formState.errors.banco && (
                <p className="text-xs text-destructive">{formCadeia.formState.errors.banco.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva brevemente a situação do produtor rural..."
                rows={3}
                {...formCadeia.register("descricao")}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalNovaCadeia(false)}>Cancelar</Button>
              <Button type="submit" disabled={criarCadeia.isPending}>
                {criarCadeia.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Criar Cadeia
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Novo Contrato ── */}
      <Dialog open={modalNovoContrato} onOpenChange={setModalNovoContrato}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Contrato à Cadeia</DialogTitle>
            <DialogDescription>
              Informe os dados do contrato. Para refinanciamentos e novações, informe o saldo devedor do contrato anterior e os encargos incorporados.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={formContrato.handleSubmit(onSubmitContrato)} className="space-y-4">
            {/* Seletor de modo: manual ou PDF */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => setModoEntrada("manual")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  modoEntrada === "manual"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Edit2 className="h-3.5 w-3.5" />
                Preencher Manualmente
              </button>
              <button
                type="button"
                onClick={() => setModoEntrada("pdf")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  modoEntrada === "pdf"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                Importar PDF do Contrato
              </button>
            </div>

            {/* Badge de PDF extraído */}
            {pdfExtraido && modoEntrada === "manual" && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                <CheckCheck className="h-3.5 w-3.5" />
                Dados importados do PDF — revise os campos abaixo antes de salvar
              </div>
            )}

            {/* Modo PDF: exibe o componente de upload */}
            {modoEntrada === "pdf" && (
              <UploadContratoPDF
                onDadosExtraidos={(dados) => handlePdfExtraido(dados)}
                onFechar={() => setModoEntrada("manual")}
              />
            )}

            {/* Modo manual (ou após PDF): exibe o formulário */}
            {modoEntrada === "manual" && (
            <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ordem na Cadeia *</Label>
                <Input
                  type="number"
                  min="1"
                  defaultValue={(cadeiaDetalhe?.contratos?.length ?? 0) + 1}
                  {...formContrato.register("ordem")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo do Contrato *</Label>
                <Select
                  defaultValue="original"
                  onValueChange={(v) => formContrato.setValue("tipo", v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Contrato Original</SelectItem>
                    <SelectItem value="aditivo">Aditivo</SelectItem>
                    <SelectItem value="refinanciamento">Refinanciamento (Mata-Mata)</SelectItem>
                    <SelectItem value="novacao">Novação</SelectItem>
                    <SelectItem value="renegociacao">Renegociação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(tipoContrato === "refinanciamento" || tipoContrato === "novacao") && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 text-xs">
                  <strong>Atenção — Operação Mata-Mata:</strong> Informe o saldo devedor do contrato anterior e o valor dos encargos (juros, multas) que foram incorporados ao novo principal. Esses dados são essenciais para a análise de capitalização indevida.
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Número do Contrato *</Label>
                <Input placeholder="Ex: 2020/001234" {...formContrato.register("numeroContrato")} />
                {formContrato.formState.errors.numeroContrato && (
                  <p className="text-xs text-destructive">{formContrato.formState.errors.numeroContrato.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Modalidade *</Label>
                <Select defaultValue="custeio" onValueChange={(v) => formContrato.setValue("modalidade", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custeio">Custeio</SelectItem>
                    <SelectItem value="investimento">Investimento</SelectItem>
                    <SelectItem value="comercializacao">Comercialização</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data de Contratação *</Label>
                <Input placeholder="DD/MM/AAAA" {...formContrato.register("dataContratacao")} />
              </div>
              <div className="space-y-1.5">
                <Label>Data de Vencimento *</Label>
                <Input placeholder="DD/MM/AAAA" {...formContrato.register("dataVencimento")} />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Valor do Contrato (R$) *</Label>
                <Input type="number" step="0.01" placeholder="Ex: 500000.00" {...formContrato.register("valorContrato")} />
                {formContrato.formState.errors.valorContrato && (
                  <p className="text-xs text-destructive">{formContrato.formState.errors.valorContrato.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Taxa de Juros (% a.a.) *</Label>
                <Input type="number" step="0.01" placeholder="Ex: 15.50" {...formContrato.register("taxaJurosAnual")} />
                {formContrato.formState.errors.taxaJurosAnual && (
                  <p className="text-xs text-destructive">{formContrato.formState.errors.taxaJurosAnual.message}</p>
                )}
              </div>
              {(tipoContrato === "refinanciamento" || tipoContrato === "novacao" || tipoContrato === "renegociacao") && (
                <>
                  <div className="space-y-1.5">
                    <Label>Saldo Devedor do Contrato Anterior (R$)</Label>
                    <Input type="number" step="0.01" placeholder="Saldo que estava sendo quitado" {...formContrato.register("valorPrincipalOriginal")} />
                    <p className="text-xs text-muted-foreground">Valor do saldo devedor do contrato anterior no momento da novação/refinanciamento</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Encargos Incorporados ao Novo Principal (R$)</Label>
                    <Input type="number" step="0.01" placeholder="Juros/multas embutidos no novo contrato" {...formContrato.register("valorEncargosIncorporados")} />
                    <p className="text-xs text-muted-foreground">Juros vencidos, multas e correção incorporados ao novo principal (anatocismo)</p>
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label>Taxa de Mora (% a.a.)</Label>
                <Input type="number" step="0.01" placeholder="Ex: 1.00" {...formContrato.register("taxaJurosMora")} />
              </div>
              <div className="space-y-1.5">
                <Label>Número de Parcelas</Label>
                <Input type="number" step="1" placeholder="Ex: 5" {...formContrato.register("numeroParcelas")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Garantias</Label>
              <Input placeholder="Ex: Penhor agrícola, hipoteca, aval..." {...formContrato.register("garantias")} />
            </div>

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                placeholder="Informações adicionais relevantes sobre este contrato..."
                rows={2}
                {...formContrato.register("observacoes")}
              />
            </div>
            </>
            )} {/* fim modoEntrada === manual */}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalNovoContrato(false)}>Cancelar</Button>
              <Button type="submit" disabled={adicionarContrato.isPending}>
                {adicionarContrato.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Adicionar Contrato
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
