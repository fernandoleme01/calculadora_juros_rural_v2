import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileText, Download, Copy, CheckCircle, AlertCircle, Scale, Gavel, BookOpen, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

// ─── Schema de Validação ──────────────────────────────────────────────────────

const peticaoSchema = z.object({
  // Dados do Autor
  nomeAutor: z.string().min(3, "Nome obrigatório"),
  nacionalidade: z.string().default("brasileiro(a)"),
  estadoCivil: z.string().min(2, "Estado civil obrigatório"),
  cpf: z.string().min(11, "CPF obrigatório"),
  rg: z.string().optional().default(""),
  endereco: z.string().min(5, "Endereço obrigatório"),
  nomePropriedade: z.string().min(2, "Nome da propriedade obrigatório"),
  municipioPropriedade: z.string().min(2, "Município obrigatório"),
  uf: z.string().length(2, "UF deve ter 2 letras"),
  // Dados do Banco
  nomeBanco: z.string().min(2, "Nome do banco obrigatório"),
  cnpjBanco: z.string().min(14, "CNPJ obrigatório"),
  enderecoBanco: z.string().optional().default(""),
  // Dados do Contrato
  numeroContrato: z.string().min(1, "Número do contrato obrigatório"),
  dataContratacao: z.string().min(1, "Data de contratação obrigatória"),
  valorCredito: z.number().positive("Deve ser positivo"),
  dataVencimento: z.string().min(1, "Data de vencimento obrigatória"),
  modalidade: z.enum(["custeio", "investimento", "comercializacao"]),
  cultura: z.string().min(2, "Cultura obrigatória"),
  anoSafra: z.string().min(4, "Ano da safra obrigatório"),
  taxaJurosContratada: z.number().min(0).max(100),
  taxaJurosMoraContratada: z.number().min(0).max(100).default(1),
  garantias: z.string().min(5, "Descreva as garantias"),
  // Dados do Evento
  tipoEvento: z.string().min(3, "Tipo do evento obrigatório"),
  descricaoEvento: z.string().min(20, "Descreva o evento com mais detalhes"),
  dataComunicacaoBanco: z.string().min(1, "Data da comunicação obrigatória"),
  descricaoPropostaRenegociacao: z.string().min(10, "Descreva a proposta ou ausência dela"),
  // Dados do Advogado
  nomeAdvogado: z.string().min(3, "Nome do advogado obrigatório"),
  oab: z.string().min(3, "OAB obrigatória"),
  telefoneAdvogado: z.string().optional().default(""),
  emailAdvogado: z.string().optional().default(""),
  enderecoEscritorio: z.string().min(5, "Endereço do escritório obrigatório"),
  comarca: z.string().min(2, "Comarca obrigatória"),
  vara: z.string().optional().default("[VARA]"),
  // Dados do Cálculo (opcionais)
  saldoDevedor: z.number().optional(),
  saldoDevedorRevisado: z.number().optional(),
  excessoJuros: z.number().optional(),
});

