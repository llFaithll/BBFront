import { useState, useEffect } from "react";
import { api, eur, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkle, House, Check } from "@phosphor-icons/react";

export default function Pricing() {
  const [form, setForm] = useState({
    checkin: "", checkout: "", location: "Roma, Italia", base_price: 80, events: "", occupancy_context: "",
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  // Stato per la configurazione della Tassa di Soggiorno
  const [taxSettings, setTaxSettings] = useState({
    fee_per_night: 3.5,
    max_nights: 10,
    kids_under_age: 10,
  });
  const [savingTax, setSavingTax] = useState(false);

  // Carica le impostazioni della tassa di soggiorno all'avvio
  useEffect(() => {
    api.get("/settings/tourist-tax")
      .then((r) => {
        if (r.data) setTaxSettings(r.data);
      })
      .catch((e) => console.error("Errore nel caricamento della tassa di soggiorno:", e));
  }, []);

  const submit = async () => {
    setBusy(true); setResult(null);
    try {
      const { data } = await api.post("/pricing/suggest", form);
      setResult(data); toast.success("Suggerimento generato");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  // Funzione per salvare le regole della tassa di soggiorno
  const saveTaxSettings = async () => {
    setSavingTax(true);
    try {
      await api.post("/settings/tourist-tax", taxSettings);
      toast.success("Impostazioni della Tassa di Soggiorno salvate con successo!");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setSavingTax(false);
    }
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <div className="overline">Revenue Management · AI</div>
        <h1 className="font-serif text-5xl mt-2">Prezzi Dinamici</h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-2xl">Ottieni un suggerimento di prezzo intelligente basato su stagionalità italiana, weekend/festivi ed eventi locali. Powered by Gemini.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Sezione Parametri IA */}
          <div className="border border-border rounded-md bg-card p-6">
            <div className="overline mb-4">Parametri AI</div>
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

          {/* Sezione Tassa di Soggiorno Comune */}
          <div className="border border-border rounded-md bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <House size={20} className="text-primary" weight="duotone" />
              <div className="overline">Regolamento Tassa di Soggiorno</div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Configura i parametri del tuo comune. Questi valori verranno usati per calcolare l'importo corretto ed esonerare i bambini all'interno delle ricevute PDF degli ospiti.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Tariffa (€/notte)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={taxSettings.fee_per_night} 
                  onChange={(e) => setTaxSettings({ ...taxSettings, fee_per_night: parseFloat(e.target.value) || 0 })} 
                />
              </div>
              <div>
                <Label>Notti Massime</Label>
                <Input 
                  type="number" 
                  value={taxSettings.max_nights} 
                  onChange={(e) => setTaxSettings({ ...taxSettings, max_nights: parseInt(e.target.value) || 0 })} 
                />
              </div>
              <div>
                <Label>Esenzione Età (Sotto)</Label>
                <Input 
                  type="number" 
                  value={taxSettings.kids_under_age} 
                  onChange={(e) => setTaxSettings({ ...taxSettings, kids_under_age: parseInt(e.target.value) || 0 })} 
                />
              </div>
            </div>
            <Button onClick={saveTaxSettings} disabled={savingTax} variant="secondary" className="w-full mt-4 rounded-md">
              <Check size={16} className="mr-2" />
              {savingTax ? "Salvataggio..." : "Salva Regole Comune"}
            </Button>
          </div>
        </div>

        {/* Risultato AI */}
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
