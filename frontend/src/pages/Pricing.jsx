import { useState } from "react";
import { api, eur, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkle } from "@phosphor-icons/react";

export default function Pricing() {
  const [form, setForm] = useState({
    checkin: "", checkout: "", location: "Roma, Italia", base_price: 80, events: "", occupancy_context: "",
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async () => {
    setBusy(true); setResult(null);
    try {
      const { data } = await api.post("/pricing/suggest", form);
      setResult(data); toast.success("Suggerimento generato");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <div className="overline">Revenue Management · AI</div>
        <h1 className="font-serif text-5xl mt-2">Prezzi Dinamici</h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-2xl">Ottieni un suggerimento di prezzo intelligente basato su stagionalità italiana, weekend/festivi ed eventi locali. Powered by Gemini.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-border rounded-md bg-card p-6">
          <div className="overline mb-4">Parametri</div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Check-in</Label><Input type="date" value={form.checkin} onChange={(e) => setForm({ ...form, checkin: e.target.value })} data-testid="p-checkin" /></div>
            <div><Label>Check-out</Label><Input type="date" value={form.checkout} onChange={(e) => setForm({ ...form, checkout: e.target.value })} data-testid="p-checkout" /></div>
            <div className="col-span-2"><Label>Località</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} data-testid="p-location" /></div>
            <div className="col-span-2"><Label>Prezzo base (€/notte)</Label><Input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: parseFloat(e.target.value) })} data-testid="p-base" /></div>
            <div className="col-span-2"><Label>Eventi in zona</Label><Textarea value={form.events} onChange={(e) => setForm({ ...form, events: e.target.value })} placeholder="Es. Concerto Vasco Rossi 15 giugno, Salone del Mobile…" data-testid="p-events" /></div>
            <div className="col-span-2"><Label>Contesto occupazione</Label><Textarea value={form.occupancy_context} onChange={(e) => setForm({ ...form, occupancy_context: e.target.value })} placeholder="Es. hotel in zona pieni, weekend lungo…" /></div>
          </div>
          <Button onClick={submit} disabled={busy || !form.checkin || !form.checkout} data-testid="p-submit" className="w-full mt-6 rounded-md h-11">
            <Sparkle size={16} className="mr-2" weight="duotone" />
            {busy ? "L'AI sta analizzando…" : "Genera suggerimento"}
          </Button>
        </div>

        <div className="border border-border rounded-md bg-card p-6" data-testid="pricing-result">
          <div className="overline mb-4">Risultato AI</div>
          {!result ? (
            <div className="text-center text-muted-foreground py-20">Compila i parametri e genera un suggerimento per vedere il prezzo consigliato.</div>
          ) : (
            <div>
              <div className="text-center py-6 border-b border-border">
                <div className="overline">Prezzo consigliato</div>
                <div className="kpi-num text-7xl mt-2 text-primary">{eur(result.suggested_price)}<span className="text-2xl text-muted-foreground">/notte</span></div>
                <div className="text-sm text-muted-foreground mt-3">Range: {eur(result.min_price)} – {eur(result.max_price)}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 py-6 border-b border-border">
                <div><div className="overline">Notti</div><div className="kpi-num text-3xl mt-1">{result.nights}</div></div>
                <div><div className="overline">Totale stimato</div><div className="kpi-num text-3xl mt-1">{eur(result.total_suggested)}</div></div>
              </div>
              <div className="pt-6">
                <div className="overline mb-2">Analisi</div>
                <p className="text-sm leading-relaxed">{result.reasoning}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
