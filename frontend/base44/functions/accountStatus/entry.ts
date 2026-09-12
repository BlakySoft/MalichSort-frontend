import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 });
    const active = await base44.asServiceRole.entities.TermsVersion.filter({ active: true });
    const terms = active[0] || null;
    const acceptances = terms ? await base44.asServiceRole.entities.TermsAcceptance.filter({ user_id: user.id, terms_version_id: terms.id }) : [];
    return Response.json({ user, activeTerms: terms, acceptedCurrentTerms: acceptances.length > 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
