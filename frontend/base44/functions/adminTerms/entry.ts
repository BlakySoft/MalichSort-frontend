import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isRole, writeAudit } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isRole(user, ['admin'])) return Response.json({ error: 'Prohibido' }, { status: 403 });
    const data = await req.json();
    if (data.action === 'list') return Response.json({ terms: await base44.asServiceRole.entities.TermsVersion.list('-created_date', 100) });
    if (data.action === 'create') {
      if (![data.version, data.title, data.content].every((value) => String(value || '').trim())) return Response.json({ error: 'Versión, título y contenido son obligatorios' }, { status: 400 });
      const duplicate = await base44.asServiceRole.entities.TermsVersion.filter({ version: String(data.version).trim() });
      if (duplicate.length) return Response.json({ error: 'La versión ya existe' }, { status: 409 });
      const terms = await base44.asServiceRole.entities.TermsVersion.create({ version: String(data.version).trim(), title: String(data.title).trim(), content: String(data.content).trim(), active: false, created_by: user.id });
      await writeAudit(base44, req, user, { action: 'TERMS_VERSION_CREATED', entity_type: 'TermsVersion', entity_id: terms.id, new_value: JSON.stringify({ version: terms.version }), description: `Versión ${terms.version} creada` });
      return Response.json({ ok: true });
    }
    if (data.action === 'publish') {
      const terms = await base44.asServiceRole.entities.TermsVersion.get(data.terms_version_id);
      if (!terms) return Response.json({ error: 'Versión inexistente' }, { status: 404 });
      const active = await base44.asServiceRole.entities.TermsVersion.filter({ active: true });
      if (active.length) await base44.asServiceRole.entities.TermsVersion.bulkUpdate(active.map((item) => ({ id: item.id, active: false })));
      await base44.asServiceRole.entities.TermsVersion.update(terms.id, { active: true, published_at: terms.published_at || new Date().toISOString() });
      const activeAfterPublish = await base44.asServiceRole.entities.TermsVersion.filter({ active: true });
      const conflicting = activeAfterPublish.filter((item) => item.id !== terms.id);
      if (conflicting.length) await base44.asServiceRole.entities.TermsVersion.bulkUpdate(conflicting.map((item) => ({ id: item.id, active: false })));
      await writeAudit(base44, req, user, { action: 'TERMS_VERSION_PUBLISHED', entity_type: 'TermsVersion', entity_id: terms.id, old_value: JSON.stringify({ active_versions: active.map((item) => item.version) }), new_value: JSON.stringify({ version: terms.version, active: true }), description: `Versión ${terms.version} publicada` });
      return Response.json({ ok: true });
    }
    return Response.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}