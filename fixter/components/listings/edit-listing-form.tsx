"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { MAX_LISTING_IMAGES } from "@/lib/constants/categories";
import type { ListingDetailWithSeller } from "@/lib/types/listing";

// ---------------------------------------------------------------------------
// DATA (same arrays as publish-form.tsx)
// ---------------------------------------------------------------------------

const MODEL_OPTIONS = [
  "iPhone 7",
  "iPhone 7 Plus",
  "iPhone 8",
  "iPhone 8 Plus",
  "iPhone X",
  "iPhone XS",
  "iPhone XS Max",
  "iPhone XR",
  "iPhone 11",
  "iPhone 11 Pro",
  "iPhone 11 Pro Max",
  "iPhone 12",
  "iPhone 12 Mini",
  "iPhone 12 Pro",
  "iPhone 12 Pro Max",
  "iPhone 13",
  "iPhone 13 Mini",
  "iPhone 13 Pro",
  "iPhone 13 Pro Max",
  "iPhone 14",
  "iPhone 14 Plus",
  "iPhone 14 Pro",
  "iPhone 14 Pro Max",
  "iPhone 15",
  "iPhone 15 Plus",
  "iPhone 15 Pro",
  "iPhone 15 Pro Max",
  "iPhone 16",
  "iPhone 16 Plus",
  "iPhone 16 Pro",
  "iPhone 16 Pro Max",
];

const CATEGORIES: { value: string; label: string }[] = [
  { value: "pantallas", label: "Pantallas" },
  { value: "baterias", label: "Baterías" },
  { value: "camaras", label: "Cámaras" },
  { value: "conectores", label: "Conectores y puertos" },
  { value: "carcasas", label: "Carcasas y chasis" },
  { value: "moviles_despiece", label: "Móviles para despiece" },
  { value: "otros_componentes", label: "Otros componentes" },
];

const CONDITIONS: { value: string; label: string }[] = [
  { value: "nuevo", label: "Nuevo" },
  { value: "como_nuevo", label: "Como nuevo" },
  { value: "bueno", label: "Bueno" },
  { value: "aceptable", label: "Aceptable" },
];

type SpecField = { key: string; label: string; options: string[] };

