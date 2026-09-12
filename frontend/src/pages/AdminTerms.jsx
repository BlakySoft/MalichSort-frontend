import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import AdminPage from "@/components/AdminPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ProcessingOverlay from "@/components/form/ProcessingOverlay";
import { useToast } from "@/components/ui/use-toast";

export default function AdminTerms() {
  const { toast } = useToast();
  const [terms, setTerms] = useState(null);
  const [form, setForm] = useState({ version: "", title: "", content: "" });
  const [processing, setProcessing] = useState(false);
  const load = () => base44.functions.invoke("adminTerms", { action: "list" }).then(({ data }) => setTerms(data.terms));
  useEffect(() => { load(); }, []);
  const create = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try { await base44.functions.invoke("adminTerms", { action: "create", ...form }); setForm({ version: "", title: "", content: "" }); await load(); }
    catch (err) { toast({ title: "No se pudo crear", description: err.response?.data?.error || err.message, variant: "destructive" }); }
    finally { setProcessing(false); }
  };
  const publish = async (id) => {
    setProcessing(true);
    try { await base44.functions.invoke("adminTerms", { action: "publish", terms_version_id: id }); await load(); }
    catch (err) { toast({ title: "No se pudo publicar", description: err.response?.data?.error || err.message, variant: "destructive" }); }
    finally { setProcessing(false); }
  };
  return (
    <AdminPage title="Versiones de términos" description="Las versiones publicadas permanecen históricas y no se sobrescriben.">
      <div className="relative grid gap-6 lg:grid-cols-[360px_1fr]">
        <ProcessingOverlay active={processing} />
        <form onSubmit={create} className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground">Nueva versión</h2>
          <Input placeholder="Versión, ej. 1.0" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} disabled={processing} required />
          <Input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} disabled={processing} required />
          <Textarea className="min-h-48" placeholder="Contenido completo" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} disabled={processing} required />
          <Button className="w-full" disabled={processing}>Crear borrador inmutable</Button>
        </form>
        <div className="space-y-3">
          {terms?.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
              <div><p className="font-semibold text-foreground">{item.version} · {item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.active ? "Vigente" : item.published_at ? "Publicada anteriormente" : "Borrador"}</p></div>
              {!item.active && <Button variant="outline" onClick={() => publish(item.id)} disabled={processing}>Publicar</Button>}
            </div>
          ))}
          {terms === null && <p className="text-muted-foreground">Cargando versiones…</p>}
        </div>
      </div>
    </AdminPage>
  );
}