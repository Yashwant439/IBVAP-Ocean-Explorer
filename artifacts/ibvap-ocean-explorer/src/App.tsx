import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Explorer from "@/pages/explorer";
import Observations from "@/pages/observations";
import Comparison from "@/pages/comparison";
import Analytics from "@/pages/analytics";
import Datasets from "@/pages/datasets";
import Ingestion from "@/pages/ingestion";
import MapPage from "@/pages/map";
import About from "@/pages/about";
import { AppShell } from "@/components/app-shell";
import { Route, Switch, useLocation, Router as WouterRouter } from "wouter";

const queryClient = new QueryClient();

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <AppShell>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/explorer" component={Explorer} />
          <Route path="/observations" component={Observations} />
          <Route path="/comparison" component={Comparison} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/datasets" component={Datasets} />
          <Route path="/ingestion" component={Ingestion} />
          <Route path="/map" component={MapPage} />
          <Route path="/about" component={About} />
          <Route component={NotFound} />
        </Switch>
      </AppShell>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
