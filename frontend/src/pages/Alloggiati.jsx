import { useState } from "react";
import { api, API, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DownloadSimple, FileText, CheckCircle, WarningCircle, WhatsappLogo, Copy, Package } from "@phosphor-icons/react";

function PreviewRecord({ r }) {
  const Icon = r.valid ? CheckCircle : WarningCircle;
  const iconClass = r.valid ? "text-primary mt-0.5" : "text-accent mt-0.5";
  return (
    <div className="border border-border rounded-md p-3 flex items-start gap-3">
      <Icon size={20} className={iconClass} weight="duotone" />
      <div className="flex-1 min-w-0">
        <div className="font-medium">{r.guest}</div>
        <div className="text-xs text-muted-foreground">Check-in: {r.checkin?.slice(0, 10)} · {r.nights} notti</div>
        {r.line_preview && <div className="font-mono text-[10px] text-muted-foreground mt-1 truncate">{r.line_preview}</div>}
        {r.missing?.length > 0 && <div className="text-xs text-accent mt-1">Manca: {r.missing.join(", ")}</div>}
      </div>
    </div>
  );
}

function renderPreview(preview) {
  if (!preview) {
    return <div className="text-center text-muted-foreground py-20">Seleziona un periodo e genera l'anteprima.</div>;
  }
  if (preview.total === 0) {
    return <div className="text-center text-muted-foreground py-20">Nessun ospite nel periodo selezionato.</div>;
  }
  const invalidCount = preview.records.filter((r) => !r.valid).length;
  return (
    <div>
      <div className="text-sm mb-4">
        Trovati <strong>{preview.total}</strong> ospiti.
        {invalidCount > 0 && <span className="text-accent"> Attenzione: {invalidCount} record con dati mancanti.</span>}
      </div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {preview.records.map((r) => (
          <PreviewRecord key={`${r.checkin}-${r.guest}`} r={r} />
        ))}
      </div>
    </div>
  );
}

export default function Alloggiati() {
  const first = new Date(); first.setDate(1);
  const [start, setStart] = useState(first.toISOString().slice(0, 10));
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  // Modifica Etsy: Estrae l'URL principale per comporre il link della pagina di registrazione pubblica dell'ospite
  const serverBaseUrl = (api.defaults.baseURL || "").replace("/api", "");
  const publicUrl = `${serverBaseUrl}/registra`;
  
  const whatsappMsg = encodeURIComponent(
    `Ciao! Grazie per aver scelto la nostra struttura. Per completare la registrazione richiesta dalla Polizia di Stato, compila questo modulo: ${publicUrl}`
  );

  const doPreview = async () => {
    setBusy(true);
    try {
      const { data } = await api.get("/alloggiati/preview", { params: { start_date: start, end_date: end } });
      setPreview(data);
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  const doDownload = async (kind) => {
    try {
      const path = kind === "zip" ? "/alloggiati/export-zip" : "/alloggiati/export";
      const res = await api.get(path, { params: { start_date: start, end_date: end }, responseType: "blob" });
      const mime = kind === "zip" ? "application/zip" : "text/plain";
      const ext = kind === "zip" ? "zip" : "txt";
      const url = URL.createObjectURL(new Blob([res.data], { type: mime }));
      const a = document.createElement("a");
      a.href = url; a.download = `alloggiati_${start}_${end}.${ext}`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success(kind === "zip" ? "ZIP scaricato — .txt + foto documenti" : "File .txt scaricato");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    toast.success("Link copiato negli appunti");
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <div className="overline">Comunicazione Polizia di Stato</div>
        <h1 className="font-serif text-5xl mt-2">Alloggiati Web</h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
          Genera il file <span className="font-mono">.txt</span> in formato tracciato Alloggiati Web con i dati degli ospiti nel periodo selezionato.
          Il file va poi caricato manualmente sul <a href="https://alloggiatiweb.poliziadistato.it/" target="_blank" rel="noreferrer" className="text-accent underline">portale della Polizia di Stato</a>.
        </p>
      </div>

      <div className="border border-border rounded-md bg-primary/5 p-6 mb-6" data-testid="share-link-card">
        <div className="flex items-start gap-4 flex-wrap">
          <WhatsappLogo size={32} weight="duotone" className="text-primary" />
          <div className="flex-1 min-w-[280px]">
            <div className="overline">Link registrazione ospiti</div>
            <div className="font-serif text-2xl mt-1">Condividi via WhatsApp</div>
            <p className="text-sm text-muted-foreground mt-1">Invia questo link ai tuoi ospiti: compileranno il modulo (dati + foto documento) prima del check-in.</p>
            <div className="mt-3 flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2">
              <span className="font-mono text-xs flex-1 truncate">{publicUrl}</span>
              <button onClick={copyLink} className="p-1.5 hover:bg-muted rounded transition-colors" data-testid="copy-link"><Copy size={14} /></button>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <a href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noreferrer" data-testid="share-whatsapp"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
                <WhatsappLogo size={16} weight="fill" /> Apri WhatsApp
              </a>
              <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-border text-sm px-4 py-2 rounded-md hover:bg-muted transition-colors">
                Anteprima modulo
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="border border-border rounded-md bg-card p-6">
          <div className="overline mb-4">Periodo</div>
          <div className="space-y-3">
            <div><Label>Dal</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} data-testid="allo-start" /></div>
            <div><Label>Al</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} data-testid="allo-end" /></div>
            <Button onClick={doPreview} disabled={busy} variant="outline" data-testid="allo-preview" className="w-full rounded-md">
              <FileText size={16} className="mr-2" /> Anteprima
            </Button>
            <Button onClick={() => doDownload("txt")} disabled={!preview || preview.total === 0} data-testid="allo-download" className="w-full rounded-md h-11">
              <DownloadSimple size={16} className="mr-2" /> Scarica .txt
            </Button>
            <Button onClick={() => doDownload("zip")} disabled={!preview || preview.total === 0} data-testid="allo-download-zip" variant="secondary" className="w-full rounded-md h-11">
              <Package size={16} className="mr-2" /> Scarica ZIP (con foto)
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2 border border-border rounded-md bg-card p-6" data-testid="allo-preview-panel">
          <div className="overline mb-4">Anteprima record</div>
          {renderPreview(preview)}
        </div>
      </div>
    </div>
  );
}