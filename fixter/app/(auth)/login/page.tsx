import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión — Fixter",
  description: "Accede a tu cuenta de Fixter",
};

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Iniciar sesión
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Accede para comprar y vender piezas de reparación
      </p>
      <div className="mt-8">
        <LoginForm redirectTo={redirect} />
      </div>
    </>
  );
}
