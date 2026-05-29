"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { authInputClassName, authLabelClassName } from "@/components/auth/form-styles";
import { LISTING_CATEGORIES } from "@/lib/constants/categories";
import {
  createListing,
  uploadListingImages,
  validatePublishInput,
} from "@/lib/listings";
import { getSupabase } from "@/lib/supabase";
import type { PublishListingInput } from "@/lib/types/listing";
import { ImageUploadField } from "./image-upload-field";

type FormStatus = "idle" | "loading" | "success";

export function PublishForm() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userMeta, setUserMeta] = useState<{ full_name?: string }>({});

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<File[]>([]);

  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = getSupabase();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.replace("/login?redirect=/publish");
          return;
        }

        setUserId(session.user.id);
        setUserMeta({
          full_name: session.user.user_metadata?.full_name as
            | string
            | undefined,
        });
        setAuthChecked(true);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo verificar la sesión.",
        );
        setAuthChecked(true);
      }
    }

    checkAuth();
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setImageError(null);

    const input: PublishListingInput = {
      title,
      description,
      price: parseFloat(price.replace(",", ".")),
      category,
      brand,
      model,
      location,
    };

    const validationError = validatePublishInput(input, images.length);
    if (validationError) {
      if (images.length < 1) {
        setImageError(validationError);
      } else {
        setError(validationError);
      }
      return;
    }

    if (!userId) {
      setError("Debes iniciar sesión para publicar.");
      return;
    }

    setStatus("loading");

    try {
      const supabase = getSupabase();
      const imageUrls = await uploadListingImages(supabase, userId, images);
      await createListing(supabase, input, imageUrls, userId, userMeta);

      setStatus("success");
      router.push("/");
      router.refresh();
    } catch (err) {
      setStatus("idle");
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo publicar el anuncio. Inténtalo de nuevo.",
      );
    }
  }

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-zinc-500">Comprobando sesión…</p>
      </div>
    );
  }

  if (!userId && error) {
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      >
        {error}
      </p>
    );
  }

  if (!userId) {
    return null;
  }

  const isLoading = status === "loading";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      {status === "success" && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          Anuncio publicado correctamente. Redirigiendo…
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className={authLabelClassName}>
            Título <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            className={authInputClassName}
            placeholder="Ej. Pantalla iPhone 13 Pro OLED"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className={authLabelClassName}>
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            className={`${authInputClassName} resize-y min-h-[120px]`}
            placeholder="Estado, compatibilidad, garantía…"
          />
        </div>

        <div>
          <label htmlFor="price" className={authLabelClassName}>
            Precio (€) <span className="text-red-500">*</span>
          </label>
          <input
            id="price"
            name="price"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={isLoading}
            className={authInputClassName}
            placeholder="0.00"
          />
        </div>

        <div>
          <label htmlFor="category" className={authLabelClassName}>
            Categoría <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isLoading}
            className={authInputClassName}
          >
            <option value="">Selecciona una categoría</option>
            {LISTING_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="brand" className={authLabelClassName}>
            Marca
          </label>
          <input
            id="brand"
            name="brand"
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            disabled={isLoading}
            className={authInputClassName}
            placeholder="Apple, Samsung…"
          />
        </div>

        <div>
          <label htmlFor="model" className={authLabelClassName}>
            Modelo
          </label>
          <input
            id="model"
            name="model"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={isLoading}
            className={authInputClassName}
            placeholder="iPhone 13 Pro…"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="location" className={authLabelClassName}>
            Ubicación
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isLoading}
            className={authInputClassName}
            placeholder="Ciudad o provincia"
          />
        </div>

        <div className="sm:col-span-2">
          <ImageUploadField
            files={images}
            onChange={(next) => {
              setImages(next);
              if (next.length > 0) setImageError(null);
            }}
            disabled={isLoading}
            error={imageError}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-zinc-900 py-3.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[200px] sm:px-8"
      >
        {isLoading ? "Publicando anuncio…" : "Publicar anuncio"}
      </button>
    </form>
  );
}
