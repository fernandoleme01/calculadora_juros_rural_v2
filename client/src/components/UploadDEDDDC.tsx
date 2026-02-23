import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Upload, FileText, CheckCircle2, XCircle, AlertCircle,
  Loader2, ArrowRight, RotateCcw, Eye
} from "lucide-react";
import { toast } from "sonner";
import { fmtBRL, fmtPct } from "@/lib/formatters";

// Tipo dos dados extraídos pelo LLM
export interface DadosDEDDDC {
  nomeBanco: string | null;
  numeroCedula: string | null;
  dataContratacao: string | null;
  dataVencimento: string | null;
  valorPrincipal: number | null;
  taxaJurosRemuneratoriosAA: number | null;
  taxaJurosMoraAA: number | null;
  taxaMulta: number | null;
  iof: number | null;
  tac: number | null;
  tec: number | null;
  prazoMeses: number | null;
  sistemaAmortizacao: "price" | "sac" | "saf" | null;
  modalidade: "custeio" | "investimento" | "comercializacao" | null;
  linhaCredito: string | null;
  saldoDevedorAtual: number | null;
  totalPago: number | null;
  numeroParcelas: number | null;
  nomeDevedor: string | null;
  cpfCnpjDevedor: string | null;
  camposEncontrados: string[];
  camposAusentes: string[];
  observacoes: string | null;
}

interface Props {
  onDadosExtraidos?: (dados: DadosDEDDDC) => void;
  compact?: boolean;
}

const CAMPOS_LABEL: Record<string, string> = {
  nomeBanco: "Nome do Banco",
  numeroCedula: "Nº da Cédula",
  dataContratacao: "Data de Contratação",
  dataVencimento: "Data de Vencimento",
  valorPrincipal: "Valor Principal",
  taxaJurosRemuneratoriosAA: "Taxa de Juros Remuneratórios (a.a.)",
  taxaJurosMoraAA: "Taxa de Juros de Mora (a.a.)",
  taxaMulta: "Multa Contratual",
  iof: "IOF",
  tac: "TAC",
  tec: "TEC",
  prazoMeses: "Prazo (meses)",
  sistemaAmortizacao: "Sistema de Amortização",
  modalidade: "Modalidade",
  linhaCredito: "Linha de Crédito",
  saldoDevedorAtual: "Saldo Devedor Atual",
  totalPago: "Total Pago",
  numeroParcelas: "Número de Parcelas",
  nomeDevedor: "Nome do Devedor",
  cpfCnpjDevedor: "CPF/CNPJ do Devedor",
};

function formatarValorCampo(campo: string, valor: unknown): string {
  if (valor === null || valor === undefined) return "—";
  if (typeof valor === "number") {
    if (campo.includes("AA") || campo.includes("Multa") || campo === "taxaMulta") return fmtPct(valor);
    if (campo === "valorPrincipal" || campo === "saldoDevedorAtual" || campo === "totalPago"
      || campo === "iof" || campo === "tac" || campo === "tec") return fmtBRL(valor);
    return String(valor);
  }
  if (campo === "sistemaAmortizacao") {
    const map: Record<string, string> = { price: "Tabela Price", sac: "SAC", saf: "SAF" };
    return map[String(valor)] ?? String(valor);
  }
  if (campo === "modalidade") {
    const map: Record<string, string> = { custeio: "Custeio", investimento: "Investimento", comercializacao: "Comercialização" };
    return map[String(valor)] ?? String(valor);
  }
  return String(valor);
}

