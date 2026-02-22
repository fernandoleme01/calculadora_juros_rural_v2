import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Scale,
  Calculator,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const schemaAdvogado = z.object({
  nome: z.string().min(3, "Nome obrigatório (mínimo 3 caracteres)"),
  oab: z.string().min(3, "Número da OAB obrigatório (ex: OAB/SP 123.456)"),
  cpf: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  escritorio: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  cep: z.string().optional(),
});

const schemaPerito = z.object({
  nome: z.string().min(3, "Nome obrigatório (mínimo 3 caracteres)"),
  categoria: z.enum(["contador", "economista", "administrador", "tecnico_contabil", "outro"]),
  registroProfissional: z.string().min(3, "Registro profissional obrigatório (ex: CRC/SP 123456)"),
  cpf: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  empresa: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  cep: z.string().optional(),
});

type FormAdvogado = z.infer<typeof schemaAdvogado>;
type FormPerito = z.infer<typeof schemaPerito>;

// ─── Labels de categoria ─────────────────────────────────────────────────────

const CATEGORIAS = [
  { value: "contador", label: "Contador", registro: "CRC" },
  { value: "economista", label: "Economista", registro: "CORECON" },
  { value: "administrador", label: "Administrador de Empresas", registro: "CRA" },
  { value: "tecnico_contabil", label: "Técnico em Contabilidade", registro: "CRC" },
  { value: "outro", label: "Outro Profissional", registro: "Registro" },
];

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function PerfilProfissional() {
  // ── Perfil do Advogado ──
  const { data: dadosAdvogado, isLoading: loadingAdv } = trpc.perfil.buscarAdvogado.useQuery();
  const salvarAdv = trpc.perfil.salvarAdvogado.useMutation({
    onSuccess: () => toast.success("Perfil do advogado salvo com sucesso!"),
    onError: (e) => toast.error("Erro ao salvar: " + e.message),
  });

  const formAdv = useForm<FormAdvogado>({
    resolver: zodResolver(schemaAdvogado),
    defaultValues: {
      nome: "", oab: "", cpf: "", email: "", telefone: "",
      escritorio: "", endereco: "", cidade: "", estado: "", cep: "",
    },
  });

  useEffect(() => {
    if (dadosAdvogado) {
      formAdv.reset({
        nome: dadosAdvogado.nome ?? "",
        oab: dadosAdvogado.oab ?? "",
        cpf: dadosAdvogado.cpf ?? "",
        email: dadosAdvogado.email ?? "",
        telefone: dadosAdvogado.telefone ?? "",
        escritorio: dadosAdvogado.escritorio ?? "",
        endereco: dadosAdvogado.endereco ?? "",
        cidade: dadosAdvogado.cidade ?? "",
        estado: dadosAdvogado.estado ?? "",
        cep: dadosAdvogado.cep ?? "",
      });
    }
  }, [dadosAdvogado]);

  // ── Perfil do Perito ──
  const { data: dadosPerito, isLoading: loadingPerito } = trpc.perfil.buscarPerito.useQuery();
  const salvarPerito = trpc.perfil.salvarPerito.useMutation({
    onSuccess: () => toast.success("Perfil do perito técnico salvo com sucesso!"),
    onError: (e) => toast.error("Erro ao salvar: " + e.message),
  });

  const formPerito = useForm<FormPerito>({
    resolver: zodResolver(schemaPerito),
    defaultValues: {
      nome: "", categoria: "contador", registroProfissional: "",
      cpf: "", email: "", telefone: "", empresa: "",
      endereco: "", cidade: "", estado: "", cep: "",
    },
  });

  useEffect(() => {
    if (dadosPerito) {
      formPerito.reset({
        nome: dadosPerito.nome ?? "",
        categoria: (dadosPerito.categoria as FormPerito["categoria"]) ?? "contador",
        registroProfissional: dadosPerito.registroProfissional ?? "",
        cpf: dadosPerito.cpf ?? "",
        email: dadosPerito.email ?? "",
        telefone: dadosPerito.telefone ?? "",
        empresa: dadosPerito.empresa ?? "",
        endereco: dadosPerito.endereco ?? "",
        cidade: dadosPerito.cidade ?? "",
        estado: dadosPerito.estado ?? "",
        cep: dadosPerito.cep ?? "",
      });
    }
  }, [dadosPerito]);

  const categoriaAtual = formPerito.watch("categoria");
  const registroLabel = CATEGORIAS.find(c => c.value === categoriaAtual)?.registro ?? "Registro";

  return (
    <div className="container max-w-4xl py-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Perfil Profissional</h1>
        <p className="mt-2 text-muted-foreground">
          Cadastre os dados dos profissionais que assinarão os documentos gerados pelo sistema.
          Esses dados serão inseridos automaticamente nos laudos e petições.
        </p>
      </div>

      {/* Aviso informativo */}
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold">Dois perfis distintos por função</p>
            <p className="mt-1">
              O <strong>Advogado</strong> assina as <strong>Petições de Revisão Contratual</strong> (requer número da OAB).
              O <strong>Perito Técnico</strong> assina os <strong>Laudos Técnico-Jurídicos</strong> e pode ser contador,
              economista, administrador ou técnico em contabilidade.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="advogado">
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="advogado" className="gap-2">
            <Scale className="h-4 w-4" />
            Advogado — Petição
            {dadosAdvogado && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="perito" className="gap-2">
            <Calculator className="h-4 w-4" />
            Perito Técnico — Laudo
            {dadosPerito && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
          </TabsTrigger>
        </TabsList>

        {/* ── Aba Advogado ── */}
        <TabsContent value="advogado">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-primary" />
                    Dados do Advogado
                  </CardTitle>
                  <CardDescription>
                    Estes dados serão inseridos automaticamente nas petições de revisão contratual geradas pelo sistema.
                  </CardDescription>
                </div>
                {dadosAdvogado && (
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Cadastrado
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingAdv ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  Carregando perfil...
                </div>
              ) : (
                <form onSubmit={formAdv.handleSubmit((data) => salvarAdv.mutate(data))} className="space-y-6">
                  {/* Dados pessoais */}
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      <User className="h-4 w-4" /> Dados Pessoais e Profissionais
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="adv-nome">Nome Completo *</Label>
                        <Input id="adv-nome" placeholder="Dr. João da Silva" {...formAdv.register("nome")} />
                        {formAdv.formState.errors.nome && (
                          <p className="text-xs text-destructive">{formAdv.formState.errors.nome.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="adv-oab">Número da OAB *</Label>
                        <Input id="adv-oab" placeholder="OAB/SP 123.456" {...formAdv.register("oab")} />
                        {formAdv.formState.errors.oab && (
                          <p className="text-xs text-destructive">{formAdv.formState.errors.oab.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="adv-cpf">CPF</Label>
                        <Input id="adv-cpf" placeholder="000.000.000-00" {...formAdv.register("cpf")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="adv-escritorio">Escritório / Sociedade</Label>
                        <Input id="adv-escritorio" placeholder="Silva & Associados Advogados" {...formAdv.register("escritorio")} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contato */}
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      <Phone className="h-4 w-4" /> Contato
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="adv-email">
                          <Mail className="mr-1 inline h-3.5 w-3.5" /> E-mail
                        </Label>
                        <Input id="adv-email" type="email" placeholder="joao@escritorio.com.br" {...formAdv.register("email")} />
                        {formAdv.formState.errors.email && (
                          <p className="text-xs text-destructive">{formAdv.formState.errors.email.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="adv-telefone">Telefone / WhatsApp</Label>
                        <Input id="adv-telefone" placeholder="(11) 99999-9999" {...formAdv.register("telefone")} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Endereço */}
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      <MapPin className="h-4 w-4" /> Endereço Profissional
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="adv-endereco">Logradouro</Label>
                        <Input id="adv-endereco" placeholder="Rua das Flores, 123, sala 45" {...formAdv.register("endereco")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="adv-cidade">Cidade</Label>
                        <Input id="adv-cidade" placeholder="São Paulo" {...formAdv.register("cidade")} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="adv-estado">UF</Label>
                          <Input id="adv-estado" placeholder="SP" maxLength={2} {...formAdv.register("estado")} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="adv-cep">CEP</Label>
                          <Input id="adv-cep" placeholder="00000-000" {...formAdv.register("cep")} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={salvarAdv.isPending} className="gap-2">
                      <FileText className="h-4 w-4" />
                      {salvarAdv.isPending ? "Salvando..." : "Salvar Perfil do Advogado"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Aba Perito Técnico ── */}
        <TabsContent value="perito">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Dados do Perito Técnico
                  </CardTitle>
                  <CardDescription>
                    Estes dados serão inseridos automaticamente nos laudos técnico-jurídicos gerados pelo sistema.
                    O perito pode ser contador, economista, administrador ou técnico em contabilidade.
                  </CardDescription>
                </div>
                {dadosPerito && (
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Cadastrado
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingPerito ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  Carregando perfil...
                </div>
              ) : (
                <form onSubmit={formPerito.handleSubmit((data) => salvarPerito.mutate(data))} className="space-y-6">
                  {/* Dados profissionais */}
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      <User className="h-4 w-4" /> Dados Profissionais
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="per-nome">Nome Completo *</Label>
                        <Input id="per-nome" placeholder="Maria Oliveira" {...formPerito.register("nome")} />
                        {formPerito.formState.errors.nome && (
                          <p className="text-xs text-destructive">{formPerito.formState.errors.nome.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="per-categoria">Categoria Profissional *</Label>
                        <Select
                          value={formPerito.watch("categoria")}
                          onValueChange={(v) => formPerito.setValue("categoria", v as FormPerito["categoria"])}
                        >
                          <SelectTrigger id="per-categoria">
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIAS.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formPerito.formState.errors.categoria && (
                          <p className="text-xs text-destructive">{formPerito.formState.errors.categoria.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="per-registro">
                          Registro {registroLabel} *
                        </Label>
                        <Input
                          id="per-registro"
                          placeholder={`${registroLabel}/SP 123456`}
                          {...formPerito.register("registroProfissional")}
                        />
                        {formPerito.formState.errors.registroProfissional && (
                          <p className="text-xs text-destructive">{formPerito.formState.errors.registroProfissional.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="per-cpf">CPF</Label>
                        <Input id="per-cpf" placeholder="000.000.000-00" {...formPerito.register("cpf")} />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="per-empresa">
                          <Building2 className="mr-1 inline h-3.5 w-3.5" /> Empresa / Escritório
                        </Label>
                        <Input id="per-empresa" placeholder="Oliveira Contabilidade" {...formPerito.register("empresa")} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contato */}
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      <Phone className="h-4 w-4" /> Contato
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="per-email">
                          <Mail className="mr-1 inline h-3.5 w-3.5" /> E-mail
                        </Label>
                        <Input id="per-email" type="email" placeholder="maria@contabilidade.com.br" {...formPerito.register("email")} />
                        {formPerito.formState.errors.email && (
                          <p className="text-xs text-destructive">{formPerito.formState.errors.email.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="per-telefone">Telefone / WhatsApp</Label>
                        <Input id="per-telefone" placeholder="(11) 99999-9999" {...formPerito.register("telefone")} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Endereço */}
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      <MapPin className="h-4 w-4" /> Endereço Profissional
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="per-endereco">Logradouro</Label>
                        <Input id="per-endereco" placeholder="Av. Paulista, 1000, sala 12" {...formPerito.register("endereco")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="per-cidade">Cidade</Label>
                        <Input id="per-cidade" placeholder="São Paulo" {...formPerito.register("cidade")} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="per-estado">UF</Label>
                          <Input id="per-estado" placeholder="SP" maxLength={2} {...formPerito.register("estado")} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="per-cep">CEP</Label>
                          <Input id="per-cep" placeholder="00000-000" {...formPerito.register("cep")} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={salvarPerito.isPending} className="gap-2">
                      <FileText className="h-4 w-4" />
                      {salvarPerito.isPending ? "Salvando..." : "Salvar Perfil do Perito"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
