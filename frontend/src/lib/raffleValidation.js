export function validateRafflePublish(form) {
  const errors = {};
  const winnerCount = Number(form.winner_count);
  if (!Number.isInteger(winnerCount) || winnerCount < 1 || winnerCount > 100) errors.winner_count = "La cantidad debe ser un entero entre 1 y 100";
  if (!String(form.name || "").trim()) errors.name = "Falta el nombre";
  if (!String(form.short_description || "").trim()) errors.short_description = "Falta la descripción corta";
  if (!String(form.description || "").trim()) errors.description = "Falta la descripción";
  if (!String(form.prize_title || "").trim()) errors.prize_title = "Falta el título del premio";
  if (!String(form.prize_description || "").trim()) errors.prize_description = "Falta la descripción del premio";
  if (!String(form.prize_image || "").trim()) errors.prize_image = "Falta la imagen principal del premio";
  if (!String(form.rules || "").trim()) errors.rules = "Faltan las reglas";
  if (!form.start_date) errors.start_date = "Falta la fecha de inicio";
  if (!form.end_date) errors.end_date = "Falta la fecha de finalización";
  if (form.start_date && form.end_date) {
    const s = new Date(form.start_date).getTime();
    const e = new Date(form.end_date).getTime();
    if (!isNaN(s) && !isNaN(e) && s >= e) errors.start_date = "La fecha de inicio debe ser anterior a la de finalización";
  }
  return errors;
}

export function validateRaffleSave(form) {
  const errors = {};
  if (form.start_date && form.end_date) {
    const s = new Date(form.start_date).getTime();
    const e = new Date(form.end_date).getTime();
    if (!isNaN(s) && !isNaN(e) && s >= e) errors.start_date = "La fecha de inicio debe ser anterior a la de finalización";
  }
  return errors;
}

// Campos que, una vez el sorteo está publicado (UPCOMING/ACTIVE), nunca
// pueden guardarse en blanco — a diferencia de un DRAFT, que sí puede
// guardarse incompleto mientras se arma.
const REQUIRED_ONCE_PUBLISHED = ["short_description", "description", "prize_title", "prize_description", "prize_image", "rules", "start_date", "end_date"];

export function validateRaffleUpdate(form, allowedFields) {
  const errors = {};
  for (const f of allowedFields) {
    if (!REQUIRED_ONCE_PUBLISHED.includes(f)) continue;
    const empty = (f === "start_date" || f === "end_date") ? !form[f] : !String(form[f] || "").trim();
    if (empty) errors[f] = "Este campo no puede quedar vacío en un sorteo ya publicado";
  }
  if (form.start_date && form.end_date) {
    const s = new Date(form.start_date).getTime();
    const e = new Date(form.end_date).getTime();
    if (!isNaN(s) && !isNaN(e) && s >= e) errors.start_date = "La fecha de inicio debe ser anterior a la de finalización";
  }
  return errors;
}