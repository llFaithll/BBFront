import { useEffect, useState, useCallback } from "react";
import { api, API, formatApiError } from "@/lib/api";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle, Upload, House, UserPlus, Trash, IdentificationCard } from "@phosphor-icons/react";

const CHANNELS = [
  { v: "Direct", l: "Diretto" }, { v: "Airbnb", l: "Airbnb" },
  { v: "Booking", l: "Booking.com" }, { v: "Other", l: "Altro" },
];
const DOC_TYPES = [
  { v: "IDENT", l: "Carta d'identità" },
  { v: "PASOR", l: "Passaporto ordinario" },
  { v: "PATEN", l: "Patente" },
];

const emptyMainGuest = {
  guest_first_name: "", guest_last_name: "", checkin: "", checkout: "",
  channel: "Direct", date_of_birth: "", place_of_birth: "", country_of_birth: "ITALIA",
  citizenship: "ITALIA", sex: "M", document_type: "IDENT",
  document_number: "", document_place: "",
};

export default function PublicRegistration() {
  const [form, setForm] = useState(emptyMainGuest);
  const [mainPhotos, setMainPhotos] = useState([]);
  const [additionalGuests, setAdditionalGuests] = useState([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [info, setInfo] = useState(null);

  const loadInfo = useCallback(() => {
    axios.get(`${API}/public/property-info`)
      .then((r) => setInfo(r.data))
      .catch(() => setInfo({ name: "B&B" }));
  }, []);

  useEffect(() => { loadInfo(); }, [loadInfo]);

  const addAdditionalGuest = () => {
    setAdditionalGuests([
      ...additionalGuests,
      {
        guest_first_name: "", guest_last_name: "",
        date_of_birth: "", place_of_birth: "",
        country_of_birth: "ITALIA", citizenship: "ITALIA", sex: "M",
        document_type: "IDENT", document_number: "", document_place: "",
        guest_type: "17",
        photos: []
      }
    ]);
  };

  const removeAdditionalGuest = (index) => {
    const updated = [...additionalGuests];
    updated.splice(index, 1);
    setAdditionalGuests(updated);
  };

  const updateAdditionalGuestField = (index, field, value) => {
    const updated = [...additionalGuests];
    updated[index][field] = value;
    setAdditionalGuests(updated);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      
      // 1. Alleghiamo l'anagrafica del Capogruppo
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      
      // Alleghiamo il file del documento del capogruppo (prendiamo il primo file)
      if (mainPhotos.length > 0) {
        fd.append("main_photo", mainPhotos[0]);
      }

      // 2. Generiamo l'anagrafica JSON degli ospiti extra priva del file binario temporaneo
      const additionalGuestsMetadata = additionalGuests.map(({ photos, ...meta }) => meta);
      fd.append("additional_guests_json", JSON.stringify(additionalGuestsMetadata));

      // 3. Alleghiamo in modo indicizzato i file dei documenti di ciascun ospite extra
      additionalGuests.forEach((guest, idx) => {
        if (guest.photos && guest.photos.length > 0) {
          fd.append(`additional_photo_${idx}`, guest.photos[0]);
        }
      });

      await axios.post(`${API}/public/registration`, fd, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });
      
      setDone(true); 
      toast.success("Registrazione inviata con successo!");
    } catch (err) { 
      toast.error(formatApiError(err.response?.data?.detail)); 
    } finally { 
      setBusy(false); 
    }
  };

  const missingDocuments = mainPhotos.length === 0 || additionalGuests.some(g => !g.photos || g.photos.length === 0);

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <CheckCircle size={72} weight="duotone" className="text-primary mx-auto" />
          <h1 className="font-serif text-5xl mt-6">Grazie!</h1>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            La tua registrazione e quella dei tuoi compagni di viaggio sono state inviate con successo. Ci vediamo il giorno del check-in a <strong>{info?.name || "Casa"}</strong>.
          </p>
          <p className="text-xs text-muted-foreground mt-8">Buon viaggio ✧</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 lg:p-12">
        <div className="flex items-center gap-3 mb-8">
          <House size={28} weight="duotone" className="text-accent" />
          <div>
            <div className="overline">{info?.name || "Casa B&B"}</div>
            <h1 className="font-serif text-4xl lg:text-5xl mt-1 leading-none">Registrazione ospiti</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Compila questo modulo per la registrazione obbligatoria richiesta dalle autorità di Pubblica Sicurezza (Alloggiati Web). Puoi aggiungere più occupanti premendo sul tasto "+ Aggiungi Ospite" in fondo.
        </p>

        <form onSubmit={submit} className="space-y-8" data-testid="public-form">
          
          {/* SEZIONE 1: CAPOGRUPPO (OSPITE PRINCIPALE) */}
          <div className="space-y-6">
            <div className="overline text-primary font-bold flex items-center gap-1.5">
              <IdentificationCard size={18} /> 1. Ospite Principale (Capogruppo)
            </div>

            <section className="border border-border rounded-md bg-card p-6 space-y-4">
              <div className="overline text-xs text-muted-foreground">Dati soggiorno</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input required value={form.guest_first_name} onChange={(e) => setForm({ ...form, guest_first_name: e.target.value })} /></div>
                <div><Label>Cognome</Label><Input required value={form.guest_last_name} onChange={(e) => setForm({ ...form, guest_last_name: e.target.value })} /></div>
                <div><Label>Check-in</Label><Input type="date" required value={form.checkin} onChange={(e) => setForm({ ...form, checkin: e.target.value })} /></div>
                <div><Label>Check-out</Label><Input type="date" required value={form.checkout} onChange={(e) => setForm({ ...form, checkout: e.target.value })} /></div>
                <div className="sm:col-span-2">
                  <Label>Canale di prenotazione</Label>
                  <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CHANNELS.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="border border-border rounded-md bg-card p-6 space-y-4">
              <div className="overline text-xs text-muted-foreground">Dati anagrafici</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Data di nascita</Label><Input type="date" required value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></div>
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
                <div><Label>Comune / Città di nascita</Label><Input required value={form.place_of_birth} onChange={(e) => setForm({ ...form, place_of_birth: e.target.value })} /></div>
                <div><Label>Stato di nascita</Label><Input required value={form.country_of_birth} onChange={(e) => setForm({ ...form, country_of_birth: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Cittadinanza</Label><Input required value={form.citizenship} onChange={(e) => setForm({ ...form, citizenship: e.target.value })} /></div>
              </div>
            </section>

            <section className="border border-border rounded-md bg-card p-6 space-y-4">
              <div className="overline text-xs text-muted-foreground">Documento d'identità</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Tipo documento</Label>
                  <Select value={form.document_type} onValueChange={(v) => setForm({ ...form, document_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DOC_TYPES.map((d) => <SelectItem key={d.v} value={d.v}>{d.l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Numero documento</Label><Input required value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value.toUpperCase() })} /></div>
                <div className="sm:col-span-2"><Label>Luogo di rilascio</Label><Input value={form.document_place} onChange={(e) => setForm({ ...form, document_place: e.target.value })} /></div>
                <div className="sm:col-span-2">
                  <Label>Foto documento (fronte / retro)</Label>
                  <div className="mt-2 border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:border-accent transition-colors" onClick={() => document.getElementById("main-photo-input").click()}>
                    <Upload size={32} weight="duotone" className="mx-auto text-muted-foreground mb-2" />
                    <div className="text-sm">Tocca per caricare · JPG, PNG, PDF (max 15MB)</div>
                    {mainPhotos.length > 0 && <div className="text-xs text-primary mt-2 font-medium">{mainPhotos.length} file selezionato</div>}
                    <input id="main-photo-input" type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setMainPhotos(Array.from(e.target.files || []))} />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* SEZIONE 2: OSPITI ULTERIORI ACCONTENTATI DINAMICAMENTE */}
          <div className="space-y-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="overline text-muted-foreground font-bold">2. Altri ospiti in Camera</div>
              <Button type="button" variant="outline" size="sm" onClick={addAdditionalGuest} className="rounded-md">
                <UserPlus size={16} className="mr-1.5" /> Aggiungi Ospite
              </Button>
            </div>

            {additionalGuests.map((guest, idx) => (
              <div key={idx} className="border border-border rounded-md bg-card p-6 space-y-4 relative pt-12">
                <button type="button" onClick={() => removeAdditionalGuest(idx)} className="absolute top-4 right-4 text-destructive hover:bg-destructive/10 p-1.5 rounded transition-colors" title="Rimuovi Ospite">
                  <Trash size={16} />
                </button>
                <div className="absolute top-4 left-6 text-xs font-semibold bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                  Ospite #{idx + 2}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>Nome</Label><Input required value={guest.guest_first_name} onChange={(e) => updateAdditionalGuestField(idx, "guest_first_name", e.target.value)} /></div>
                  <div><Label>Cognome</Label><Input required value={guest.guest_last_name} onChange={(e) => updateAdditionalGuestField(idx, "guest_last_name", e.target.value)} /></div>
                  <div><Label>Data di nascita</Label><Input type="date" required value={guest.date_of_birth} onChange={(e) => updateAdditionalGuestField(idx, "date_of_birth", e.target.value)} /></div>
                  <div>
                    <Label>Sesso</Label>
                    <Select value={guest.sex} onValueChange={(v) => updateAdditionalGuestField(idx, "sex", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Maschio</SelectItem>
                        <SelectItem value="F">Femmina</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Comune / Città di nascita</Label><Input required value={guest.place_of_birth} onChange={(e) => updateAdditionalGuestField(idx, "place_of_birth", e.target.value)} /></div>
                  <div><Label>Stato di nascita</Label><Input required value={guest.country_of_birth} onChange={(e) => updateAdditionalGuestField(idx, "country_of_birth", e.target.value.toUpperCase())} /></div>
                  <div className="sm:col-span-2"><Label>Cittadinanza</Label><Input required value={guest.citizenship} onChange={(e) => updateAdditionalGuestField(idx, "citizenship", e.target.value.toUpperCase())} /></div>
                  
                  <div>
                    <Label>Tipo documento</Label>
                    <Select value={guest.document_type} onValueChange={(v) => updateAdditionalGuestField(idx, "document_type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{DOC_TYPES.map((d) => <SelectItem key={d.v} value={d.v}>{d.l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Numero documento</Label><Input required value={guest.document_number} onChange={(e) => updateAdditionalGuestField(idx, "document_number", e.target.value.toUpperCase())} /></div>
                  <div className="sm:col-span-2"><Label>Luogo di rilascio</Label><Input value={guest.document_place} onChange={(e) => updateAdditionalGuestField(idx, "document_place", e.target.value)} /></div>
                  
                  <div className="sm:col-span-2">
                    <Label>Foto documento</Label>
                    <div className="mt-2 border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:border-accent transition-colors" onClick={() => document.getElementById(`photo-input-${idx}`).click()}>
                      <Upload size={32} weight="duotone" className="mx-auto text-muted-foreground mb-2" />
                      <div className="text-sm">Tocca per caricare documento ospite</div>
                      {guest.photos && guest.photos.length > 0 && <div className="text-xs text-primary mt-2 font-medium">1 file selezionato</div>}
                      <input id={`photo-input-${idx}`} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => updateAdditionalGuestField(idx, "photos", Array.from(e.target.files || []))} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PULSANTE DI INVIO GENERALE */}
          <Button type="submit" disabled={busy || missingDocuments} className="w-full h-12 rounded-md text-base mt-4">
            {busy ? "Invio in corso…" : "Invia registrazione ospiti"}
          </Button>
          {missingDocuments && <p className="text-xs text-center text-muted-foreground mt-2">Carica le foto dei documenti di tutti gli ospiti per procedere con l'invio.</p>}
        </form>
      </div>
    </div>
  );
}
