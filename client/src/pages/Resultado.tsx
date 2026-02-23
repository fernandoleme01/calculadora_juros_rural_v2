import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, AlertTriangle, XCircle, ArrowLeft, Download, FileText, Scale, Loader2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { getResultadoTemp, getInputTemp } from "./Calculadora";
import { Streamdown } from "streamdown";
import { toNum, fmtBRL, fmtPct, fmtFixed } from "@/lib/formatters";
import ComparativoMCRCard from "@/components/ComparativoMCRCard";

type ConformidadeStatus = "conforme" | "nao_conforme" | "atencao";

function StatusBadge({ status }: { status: ConformidadeStatus }) {
  if (status === "conforme") return (
    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1">
      <CheckCircle className="h-3 w-3" /> Conforme
    </Badge>
  );
  if (status === "atencao") return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1">
      <AlertTriangle className="h-3 w-3" /> Atenção
    </Badge>
  );
  return (
    <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
      <XCircle className="h-3 w-3" /> Não Conforme
    </Badge>
  );
}

// Aliases locais para compatibilidade com o código existente neste arquivo
const formatBRL = fmtBRL;
const formatPct = fmtPct;

export default function Resultado() {
  const [, setLocation] = useLocation();
  const resultado = getResultadoTemp() as any;
  const inputData = getInputTemp() as any;
  const [parecer, setParecer] = useState<string>("");
  const [loadingParecer, setLoadingParecer] = useState(false);

  const gerarParecerMutation = trpc.tcr.gerarParecer.useMutation({
    onSuccess: (data) => {
      const content = data.parecer;
      setParecer(typeof content === 'string' ? content : JSON.stringify(content));
      setLoadingParecer(false);
    },
    onError: () => {
      toast.error("Erro ao gerar parecer técnico-jurídico.");
      setLoadingParecer(false);
    },
  });

  useEffect(() => {
    if (!resultado) {
      setLocation("/app/calculadora");
    }
  }, [resultado, setLocation]);

  // Limpar sessionStorage ao sair da página de resultado (novo cálculo)
  const handleNovoCalculo = () => {
    try {
      sessionStorage.removeItem("tcr_resultado");
      sessionStorage.removeItem("tcr_input");
    } catch { /* ignore */ }
    setLocation("/app/calculadora");
  };

  if (!resultado) return null;

  const conformidade = resultado.conformidade;
  const memoria = resultado.memoriaCalculo;

  const handleGerarParecer = () => {
    setLoadingParecer(true);
    gerarParecerMutation.mutate({
      dadosCalculo: {
        valorPrincipal: resultado.valorPrincipal,
        taxaRemuneratoriaAA: inputData?.taxaJurosRemuneratorios ?? 0,
        taxaMoraAA: inputData?.taxaJurosMora ?? 1,
        tcrEfetiva: resultado.tcrEfetiva,
        totalDevido: resultado.totalDevido,
        modalidade: inputData?.modalidade ?? "custeio",
        tipoTaxa: inputData?.tipoTaxa ?? "pos_fixada",
        conformidade: {
          limiteRemuneratorios: conformidade.limiteRemuneratorios,
          limiteMora: conformidade.limiteMora,
          alertas: conformidade.alertas,
        },
      },
    });
  };

  const handleGerarPDF = () => {
    // Abrir janela de impressão para gerar PDF
    window.print();
  };

  const statusGeral: ConformidadeStatus =
    conformidade.limiteRemuneratorios === "nao_conforme" || conformidade.limiteMora === "nao_conforme"
      ? "nao_conforme"
      : conformidade.limiteRemuneratorios === "atencao" || conformidade.limiteMora === "atencao"
        ? "atencao"
        : "conforme";

  return (
    <div className="space-y-6 max-w-4xl print:max-w-full">
      {/* Header */}
      <div className="flex items-start justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Resultado do Cálculo TCR
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {inputData?.nomeDevedor && <span className="font-medium">{inputData.nomeDevedor}</span>}
            {inputData?.numeroCedula && <span> — Cédula: {inputData.numeroCedula}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleNovoCalculo}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Novo Cálculo
          </Button>
          <Button variant="outline" size="sm" onClick={handleGerarPDF}>
            <Download className="h-4 w-4 mr-1" /> Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* Cabeçalho do Relatório (visível na impressão) */}
      <div className="hidden print:block border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold text-center">RELATÓRIO TÉCNICO-JURÍDICO</h1>
        <h2 className="text-lg text-center text-muted-foreground">Cálculo de Taxa de Custo Real — Crédito Rural</h2>
        <p className="text-sm text-center mt-2">
          {inputData?.nomeDevedor && `Devedor: ${inputData.nomeDevedor} | `}
          {inputData?.numeroCedula && `Cédula: ${inputData.numeroCedula} | `}
          Data: {new Date().toLocaleDateString("pt-BR")}
        </p>
      </div>

      {/* Status de Conformidade */}
      <Card className={`border-l-4 ${statusGeral === "conforme" ? "border-l-emerald-500" : statusGeral === "atencao" ? "border-l-amber-500" : "border-l-red-500"}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            Análise de Conformidade Legal
            <StatusBadge status={statusGeral} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Juros Remuneratórios</p>
                <p className="text-sm font-medium">Limite: 12% a.a.</p>
                <p className="text-xs text-muted-foreground">Decreto nº 22.626/33 + STJ</p>
              </div>
              <StatusBadge status={conformidade.limiteRemuneratorios} />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Juros de Mora</p>
                <p className="text-sm font-medium">Limite: 1% a.a.</p>
                <p className="text-xs text-muted-foreground">DL 167/67, art. 5º</p>
              </div>
              <StatusBadge status={conformidade.limiteMora} />
            </div>
          </div>

          {conformidade.alertas.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {conformidade.alertas.map((alerta: string) => (
                  <p key={alerta.slice(0, 80)} className="text-sm">{alerta}</p>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {conformidade.fundamentacao.length > 0 && (
            <div className="space-y-1">
              {conformidade.fundamentacao.map((f: string) => (
                <p key={f.slice(0, 80)} className="text-xs text-muted-foreground flex gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                  {f}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo dos Valores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumo do Cálculo</CardTitle>
          <CardDescription>
            Modalidade: {inputData?.modalidade === "custeio" ? "Custeio" : inputData?.modalidade === "investimento" ? "Investimento" : "Comercialização"} |
            Tipo: {inputData?.tipoTaxa === "pos_fixada" ? "Pós-Fixada (IPCA)" : "Pré-Fixada (LTN/NTN-F)"} |
            Período: {resultado.diasDecorridos} dias ({resultado.mesesDecorridos} meses)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Valor Principal</p>
              <p className="text-lg font-bold">{formatBRL(resultado.valorPrincipal)}</p>
            </div>
            {resultado.fam && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">FAM (Fator de Atualização)</p>
                <p className="text-lg font-bold">{fmtFixed(resultado.fam, 6)}</p>
                <p className="text-xs text-muted-foreground">IPCA: {fmtPct(resultado.ipcaAcumulado, 4)}</p>
              </div>
            )}
            {resultado.fii && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">FII (Inflação Implícita)</p>
                <p className="text-lg font-bold">{fmtFixed(resultado.fii, 7)}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Saldo Devedor Atualizado</p>
              <p className="text-lg font-bold text-primary">{formatBRL(resultado.saldoDevedorAtualizado)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Juros Remuneratórios</p>
              <p className="text-lg font-bold">{formatBRL(resultado.jurosRemuneratorios)}</p>
            </div>
            {resultado.jurosMora > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Juros de Mora</p>
                <p className="text-lg font-bold text-amber-600">{formatBRL(resultado.jurosMora)}</p>
              </div>
            )}
            {resultado.multa > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Multa Contratual</p>
                <p className="text-lg font-bold text-amber-600">{formatBRL(resultado.multa)}</p>
              </div>
            )}
            <div className="space-y-1 md:col-span-2">
              <p className="text-xs text-muted-foreground">TCR Efetiva</p>
              <p className="text-lg font-bold text-primary">{formatPct(resultado.tcrEfetiva)}% a.a.</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div>
              <p className="text-sm font-medium text-muted-foreground">TOTAL DEVIDO</p>
              <p className="text-2xl font-bold text-primary">{formatBRL(resultado.totalDevido)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Data-base do cálculo</p>
              <p className="text-sm font-medium">{new Date(resultado.dataCalculo).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparativo de Parcelas Pagas */}
      {resultado.analiseParcelas && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Análise de Parcelas Pagas vs. Limite Legal
            </CardTitle>
            <CardDescription>
              Comparativo entre o que foi cobrado pelo banco e o que deveria ter sido cobrado pela taxa legal máxima de 12% a.a.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Cards de resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <p className="text-xs text-muted-foreground">Total Pago ao Banco</p>
                <p className="text-base font-bold">{formatBRL(resultado.analiseParcelas.totalPagoContrato)}</p>
                <p className="text-xs text-muted-foreground">{resultado.analiseParcelas.parcelasPagas} parcelas</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
                <p className="text-xs text-emerald-700">Total Legal (12% a.a.)</p>
                <p className="text-base font-bold text-emerald-700">{formatBRL(resultado.analiseParcelas.totalLegal)}</p>
                <p className="text-xs text-emerald-600">Parcela legal: {formatBRL(resultado.analiseParcelas.parcelaLegal)}</p>
              </div>
              <div className={`p-3 rounded-lg border space-y-1 ${
                resultado.analiseParcelas.excessoPago > 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <p className={`text-xs ${
                  resultado.analiseParcelas.excessoPago > 0 ? 'text-red-700' : 'text-emerald-700'
                }`}>Excesso Total Cobrado</p>
                <p className={`text-base font-bold ${
                  resultado.analiseParcelas.excessoPago > 0 ? 'text-red-700' : 'text-emerald-700'
                }`}>
                  {resultado.analiseParcelas.excessoPago > 0 ? '+' : ''}{formatBRL(resultado.analiseParcelas.excessoPago)}
                </p>
                <p className={`text-xs ${
                  resultado.analiseParcelas.excessoPago > 0 ? 'text-red-600' : 'text-emerald-600'
                }`}>
                  {fmtFixed(resultado.analiseParcelas.percentualExcesso, 2)}% acima do legal
                </p>
              </div>
              <div className={`p-3 rounded-lg border space-y-1 ${
                resultado.analiseParcelas.diferencaSaldo > 0
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-muted/50'
              }`}>
                <p className="text-xs text-muted-foreground">Saldo Devedor Revisado</p>
                <p className="text-base font-bold">{formatBRL(resultado.analiseParcelas.saldoDevedorRevisado)}</p>
                {resultado.analiseParcelas.saldoDevedorBanco > 0 && (
                  <p className="text-xs text-amber-700">
                    Banco: {formatBRL(resultado.analiseParcelas.saldoDevedorBanco)}
                    {resultado.analiseParcelas.diferencaSaldo > 0 && (
                      <span className="text-red-600 font-medium"> (+{formatBRL(resultado.analiseParcelas.diferencaSaldo)})</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Alerta jurídico quando há excesso */}
            {resultado.analiseParcelas.excessoPago > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 text-sm space-y-1">
                  <p className="font-semibold">Cobrança acima do limite legal identificada</p>
                  <p>O banco cobrou <strong>{formatBRL(resultado.analiseParcelas.excessoPago)}</strong> a mais do que o permitido pela taxa legal de 12% a.a. nas {resultado.analiseParcelas.parcelasPagas} parcelas analisadas.</p>
                  <p className="text-xs mt-1">
                    Fundamento: Decreto nº 22.626/33 (Lei de Usura), art. 1º — STJ, Súmula 382 — REsp 1.061.530/RS (recurso repetitivo) — MCR 7-1, Tabela 1, Res. CMN 5.234.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Tabela detalhada parcela a parcela */}
            {resultado.analiseParcelas.tabelaAmortizacao && resultado.analiseParcelas.tabelaAmortizacao.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Tabela Comparativa — Parcela a Parcela</h4>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs w-12">Nº</TableHead>
                        <TableHead className="text-xs">Saldo Inicial</TableHead>
                        <TableHead className="text-xs">Parcela Contrato</TableHead>
                        <TableHead className="text-xs text-emerald-700">Parcela Legal (12%)</TableHead>
                        <TableHead className="text-xs">Juros Contrato</TableHead>
                        <TableHead className="text-xs text-emerald-700">Juros Legais</TableHead>
                        <TableHead className="text-xs">Saldo Final Contrato</TableHead>
                        <TableHead className="text-xs text-emerald-700">Saldo Final Legal</TableHead>
                        <TableHead className="text-xs text-red-700">Excesso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultado.analiseParcelas.tabelaAmortizacao.map((linha: any) => (
                        <TableRow key={`parcela-${linha.parcela}`} className={linha.excesso > 0 ? 'bg-red-50/30' : ''}>
                          <TableCell className="text-xs font-medium">{linha.parcela}</TableCell>
                          <TableCell className="text-xs">{formatBRL(linha.saldoInicial)}</TableCell>
                          <TableCell className="text-xs font-medium">{formatBRL(linha.prestacao)}</TableCell>
                          <TableCell className="text-xs text-emerald-700">{formatBRL(linha.prestacao_legal)}</TableCell>
                          <TableCell className="text-xs">{formatBRL(linha.jurosDevidos)}</TableCell>
                          <TableCell className="text-xs text-emerald-700">{formatBRL(linha.jurosDevidos_legal)}</TableCell>
                          <TableCell className="text-xs">{formatBRL(linha.saldoFinal)}</TableCell>
                          <TableCell className="text-xs text-emerald-700">{formatBRL(linha.saldoFinal_legal)}</TableCell>
                          <TableCell className={`text-xs font-bold ${
                            linha.excesso > 0 ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                            {linha.excesso > 0 ? '+' : ''}{formatBRL(linha.excesso)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground">
                  * Fórmula aplicada: PMT = PV × i / (1 - (1+i)^-n) | Taxa convertida por capitalização composta: i_período = (1+i_aa)^(1/12) - 1
                </p>
              </div>
            )}

            {/* Memória de cálculo textual */}
            {resultado.analiseParcelas.memoriaCalculo && (
              <Accordion type="single" collapsible>
                <AccordionItem value="memoria-parcelas">
                  <AccordionTrigger className="text-sm font-medium hover:no-underline">
                    Memória de Cálculo das Parcelas (passo a passo)
                  </AccordionTrigger>
                  <AccordionContent>
                    <pre className="text-xs font-mono bg-muted/50 p-4 rounded-lg whitespace-pre-wrap leading-relaxed">
                      {resultado.analiseParcelas.memoriaCalculo}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}

      {/* Memória de Cálculo */}
      {memoria && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Memória de Cálculo Detalhada</CardTitle>
            <CardDescription>
              Demonstrativo passo a passo conforme metodologia da Resolução CMN nº 4.883/2020 e 4.913/2021
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={["etapa-0"]}>
              {memoria.etapas?.map((etapa: any, i: number) => (
                <AccordionItem key={etapa.descricao ?? `etapa-${i}`} value={`etapa-${i}`}>
                  <AccordionTrigger className="text-sm font-medium hover:no-underline">
                    {etapa.descricao}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-2">
                      <div className="bg-muted/50 rounded p-3">
                        <p className="text-xs font-mono text-muted-foreground">Fórmula: {etapa.formula}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {Object.entries(etapa.valores || {}).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{k}:</span>
                            <span className="font-medium font-mono">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-primary/5 border border-primary/20 rounded p-2">
                        <p className="text-sm font-bold text-primary">{etapa.resultado}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Fundamentação Legal */}
      {memoria?.fundamentacaoLegal && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Fundamentação Legal Aplicável</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {memoria.fundamentacaoLegal.normas?.map((norma: string) => (
                <Badge key={norma} variant="outline" className="text-xs">{norma}</Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {memoria.fundamentacaoLegal.descricao}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Jurisprudência */}
      {memoria?.jurisprudencia && memoria.jurisprudencia.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Jurisprudência Aplicável</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple">
              {memoria.jurisprudencia.map((j: any, i: number) => (
                <AccordionItem key={j.numero ?? `juri-${i}`} value={`juri-${i}`}>
                  <AccordionTrigger className="text-sm hover:no-underline">
                    <div className="text-left">
                      <p className="font-medium">{j.tribunal}</p>
                      <p className="text-xs text-muted-foreground">{j.numero} — {j.data}</p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <blockquote className="border-l-4 border-primary/30 pl-4 italic text-sm text-muted-foreground">
                      {j.ementa}
                    </blockquote>
                    <p className="text-xs text-muted-foreground mt-2">Relator: {j.relator}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Confronto com Norma MCR (PeríciaCR) */}
      {inputData?.linhaSelecionada && (
        <ComparativoMCRCard
          taxaContratadaAA={inputData.taxaJurosRemuneratorios}
          linhaId={inputData.linhaSelecionada}
          valorPrincipal={inputData.valorPrincipal}
          prazoMeses={inputData.prazoMeses}
          saldoDevedorAtualizado={resultado.saldoDevedorAtualizado}
          totalDevido={resultado.totalDevido}
        />
      )}

      {/* Parecer Técnico-Jurídico via IA */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Parecer Técnico-Jurídico (IA)
          </CardTitle>
          <CardDescription>
            Geração automática de parecer fundamentado com base nos dados do cálculo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!parecer && !loadingParecer && (
            <Button variant="outline" onClick={handleGerarParecer} className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Gerar Parecer Técnico-Jurídico
            </Button>
          )}
          {loadingParecer && (
            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Elaborando parecer técnico-jurídico...</span>
            </div>
          )}
          {parecer && (
            <div className="prose prose-sm max-w-none">
              <Streamdown>{parecer}</Streamdown>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-3 print:hidden">
        <Button onClick={handleNovoCalculo} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Novo Cálculo
        </Button>
        <Button onClick={() => setLocation("/app/historico")} variant="outline">
          Ver Histórico
        </Button>
        <Button onClick={handleGerarPDF}>
          <Download className="h-4 w-4 mr-2" /> Imprimir / Gerar PDF
        </Button>
      </div>
    </div>
  );
}
