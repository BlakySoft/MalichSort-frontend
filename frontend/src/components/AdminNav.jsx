import { NavLink } from "react-router-dom";

const links = [["/admin", "Dashboard"], ["/admin/sorteos", "Sorteos"], ["/admin/participaciones", "Participaciones"], ["/admin/usuarios", "Usuarios"], ["/admin/terminos", "Versiones de términos"], ["/admin/auditoria", "Auditoría"]];
export default function AdminNav() {
  return <nav className="mb-8 flex flex-wrap gap-2">{links.map(([to, label]) => <NavLink key={to} end={to === "/admin"} to={to} className={({ isActive }) => `rounded-lg px-4 py-2 text-sm font-medium ${isActive ? "bg-slate-900 text-white" : "bg-white text-slate-600 border"}`}>{label}</NavLink>)}</nav>;
}