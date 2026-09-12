import { ARGENTINA_COUNTRY_CODE, isArgentinaAreaCode } from "@/lib/argentinaPhone";

export { ARGENTINA_AREA_CODES, ARGENTINA_COUNTRY_CODE } from "@/lib/argentinaPhone";

export const MAX_PROFILE_TEXT_LENGTH = 64;

export function onlyDigits(value) {
  return String(value ?? "").replace(/\D+/g, "");
}

export function normalizeCuil(value) {
  return String(value ?? "").replace(/[.\s-]/g, "").slice(0, 11);
}

export function formatCuil(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits[10]}`;
}

export function validateCuil(value) {
  const digits = normalizeCuil(value);
  if (!/^\d{11}$/.test(digits) || !["20", "23", "24", "27"].includes(digits.slice(0, 2))) return false;
  const coefficients = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = coefficients.reduce((total, coefficient, index) => total + Number(digits[index]) * coefficient, 0);
  const verifier = 11 - (sum % 11);
  if (verifier === 10) return false;
  return (verifier === 11 ? 0 : verifier) === Number(digits[10]);
}

export function validateCvuCbvu(value) {
  return onlyDigits(value).length === 22;
}

export function validatePhone(phone) {
  const area = onlyDigits(phone?.areaCode);
  const num = onlyDigits(phone?.number);
  const code = phone?.countryCode || "";
  return (
    code === ARGENTINA_COUNTRY_CODE &&
    isArgentinaAreaCode(area) &&
    num.length >= 6 && num.length <= 8
  );
}

export function buildPhoneString(phone) {
  const p = phone || { countryCode: ARGENTINA_COUNTRY_CODE, areaCode: "", number: "" };
  return `${p.countryCode} ${onlyDigits(p.areaCode)} ${onlyDigits(p.number)}`.trim();
}

export function parsePhoneString(phone = "") {
  const match = /^(\+\d{1,4}) (\d{2,5}) (\d{6,8})$/.exec(String(phone || ""));
  if (match && match[1] === ARGENTINA_COUNTRY_CODE && isArgentinaAreaCode(match[2])) {
    return { countryCode: match[1], areaCode: match[2], number: match[3] };
  }
  return { countryCode: ARGENTINA_COUNTRY_CODE, areaCode: "", number: "" };
}

export function validateProfile(form) {
  const errors = [];
  if (!validateCuil(form.cuil)) errors.push("El CUIL debe tener el formato 00-00.000.000-0 y ser válido.");
  if (!validatePhone(form.phone)) errors.push("El teléfono debe incluir código de país, área y número válidos.");
  if (!validateCvuCbvu(form.cvu_cbu)) errors.push("El CVU/CBU debe tener exactamente 22 dígitos.");
  return errors;
}

export function validateProfileFields(form) {
  const errors = {};
  const firstName = String(form.first_name || "").trim();
  const lastName = String(form.last_name || "").trim();
  const locality = String(form.locality || "").trim();
  if (!firstName) errors.first_name = "El nombre es obligatorio";
  else if (firstName.length > MAX_PROFILE_TEXT_LENGTH) errors.first_name = "El nombre no puede superar los 64 caracteres";
  if (!lastName) errors.last_name = "El apellido es obligatorio";
  else if (lastName.length > MAX_PROFILE_TEXT_LENGTH) errors.last_name = "El apellido no puede superar los 64 caracteres";
  if (!validateCuil(form.cuil)) errors.cuil = "El CUIL debe tener el formato 00-00.000.000-0 y ser válido";
  if (!locality) errors.locality = "La localidad es obligatoria";
  else if (locality.length > MAX_PROFILE_TEXT_LENGTH) errors.locality = "La localidad no puede superar los 64 caracteres";
  if (!validatePhone(form.phone)) errors.phone = "Teléfono inválido (código de país, área y número)";
  if (!validateCvuCbvu(form.cvu_cbu)) errors.cvu_cbu = "El CVU/CBU debe tener 22 dígitos";
  return errors;
}

export function validateRegisterFields(form) {
  const errors = validateProfileFields(form);
  if (!String(form.email || "").trim()) errors.email = "El email es obligatorio";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "El email no es válido";
  if (!String(form.password || "").trim()) errors.password = "La contraseña es obligatoria";
  else if (form.password.length < 6) errors.password = "Mínimo 6 caracteres";
  if (form.password !== form.confirmPassword) errors.confirmPassword = "Las contraseñas no coinciden";
  return errors;
}