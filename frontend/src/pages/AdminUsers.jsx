import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatCuil } from "@/lib/profileValidation";
import AdminPage from "@/components/AdminPage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import ProcessingOverlay from "@/components/form/ProcessingOverlay";

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [masterPassword, setMasterPassword] = useState("");

  const load = () => base44.functions.invoke("adminUsers", { action: "list" }).then(({ data }) => setUsers(data.users));
  useEffect(() => { load(); }, []);

  const closeRoleDialog = () => {
    setPendingRoleChange(null);
    setMasterPassword("");
  };

  const change = (id, role) => {
    setPendingRoleChange({ id, role });
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange || !masterPassword) return;
    setProcessing(true);
    try {
      await base44.functions.invoke("adminUsers", {
        action: "changeRole",
        user_id: pendingRoleChange.id,
        role: pendingRoleChange.role,
        master_password: masterPassword,
      });
      await load();
    } catch (error) {
      toast({ title: "No se pudo cambiar el rol", description: error.data?.error || "Verificá que la operación esté permitida.", variant: "destructive" });
    } finally {
      setProcessing(false);
      closeRoleDialog();
    }
  };

  const filtered = useMemo(() => {
    if (!users) return null;
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter === "complete" && !u.profile_completed) return false;
      if (statusFilter === "incomplete" && u.profile_completed) return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!q) return true;
      const haystack = `${u.first_name || ""} ${u.last_name || ""} ${u.email} ${u.cuil || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [users, search, statusFilter, roleFilter]);

  return (
    <AdminPage title="Usuarios" description="Datos privados disponibles únicamente para administración autorizada.">
      <div className="mb-4 flex flex-wrap gap-2">
        <Input placeholder="Buscar por nombre, email o CUIL" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los registros</SelectItem>
            <SelectItem value="complete">Registro completo</SelectItem>
            <SelectItem value="incomplete">Perfil incompleto</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="user">USER</SelectItem>
            <SelectItem value="admin">ADMIN</SelectItem>
            <SelectItem value="dev">DEV</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative overflow-x-auto rounded-2xl border border-border bg-card">
        <ProcessingOverlay active={processing} label="Actualizando rol…" />
        <table className="w-full text-left text-sm text-foreground">
          <thead className="bg-muted/50 text-muted-foreground"><tr>{["Usuario", "CUIL", "Contacto", "Estado", "Rol"].map((x) => <th key={x} className="px-4 py-3 font-medium">{x}</th>)}</tr></thead>
          <tbody>{filtered?.map((user) => (
            <tr key={user.id} className="border-t border-border">
              <td className="px-4 py-4"><b>{user.first_name || "—"} {user.last_name || ""}</b><div className="text-muted-foreground">{user.email}</div></td>
              <td className="px-4 py-4">{user.cuil ? formatCuil(user.cuil) : "—"}</td>
              <td className="px-4 py-4">{user.phone || "—"}<div className="text-muted-foreground">{user.locality}</div></td>
              <td className="px-4 py-4">
                {user.profile_completed ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">Registro completo</span>
                ) : (
                  <span className="rounded-full bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-300" title="Verificó su email pero no completó los datos del perfil (por ejemplo, por un CUIL duplicado)">Perfil incompleto</span>
                )}
              </td>
              <td className="px-4 py-4"><select className="rounded-md border border-input bg-background p-2 text-foreground" value={user.role} disabled={processing} onChange={(e) => change(user.id, e.target.value)}><option value="user">USER</option><option value="admin">ADMIN</option><option value="dev">DEV</option></select></td>
            </tr>
          ))}</tbody>
        </table>
        {users === null && <p className="p-6 text-muted-foreground">Cargando usuarios…</p>}
        {filtered?.length === 0 && <p className="p-6 text-muted-foreground">Ningún usuario coincide con la búsqueda.</p>}
      </div>

      <Dialog open={Boolean(pendingRoleChange)} onOpenChange={(open) => !open && !processing && closeRoleDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar cambio de rol</DialogTitle>
            <DialogDescription>
              Esta operación requiere la contraseña maestra.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            type="password"
            value={masterPassword}
            onChange={(event) => setMasterPassword(event.target.value)}
            placeholder="Contraseña maestra"
            onKeyDown={(event) => {
              if (event.key === "Enter") confirmRoleChange();
            }}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeRoleDialog} disabled={processing}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmRoleChange} disabled={!masterPassword || processing}>
              Confirmar cambio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
