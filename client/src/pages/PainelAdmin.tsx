import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Users, BarChart3, CreditCard, FileText, Shield,
  TrendingUp, RefreshCw, Edit2, Check, X, AlertCircle,
  Crown, Star, Zap, UserCheck, Calendar, Activity
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ────────────────────────────────────────────────────────────────

const PLANO_LABEL: Record<string, string> = {
  standard: "Standard",
  premium: "Premium",
  supreme: "Supreme",
  admin: "Admin",
};

const PLANO_COR: Record<string, string> = {
  standard: "bg-slate-100 text-slate-700",
  premium: "bg-amber-100 text-amber-700",
  supreme: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
};

const PLANO_ICONE: Record<string, React.ReactNode> = {
  standard: <Zap className="h-3 w-3" />,
  premium: <Star className="h-3 w-3" />,
  supreme: <Crown className="h-3 w-3" />,
  admin: <Shield className="h-3 w-3" />,
};

const PRECOS: Record<string, number> = {
  standard: 149,
  premium: 329,
  supreme: 1990,
  admin: 0,
};

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function formatMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Badge de Plano ─────────────────────────────────────────────────────────

function PlanoBadge({ plano }: { plano: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${PLANO_COR[plano] ?? "bg-gray-100 text-gray-700"}`}>
      {PLANO_ICONE[plano]}
      {PLANO_LABEL[plano] ?? plano}
    </span>
  );
}

// ─── Card de Estatística ────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, cor }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  cor?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cor ?? "bg-primary/10"}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Modal de Edição de Plano ───────────────────────────────────────────────

function ModalEditarPlano({
  usuario,
  onClose,
  onSave,
}: {
  usuario: { id: number; name: string | null; plano: string };
  onClose: () => void;
  onSave: (plano: string, expiracao: string) => void;
}) {
  const [plano, setPlano] = useState(usuario.plano);
  const [expiracao, setExpiracao] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900">Alterar Plano</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Usuário: <strong>{usuario.name ?? "Sem nome"}</strong>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Novo Plano</label>
            <div className="grid grid-cols-2 gap-2">
              {["standard", "premium", "supreme", "admin"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlano(p)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    plano === p
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {PLANO_ICONE[p]}
                  {PLANO_LABEL[p]}
                  {PRECOS[p] > 0 && (
                    <span className="ml-auto text-xs text-slate-400">
                      R$ {PRECOS[p]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data de Expiração <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              type="date"
              value={expiracao}
              onChange={(e) => setExpiracao(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(plano, expiracao ? new Date(expiracao).toISOString() : "")}
            className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal ────────────────────────────────────────────────────

export default function PainelAdmin() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [aba, setAba] = useState<"visao" | "clientes" | "assinaturas">("visao");
  const [usuarioEditando, setUsuarioEditando] = useState<{ id: number; name: string | null; plano: string } | null>(null);
  const [busca, setBusca] = useState("");

  const { data: verificacao } = trpc.admin.verificar.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: stats, refetch: refetchStats } = trpc.admin.estatisticas.useQuery(undefined, {
    enabled: !!verificacao?.isAdmin,
  });

  const { data: usuarios, refetch: refetchUsuarios } = trpc.admin.listarUsuarios.useQuery(undefined, {
    enabled: !!verificacao?.isAdmin,
  });

  const alterarPlano = trpc.admin.alterarPlano.useMutation({
    onSuccess: () => {
      toast.success("Plano alterado com sucesso!");
      setUsuarioEditando(null);
      refetchUsuarios();
      refetchStats();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetarLaudos = trpc.admin.resetarLaudos.useMutation({
    onSuccess: () => {
      toast.success("Contador de laudos resetado!");
      refetchUsuarios();
      refetchStats();
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !verificacao?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <Shield className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Acesso Restrito</h2>
        <p className="text-slate-500 text-sm">Esta área é exclusiva para administradores do sistema.</p>
        <button
          onClick={() => navigate("/app")}
          className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  const usuariosFiltrados = (usuarios ?? []).filter((u) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return (
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      u.plano.toLowerCase().includes(q)
    );
  });

  // Receita por plano
  const receitaPorPlano = (stats?.porPlano ?? []).map((r) => ({
    ...r,
    receita: r.count * (PRECOS[r.plano as string] ?? 0),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Painel Administrativo
          </h1>
          <p className="text-slate-500 text-sm mt-1">JurosRurais.pro — Gestão de clientes e assinaturas</p>
        </div>
        <button
          onClick={() => { refetchStats(); refetchUsuarios(); }}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-8 w-fit">
        {[
          { id: "visao", label: "Visão Geral", icon: <BarChart3 className="h-4 w-4" /> },
          { id: "clientes", label: "Clientes", icon: <Users className="h-4 w-4" /> },
          { id: "assinaturas", label: "Assinaturas", icon: <CreditCard className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAba(tab.id as typeof aba)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              aba === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── ABA: VISÃO GERAL ─── */}
      {aba === "visao" && (
        <div className="space-y-6">

          {/* Cards de métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Users className="h-5 w-5 text-primary" />}
              label="Total de Clientes"
              value={stats?.totalUsuarios ?? "—"}
              sub="usuários cadastrados"
              cor="bg-primary/10"
            />
            <StatCard
              icon={<FileText className="h-5 w-5 text-emerald-600" />}
              label="Laudos Gerados"
              value={stats?.totalLaudos ?? "—"}
              sub={`${stats?.laudosMes ?? 0} este mês`}
              cor="bg-emerald-100"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5 text-amber-600" />}
              label="Receita Estimada"
              value={stats ? formatMoeda(stats.receitaEstimadaReais) : "—"}
              sub="mensal recorrente"
              cor="bg-amber-100"
            />
            <StatCard
              icon={<Activity className="h-5 w-5 text-purple-600" />}
              label="Laudos este Mês"
              value={stats?.laudosMes ?? "—"}
              sub="gerados no período"
              cor="bg-purple-100"
            />
          </div>

          {/* Distribuição por plano */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-400" />
                Distribuição por Plano
              </h3>
              <div className="space-y-3">
                {(stats?.porPlano ?? []).map((row) => {
                  const total = stats?.totalUsuarios ?? 1;
                  const pct = Math.round((row.count / total) * 100);
                  return (
                    <div key={row.plano}>
                      <div className="flex items-center justify-between mb-1">
                        <PlanoBadge plano={row.plano} />
                        <span className="text-sm font-semibold text-slate-700">{row.count} usuários</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            row.plano === 'supreme' ? 'bg-purple-500' :
                            row.plano === 'premium' ? 'bg-amber-500' :
                            row.plano === 'admin' ? 'bg-red-500' : 'bg-primary'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                Receita por Plano (estimada)
              </h3>
              <div className="space-y-3">
                {receitaPorPlano.filter(r => r.receita > 0).map((row) => (
                  <div key={row.plano} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <PlanoBadge plano={row.plano} />
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{formatMoeda(row.receita)}</p>
                      <p className="text-xs text-slate-400">{row.count} × {formatMoeda(PRECOS[row.plano] ?? 0)}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-bold text-slate-700">Total MRR</span>
                  <span className="text-base font-black text-emerald-600">
                    {formatMoeda(stats?.receitaEstimadaReais ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Últimos cadastros */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-slate-400" />
              Últimos Cadastros
            </h3>
            <div className="space-y-3">
              {(stats?.ultimosCadastros ?? []).map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {(u.name ?? "?")[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{u.name ?? "Sem nome"}</p>
                      <p className="text-xs text-slate-400">{u.email ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <PlanoBadge plano={u.plano} />
                    <span className="text-xs text-slate-400">{formatDate(u.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── ABA: CLIENTES ─── */}
      {aba === "clientes" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou plano..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <span className="text-sm text-slate-400">{usuariosFiltrados.length} resultado(s)</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Usuário</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plano</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Laudos</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cadastro</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Último Acesso</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {(u.name ?? "?")[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{u.name ?? "Sem nome"}</p>
                          <p className="text-xs text-slate-400">{u.email ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PlanoBadge plano={u.plano} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-slate-700">{u.calculosRealizados}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(u.lastSignedIn)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setUsuarioEditando({ id: u.id, name: u.name, plano: u.plano })}
                          title="Alterar plano"
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Resetar laudos de ${u.name ?? "este usuário"}?`)) {
                              resetarLaudos.mutate({ userId: u.id });
                            }
                          }}
                          title="Resetar laudos"
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {usuariosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ABA: ASSINATURAS ─── */}
      {aba === "assinaturas" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            {["standard", "premium", "supreme"].map((p) => {
              const count = stats?.porPlano.find(r => r.plano === p)?.count ?? 0;
              return (
                <div key={p} className={`rounded-xl border-2 p-5 ${
                  p === 'supreme' ? 'border-purple-200 bg-purple-50' :
                  p === 'premium' ? 'border-amber-200 bg-amber-50' :
                  'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <PlanoBadge plano={p} />
                    <span className="text-2xl font-black text-slate-900">{count}</span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">{PLANO_LABEL[p]}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatMoeda(PRECOS[p] ?? 0)}/mês por usuário</p>
                  <p className="text-sm font-bold text-emerald-600 mt-2">{formatMoeda(count * (PRECOS[p] ?? 0))}/mês</p>
                </div>
              );
            })}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Gestão Manual de Assinaturas</p>
              <p className="text-sm text-amber-700 mt-1">
                Para ativar ou alterar o plano de um cliente após o pagamento, acesse a aba <strong>Clientes</strong> e clique no ícone de edição ao lado do usuário. A integração com gateway de pagamento (Stripe) pode ser adicionada futuramente.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              Assinaturas com Expiração Próxima
            </h3>
            {(usuarios ?? []).filter(u => u.planoExpiracao).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhuma assinatura com data de expiração cadastrada.</p>
            ) : (
              <div className="space-y-2">
                {(usuarios ?? [])
                  .filter(u => u.planoExpiracao)
                  .sort((a, b) => new Date(a.planoExpiracao!).getTime() - new Date(b.planoExpiracao!).getTime())
                  .map(u => (
                    <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{u.name ?? "Sem nome"}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <PlanoBadge plano={u.plano} />
                        <span className="text-xs font-semibold text-red-600">
                          Expira: {formatDate(u.planoExpiracao)}
                        </span>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {usuarioEditando && (
        <ModalEditarPlano
          usuario={usuarioEditando}
          onClose={() => setUsuarioEditando(null)}
          onSave={(plano, expiracao) => {
            alterarPlano.mutate({
              userId: usuarioEditando.id,
              plano: plano as "standard" | "premium" | "supreme" | "admin",
              expiracao: expiracao || undefined,
            });
          }}
        />
      )}
    </div>
  );
}
