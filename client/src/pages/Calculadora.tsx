import { useState } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Info, AlertTriangle, Plus, Trash2, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import UploadContratoPDF, { type DadosExtradosPDF } from "@/components/UploadContratoPDF";
import { type DadosDEDDDC } from "@/components/UploadDEDDDC";
import ChecklistDEDDDC from "@/components/ChecklistDEDDDC";
import { executarChecklist } from "@/lib/checklistDEDDDC";

const formSchema = z.object({
  nomeDevedor: z.string().optional(),
  numeroCedula: z.string().optional(),
  modalidade: z.enum(["custeio", "investimento", "comercializacao"]),
  tipoTaxa: z.enum(["pre_fixada", "pos_fixada"]),
  valorPrincipal: z.coerce.number().positive("Informe um valor positivo"),
  dataContratacao: z.string().min(1, "Informe a data de contratação"),
  dataVencimento: z.string().min(1, "Informe a data de vencimento"),
  dataCalculo: z.string().min(1, "Informe a data do cálculo"),
  prazoMeses: z.coerce.number().int().positive("Informe o prazo em meses"),
  taxaJurosRemuneratorios: z.coerce.number().min(0).max(9999),
  taxaJurosMora: z.coerce.number().min(0).max(9999).default(1),
  taxaJurosMoraUnidade: z.enum(["aa", "am"]).default("aa"),
  taxaMulta: z.coerce.number().min(0).max(100).default(2),
  taxaJm: z.union([z.string(), z.number()]).optional().transform(v => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? undefined : n;
  }),
  fatorInflacaoImplicita: z.union([z.string(), z.number()]).optional().transform(v => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? undefined : n;
  }),
  fatorPrograma: z.union([z.string(), z.number()]).optional().transform(v => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? undefined : n;
  }),
  fatorAjuste: z.union([z.string(), z.number()]).optional().transform(v => {
    if (v === "" || v === null || v === undefined) return 0;
    const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    return isNaN(n) ? 0 : n;
  }).default(0),
  // Parcelas pagas
  numeroParcelas: z.coerce.number().int().positive().optional(),
  parcelasPagas: z.coerce.number().int().min(0).optional(),
  valorParcelaPaga: z.coerce.number().positive().optional(),
  saldoDevedorBanco: z.coerce.number().positive().optional(),
  periodicidadeParcela: z.enum(["mensal", "anual"]).default("anual"),
  // Encargos adicionais
  iofCobrado: z.coerce.number().min(0).optional(),
  tacCobrada: z.coerce.number().min(0).optional(),
  tecCobrada: z.coerce.number().min(0).optional(),
  outrasTagas: z.coerce.number().min(0).optional(),
  salvar: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

// Armazenamento temporário do resultado para passar para a página de resultado
let resultadoTemp: unknown = null;
let inputTemp: unknown = null;

