import { Route, Routes } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./auth";
import { Shell } from "./Shell";
import { LoginPage } from "../pages/LoginPage";
import { AppErrorBoundary } from "../shared/ui/feedback";
import { TenantProvider } from "./tenant";

function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <TenantProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <RequireAuth>
                  <Shell />
                </RequireAuth>
              }
            />
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default App;
