import { useEffect, useState, useCallback } from "react";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, DownloadSimple, CaretLeft, CaretRight } from "@phosphor-icons/react";

const MONTHS = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const DAYS_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const CHANNEL_BG = { Airbnb: "#D16A54", Booking: "#4A6D7C", Direct: "#1E3B2E", Other: "#C7A667" };

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }

export default function Calendar() {
  const [bookings, setBookings] = useState([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const [icalOpen, setIcalOpen] = useState(false);
  const [form, setForm] = useState(defaultForm());
  const [icalForm, setIcalForm] = useState({ url: "", channel: "Airbnb", default_price: 80 });

  function defaultForm() {
    return { guest_first_name: "", guest_last_name: "", checkin: "", checkout: "", gross_price: 80, channel: "Direct", notes: "" };
  }

  const load = useCallback(() => api.get("/bookings").then((r) => setBookings(r.data)), []);
  useEffect(() => { load(); }, [load]);

  const y = cursor.getFullYear(), m = cursor.getMonth();
  const first = new Date(y, m, 1);
  const weekdayOffset = (first.getDay() + 6) % 7; // Monday=0
  const totalDays = daysInMonth(y, m);
  const cells = [];
  for (let i = 0; i < weekdayOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);

  const bookingsOnDay = (d) => {
    if (!d) return [];
    const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return bookings.filter((b) => b.checkin.slice(0, 10) <= iso && iso < b.checkout.slice(0, 10));
  };

  const submit = async () => {
    try {
      await api.post("/bookings", form);
      toast.success("Prenotazione creata");
      setOpen(false); setForm(defaultForm()); load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const importIcal = async () => {
    try {
      const { data } = await api.post("/bookings/ical-import", icalForm);
      toast.success(`Importate ${data.imported}, saltate ${data.skipped}`);
      setIcalOpen(false); load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="overline">Prenotazioni</div>
          <h1 className="font-serif text-5xl mt-2">Calendario</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={icalOpen} onOpenChange={setIcalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="btn-open-ical" className="rounded-md"><DownloadSimple size={16} className="mr-2" /> Importa iCal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Importa iCal</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>URL iCal (Airbnb/Booking)</Label>
                  <Input value={icalForm.url} onChange={(e) => setIcalForm({ ...icalForm, url: e.target.value })} data-testid="ical-url" placeholder="https://..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Canale</Label>
                    <Select value={icalForm.channel} onValueChange={(v) => setIcalForm({ ...icalForm, channel: v })}>
                      <SelectTrigger data-testid="ical-channel"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Airbnb">Airbnb</SelectItem>
                        <SelectItem value="Booking">Booking</SelectItem>
                        <SelectItem value="Other">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prezzo default (€/notte)</Label>
                    <Input type="number" value={icalForm.default_price} onChange={(e) => setIcalForm({ ...icalForm, default_price: parseFloat(e.target.value) })} />
                  </div>
                </div>
              </div>
              <DialogFooter><Button onClick={importIcal} data-testid="ical-submit">Importa</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="btn-new-booking" className="rounded-md"><Plus size={16} className="mr-2" /> Nuova prenotazione</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Nuova prenotazione</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input value={form.guest_first_name} onChange={(e) => setForm({ ...form, guest_first_name: e.target.value })} data-testid="b-first-name" /></div>
                <div><Label>Cognome</Label><Input value={form.guest_last_name} onChange={(e) => setForm({ ...form, guest_last_name: e.target.value })} data-testid="b-last-name" /></div>
                <div><Label>Check-in</Label><Input type="date" value={form.checkin} onChange={(e) => setForm({ ...form, checkin: e.target.value })} data-testid="b-checkin" /></div>
                <div><Label>Check-out</Label><Input type="date" value={form.checkout} onChange={(e) => setForm({ ...form, checkout: e.target.value })} data-testid="b-checkout" /></div>
                <div><Label>Prezzo lordo (€)</Label><Input type="number" value={form.gross_price} onChange={(e) => setForm({ ...form, gross_price: parseFloat(e.target.value) })} data-testid="b-price" /></div>
                <div>
                  <Label>Canale</Label>
                  <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                    <SelectTrigger data-testid="b-channel"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Direct">Diretto</SelectItem>
                      <SelectItem value="Airbnb">Airbnb</SelectItem>
                      <SelectItem value="Booking">Booking</SelectItem>
                      <SelectItem value="Other">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={submit} data-testid="b-submit">Salva</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border border-border rounded-md bg-card p-6" data-testid="calendar-grid">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCursor(new Date(y, m - 1, 1))} className="p-2 rounded-md hover:bg-muted transition-colors" data-testid="cal-prev"><CaretLeft size={18} /></button>
          <h2 className="font-serif text-3xl">{MONTHS[m]} <span className="text-muted-foreground">{y}</span></h2>
          <button onClick={() => setCursor(new Date(y, m + 1, 1))} className="p-2 rounded-md hover:bg-muted transition-colors" data-testid="cal-next"><CaretRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs overline text-center mb-2">
          {DAYS_SHORT.map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            const bs = bookingsOnDay(d);
            const cellKey = d ? `${y}-${m}-${d}` : `empty-${i}`;
            return (
              <div key={cellKey} className={`min-h-24 border border-border rounded-md p-2 ${d ? "bg-background" : "bg-muted/30"}`}>
                {d && (
                  <>
                    <div className="text-xs font-medium mb-1">{d}</div>
                    <div className="space-y-1">
                      {bs.slice(0, 3).map((b) => (
                        <div key={b.id} className="text-[10px] text-white px-1.5 py-0.5 rounded truncate" style={{ background: CHANNEL_BG[b.channel] || "#888" }} title={`${b.guest_first_name} ${b.guest_last_name}`}>
                          {b.guest_first_name} {b.guest_last_name}
                        </div>
                      ))}
                      {bs.length > 3 && <div className="text-[10px] text-muted-foreground">+{bs.length - 3}</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
