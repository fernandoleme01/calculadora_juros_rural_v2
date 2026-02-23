import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  Calculator, FileSearch, Gavel, Landmark, Scale, BookOpen,
  CheckCircle, ArrowRight, Shield, Zap, BarChart3, FileText,
  ChevronRight, Star, AlertTriangle, TrendingDown, ToggleLeft, ToggleRight, X
} from "lucide-react";

// ─── Constantes ───────────────────────────────────────────────────────────────

const PLANOS = [
  {
    nome: "Free",
    preco: "R$ 0",
    periodo: "",
    descricao: "Experimente sem compromisso",
    laudos: "1 laudo total",
    destaque: false,
    corBadge: "bg-emerald-100 text-emerald-700",
    features: [
      "1 laudo técnico-jurídico (vitalício)",
      "Calculadora TCR pré e pós-fixada",
      "Análise de contratos PDF (OCR + IA)",
      "Dados do Banco Central em tempo real",
      "Validação de limites legais",
      "Histórico de cálculos",
    ],
    restricoes: [
      "Sem exportação em PDF",
      "Sem impressão de laudos",
      "Apenas 1 laudo no total",
    ],
  },
  {
    nome: "Standard",
    preco: "R$ 149",
    periodo: "/mês",
    descricao: "Para advogados que estão começando",
    laudos: "10 laudos/mês",
    destaque: false,
    corBadge: "bg-slate-100 text-slate-700",
    features: [
      "10 laudos técnico-jurídicos por mês",
      "Calculadora TCR pré e pós-fixada",
      "Análise de contratos PDF (OCR + IA)",
      "Gerador de Petição de Revisão Contratual",
      "Validação de limites legais (12% a.a.)",
      "Dados do Banco Central em tempo real",
      "Exportação de laudos em PDF",
      "Histórico de cálculos",
    ],
  },
  {
    nome: "Premium",
    preco: "R$ 329",
    periodo: "/mês",
    descricao: "Para escritórios em crescimento",
    laudos: "25 laudos/mês",
    destaque: true,
    corBadge: "bg-amber-100 text-amber-700",
    features: [
      "25 laudos técnico-jurídicos por mês",
      "Tudo do plano Standard",
      "Jurisprudência real com nº de processos",
      "Análise comparativa de cenários",
      "Relatórios avançados de conformidade",
      "Suporte prioritário",
      "Acesso antecipado a novas funcionalidades",
    ],
  },
  {
    nome: "Supreme",
    preco: "R$ 1.990",
    periodo: "/mês",
    descricao: "Para grandes escritórios e departamentos jurídicos",
    laudos: "Laudos ilimitados",
    destaque: false,
    corBadge: "bg-purple-100 text-purple-700",
    features: [
      "Laudos ilimitados por mês",
      "Tudo do plano Premium",
      "Múltiplos usuários (até 10 assentos)",
      "API de integração com sistemas externos",
      "Personalização de modelos de petição",
      "Treinamento e onboarding dedicado",
      "SLA com suporte em até 4 horas",
      "Relatórios gerenciais consolidados",
    ],
  },
];

