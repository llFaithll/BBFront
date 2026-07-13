import { useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DownloadSimple, FileCsv, CheckCircle, WarningCircle } from "@phosphor-icons/react";

function PreviewRecord({ r }) {
  const Icon = r.valid ? CheckCircle : WarningCircle;
  const iconClass = r.valid ? "text-primary mt-0.5" : "text-accent mt-0.5";
  return (
    <div className="border border-border rounded-md p-3 flex items-start gap-3">
      <Icon size={20} className={iconClass} weight="duotone" />
      <div className="flex-1 min-w-0">
        <div className="font-medium">{r.guest_name}</div>
        <div className="text-xs text-muted-foreground">
          Arrivo: {r.arrival_date} · Notti: {r.nights} · Ospiti: {r.guests_count}
        </div>
        {r.missing_fields?.length > 0 && (
          <div className="text-xs text-accent mt-1">Dati mancanti: {r.missing_fields.join(", ")}</div>
        )}
      </div>
    </div>
  );
}

export default function Ross1000() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [start, setStart] = useState(firstDay.toISOString().slice(0, 10));
  const [end, setEnd] = useState(today.toISOString().slice(0, 10));
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const doPreview = async () => {
    setBusy(true);
    try {
      const { data } = await api.get("/ross1000/preview", { params: { start_date: start, end_date: end } });
      setPreview(data);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  const doDownload = async () => {
    try {
      // Modifica Etsy: Genera l'URL di download partendo dall'URL dinamico di Axios (senza raddoppiare /api)
      const serverBaseUrl = (api.defaults.baseURL || "").replace("/api", "");
      const downloadUrl = `${serverBaseUrl}/api/ross1000/export?start_date=${start}&end_date=${end}`;
      
      // Avvia il download aprendo la rotta dedicata in una nuova scheda
      window.open(downloadUrl, '_blank');
      toast.success("File CSV generato con successo");
    } catch (e) {
      toast.error("Impossibile avviare il download del file.");
    }
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <div className="overline">Modello di Rilevazione ISTAT</div>
        <h1 className="font-serif text-5xl mt-2">ROSS 1000</h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
          Genera l'anteprima e scarica il file compatibile con lo standard di movimentazione turistica regionale (ROSS 1000 / C59).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="border border-border rounded-md bg-card p-6">
          <div className="overline mb-4">Periodo ISTAT</div>
          <div className="space-y-3">
            <div>
              <Label>Dal</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label>Al</Label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <Button onClick={doPreview} disabled={busy} variant="outline" className="w-full rounded-md">
              <FileCsv size={16} className="mr-2" /> Genera Anteprima
            </Button>
            <Button onClick={doDownload} disabled={!preview || preview.total === 0} className="w-full rounded-md h-11">
              <DownloadSimple size={16} className="mr-2" /> Scarica file CSV
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2 border border-border rounded-md bg-card p-6">
          <div className="overline mb-4">Validazione Record ({preview ? preview.total : 0})</div>
          {!preview ? (
            <div className="text-center text-muted-foreground py-20">Seleziona le date per verificare l'anteprima dei dati ISTAT.</div>
          ) : preview.records?.length === 0 ? (
            <div className="text-center text-muted-foreground py-20">Nessun movimento registrato nel periodo selezionato.</div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {preview.records.map((r, idx) => (
                <PreviewRecord key={idx} r={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}