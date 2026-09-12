import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import AdminPage from "@/components/AdminPage";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

const EMPTY_FILTERS = { search: "", action: "all", entity_type: "all", entity_id: "", from: "", to: "" };

export default function AdminAudit() {
  const [logs, setLogs] = useState(null);
  const [options, setOptions] = useState({ actions: [], entity_types: [] });
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    base44.functions.invoke("adminAuditFilters", {}).then(({ data }) => setOptions(data));
  }, []);

  const load = () => {
    const query = { ...filters };
    if (query.action === "all") delete query.action;
    if (query.entity_type === "all") delete query.entity_type;
    Object.keys(query).forEach((k) => { if (!query[k]) delete query[k]; });
    base44.functions.invoke("adminAudit", query).then(({ data }) => setLogs(data.logs));
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const reset = () => { setFilters(EMPTY_FILTERS); setTimeout(load, 0); };

  return (
    <AdminPage title="Auditoría" description="Registro histórico de operaciones relevantes; no admite eliminación desde la interfaz.">
      <div className="mb-4 grid gap-2 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input placeholder="Buscar en la descripción" value={filters.search} onChange={(e) => set("search", e.target.value)} />
        <Select value={filters.action} onValueChange={(v) => set("action", v)}>
          <SelectTrigger><SelectValue placeholder="Acción" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            {options.actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.entity_type} onValueChange={(v) => set("entity_type", v)}>
          <SelectTrigger><SelectValue placeholder="Entidad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las entidades</SelectItem>
            {options.entity_types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="ID de sorteo/participación/etc." value={filters.entity_id} onChange={(e) => set("entity_id", e.target.value)} />
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Desde</label>
          <Input type="date" value={filters.from} onChange={(e) => set("from", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Hasta</label>
          <Input type="date" value={filters.to} onChange={(e) => set("to", e.target.value)} />
        </div>
        <div className="flex items-end gap-2 lg:col-span-2">
          <Button onClick={load} className="flex-1">Aplicar filtros</Button>
          <Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4" /> Limpiar</Button>
        </div>
      </div>

      <div className="space-y-3">
        {logs?.map((log) => (
          <div key={log.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <b className="text-sm text-foreground">{log.action}</b>
              <time className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString("es-AR")}</time>
            </div>
            <p className="mt-2 text-sm text-foreground/80">{log.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {log.user_role?.toUpperCase()}{log.user_email ? ` · ${log.user_email}` : ""} · {log.entity_type} · {log.entity_id}
            </p>
          </div>
        ))}
        {logs === null && <p className="text-muted-foreground">Cargando auditoría…</p>}
        {logs?.length === 0 && <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">Ningún evento coincide con los filtros aplicados.</p>}
      </div>
    </AdminPage>
  );
}
