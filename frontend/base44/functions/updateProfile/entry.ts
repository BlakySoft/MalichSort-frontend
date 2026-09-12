import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { writeAudit } from '../../shared/security.ts';
import { validateProfileFields } from '../../shared/validation.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 });
    const data = await req.json();
    const fields = ['first_name', 'last_name', 'cuil', 'phone', 'locality', 'cvu_cbu'];
    if (fields.some((field) => !String(data[field] || '').trim())) return Response.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    const validationErrors = validateProfileFields(data);
    if (validationErrors.length) return Response.json({ error: validationErrors.join('; ') }, { status: 400 });
    const cuil = String(data.cuil || '').replace(/[.\s-]/g, '');
    const duplicate = await base44.asServiceRole.entities.User.filter({ cuil });
    if (duplicate.some((item) => item.id !== user.id)) return Response.json({ error: 'El CUIL ya está registrado' }, { status: 409 });
    const changes = Object.fromEntries(fields.map((field) => [field, String(data[field]).trim()]));
    await base44.asServiceRole.entities.User.update(user.id, changes);
    await writeAudit(base44, req, user, { action: 'USER_PROFILE_UPDATED', entity_type: 'User', entity_id: user.id, old_value: JSON.stringify({ fields: fields.filter((field) => user[field] !== changes[field]) }), new_value: JSON.stringify({ fields: fields.filter((field) => user[field] !== changes[field]) }), description: 'Datos personales actualizados; los valores privados no se incluyen en auditoría' });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}