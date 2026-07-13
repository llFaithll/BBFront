import { useEffect, useState, useCallback } from "react";
import { api, eur, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash, Warning, Pencil } from "@phosphor-icons/react";

const empty = { name: "", category: "Generale", quantity: 0, unit: "pz", min_threshold: 0, price_per_unit: 0 };

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const load = useCallback(() => api.get("/inventory").then((r) => setItems(r.data)), []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    try {
      if (editId) await api.put(`/inventory/${editId}`, form);
      else await api.post("/inventory", form);
      toast.success("Salvato"); setOpen(false); load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const del = async (id) => { await api.delete(`/inventory/${id}`); load(); };
  const openEdit = (it) => { setForm(it); setEditId(it.id); setOpen(true); };
  const openNew = () => { setForm(empty); setEditId(null); setOpen(true); };

  const lowStock = items.filter((i) => i.quantity <= i.min_threshold);

  return (
    <div className="p-8 lg:p-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="overline">Scorte &amp; Amenities</div>
          <h1 className="font-serif text-5xl mt-2">Magazzino</h1>
        </div>
        <Button onClick={openNew} data-testid="btn-add-inventory" className="rounded-md"><Plus size={16} className="mr-2" /> Aggiungi prodotto</Button>
      </div>

      {lowStock.length > 0 && (
        <div className="mb-6 border border-accent/40 rounded-md bg-accent/10 p-4 flex items-center gap-3" data-testid="low-stock-alert">
          <Warning size={20} className="text-accent" weight="duotone" />
          <div className="text-sm"><strong>{lowStock.length}</strong> prodotti sotto soglia: {lowStock.map((l) => l.name).join(", ")}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-in" data-testid="inventory-grid">
        {items.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-16">Nessun prodotto. Inizia aggiungendone uno.</div>
        ) : items.map((it) => {
          const low = it.quantity <= it.min_threshold;
          return (
            <div key={it.id} className={`border rounded-md p-5 bg-card transition-transform hover:-translate-y-1 ${low ? "border-accent" : "border-border"}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="overline text-[10px]">{it.category}</div>
                  <div className="font-serif text-2xl mt-1">{it.name}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(it)} className="p-1.5 rounded hover:bg-muted transition-colors" data-testid={`inv-edit-${it.id}`}><Pencil size={14} /></button>
                  <button onClick={() => del(it.id)} className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors" data-testid={`inv-del-${it.id}`}><Trash size={14} /></button>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className={`kpi-num text-4xl ${low ? "text-accent" : ""}`}>{it.quantity}</span>
                <span className="text-sm text-muted-foreground">{it.unit}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">Soglia min: {it.min_threshold} · {eur(it.price_per_unit)}/{it.unit}</div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Modifica prodotto" : "Nuovo prodotto"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="inv-name" /></div>
            <div><Label>Categoria</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Bagno, Cucina, Colazione…" /></div>
            <div><Label>Unità</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pz, kg, l" /></div>
            <div><Label>Quantità</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) })} /></div>
            <div><Label>Soglia minima</Label><Input type="number" value={form.min_threshold} onChange={(e) => setForm({ ...form, min_threshold: parseFloat(e.target.value) })} /></div>
            <div className="col-span-2"><Label>Prezzo unitario (€)</Label><Input type="number" step="0.01" value={form.price_per_unit} onChange={(e) => setForm({ ...form, price_per_unit: parseFloat(e.target.value) })} /></div>
          </div>
          <DialogFooter><Button onClick={submit} data-testid="inv-save">Salva</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
