-- =============================================================================
-- Fixter: perfiles automáticos para auth.users
-- Requiere: profiles.id = auth.users.id
-- Ejecuta en Supabase → SQL Editor
-- =============================================================================

-- 1) Rellena perfiles para usuarios existentes sin fila en profiles
INSERT INTO public.profiles (id, username)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data ->> 'full_name',
    split_part(u.email, '@', 1),
    'Usuario'
  )
FROM auth.users AS u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles AS p WHERE p.id = u.id
);

-- 2) Trigger: crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      split_part(NEW.email, '@', 1),
      'Usuario'
    )
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
