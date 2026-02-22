import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Upload, CheckCircle2, AlertTriangle, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export interface DadosExtradosPDF {
  valorPrincipal: number | null;
  taxaJurosAnual: number | null;
  taxaJurosMensal: number | null;
  prazoMeses: number | null;
  prazoAnos: number | null;
  dataContratacao: string | null;
  dataVencimento: string | null;
  banco: string | null;
  modalidade: string | null;
  sistemaAmortizacao: string | null;
  indexador: string | null;
  numeroCedula: string | null;
  nomeDevedor: string | null;
  cpfCnpjDevedor: string | null;
  finalidade: string | null;
  garantias: string | null;
  observacoes: string | null;
}

interface Props {
  onDadosExtraidos: (dados: DadosExtradosPDF, pdfUrl: string) => void;
  onFechar?: () => void;
}

export default function UploadContratoPDF({ onDadosExtraidos, onFechar }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [extraindo, setExtraindo] = useState(false);
  const [extraido, setExtraido] = useState(false);

  const extrairMutation = trpc.contrato.extrairDadosPDF.useMutation({
    onSuccess: (result) => {
      setExtraindo(false);
      setExtraido(true);
      onDadosExtraidos(result.dados as unknown as DadosExtradosPDF, result.pdfUrl);
      toast.success("Dados extraídos com sucesso! Campos pré-preenchidos.");
    },
    onError: (err) => {
      setExtraindo(false);
      toast.error("Erro ao extrair dados: " + err.message);
    },
  });

  const processarArquivo = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são aceitos.");
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 16 MB.");
      return;
    }
    setArquivo(file);
    setExtraindo(true);
    setExtraido(false);

    // Converter para base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      extrairMutation.mutate({ pdfBase64: base64, nomeArquivo: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processarArquivo(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processarArquivo(file);
  };

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Importar Contrato em PDF</span>
            <Badge variant="secondary" className="text-xs">IA</Badge>
          </div>
          {onFechar && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onFechar}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {!arquivo && !extraindo && (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragging ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-primary/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Arraste o PDF do contrato aqui ou <span className="text-primary font-medium">clique para selecionar</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Máximo 16 MB · Apenas PDF</p>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleChange}
            />
          </div>
        )}

        {extraindo && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-medium">Analisando contrato com IA...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Extraindo valor, taxa, prazo, modalidade e outros dados
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{arquivo?.name}</p>
          </div>
        )}

        {extraido && arquivo && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Dados extraídos com sucesso</span>
            </div>
            <p className="text-xs text-muted-foreground">{arquivo.name}</p>
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              <AlertDescription className="text-xs text-amber-700">
                Revise os campos pré-preenchidos antes de calcular. A IA pode cometer erros em documentos com formatação complexa.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setArquivo(null);
                setExtraido(false);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Carregar outro contrato
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
