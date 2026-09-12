import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import AdminPage from "@/components/AdminPage";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { PARTICIPATION_LABELS, PARTICIPATION_COLORS } from "@/lib/participationStatus";
import ParticipationReview from "@/components/raffle/ParticipationReview";
import { RefreshCw } from "lucide-react";

export default function AdminParticipations() {
  const [items, setItems] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [reviewing, setReviewing] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      const { data } = await base44.functions.invoke("adminParticipations", { action: "list" });
      setItems(data.participations);
    } catch (e) {
      toast({ title: "Error", description: e.response?.data?.error || e.message, variant: "destructive" });
    }
  };
  useEffect(() => { load(); }, []);

  // Auto-refresco solo si NO hay un modal de revisión abierto: evitamos que
  // la lista se reordene o cambie debajo del admin mientras está resolviendo
  // una solicitud puntual.
  useEffect(() => {
    if (reviewing) return;
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [reviewing]);

  const filtered = (items || []).filter((p) => {
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${p.user?.first_name || ""} ${p.user?.last_name || ""} ${p.user?.email || ""} ${p.user?.cuil || ""} ${p.raffle?.name || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <AdminPage title="Participaciones" description="Revisión y aprobación manual de solicitudes de participación.">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input placeholder="Buscar por participante, CUIL, email o sorteo" className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            {Object.keys(PARTICIPATION_LABELS).map((s) => <SelectItem key={s} value={s}>{PARTICIPATION_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load} className="ml-auto"><RefreshCw className="h-4 w-4" /> Actualizar</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm text-foreground">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>{["Participante", "Sorteo", "Solicitud", "Estado", "Chances", "Acción"].map((x) => <th key={x} className="px-4 py-3 font-medium">{x}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-4">
                  <b>{p.user ? `${p.user.first_name} ${p.user.last_name}` : "—"}</b>
                  <div className="text-muted-foreground">{p.user?.email || ""}</div>
                </td>
                <td className="px-4 py-4">{p.raffle?.name || "—"}</td>
                <td className="px-4 py-4">{new Date(p.requested_at).toLocaleDateString()}</td>
                <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-medium ${PARTICIPATION_COLORS[p.status]}`}>{PARTICIPATION_LABELS[p.status]}</span></td>
                <td className="px-4 py-4">{p.status === "APPROVED" ? p.chances_total : "—"}</td>
                <td className="px-4 py-4"><Button size="sm" variant="outline" onClick={() => setReviewing(p)}>Revisar</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {items === null && <p className="p-6 text-muted-foreground">Cargando…</p>}
        {items !== null && !filtered.length && <p className="p-6 text-muted-foreground">No hay participaciones que coincidan.</p>}
      </div>

      <ParticipationReview participation={reviewing} onClose={() => setReviewing(null)} onSaved={async () => { setReviewing(null); await load(); }} />
    </AdminPage>
  );
}