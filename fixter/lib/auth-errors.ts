export function getAuthErrorMessage(error: { message: string }): string {
  const msg = error.message.toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return "Email o contraseña incorrectos.";
  }
  if (msg.includes("user already registered")) {
    return "Ya existe una cuenta con este email.";
  }
  if (msg.includes("password should be at least")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (msg.includes("unable to validate email")) {
    return "Introduce un email válido.";
  }
  if (msg.includes("email not confirmed")) {
    return "Confirma tu email antes de iniciar sesión.";
  }
  if (msg.includes("signup is disabled")) {
    return "El registro no está disponible en este momento.";
  }
  if (msg.includes("rate limit")) {
    return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  }

  return error.message || "Ha ocurrido un error. Inténtalo de nuevo.";
}
