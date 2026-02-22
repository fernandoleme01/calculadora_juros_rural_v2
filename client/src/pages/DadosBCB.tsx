import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, TrendingUp, TrendingDown, DollarSign, BarChart3, Landmark, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function DadosBCB() {
  const [refetchKey, setRefetchKey] = useState(0);

  const { data, isLoading, error, refetch } = trpc.bcb.dadosAtualizados.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });

  const { data: jurisprudencia } = trpc.bcb.jurisprudenciaReal.useQuery();

  const handleRefresh = () => {
    setRefetchKey(k => k + 1);
    refetch();
  };

  const formatPct = (v?: number | string | null) => {
    if (v == null) return "N/D";
    const n = typeof v === "string" ? parseFloat(v) : v;
    if (isNaN(n)) return "N/D";
    return `${n.toFixed(4)}%`;
  };

  const formatBRL = (v?: number | null) => {
    if (v == null) return "N/D";
    return v.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Indicadores do Banco Central</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dados atualizados em tempo real via API do BCB — SELIC, IPCA, Câmbio e Crédito Rural
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="gap-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Atualizar
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">Não foi possível conectar à API do Banco Central. Verifique a conexão e tente novamente.</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Consultando API do Banco Central...</span>
        </div>
      )}

      {data && (
        <>
          {/* Cards de Indicadores Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* SELIC */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Taxa SELIC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {data.selic.anualizada != null ? `${data.selic.anualizada.toFixed(2)}%` : "N/D"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">ao ano (anualizada)</p>
                {data.selic.diaria.length > 0 && (
                  <p className="text-xs text-muted-foreground">Diária: {formatPct(data.selic.diaria[data.selic.diaria.length - 1]?.valor)}</p>
                )}
                <Badge variant="outline" className="mt-2 text-xs">BCB Série 11</Badge>
              </CardContent>
            </Card>

            {/* IPCA */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  IPCA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {data.ipca.acumulado12m?.valor != null ? `${data.ipca.acumulado12m.valor}%` : "N/D"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">acumulado 12 meses</p>
                {data.ipca.mensal.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Último mês: {formatPct(data.ipca.mensal[data.ipca.mensal.length - 1]?.valor)}
                  </p>
                )}
                <Badge variant="outline" className="mt-2 text-xs">BCB Série 433</Badge>
              </CardContent>
            </Card>

            {/* Câmbio USD */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Dólar (PTAX)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {data.cambio.usdVenda != null ? `R$ ${formatBRL(data.cambio.usdVenda)}` : "N/D"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">cotação de venda</p>
                {data.cambio.usdCompra != null && (
                  <p className="text-xs text-muted-foreground">Compra: R$ {formatBRL(data.cambio.usdCompra)}</p>
                )}
                <Badge variant="outline" className="mt-2 text-xs">BCB PTAX</Badge>
              </CardContent>
            </Card>

            {/* Crédito Rural */}
            <Card className="border-l-4 border-l-emerald-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Landmark className="h-4 w-4" />
                  Crédito Rural
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-700">
                  {data.creditoRural.taxaMedia.length > 0
                    ? `${String(data.creditoRural.taxaMedia[data.creditoRural.taxaMedia.length - 1]?.valor ?? "N/D")}%`
                    : "N/D"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">taxa média (% a.a.)</p>
                <Badge variant="outline" className="mt-2 text-xs">BCB Série 20714</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Limites Legais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary" />
                Limites Legais Vigentes para Crédito Rural
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Juros Remuneratórios</p>
                  <p className="text-2xl font-bold text-green-800 mt-1">12% a.a.</p>
                  <p className="text-xs text-green-600 mt-1">Decreto nº 22.626/33 + Súmula 382/STJ</p>
                  <p className="text-xs text-green-600">Quando o CMN não fixar taxa</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Juros Moratórios</p>
                  <p className="text-2xl font-bold text-blue-800 mt-1">1% a.a.</p>
                  <p className="text-xs text-blue-600 mt-1">Decreto-Lei nº 167/67, art. 5º, § único</p>
                  <p className="text-xs text-blue-600">Cédulas de Crédito Rural</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Multa Contratual</p>
                  <p className="text-2xl font-bold text-amber-800 mt-1">2%</p>
                  <p className="text-xs text-amber-600 mt-1">Código Civil, art. 412</p>
                  <p className="text-xs text-amber-600">Sobre o valor da obrigação</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* IPCA Histórico */}
          {data.ipca.mensal.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">IPCA — Variação Mensal (últimos meses)</CardTitle>
                <p className="text-xs text-muted-foreground">Fonte: BCB — Série 433 | Utilizado no cálculo TCRpós (Fator de Atualização Monetária)</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Data</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Variação (%)</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Tendência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...data.ipca.mensal].reverse().slice(0, 12).map((item, i, arr) => {
                        const prev = arr[i + 1];
                        const atual = parseFloat(String(item.valor));
                        const anterior = prev ? parseFloat(String(prev.valor)) : null;
                        const subiu = anterior != null && atual > anterior;
                        return (
                          <tr key={item.data} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-2 px-3 text-foreground">{item.data}</td>
                            <td className="py-2 px-3 text-right font-mono font-medium">
                              {formatPct(item.valor)}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {anterior != null ? (
                                subiu
                                  ? <TrendingUp className="h-4 w-4 text-red-500 inline" />
                                  : <TrendingDown className="h-4 w-4 text-green-500 inline" />
                              ) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Crédito Rural Histórico */}
          {data.creditoRural.taxaMedia.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Taxa Média de Crédito Rural — Histórico</CardTitle>
                <p className="text-xs text-muted-foreground">Fonte: BCB — Série 20714 | Taxa média das operações de crédito rural</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Data</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Taxa Média (% a.a.)</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Limite Legal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...data.creditoRural.taxaMedia].reverse().slice(0, 10).map((item) => {
                        const taxa = parseFloat(String(item.valor));
                        const acimaDolimite = taxa > 12;
                        return (
                          <tr key={item.data} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-2 px-3 text-foreground">{item.data}</td>
                            <td className={`py-2 px-3 text-right font-mono font-medium ${acimaDolimite ? "text-red-600" : "text-green-600"}`}>
                              {formatPct(item.valor)}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {acimaDolimite
                                ? <Badge variant="destructive" className="text-xs">Acima de 12%</Badge>
                                : <Badge variant="outline" className="text-xs text-green-600 border-green-300">Dentro do Limite</Badge>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rodapé com timestamp */}
          <p className="text-xs text-muted-foreground text-center pb-4">
            Dados obtidos diretamente da API de Dados Abertos do Banco Central do Brasil (api.bcb.gov.br) •
            Última atualização: {new Date().toLocaleString("pt-BR")}
          </p>
        </>
      )}

      {/* Jurisprudência Real */}
      {jurisprudencia && jurisprudencia.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Jurisprudência Real — Crédito Rural</CardTitle>
            <p className="text-xs text-muted-foreground">Processos reais com ementas completas — STJ, TRF e TJDFT</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {jurisprudencia.map((j) => (
              <div key={j.numero} className="p-4 rounded-lg border bg-muted/20">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">{j.tribunal}</Badge>
                    <span className="text-sm font-semibold text-foreground">{j.numero}</span>
                  </div>
                  <Badge className="text-xs shrink-0" variant={
                    j.tema === "juros_remuneratorios" ? "default" :
                    j.tema === "juros_mora" ? "secondary" :
                    j.tema === "revisao_contratual" ? "outline" : "outline"
                  }>
                    {j.tema.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{j.ementa}</p>
                <p className="text-xs text-muted-foreground mt-2 font-mono">{j.referencia}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
