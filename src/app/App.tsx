import { Route, Routes } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./auth";
import { Shell } from "./Shell";
import { LoginPage } from "../pages/LoginPage";
import { AppErrorBoundary } from "../shared/ui/feedback";

function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
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
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default App;

