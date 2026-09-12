import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { writeAudit } from '../../shared/security.ts';
import { validateProfileFields } from '../../shared/validation.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 });
    if (user.role !== 'user') return Response.json({ error: 'Esta operación es exclusiva del alta de usuarios' }, { status: 403 });
    if (user.first_name || user.cuil) return Response.json({ error: 'El registro ya fue completado' }, { status: 409 });
    const data = await req.json();
    const fields = ['first_name', 'last_name', 'cuil', 'phone', 'locality', 'cvu_cbu'];
    if (fields.some((field) => !String(data[field] || '').trim())) return Response.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    const validationErrors = validateProfileFields(data);
    if (validationErrors.length) return Response.json({ error: validationErrors.join('; ') }, { status: 400 });
    const cuil = String(data.cuil).replace(/[.\s-]/g, '');
    const duplicate = await base44.asServiceRole.entities.User.filter({ cuil });
    if (duplicate.some((item) => item.id !== user.id)) return Response.json({ error: 'El CUIL ya está registrado' }, { status: 409 });
    const profile = Object.fromEntries(fields.map((field) => [field, field === 'cuil' ? cuil : String(data[field]).trim()]));
    profile.role = 'user';
    await base44.asServiceRole.entities.User.update(user.id, profile);
    await writeAudit(base44, req, { ...user, role: 'user' }, { action: 'USER_CREATED', entity_type: 'User', entity_id: user.id, description: 'Registro y perfil de usuario completados' });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}