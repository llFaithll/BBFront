import { useEffect, useState, useCallback } from "react";
import { api, eur, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash, CheckCircle } from "@phosphor-icons/react";

const empty = { name: "", category: "TARI", amount: 0, due_date: "", recurrence: "yearly", paid: false, notes: "" };
const CATS = ["TARI", "IMU", "Condominio", "Bollette", "Assicurazione", "Manutenzione", "Altro"];

export default function Expenses() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const load = useCallback(() => api.get("/expenses").then((r) => setItems(r.data)), []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try {
      await api.post("/expenses", form);
      toast.success("Spesa salvata"); setOpen(false); setForm(empty); load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const del = async (id) => { await api.delete(`/expenses/${id}`); load(); };
  const togglePaid = async (it) => {
    await api.put(`/expenses/${it.id}`, { ...it, paid: !it.paid });
    load();
  };

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = items.filter((e) => !e.paid && e.due_date >= today);
  const overdue = items.filter((e) => !e.paid && e.due_date < today);
  const totalDue = [...upcoming, ...overdue].reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-8 lg:p-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="overline">Costi fissi &amp; scadenze</div>
          <h1 className="font-serif text-5xl mt-2">Scadenziario</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="btn-add-expense" className="rounded-md"><Plus size={16} className="mr-2" /> Nuova spesa</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuova spesa</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Descrizione</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="exp-name" /></div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger data-testid="exp-cat"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Importo (€)</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })} data-testid="exp-amount" /></div>
              <div><Label>Scadenza</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} data-testid="exp-date" /></div>
              <div>
                <Label>Ricorrenza</Label>
                <Select value={form.recurrence} onValueChange={(v) => setForm({ ...form, recurrence: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Una tantum</SelectItem>
                    <SelectItem value="monthly">Mensile</SelectItem>
                    <SelectItem value="quarterly">Trimestrale</SelectItem>
                    <SelectItem value="yearly">Annuale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={submit} data-testid="exp-save">Salva</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="border border-border rounded-md bg-card p-6"><div className="overline">Totale da pagare</div><div className="kpi-num text-4xl mt-2">{eur(totalDue)}</div></div>
        <div className="border border-border rounded-md bg-card p-6"><div className="overline">In scadenza</div><div className="kpi-num text-4xl mt-2">{upcoming.length}</div></div>
        <div className="border border-destructive/50 rounded-md bg-destructive/5 p-6"><div className="overline text-destructive">Scadute</div><div className="kpi-num text-4xl mt-2 text-destructive">{overdue.length}</div></div>
      </div>

      <div className="border border-border rounded-md bg-card overflow-hidden">
        <table className="w-full text-sm" data-testid="expenses-table">
          <thead className="border-b border-border bg-muted/50">
            <tr className="text-left">
              {["Stato", "Descrizione", "Categoria", "Importo", "Scadenza", "Ricorrenza", ""].map((h) => <th key={h} className="px-4 py-3 overline font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Nessuna spesa registrata.</td></tr>
            ) : items.map((e) => {
              const isOverdue = !e.paid && e.due_date < today;
              return (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => togglePaid(e)} data-testid={`exp-toggle-${e.id}`}>
                      <CheckCircle size={22} weight={e.paid ? "fill" : "regular"} className={e.paid ? "text-primary" : "text-muted-foreground"} />
                    </button>
                  </td>
                  <td className="px-4 py-3">{e.name}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded bg-muted">{e.category}</span></td>
                  <td className="px-4 py-3 kpi-num">{eur(e.amount)}</td>
                  <td className={`px-4 py-3 font-mono text-xs ${isOverdue ? "text-destructive font-bold" : ""}`}>{e.due_date}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.recurrence}</td>
                  <td className="px-4 py-3"><button onClick={() => del(e.id)} className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors" data-testid={`exp-del-${e.id}`}><Trash size={14} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
