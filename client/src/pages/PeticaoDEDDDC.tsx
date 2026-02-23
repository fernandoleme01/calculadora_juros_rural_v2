import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Building2, User, Scale, Printer, AlertCircle,
  Loader2, CheckCircle2, BookOpen, Gavel
} from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  // Processo
  numeroProcesso: z.string().optional(),
  comarca: z.string().min(1, "Informe a comarca"),
  vara: z.string().optional(),
  juiz: z.string().optional(),
  // Autor
  nomeAutor: z.string().min(2, "Informe o nome do autor"),
  cpfAutor: z.string().optional(),
  enderecoAutor: z.string().optional(),
  qualificacaoAutor: z.string().default("produtor rural"),
  // Banco
  nomeBanco: z.string().min(2, "Informe o nome do banco"),
  cnpjBanco: z.string().optional(),
  enderecoBanco: z.string().optional(),
  // Contrato
  numeroCedula: z.string().optional(),
  dataContratacao: z.string().optional(),
  valorContrato: z.string().optional(),
  // Advogado
  nomeAdvogado: z.string().optional(),
  oab: z.string().optional(),
  // Recusa
  descricaoRecusa: z.string().optional(),
  dataRecusa: z.string().optional(),
  // Pedidos
  pedirInversaoOnus: z.boolean().default(true),
  pedirTutelaUrgencia: z.boolean().default(false),
  pedirMultaDiaria: z.boolean().default(true),
  valorMultaDiaria: z.string().default("500"),
});

type FormData = z.infer<typeof schema>;

