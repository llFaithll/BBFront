import { useState, useEffect } from "react";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { 
  UserPlus, 
  FilePdf, 
  Trash, 
  Users, 
  Calendar, 
  IdentificationCard 
} from "@phosphor-icons/react";

export default function Guests() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    guest_first_name: "",
    guest_last_name: "",
    checkin: "",
    checkout: "",
    gross_price: 0,
    channel: "Direct",
    notes: "",
    date_of_birth: "",
    place_of_birth: "",
    document_number: "",
  });
  const [busy, setBusy] = useState(false);

  // Carica le prenotazioni/ospiti all'avvio
  const loadBookings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/bookings");
      setBookings(data);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // Crea una nuova prenotazione/ospite
  const handleCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/bookings", form);
      toast.success("Ospite registrato con successo!");
      setForm({
        guest_first_name: "",
        guest_last_name: "",
        checkin: "",
        checkout: "",
        gross_price: 0,
        channel: "Direct",
        notes: "",
        date_of_birth: "",
        place_of_birth: "",
        document_number: "",
      });
      loadBookings();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  // Cancella una prenotazione
  const handleDelete = async (id) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa registrazione?")) return;
    try {
      await api.delete(`/bookings/${id}`);
      toast.success("Registrazione eliminata");
      loadBookings();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  // FIX DEFINITIVO: Scarica la ricevuta PDF calcolando dinamicamente l'URL delle API
  const handleDownloadReceipt = (booking) => {
    // 1. Chiede quanti ospiti ci sono
    const ospiti = window.prompt("Quanti ospiti totali per questa ricevuta?", "1");
    if (!ospiti) return; // Annullato dall'utente

    // 2. Chiede se ci sono bambini esenti
    const haBambini = window.confirm("Ci sono bambini esenti dalla tassa di soggiorno tra questi ospiti?");
    let bambini = 0;
    if (haBambini) {
      const quantiBambini = window.prompt("Quanti bambini sotto la soglia di età esenzione?", "0");
      bambini = parseInt(quantiBambini) || 0;
    }

    // 3. Estrae l'URL base e verifica la presenza del prefisso /api
    const baseUrl = api.defaults.baseURL || "https://b-b-dc1b.onrender.com";
    
    const pdfUrl = baseUrl.endsWith('/api') 
      ? `${baseUrl}/bookings/${booking.id}/receipt-pdf?guests_count=${ospiti}&kids_count=${bambini}`
      : `${baseUrl}/api/bookings/${booking.id}/receipt-pdf?guests_count=${ospiti}&kids_count=${bambini}`;

    // 4. Apre il PDF in una nuova scheda del browser
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="p-8 lg:p-12 space-y-8">
      <div>
        <div className="overline">Anagrafica & Soggiorni</div>
        <h1 className="font-serif text-5xl mt-2">Ospiti</h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
          Gestisci il check-in, compila i dati per la Questura (Alloggiati Web) e scarica le ricevute non fiscali con il calcolo automatico della tassa di soggiorno.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form di Registrazione */}
        <div className="xl:col-span-1 border border-border rounded-md bg-card p-6 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={20} className="text-primary" weight="duotone" />
            <div className="overline">Nuovo Check-in</div>
          </div>
          
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome</Label>
                <Input required value={form.guest_first_name} onChange={(e) => setForm({ ...form, guest_first_name: e.target.value })} />
              </div>
              <div>
                <Label>Cognome</Label>
                <Input required value={form.guest_last_name} onChange={(e) => setForm({ ...form, guest_last_name: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Check-in</Label>
                <Input required type="date" value={form.checkin} onChange={(e) => setForm({ ...form, checkin: e.target.value })} />
              </div>
              <div>
                <Label>Check-out</Label>
                <Input required type="date" value={form.checkout} onChange={(e) => setForm({ ...form, checkout: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prezzo Totale (€)</Label>
                <Input type="number" required value={form.gross_price} onChange={(e) => setForm({ ...form, gross_price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Canale</Label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.channel} 
                  onChange={(e) => setForm({ ...form, channel: e.target.value })}
                >
                  <option value="Direct">Diretto</option>
                  <option value="Airbnb">Airbnb</option>
                  <option value="Booking">Booking.com</option>
                  <option value="Other">Altro</option>
                </select>
              </div>
            </div>

            <hr className="border-border my-2" />
            <div className="overline text-xs text-muted-foreground flex items-center gap-1">
              <IdentificationCard size={14} /> Dati Alloggiati Web
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data di Nascita</Label>
                <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
              </div>
              <div>
                <Label>Luogo di Nascita</Label>
                <Input placeholder="Es. Roma" value={form.place_of_birth} onChange={(e) => setForm({ ...form, place_of_birth: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Numero Documento (ID/Passaporto)</Label>
              <Input placeholder="Es. CA00000AA" value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value })} />
            </div>

            <Button type="submit" disabled={busy} className="w-full rounded-md h-11">
              {busy ? "Registrazione..." : "Registra Ospite"}
            </Button>
          </form>
        </div>

        {/* Tabella Ospiti */}
        <div className="xl:col-span-2 border border-border rounded-md bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-primary" weight="duotone" />
            <div className="overline">Elenco Soggiorni</div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-muted-foreground">Caricamento ospiti...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">Nessun ospite registrato al momento.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ospite</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Canale</TableHead>
                    <TableHead className="text-right">Lordo</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        {b.guest_first_name} {b.guest_last_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar size={14} />
                          <span>{b.checkin} / {b.checkout}</span>
                          <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            {b.nights} {b.nights === 1 ? "notte" : "notti"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-1 rounded bg-secondary font-medium">
                          {b.channel}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {b.gross_price.toFixed(2)} €
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownloadReceipt(b)}
                            title="Scarica Ricevuta PDF"
                            className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                          >
                            <FilePdf size={18} weight="duotone" />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            title="Elimina"
                            className="p-1.5 rounded text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash size={18} weight="duotone" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
