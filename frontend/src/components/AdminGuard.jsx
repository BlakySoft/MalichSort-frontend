import { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function AdminGuard() {
  const [state, setState] = useState("loading");
  useEffect(() => { base44.auth.me().then((user) => setState(user.role === "admin" ? "allowed" : "denied")).catch(() => setState("denied")); }, []);
  if (state === "loading") return <div className="p-10 text-center text-slate-500">Verificando permisos…</div>;
  if (state === "denied") return <div className="mx-auto max-w-xl p-10 text-center"><h1 className="text-2xl font-semibold">Acceso denegado</h1><p className="mt-2 text-slate-600">Esta sección requiere permisos de administrador.</p><Link className="mt-5 inline-block underline" to="/perfil">Volver a mi perfil</Link></div>;
  return <Outlet />;
}