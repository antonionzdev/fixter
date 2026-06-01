"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { ensureUserProfile } from "@/lib/profiles";
import { getSupabase } from "@/lib/supabase";
import { authInputClassName, authLabelClassName } from "./form-styles";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ReactNode>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const usernameValue = username.trim();

      if (!/^[a-z0-9_]{3,20}$/.test(usernameValue)) {
        setError(
          "El nombre de usuario debe tener entre 3 y 20 caracteres; solo letras minúsculas, números y guiones bajos.",
        );
        return;
      }

      const supabase = getSupabase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: usernameValue,
            full_name: name.trim(),
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("user already registered")) {
          setError(
            <>
              Este correo ya está registrado.{" "}
              <Link
                href="/login"
                className="font-medium underline underline-offset-2 hover:text-red-900"
              >
                ¿Quieres iniciar sesión?
              </Link>
            </>
          );
        } else {
          setError(getAuthErrorMessage(signUpError));
        }
        return;
      }

      // When email confirmation is on, Supabase silently "succeeds" for existing
      // emails but returns identities: [] instead of an error (anti-enumeration).
      if (data.user?.identities?.length === 0) {
        setError(
          <>
            Este correo ya está registrado.{" "}
            <Link
              href="/login"
              className="font-medium underline underline-offset-2 hover:text-red-900"
            >
              ¿Quieres iniciar sesión?
            </Link>
          </>
        );
        return;
      }

      if (data.session?.user) {
        await ensureUserProfile(supabase, data.session.user);
        router.push("/");
        router.refresh();
        return;
      }

      setSuccess(
        "Cuenta creada. Revisa tu correo para confirmar el registro antes de iniciar sesión.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo conectar con el servidor. Comprueba la configuración de Supabase.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {success}
        </p>
      )}

      <div>
        <label htmlFor="name" className={authLabelClassName}>
          Nombre
        </label>
        <input
          id="name"
          type="text"
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          className={authInputClassName}
          placeholder="Tu nombre"
        />
      </div>

      <div>
        <label htmlFor="email" className={authLabelClassName}>
          Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className={authInputClassName}
          placeholder="tu@email.com"
        />
      </div>

      <div>
        <label htmlFor="username" className={authLabelClassName}>
          Nombre de usuario
        </label>
        <input
          id="username"
          type="text"
          name="username"
          autoComplete="username"
          required
          minLength={3}
          maxLength={20}
          pattern="^[a-z0-9_]+$"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          className={authInputClassName}
          placeholder="tu_usuario"
        />
        <p className="mt-2 text-sm text-zinc-500">
          Solo letras minúsculas, números y _
        </p>
      </div>

      <div>
        <label htmlFor="password" className={authLabelClassName}>
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className={authInputClassName}
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creando cuenta…" : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-zinc-500">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline-offset-2 hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
