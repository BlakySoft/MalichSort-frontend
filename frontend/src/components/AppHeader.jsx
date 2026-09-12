import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ShieldCheck } from "lucide-react";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return <header className="border-b border-border bg-background/95 backdrop-blur">
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
      <Link to="/" className="flex items-center gap-2 font-semibold text-foreground"><ShieldCheck className="h-5 w-5 text-primary" />Ivan Malich Sorteos</Link>
      <nav className="hidden items-center gap-2 text-sm sm:flex">
        <Link className="hidden sm:block px-3 py-2 text-muted-foreground hover:text-foreground" to="/sorteos">Sorteos</Link>
        <Link className="hidden sm:block px-3 py-2 text-muted-foreground hover:text-foreground" to="/salon-de-la-fama">Salón de la fama</Link>
        {user ? <>
          <Link className="hidden sm:block px-3 py-2 text-muted-foreground hover:text-foreground" to="/mis-participaciones">Mis participaciones</Link>
          <Link className="px-3 py-2 text-muted-foreground hover:text-foreground" to="/perfil">Mi perfil</Link>
          {user.role === "admin" && <Link className="px-3 py-2 text-muted-foreground hover:text-foreground" to="/admin">Administración</Link>}
          <span className="hidden px-2 text-sm font-medium text-foreground sm:block">Hola, {user.first_name || user.email}</span>
          <Button size="sm" variant="outline" onClick={() => logout()}>Cerrar sesión</Button>
        </> : <>
          <Link className="px-3 py-2 text-muted-foreground hover:text-foreground" to="/login">Ingresar</Link>
          <Button size="sm" asChild><Link to="/register">Registrarse</Link></Button>
        </>}
      </nav>
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button className="sm:hidden" variant="ghost" size="icon" aria-label="Abrir menú">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="sm:hidden">
          <SheetHeader>
            <SheetTitle>Menú</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 flex flex-col gap-1 text-sm">
            <SheetClose asChild><Link className="rounded-md px-3 py-3 text-foreground hover:bg-accent" to="/sorteos">Sorteos</Link></SheetClose>
            <SheetClose asChild><Link className="rounded-md px-3 py-3 text-foreground hover:bg-accent" to="/salon-de-la-fama">Salón de la fama</Link></SheetClose>
            {user ? <>
              <SheetClose asChild><Link className="rounded-md px-3 py-3 text-foreground hover:bg-accent" to="/mis-participaciones">Mis participaciones</Link></SheetClose>
              <SheetClose asChild><Link className="rounded-md px-3 py-3 text-foreground hover:bg-accent" to="/perfil">Mi perfil</Link></SheetClose>
              {user.role === "admin" && <SheetClose asChild><Link className="rounded-md px-3 py-3 text-foreground hover:bg-accent" to="/admin">Administración</Link></SheetClose>}
              <Button className="mt-4 justify-start px-3" variant="outline" onClick={() => { setMobileMenuOpen(false); logout(); }}>Cerrar sesión</Button>
            </> : <>
              <SheetClose asChild><Link className="rounded-md px-3 py-3 text-foreground hover:bg-accent" to="/login">Ingresar</Link></SheetClose>
              <SheetClose asChild><Link className="mt-4 rounded-md bg-primary px-3 py-3 text-center text-primary-foreground hover:bg-primary/90" to="/register">Registrarse</Link></SheetClose>
            </>}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  </header>;
}
