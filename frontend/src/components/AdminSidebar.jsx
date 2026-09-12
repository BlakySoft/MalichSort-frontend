import { NavLink } from "react-router-dom";
import { LayoutDashboard, Ticket, ClipboardList, Users, Trophy, Image, FileText, ScrollText, Banknote } from "lucide-react";

const links = [
  ["/admin", "Dashboard", LayoutDashboard],
  ["/admin/sorteos", "Sorteos", Ticket],
  ["/admin/participaciones", "Participaciones", ClipboardList],
  ["/admin/usuarios", "Usuarios", Users],
  ["/admin/ganadores", "Ganadores", Trophy],
  ["/admin/fotos", "Fotos", Image],
  ["/admin/reembolsos", "Reembolsos", Banknote],
  ["/admin/terminos", "Versiones de términos", FileText],
  ["/admin/auditoria", "Auditoría", ScrollText],
];

export default function AdminSidebar() {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-2 lg:sticky lg:top-6 lg:h-fit lg:flex-col lg:overflow-visible lg:pb-0">
      {links.map(([to, label, Icon]) => (
        <NavLink
          key={to}
          end={to === "/admin"}
          to={to}
          className={({ isActive }) =>
            `flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              isActive
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`
          }
        >
          <Icon className="h-4 w-4" /> {label}
        </NavLink>
      ))}
    </nav>
  );
}
