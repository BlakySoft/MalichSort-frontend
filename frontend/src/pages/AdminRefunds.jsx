import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatCuil } from "@/lib/profileValidation";
import AdminPage from "@/components/AdminPage";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const STATUS_LABELS = { PENDING: "Pendiente", MARKED_PAID: "Reembolsado (esperando confirmación)", CONFIRMED: "Confirmado por el usuario" };
const STATUS_COLORS = { PENDING: "bg-amber-500/15 text-amber-300", MARKED_PAID: "bg-sky-500/15 text-sky-300", CONFIRMED: "bg-emerald-500/15 text-emerald-300" };

export default function AdminRefunds() {
  const [refunds, setRefunds] = useState(null);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [busyId, setBusyId] = useState(null);
  const { toast } = useToast();

  const load = () => {
    const query = statusFilter === "ALL" ? {} : { status: statusFilter };
    base44.functions.invoke("adminRefunds", { action: "list", ...query }).then(({ data }) => setRefunds(data.refunds));
  };
  useEffect(() => { load(); }, [statusFilter]);

  const markPaid = async (id) => {
    setBusyId(id);
    try {
      await base44.functions.invoke("adminRefunds", { action: "markPaid", id });
      toast({ title: "Marcado como reembolsado", description: "El usuario va a poder confirmar la recepción desde su cuenta." });
      load();
    } catch (e) {
      toast({ title: "No se pudo marcar", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminPage title="Reembolsos" description="Participantes aprobados de sorteos cancelados que deben recibir su dinero de vuelta.">
      <div className="mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="PENDING">Pendientes</SelectItem>
            <SelectItem value="MARKED_PAID">Reembolsados (esperando confirmación)</SelectItem>
            <SelectItem value="CONFIRMED">Confirmados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm text-foreground">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>{["Participante", "CUIL", "CVU/CBU", "Sorteo", "Chances", "Estado", "Acción"].map((x) => <th key={x} className="px-4 py-3 font-medium">{x}</th>)}</tr>
          </thead>
          <tbody>
            {refunds?.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-4"><b>{r.first_name} {r.last_name}</b><div className="text-muted-foreground">{r.email}</div></td>
                <td className="px-4 py-4">{r.cuil ? formatCuil(r.cuil) : "—"}</td>
                <td className="px-4 py-4 font-mono text-xs">{r.cvu_cbu_snapshot || "—"}</td>
                <td className="px-4 py-4">{r.raffle_name}</td>
                <td className="px-4 py-4">{r.chances_snapshot}</td>
                <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span></td>
                <td className="px-4 py-4">
                  {r.status === "PENDING" && (
                    <Button size="sm" disabled={busyId === r.id} onClick={() => markPaid(r.id)}>Marcar como reembolsado</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {refunds === null && <p className="p-6 text-muted-foreground">Cargando reembolsos…</p>}
        {refunds?.length === 0 && <p className="p-6 text-muted-foreground">No hay reembolsos que coincidan con el filtro.</p>}
      </div>
    </AdminPage>
  );
}
