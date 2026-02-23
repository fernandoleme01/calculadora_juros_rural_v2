import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Scale,
  FileText,
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  User,
  Building2,
  Gavel,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { fmtBRL } from "@/lib/formatters";
import { toast } from "sonner";

export default function LaudoPericial() {
  // Dados do processo
  const [numeroProcesso, setNumeroProcesso] = useState("");
  const [comarca, setComarca] = useState("");
  const [nomePerito, setNomePerito] = useState("");
  const [crcPerito, setCrcPerito] = useState("");

  // Dados do contrato
  const [nomeDevedor, setNomeDevedor] = useState("");
  const [numeroCedula, setNumeroCedula] = useState("");
  const [nomeBanco, setNomeBanco] = useState("");
  const [linhaSelecionada, setLinhaSelecionada] = useState("");
  const [taxaContratadaAA, setTaxaContratadaAA] = useState("");
  const [valorPrincipal, setValorPrincipal] = useState("");
  const [prazoMeses, setPrazoMeses] = useState("");
  const [saldoDevedorBanco, setSaldoDevedorBanco] = useState("");

  // Quesitos
  const [quesitosAutor, setQuesitosAutor] = useState<string[]>([
    "A taxa de juros aplicada excedeu o limite legal para a linha de credito contratada?",
    "Houve capitalizacao de juros vedada pelo Decreto-Lei 167/67?",
    "Qual o valor pago a maior pelo produtor rural?",
  ]);
  const [quesitosReu, setQuesitosReu] = useState<string[]>([
    "O contrato previa taxa de juros dentro dos limites legais do MCR?",
    "Os encargos cobrados estao de acordo com as normas do Banco Central?",
  ]);
  const [novoQuesitorAutor, setNovoQuesitorAutor] = useState("");
  const [novoQuesitorReu, setNovoQuesitorReu] = useState("");

  // Resultado
  const [laudoGerado, setLaudoGerado] = useState<string>("");
  const [loadingLaudo, setLoadingLaudo] = useState(false);
  const [comparativoData, setComparativoData] = useState<any>(null);

  const { data: linhasCredito } = trpc.mcr.linhas.useQuery();

  const taxaNum = parseFloat(taxaContratadaAA) || 0;
  const valorNum = parseFloat(valorPrincipal) || 0;
  const prazoNum = parseInt(prazoMeses) || 0;

  const { data: comparativo } = trpc.mcr.comparativo.useQuery(
    { taxaContratadaAA: taxaNum, linhaId: linhaSelecionada, valorPrincipal: valorNum, prazoMeses: prazoNum },
    { enabled: !!linhaSelecionada && taxaNum > 0 && valorNum > 0 && prazoNum > 0 }
  );

  const gerarLaudoMutation = trpc.tcr.gerarLaudoPericial.useMutation({
    onSuccess: (data) => {
      setLaudoGerado(typeof data.laudo === "string" ? data.laudo : JSON.stringify(data.laudo));
      setLoadingLaudo(false);
      toast.success("Laudo pericial gerado com sucesso!");
    },
    onError: (err) => {
      setLoadingLaudo(false);
      toast.error("Erro ao gerar laudo: " + err.message);
    },
  });

  const handleGerar = () => {
    if (!linhaSelecionada || taxaNum <= 0 || valorNum <= 0 || prazoNum <= 0) {
      toast.error("Preencha: linha de credito, taxa contratada, valor principal e prazo.");
      return;
    }
    setLoadingLaudo(true);
    setLaudoGerado("");
    gerarLaudoMutation.mutate({
      nomeDevedor,
      numeroCedula,
      nomeBanco,
      linhaCredito: linhasCredito?.find((l) => l.id === linhaSelecionada)?.label ?? linhaSelecionada,
      taxaContratadaAA: taxaNum,
      taxaLimiteAA: comparativo?.taxaLimite ?? null,
      diferencaPP: comparativo?.diferencaPP ?? null,
      excede: comparativo?.excede ?? false,
      excessoJurosTotal: comparativo?.excessoJurosTotal ?? null,
      fundamentacao: comparativo?.fundamentacao ?? "",
      valorPrincipal: valorNum,
      prazoMeses: prazoNum,
      saldoDevedorBanco: parseFloat(saldoDevedorBanco) || null,
      totalDevidoRevisado: comparativo?.excessoJurosTotal != null
        ? (parseFloat(saldoDevedorBanco) || 0) - comparativo.excessoJurosTotal
        : null,
      textoVeredicto: comparativo?.textoVeredicto ?? "",
      nomePerito,
      crcPerito,
      numeroProcesso,
      comarca,
      quesitosAutor,
      quesitosReu,
    });
  };

  const adicionarQuesito = (tipo: "autor" | "reu") => {
    if (tipo === "autor" && novoQuesitorAutor.trim()) {
      setQuesitosAutor([...quesitosAutor, novoQuesitorAutor.trim()]);
      setNovoQuesitorAutor("");
    } else if (tipo === "reu" && novoQuesitorReu.trim()) {
      setQuesitosReu([...quesitosReu, novoQuesitorReu.trim()]);
      setNovoQuesitorReu("");
    }
  };

  const removerQuesito = (tipo: "autor" | "reu", idx: number) => {
    if (tipo === "autor") setQuesitosAutor(quesitosAutor.filter((_, i) => i !== idx));
    else setQuesitosReu(quesitosReu.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          Laudo Pericial Contabil
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Em conformidade com a Lei 4.829/65 · DL 167/67 · Resolucoes CMN, Manual de Credito Rural e Jurisprudencias
        </p>
      </div>

      {/* Dados do Processo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Gavel className="h-4 w-4" />
            I — Dados do Processo e do Perito
          </CardTitle>
          <CardDescription>Informacoes para identificacao nos autos</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Numero do Processo</Label>
            <Input
              placeholder="Ex: 0001234-56.2024.8.09.0001"
              value={numeroProcesso}
              onChange={(e) => setNumeroProcesso(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Comarca / Vara</Label>
            <Input
              placeholder="Ex: 1a Vara Civel de Goiania/GO"
              value={comarca}
              onChange={(e) => setComarca(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Nome do Perito</Label>
            <Input
              placeholder="Nome completo do perito contabil"
              value={nomePerito}
              onChange={(e) => setNomePerito(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>CRC / CORECON</Label>
            <Input
              placeholder="Ex: CRC/GO-012345/O-1"
              value={crcPerito}
              onChange={(e) => setCrcPerito(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dados do Contrato */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            II — Dados do Contrato de Credito Rural
          </CardTitle>
          <CardDescription>Informacoes do financiamento objeto da pericia</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nome do Devedor / Produtor Rural</Label>
            <Input
              placeholder="Nome completo"
              value={nomeDevedor}
              onChange={(e) => setNomeDevedor(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>No da Cedula / Contrato</Label>
            <Input
              placeholder="Ex: CCR-2022-001"
              value={numeroCedula}
              onChange={(e) => setNumeroCedula(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Banco / Instituicao Financeira</Label>
            <Input
              placeholder="Ex: Banco do Brasil S.A."
              value={nomeBanco}
              onChange={(e) => setNomeBanco(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Linha de Credito (MCR) *</Label>
            <Select value={linhaSelecionada} onValueChange={setLinhaSelecionada}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a linha de credito" />
              </SelectTrigger>
              <SelectContent>
                {linhasCredito && [
                  { grupo: "pronaf", label: "Pronaf" },
                  { grupo: "pronamp", label: "Pronamp" },
                  { grupo: "moderacao", label: "Programas Federais" },
                  { grupo: "fundos", label: "Fundos Constitucionais" },
                  { grupo: "livre", label: "Recursos Livres" },
                ].map(({ grupo, label }) => {
                  const itens = linhasCredito.filter((l) => l.grupo === grupo);
                  if (!itens.length) return null;
                  return (
                    <div key={grupo}>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {label}
                      </div>
                      {itens.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.label}{l.taxaLimiteAA != null ? ` - max. ${l.taxaLimiteAA}% a.a.` : " - livre pactuacao"}
                        </SelectItem>
                      ))}
                    </div>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Taxa Contratada (% a.a.) *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Ex: 15.5"
              value={taxaContratadaAA}
              onChange={(e) => setTaxaContratadaAA(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Valor Principal (R$) *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Ex: 250000"
              value={valorPrincipal}
              onChange={(e) => setValorPrincipal(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Prazo (meses) *</Label>
            <Input
              type="number"
              placeholder="Ex: 36"
              value={prazoMeses}
              onChange={(e) => setPrazoMeses(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Saldo Devedor conforme Banco (R$)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Valor cobrado pelo banco"
              value={saldoDevedorBanco}
              onChange={(e) => setSaldoDevedorBanco(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Comparativo MCR em tempo real */}
      {comparativo && (
        <Card className={`border-l-4 ${comparativo.excede ? "border-l-red-500" : "border-l-emerald-500"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Pre-visualizacao — Confronto com Norma MCR</span>
              <Badge className={comparativo.excede
                ? "bg-red-100 text-red-800 border-red-200"
                : "bg-emerald-100 text-emerald-800 border-emerald-200"
              }>
                {comparativo.excede
                  ? <><XCircle className="h-3 w-3 mr-1" /> Excesso Identificado</>
                  : <><CheckCircle className="h-3 w-3 mr-1" /> Taxa Regular</>
                }
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-xs text-muted-foreground">Taxa Contratada</p>
                <p className="font-bold text-blue-700">{taxaNum.toFixed(2)}% a.a.</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded">
                <p className="text-xs text-muted-foreground">Limite MCR</p>
                <p className="font-bold text-emerald-700">
                  {comparativo.taxaLimite != null ? `${comparativo.taxaLimite.toFixed(2)}% a.a.` : "Livre"}
                </p>
              </div>
              <div className={`p-2 rounded ${comparativo.excede ? "bg-red-50" : "bg-emerald-50"}`}>
                <p className="text-xs text-muted-foreground">Diferenca</p>
                <p className={`font-bold ${comparativo.excede ? "text-red-600" : "text-emerald-600"}`}>
                  {comparativo.diferencaPP != null
                    ? `${comparativo.excede ? "+" : ""}${comparativo.diferencaPP.toFixed(2)} p.p.`
                    : "—"}
                </p>
              </div>
            </div>
            {comparativo.excessoJurosTotal != null && comparativo.excede && (
              <Alert className="border-red-200 bg-red-50 py-2">
                <AlertTriangle className="h-3 w-3 text-red-600" />
                <AlertDescription className="text-xs text-red-700">
                  Excesso estimado: <strong>{fmtBRL(comparativo.excessoJurosTotal)}</strong> — {comparativo.textoVeredicto}
                </AlertDescription>
              </Alert>
            )}
            <p className="text-xs text-muted-foreground">
              Base: {comparativo.fundamentacao}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quesitos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            VI — Quesitos das Partes
          </CardTitle>
          <CardDescription>
            Perguntas que o perito devera responder no laudo. Ja incluidos os quesitos padrao — edite conforme o processo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Quesitos do Autor */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-700 border-blue-200">Autor / Produtor Rural</Badge>
            </div>
            {quesitosAutor.map((q, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                <span className="text-xs font-bold text-blue-700 mt-0.5 shrink-0">Q{i + 1}</span>
                <p className="text-sm flex-1">{q}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removerQuesito("autor", i)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar quesito do autor..."
                value={novoQuesitorAutor}
                onChange={(e) => setNovoQuesitorAutor(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && adicionarQuesito("autor")}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adicionarQuesito("autor")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Quesitos do Reu */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-red-700 border-red-200">Reu / Banco</Badge>
            </div>
            {quesitosReu.map((q, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                <span className="text-xs font-bold text-red-700 mt-0.5 shrink-0">Q{i + 1}</span>
                <p className="text-sm flex-1">{q}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removerQuesito("reu", i)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar quesito do reu/banco..."
                value={novoQuesitorReu}
                onChange={(e) => setNovoQuesitorReu(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && adicionarQuesito("reu")}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => adicionarQuesito("reu")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botao Gerar */}
      <div className="flex gap-3">
        <Button
          onClick={handleGerar}
          disabled={loadingLaudo || !linhaSelecionada || taxaNum <= 0}
          className="flex-1"
          size="lg"
        >
          {loadingLaudo ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Elaborando laudo pericial...</>
          ) : (
            <><FileText className="h-4 w-4 mr-2" /> Gerar Laudo Pericial Contabil (8 Secoes)</>
          )}
        </Button>
        {laudoGerado && (
          <Button variant="outline" size="lg" onClick={() => { setLaudoGerado(""); }}>
            Regerar
          </Button>
        )}
      </div>

      {/* Laudo Gerado */}
      {laudoGerado && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              Laudo Pericial Contabil — Resultado
            </CardTitle>
            <CardDescription>
              Em conformidade com a Lei 4.829/65 · DL 167/67 · Resolucoes CMN, Manual de Credito Rural e Jurisprudencias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-6 bg-white space-y-2 print:border-none">
              <div className="text-center pb-4 border-b mb-4">
                <p className="text-sm font-bold uppercase tracking-wide">
                  LAUDO PERICIAL CONTABIL
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Em conformidade com a Lei 4.829/65 · DL 167/67 · Resolucoes CMN · Manual de Credito Rural · Jurisprudencias STJ
                </p>
                {numeroProcesso && (
                  <p className="text-xs mt-1">Processo n.: {numeroProcesso} | Comarca: {comarca || "___"}</p>
                )}
              </div>
              {/* Disclaimer obrigatório — Provimento OAB 205/2021 */}
              <div className="rounded border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 mb-4 flex gap-3 items-start">
                <span className="text-amber-600 dark:text-amber-400 text-lg leading-none mt-0.5">⚠</span>
                <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <p className="font-semibold">MINUTA PARA REVISÃO PROFISSIONAL</p>
                  <p>Este documento foi gerado automaticamente por sistema de inteligência artificial e constitui <strong>minuta preliminar</strong> para revisão, validação técnica e assinatura do perito ou advogado responsável. Não substitui o julgamento profissional nem o exercício privativo da advocacia (Lei 8.906/1994 · Provimento OAB 205/2021). O profissional é o único responsável pelo conteúdo final utilizado em processo judicial ou extrajudicial.</p>
                </div>
              </div>
              <div className="prose prose-sm max-w-none">
                <Streamdown>{laudoGerado}</Streamdown>
              </div>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" onClick={() => window.print()}>
                <FileText className="h-4 w-4 mr-2" /> Imprimir / Gerar PDF
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(laudoGerado);
                  toast.success("Texto copiado para a area de transferencia!");
                }}
              >
                Copiar Texto
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
