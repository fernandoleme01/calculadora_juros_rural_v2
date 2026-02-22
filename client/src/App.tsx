import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Calculadora from "./pages/Calculadora";
import Resultado from "./pages/Resultado";
import Historico from "./pages/Historico";
import FundamentacaoLegal from "./pages/FundamentacaoLegal";
import AnalisarContrato from "./pages/AnalisarContrato";
import DadosBCB from "./pages/DadosBCB";
import GeradorPeticao from "./pages/GeradorPeticao";
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/calculadora" component={Calculadora} />
        <Route path="/resultado" component={Resultado} />
        <Route path="/historico" component={Historico} />
        <Route path="/fundamentacao" component={FundamentacaoLegal} />
        <Route path="/analisar-contrato" component={AnalisarContrato} />
        <Route path="/dados-bcb" component={DadosBCB} />
        <Route path="/gerador-peticao" component={GeradorPeticao} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
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
