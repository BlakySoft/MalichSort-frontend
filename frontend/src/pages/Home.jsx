import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LockKeyhole, UserCheck, FileCheck2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
  const { user } = useAuth();
  return <section className="mx-auto max-w-6xl px-4 py-20 sm:py-28"><div className="max-w-3xl"><span className="rounded-full bg-secondary/15 px-3 py-1 text-sm font-medium text-secondary-foreground">Fundación segura</span><h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">Ivan Malich <span className="text-primary">Sorteos</span></h1><p className="mt-6 text-lg leading-8 text-muted-foreground">Tu cuenta, identidad y aceptación de términos quedan protegidas y registradas antes de participar en futuros sorteos.</p><div className="mt-8 flex gap-3">
    {user ? (
      <><Button asChild><Link to="/sorteos">Ver sorteos</Link></Button><Button variant="outline" asChild><Link to="/mis-participaciones">Mis participaciones</Link></Button></>
    ) : (
      <><Button asChild><Link to="/register">Crear cuenta</Link></Button><Button variant="outline" asChild><Link to="/login">Iniciar sesión</Link></Button></>
    )}
  </div></div><div className="mt-16 grid gap-4 sm:grid-cols-3">{[[LockKeyhole,"Datos privados","Tu información personal solo está disponible para vos y administradores autorizados."],[UserCheck,"Correo verificado","El alta utiliza la verificación nativa por código enviada a tu email."],[FileCheck2,"Términos versionados","Cada aceptación conserva la versión y fecha exactas."]].map(([Icon,title,text]) => <div key={title} className="rounded-2xl border bg-card p-6"><Icon className="h-6 w-6 text-primary"/><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div></section>;
}
