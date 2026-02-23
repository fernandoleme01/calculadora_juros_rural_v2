import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, XCircle, AlertTriangle, Scale, FileText, Loader2, TrendingUp } from "lucide-react";
import { Streamdown } from "streamdown";
import { fmtBRL, fmtFixed } from "@/lib/formatters";

interface Props {
  taxaContratadaAA: number;
  linhaId: string;
  valorPrincipal: number;
  prazoMeses: number;
  saldoDevedorAtualizado?: number;
  totalDevido?: number;
  nomeDevedor?: string;
  numeroCedula?: string;
  nomeBanco?: string;
}

export default function ComparativoMCRCard({
  taxaContratadaAA,
  linhaId,
  valorPrincipal,
  prazoMeses,
  saldoDevedorAtualizado,
  totalDevido,
  nomeDevedor,
  numeroCedula,
  nomeBanco,
}: Props) {
  const [laudoGerado, setLaudoGerado] = useState<string>("");
  const [loadingLaudo, setLoadingLaudo] = useState(false);

  const { data: comparativo, isLoading } = trpc.mcr.comparativo.useQuery(
    { taxaContratadaAA, linhaId, valorPrincipal, prazoMeses },
    { enabled: !!linhaId && taxaContratadaAA > 0 }
  );

  const gerarLaudoMutation = trpc.tcr.gerarLaudoPericial.useMutation({
    onSuccess: (data) => {
      setLaudoGerado(typeof data.laudo === "string" ? data.laudo : JSON.stringify(data.laudo));
      setLoadingLaudo(false);
    },
    onError: () => setLoadingLaudo(false),
  });

  if (isLoading || !comparativo) return null;

  const {
    linha,
    taxaLimite,
    taxaContratada,
    diferencaPP,
    excede,
    excessoJurosTotal,
    veredicto,
    textoVeredicto,
    fundamentacao,
  } = comparativo;

  const corVeredicto =
    veredicto === "regular" ? "emerald" :
    veredicto === "excesso" ? "red" : "amber";

  const handleGerarLaudo = () => {
    setLoadingLaudo(true);
    setLaudoGerado("");
    gerarLaudoMutation.mutate({
      nomeDevedor: nomeDevedor ?? "",
      numeroCedula: numeroCedula ?? "",
      nomeBanco: nomeBanco ?? "",
      linhaCredito: linha?.label ?? linhaId,
      taxaContratadaAA: taxaContratada,
      taxaLimiteAA: taxaLimite ?? null,
      diferencaPP: diferencaPP ?? null,
      excede,
      excessoJurosTotal: excessoJurosTotal ?? null,
      fundamentacao,
      valorPrincipal,
      prazoMeses,
      saldoDevedorBanco: saldoDevedorAtualizado ?? null,
      totalDevidoRevisado: totalDevido ?? null,
      textoVeredicto,
    });
  };

  return (
    <Card
      className={`border-l-4 ${
        corVeredicto === "red"
          ? "border-l-red-500"
          : corVeredicto === "emerald"
          ? "border-l-emerald-500"
          : "border-l-amber-500"
      }`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Confronto com Norma MCR
          </span>
          <Badge
            className={
              veredicto === "regular"
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : veredicto === "excesso"
                ? "bg-red-100 text-red-800 border-red-200"
                : "bg-amber-100 text-amber-800 border-amber-200"
            }
          >
            {veredicto === "regular" && (
              <><CheckCircle className="h-3 w-3 mr-1" /> Taxa Regular</>
            )}
            {veredicto === "excesso" && (
              <><XCircle className="h-3 w-3 mr-1" /> Excesso Identificado</>
            )}
            {veredicto === "livre_pactuacao" && (
              <><AlertTriangle className="h-3 w-3 mr-1" /> Livre Pactuacao</>
            )}
          </Badge>
        </CardTitle>
        <CardDescription>
          Em conformidade com a Lei 4.829/65 · DL 167/67 · Resolucoes CMN, Manual de Credito Rural e Jurisprudencias
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tabela Comparativa — Colunas A e B */}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground">Parametro</th>
                <th className="text-right p-3 font-medium text-blue-700">Coluna A — Banco</th>
                <th className="text-right p-3 font-medium text-emerald-700">Coluna B — MCR/Justica</th>
                <th className="text-right p-3 font-medium text-red-700">Diferenca</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="p-3 text-muted-foreground">Linha de Credito</td>
                <td className="p-3 text-right font-medium" colSpan={3}>
                  {linha?.label ?? linhaId}
                </td>
              </tr>
              <tr>
                <td className="p-3 text-muted-foreground">Taxa de Juros (% a.a.)</td>
                <td className="p-3 text-right font-bold text-blue-700">
                  {taxaContratada.toFixed(2)}%
                </td>
                <td className="p-3 text-right font-bold text-emerald-700">
                  {taxaLimite != null ? `${taxaLimite.toFixed(2)}%` : "Livre"}
                </td>
                <td
                  className={`p-3 text-right font-bold ${
                    excede ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {diferencaPP != null
                    ? excede
                      ? `+${diferencaPP.toFixed(2)} p.p.`
                      : `${diferencaPP.toFixed(2)} p.p.`
                    : "—"}
                </td>
              </tr>
              <tr>
                <td className="p-3 text-muted-foreground">Valor Principal</td>
                <td className="p-3 text-right">{fmtBRL(valorPrincipal)}</td>
                <td className="p-3 text-right">{fmtBRL(valorPrincipal)}</td>
                <td className="p-3 text-right text-muted-foreground">—</td>
              </tr>
              {excessoJurosTotal != null && (
                <tr className={excede ? "bg-red-50" : "bg-emerald-50"}>
                  <td className="p-3 font-medium">Excesso de Juros (R$)</td>
                  <td className="p-3 text-right text-blue-700">
                    {fmtBRL(totalDevido ?? 0)}
                  </td>
                  <td className="p-3 text-right text-emerald-700">
                    {fmtBRL((totalDevido ?? 0) - excessoJurosTotal)}
                  </td>
                  <td
                    className={`p-3 text-right font-bold ${
                      excede ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {excede ? fmtBRL(excessoJurosTotal) : "R$ 0,00"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Veredicto */}
        <Alert
          className={
            veredicto === "excesso"
              ? "border-red-200 bg-red-50"
              : veredicto === "regular"
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
          }
        >
          {veredicto === "excesso" ? (
            <XCircle className="h-4 w-4 text-red-600" />
          ) : veredicto === "regular" ? (
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          )}
          <AlertDescription
            className={`text-sm ${
              veredicto === "excesso"
                ? "text-red-700"
                : veredicto === "regular"
                ? "text-emerald-700"
                : "text-amber-700"
            }`}
          >
            {textoVeredicto}
          </AlertDescription>
        </Alert>

        {/* Base normativa */}
        <div className="text-xs text-muted-foreground flex items-start gap-1.5">
          <FileText className="h-3 w-3 shrink-0 mt-0.5" />
          <span>
            <strong>Base normativa:</strong> {fundamentacao}
          </span>
        </div>

        <Separator />

        {/* Laudo Pericial 8 Secoes */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Laudo Pericial Contabil — 8 Secoes
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              I Introducao · II Objeto · III Controversia · IV Metodologia · V Analise Pericial (Colunas A/B) · VI Quesitos · VII Conclusao · VIII Encerramento
            </p>
          </div>

          {!laudoGerado && !loadingLaudo && (
            <Button
              variant="outline"
              onClick={handleGerarLaudo}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Gerar Laudo Pericial Completo (8 Secoes)
            </Button>
          )}

          {loadingLaudo && (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Elaborando laudo pericial contabil...</span>
            </div>
          )}

          {laudoGerado && (
            <Accordion type="single" collapsible defaultValue="laudo">
              <AccordionItem value="laudo">
                <AccordionTrigger className="text-sm font-medium">
                  Ver Laudo Pericial Completo
                </AccordionTrigger>
                <AccordionContent>
                  <div className="border rounded-lg p-4 bg-muted/20 print:border-none space-y-2">
                    <div className="text-center pb-3 border-b">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Em conformidade com a Lei 4.829/65 · DL 167/67 · Resolucoes CMN, Manual de Credito Rural e Jurisprudencias
                      </p>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{laudoGerado}</Streamdown>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.print()}
                    >
                      <FileText className="h-3 w-3 mr-1" /> Imprimir Laudo
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(laudoGerado)}
                    >
                      Copiar Texto
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setLaudoGerado(""); }}
                    >
                      Regerar
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
