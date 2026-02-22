import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calculator,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  FileText,
  Info,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// ─── Schema de Validação ─────────────────────────────────────────────────────

const schema = z.object({
  valorPrincipal: z.coerce.number().positive("Valor deve ser positivo"),
  taxaJurosAnual: z.coerce.number().positive("Taxa deve ser positiva"),
  numeroParcelas: z.coerce.number().int().positive("Número de parcelas deve ser positivo"),
  parcelasPagas: z.coerce.number().int().min(0, "Não pode ser negativo"),
  sistema: z.enum(["price", "sac", "saf"]),
  periodicidade: z.enum(["anual", "mensal"]),
});

type FormData = z.infer<typeof schema>;

// ─── Helpers de Formatação ───────────────────────────────────────────────────

const fmtR = (n: unknown) => {
  const num = typeof n === 'string' ? parseFloat(n) : Number(n);
  return (isFinite(num) ? num : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const fmtP = (n: unknown, d = 4) => {
  const num = typeof n === 'string' ? parseFloat(n) : Number(n);
  return `${((isFinite(num) ? num : 0) * 100).toFixed(d)}%`;
};

// ─── Componente Principal ────────────────────────────────────────────────────

export default function Amortizacao() {
  const [resultado, setResultado] = useState<any>(null);
  const [abaAtiva, setAbaAtiva] = useState("resumo");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      sistema: "price",
      periodicidade: "anual",
      parcelasPagas: 0,
    },
  });

  const calcularMutation = trpc.amortizacao.calcular.useMutation({
    onSuccess: (data) => {
      setResultado(data);
      setAbaAtiva("resumo");
      toast.success("Amortização calculada com sucesso!");
    },
    onError: (err) => {
      toast.error(`Erro no cálculo: ${err.message}`);
    },
  });

  const onSubmit = (data: FormData) => {
    calcularMutation.mutate(data);
  };

  const sistema = watch("sistema");
  const periodicidade = watch("periodicidade");

  const sistemaNome = {
    price: "Price (Tabela Francesa)",
    sac: "SAC (Amortização Constante)",
    saf: "SAF (Francês Adaptado)",
  }[sistema] ?? sistema;

  return (
    <div className="container py-6 max-w-7xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          Calculadora de Amortização — Crédito Rural
        </h1>
        <p className="text-muted-foreground mt-1">
          Calcule a planilha de amortização com periodicidade anual ou mensal e compare com os limites legais (12% a.a.)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Dados do Financiamento</CardTitle>
            <CardDescription>Preencha os dados do contrato de crédito rural</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Valor Principal */}
              <div className="space-y-1">
                <Label htmlFor="valorPrincipal">Valor Financiado (R$)</Label>
                <Input
                  id="valorPrincipal"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 500000.00"
                  {...register("valorPrincipal")}
                />
                {errors.valorPrincipal && (
                  <p className="text-xs text-destructive">{errors.valorPrincipal.message}</p>
                )}
              </div>

              {/* Taxa de Juros */}
              <div className="space-y-1">
                <Label htmlFor="taxaJurosAnual">Taxa de Juros Contratada (% a.a.)</Label>
                <Input
                  id="taxaJurosAnual"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 15.50"
                  {...register("taxaJurosAnual")}
                />
                {errors.taxaJurosAnual && (
                  <p className="text-xs text-destructive">{errors.taxaJurosAnual.message}</p>
                )}
                <p className="text-xs text-muted-foreground">Limite legal: 12% a.a. (Decreto nº 22.626/33)</p>
              </div>

              {/* Sistema de Amortização */}
              <div className="space-y-1">
                <Label>Sistema de Amortização</Label>
                <Select
                  defaultValue="price"
                  onValueChange={(v) => setValue("sistema", v as "price" | "sac" | "saf")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o sistema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Price — Prestações iguais</SelectItem>
                    <SelectItem value="sac">SAC — Amortização constante</SelectItem>
                    <SelectItem value="saf">SAF — Francês Adaptado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Periodicidade */}
              <div className="space-y-1">
                <Label>Periodicidade das Parcelas</Label>
                <Select
                  defaultValue="anual"
                  onValueChange={(v) => setValue("periodicidade", v as "anual" | "mensal")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a periodicidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anual">Anual — Safra a safra (padrão rural)</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
                {periodicidade === "anual" && (
                  <p className="text-xs text-muted-foreground">
                    Modalidade predominante no crédito rural (Lei nº 4.829/65)
                  </p>
                )}
                {periodicidade === "mensal" && sistema === "price" && (
                  <p className="text-xs text-amber-600">
                    ⚠️ Verificar cláusula de capitalização (Súmula 121/STF)
                  </p>
                )}
              </div>

              {/* Número de Parcelas */}
              <div className="space-y-1">
                <Label htmlFor="numeroParcelas">
                  Total de Parcelas {periodicidade === "anual" ? "(anos)" : "(meses)"}
                </Label>
                <Input
                  id="numeroParcelas"
                  type="number"
                  step="1"
                  min="1"
                  placeholder={periodicidade === "anual" ? "Ex: 5 (5 anos)" : "Ex: 60 (5 anos)"}
                  {...register("numeroParcelas")}
                />
                {errors.numeroParcelas && (
                  <p className="text-xs text-destructive">{errors.numeroParcelas.message}</p>
                )}
              </div>

              {/* Parcelas Pagas */}
              <div className="space-y-1">
                <Label htmlFor="parcelasPagas">Parcelas Já Pagas</Label>
                <Input
                  id="parcelasPagas"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Ex: 2"
                  {...register("parcelasPagas")}
                />
                {errors.parcelasPagas && (
                  <p className="text-xs text-destructive">{errors.parcelasPagas.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  O saldo devedor será calculado após estas parcelas
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={calcularMutation.isPending}
              >
                {calcularMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Calculando...</>
                ) : (
                  <><Calculator className="h-4 w-4 mr-2" /> Calcular Amortização</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Resultados */}
        <div className="lg:col-span-2">
          {!resultado ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-16">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Preencha os dados do financiamento e clique em "Calcular Amortização"
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Alertas */}
              {resultado.fundamentacao?.alertas?.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="space-y-1">
                      {resultado.fundamentacao.alertas.map((alerta: string, i: number) => (
                        <li key={i} className="text-sm">{alerta}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Cards de Resumo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">Saldo Devedor Atual</p>
                    <p className="text-lg font-bold text-foreground">{fmtR(resultado.saldoDevedorAtual)}</p>
                    <p className="text-xs text-muted-foreground">pelo contrato</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">Saldo pela Taxa Legal</p>
                    <p className="text-lg font-bold text-green-600">{fmtR(resultado.saldoDevedorLegal)}</p>
                    <p className="text-xs text-muted-foreground">com 12% a.a.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">Excesso Cobrado</p>
                    <p className={`text-lg font-bold ${resultado.excessoTotal > 0 ? "text-destructive" : "text-green-600"}`}>
                      {fmtR(resultado.excessoTotal)}
                    </p>
                    <p className="text-xs text-muted-foreground">juros acima do limite</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground">Prestação Inicial</p>
                    <p className="text-lg font-bold text-foreground">{fmtR(resultado.prestacaoInicial)}</p>
                    <p className="text-xs text-muted-foreground">{sistemaNome}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs de Detalhes */}
              <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="resumo">Resumo</TabsTrigger>
                  <TabsTrigger value="planilha">Planilha</TabsTrigger>
                  <TabsTrigger value="fundamentacao">Fundamentação</TabsTrigger>
                </TabsList>

                {/* Aba Resumo */}
                <TabsContent value="resumo">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Memória de Cálculo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted rounded-lg p-4 font-mono text-xs space-y-1">
                        {resultado.memoriaCalculo?.map((linha: string, i: number) => (
                          <p key={i} className={linha.startsWith("───") ? "text-primary font-bold mt-2" : "text-foreground"}>
                            {linha}
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba Planilha */}
                <TabsContent value="planilha">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Planilha de Amortização Completa
                      </CardTitle>
                      <CardDescription>
                        Comparativo entre taxa contratada e taxa legal máxima (12% a.a.)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">Nº</TableHead>
                              <TableHead>Saldo Inicial</TableHead>
                              <TableHead>Juros (Contrato)</TableHead>
                              <TableHead>Amortização</TableHead>
                              <TableHead>Prestação</TableHead>
                              <TableHead>Juros (Legal 12%)</TableHead>
                              <TableHead className="text-destructive">Excesso</TableHead>
                              <TableHead>Saldo Final</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {resultado.planilha?.map((linha: any) => (
                              <TableRow
                                key={linha.numeroParcela}
                                className={linha.numeroParcela <= resultado.parcelasPagas ? "bg-muted/30" : ""}
                              >
                                <TableCell className="font-medium">
                                  {linha.numeroParcela}
                                  {linha.numeroParcela <= resultado.parcelasPagas && (
                                    <Badge variant="secondary" className="ml-1 text-xs">paga</Badge>
                                  )}
                                </TableCell>
                                <TableCell>{fmtR(linha.saldoInicial)}</TableCell>
                                <TableCell className="text-amber-600">{fmtR(linha.juros)}</TableCell>
                                <TableCell>{fmtR(linha.amortizacao)}</TableCell>
                                <TableCell className="font-medium">{fmtR(linha.prestacao)}</TableCell>
                                <TableCell className="text-green-600">{fmtR(linha.jurosLegal ?? 0)}</TableCell>
                                <TableCell className={linha.excessoCobrado > 0 ? "text-destructive font-medium" : "text-green-600"}>
                                  {fmtR(linha.excessoCobrado ?? 0)}
                                </TableCell>
                                <TableCell>{fmtR(linha.saldoFinal)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba Fundamentação */}
                <TabsContent value="fundamentacao">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Fundamentação Técnico-Jurídica
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Sistema de Amortização</h4>
                        <p className="text-sm text-muted-foreground">{resultado.fundamentacao?.sistemaDescricao}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Periodicidade</h4>
                        <p className="text-sm text-muted-foreground">{resultado.fundamentacao?.periodicidadeDescricao}</p>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Normas Aplicáveis</h4>
                        <ul className="space-y-1">
                          {resultado.fundamentacao?.normas?.map((norma: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                              {norma}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Jurisprudência Aplicável</h4>
                        <div className="space-y-3">
                          {resultado.fundamentacao?.jurisprudencia?.map((j: any, i: number) => (
                            <div key={i} className="border rounded-lg p-3 bg-muted/30">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">{j.tribunal}</Badge>
                                <span className="text-xs font-medium text-primary">{j.numero}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{j.ementa}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