export function getResultadoTemp() {
  // Primeiro tenta memória (navegação normal), depois sessionStorage (reload/direct URL)
  if (resultadoTemp) return resultadoTemp;
  try {
    const raw = sessionStorage.getItem("tcr_resultado");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}
export function getInputTemp() {
  if (inputTemp) return inputTemp;
  try {
    const raw = sessionStorage.getItem("tcr_input");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export default function Calculadora() {
  const [, setLocation] = useLocation();
  const [ipcaMensal, setIpcaMensal] = useState<number[]>([]);
  const [novoIpca, setNovoIpca] = useState("");
  const [tipoTaxaSelecionada, setTipoTaxaSelecionada] = useState<"pre_fixada" | "pos_fixada">("pos_fixada");
  const [mostrarUpload, setMostrarUpload] = useState(false);
  const [pdfExtraido, setPdfExtraido] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [mostrarParcelas, setMostrarParcelas] = useState(false);
  const [linhaSelecionada, setLinhaSelecionada] = useState<string>("nenhuma");
  const [dedImportado, setDedImportado] = useState(false);
  const [dadosDED, setDadosDED] = useState<DadosDEDDDC | null>(null);
  const [mostrarChecklistDED, setMostrarChecklistDED] = useState(false);
  // Estado de capitalização mensal detectada no PDF
  const [capitalizacaoDetectada, setCapitalizacaoDetectada] = useState<{
    tem: boolean;
    clausula: string | null;
    indicio: string | null;
    taxaMensal: number | null;
  } | null>(null);

  const { data: limites } = trpc.tcr.limitesLegais.useQuery();
  const { data: linhasCredito } = trpc.mcr.linhas.useQuery();

  const calcularMutation = trpc.tcr.calcular.useMutation({
    onSuccess: (data) => {
      resultadoTemp = data;
      inputTemp = getValues();
      // Persistir no sessionStorage para sobreviver a reload e acesso direto à URL
      try {
        sessionStorage.setItem("tcr_resultado", JSON.stringify(data));
        sessionStorage.setItem("tcr_input", JSON.stringify(getValues()));
      } catch { /* ignore quota errors */ }
      setLocation("/resultado");
    },
    onError: (err) => {
      toast.error("Erro ao calcular: " + err.message);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      modalidade: "custeio",
      tipoTaxa: "pos_fixada",
      taxaJurosMora: 1,
      taxaJurosMoraUnidade: "aa" as const,
      taxaMulta: 2,
      fatorAjuste: 0,
      salvar: true,
      dataCalculo: new Date().toISOString().split("T")[0],
    },
  });

  // Ler dados importados do DED/DDC via sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem("ded_ddc_dados");
    if (!raw) return;
    try {
      const d: DadosDEDDDC = JSON.parse(raw);
      sessionStorage.removeItem("ded_ddc_dados");
      setDadosDED(d);
      // Verificar se há campos críticos ausentes para exibir checklist
      const checklist = executarChecklist(d);
      if (!checklist.podeCalcular || checklist.importantes.length > 0) {
        setMostrarChecklistDED(true);
      }
      if (d.nomeDevedor) setValue("nomeDevedor", d.nomeDevedor);
      if (d.numeroCedula) setValue("numeroCedula", d.numeroCedula);
      if (d.valorPrincipal) setValue("valorPrincipal", d.valorPrincipal);
      if (d.prazoMeses) setValue("prazoMeses", d.prazoMeses);
      if (d.taxaJurosRemuneratoriosAA) setValue("taxaJurosRemuneratorios", d.taxaJurosRemuneratoriosAA);
      if (d.taxaJurosMoraAA) setValue("taxaJurosMora", d.taxaJurosMoraAA);
      if (d.taxaMulta) setValue("taxaMulta", d.taxaMulta);
      if (d.iof) setValue("iofCobrado", d.iof);
      if (d.tac) setValue("tacCobrada", d.tac);
      if (d.tec) setValue("tecCobrada", d.tec);
      if (d.numeroParcelas) setValue("numeroParcelas", d.numeroParcelas);
      if (d.dataContratacao) setValue("dataContratacao", d.dataContratacao);
      if (d.dataVencimento) setValue("dataVencimento", d.dataVencimento);
      if (d.modalidade) setValue("modalidade", d.modalidade);
      setDedImportado(true);
      toast.success("Dados do DED/DDC importados! Verifique os campos destacados.");
    } catch {
      // ignorar erro de parse
    }
  }, [setValue]);

  // Converter strings para número (campos agora são type=text para evitar limitações do browser)
  const _taxaRemRaw = watch("taxaJurosRemuneratorios");
  const _taxaMoraRaw = watch("taxaJurosMora");
  const _valorPrincipalRaw = watch("valorPrincipal");
  const _prazoMesesRaw = watch("prazoMeses");
  const parseNum = (v: unknown) => { const n = parseFloat(String(v ?? "").replace(",", ".")); return isNaN(n) ? 0 : n; };
  const taxaRem = parseNum(_taxaRemRaw);
  const taxaMora = parseNum(_taxaMoraRaw);
  const valorPrincipalAtual = parseNum(_valorPrincipalRaw);
  const prazoMesesAtual = parseNum(_prazoMesesRaw);
  const { data: comparativoMCR } = trpc.mcr.comparativo.useQuery(
    { taxaContratadaAA: taxaRem, linhaId: linhaSelecionada, valorPrincipal: valorPrincipalAtual, prazoMeses: prazoMesesAtual },
    { enabled: !!linhaSelecionada && linhaSelecionada !== "nenhuma" && taxaRem > 0 }
  );

  const adicionarIpca = () => {
    const val = parseFloat(novoIpca);
    if (!isNaN(val)) {
      setIpcaMensal([...ipcaMensal, val]);
      setNovoIpca("");
    }
  };

  const removerIpca = (idx: number) => {
    setIpcaMensal(ipcaMensal.filter((_, i) => i !== idx));
  };

  const taxaMoraUnidade = watch("taxaJurosMoraUnidade");

  // Converte mora para % a.a. se informada em % a.m.
  const taxaMoraEmAA = taxaMoraUnidade === "am"
    ? (Math.pow(1 + (taxaMora || 0) / 100, 12) - 1) * 100
    : (taxaMora || 0);

  const onSubmit = (data: FormValues) => {
    // Normalizar mora para % a.a. antes de enviar
    const taxaMoraAA = data.taxaJurosMoraUnidade === "am"
      ? (Math.pow(1 + data.taxaJurosMora / 100, 12) - 1) * 100
      : data.taxaJurosMora;
    const payload = {
      ...data,
      taxaJurosMora: taxaMoraAA,
      dataContratacao: new Date(data.dataContratacao).toISOString(),
      dataVencimento: new Date(data.dataVencimento).toISOString(),
      dataCalculo: new Date(data.dataCalculo).toISOString(),
      ipcaMensal: tipoTaxaSelecionada === "pos_fixada" ? ipcaMensal : undefined,
    };
    calcularMutation.mutate(payload);
  };

  const limiteRemExcedido = taxaRem > (limites?.jurosRemuneratoriosMaxAA ?? 12);
  const limiteMoraExcedido = taxaMoraEmAA > (limites?.jurosMoraMaxAA ?? 1);

  // Mapeamento de modalidade do PDF para o enum do formulário
  const mapModalidade = (m: string | null): "custeio" | "investimento" | "comercializacao" => {
    if (!m) return "custeio";
    if (m.includes("custeio")) return "custeio";
    if (m.includes("investimento")) return "investimento";
    if (m.includes("comercializacao") || m.includes("comercialização")) return "comercializacao";
    return "custeio";
  };

  // Converte data DD/MM/AAAA para YYYY-MM-DD
  const parseDataBR = (d: string | null): string => {
    if (!d) return "";
    const parts = d.split("/");
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return d;
  };

  const handleDadosExtraidos = (dados: DadosExtradosPDF, url: string) => {
    setPdfUrl(url);
    setPdfExtraido(true);
    setMostrarUpload(false);
    // Pré-preencher campos do formulário
    if (dados.nomeDevedor) setValue("nomeDevedor", dados.nomeDevedor);
    if (dados.numeroCedula) setValue("numeroCedula", dados.numeroCedula);
    if (dados.valorPrincipal) setValue("valorPrincipal", dados.valorPrincipal);
    if (dados.prazoMeses) setValue("prazoMeses", dados.prazoMeses);
    if (dados.taxaJurosAnual) setValue("taxaJurosRemuneratorios", dados.taxaJurosAnual);
    if (dados.dataContratacao) setValue("dataContratacao", parseDataBR(dados.dataContratacao));
    if (dados.dataVencimento) setValue("dataVencimento", parseDataBR(dados.dataVencimento));
    setValue("modalidade", mapModalidade(dados.modalidade));

    // ── Mora: detectar unidade automaticamente e pré-selecionar ──
    if (dados.taxaJurosMora != null) {
      setValue("taxaJurosMora", dados.taxaJurosMora);
      const unidade = dados.taxaJurosMoraUnidade === "am" ? "am" : "aa";
      setValue("taxaJurosMoraUnidade", unidade);
      if (unidade === "am") {
        // Avisar o usuário que a mora foi detectada em % a.m. e será convertida
        const moraAA = ((Math.pow(1 + dados.taxaJurosMora / 100, 12) - 1) * 100).toFixed(4);
        toast.warning(
          `Mora detectada em % a.m. (${dados.taxaJurosMora}% a.m. = ${moraAA}% a.a.). Unidade selecionada automaticamente.`,
          { duration: 6000 }
        );
      }
    }

    // ── Multa e encargos ──
    if (dados.taxaMulta != null) setValue("taxaMulta", dados.taxaMulta);
    if (dados.iof != null) setValue("iofCobrado", dados.iof);
    if (dados.tac != null) setValue("tacCobrada", dados.tac);
    if (dados.tec != null) setValue("tecCobrada", dados.tec);
    if (dados.numeroParcelas != null) setValue("numeroParcelas", dados.numeroParcelas);

    // Detectar tipo de taxa pelo indexador
    if (dados.indexador === "prefixado") {
      setTipoTaxaSelecionada("pre_fixada");
      setValue("tipoTaxa", "pre_fixada");
    } else {
      setTipoTaxaSelecionada("pos_fixada");
      setValue("tipoTaxa", "pos_fixada");
    }

    // ── Capitalização mensal (anatocismo) ──
    if (dados.temCapitalizacaoMensal != null) {
      setCapitalizacaoDetectada({
        tem: dados.temCapitalizacaoMensal === true,
        clausula: dados.clausulaCapitalizacao ?? null,
        indicio: dados.indicioCapitalizacao ?? null,
        taxaMensal: dados.taxaMensalContrato ?? null,
      });
      if (dados.temCapitalizacaoMensal) {
        toast.error(
          "ATENÇÃO: Capitalização mensal de juros (anatocismo) detectada no contrato!",
          { duration: 8000 }
        );
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Calculadora de TCR — Crédito Rural
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha os dados do financiamento para calcular a Taxa de Custo Real (TCR) com fundamentação legal.
        </p>
      </div>

      {/* Banner de dados importados do DED/DDC */}
      {dedImportado && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/40 bg-green-500/5">
            <FileText className="h-5 w-5 text-green-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Dados importados do DED/DDC</p>
              <p className="text-xs text-muted-foreground">Os campos foram pré-preenchidos automaticamente. Revise e ajuste se necessário.</p>
            </div>
            <div className="flex items-center gap-1">
              {dadosDED && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarChecklistDED(!mostrarChecklistDED)}
                  className="text-xs h-7"
                >
                  {mostrarChecklistDED ? "Ocultar" : "Ver Checklist"}
                </Button>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={() => { setDedImportado(false); setMostrarChecklistDED(false); }} className="text-muted-foreground">
                ✕
              </Button>
            </div>
          </div>
          {mostrarChecklistDED && dadosDED && (
            <ChecklistDEDDDC
              dados={dadosDED}
              onCalcular={() => setMostrarChecklistDED(false)}
              className="border rounded-xl"
            />
          )}
        </div>
      )}

      {/* Botão de importar PDF */}
      {!pdfExtraido && !mostrarUpload && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-primary/40 bg-primary/5">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Tem o contrato em PDF?</p>
            <p className="text-xs text-muted-foreground">A IA extrai os dados automaticamente e preenche o formulário</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setMostrarUpload(true)}>
            <FileText className="h-3 w-3 mr-1" /> Importar PDF
          </Button>
        </div>
      )}

      {mostrarUpload && (
        <UploadContratoPDF
          onDadosExtraidos={handleDadosExtraidos}
          onFechar={() => setMostrarUpload(false)}
        />
      )}

      {pdfExtraido && (
        <div className="space-y-2">
          <Alert className="border-green-200 bg-green-50">
            <FileText className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-700">
              <strong>Contrato importado via PDF.</strong> Os campos abaixo foram pré-preenchidos pela IA — revise antes de calcular.
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-2 h-6 text-xs text-green-700 hover:text-green-900"
                onClick={() => { setPdfExtraido(false); setPdfUrl(null); setMostrarUpload(true); }}
              >
                Trocar PDF
              </Button>
            </AlertDescription>
          </Alert>
          {taxaMoraUnidade === "am" && (
            <Alert className="border-amber-300 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs text-amber-800">
                <strong>Mora em % a.m. detectada automaticamente.</strong> O contrato expressa a mora em percentual ao mês.
                O sistema selecionou a unidade <strong>% a.m.</strong> e exibe o equivalente anual ({taxaMoraEmAA.toFixed(4)}% a.a.) no campo abaixo.
                O valor será convertido corretamente no cálculo.
              </AlertDescription>
            </Alert>
          )}

          {/* ── Alerta de Capitalização Mensal (Anatocismo) ── */}
          {capitalizacaoDetectada?.tem && (
            <div className="rounded-lg border-2 border-red-400 bg-red-50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-red-800">
                    CAPITALIZAÇÃO MENSAL DE JUROS (ANATOCISMO) DETECTADA
                  </p>
                  <p className="text-xs text-red-700">
                    A IA identificou indícios de capitalização mensal de juros neste contrato, prática vedada para crédito rural.
                  </p>
                </div>
              </div>

              {/* Tipo de indício */}
              {capitalizacaoDetectada.indicio && (
                <div className="rounded bg-red-100 px-3 py-2">
                  <p className="text-xs font-semibold text-red-800 mb-0.5">Tipo de indício detectado:</p>
                  <p className="text-xs text-red-700">
                    {capitalizacaoDetectada.indicio === "taxa_composta" && "Taxa composta: a taxa anual não corresponde à simples multiplicação da taxa mensal por 12, indicando cálculo exponencial."}
                    {capitalizacaoDetectada.indicio === "clausula_expressa" && "Cláusula expressa: o contrato menciona explicitamente capitalização mensal ou juros sobre juros."}
                    {capitalizacaoDetectada.indicio === "sistema_price" && "Sistema Price com taxa mensal: o Sistema Price (Tabela Price) aplica capitalização composta por natureza matemática."}
                    {capitalizacaoDetectada.indicio === "taxa_dupla" && "Taxa dupla: o contrato expressa simultaneamente a taxa mensal e anual com conversão composta."}
                  </p>
                </div>
              )}

              {/* Cláusula encontrada */}
              {capitalizacaoDetectada.clausula && (
                <div className="rounded bg-red-100 px-3 py-2">
                  <p className="text-xs font-semibold text-red-800 mb-0.5">Cláusula identificada no contrato:</p>
                  <p className="text-xs text-red-700 italic">“{capitalizacaoDetectada.clausula}”</p>
                </div>
              )}

              {/* Fundamentação legal */}
              <div className="rounded bg-red-100 px-3 py-2 space-y-1.5">
                <p className="text-xs font-semibold text-red-800">Fundamentação legal:</p>
                <ul className="space-y-1">
                  <li className="text-xs text-red-700">
                    <strong>Súmula 93/STJ:</strong> “A legislação sobre cédulas de crédito rural, comercial e industrial admite o pacto de capitalização de juros.” — <em>porém, a capitalização deve ser expressamente pactuada.</em>
                  </li>
                  <li className="text-xs text-red-700">
                    <strong>DL 167/67, art. 5º:</strong> As cédulas de crédito rural podem estipular capitalização de juros, mas somente quando expressamente prevista e nos limites fixados pelo CMN.
                  </li>
                  <li className="text-xs text-red-700">
                    <strong>Res. CMN 4.788/2020 e MCR 2-1:</strong> As taxas de juros do crédito rural são fixadas em percentual ao ano. A expressão de taxa mensal com capitalização composta não autorizada eleva o custo real acima do limite legal.
                  </li>
                  <li className="text-xs text-red-700">
                    <strong>STJ, REsp 1.061.530/RS (repetitivo):</strong> É vedada a capitalização de juros em período inferior ao anual nos contratos de crédito rural, salvo expressão contratual e autorização normativa específica.
                  </li>
                  <li className="text-xs text-red-700">
                    <strong>CDC, art. 51, IV:</strong> São nulas de pleno direito as cláusulas que estabeleçam obrigações consideráveis injuístas ou abusivas.
                  </li>
                </ul>
              </div>

              {/* Impacto financeiro estimado */}
              {capitalizacaoDetectada.taxaMensal != null && (
                <div className="rounded bg-red-100 px-3 py-2">
                  <p className="text-xs font-semibold text-red-800 mb-0.5">Impacto da capitalização:</p>
                  <p className="text-xs text-red-700">
                    Taxa mensal de <strong>{capitalizacaoDetectada.taxaMensal}% a.m.</strong> com capitalização composta equivale a{" "}
                    <strong>{((Math.pow(1 + capitalizacaoDetectada.taxaMensal / 100, 12) - 1) * 100).toFixed(4)}% a.a.</strong>{" "}
                    (regime composto), contra{" "}
                    <strong>{(capitalizacaoDetectada.taxaMensal * 12).toFixed(4)}% a.a.</strong>{" "}
                    (regime simples/linear). A diferença representa o excesso cobrado por anatocismo.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-red-600 font-medium">Recomenda-se incluir questão específica sobre anatocismo no laudo pericial.</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-red-600 hover:text-red-800"
                  onClick={() => setCapitalizacaoDetectada(null)}
                >
                  Dispensar
                </Button>
              </div>
            </div>
          )}

          {/* Aviso quando não detectou capitalização */}
          {capitalizacaoDetectada && !capitalizacaoDetectada.tem && (
            <Alert className="border-green-300 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-xs text-green-800">
                <strong>Capitalização mensal não detectada.</strong> A IA não identificou indícios de anatocismo neste contrato. Isso não exclui a análise pericial manual.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identificação */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Identificação do Financiamento</CardTitle>
            <CardDescription>Dados de identificação da cédula ou contrato</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nomeDevedor">Nome do Devedor / Produtor Rural</Label>
              <Input id="nomeDevedor" placeholder="Nome completo" {...register("nomeDevedor")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numeroCedula">Nº da Cédula / Contrato</Label>
              <Input id="numeroCedula" placeholder="Ex: CCR-2024-001" {...register("numeroCedula")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modalidade">Modalidade do Crédito Rural</Label>
              <Select onValueChange={(v) => setValue("modalidade", v as "custeio" | "investimento" | "comercializacao")} defaultValue="custeio">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custeio">Custeio Agrícola / Pecuário</SelectItem>
                  <SelectItem value="investimento">Investimento Rural</SelectItem>
                  <SelectItem value="comercializacao">Comercialização</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Linha de Crédito (MCR) — Comparativo automático</Label>
              <Select value={linhaSelecionada} onValueChange={setLinhaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione para confronto com norma MCR" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">Não informar</SelectItem>
                  {linhasCredito && [
                    { grupo: "pronaf", label: "Pronaf" },
                    { grupo: "pronamp", label: "Pronamp" },
                    { grupo: "moderacao", label: "Programas Federais" },
                    { grupo: "fundos", label: "Fundos Constitucionais" },
                    { grupo: "livre", label: "Recursos Livres" },
                  ].map(({ grupo, label }) => {
                    const itens = linhasCredito.filter(l => l.grupo === grupo);
                    if (!itens.length) return null;
                    return (
                      <>
                        <div key={grupo} className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</div>
                        {itens.map(l => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.label} {l.taxaLimiteAA !== null ? `- max. ${l.taxaLimiteAA}% a.a.` : "- livre pactuacao"}
                          </SelectItem>
                        ))}
                      </>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Taxa</Label>
              <Tabs value={tipoTaxaSelecionada} onValueChange={(v) => {
                setTipoTaxaSelecionada(v as "pre_fixada" | "pos_fixada");
                setValue("tipoTaxa", v as "pre_fixada" | "pos_fixada");
              }}>
                <TabsList className="w-full">
                  <TabsTrigger value="pos_fixada" className="flex-1">Pós-Fixada (IPCA)</TabsTrigger>
                  <TabsTrigger value="pre_fixada" className="flex-1">Pré-Fixada (LTN/NTN-F)</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Dados Financeiros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados do Financiamento</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="valorPrincipal">Valor Principal (R$) *</Label>
              <Input
                id="valorPrincipal"
                type="text"
                inputMode="decimal"
                placeholder="Ex: 150000.00"
                {...register("valorPrincipal")}
              />
              {errors.valorPrincipal && <p className="text-xs text-destructive">{errors.valorPrincipal.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prazoMeses">Prazo (meses) *</Label>
              <Input id="prazoMeses" type="text" inputMode="numeric" placeholder="12" {...register("prazoMeses")} />
              {errors.prazoMeses && <p className="text-xs text-destructive">{errors.prazoMeses.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataContratacao">Data de Contratação *</Label>
              <Input id="dataContratacao" type="date" {...register("dataContratacao")} />
              {errors.dataContratacao && <p className="text-xs text-destructive">{errors.dataContratacao.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
              <Input id="dataVencimento" type="date" {...register("dataVencimento")} />
              {errors.dataVencimento && <p className="text-xs text-destructive">{errors.dataVencimento.message}</p>}
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="dataCalculo">Data-Base do Cálculo *</Label>
              <Input id="dataCalculo" type="date" {...register("dataCalculo")} />
              <p className="text-xs text-muted-foreground">Data de referência para o cálculo do saldo devedor</p>
            </div>
          </CardContent>
        </Card>

        {/* Taxas de Juros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Taxas de Juros Pactuadas</CardTitle>
            <CardDescription>
              Informe as taxas conforme constam no contrato. Serão validadas contra os limites legais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="taxaJurosRemuneratorios">
                  Juros Remuneratórios (% a.a.) *
                  <Badge variant="outline" className="ml-2 text-xs">Máx. {limites?.jurosRemuneratoriosMaxAA ?? 12}% a.a.</Badge>
                </Label>
                <Input
                  id="taxaJurosRemuneratorios"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 7.0286"
                  {...register("taxaJurosRemuneratorios")}
                  className={limiteRemExcedido ? "border-destructive" : ""}
                />
                {limiteRemExcedido && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Excede o limite legal de {limites?.jurosRemuneratoriosMaxAA ?? 12}% a.a.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxaJurosMora">
                  Juros de Mora
                  <Badge variant="outline" className="ml-2 text-xs">Máx. {limites?.jurosMoraMaxAA ?? 1}% a.a.</Badge>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="taxaJurosMora"
                    type="text"
                    inputMode="decimal"
                    placeholder={taxaMoraUnidade === "am" ? "Ex: 2.0" : "Ex: 1.0"}
                    {...register("taxaJurosMora")}
                    className={limiteMoraExcedido ? "border-destructive flex-1" : "flex-1"}
                  />
                  <Select
                    value={taxaMoraUnidade}
                    onValueChange={(v) => setValue("taxaJurosMoraUnidade", v as "aa" | "am")}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aa">% a.a.</SelectItem>
                      <SelectItem value="am">% a.m.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {taxaMoraUnidade === "am" && taxaMora > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Equivale a {taxaMoraEmAA.toFixed(4)}% a.a.
                  </p>
                )}
                {limiteMoraExcedido && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Excede o limite legal de {limites?.jurosMoraMaxAA ?? 1}% a.a. (DL 167/67, art. 5º)
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxaMulta">Multa Contratual (%)</Label>
                <Input id="taxaMulta" type="text" inputMode="decimal" placeholder="Ex: 2.00" {...register("taxaMulta")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Componentes TCR */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {tipoTaxaSelecionada === "pos_fixada"
                ? "Componentes TCRpós — Variações do IPCA"
                : "Componentes TCRpré — Parâmetros LTN/NTN-F"}
            </CardTitle>
            <CardDescription>
              {tipoTaxaSelecionada === "pos_fixada"
                ? "Informe as variações mensais do IPCA para o período do financiamento (Res. CMN 4.883/2020)"
                : "Informe os parâmetros da taxa prefixada conforme Resolução CMN 4.913/2021"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tipoTaxaSelecionada === "pos_fixada" ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="Variação IPCA mensal (%) — ex: 0.44"
                      value={novoIpca}
                      onChange={(e) => setNovoIpca(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), adicionarIpca())}
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={adicionarIpca}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar Mês
                  </Button>
                </div>
                {ipcaMensal.length > 0 && (
                  <div className="border rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {ipcaMensal.length} mês(es) informado(s) — IPCA Acumulado: {((ipcaMensal.reduce((acc, v) => acc * (1 + v / 100), 1) - 1) * 100).toFixed(4)}%
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ipcaMensal.map((v, i) => (
                        <Badge key={i} variant="secondary" className="flex items-center gap-1">
                          Mês {i + 1}: {v.toFixed(4)}%
                          <button type="button" onClick={() => removerIpca(i)} className="ml-1 hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {ipcaMensal.length === 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Sem variações de IPCA informadas, o FAM será calculado como 1 (sem correção monetária). Adicione as variações mensais do IPCA para o período do financiamento.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="taxaJm">
                    Taxa Jm — Prefixada de Maio (% a.a.)
                  </Label>
                  <Input
                    id="taxaJm"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 13.50"
                    {...register("taxaJm")}
                  />
                  <p className="text-xs text-muted-foreground">Calculada e divulgada em maio, vigência jul/ano a jun/ano seguinte</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fatorInflacaoImplicita">
                    FII — Fator de Inflação Implícita
                  </Label>
                  <Input
                    id="fatorInflacaoImplicita"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 1.0500000"
                    {...register("fatorInflacaoImplicita")}
                  />
                  <p className="text-xs text-muted-foreground">Divulgado pelo BCB no último dia útil de abril</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fatorPrograma">
                    FP — Fator de Programa
                  </Label>
                  <Input
                    id="fatorPrograma"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 0.1896008"
                    {...register("fatorPrograma")}
                  />
                  <p className="text-xs text-muted-foreground">Definido pelo CMN para cada linha de crédito (Res. CMN 5.153/2024)</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fatorAjuste">
                    FA — Fator de Ajuste
                  </Label>
                  <Input
                    id="fatorAjuste"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.0000000"
                    {...register("fatorAjuste")}
                  />
                  <p className="text-xs text-muted-foreground">Padrão: 0 (zero) na ausência de resolução específica do CMN</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertas de Conformidade em Tempo Real */}
        {(limiteRemExcedido || limiteMoraExcedido) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção — Possível Ilegalidade Detectada:</strong>
              {limiteRemExcedido && (
                <p className="mt-1 text-sm">
                  • Juros remuneratórios de {taxaRem.toFixed(2)}% a.a. excedem o limite de {limites?.jurosRemuneratoriosMaxAA ?? 12}% a.a. estabelecido pela jurisprudência consolidada do STJ (Decreto nº 22.626/33 — Lei de Usura).
                </p>
              )}
              {limiteMoraExcedido && (
                <p className="mt-1 text-sm">
                  • Juros de mora de {taxaMoraEmAA.toFixed(3)}% a.a. excedem o limite de {limites?.jurosMoraMaxAA ?? 1}% a.a. estabelecido pelo Decreto-Lei nº 167/67, art. 5º.
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Seção de Parcelas Pagas */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Análise de Parcelas Pagas</CardTitle>
                <CardDescription>
                  Opcional — informe as parcelas já pagas para calcular o excesso cobrado e o saldo devedor revisado
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMostrarParcelas(!mostrarParcelas)}
              >
                {mostrarParcelas ? "Ocultar" : "Incluir Parcelas"}
              </Button>
            </div>
          </CardHeader>
          {mostrarParcelas && (
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="numeroParcelas">Nº Total de Parcelas do Contrato</Label>
                <Input id="numeroParcelas" type="text" inputMode="numeric" placeholder="Ex: 5" {...register("numeroParcelas")} />
                <p className="text-xs text-muted-foreground">Total previsto no contrato (safras ou meses)</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="parcelasPagas">Nº de Parcelas Efetivamente Pagas</Label>
                <Input id="parcelasPagas" type="text" inputMode="numeric" placeholder="Ex: 3" {...register("parcelasPagas")} />
                <p className="text-xs text-muted-foreground">Quantas parcelas já foram quitadas</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valorParcelaPaga">Valor Médio da Parcela Paga (R$)</Label>
                <Input id="valorParcelaPaga" type="text" inputMode="decimal" placeholder="Ex: 25000.00" {...register("valorParcelaPaga")} />
                <p className="text-xs text-muted-foreground">Valor efetivamente cobrado pelo banco por parcela</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="saldoDevedorBanco">Saldo Devedor Informado pelo Banco (R$)</Label>
                <Input id="saldoDevedorBanco" type="text" inputMode="decimal" placeholder="Ex: 180000.00" {...register("saldoDevedorBanco")} />
                <p className="text-xs text-muted-foreground">Saldo atual conforme extrato ou notificação do banco</p>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Periodicidade das Parcelas</Label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="anual" {...register("periodicidadeParcela")} defaultChecked />
                    <span className="text-sm">Anual (safra a safra — padrão rural)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="mensal" {...register("periodicidadeParcela")} />
                    <span className="text-sm">Mensal</span>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Conversão de taxa: i_período = (1 + i_aa)^(1/n) − 1 — equivalente exata, não divisão simples
                </p>
              </div>
              <Alert className="md:col-span-2 border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-700">
                  <strong>Fórmula utilizada (Sistema Price):</strong> PMT = PV × i / (1 − (1 + i)^-n)
                  — O sistema calcula a prestação legal (12% a.a.) e compara com o valor efetivamente pago,
                  gerando a tabela de amortização completa e a memória de cálculo para o laudo.
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            className="flex-1"
            disabled={calcularMutation.isPending}
          >
            {calcularMutation.isPending ? (
              "Calculando..."
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Calcular TCR e Analisar Conformidade
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => setLocation("/")}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