type PeticaoForm = z.infer<typeof peticaoSchema>;

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function GeradorPeticao() {
  const [resultado, setResultado] = useState<{
    titulo: string;
    textoCompleto: string;
    dataEmissao: string;
  } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState<"peticao" | "laudo">("peticao");

  // Carregar perfil do advogado automaticamente
  const { data: perfilAdvogado } = trpc.perfil.buscarAdvogado.useQuery();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PeticaoForm>({
    resolver: zodResolver(peticaoSchema) as any,
    defaultValues: {
      nacionalidade: "brasileiro(a)",
      taxaJurosMoraContratada: 1,
      vara: "[VARA]",
    },
  });

  // Pré-preencher campos do advogado quando o perfil for carregado
  useEffect(() => {
    if (perfilAdvogado) {
      if (perfilAdvogado.nome) setValue("nomeAdvogado", perfilAdvogado.nome);
      if (perfilAdvogado.oab) setValue("oab", perfilAdvogado.oab);
      if (perfilAdvogado.telefone) setValue("telefoneAdvogado", perfilAdvogado.telefone);
      if (perfilAdvogado.email) setValue("emailAdvogado", perfilAdvogado.email);
      // Montar endereço do escritório
      const partes = [
        perfilAdvogado.escritorio,
        perfilAdvogado.endereco,
        perfilAdvogado.cidade,
        perfilAdvogado.estado,
        perfilAdvogado.cep,
      ].filter(Boolean);
      if (partes.length > 0) setValue("enderecoEscritorio", partes.join(", "));
    }
  }, [perfilAdvogado, setValue]);

  const gerarPeticao = trpc.peticao.gerar.useMutation({
    onSuccess: (data) => {
      setResultado(data);
      toast.success("Petição gerada com sucesso!");
    },
    onError: (err) => {
      toast.error(`Erro ao gerar petição: ${err.message}`);
    },
  });

  const gerarLaudo = trpc.laudo.gerar.useMutation({
    onSuccess: (data) => {
      setResultado({
        titulo: data.titulo,
        textoCompleto: data.textoCompleto,
        dataEmissao: data.dataEmissao,
      });
      toast.success("Laudo técnico-jurídico gerado com sucesso!");
    },
    onError: (err) => {
      toast.error(`Erro ao gerar laudo: ${err.message}`);
    },
  });

  const isLoading = gerarPeticao.isPending || gerarLaudo.isPending;

  const onSubmit = (data: PeticaoForm) => {
    if (tipoDocumento === "peticao") {
      gerarPeticao.mutate(data);
    } else {
      gerarLaudo.mutate({
        ...data,
        rg: data.rg ?? "",
        enderecoBanco: data.enderecoBanco ?? "",
        telefoneAdvogado: data.telefoneAdvogado ?? "",
        emailAdvogado: data.emailAdvogado ?? "",
        vara: data.vara ?? "[VARA]",
        tipoEvento: data.tipoEvento,
        descricaoEvento: data.descricaoEvento,
        dataComunicacaoBanco: data.dataComunicacaoBanco,
        descricaoPropostaRenegociacao: data.descricaoPropostaRenegociacao,
      });
    }
  };

  const handleCopiar = async () => {
    if (!resultado) return;
    await navigator.clipboard.writeText(resultado.textoCompleto);
    setCopiado(true);
    toast.success("Texto copiado para a área de transferência!");
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleImprimir = () => {
    if (!resultado) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>${resultado.titulo}</title>
        <style>
          body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.8; margin: 3cm 2.5cm; color: #000; }
          h1 { font-size: 14pt; text-align: center; font-weight: bold; margin-bottom: 1em; }
          p { text-align: justify; margin-bottom: 0.5em; }
          pre { white-space: pre-wrap; font-family: inherit; font-size: 12pt; }
          @media print { body { margin: 2cm; } }
        </style>
      </head>
      <body>
        <pre>${resultado.textoCompleto}</pre>
      </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Gavel className="h-6 w-6 text-primary" />
          Gerador de Documentos Jurídicos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gere petições e laudos técnico-jurídicos fundamentados em legislação e jurisprudência reais
        </p>
      </div>

      {/* Seleção do tipo de documento */}
      <div className="flex gap-3">
        <button
          onClick={() => setTipoDocumento("peticao")}
          className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${
            tipoDocumento === "peticao"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Scale className={`h-4 w-4 ${tipoDocumento === "peticao" ? "text-primary" : "text-muted-foreground"}`} />
            <span className="font-semibold text-sm">Petição Inicial</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Ação de Revisão Contratual de Crédito Rural c/c Tutela de Urgência
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Fundamento: art. 478 do CC + arts. 421/422 do CC + art. 300 do CPC
          </p>
        </button>

        <button
          onClick={() => setTipoDocumento("laudo")}
          className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${
            tipoDocumento === "laudo"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className={`h-4 w-4 ${tipoDocumento === "laudo" ? "text-primary" : "text-muted-foreground"}`} />
            <span className="font-semibold text-sm">Laudo Técnico-Jurídico</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Análise de encargos financeiros com memória de cálculo detalhada
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Inclui dados atualizados do BCB e jurisprudência com nº de processos
          </p>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="autor" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="autor">Autor</TabsTrigger>
            <TabsTrigger value="banco">Banco/Réu</TabsTrigger>
            <TabsTrigger value="contrato">Contrato</TabsTrigger>
            <TabsTrigger value="evento">Evento</TabsTrigger>
            <TabsTrigger value="advogado">Advogado</TabsTrigger>
          </TabsList>

          {/* Aba: Dados do Autor */}
          <TabsContent value="autor">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados do Autor (Produtor Rural)</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="nomeAutor">Nome Completo *</Label>
                  <Input id="nomeAutor" {...register("nomeAutor")} placeholder="Nome completo do produtor rural" />
                  {errors.nomeAutor && <p className="text-xs text-destructive mt-1">{errors.nomeAutor.message}</p>}
                </div>
                <div>
                  <Label htmlFor="nacionalidade">Nacionalidade</Label>
                  <Input id="nacionalidade" {...register("nacionalidade")} placeholder="brasileiro(a)" />
                </div>
                <div>
                  <Label htmlFor="estadoCivil">Estado Civil *</Label>
                  <Input id="estadoCivil" {...register("estadoCivil")} placeholder="casado(a), solteiro(a)..." />
                  {errors.estadoCivil && <p className="text-xs text-destructive mt-1">{errors.estadoCivil.message}</p>}
                </div>
                <div>
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input id="cpf" {...register("cpf")} placeholder="000.000.000-00" />
                  {errors.cpf && <p className="text-xs text-destructive mt-1">{errors.cpf.message}</p>}
                </div>
                <div>
                  <Label htmlFor="rg">RG</Label>
                  <Input id="rg" {...register("rg")} placeholder="Número do RG" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="endereco">Endereço Completo *</Label>
                  <Input id="endereco" {...register("endereco")} placeholder="Rua, número, bairro, cidade, UF, CEP" />
                  {errors.endereco && <p className="text-xs text-destructive mt-1">{errors.endereco.message}</p>}
                </div>
                <div>
                  <Label htmlFor="nomePropriedade">Nome da Propriedade Rural *</Label>
                  <Input id="nomePropriedade" {...register("nomePropriedade")} placeholder="Fazenda / Sítio / Chácara..." />
                  {errors.nomePropriedade && <p className="text-xs text-destructive mt-1">{errors.nomePropriedade.message}</p>}
                </div>
                <div>
                  <Label htmlFor="municipioPropriedade">Município da Propriedade *</Label>
                  <Input id="municipioPropriedade" {...register("municipioPropriedade")} placeholder="Município" />
                  {errors.municipioPropriedade && <p className="text-xs text-destructive mt-1">{errors.municipioPropriedade.message}</p>}
                </div>
                <div>
                  <Label htmlFor="uf">UF *</Label>
                  <Input id="uf" {...register("uf")} placeholder="MT" maxLength={2} className="uppercase" />
                  {errors.uf && <p className="text-xs text-destructive mt-1">{errors.uf.message}</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Dados do Banco */}
          <TabsContent value="banco">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados do Banco / Cooperativa de Crédito (Réu)</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="nomeBanco">Nome do Banco / Cooperativa *</Label>
                  <Input id="nomeBanco" {...register("nomeBanco")} placeholder="Banco do Brasil S.A. / Sicredi..." />
                  {errors.nomeBanco && <p className="text-xs text-destructive mt-1">{errors.nomeBanco.message}</p>}
                </div>
                <div>
                  <Label htmlFor="cnpjBanco">CNPJ *</Label>
                  <Input id="cnpjBanco" {...register("cnpjBanco")} placeholder="00.000.000/0000-00" />
                  {errors.cnpjBanco && <p className="text-xs text-destructive mt-1">{errors.cnpjBanco.message}</p>}
                </div>
                <div>
                  <Label htmlFor="enderecoBanco">Endereço da Sede</Label>
                  <Input id="enderecoBanco" {...register("enderecoBanco")} placeholder="Endereço da sede" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Dados do Contrato */}
          <TabsContent value="contrato">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados do Contrato de Crédito Rural</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numeroContrato">Número do Contrato *</Label>
                  <Input id="numeroContrato" {...register("numeroContrato")} placeholder="Nº do contrato" />
                  {errors.numeroContrato && <p className="text-xs text-destructive mt-1">{errors.numeroContrato.message}</p>}
                </div>
                <div>
                  <Label htmlFor="modalidade">Modalidade *</Label>
                  <Select onValueChange={(v) => setValue("modalidade", v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a modalidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custeio">Custeio</SelectItem>
                      <SelectItem value="investimento">Investimento</SelectItem>
                      <SelectItem value="comercializacao">Comercialização</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.modalidade && <p className="text-xs text-destructive mt-1">{errors.modalidade.message}</p>}
                </div>
                <div>
                  <Label htmlFor="dataContratacao">Data de Contratação *</Label>
                  <Input id="dataContratacao" type="date" {...register("dataContratacao")} />
                  {errors.dataContratacao && <p className="text-xs text-destructive mt-1">{errors.dataContratacao.message}</p>}
                </div>
                <div>
                  <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
                  <Input id="dataVencimento" type="date" {...register("dataVencimento")} />
                  {errors.dataVencimento && <p className="text-xs text-destructive mt-1">{errors.dataVencimento.message}</p>}
                </div>
                <div>
                  <Label htmlFor="valorCredito">Valor do Crédito (R$) *</Label>
                  <Input
                    id="valorCredito"
                    type="number"
                    step="0.01"
                    {...register("valorCredito", { valueAsNumber: true })}
                    placeholder="0,00"
                  />
                  {errors.valorCredito && <p className="text-xs text-destructive mt-1">{errors.valorCredito.message}</p>}
                </div>
                <div>
                  <Label htmlFor="cultura">Cultura *</Label>
                  <Input id="cultura" {...register("cultura")} placeholder="Soja, Milho, Café..." />
                  {errors.cultura && <p className="text-xs text-destructive mt-1">{errors.cultura.message}</p>}
                </div>
                <div>
                  <Label htmlFor="anoSafra">Ano da Safra *</Label>
                  <Input id="anoSafra" {...register("anoSafra")} placeholder="2023/2024" />
                  {errors.anoSafra && <p className="text-xs text-destructive mt-1">{errors.anoSafra.message}</p>}
                </div>
                <div>
                  <Label htmlFor="taxaJurosContratada">
                    Taxa de Juros Remuneratórios (% a.a.) *
                    {watch("taxaJurosContratada") > 12 && (
                      <Badge variant="destructive" className="ml-2 text-xs">Acima do limite legal (12%)</Badge>
                    )}
                  </Label>
                  <Input
                    id="taxaJurosContratada"
                    type="number"
                    step="0.01"
                    {...register("taxaJurosContratada", { valueAsNumber: true })}
                    placeholder="% ao ano"
                  />
                  {errors.taxaJurosContratada && <p className="text-xs text-destructive mt-1">{errors.taxaJurosContratada.message}</p>}
                </div>
                <div>
                  <Label htmlFor="taxaJurosMoraContratada">
                    Taxa de Juros de Mora (% a.a.)
                    {watch("taxaJurosMoraContratada") > 1 && (
                      <Badge variant="destructive" className="ml-2 text-xs">Acima do limite legal (1%)</Badge>
                    )}
                  </Label>
                  <Input
                    id="taxaJurosMoraContratada"
                    type="number"
                    step="0.01"
                    {...register("taxaJurosMoraContratada", { valueAsNumber: true })}
                    placeholder="1% ao ano (limite legal)"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="garantias">Garantias Pactuadas *</Label>
                  <Textarea
                    id="garantias"
                    {...register("garantias")}
                    placeholder="Descreva as garantias: penhor rural, hipoteca, alienação fiduciária, etc. com matrículas/registros"
                    rows={3}
                  />
                  {errors.garantias && <p className="text-xs text-destructive mt-1">{errors.garantias.message}</p>}
                </div>
                <Separator className="md:col-span-2" />
                <div className="md:col-span-2">
                  <p className="text-xs text-muted-foreground font-medium mb-3">Dados do Cálculo (opcional — preencha se já realizou o cálculo TCR)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Saldo Devedor Atual (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register("saldoDevedor", { valueAsNumber: true })}
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Saldo Revisado — Taxas Legais (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register("saldoDevedorRevisado", { valueAsNumber: true })}
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Excesso Cobrado (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register("excessoJuros", { valueAsNumber: true })}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Evento */}
          <TabsContent value="evento">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evento que Motivou a Revisão</CardTitle>
                <p className="text-xs text-muted-foreground">Descreva o evento climático ou fato que tornou a obrigação excessivamente onerosa</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tipoEvento">Tipo do Evento *</Label>
                  <Input
                    id="tipoEvento"
                    {...register("tipoEvento")}
                    placeholder="Ex: Estiagem prolongada, Excesso pluviométrico, Geada, Granizo..."
                  />
                  {errors.tipoEvento && <p className="text-xs text-destructive mt-1">{errors.tipoEvento.message}</p>}
                </div>
                <div>
                  <Label htmlFor="descricaoEvento">Descrição Detalhada do Evento *</Label>
                  <Textarea
                    id="descricaoEvento"
                    {...register("descricaoEvento")}
                    placeholder="Descreva detalhadamente o evento: período de ocorrência, intensidade, área afetada, percentual de perda da produção, documentos comprobatórios disponíveis (laudo EMATER, boletim agrometeorológico, etc.)"
                    rows={5}
                  />
                  {errors.descricaoEvento && <p className="text-xs text-destructive mt-1">{errors.descricaoEvento.message}</p>}
                </div>
                <div>
                  <Label htmlFor="dataComunicacaoBanco">Data da Comunicação ao Banco *</Label>
                  <Input id="dataComunicacaoBanco" type="date" {...register("dataComunicacaoBanco")} />
                  {errors.dataComunicacaoBanco && <p className="text-xs text-destructive mt-1">{errors.dataComunicacaoBanco.message}</p>}
                </div>
                <div>
                  <Label htmlFor="descricaoPropostaRenegociacao">Proposta de Renegociação do Banco *</Label>
                  <Textarea
                    id="descricaoPropostaRenegociacao"
                    {...register("descricaoPropostaRenegociacao")}
                    placeholder="Descreva os termos da proposta do banco (se abusiva) ou informe a ausência de qualquer proposta ou resposta por parte da instituição financeira"
                    rows={4}
                  />
                  {errors.descricaoPropostaRenegociacao && <p className="text-xs text-destructive mt-1">{errors.descricaoPropostaRenegociacao.message}</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Advogado */}
          <TabsContent value="advogado">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Dados do Advogado e Foro</CardTitle>
                  {perfilAdvogado && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                      <UserCheck className="h-3.5 w-3.5" />
                      Perfil carregado automaticamente
                    </div>
                  )}
                </div>
                {!perfilAdvogado && (
                  <p className="text-xs text-amber-600 mt-1">
                    Cadastre seu perfil em <strong>Perfil Profissional</strong> para preencher estes campos automaticamente.
                  </p>
                )}
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nomeAdvogado">Nome do Advogado *</Label>
                  <Input id="nomeAdvogado" {...register("nomeAdvogado")} placeholder="Nome completo" />
                  {errors.nomeAdvogado && <p className="text-xs text-destructive mt-1">{errors.nomeAdvogado.message}</p>}
                </div>
                <div>
                  <Label htmlFor="oab">OAB/UF nº *</Label>
                  <Input id="oab" {...register("oab")} placeholder="Ex: OAB/MT nº 12.345" />
                  {errors.oab && <p className="text-xs text-destructive mt-1">{errors.oab.message}</p>}
                </div>
                <div>
                  <Label htmlFor="telefoneAdvogado">Telefone</Label>
                  <Input id="telefoneAdvogado" {...register("telefoneAdvogado")} placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <Label htmlFor="emailAdvogado">E-mail</Label>
                  <Input id="emailAdvogado" {...register("emailAdvogado")} placeholder="advogado@escritorio.com.br" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="enderecoEscritorio">Endereço do Escritório *</Label>
                  <Input id="enderecoEscritorio" {...register("enderecoEscritorio")} placeholder="Endereço completo do escritório" />
                  {errors.enderecoEscritorio && <p className="text-xs text-destructive mt-1">{errors.enderecoEscritorio.message}</p>}
                </div>
                <div>
                  <Label htmlFor="comarca">Comarca *</Label>
                  <Input id="comarca" {...register("comarca")} placeholder="Comarca onde será distribuída" />
                  {errors.comarca && <p className="text-xs text-destructive mt-1">{errors.comarca.message}</p>}
                </div>
                <div>
                  <Label htmlFor="vara">Vara (se conhecida)</Label>
                  <Input id="vara" {...register("vara")} placeholder="Ex: 1ª Vara Cível" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Alertas de conformidade em tempo real */}
        {(watch("taxaJurosContratada") > 12 || watch("taxaJurosMoraContratada") > 1) && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm text-destructive">
              <p className="font-semibold">Encargos acima dos limites legais detectados:</p>
              {watch("taxaJurosContratada") > 12 && (
                <p>• Juros remuneratórios: {watch("taxaJurosContratada")}% a.a. — Limite: 12% a.a. (Decreto nº 22.626/33 + Súmula 382/STJ)</p>
              )}
              {watch("taxaJurosMoraContratada") > 1 && (
                <p>• Juros de mora: {watch("taxaJurosMoraContratada")}% a.a. — Limite: 1% a.a. (Decreto-Lei nº 167/67, art. 5º)</p>
              )}
            </div>
          </div>
        )}

        <Button type="submit" disabled={isLoading} className="w-full gap-2 h-12 text-base">
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Gerando {tipoDocumento === "peticao" ? "Petição" : "Laudo"} com IA...
            </>
          ) : (
            <>
              <FileText className="h-5 w-5" />
              Gerar {tipoDocumento === "peticao" ? "Petição de Revisão Contratual" : "Laudo Técnico-Jurídico"}
            </>
          )}
        </Button>
      </form>

      {/* Resultado */}
      {resultado && (
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-base text-green-700">Documento Gerado com Sucesso</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">{resultado.titulo}</p>
                <p className="text-xs text-muted-foreground">Emitido em: {resultado.dataEmissao}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={handleCopiar} className="gap-1">
                  {copiado ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  {copiado ? "Copiado!" : "Copiar"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleImprimir} className="gap-1">
                  <Download className="h-4 w-4" />
                  Imprimir / PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white border rounded-lg p-6 font-serif text-sm leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto text-foreground">
              {resultado.textoCompleto}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
