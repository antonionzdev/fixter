"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { MAX_LISTING_IMAGES } from "@/lib/constants/categories";

// ---------------------------------------------------------------------------
// DATA
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
  "mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900";

const labelCls = "text-sm font-semibold text-zinc-900";

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export default function PublishForm() {
  const router = useRouter();
  const supabase = getSupabase();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // General fields
  const [category, setCategory] = useState("");
  const [model, setModel] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");
  const [shipping, setShipping] = useState(false);

  // Specs (dynamic per category)
  const [specs, setSpecs] = useState<Record<string, string>>({});

  // Images
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Reset specs when category changes
  useEffect(() => {
    setSpecs({});
  }, [category]);

  // Image preview URLs (memoised, revoked on cleanup)
  const imagePreviews = useMemo(
    () => imageFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [imageFiles],
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [imagePreviews]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleSpecChange(key: string, value: string) {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormError("");
    const selected = Array.from(e.target.files ?? []);
    const combined = [...imageFiles, ...selected].slice(0, MAX_LISTING_IMAGES);
    setImageFiles(combined);
    // Reset input so same file can be re-added after removal
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    if (submitting) return;

    // Validate required
    if (!category || !model || !title.trim() || Number(price) <= 0 || !condition) {
      setFormError("Por favor, completa todos los campos obligatorios.");
      return;
    }

    setSubmitting(true);

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setFormError("Debes iniciar sesión para publicar un anuncio.");
      setSubmitting(false);
      return;
    }

    // Validate images before upload
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    for (const file of imageFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFormError("Solo se permiten imágenes JPG, PNG, WEBP o GIF.");
        setSubmitting(false);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFormError("Cada imagen debe pesar menos de 10 MB.");
        setSubmitting(false);
        return;
      }
    }

    // Upload images
    const imageUrls: string[] = [];
    const uploadedPaths: string[] = [];

    for (const file of imageFiles) {
      const uploadPath = `${user.id}/${crypto.randomUUID()}`;

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

      imageUrls.push(urlData.publicUrl);
    }

    // Insert listing
    const { data: insertData, error: insertError } = await supabase
      .from("listings")
      .insert({
        seller_id: user.id,
        status: "active",
        category,
        model,
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        condition,
        location: location.trim(),
        shipping_available: shipping,
        images: imageUrls,
        specs,
      })
      .select("id")
      .single();

    if (insertError || !insertData?.id) {
      await supabase.storage.from("listing-images").remove(uploadedPaths);
      setFormError("No se pudo guardar el anuncio. Inténtalo de nuevo.");
      setSubmitting(false);
      return;
    }

    router.push(`/listings/${insertData.id}`);
  }

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const activeSpecs = category ? (CATEGORY_SPECS[category] ?? []) : [];
  const canAddMore = imageFiles.length < MAX_LISTING_IMAGES;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* ── VOLVER ────────────────────────────────────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
        >
          ← Volver
        </button>
      </div>

      {/* ── SECCIÓN 1: DETALLES GENERALES ─────────────────────────────────── */}
      <Section title="Detalles generales" subtitle="Elige categoría, modelo y completa la información básica.">
        <div className="grid gap-5 sm:grid-cols-2">

          {/* Categoría */}
          <div>
            <label htmlFor="pub-category" className={labelCls}>
              Categoría <Required />
            </label>
            <select
              id="pub-category"
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
            <label htmlFor="pub-model" className={labelCls}>
              Modelo de iPhone <Required />
            </label>
            <select
              id="pub-model"
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
            <label htmlFor="pub-title" className={labelCls}>
              Título <Required />
            </label>
            <input
              id="pub-title"
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
            <label htmlFor="pub-description" className={labelCls}>
              Descripción
            </label>
            <textarea
              id="pub-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe el estado, compatibilidad o detalles importantes"
              className={inputCls}
            />
            <Hint text="Incluye estado, compatibilidad y defectos. Los anuncios detallados se venden más rápido." />
          </div>

          {/* Precio */}
          <div>
            <label htmlFor="pub-price" className={labelCls}>
              Precio (€) <Required />
            </label>
            <input
              id="pub-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className={inputCls}
              required
            />
            <Hint text="Revisa precios similares antes de publicar. Un precio competitivo recibe más visitas." />
          </div>

          {/* Condición */}
          <div>
            <label htmlFor="pub-condition" className={labelCls}>
              Condición <Required />
            </label>
            <select
              id="pub-condition"
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
            <Hint text="Sé honesto con el estado. Los compradores valoran la transparencia." />
          </div>

          {/* Ubicación */}
          <div className="sm:col-span-2">
            <label htmlFor="pub-location" className={labelCls}>
              Ubicación
            </label>
            <input
              id="pub-location"
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
              htmlFor="pub-shipping"
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                shipping
                  ? "border-[#FF6B2B] bg-[#FFF5F0]"
                  : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
              }`}
            >
              <input
                id="pub-shipping"
                type="checkbox"
                checked={shipping}
                onChange={(e) => setShipping(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-[#FF6B2B]"
              />
              <span className="text-sm text-zinc-700">Envío disponible</span>
            </label>
            <Hint text="Los vendedores con envío activo reciben más contactos." />
          </div>
        </div>
      </Section>

      {/* ── SECCIÓN 2: ESPECIFICACIONES TÉCNICAS ──────────────────────────── */}
      {activeSpecs.length > 0 && (
        <Section
          title="Especificaciones técnicas"
          subtitle="Completa la información técnica según la categoría elegida."
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
          <p className="mt-4 text-xs text-[#999]">
            Completar las especificaciones técnicas mejora la visibilidad de tu anuncio en los filtros de búsqueda.
          </p>
        </Section>
      )}

      {/* ── SECCIÓN 3: IMÁGENES ───────────────────────────────────────────── */}
      <Section
        title="Imágenes"
        subtitle={`Sube hasta ${MAX_LISTING_IMAGES} fotos. La primera será la imagen principal.`}
      >
        {/* Drop zone / file picker */}
        {canAddMore && (
          <label
            htmlFor="pub-images"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-[#FAFAFA] px-6 py-8 text-center transition hover:border-zinc-900 hover:bg-[#F0F0F0]"
          >
            <svg className="h-7 w-7 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <span className="text-sm font-semibold text-zinc-900">
              Haz clic para añadir fotos
            </span>
            <span className="text-xs text-zinc-400">
              <span className="font-semibold text-[#FF6B2B]">
                {imageFiles.length}/{MAX_LISTING_IMAGES} imágenes
              </span>
              {" — JPG, PNG, WEBP"}
            </span>
            <input
              id="pub-images"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        )}

        <Hint text="Sube al menos 3 fotos desde distintos ángulos. Más fotos = más contactos." />

        {/* Previews */}
        {imagePreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {imagePreviews.map((preview, index) => (
              <div
                key={`${preview.file.name}-${index}`}
                className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 shadow-sm"
              >
                {/* Badge imagen principal */}
                {index === 0 && (
                  <span className="absolute left-2 top-2 z-10 rounded-full bg-[#FF6B2B] px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                    Principal
                  </span>
                )}
                <img
                  src={preview.url}
                  alt={`Vista previa ${index + 1}`}
                  className="h-32 w-full object-cover"
                />
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  aria-label={`Eliminar imagen ${index + 1}`}
                  className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-zinc-600 shadow transition hover:bg-rose-50 hover:text-rose-600"
                >
                  ✕
                </button>
              </div>
            ))}
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

      {/* ── SUBMIT ────────────────────────────────────────────────────────── */}
      <button
        type="submit"
        id="pub-submit"
        disabled={submitting}
        className="flex h-[52px] w-full items-center justify-center rounded-lg bg-zinc-950 px-6 text-sm font-bold text-white transition-[opacity,background-color] duration-200 hover:bg-[#222] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Publicando…" : "Publicar anuncio"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

function Required() {
  return <span className="text-[#FF6B2B]">*</span>;
}

function Hint({ text }: { text: string }) {
  return <p className="mt-1.5 text-xs text-[#999]">{text}</p>;
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
        <h2 className="text-base font-bold text-zinc-900">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
