import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ContractRuntimeAdapterProvider } from "./adapters/ContractRuntimeAdapterProvider";
import { AppShell } from "./components/AppShell";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { ActivityPage } from "./pages/ActivityPage";
import { DependenciesPage } from "./pages/DependenciesPage";
import { HelpPage } from "./pages/HelpPage";
import { HomePage } from "./pages/HomePage";
import { NewPoolPage } from "./pages/NewPoolPage";
import { PoolDetailPage } from "./pages/PoolDetailPage";
import { PoolsPage } from "./pages/PoolsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ThemeProvider } from "./theme/ThemeProvider";
import { TransactionNoticeCenter, TransactionProvider } from "./transactions/TransactionProvider";
import { WalletProvider } from "./wallet/WalletProvider";

export function AppRoutes() {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <WalletProvider>
          <TransactionProvider>
            <ContractRuntimeAdapterProvider>
              <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="pools" element={<PoolsPage />} />
              <Route path="pools/new" element={<NewPoolPage />} />
              <Route path="pools/:poolId" element={<PoolDetailPage />} />
              <Route path="dependencies" element={<DependenciesPage />} />
              <Route path="activity" element={<ActivityPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="help" element={<HelpPage />} />
            </Route>
              </Routes>
            </ContractRuntimeAdapterProvider>
              <TransactionNoticeCenter />
            </TransactionProvider>
          </WalletProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

export function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}