export default function PeticaoDEDDDC() {
  const [peticao, setPeticao] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("formulario");

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      qualificacaoAutor: "produtor rural",
      pedirInversaoOnus: true,
      pedirTutelaUrgencia: false,
      pedirMultaDiaria: true,
      valorMultaDiaria: "500",
    },
  });

  const pedirInversaoOnus = watch("pedirInversaoOnus");
  const pedirTutelaUrgencia = watch("pedirTutelaUrgencia");
  const pedirMultaDiaria = watch("pedirMultaDiaria");

  const gerarMutation = trpc.tcr.gerarPeticaoDEDDDC.useMutation({
    onSuccess: (data) => {
      setPeticao(typeof data.peticao === "string" ? data.peticao : String(data.peticao));
      setActiveTab("peticao");
      toast.success("Petição gerada com sucesso!");
    },
    onError: (err) => {
      toast.error("Erro ao gerar petição: " + err.message);
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => {
    gerarMutation.mutate({
      numeroProcesso: data.numeroProcesso ?? "",
      comarca: data.comarca,
      vara: data.vara ?? "",
      juiz: data.juiz ?? "",
      nomeAutor: data.nomeAutor,
      cpfAutor: data.cpfAutor ?? "",
      enderecoAutor: data.enderecoAutor ?? "",
      qualificacaoAutor: data.qualificacaoAutor,
      nomeBanco: data.nomeBanco,
      cnpjBanco: data.cnpjBanco ?? "",
      enderecoBanco: data.enderecoBanco ?? "",
      numeroCedula: data.numeroCedula ?? "",
      dataContratacao: data.dataContratacao ?? "",
      valorContrato: data.valorContrato ? parseFloat(data.valorContrato.replace(/\./g, "").replace(",", ".")) : undefined,
      nomeAdvogado: data.nomeAdvogado ?? "",
      oab: data.oab ?? "",
      descricaoRecusa: data.descricaoRecusa ?? "",
      dataRecusa: data.dataRecusa ?? "",
      pedirInversaoOnus: data.pedirInversaoOnus,
      pedirTutelaUrgencia: data.pedirTutelaUrgencia,
      pedirMultaDiaria: data.pedirMultaDiaria,
      valorMultaDiaria: data.valorMultaDiaria ? parseFloat(data.valorMultaDiaria) : 500,
    });
  };

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      {/* Cabeçalho */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Gavel className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-bold text-foreground">Petição de Exibição de DED/DDC</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Gera automaticamente a petição de exibição do Documento de Evolução da Dívida (DED/DDC),
          fundamentada no art. 6º, III e VIII do CDC, Res. CMN 5.004/2022 e arts. 396/399 do CPC.
        </p>
      </div>

      {/* Alerta informativo */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-4 pb-3">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Quando usar esta petição?</p>
              <p>
                Quando o banco se recusa a fornecer o Demonstrativo de Evolução da Dívida (DED/DDC),
                documento obrigatório pela <strong>Res. CMN 5.004/2022</strong> e essencial para a
                perícia contábil. A petição inclui pedido de inversão do ônus da prova e multa diária
                por descumprimento, com fundamento no art. 399 do CPC.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="formulario" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dados da Petição
          </TabsTrigger>
          <TabsTrigger value="peticao" disabled={!peticao} className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Petição Gerada
            {peticao && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
          </TabsTrigger>
        </TabsList>

        {/* Aba do formulário */}
        <TabsContent value="formulario">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Dados do Processo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-4 w-4 text-amber-500" />
                  Dados do Processo
                </CardTitle>
                <CardDescription className="text-xs">
                  Informações processuais (opcional se ainda não distribuído)
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="numeroProcesso">Número do Processo</Label>
                  <Input id="numeroProcesso" placeholder="0000000-00.0000.0.00.0000" {...register("numeroProcesso")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="comarca">Comarca <span className="text-red-500">*</span></Label>
                  <Input id="comarca" placeholder="Ex: São Paulo" {...register("comarca")} />
                  {errors.comarca && <p className="text-xs text-red-500">{errors.comarca.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vara">Vara</Label>
                  <Input id="vara" placeholder="Ex: 2ª Vara Cível" {...register("vara")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="juiz">Juiz(a)</Label>
                  <Input id="juiz" placeholder="Nome do(a) juiz(a)" {...register("juiz")} />
                </div>
              </CardContent>
            </Card>

            {/* Dados do Autor */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-amber-500" />
                  Dados do Autor (Produtor Rural)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="nomeAutor">Nome Completo <span className="text-red-500">*</span></Label>
                  <Input id="nomeAutor" placeholder="Nome completo do autor" {...register("nomeAutor")} />
                  {errors.nomeAutor && <p className="text-xs text-red-500">{errors.nomeAutor.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cpfAutor">CPF</Label>
                  <Input id="cpfAutor" placeholder="000.000.000-00" {...register("cpfAutor")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qualificacaoAutor">Qualificação</Label>
                  <Input id="qualificacaoAutor" placeholder="Ex: produtor rural, agricultor familiar" {...register("qualificacaoAutor")} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="enderecoAutor">Endereço</Label>
                  <Input id="enderecoAutor" placeholder="Endereço completo" {...register("enderecoAutor")} />
                </div>
              </CardContent>
            </Card>

            {/* Dados do Banco */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-500" />
                  Dados do Banco Réu
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nomeBanco">Nome do Banco <span className="text-red-500">*</span></Label>
                  <Input id="nomeBanco" placeholder="Ex: Banco do Brasil S.A." {...register("nomeBanco")} />
                  {errors.nomeBanco && <p className="text-xs text-red-500">{errors.nomeBanco.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cnpjBanco">CNPJ</Label>
                  <Input id="cnpjBanco" placeholder="00.000.000/0000-00" {...register("cnpjBanco")} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="enderecoBanco">Endereço do Banco</Label>
                  <Input id="enderecoBanco" placeholder="Endereço da agência ou sede" {...register("enderecoBanco")} />
                </div>
              </CardContent>
            </Card>

            {/* Dados do Contrato */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-500" />
                  Dados do Contrato de Crédito Rural
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="numeroCedula">Nº da Cédula/Contrato</Label>
                  <Input id="numeroCedula" placeholder="Ex: 123456/2020" {...register("numeroCedula")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dataContratacao">Data de Contratação</Label>
                  <Input id="dataContratacao" type="date" {...register("dataContratacao")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="valorContrato">Valor do Contrato (R$)</Label>
                  <Input id="valorContrato" placeholder="Ex: 150000,00" {...register("valorContrato")} />
                </div>
              </CardContent>
            </Card>

            {/* Contexto da Recusa */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Contexto da Recusa do Banco
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="dataRecusa">Data da Recusa</Label>
                    <Input id="dataRecusa" type="date" {...register("dataRecusa")} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="descricaoRecusa">Descrição da Recusa</Label>
                  <Textarea
                    id="descricaoRecusa"
                    rows={3}
                    placeholder="Descreva como o banco se recusou a fornecer o DED/DDC (ex: negativa verbal, resposta por escrito, silêncio após notificação extrajudicial...)"
                    {...register("descricaoRecusa")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pedidos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-amber-500" />
                  Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div>
                    <p className="text-sm font-medium">Inversão do Ônus da Prova</p>
                    <p className="text-xs text-muted-foreground">Art. 6º, VIII do CDC</p>
                  </div>
                  <Switch
                    checked={pedirInversaoOnus}
                    onCheckedChange={(v) => setValue("pedirInversaoOnus", v)}
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div>
                    <p className="text-sm font-medium">Tutela de Urgência</p>
                    <p className="text-xs text-muted-foreground">Art. 300 do CPC — para casos urgentes</p>
                  </div>
                  <Switch
                    checked={pedirTutelaUrgencia}
                    onCheckedChange={(v) => setValue("pedirTutelaUrgencia", v)}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Multa Diária por Descumprimento (astreintes)</p>
                    <p className="text-xs text-muted-foreground">Art. 399 do CPC</p>
                  </div>
                  <Switch
                    checked={pedirMultaDiaria}
                    onCheckedChange={(v) => setValue("pedirMultaDiaria", v)}
                  />
                </div>
                {pedirMultaDiaria && (
                  <div className="space-y-1.5 pl-4 border-l-2 border-amber-500/30">
                    <Label htmlFor="valorMultaDiaria">Valor da Multa Diária (R$)</Label>
                    <Input
                      id="valorMultaDiaria"
                      type="number"
                      min="100"
                      step="100"
                      placeholder="500"
                      className="max-w-xs"
                      {...register("valorMultaDiaria")}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dados do Advogado */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-4 w-4 text-amber-500" />
                  Dados do Advogado
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nomeAdvogado">Nome do Advogado</Label>
                  <Input id="nomeAdvogado" placeholder="Dr(a). Nome Completo" {...register("nomeAdvogado")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="oab">OAB</Label>
                  <Input id="oab" placeholder="Ex: OAB/SP 123.456" {...register("oab")} />
                </div>
              </CardContent>
            </Card>

            {/* Botão de gerar */}
            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={gerarMutation.isPending}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold min-w-48"
              >
                {gerarMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando Petição...
                  </>
                ) : (
                  <>
                    <Gavel className="h-4 w-4 mr-2" />
                    Gerar Petição
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Aba da petição gerada */}
        <TabsContent value="peticao">
          {peticao && (
            <div className="space-y-4">
              {/* Badges de fundamentação */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600">
                  Art. 6º, III e VIII do CDC
                </Badge>
                <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600">
                  Res. CMN 5.004/2022
                </Badge>
                <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600">
                  Arts. 396-404 do CPC
                </Badge>
                <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600">
                  Art. 399 do CPC
                </Badge>
              </div>

              {/* Botão de impressão */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir / Exportar PDF
                </Button>
              </div>

              {/* Conteúdo da petição */}
              <Card>
                <CardContent className="pt-6">
                  <div
                    id="peticao-content"
                    className="prose prose-sm max-w-none dark:prose-invert font-serif text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ fontFamily: "'Times New Roman', Times, serif" }}
                  >
                    {peticao}
                  </div>
                </CardContent>
              </Card>

              {/* Botão para nova petição */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => { setPeticao(null); setActiveTab("formulario"); }}
                >
                  Nova Petição
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir / PDF
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Estilo de impressão */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #peticao-content, #peticao-content * { visibility: visible; }
          #peticao-content {
            position: absolute;
            left: 0; top: 0;
            width: 100%;
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.8;
            color: #000;
            padding: 2cm;
          }
        }
      `}</style>
    </div>
  );
}
