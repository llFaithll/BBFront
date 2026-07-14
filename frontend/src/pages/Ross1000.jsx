import { useEffect, useState, useCallback } from "react";
import { api, formatApiError, pct } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DownloadSimple, FloppyDisk, Buildings, Info } from "@phosphor-icons/react";

const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function useReportPeriod() {
  const now = new Date();
  // Report del mese precedente (entro il 5 del mese corrente)
  const target = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: target.getFullYear(), month: target.getMonth() + 1 };
}

export default function Ross1000() {
  const init = useReportPeriod();
  const [year, setYear] = useState(init.year);
  const [month, setMonth] = useState(init.month);
  const [settings, setSettings] = useState({ codice_struttura: "", camere_disponibili: 1, letti_disponibili: 2 });
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await api.get("/ross1000/settings");
      setSettings(data);
    } catch (e) { /* first time: default */ }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const saveSettings = async () => {
    try {
      await api.post("/ross1000/settings", settings);
      toast.success("Impostazioni salvate");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const doPreview = async () => {
    setBusy(true);
    try {
      const { data } = await api.get("/ross1000/preview", { params: { year, month } });
      setPreview(data);
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  const download = async () => {
    try {
      const res = await api.get("/ross1000/export-xml", { params: { year, month }, responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/xml" }));
      const a = document.createElement("a");
      a.href = url; a.download = `ross1000_${year}_${String(month).padStart(2, "0")}.xml`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success("File XML scaricato — caricalo su lazioturismo.ross1000.it");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const now = new Date();
  const deadline = new Date(now.getFullYear(), now.getMonth(), 5);
  const isLate = now.getDate() > 5;
  const yearsOpts = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <div className="overline">Comunicazione ISTAT · Regione Lazio</div>
        <h1 className="font-serif text-5xl mt-2">ROSS 1000</h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-3xl">
          Genera il file <span className="font-mono">.xml</span> in formato tracciato ROSS 1000 con i dati dei flussi turistici del mese.
          Il file va caricato entro il <strong>5° giorno del mese successivo</strong> sul portale{" "}
          <a href="https://lazioturismo.ross1000.it/" target="_blank" rel="noreferrer" className="text-accent underline">
            lazioturismo.ross1000.it
          </a>.
        </p>
      </div>

      <div className="border border-primary/30 rounded-md bg-primary/5 p-5 mb-8 flex items-start gap-3" data-testid="ross-deadline">
        <Info size={22} weight="duotone" className="text-primary mt-0.5" />
        <div className="text-sm">
          <strong>Scadenza mensile:</strong> comunicazione dei dati del mese precedente entro le ore 23:59 del{" "}
          <span className="font-mono">05/{String(now.getMonth() + 1).padStart(2, "0")}/{now.getFullYear()}</span>.
          {isLate && <span className="text-destructive ml-2">⚠ Scadenza superata per questo mese.</span>}
        </div>
      </div>

      <section className="border border-border rounded-md bg-card p-6 mb-8" data-testid="ross-settings">
        <div className="flex items-center gap-3 mb-4">
          <Buildings size={22} weight="duotone" className="text-accent" />
          <div>
            <div className="overline">Impostazioni struttura</div>
            <h2 className="font-serif text-2xl mt-1">Dati struttura ricettiva</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Codice struttura ROSS 1000</Label>
            <Input value={settings.codice_struttura} onChange={(e) => setSettings({ ...settings, codice_struttura: e.target.value.toUpperCase() })} placeholder="Es. A00927P" data-testid="ross-codice" />
            <p className="text-xs text-muted-foreground mt-1">Il codice fornito da Regione Lazio all'atto della registrazione.</p>
          </div>
          <div>
            <Label>Camere disponibili</Label>
            <Input type="number" min="1" value={settings.camere_disponibili} onChange={(e) => setSettings({ ...settings, camere_disponibili: parseInt(e.target.value) || 1 })} data-testid="ross-camere" />
          </div>
          <div>
            <Label>Letti disponibili</Label>
            <Input type="number" min="1" value={settings.letti_disponibili} onChange={(e) => setSettings({ ...settings, letti_disponibili: parseInt(e.target.value) || 1 })} data-testid="ross-letti" />
          </div>
        </div>
        <Button onClick={saveSettings} className="mt-4 rounded-md" data-testid="ross-save">
          <FloppyDisk size={16} className="mr-2" /> Salva impostazioni
        </Button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="border border-border rounded-md bg-card p-6">
          <div className="overline mb-4">Periodo di riferimento</div>
          <div className="space-y-3">
            <div>
              <Label>Mese</Label>
              <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
                <SelectTrigger data-testid="ross-month"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Anno</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger data-testid="ross-year"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yearsOpts.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={doPreview} disabled={busy || !settings.codice_struttura} variant="outline" data-testid="ross-preview" className="w-full rounded-md">
              Anteprima statistiche
            </Button>
            <Button onClick={download} disabled={!settings.codice_struttura} data-testid="ross-download" className="w-full rounded-md h-11">
              <DownloadSimple size={16} className="mr-2" /> Scarica XML
            </Button>
            {!settings.codice_struttura && <p className="text-xs text-destructive">Configura prima il codice struttura.</p>}
          </div>
        </div>

        <div className="lg:col-span-2 border border-border rounded-md bg-card p-6" data-testid="ross-preview-panel">
          <div className="overline mb-4">Riepilogo {MONTHS[month - 1]} {year}</div>
          {!preview ? (
            <div className="text-center text-muted-foreground py-20">Seleziona il periodo e genera l'anteprima.</div>
          ) : (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCell overline="Arrivi" value={preview.total_arrivi} tid="stat-arrivi" />
                <StatCell overline="Partenze" value={preview.total_partenze} tid="stat-partenze" />
                <StatCell overline="Presenze (notti)" value={preview.total_presenze} tid="stat-presenze" />
                <StatCell overline="Occupazione" value={pct(preview.occupancy_pct)} tid="stat-occupancy" />
              </div>
              {preview.by_country.length > 0 && (
                <div>
                  <div className="overline mb-3">Arrivi per nazionalità</div>
                  <div className="space-y-2">
                    {preview.by_country.map((c) => (
                      <div key={c.country} className="flex items-center justify-between border border-border rounded-md px-4 py-2">
                        <span className="text-sm">{c.country}</span>
                        <span className="kpi-num text-lg">{c.arrivi}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {preview.total_arrivi === 0 && preview.total_partenze === 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  Nessun movimento nel periodo. Verrà comunque generato un file XML valido con struttura chiusa.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCell({ overline, value, tid }) {
  return (
    <div className="border border-border rounded-md p-4" data-testid={tid}>
      <div className="overline">{overline}</div>
      <div className="kpi-num text-3xl mt-1">{value}</div>
    </div>
  );
}
