import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "sonner";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Calendar from "@/pages/Calendar";
import Guests from "@/pages/Guests";
import Inventory from "@/pages/Inventory";
import Expenses from "@/pages/Expenses";
import Pricing from "@/pages/Pricing";
import Alloggiati from "@/pages/Alloggiati";
import Ross1000 from "@/pages/Ross1000";
import PublicRegistration from "@/pages/PublicRegistration";

function Protected({ children }) {
  const { user } = useAuth();
  if (user === null) return <div className="p-10 text-muted-foreground">Caricamento…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AuthGate({ children }) {
  const { user } = useAuth();
  if (user === null) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<AuthGate><Login /></AuthGate>} />
          <Route path="/registra" element={<PublicRegistration />} />
          <Route path="/" element={<Protected><Layout /></Protected>}>
            <Route index element={<Dashboard />} />
            <Route path="calendario" element={<Calendar />} />
            <Route path="ospiti" element={<Guests />} />
            <Route path="magazzino" element={<Inventory />} />
            <Route path="scadenziario" element={<Expenses />} />
            <Route path="prezzi" element={<Pricing />} />
            <Route path="alloggiati" element={<Alloggiati />} />
            <Route path="ross1000" element={<Ross1000 />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