const CATEGORY_SPECS: Record<string, SpecField[]> = {
  pantallas: [
    { key: "tipo_panel", label: "Tipo de panel", options: ["OLED", "AMOLED", "LCD", "Retina"] },
    { key: "tipo_pieza", label: "Tipo de pieza", options: ["Original", "Compatible calidad alta", "Compatible estándar"] },
    { key: "estado_cristal", label: "Estado del cristal", options: ["Sin rayaduras", "Rayaduras leves", "Rayaduras visibles", "Pantalla rota"] },
    { key: "tactil", label: "Táctil", options: ["Funciona perfecto", "Falla en zonas", "No funciona"] },
    { key: "imagen", label: "Imagen", options: ["Sin defectos", "Manchas", "Píxeles muertos", "Líneas"] },
    { key: "marco_incluido", label: "Marco incluido", options: ["Sí", "No"] },
  ],
  baterias: [
    { key: "tipo_pieza", label: "Tipo de pieza", options: ["Original", "Compatible"] },
    { key: "salud_bateria", label: "Salud de la batería", options: ["100-90%", "89-80%", "79-70%", "Menos del 70%", "Desconocida"] },
    { key: "estado_fisico", label: "Estado físico", options: ["Sin hinchazón", "Hinchada"] },
  ],
  camaras: [
    { key: "posicion", label: "Posición", options: ["Trasera", "Frontal", "Módulo completo trasero"] },
    { key: "tipo_pieza", label: "Tipo de pieza", options: ["Original", "Compatible"] },
    { key: "estado_optico", label: "Estado óptico", options: ["Sin rayaduras", "Rayaduras leves", "Rayaduras visibles"] },
    { key: "autofocus", label: "Autofocus", options: ["Funciona", "No funciona"] },
    { key: "ois", label: "OIS", options: ["Funciona", "No funciona", "No aplica"] },
    { key: "flash_incluido", label: "Flash incluido", options: ["Sí", "No"] },
  ],
  conectores: [
    { key: "tipo_conector", label: "Tipo de conector", options: ["Lightning", "USB-C"] },
    { key: "tipo_pieza", label: "Tipo de pieza", options: ["Original", "Compatible"] },
    { key: "estado", label: "Estado", options: ["Nuevo", "Usado sin daños", "Desgaste visible"] },
    { key: "carga_inalambrica", label: "Carga inalámbrica incluida", options: ["Sí", "No"] },
  ],
  carcasas: [
    { key: "estado", label: "Estado", options: ["Sin daños", "Arañazos leves", "Golpes visibles", "Doblado"] },
    { key: "color", label: "Color", options: ["Negro", "Blanco", "Azul", "Rojo", "Natural", "Otro"] },
    { key: "botones_incluidos", label: "Botones incluidos", options: ["Sí", "No"] },
    { key: "cristal_trasero_incluido", label: "Cristal trasero incluido", options: ["Sí", "No"] },
  ],
  moviles_despiece: [
    { key: "pantalla", label: "Pantalla", options: ["Funciona perfecta", "Funciona con defectos", "No funciona"] },
    { key: "bateria", label: "Batería", options: ["Funciona", "No funciona"] },
    { key: "chasis", label: "Chasis", options: ["Sin daños", "Arañazos", "Golpes", "Doblado"] },
    { key: "tactil", label: "Táctil", options: ["Funciona", "No funciona"] },
    { key: "camara_trasera", label: "Cámara trasera", options: ["Funciona", "No funciona"] },
    { key: "face_id_touch_id", label: "Face ID / Touch ID", options: ["Funciona", "No funciona", "No aplica"] },
    { key: "bloqueado_por_cuenta", label: "Bloqueado por cuenta", options: ["Libre", "Bloqueado iCloud", "Bloqueado Google"] },
    { key: "imei", label: "IMEI", options: ["Limpio", "Con incidencias", "Desconocido"] },
  ],
  otros_componentes: [
    { key: "tipo_componente", label: "Tipo de componente", options: ["Altavoz", "Micrófono", "Vibrador", "Placa base", "Sensor", "Cable flex", "Otro"] },
    { key: "tipo_pieza", label: "Tipo de pieza", options: ["Original", "Compatible"] },
    { key: "estado", label: "Estado", options: ["Nuevo", "Usado funcional", "Sin probar"] },
  ],
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const inputCls =
  "mt-1.5 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

const labelCls = "text-sm font-medium text-zinc-700";

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

type EditListingFormProps = {
  listing: ListingDetailWithSeller;
};

export default function EditListingForm({ listing }: EditListingFormProps) {
  const router = useRouter();
  const supabase = getSupabase();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // General fields — pre-populated from listing
  const [category, setCategory] = useState(listing.category ?? "");
  const [model, setModel] = useState(listing.model ?? "");
  const [title, setTitle] = useState(listing.title ?? "");
  const [description, setDescription] = useState(listing.description ?? "");
  const [price, setPrice] = useState(String(listing.price ?? ""));
  const [condition, setCondition] = useState(listing.condition ?? "");
  const [location, setLocation] = useState(listing.location ?? "");
  const [shipping, setShipping] = useState(
    (listing as Record<string, unknown>).shipping_available === true,
  );

  // Specs — pre-populated; only reset when category actually changes after mount
  const [specs, setSpecs] = useState<Record<string, string>>(listing.specs ?? {});
  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) {
      setSpecs({});
    }
    mountedRef.current = true;
  }, [category]);

  // Images — split between existing URLs and new File objects
  const [existingImages, setExistingImages] = useState<string[]>(
    Array.isArray(listing.images) ? listing.images : [],
  );
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Preview URLs for new files (revoked on cleanup)
  const newImagePreviews = useMemo(
    () => newImageFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [newImageFiles],
  );
  useEffect(() => {
    return () => {
      newImagePreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [newImagePreviews]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleSpecChange(key: string, value: string) {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  }

  function removeExistingImage(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewImage(index: number) {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormError("");
    const selected = Array.from(e.target.files ?? []);
    const maxNew = MAX_LISTING_IMAGES - existingImages.length;
    const combined = [...newImageFiles, ...selected].slice(0, maxNew);
    setNewImageFiles(combined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    if (submitting) return;

    if (!category || !model || !title.trim() || !price || !condition) {
      setFormError("Por favor, completa todos los campos obligatorios.");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setFormError("Debes iniciar sesión para editar el anuncio.");
      setSubmitting(false);
      return;
    }

    // Upload new images
    const newImageUrls: string[] = [];
    const uploadedPaths: string[] = [];

    for (const file of newImageFiles) {
      const safeName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const uploadPath = `${user.id}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(uploadPath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        await supabase.storage.from("listing-images").remove(uploadedPaths);
        setFormError("Error al subir las imágenes. Inténtalo de nuevo.");
        setSubmitting(false);
        return;
      }

      uploadedPaths.push(uploadPath);

      const { data: urlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(uploadPath);
      newImageUrls.push(urlData.publicUrl);
    }

    const allImages = [...existingImages, ...newImageUrls];

    // Update listing — .eq("seller_id") prevents editing another user's listing
    const { data: updated, error: updateError } = await supabase
      .from("listings")
      .update({
        category,
        model,
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        condition,
        location: location.trim(),
        shipping_available: shipping,
        images: allImages,
        specs,
      })
      .eq("id", listing.id)
      .eq("seller_id", user.id)
      .select("id")
      .maybeSingle();

    if (updateError || !updated) {
      await supabase.storage.from("listing-images").remove(uploadedPaths);
      setFormError(
        updateError?.message ?? "No se pudo guardar los cambios. Inténtalo de nuevo.",
      );
      setSubmitting(false);
      return;
    }

    router.push(`/listings/${listing.id}`);
  }

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const activeSpecs = category ? (CATEGORY_SPECS[category] ?? []) : [];
  const totalImages = existingImages.length + newImageFiles.length;
  const canAddMore = totalImages < MAX_LISTING_IMAGES;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* ── SECCIÓN 1: DETALLES GENERALES ─────────────────────────────────── */}
      <Section title="Detalles generales" subtitle="Categoría, modelo y datos básicos del anuncio.">
        <div className="grid gap-5 sm:grid-cols-2">

          {/* Categoría */}
          <div>
            <label htmlFor="edit-category" className={labelCls}>
              Categoría <Required />
            </label>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
              required
            >
              <option value="">Selecciona una categoría</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Modelo */}
          <div>
            <label htmlFor="edit-model" className={labelCls}>
              Modelo de iPhone <Required />
            </label>
            <select
              id="edit-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={inputCls}
              required
            >
              <option value="">Selecciona un modelo</option>
              {MODEL_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div className="sm:col-span-2">
            <label htmlFor="edit-title" className={labelCls}>
              Título <Required />
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Pantalla iPhone 13 Pro OLED original"
              className={inputCls}
              required
            />
          </div>

          {/* Descripción */}
          <div className="sm:col-span-2">
            <label htmlFor="edit-description" className={labelCls}>
              Descripción
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe el estado, compatibilidad o detalles importantes"
              className={inputCls}
            />
          </div>

          {/* Precio */}
          <div>
            <label htmlFor="edit-price" className={labelCls}>
              Precio (€) <Required />
            </label>
            <input
              id="edit-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
              className={inputCls}
              required
            />
          </div>

          {/* Condición */}
          <div>
            <label htmlFor="edit-condition" className={labelCls}>
              Condición <Required />
            </label>
            <select
              id="edit-condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className={inputCls}
              required
            >
              <option value="">Selecciona condición</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ubicación */}
          <div className="sm:col-span-2">
            <label htmlFor="edit-location" className={labelCls}>
              Ubicación
            </label>
            <input
              id="edit-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ciudad, provincia o zona"
              className={inputCls}
            />
          </div>

          {/* Envío */}
          <div className="sm:col-span-2">
            <label
              htmlFor="edit-shipping"
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 transition hover:bg-zinc-100"
            >
              <input
                id="edit-shipping"
                type="checkbox"
                checked={shipping}
                onChange={(e) => setShipping(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-sky-600"
              />
              <span className="text-sm text-zinc-700">Envío disponible</span>
            </label>
          </div>
        </div>
      </Section>

      {/* ── SECCIÓN 2: ESPECIFICACIONES TÉCNICAS ──────────────────────────── */}
      {activeSpecs.length > 0 && (
        <Section
          title="Especificaciones técnicas"
          subtitle="Actualiza la información técnica según la categoría."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {activeSpecs.map((field) => (
              <div key={field.key}>
                <label htmlFor={`spec-${field.key}`} className={labelCls}>
                  {field.label}
                </label>
                <select
                  id={`spec-${field.key}`}
                  value={specs[field.key] ?? ""}
                  onChange={(e) => handleSpecChange(field.key, e.target.value)}
                  className={inputCls}
                >
                  <option value="">Selecciona una opción</option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── SECCIÓN 3: IMÁGENES ───────────────────────────────────────────── */}
      <Section
        title="Imágenes"
        subtitle={`Hasta ${MAX_LISTING_IMAGES} fotos. La primera es la imagen principal.`}
      >
        {/* Drop zone / file picker */}
        {canAddMore && (
          <label
            htmlFor="edit-images"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-6 py-8 text-center transition hover:border-sky-400 hover:bg-sky-50"
          >
            <span className="text-2xl">📎</span>
            <span className="text-sm font-medium text-zinc-700">
              Haz clic para añadir fotos
            </span>
            <span className="text-xs text-zinc-400">
              {totalImages}/{MAX_LISTING_IMAGES} imágenes — JPG, PNG, WEBP
            </span>
            <input
              id="edit-images"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        )}

        {/* Image grid: existing first, then new */}
        {totalImages > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {existingImages.map((url, idx) => (
              <div
                key={`existing-${idx}`}
                className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm"
              >
                {idx === 0 && (
                  <span className="absolute left-2 top-2 z-10 rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                    Principal
                  </span>
                )}
                <img
                  src={url}
                  alt={`Imagen ${idx + 1}`}
                  className="h-32 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(idx)}
                  aria-label={`Eliminar imagen ${idx + 1}`}
                  className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-zinc-600 shadow opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
                >
                  ✕
                </button>
              </div>
            ))}
            {newImagePreviews.map((preview, idx) => {
              const globalIdx = existingImages.length + idx;
              return (
                <div
                  key={`new-${preview.file.name}-${idx}`}
                  className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm"
                >
                  {globalIdx === 0 && (
                    <span className="absolute left-2 top-2 z-10 rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                      Principal
                    </span>
                  )}
                  <img
                    src={preview.url}
                    alt={`Nueva imagen ${idx + 1}`}
                    className="h-32 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    aria-label={`Eliminar nueva imagen ${idx + 1}`}
                    className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-zinc-600 shadow opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!canAddMore && (
          <p className="mt-3 text-xs text-zinc-400">
            Has alcanzado el máximo de {MAX_LISTING_IMAGES} imágenes.
          </p>
        )}
      </Section>

      {/* ── ERROR ─────────────────────────────────────────────────────────── */}
      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {formError}
        </div>
      )}

      {/* ── ACTIONS ───────────────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

function Required() {
  return <span className="text-rose-500">*</span>;
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
