import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AdminPage from "@/components/AdminPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/raffleStatus";
import RaffleForm from "@/components/raffle/RaffleForm";
import ProcessingOverlay from "@/components/form/ProcessingOverlay";
import { Plus } from "lucide-react";

export default function AdminRaffles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [raffles, setRaffles] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingCreate, setSavingCreate] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await base44.functions.invoke("adminRaffles", { action: "list" });
    setRaffles(data.raffles);
    return data.raffles;
  };
  useEffect(() => {
    load().then((list) => {
      // Si llegamos con ?open=<id> (por ejemplo desde /admin/ganadores en un
      // sorteo pendiente de sortear), abrimos directo el mismo modal que
      // abriría el botón "Editar", sin que el admin tenga que buscarlo.
      const openId = searchParams.get("open");
      if (openId) {
        const target = list.find((r) => r.id === openId);
        if (target) setEditing(target);
        setSearchParams({}, { replace: true });
      }
    });
  }, []);

  // Auto-refresco cada 20s, solo si no hay ningún modal abierto: así el
  // estado (por ejemplo, un cambio automático de ACTIVE a CLOSED por fecha)
  // se refleja solo, sin arriesgarse a interrumpir al admin mientras edita
  // o crea un sorteo.
  useEffect(() => {
    if (editing || creating) return;
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [editing, creating]);

  const filtered = (raffles || []).filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (search && !`${r.name} ${r.slug} ${r.prize_title}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const createRaffle = async () => {
    setSavingCreate(true);
    try {
      const { data } = await base44.functions.invoke("adminRaffles", { action: "create", name: newName });
      setCreating(false);
      setNewName("");
      await load();
      setEditing(data.raffle);
    } catch (e) {
      toast({ title: "Error", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setSavingCreate(false);
    }
  };

  return (
    <AdminPage title="Sorteos" description="Gestión administrativa de sorteos y premios.">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input placeholder="Buscar por nombre, slug o premio" className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            {Object.keys(STATUS_LABELS).map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setCreating(true)} className="ml-auto"><Plus className="h-4 w-4" /> Nuevo sorteo</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm text-foreground">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>{["Sorteo", "Premio", "Estado", "Inicio", "Fin", "Creado por", "Acciones"].map((x) => <th key={x} className="px-4 py-3 font-medium">{x}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-4"><b>{r.name}</b><div className="text-muted-foreground">/{r.slug}</div></td>
                <td className="px-4 py-4">{r.prize_title || "—"}</td>
                <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span></td>
                <td className="px-4 py-4">{r.start_date ? new Date(r.start_date).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-4">{r.end_date ? new Date(r.end_date).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-4">{r.created_by || "—"}<div className="text-muted-foreground">{new Date(r.created_date).toLocaleDateString()}</div></td>
                <td className="px-4 py-4"><Button size="sm" variant="outline" onClick={() => setEditing(r)}>Editar</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {raffles === null && <p className="p-6 text-muted-foreground">Cargando sorteos…</p>}
        {raffles !== null && !filtered.length && <p className="p-6 text-muted-foreground">No hay sorteos que coincidan.</p>}
      </div>

      <RaffleForm
        raffle={editing}
        onClose={() => setEditing(null)}
        onSaved={async ({ keepOpen } = {}) => {
          const list = await load();
          if (keepOpen && editing) {
            const updated = list.find((r) => r.id === editing.id);
            setEditing(updated || null);
          } else {
            setEditing(null);
          }
        }}
      />

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-md">
          <ProcessingOverlay active={savingCreate} label="Creando sorteo…" />
          <DialogHeader><DialogTitle>Nuevo sorteo</DialogTitle></DialogHeader>
          <Input placeholder="Nombre del sorteo" value={newName} onChange={(e) => setNewName(e.target.value)} disabled={savingCreate} />
          <DialogFooter><Button onClick={createRaffle} disabled={savingCreate || !newName.trim()}>Crear borrador</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}