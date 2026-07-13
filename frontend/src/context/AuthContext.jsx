import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { api, formatApiError } from "@/lib/api";

// Determina l'URL corretto combinando i possibili env di Vite o Create React App
const BASE_URL = import.meta.env?.VITE_API_URL || process.env?.REACT_APP_API_URL || "";

// Se l'URL è definito, forziamo l'istanza dell'api a usare quello corretto in produzione
if (BASE_URL && api.defaults) {
  api.defaults.baseURL = BASE_URL.endsWith("/api") ? BASE_URL : `${BASE_URL}/api`;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = anon, obj = logged in
  const [error, setError] = useState("");

  const check = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      setUser(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  const login = useCallback(async (email, password) => {
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data);
      return true;
    } catch (e) {
      setError(formatApiError(e.response?.data?.detail) || e.message);
      return false;
    }
  }, []);

  const register = useCallback(async (email, password, name) => {
    setError("");
    try {
      const { data } = await api.post("/auth/register", { email, password, name });
      setUser(data);
      return true;
    } catch (e) {
      setError(formatApiError(e.response?.data?.detail) || e.message);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setUser(false);
  }, []);

  const value = useMemo(
    () => ({ user, error, login, register, logout, refresh: check }),
    [user, error, login, register, logout, check]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
