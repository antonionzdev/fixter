import type { SupabaseClient } from "@supabase/supabase-js";
import {
  LISTING_IMAGES_BUCKET,
  MAX_IMAGE_SIZE_BYTES,
  MAX_LISTING_IMAGES,
} from "@/lib/constants/categories";
import { ensureUserProfileById } from "@/lib/profiles";
import type { ListingInsert, PublishListingInput } from "@/lib/types/listing";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export function getListingImagePublicUrl(
  supabase: SupabaseClient,
  storagePath: string,
): string {
  const { data } = supabase.storage
    .from(LISTING_IMAGES_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function uploadListingImages(
  supabase: SupabaseClient,
  userId: string,
  files: File[],
): Promise<string[]> {
  if (files.length === 0) {
    throw new Error("Debes subir al menos una imagen.");
  }

  if (files.length > MAX_LISTING_IMAGES) {
    throw new Error(`Máximo ${MAX_LISTING_IMAGES} imágenes por anuncio.`);
  }

  const urls: string[] = [];
  const batchId = crypto.randomUUID();

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`"${file.name}" no es una imagen válida.`);
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(`"${file.name}" supera el límite de 5 MB.`);
    }

    const storagePath = `${userId}/${batchId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from(LISTING_IMAGES_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(
        formatSupabaseError(
          uploadError.message,
          `No se pudo subir "${file.name}".`,
          "storage",
        ),
      );
    }

    urls.push(getListingImagePublicUrl(supabase, storagePath));
  }

  return urls;
}

export async function createListing(
  supabase: SupabaseClient,
  input: PublishListingInput,
  imageUrls: string[],
  sellerId: string,
  sellerMetadata?: { full_name?: string },
): Promise<void> {
  await ensureUserProfileById(supabase, sellerId, sellerMetadata);

  const payload: ListingInsert = {
    seller_id: sellerId,
    title: input.title.trim(),
    description: input.description.trim(),
    price: input.price,
    category: input.category,
    brand: input.brand.trim(),
    model: input.model.trim(),
    condition: input.condition,
    location: input.location.trim(),
    images: imageUrls,
    status: "active",
  };

  const { error } = await supabase.from("listings").insert(payload);

  if (error) {
    throw new Error(
      formatSupabaseError(
        error.message,
        "No se pudo guardar el anuncio.",
        "listings",
      ),
    );
  }
}

function formatSupabaseError(
  message: string | undefined,
  fallback: string,
  scope: "storage" | "listings",
): string {
  const msg = message ?? fallback;

  if (msg.toLowerCase().includes("row-level security")) {
    return scope === "storage"
      ? `${msg} Ejecuta fixter/supabase/fix-rls.sql en el SQL Editor de Supabase (políticas del bucket listing-images).`
      : `${msg} Ejecuta fixter/supabase/fix-rls.sql en el SQL Editor de Supabase (políticas de la tabla listings). Comprueba que seller_id = tu usuario autenticado.`;
  }

  if (msg.includes("listings_seller_id_fkey")) {
    return "Tu perfil de vendedor no existe en la base de datos. Cierra sesión, vuelve a entrar, o ejecuta fixter/supabase/create-profile-trigger.sql en Supabase.";
  }

  return msg;
}

export function validatePublishInput(
  input: PublishListingInput,
  imageCount: number,
): string | null {
  if (!input.title.trim()) {
    return "El título es obligatorio.";
  }

  if (!Number.isFinite(input.price) || input.price <= 0) {
    return "Introduce un precio válido mayor que 0.";
  }

  if (!input.category) {
    return "Selecciona una categoría.";
  }

  if (!input.condition) {
    return "Selecciona la condición de la pieza.";
  }

  if (imageCount < 1) {
    return "Sube al menos una imagen.";
  }

  return null;
}
