import { useState } from "react";
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
import { Calculator, Info, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
  taxaJurosRemuneratorios: z.coerce.number().min(0).max(100),
  taxaJurosMora: z.coerce.number().min(0).max(100).default(1),
  taxaMulta: z.coerce.number().min(0).max(10).default(2),
  taxaJm: z.coerce.number().optional(),
  fatorInflacaoImplicita: z.coerce.number().optional(),
  fatorPrograma: z.coerce.number().optional(),
  fatorAjuste: z.coerce.number().default(0),
  salvar: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

// Armazenamento temporário do resultado para passar para a página de resultado
let resultadoTemp: unknown = null;
let inputTemp: unknown = null;

export function getResultadoTemp() { return resultadoTemp; }
export function getInputTemp() { return inputTemp; }

export default function Calculadora() {
  const [, setLocation] = useLocation();
  const [ipcaMensal, setIpcaMensal] = useState<number[]>([]);
  const [novoIpca, setNovoIpca] = useState("");
  const [tipoTaxaSelecionada, setTipoTaxaSelecionada] = useState<"pre_fixada" | "pos_fixada">("pos_fixada");

  const { data: limites } = trpc.tcr.limitesLegais.useQuery();

  const calcularMutation = trpc.tcr.calcular.useMutation({
    onSuccess: (data) => {
      resultadoTemp = data;
      inputTemp = getValues();
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
      taxaMulta: 2,
      fatorAjuste: 0,
      salvar: true,
      dataCalculo: new Date().toISOString().split("T")[0],
    },
  });

  const taxaRem = watch("taxaJurosRemuneratorios");
  const taxaMora = watch("taxaJurosMora");

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

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      dataContratacao: new Date(data.dataContratacao).toISOString(),
      dataVencimento: new Date(data.dataVencimento).toISOString(),
      dataCalculo: new Date(data.dataCalculo).toISOString(),
      ipcaMensal: tipoTaxaSelecionada === "pos_fixada" ? ipcaMensal : undefined,
    };
    calcularMutation.mutate(payload);
  };

  const limiteRemExcedido = taxaRem > (limites?.jurosRemuneratoriosMaxAA ?? 12);
  const limiteMoraExcedido = taxaMora > (limites?.jurosMoraMaxAA ?? 1);

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
                type="number"
                step="0.01"
                placeholder="0,00"
                {...register("valorPrincipal")}
              />
              {errors.valorPrincipal && <p className="text-xs text-destructive">{errors.valorPrincipal.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prazoMeses">Prazo (meses) *</Label>
              <Input id="prazoMeses" type="number" placeholder="12" {...register("prazoMeses")} />
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
                  type="number"
                  step="0.01"
                  placeholder="Ex: 7.00"
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
                  Juros de Mora (% a.a.)
                  <Badge variant="outline" className="ml-2 text-xs">Máx. {limites?.jurosMoraMaxAA ?? 1}% a.a.</Badge>
                </Label>
                <Input
                  id="taxaJurosMora"
                  type="number"
                  step="0.001"
                  placeholder="1.000"
                  {...register("taxaJurosMora")}
                  className={limiteMoraExcedido ? "border-destructive" : ""}
                />
                {limiteMoraExcedido && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Excede o limite legal de {limites?.jurosMoraMaxAA ?? 1}% a.a. (DL 167/67, art. 5º)
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxaMulta">Multa Contratual (%)</Label>
                <Input id="taxaMulta" type="number" step="0.01" placeholder="2.00" {...register("taxaMulta")} />
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
                      type="number"
                      step="0.0001"
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
                  <Input id="taxaJm" type="number" step="0.0001" placeholder="Ex: 13.50" {...register("taxaJm")} />
                  <p className="text-xs text-muted-foreground">Calculada e divulgada em maio, vigência jul/ano a jun/ano seguinte</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fatorInflacaoImplicita">
                    FII — Fator de Inflação Implícita
                  </Label>
                  <Input id="fatorInflacaoImplicita" type="number" step="0.0000001" placeholder="Ex: 1.0500000" {...register("fatorInflacaoImplicita")} />
                  <p className="text-xs text-muted-foreground">Divulgado pelo BCB no último dia útil de abril</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fatorPrograma">
                    FP — Fator de Programa
                  </Label>
                  <Input id="fatorPrograma" type="number" step="0.0000001" placeholder="Ex: 0.1896008" {...register("fatorPrograma")} />
                  <p className="text-xs text-muted-foreground">Definido pelo CMN para cada linha de crédito (Res. CMN 5.153/2024)</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fatorAjuste">
                    FA — Fator de Ajuste
                  </Label>
                  <Input id="fatorAjuste" type="number" step="0.0000001" placeholder="0.0000000" {...register("fatorAjuste")} />
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
                  • Juros remuneratórios de {taxaRem?.toFixed(2)}% a.a. excedem o limite de {limites?.jurosRemuneratoriosMaxAA ?? 12}% a.a. estabelecido pela jurisprudência consolidada do STJ (Decreto nº 22.626/33 — Lei de Usura).
                </p>
              )}
              {limiteMoraExcedido && (
                <p className="mt-1 text-sm">
                  • Juros de mora de {taxaMora?.toFixed(3)}% a.a. excedem o limite de {limites?.jurosMoraMaxAA ?? 1}% a.a. estabelecido pelo Decreto-Lei nº 167/67, art. 5º.
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

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
