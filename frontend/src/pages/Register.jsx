import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Mail, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import CuilInput from "@/components/profile/CuilInput";
import PhoneInput from "@/components/profile/PhoneInput";
import CvuInput from "@/components/profile/CvuInput";
import Field from "@/components/form/Field";
import FormErrors from "@/components/form/FormErrors";
import { validateRegisterFields, buildPhoneString, MAX_PROFILE_TEXT_LENGTH } from "@/lib/profileValidation";

const initial = {
  first_name: "", last_name: "", cuil: "", email: "",
  phone: { countryCode: "+54", areaCode: "", number: "" },
  locality: "", cvu_cbu: "", password: "", confirmPassword: ""
};

export default function Register() {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const fieldErrors = validateRegisterFields(form);
    if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }
    setErrors({});
    setLoading(true);
    try {
      await base44.auth.register({ email: form.email, password: form.password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "No se pudo crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await base44.auth.verifyOtp({ email: form.email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Código inválido");
      setLoading(false);
      return;
    }
    try {
      await base44.functions.invoke("completeRegistration", {
        first_name: form.first_name, last_name: form.last_name, cuil: form.cuil,
        phone: buildPhoneString(form.phone), locality: form.locality, cvu_cbu: form.cvu_cbu
      });
      // Recarga completa para que todo el estado (AuthContext, etc.) arranque
      // fresco con el usuario ya completamente registrado.
      window.location.href = safeReturnTo() === "/" ? "/" : safeReturnTo();
    } catch (err) {
      // El email ya quedó verificado en este punto. Si completar el registro
      // falla (por ejemplo, CUIL duplicado), en vez de dejar al usuario
      // atascado en la pantalla de código, lo mandamos a la pantalla
      // dedicada donde puede corregir el dato y reintentar, avisándole
      // por qué llegó ahí (la recarga de página por sí sola no lo explica).
      const reason = err.response?.data?.error || err.message || "No se pudo completar el registro";
      window.location.href = `/completar-registro?error=${encodeURIComponent(reason)}`;
    }
  };

  const resend = async () => {
    await base44.auth.resendOtp(form.email);
    toast({ title: "Código enviado", description: "Revisá tu correo electrónico." });
  };

  if (showOtp) {
    return (
      <AuthLayout icon={Mail} title="Verificá tu email" subtitle={`Enviamos un código a ${form.email}`}>
        {error && <Error text={error} />}
        <div className="mb-6 flex justify-center">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
            <InputOTPGroup>{[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="h-12 w-full" onClick={verify} disabled={loading || otpCode.length < 6}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar y finalizar"}
        </Button>
        <button onClick={resend} className="mt-4 w-full text-sm underline">Reenviar código</button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={UserPlus} title="Crear cuenta" subtitle="Completá tus datos personales"
      footer={<>¿Ya tenés cuenta? <Link className="font-medium underline" to="/login">Ingresar</Link></>}>
      {error && <Error text={error} />}
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" error={errors.first_name}><Input className="h-11" maxLength={MAX_PROFILE_TEXT_LENGTH} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
          <Field label="Apellido" error={errors.last_name}><Input className="h-11" maxLength={MAX_PROFILE_TEXT_LENGTH} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
          <Field label="CUIL" hint="00-00.000.000-0" error={errors.cuil}><CuilInput className="h-11" value={form.cuil} onChange={(v) => setForm({ ...form, cuil: v })} /></Field>
          <Field label="Localidad" error={errors.locality}><Input className="h-11" maxLength={MAX_PROFILE_TEXT_LENGTH} value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })} /></Field>
          <Field label="Email" error={errors.email} className="sm:col-span-2"><Input className="h-11" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Teléfono" hint="Código de país, área y número" error={errors.phone} className="sm:col-span-2"><PhoneInput value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} /></Field>
          <Field label="CVU / CBU" hint="22 dígitos" error={errors.cvu_cbu} className="sm:col-span-2"><CvuInput className="h-11" value={form.cvu_cbu} onChange={(v) => setForm({ ...form, cvu_cbu: v })} /></Field>
        </div>
        <Field label="Contraseña" error={errors.password}><Input className="h-11" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <Field label="Confirmar contraseña" error={errors.confirmPassword}><Input className="h-11" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></Field>
        <FormErrors errors={errors} />
        <Button className="h-12 w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
        </Button>
      </form>
    </AuthLayout>
  );
}

function Error({ text }) {
  return <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{text}</div>;
}