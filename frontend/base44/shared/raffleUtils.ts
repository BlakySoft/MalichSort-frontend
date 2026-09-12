export const PUBLISHED_STATUSES = ["UPCOMING", "ACTIVE", "CLOSED", "DRAWN", "CANCELLED"];

export function generateSlug(name: string): string {
  const slug = String(name || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "raffle";
}

export function validatePublishFields(data: any): string[] {
  const errors: string[] = [];
  const winnerCount = Number(data.winner_count || 1);
  if (!Number.isInteger(winnerCount) || winnerCount < 1 || winnerCount > 100) errors.push("La cantidad de ganadores debe ser un entero entre 1 y 100");
  if (!String(data.name || "").trim()) errors.push("Falta el nombre");
  if (!String(data.slug || "").trim()) errors.push("Falta el slug");
  if (!String(data.short_description || "").trim()) errors.push("Falta la descripción corta");
  if (!String(data.description || "").trim()) errors.push("Falta la descripción");
  if (!String(data.prize_title || "").trim()) errors.push("Falta el título del premio");
  if (!String(data.prize_description || "").trim()) errors.push("Falta la descripción del premio");
  if (!String(data.prize_image || "").trim()) errors.push("Falta la imagen principal del premio");
  if (!String(data.rules || "").trim()) errors.push("Faltan las reglas");
  if (!data.start_date) errors.push("Falta la fecha de inicio");
  if (!data.end_date) errors.push("Falta la fecha de finalización");
  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date).getTime();
    const end = new Date(data.end_date).getTime();
    if (!isNaN(start) && !isNaN(end) && start >= end) {
      errors.push("La fecha de inicio debe ser anterior a la de finalización");
    }
  }
  const extra = Array.isArray(data.additional_images) ? data.additional_images : [];
  if (extra.length > 5) errors.push("Se permiten hasta 5 imágenes adicionales");
  return errors;
}

export function decidePublishedStatus(start_date: string): "UPCOMING" | "ACTIVE" {
  return Date.now() >= new Date(start_date).getTime() ? "ACTIVE" : "UPCOMING";
}

const EDITABLE: Record<string, string[]> = {
  DRAFT: ["name", "short_description", "description", "prize_title", "prize_description", "prize_image", "additional_images", "start_date", "end_date", "rules"],
  UPCOMING: ["short_description", "description", "prize_title", "prize_description", "prize_image", "additional_images", "start_date", "end_date", "rules"],
  ACTIVE: ["short_description", "description", "additional_images", "rules"],
  CLOSED: [],
  DRAWN: [],
  CANCELLED: []
};

export function editableFieldsFor(status: string): string[] {
  return EDITABLE[status] || [];
}

export function sanitizePublic(raffle: any): any {
  return {
    id: raffle.id,
    name: raffle.name,
    slug: raffle.slug,
    short_description: raffle.short_description || "",
    description: raffle.description || "",
    prize_title: raffle.prize_title || "",
    prize_description: raffle.prize_description || "",
    prize_image: raffle.prize_image || "",
    additional_images: Array.isArray(raffle.additional_images) ? raffle.additional_images : [],
    start_date: raffle.start_date || "",
    end_date: raffle.end_date || "",
    status: raffle.status,
    rules: raffle.rules || ""
  };
}