export default function UploadDEDDDC({ onDadosExtraidos, compact = false }: Props) {
  const [, navigate] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [progresso, setProgresso] = useState(0);
  const [fase, setFase] = useState<"idle" | "lendo" | "enviando" | "extraindo" | "concluido" | "erro">("idle");
  const [dados, setDados] = useState<DadosDEDDDC | null>(null);
  const [erroMsg, setErroMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const extrairMutation = trpc.tcr.extrairDadosDEDDDC.useMutation({
    onSuccess: (result) => {
      const d = result.dados as unknown as DadosDEDDDC;
      setDados(d);
      setFase("concluido");
      setProgresso(100);
      toast.success("Dados extraídos com sucesso!");
      onDadosExtraidos?.(d);
    },
    onError: (err) => {
      setFase("erro");
      setErroMsg(err.message);
      toast.error("Erro na extração: " + err.message);
    },
  });

  const processarArquivo = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são aceitos.");
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      toast.error("O arquivo não pode ultrapassar 16 MB.");
      return;
    }

    setArquivo(file);
    setFase("lendo");
    setProgresso(10);
    setErroMsg(null);

    // Ler como base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      setFase("enviando");
      setProgresso(40);

      setTimeout(() => {
        setFase("extraindo");
        setProgresso(70);
      }, 800);

      extrairMutation.mutate({
        pdfBase64: base64,
        nomeArquivo: file.name,
      });
    };
    reader.readAsDataURL(file);
  }, [extrairMutation]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processarArquivo(file);
  }, [processarArquivo]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processarArquivo(file);
  };

  const reiniciar = () => {
    setArquivo(null);
    setDados(null);
    setFase("idle");
    setProgresso(0);
    setErroMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const irParaCalculadora = () => {
    if (!dados) return;
    // Serializar dados no sessionStorage para a calculadora ler
    sessionStorage.setItem("ded_ddc_dados", JSON.stringify(dados));
    navigate("/app/calculadora");
    toast.success("Dados importados! Preencha os campos destacados na calculadora.");
  };

  const faseLabel: Record<string, string> = {
    lendo: "Lendo o arquivo...",
    enviando: "Enviando para análise...",
    extraindo: "IA extraindo dados financeiros...",
    concluido: "Extração concluída!",
    erro: "Erro na extração",
  };

  return (
    <div className="space-y-4">
      {/* Zona de upload */}
      {fase === "idle" && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-amber-500 bg-amber-500/10 scale-[1.01]"
              : "border-border hover:border-amber-500/50 hover:bg-amber-500/5"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={onFileChange}
          />
          <div className="flex flex-col items-center gap-3">
            <div className={`p-4 rounded-full transition-colors ${isDragging ? "bg-amber-500/20" : "bg-muted"}`}>
              <Upload className={`h-8 w-8 ${isDragging ? "text-amber-500" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {isDragging ? "Solte o arquivo aqui" : "Arraste o DED/DDC ou clique para selecionar"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Aceita PDF até 16 MB — Demonstrativo de Evolução da Dívida ou Cédula de Crédito Rural
              </p>
            </div>
            <Button variant="outline" size="sm" className="pointer-events-none">
              <FileText className="h-4 w-4 mr-2" />
              Selecionar PDF
            </Button>
          </div>
        </div>
      )}

      {/* Progresso */}
      {(fase === "lendo" || fase === "enviando" || fase === "extraindo") && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-amber-500 animate-spin shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{faseLabel[fase]}</p>
                <p className="text-xs text-muted-foreground">{arquivo?.name}</p>
              </div>
            </div>
            <Progress value={progresso} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {fase === "extraindo" && "A IA está lendo o documento e identificando os dados financeiros..."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Erro */}
      {fase === "erro" && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-600">Falha na extração</p>
                <p className="text-xs text-muted-foreground mt-1">{erroMsg}</p>
              </div>
              <Button variant="outline" size="sm" onClick={reiniciar}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado */}
      {fase === "concluido" && dados && (
        <div className="space-y-4">
          {/* Header de sucesso */}
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      {dados.camposEncontrados.length} campos extraídos com sucesso
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {arquivo?.name} · {dados.camposAusentes.length} campos não encontrados
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={reiniciar}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Novo
                  </Button>
                  <Button
                    size="sm"
                    onClick={irParaCalculadora}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold"
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Preencher Calculadora
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados extraídos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-amber-500" />
                Dados Extraídos do DED/DDC
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Identificação */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(["nomeBanco", "numeroCedula", "nomeDevedor", "cpfCnpjDevedor", "dataContratacao", "dataVencimento"] as const).map((campo) => {
                  const val = dados[campo];
                  return (
                    <div key={campo} className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">{CAMPOS_LABEL[campo]}</p>
                      <p className={`text-sm font-medium ${val ? "text-foreground" : "text-muted-foreground italic"}`}>
                        {val ? String(val) : "Não encontrado"}
                      </p>
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* Valores financeiros */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["valorPrincipal", "taxaJurosRemuneratoriosAA", "taxaJurosMoraAA", "taxaMulta", "iof", "tac", "tec", "saldoDevedorAtual", "totalPago"] as const).map((campo) => {
                  const val = dados[campo];
                  return (
                    <div key={campo} className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">{CAMPOS_LABEL[campo]}</p>
                      <p className={`text-sm font-medium ${val !== null ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground italic"}`}>
                        {val !== null ? formatarValorCampo(campo, val) : "Não encontrado"}
                      </p>
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* Condições contratuais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["prazoMeses", "numeroParcelas", "sistemaAmortizacao", "modalidade", "linhaCredito"] as const).map((campo) => {
                  const val = dados[campo];
                  return (
                    <div key={campo} className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">{CAMPOS_LABEL[campo]}</p>
                      <p className={`text-sm font-medium ${val ? "text-foreground" : "text-muted-foreground italic"}`}>
                        {val ? formatarValorCampo(campo, val) : "Não encontrado"}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Campos ausentes */}
              {dados.camposAusentes.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        Campos não encontrados no documento ({dados.camposAusentes.length})
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {dados.camposAusentes.map((c) => (
                        <Badge key={c} variant="outline" className="text-xs border-amber-500/30 text-amber-600">
                          {CAMPOS_LABEL[c] ?? c}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Estes campos precisarão ser preenchidos manualmente na calculadora.
                    </p>
                  </div>
                </>
              )}

              {/* Observações */}
              {dados.observacoes && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Observações da IA</p>
                    <p className="text-xs text-foreground bg-muted/50 rounded p-2">{dados.observacoes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Botão principal */}
          {!compact && (
            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={irParaCalculadora}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold"
              >
                <ArrowRight className="h-5 w-5 mr-2" />
                Preencher Calculadora com estes dados
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
