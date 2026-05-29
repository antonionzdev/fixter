import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Crear cuenta — Fixter",
  description: "Regístrate en Fixter",
};

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Crear cuenta
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Únete al marketplace de piezas para smartphones
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </>
  );
}
