import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isRole, writeAudit } from '../../shared/security.ts';
import { generateSlug, validatePublishFields, decidePublishedStatus, editableFieldsFor } from '../../shared/raffleUtils.ts';

async function uniqueSlug(base44, base: string, excludeId: string | null = null): Promise<string> {
  let slug = base;
  let i = 2;
  while (true) {
    const existing = await base44.asServiceRole.entities.Raffle.filter({ slug });
    if (!existing.some((r) => r.id !== excludeId)) return slug;
    slug = `${base}-${i++}`;
  }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!isRole(user, ['admin', 'dev'])) return Response.json({ error: 'Prohibido' }, { status: 403 });
    const data = await req.json();

    if (data.action === 'list') {
      const raffles = await base44.asServiceRole.entities.Raffle.list('-created_date', 200);
      return Response.json({ raffles });
    }

    if (data.action === 'create') {
      const name = String(data.name || '').trim();
      if (!name) return Response.json({ error: 'El nombre es obligatorio' }, { status: 400 });
      const slug = await uniqueSlug(base44, generateSlug(name));
      const raffle = await base44.asServiceRole.entities.Raffle.create({
        name, slug, status: 'DRAFT', created_by: user.email,
        short_description: '', description: '', prize_title: '', prize_description: '',
        prize_image: '', additional_images: [], start_date: '', end_date: '', rules: ''
      });
      await writeAudit(base44, req, user, {
        action: 'RAFFLE_CREATED', entity_type: 'Raffle', entity_id: raffle.id,
        new_value: JSON.stringify({ name, slug }),
        description: `Sorteo "${name}" creado como borrador`
      });
      return Response.json({ raffle });
    }

    if (data.action === 'update') {
      const raffle = await base44.asServiceRole.entities.Raffle.get(data.id);
      const allowed = editableFieldsFor(raffle.status);
      if (!allowed.length) return Response.json({ error: `No se puede editar un sorteo en estado ${raffle.status}` }, { status: 400 });
      const changes: Record<string, any> = {};
      const oldValues: Record<string, any> = {};
      for (const field of allowed) {
        if (data[field] === undefined) continue;
        let value = data[field];
        if (field === 'additional_images') {
          value = Array.isArray(value) ? value.slice(0, 5) : [];
        } else if (typeof value === 'string') {
          value = value.trim();
        }
        if ((field === 'start_date' || field === 'end_date') && value && isNaN(new Date(value).getTime())) continue;
        if (JSON.stringify(value) !== JSON.stringify(raffle[field] ?? (field === 'additional_images' ? [] : ''))) {
          oldValues[field] = raffle[field];
          changes[field] = value;
        }
      }
      const newStart = changes.start_date ?? raffle.start_date;
      const newEnd = changes.end_date ?? raffle.end_date;
      if (newStart && newEnd && new Date(newStart) >= new Date(newEnd)) {
        return Response.json({ error: 'La fecha de inicio debe ser anterior a la de finalización' }, { status: 400 });
      }
      if (changes.name && raffle.status === 'DRAFT') {
        const newSlug = await uniqueSlug(base44, generateSlug(changes.name), raffle.id);
        if (newSlug !== raffle.slug) { oldValues.slug = raffle.slug; changes.slug = newSlug; }
      }
      if (!Object.keys(changes).length) return Response.json({ ok: true });
      await base44.asServiceRole.entities.Raffle.update(raffle.id, changes);
      await writeAudit(base44, req, user, {
        action: 'RAFFLE_UPDATED', entity_type: 'Raffle', entity_id: raffle.id,
        old_value: JSON.stringify(oldValues), new_value: JSON.stringify(changes),
        description: `Sorteo "${raffle.name}" actualizado`
      });
      return Response.json({ ok: true });
    }

    if (data.action === 'publish') {
      const raffle = await base44.asServiceRole.entities.Raffle.get(data.id);
      if (raffle.status !== 'DRAFT') return Response.json({ error: 'Solo se pueden publicar sorteos en borrador' }, { status: 400 });
      const errors = validatePublishFields(raffle);
      if (errors.length) return Response.json({ error: errors.join('; ') }, { status: 400 });
      const newStatus = decidePublishedStatus(raffle.start_date);
      await base44.asServiceRole.entities.Raffle.update(raffle.id, {
        status: newStatus,
        published_at: new Date().toISOString(),
        published_by: user.email
      });
      await writeAudit(base44, req, user, {
        action: 'RAFFLE_PUBLISHED', entity_type: 'Raffle', entity_id: raffle.id,
        old_value: JSON.stringify({ status: 'DRAFT' }),
        new_value: JSON.stringify({ status: newStatus, published_by: user.email }),
        description: `Sorteo "${raffle.name}" publicado`
      });
      return Response.json({ ok: true });
    }

    if (data.action === 'cancel') {
      const raffle = await base44.asServiceRole.entities.Raffle.get(data.id);
      if (!['UPCOMING', 'ACTIVE'].includes(raffle.status)) {
        return Response.json({ error: `No se puede cancelar un sorteo en estado ${raffle.status}` }, { status: 400 });
      }
      await base44.asServiceRole.entities.Raffle.update(raffle.id, { status: 'CANCELLED' });
      await writeAudit(base44, req, user, {
        action: 'RAFFLE_CANCELLED', entity_type: 'Raffle', entity_id: raffle.id,
        old_value: JSON.stringify({ status: raffle.status }),
        new_value: JSON.stringify({ status: 'CANCELLED' }),
        description: `Sorteo "${raffle.name}" cancelado`
      });
      return Response.json({ ok: true });
    }

    if (data.action === 'delete') {
      const raffle = await base44.asServiceRole.entities.Raffle.get(data.id);
      if (raffle.status !== 'DRAFT') {
        return Response.json({ error: 'Solo se pueden eliminar sorteos en borrador' }, { status: 400 });
      }
      await base44.asServiceRole.entities.Raffle.delete(raffle.id);
      await writeAudit(base44, req, user, {
        action: 'RAFFLE_DELETED', entity_type: 'Raffle', entity_id: raffle.id,
        old_value: JSON.stringify({ name: raffle.name, slug: raffle.slug, status: raffle.status }),
        description: `Sorteo "${raffle.name}" eliminado`
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}