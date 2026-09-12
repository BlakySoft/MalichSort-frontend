import { isArgentinaPhone } from './argentinaPhone.ts';

export function validateProfileFields(data: any): string[] {
  const errors: string[] = [];
  const cuil = String(data.cuil || "").replace(/[.\s-]/g, "");
  if (!/^\d{11}$/.test(cuil) || !["20", "23", "24", "27"].includes(cuil.slice(0, 2))) {
    errors.push("El CUIL debe tener el formato 00-00.000.000-0");
  } else {
    const coefficients = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const sum = coefficients.reduce((total, coefficient, index) => total + Number(cuil[index]) * coefficient, 0);
    const verifier = 11 - (sum % 11);
    if (verifier === 10 || (verifier === 11 ? 0 : verifier) !== Number(cuil[10])) {
      errors.push("El CUIL no es válido");
    }
  }
  if (!/^\d{22}$/.test(String(data.cvu_cbu || ""))) {
    errors.push("El CVU/CBU debe tener exactamente 22 dígitos");
  }
  if (!isArgentinaPhone(data.phone)) {
    errors.push("El teléfono debe incluir código de país, área y número");
  }
  return errors;
}