import { useEffect, useState, useCallback } from "react";
import { api, eur, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash, Plus, FilePdf } from "@phosphor-icons/react";

const MONTHS = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

const emptyForm = {
  guest_first_name: "", guest_last_name: "", checkin: "", checkout: "", gross_price: 80,
  channel: "Direct", notes: "", date_of_birth: "", place_of_birth: "", country_of_birth: "ITALIA",
  citizenship: "ITALIA", sex: "M", document_type: "IDENT", document_number: "", document_place: "",
};

export default function Guests() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(() => api.get("/bookings").then((r) => setItems(r.data)), []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(emptyForm); setEditId(null); setOpen(true); };
  const openEdit = (b) => { setForm({ ...emptyForm, ...b }); setEditId(b.id); setOpen(true); };

  const submit = async () => {
    try {
      if (editId) await api.put(`/bookings/${editId}`, form);
      else await api.post("/bookings", form);
      toast.success("Salvato");
      setOpen(false); load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/bookings/${deleteId}`);
      toast.success("Prenotazione eliminata");
      setDeleteId(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
      setDeleteId(null);
    }
  };

  const handleDownloadReceipt = (booking) => {
    // 1. Chiediamo il numero totale di ospiti usando il pop-up nativo del browser
    const ospiti = window.prompt("Quanti ospiti totali per questa ricevuta?", "1");
    if (!ospiti) return; 

    // 2. Chiediamo se ci sono bambini esenti
    const haBambini = window.confirm("Ci sono bambini esenti dalla tassa di soggiorno tra questi ospiti?");
    let bambini = 0;
    
    if (haBambini) {
      const quantiBambini = window.prompt("Quanti bambini sotto la soglia di età esenzione?", "0");
      bambini = parseInt(quantiBambini) || 0;
    }

    // 3. Estraiamo l'URL di base configurato nell'istanza di Axios (api.js) o usiamo Render come fallback
    const baseUrl = api.defaults.baseURL || "https://gestionale-bnb-backend.onrender.com";

    // 4. Apriamo la ricevuta PDF in una nuova scheda avviando il download
    window.open(`${baseUrl}/api/bookings/${booking.id}/receipt-pdf?guests_count=${ospiti}&kids_count=${bambini}`, '_blank');
  };

  // Modifica Etsy: Estrae l'URL dinamico del server rimuovendo /api per recuperare i file statici (foto)
  const serverUrl = (api.defaults.baseURL || "").replace("/api", "");

  const deleteTarget = items.find((b) => b.id === deleteId);

  return (
    <div className="p-8 lg:p-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="overline">Registro ospiti</div>
          <h1 className="font-serif text-5xl mt-2">Ospiti</h1>
        </div>
        <Button onClick={openNew} data-testid="btn-add-guest" className="rounded-md"><Plus size={16} className="mr-2" /> Aggiungi</Button>
      </div>

      <div className="border border-border rounded-md bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr className="text-left">
              {["Nome", "Cognome", "Mese", "Check-in", "Check-out", "Notti", "Lordo", "Netto", "Canale", "Foto", ""].map((h) => (
                <th key={h} className="px-4 py-3 overline font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody data-testid="guests-table">
            {items.length === 0 ? (
              <tr><td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">Nessun ospite ancora. Aggiungi la prima prenotazione.</td></tr>
            ) : items.map((b) => {
              const ci = new Date(b.checkin);
              return (
                <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">{b.guest_first_name}</td>
                  <td className="px-4 py-3">{b.guest_last_name}</td>
                  <td className="px-4 py-3">{MONTHS[ci.getMonth()]} {ci.getFullYear()}</td>
                  <td className="px-4 py-3 font-mono text-xs">{b.checkin.slice(0, 10)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{b.checkout.slice(0, 10)}</td>
                  <td className="px-4 py-3">{b.nights}</td>
                  <td className="px-4 py-3 kpi-num">{eur(b.gross_price)}</td>
                  <td className="px-4 py-3 kpi-num text-primary font-medium">{eur(b.net_revenue)}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded bg-muted">{b.channel}</span></td>
                  <td className="px-4 py-3">
                    {b.photo_paths?.length > 0 ? (
                      <button
                        onClick={() => window.open(`${serverUrl}/${b.photo_paths[0]}`, '_blank')}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        data-testid={`photos-${b.id}`}
                        title="Visualizza foto documento"
                      >
                        📎 {b.photo_paths.length}
                      </button>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleDownloadReceipt(b)} title="Scarica Ricevuta PDF" className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"><FilePdf size={14} /></button>
                      <button onClick={() => openEdit(b)} data-testid={`edit-${b.id}`} className="p-1.5 rounded hover:bg-muted transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteId(b.id)} data-testid={`delete-${b.id}`} className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Modifica ospite" : "Nuovo ospite"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome</Label><Input value={form.guest_first_name} onChange={(e) => setForm({ ...form, guest_first_name: e.target.value })} /></div>
            <div><Label>Cognome</Label><Input value={form.guest_last_name} onChange={(e) => setForm({ ...form, guest_last_name: e.target.value })} /></div>
            <div><Label>Check-in</Label><Input type="date" value={form.checkin?.slice(0, 10) || ""} onChange={(e) => setForm({ ...form, checkin: e.target.value })} /></div>
            <div><Label>Check-out</Label><Input type="date" value={form.checkout?.slice(0, 10) || ""} onChange={(e) => setForm({ ...form, checkout: e.target.value })} /></div>
            <div><Label>Prezzo lordo (€)</Label><Input type="number" value={form.gross_price} onChange={(e) => setForm({ ...form, gross_price: parseFloat(e.target.value) })} /></div>
            <div>
              <Label>Canale</Label>
              <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direct">Diretto</SelectItem>
                  <SelectItem value="Airbnb">Airbnb</SelectItem>
                  <SelectItem value="Booking">Booking</SelectItem>
                  <SelectItem value="Other">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 border-t border-border pt-3 mt-2">
              <div className="overline mb-2">Dati per Alloggiati Web</div>
            </div>
            <div><Label>Data di nascita</Label><Input type="date" value={form.date_of_birth || ""} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></div>
            <div>
              <Label>Sesso</Label>
              <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Maschio</SelectItem>
                  <SelectItem value="F">Femmina</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Comune di nascita</Label><Input value={form.place_of_birth || ""} onChange={(e) => setForm({ ...form, place_of_birth: e.target.value })} /></div>
            <div><Label>Stato di nascita</Label><Input value={form.country_of_birth || ""} onChange={(e) => setForm({ ...form, country_of_birth: e.target.value })} /></div>
            <div><Label>Cittadinanza</Label><Input value={form.citizenship || ""} onChange={(e) => setForm({ ...form, citizenship: e.target.value })} /></div>
            <div><Label>Tipo documento</Label><Input value={form.document_type || ""} onChange={(e) => setForm({ ...form, document_type: e.target.value })} placeholder="IDENT / PASOR / PATEN" /></div>
            <div><Label>Numero documento</Label><Input value={form.document_number || ""} onChange={(e) => setForm({ ...form, document_number: e.target.value })} /></div>
            <div><Label>Luogo rilascio</Label><Input value={form.document_place || ""} onChange={(e) => setForm({ ...form, document_place: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={submit} data-testid="guest-save">Salva</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare la prenotazione?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Stai per eliminare la prenotazione di ${deleteTarget.guest_first_name} ${deleteTarget.guest_last_name} (${deleteTarget.checkin?.slice(0, 10)} → ${deleteTarget.checkout?.slice(0, 10)}). L'azione è irreversibile.`
                : "L'azione è irreversibile."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="confirm-delete-cancel">Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} data-testid="confirm-delete-ok" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}