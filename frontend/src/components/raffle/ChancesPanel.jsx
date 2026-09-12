import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Minus } from "lucide-react";

export default function ChancesPanel({ participationId, readOnly = false }) {
  const [data, setData] = useState(null);
  const [amount, setAmount] = useState("1");
  const [reason, setReason] = useState("");
  const [sign, setSign] = useState(1); // 1 = sumar, -1 = restar
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await base44.functions.invoke("adminChances", { action: "list", participation_id: participationId });
    setData(data);
  };
  useEffect(() => { load(); }, [participationId]);

  const submit = async () => {
    const parsed = Math.abs(parseInt(amount, 10));
    if (!Number.isInteger(parsed) || parsed <= 0) {
      toast({ title: "Ingresá una cantidad válida", variant: "destructive" });
      return;
    }
    if (!reason.trim()) {
      toast({ title: "El motivo es obligatorio", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await base44.functions.invoke("adminChances", {
        action: "assign",
        participation_id: participationId,
        amount: parsed * sign,
        reason: reason.trim(),
      });
      toast({ title: "Movimiento registrado" });
      setAmount("1");
      setReason("");
      await load();
    } catch (e) {
      toast({ title: "No se pudo registrar", description: e.response?.data?.error || e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">Chances</p>
        <span className="text-lg font-semibold">{data ? data.total : "…"}</span>
      </div>

      {readOnly ? (
        <p className="mt-2 text-xs text-muted-foreground/70">
          Este sorteo ya se sorteó o se canceló: el historial de chances queda congelado y no se puede modificar.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex overflow-hidden rounded-lg border">
            <button
              type="button"
              className={`px-3 py-2 text-sm ${sign === 1 ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}
              onClick={() => setSign(1)}
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`px-3 py-2 text-sm ${sign === -1 ? "bg-red-600 text-white" : "bg-muted text-muted-foreground"}`}
              onClick={() => setSign(-1)}
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
          <Input
            type="number"
            min="1"
            className="w-24"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={busy}
          />
          <Input
            placeholder="Motivo (obligatorio)"
            className="flex-1 min-w-[180px]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={busy}
          />
          <Button size="sm" onClick={submit} disabled={busy}>
            {sign === 1 ? "Asignar" : "Restar"}
          </Button>
        </div>
      )}

      {data?.transactions?.length > 0 && (
        <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs text-foreground">
            <tbody>
              {data.transactions.map((t) => (
                <tr key={t.id} className="border-t border-border first:border-t-0">
                  <td className="px-3 py-2 font-medium">
                    <span className={t.amount > 0 ? "text-emerald-400" : "text-red-400"}>
                      {t.amount > 0 ? `+${t.amount}` : t.amount}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{t.reason}</td>
                  <td className="px-3 py-2 text-muted-foreground/70">{t.created_by_email}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground/70">{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && !data.transactions?.length && (
        <p className="mt-2 text-xs text-muted-foreground/70">Todavía no se asignaron chances a esta participación.</p>
      )}
    </div>
  );
}
