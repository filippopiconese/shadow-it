import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout";
import { LandingPage } from "@/pages/landing";
import { Dashboard } from "@/pages/dashboard";
import { AppList } from "@/pages/app-list";
import { AppDetail } from "@/pages/app-detail";
import { Scans } from "@/pages/scans";
import { Billing } from "@/pages/billing";
import { Connect } from "@/pages/connect";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/connect" component={Connect} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/apps" component={AppList} />
            <Route path="/apps/:id" component={AppDetail} />
            <Route path="/scans" component={Scans} />
            <Route path="/billing" component={Billing} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
