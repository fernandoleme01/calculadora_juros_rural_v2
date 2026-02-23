import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import LandingPage from "./pages/LandingPage";
import Home from "./pages/Home";
import Calculadora from "./pages/Calculadora";
import Resultado from "./pages/Resultado";
import Historico from "./pages/Historico";
import FundamentacaoLegal from "./pages/FundamentacaoLegal";
import AnalisarContrato from "./pages/AnalisarContrato";
import DadosBCB from "./pages/DadosBCB";
import GeradorPeticao from "./pages/GeradorPeticao";
import PainelAdmin from "./pages/PainelAdmin";
import Assinatura from "./pages/Assinatura";
import PerfilProfissional from "./pages/PerfilProfissional";
import Amortizacao from "./pages/Amortizacao";
import CadeiaContratos from "./pages/CadeiaContratos";
import LaudoPericial from "./pages/LaudoPericial";
import PeticaoDEDDDC from "./pages/PeticaoDEDDDC";
import UploadDED from "./pages/UploadDED";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";

// Rotas públicas (sem autenticação, sem DashboardLayout)
function PublicRoutes() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={Login} />
    </Switch>
  );
}

// Rotas do dashboard (com DashboardLayout — requer autenticação)
function DashboardRoutes() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/app" component={Home} />
        <Route path="/app/calculadora" component={Calculadora} />
        <Route path="/app/resultado" component={Resultado} />
        <Route path="/app/historico" component={Historico} />
        <Route path="/app/fundamentacao" component={FundamentacaoLegal} />
        <Route path="/app/analisar-contrato" component={AnalisarContrato} />
        <Route path="/app/dados-bcb" component={DadosBCB} />
        <Route path="/app/gerador-peticao" component={GeradorPeticao} />
        <Route path="/app/admin" component={PainelAdmin} />
        <Route path="/app/assinatura" component={Assinatura} />
        <Route path="/app/assinatura/sucesso" component={Assinatura} />
        <Route path="/app/perfil" component={PerfilProfissional} />
        <Route path="/app/amortizacao" component={Amortizacao} />
        <Route path="/app/cadeia-contratos" component={CadeiaContratos} />
        <Route path="/app/laudo-pericial" component={LaudoPericial} />
        <Route path="/app/peticao-ded" component={PeticaoDEDDDC} />
        <Route path="/app/upload-ded" component={UploadDED} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Rota pública: landing page */}
      <Route path="/" component={LandingPage} />
      {/* Todas as rotas /app/* vão para o dashboard */}
      <Route path="/app/:rest*" component={DashboardRoutes} />
      <Route path="/app" component={DashboardRoutes} />
      {/* Compatibilidade com rotas antigas sem /app */}
      <Route path="/calculadora" component={() => { window.location.replace("/app/calculadora"); return null; }} />
      <Route path="/historico" component={() => { window.location.replace("/app/historico"); return null; }} />
      <Route path="/fundamentacao" component={() => { window.location.replace("/app/fundamentacao"); return null; }} />
      <Route path="/analisar-contrato" component={() => { window.location.replace("/app/analisar-contrato"); return null; }} />
      <Route path="/dados-bcb" component={() => { window.location.replace("/app/dados-bcb"); return null; }} />
      <Route path="/gerador-peticao" component={() => { window.location.replace("/app/gerador-peticao"); return null; }} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
