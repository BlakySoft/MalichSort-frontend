import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isRole, writeAudit } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isRole(user, ['admin', 'dev'])) return Response.json({ error: 'Prohibido' }, { status: 403 });
    const data = await req.json();
    if (data.action === 'list') {
      const users = await base44.asServiceRole.entities.User.list('-created_date', 200);
      return Response.json({ users: users.map(({ id, email, first_name, last_name, cuil, phone, locality, role, created_date }) => ({ id, email, first_name, last_name, cuil, phone, locality, role, created_date })) });
    }
    if (data.action === 'changeRole') {
      if (!['user', 'admin', 'dev'].includes(data.role)) return Response.json({ error: 'Rol inválido' }, { status: 400 });
      const masterEmail = Deno.env.get('ROLE_MASTER_EMAIL')?.trim().toLowerCase();
      const masterPassword = Deno.env.get('ROLE_MASTER_PASSWORD');
      if (!masterEmail || !masterPassword) return Response.json({ error: 'Verificación maestra no configurada' }, { status: 503 });
      if (user.email?.toLowerCase() !== masterEmail || data.master_password !== masterPassword) {
        return Response.json({ error: 'Verificación maestra rechazada' }, { status: 403 });
      }
      if (data.user_id === user.id) return Response.json({ error: 'No podés modificar tu propio rol' }, { status: 400 });
      const target = await base44.asServiceRole.entities.User.get(data.user_id);
      if (target.role === 'admin' && data.role !== 'admin') {
        const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
        if (admins.length <= 1) return Response.json({ error: 'Debe existir al menos un administrador' }, { status: 400 });
      }
      await base44.asServiceRole.entities.User.update(data.user_id, { role: data.role });
      await writeAudit(base44, req, user, { action: 'USER_ROLE_CHANGED', entity_type: 'User', entity_id: data.user_id, old_value: JSON.stringify({ role: target.role }), new_value: JSON.stringify({ role: data.role }), description: 'Rol de usuario modificado por administrador' });
      return Response.json({ ok: true });
    }
    return Response.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}