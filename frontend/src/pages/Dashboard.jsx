import { useEffect, useState, useCallback } from "react";
import { api, eur, pct } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendUp, House, CurrencyEur, Percent } from "@phosphor-icons/react";

const CHANNEL_COLORS = ["#1E3B2E", "#D16A54", "#C7A667", "#4A6D7C"];
const TOOLTIP_STYLE = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" };
const LEGEND_STYLE = { fontSize: 12 };
const BAR_RADIUS = [4, 4, 0, 0];
const PIE_OUTER_R = 80;
const PIE_INNER_R = 45;

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/dashboard/stats");
      setStats(data);
    } catch {
      // Silent: stats will remain null and UI shows loading state
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!stats) return <div className="p-10 text-muted-foreground">Caricamento…</div>;

  const kpis = [
    { key: "gross", label: "Ricavo Lordo (anno)", value: eur(stats.year_gross), icon: CurrencyEur, big: true, tid: "kpi-gross" },
    { key: "net", label: "Ricavo Netto (anno)", value: eur(stats.year_net), icon: TrendUp, big: true, tid: "kpi-net" },
    { key: "occupancy", label: "Occupazione", value: pct(stats.occupancy_pct), icon: Percent, tid: "kpi-occupancy" },
    { key: "bookings", label: "Prenotazioni", value: stats.year_bookings, icon: House, tid: "kpi-bookings" },
  ];

  return (
    <div className="p-8 lg:p-12 stagger-in">
      <div className="flex items-baseline justify-between mb-10">
        <div>
          <div className="overline">Panoramica · {new Date().getFullYear()}</div>
          <h1 className="font-serif text-5xl lg:text-6xl mt-2">Buongiorno.</h1>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          Ultimo aggiornamento<br />
          <span className="text-foreground">{new Date().toLocaleString("it-IT")}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="kpi-grid">
        {kpis.map((k) => (
          <div key={k.key} data-testid={k.tid} className="border border-border rounded-md bg-card p-6 hover:-translate-y-1 transition-transform">
            <div className="flex items-center justify-between">
              <div className="overline">{k.label}</div>
              <k.icon size={20} weight="duotone" className="text-accent" />
            </div>
            <div className={`kpi-num mt-4 ${k.big ? "text-5xl lg:text-6xl" : "text-4xl"}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-border rounded-md bg-card p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="overline">Ricavi Mensili</div>
              <h2 className="font-serif text-2xl mt-1">Andamento anno corrente</h2>
            </div>
          </div>
          <div className="h-72" data-testid="chart-monthly">
            <ResponsiveContainer>
              <BarChart data={stats.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => eur(v)} />
                <Bar dataKey="revenue" fill="#1E3B2E" radius={BAR_RADIUS} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border rounded-md bg-card p-6">
          <div className="overline">Canali</div>
          <h2 className="font-serif text-2xl mt-1 mb-4">Performance</h2>
          {stats.channels.length === 0 ? (
            <div className="text-sm text-muted-foreground py-12 text-center">Nessuna prenotazione ancora</div>
          ) : (
            <div className="h-64" data-testid="chart-channels">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={stats.channels} dataKey="revenue" nameKey="channel" outerRadius={PIE_OUTER_R} innerRadius={PIE_INNER_R} paddingAngle={2}>
                    {stats.channels.map((c, i) => <Cell key={c.channel} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => eur(v)} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
