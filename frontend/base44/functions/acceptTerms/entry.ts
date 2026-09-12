import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requestMeta, writeAudit } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 });
    const active = await base44.asServiceRole.entities.TermsVersion.filter({ active: true });
    if (active.length !== 1) return Response.json({ error: 'No existe una única versión vigente' }, { status: 409 });
    const terms = active[0];
    const existing = await base44.asServiceRole.entities.TermsAcceptance.filter({ user_id: user.id, terms_version_id: terms.id });
    if (existing.length) return Response.json({ ok: true, alreadyAccepted: true });
    const acceptance = await base44.asServiceRole.entities.TermsAcceptance.create({ user_id: user.id, terms_version_id: terms.id, accepted_at: new Date().toISOString(), ...requestMeta(req) });
    await writeAudit(base44, req, user, { action: 'TERMS_ACCEPTED', entity_type: 'TermsAcceptance', entity_id: acceptance.id, new_value: JSON.stringify({ terms_version_id: terms.id, version: terms.version }), description: `Aceptación de términos ${terms.version}` });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}