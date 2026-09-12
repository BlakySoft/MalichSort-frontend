export function requestMeta(req) {
  return {
    ip_address: (req.headers.get("x-forwarded-for") || "").split(",")[0].trim(),
    user_agent: (req.headers.get("user-agent") || "").slice(0, 500)
  };
}

export function isRole(user, roles) {
  return user && roles.includes(user.role);
}

export async function writeAudit(base44, req, user, details) {
  const meta = requestMeta(req);
  return await base44.asServiceRole.entities.AuditLog.create({
    timestamp: new Date().toISOString(),
    user_id: user.id,
    user_role: user.role || "user",
    old_value: "",
    new_value: "",
    entity_id: "",
    ...details,
    ...meta
  });
}