const FUNCIONALIDADES = [
  {
    icon: Calculator,
    titulo: "Calculadora TCR",
    desc: "Calcule a Taxa de Custo Real pré e pós-fixada com base em IPCA, LTN/NTN-F e parâmetros do MCR. Validação automática dos limites legais.",
    badge: "Free",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: FileSearch,
    titulo: "Análise de Contratos PDF",
    desc: "Envie o contrato em PDF e a IA extrai automaticamente todas as cláusulas financeiras, taxas e encargos, identificando abusividades.",
    badge: "Pro",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    icon: Gavel,
    titulo: "Gerador de Petição",
    desc: "Gere automaticamente a Petição Inicial de Revisão Contratual c/c Tutela de Urgência, fundamentada em legislação e jurisprudência reais.",
    badge: "Pro",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    icon: FileText,
    titulo: "Laudo Técnico-Jurídico",
    desc: "Laudo completo com memória de cálculo passo a passo, fundamentação legal (Lei 4.829/65, DL 167/67) e jurisprudência do STJ com nº de processos.",
    badge: "Pro",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    icon: Landmark,
    titulo: "Dados do Banco Central",
    desc: "SELIC, IPCA, PTAX e taxas médias de crédito rural atualizados em tempo real via API oficial do BCB. Séries históricas completas.",
    badge: "Free",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Scale,
    titulo: "Conformidade Legal",
    desc: "Verificação automática se as taxas pactuadas respeitam os limites do CMN, Decreto nº 22.626/33 e jurisprudência consolidada do STJ.",
    badge: "Free",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
];

const JURISPRUDENCIAS = [
  {
    tribunal: "STJ",
    numero: "Súmula 382",
    texto: "A estipulação de juros remuneratórios superiores a 12% ao ano, por si só, não indica abusividade. Contudo, nas cédulas de crédito rural, o limite de 12% a.a. é aplicável quando o CMN não fixar taxa.",
  },
  {
    tribunal: "STJ",
    numero: "REsp 1.509.057/RS",
    texto: "Os juros de mora nas cédulas de crédito rural são limitados a 1% ao ano, nos termos do art. 5º, parágrafo único, do Decreto-Lei nº 167/67.",
  },
  {
    tribunal: "STJ",
    numero: "REsp 1.857.852/SP",
    texto: "A perda da safra por evento climático imprevisível configura onerosidade excessiva, autorizando a revisão das condições contratuais com fundamento no art. 478 do Código Civil.",
  },
];

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [anual, setAnual] = useState(false);

  // Calcula o preço com desconto de 25% para plano anual
  const calcPreco = (mensal: number) => {
    if (!anual) return mensal;
    return Math.floor(mensal * 0.75);
  };

  // Usuários autenticados podem ver a landing page normalmente
  // O redirecionamento automático foi removido para que a landing page
  // seja sempre exibida ao acessar "/", independente do estado de autenticação

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-white font-sans text-foreground">

      {/* ─── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Scale className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">
              JurosRurais<span className="text-primary">.pro</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
            <a href="#jurisprudencia" className="hover:text-foreground transition-colors">Jurisprudência</a>
          </div>
          {isAuthenticated ? (
            <button
              onClick={() => navigate("/app")}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Acessar o Sistema
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Entrar / Cadastrar
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-primary/90 text-white">
        {/* Padrão de fundo sutil */}
        <div className="absolute inset-0 opacity-5"
          style={{backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px"}}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
              <Shield className="h-3.5 w-3.5 text-amber-400" />
              <span>Em conformidade com a Lei 4.829/65 · DL 167/67 · Resoluções CMN · Manual de Crédito Rural · Jurisprudências</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{fontFamily: "Merriweather, serif"}}>
              Calcule juros de<br />
              <span className="text-amber-400">crédito rural</span><br />
              com precisão jurídica
            </h1>

            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl leading-relaxed">
              Plataforma técnico-jurídica para advogados e produtores rurais. Calcule a TCR, analise contratos, identifique abusividades e gere petições de revisão contratual — tudo fundamentado em legislação e jurisprudência reais do STJ.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={isAuthenticated ? () => navigate("/app") : handleLogin}
                className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold px-8 py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                {isAuthenticated ? "Acessar o Sistema" : "Começar gratuitamente"}
                <ArrowRight className="h-5 w-5" />
              </button>
              <a
                href="#funcionalidades"
                className="border border-white/30 hover:border-white/60 text-white px-8 py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
              >
                Ver funcionalidades
                <ChevronRight className="h-5 w-5" />
              </a>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white/10">
              <div>
                <p className="text-2xl font-bold text-white">12% a.a.</p>
                <p className="text-sm text-slate-400">Limite legal juros remuneratórios</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">1% a.a.</p>
                <p className="text-sm text-slate-400">Limite legal juros de mora</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">56+</p>
                <p className="text-sm text-slate-400">Testes automatizados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">BCB</p>
                <p className="text-sm text-slate-400">Dados em tempo real</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ALERTA JURÍDICO ─────────────────────────────────────────────────── */}
      <section className="bg-amber-50 border-y border-amber-200 py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>Atenção:</strong> Contratos de crédito rural com juros remuneratórios acima de 12% a.a. (quando o CMN não fixar taxa) e juros de mora acima de 1% a.a. são passíveis de revisão judicial. Verifique seu contrato agora.
          </p>
        </div>
      </section>

      {/* ─── FUNCIONALIDADES ─────────────────────────────────────────────────── */}
      <section id="funcionalidades" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{fontFamily: "Merriweather, serif"}}>
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Da análise do contrato à petição inicial — um fluxo de trabalho completo para advogados que atuam em crédito rural.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FUNCIONALIDADES.map((f) => (
              <div key={f.titulo} className="p-6 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${f.badgeColor}`}>
                    {f.badge}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.titulo}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMO FUNCIONA ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{fontFamily: "Merriweather, serif"}}>
              Fluxo de trabalho completo
            </h2>
            <p className="text-muted-foreground text-lg">Do contrato à petição em minutos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { num: "01", icon: FileSearch, titulo: "Envie o contrato", desc: "Faça upload do PDF do contrato de crédito rural. A IA extrai todas as cláusulas financeiras automaticamente." },
              { num: "02", icon: Calculator, titulo: "Calcule a TCR", desc: "O sistema calcula a Taxa de Custo Real e compara com os limites legais vigentes, identificando abusividades." },
              { num: "03", icon: BarChart3, titulo: "Analise o laudo", desc: "Receba um laudo técnico-jurídico completo com memória de cálculo, fundamentação legal e jurisprudência do STJ." },
              { num: "04", icon: Gavel, titulo: "Gere a petição", desc: "Gere automaticamente a petição de revisão contratual c/c tutela de urgência, pronta para protocolar." },
            ].map((step) => (
              <div key={step.num} className="relative">
                <div className="p-6 rounded-xl bg-white border border-border h-full">
                  <div className="text-4xl font-black text-primary/10 mb-3">{step.num}</div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{step.titulo}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── JURISPRUDÊNCIA ──────────────────────────────────────────────────── */}
      <section id="jurisprudencia" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{fontFamily: "Merriweather, serif"}}>
              Fundamentado em jurisprudência real
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Todos os cálculos e documentos gerados são fundamentados em decisões reais do STJ, com número de processo, relator e data de julgamento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {JURISPRUDENCIAS.map((j) => (
              <div key={j.numero} className="p-6 rounded-xl border border-border bg-slate-50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded">{j.tribunal}</span>
                  <span className="text-sm font-semibold text-foreground">{j.numero}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{j.texto}"</p>
              </div>
            ))}
          </div>

          {/* Legislação */}
          <div className="mt-10 p-6 rounded-xl bg-primary/5 border border-primary/20">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Base Legislativa
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { lei: "Lei 4.829/65", desc: "Institucionaliza o Crédito Rural" },
                { lei: "DL 167/67", desc: "Cédulas de Crédito Rural" },
                { lei: "Dec. 22.626/33", desc: "Lei de Usura — limite 12% a.a." },
                { lei: "Res. CMN 4.913/21", desc: "Metodologia TCR" },
              ].map((l) => (
                <div key={l.lei} className="p-3 rounded-lg bg-white border border-border">
                  <p className="text-xs font-bold text-primary">{l.lei}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{l.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PLANOS ──────────────────────────────────────────────────────────── */}
      <section id="planos" className="py-20 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{fontFamily: "Merriweather, serif"}}>
              Planos e Preços
            </h2>
            <p className="text-slate-400 text-lg">Comece gratuitamente. Faça upgrade quando precisar.</p>
          </div>

          {/* Toggle Mensal / Anual */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${!anual ? 'text-white' : 'text-slate-400'}`}>Mensal</span>
            <button
              onClick={() => setAnual(!anual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                anual ? 'bg-amber-400' : 'bg-slate-600'
              }`}
              aria-label="Alternar entre mensal e anual"
            >
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                anual ? 'translate-x-8' : 'translate-x-1'
              }`} />
            </button>
            <span className={`text-sm font-medium ${anual ? 'text-white' : 'text-slate-400'}`}>
              Anual
              <span className="ml-2 bg-amber-400 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">-25%</span>
            </span>
          </div>

          {anual && (
            <p className="text-center text-amber-400 text-sm mb-8 -mt-6">
              Economia de 3 meses pagando anualmente!
            </p>
          )}

          {/* Cards de Planos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {PLANOS.map((plano) => {
              const isFree = plano.nome === 'Free';
              const precoMensal = parseInt(plano.preco.replace(/\D/g, '')) || 0;
              const precoExibido = isFree ? 0 : calcPreco(precoMensal);
              const precoAnualTotal = precoExibido * 12;
              return (
                <div
                  key={plano.nome}
                  className={`p-6 rounded-2xl relative flex flex-col ${
                    plano.destaque
                      ? 'border-2 border-amber-400 bg-amber-400/5'
                      : plano.nome === 'Supreme'
                      ? 'border border-purple-400/30 bg-purple-400/5'
                      : isFree
                      ? 'border border-emerald-400/30 bg-emerald-400/5'
                      : 'border border-white/10 bg-white/5'
                  }`}
                >
                  {plano.destaque && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-amber-400 text-slate-900 text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                        <Star className="h-3 w-3" /> Mais popular
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-bold uppercase tracking-wide ${
                        plano.destaque ? 'text-amber-400'
                        : plano.nome === 'Supreme' ? 'text-purple-400'
                        : isFree ? 'text-emerald-400'
                        : 'text-slate-400'
                      }`}>{plano.nome}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${plano.corBadge}`}>
                        {plano.laudos}
                      </span>
                    </div>

                    <div className="flex items-end gap-1">
                      {!isFree && anual && (
                        <span className="text-slate-500 line-through text-lg mr-1">
                          R$ {precoMensal.toLocaleString('pt-BR')}
                        </span>
                      )}
                      <span className="text-3xl font-black text-white">
                        {isFree ? 'Grátis' : `R$ ${precoExibido.toLocaleString('pt-BR')}`}
                      </span>
                      {!isFree && <span className="text-slate-400 mb-1 text-sm">/mês</span>}
                    </div>

                    {!isFree && anual && precoExibido > 0 && (
                      <p className="text-xs text-amber-400 mt-1">
                        R$ {precoAnualTotal.toLocaleString('pt-BR')}/ano
                      </p>
                    )}

                    <p className="text-slate-400 text-sm mt-2">{plano.descricao}</p>
                  </div>

                  <ul className="space-y-2.5 mb-4 flex-1">
                    {plano.features.map((f: string) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <CheckCircle className={`h-4 w-4 shrink-0 mt-0.5 ${
                          plano.destaque ? 'text-amber-400'
                          : plano.nome === 'Supreme' ? 'text-purple-400'
                          : isFree ? 'text-emerald-400'
                          : 'text-emerald-400'
                        }`} />
                        {f}
                      </li>
                    ))}
                    {/* Restrições do plano Free */}
                    {'restricoes' in plano && (plano as { restricoes: string[] }).restricoes.map((r: string) => (
                      <li key={r} className="flex items-start gap-2.5 text-sm text-slate-500">
                        <X className="h-4 w-4 shrink-0 mt-0.5 text-red-500/60" />
                        {r}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleLogin}
                    className={`w-full py-2.5 rounded-xl font-semibold transition-colors text-sm ${
                      plano.destaque
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                        : plano.nome === 'Supreme'
                        ? 'bg-purple-500 hover:bg-purple-400 text-white'
                        : isFree
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                        : 'border border-white/20 hover:border-white/40 text-white'
                    }`}
                  >
                    {isFree ? 'Criar conta gratuita' : `Assinar ${plano.nome}`}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-slate-500 text-sm mt-8">
            Pagamento seguro · Cancele quando quiser · Sem fidelidade
          </p>
        </div>
      </section>

      {/* ─── CTA FINAL ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <TrendingDown className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{fontFamily: "Merriweather, serif"}}>
            Seu cliente está pagando juros abusivos?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Use o JurosRurais.pro para identificar o excesso, calcular o valor a ser restituído e gerar a petição de revisão — tudo em minutos, com fundamentação jurídica sólida.
          </p>
          <button
            onClick={handleLogin}
            className="bg-primary text-primary-foreground px-10 py-4 rounded-xl text-base font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2 shadow-lg"
          >
            Acessar a plataforma
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* ─── RODAPÉ ──────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo JurosRurais.pro */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Scale className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-bold text-white">
                JurosRurais<span className="text-primary">.pro</span>
              </span>
            </div>

            {/* Aviso legal */}
            <p className="text-xs text-slate-500 text-center max-w-md">
              Esta ferramenta fornece cálculos orientativos com base na legislação vigente. Os resultados não substituem a análise jurídica especializada. Consulte sempre um advogado habilitado.
            </p>

            {/* Crédito LoboLab — discreto */}
            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <span className="text-xs text-slate-500">Desenvolvido por</span>
              <img
                src="https://files.manuscdn.com/user_upload_by_module/session_file/100097390/UXUCEhzJLYRaIVuq.svg"
                alt="LoboLab — AI-Powered Solutions"
                className="h-5 w-auto"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap justify-center gap-6 text-xs text-slate-600">
            <span>© {new Date().getFullYear()} JurosRurais.pro — LoboLab Tecnologia Jurídica</span>
            <span>·</span>
            <a href="/privacidade" className="hover:text-slate-400 transition-colors">Política de Privacidade</a>
            <span>·</span>
            <a href="/termos" className="hover:text-slate-400 transition-colors">Termos de Uso</a>
            <span>·</span>
            <span>Lei 4.829/65 · DL 167/67 · Dec. 22.626/33 · Res. CMN 4.913/21</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
