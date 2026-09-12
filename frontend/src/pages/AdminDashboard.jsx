import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AdminPage from "@/components/AdminPage";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    base44.functions.invoke("adminRaffles", { action: "list" })
      .then(({ data }) => {
        const r = data.raffles || [];
        setStats({
          active: r.filter((x) => x.status === "ACTIVE").length,
          upcoming: r.filter((x) => x.status === "UPCOMING").length,
          closed: r.filter((x) => ["CLOSED", "DRAWN", "CANCELLED"].includes(x.status)).length,
          draft: r.filter((x) => x.status === "DRAFT").length
        });
      })
      .catch(() => setStats({ active: 0, upcoming: 0, closed: 0, draft: 0 }));
  }, []);

  const items = [
    ["Sorteos", "Crear, editar y publicar sorteos.", "/admin/sorteos"],
    ["Participaciones", "Revisar, aprobar y asignar chances.", "/admin/participaciones"],
    ["Usuarios", "Consultar perfiles y gestionar roles autorizados.", "/admin/usuarios"],
    ["Ganadores", "Historial de sorteos realizados y pendientes.", "/admin/ganadores"],
    ["Fotos", "Galería de fotos de ganadores para el Salón de la fama.", "/admin/fotos"],
    ["Reembolsos", "Gestionar devoluciones de sorteos cancelados.", "/admin/reembolsos"],
    ["Versiones de términos", "Crear y publicar una única versión vigente.", "/admin/terminos"],
    ["Auditoría", "Revisar las operaciones relevantes registradas.", "/admin/auditoria"]
  ];

  return (
    <AdminPage title="Dashboard" description="Controles básicos de la plataforma.">
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["Activos", stats.active], ["Próximos", stats.upcoming], ["Finalizados", stats.closed], ["Borradores", stats.draft]].map(([label, val]) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{val}</p>
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {items.map(([title, text, to]) => (
          <Link key={to} to={to} className="rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md">
            <h2 className="font-semibold text-foreground">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
          </Link>
        ))}
      </div>
    </AdminPage>
  );
}