import axios from "axios";

// Legge l'URL dal file config.js modificabile dal cliente esternamente
const BACKEND_URL = 
  (window.APP_CONFIG && window.APP_CONFIG.BACKEND_URL) || 
  "http://localhost:8000";

// Puliamo l'URL se per caso finisce già con /api, evitiamo di raddoppiarlo
export const API = BACKEND_URL.endsWith("/api") ? BACKEND_URL : `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

export function formatApiError(detail) {
  if (detail == null) return "Si è verificato un errore.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const eur = (n) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n || 0);
export const pct = (n) => `${(n || 0).toFixed(1)}%`;
