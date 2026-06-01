"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ListingFilters } from "@/lib/types/listing";

// ---------------------------------------------------------------------------
// DATA (mismos valores que publish-form.tsx)
// ---------------------------------------------------------------------------

const MODEL_OPTIONS = [
  "iPhone 7", "iPhone 7 Plus",
  "iPhone 8", "iPhone 8 Plus",
  "iPhone X", "iPhone XS", "iPhone XS Max", "iPhone XR",
  "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
  "iPhone 12", "iPhone 12 Mini", "iPhone 12 Pro", "iPhone 12 Pro Max",
  "iPhone 13", "iPhone 13 Mini", "iPhone 13 Pro", "iPhone 13 Pro Max",
  "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
  "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
  "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max",
];

const CATEGORIES: { value: string; label: string }[] = [
  { value: "pantallas",          label: "Pantallas" },
  { value: "baterias",           label: "Baterías" },
  { value: "camaras",            label: "Cámaras" },
  { value: "conectores",         label: "Conectores y puertos" },
  { value: "carcasas",           label: "Carcasas y chasis" },
  { value: "moviles_despiece",   label: "Móviles para despiece" },
  { value: "otros_componentes",  label: "Otros componentes" },
];

const CONDITIONS: { value: string; label: string }[] = [
  { value: "nuevo",      label: "Nuevo" },
  { value: "como_nuevo", label: "Como nuevo" },
  { value: "bueno",      label: "Bueno" },
  { value: "aceptable",  label: "Aceptable" },
];

type SpecField = { key: string; label: string; options: string[] };

const CATEGORY_SPECS: Record<string, SpecField[]> = {
  pantallas: [
    { key: "tipo_panel",    label: "Tipo de panel",    options: ["OLED", "AMOLED", "LCD", "Retina"] },
    { key: "tipo_pieza",    label: "Tipo de pieza",    options: ["Original", "Compatible calidad alta", "Compatible estándar"] },
    { key: "estado_cristal",label: "Estado del cristal",options: ["Sin rayaduras", "Rayaduras leves", "Rayaduras visibles", "Pantalla rota"] },
    { key: "tactil",        label: "Táctil",           options: ["Funciona perfecto", "Falla en zonas", "No funciona"] },
    { key: "imagen",        label: "Imagen",           options: ["Sin defectos", "Manchas", "Píxeles muertos", "Líneas"] },
    { key: "marco_incluido",label: "Marco incluido",   options: ["Sí", "No"] },
  ],
  baterias: [
    { key: "tipo_pieza",    label: "Tipo de pieza",    options: ["Original", "Compatible"] },
    { key: "salud_bateria", label: "Salud de la batería", options: ["100-90%", "89-80%", "79-70%", "Menos del 70%", "Desconocida"] },
    { key: "estado_fisico", label: "Estado físico",    options: ["Sin hinchazón", "Hinchada"] },
  ],
  camaras: [
    { key: "posicion",      label: "Posición",         options: ["Trasera", "Frontal", "Módulo completo trasero"] },
    { key: "tipo_pieza",    label: "Tipo de pieza",    options: ["Original", "Compatible"] },
    { key: "estado_optico", label: "Estado óptico",    options: ["Sin rayaduras", "Rayaduras leves", "Rayaduras visibles"] },
    { key: "autofocus",     label: "Autofocus",        options: ["Funciona", "No funciona"] },
    { key: "ois",           label: "OIS",              options: ["Funciona", "No funciona", "No aplica"] },
    { key: "flash_incluido",label: "Flash incluido",   options: ["Sí", "No"] },
  ],
  conectores: [
    { key: "tipo_conector",      label: "Tipo de conector",         options: ["Lightning", "USB-C"] },
    { key: "tipo_pieza",         label: "Tipo de pieza",            options: ["Original", "Compatible"] },
    { key: "estado",             label: "Estado",                   options: ["Nuevo", "Usado sin daños", "Desgaste visible"] },
    { key: "carga_inalambrica",  label: "Carga inalámbrica incluida", options: ["Sí", "No"] },
  ],
  carcasas: [
    { key: "estado",                    label: "Estado",                    options: ["Sin daños", "Arañazos leves", "Golpes visibles", "Doblado"] },
    { key: "color",                     label: "Color",                     options: ["Negro", "Blanco", "Azul", "Rojo", "Natural", "Otro"] },
    { key: "botones_incluidos",         label: "Botones incluidos",         options: ["Sí", "No"] },
    { key: "cristal_trasero_incluido",  label: "Cristal trasero incluido",  options: ["Sí", "No"] },
  ],
  moviles_despiece: [
    { key: "pantalla",            label: "Pantalla",           options: ["Funciona perfecta", "Funciona con defectos", "No funciona"] },
    { key: "bateria",             label: "Batería",            options: ["Funciona", "No funciona"] },
    { key: "chasis",              label: "Chasis",             options: ["Sin daños", "Arañazos", "Golpes", "Doblado"] },
    { key: "tactil",              label: "Táctil",             options: ["Funciona", "No funciona"] },
    { key: "camara_trasera",      label: "Cámara trasera",     options: ["Funciona", "No funciona"] },
    { key: "face_id_touch_id",    label: "Face ID / Touch ID", options: ["Funciona", "No funciona", "No aplica"] },
    { key: "bloqueado_por_cuenta",label: "Bloqueado por cuenta",options: ["Libre", "Bloqueado iCloud", "Bloqueado Google"] },
    { key: "imei",                label: "IMEI",               options: ["Limpio", "Con incidencias", "Desconocido"] },
  ],
  otros_componentes: [
    { key: "tipo_componente", label: "Tipo de componente", options: ["Altavoz", "Micrófono", "Vibrador", "Placa base", "Sensor", "Cable flex", "Otro"] },
    { key: "tipo_pieza",      label: "Tipo de pieza",      options: ["Original", "Compatible"] },
    { key: "estado",          label: "Estado",             options: ["Nuevo", "Usado funcional", "Sin probar"] },
  ],
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const SPEC_PREFIX = "specs_";

function paramsToFilters(params: URLSearchParams): {
  search: string;
  category: string;
  model: string;
  condition: string;
  priceMin: string;
  priceMax: string;
  specs: Record<string, string>;
} {
  const specs: Record<string, string> = {};
  params.forEach((value, key) => {
    if (key.startsWith(SPEC_PREFIX) && value) {
      specs[key.slice(SPEC_PREFIX.length)] = value;
    }
  });
  return {
    search:    params.get("search")    ?? "",
    category:  params.get("category")  ?? "",
    model:     params.get("model")     ?? "",
    condition: params.get("condition") ?? "",
    priceMin:  params.get("price_min") ?? "",
    priceMax:  params.get("price_max") ?? "",
    specs,
  };
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const inputCls =
  "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#111111] outline-none transition placeholder:text-gray-400 focus:border-[#FF6B2B] focus:ring-2 focus:ring-[#FF6B2B]/10";

const labelCls = "mb-1 block text-xs font-medium text-[#A8A29E] uppercase tracking-wide";

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export default function SearchFilters({
  initialFilters,
}: {
  initialFilters: ListingFilters;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state — initialised from current URL params
  const parsed = paramsToFilters(searchParams);
  const [search,    setSearch]    = useState(parsed.search);
  const [category,  setCategory]  = useState(parsed.category);
  const [model,     setModel]     = useState(parsed.model);
  const [condition, setCondition] = useState(parsed.condition);
  const [priceMin,  setPriceMin]  = useState(parsed.priceMin);
  const [priceMax,  setPriceMax]  = useState(parsed.priceMax);
  const [specs,     setSpecs]     = useState<Record<string, string>>(parsed.specs);

  // Collapsible panel on mobile
  const [open, setOpen] = useState(false);

  // Specs count to show a badge on the toggle button
  const activeSpecsCount = Object.values(specs).filter(Boolean).length;
  const hasFilters =
    !!(search || category || model || condition || priceMin || priceMax || activeSpecsCount);

  // Reset specs when category changes
  useEffect(() => {
    setSpecs({});
  }, [category]);

  const activeSpecFields = category ? (CATEGORY_SPECS[category] ?? []) : [];

  function handleSpecChange(key: string, value: string) {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  }

  function buildParams() {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category)      params.set("category", category);
    if (model)       params.set("model", model);
    if (condition)   params.set("condition", condition);
    if (priceMin)    params.set("price_min", priceMin);
    if (priceMax)    params.set("price_max", priceMax);
    Object.entries(specs).forEach(([k, v]) => {
      if (v) params.set(`${SPEC_PREFIX}${k}`, v);
    });
    return params;
  }

  function handleApply() {
    const params = buildParams();
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
    setOpen(false);
  }

  function handleClear() {
    setSearch(""); setCategory(""); setModel(""); setCondition("");
    setPriceMin(""); setPriceMax(""); setSpecs({});
    router.push("/");
    setOpen(false);
  }

  // Active filter pills for the summary bar
  const filterLabels: string[] = [];
  if (search)    filterLabels.push(`"${search}"`);
  if (category)  filterLabels.push(CATEGORIES.find(c => c.value === category)?.label ?? category);
  if (model)     filterLabels.push(model);
  if (condition) filterLabels.push(CONDITIONS.find(c => c.value === condition)?.label ?? condition);
  if (priceMin)  filterLabels.push(`Desde ${priceMin} €`);
  if (priceMax)  filterLabels.push(`Hasta ${priceMax} €`);
  Object.entries(specs).forEach(([, v]) => { if (v) filterLabels.push(v); });

  return (
    <div className="mb-8">
      {/* ── Toggle bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          id="filter-toggle"
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="filter-panel"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 active:scale-95"
        >
          <svg
            className="h-4 w-4 shrink-0 text-gray-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 5a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm2 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Filtros
          {hasFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B2B] text-[10px] font-bold text-white">
              {filterLabels.length}
            </span>
          )}
        </button>

        {/* Active filter pills */}
        {filterLabels.map((label) => (
          <span
            key={label}
            className="inline-flex items-center rounded-full border border-gray-200 bg-[#F5F5F4] px-3 py-1 text-xs font-medium text-[#111111]"
          >
            {label}
          </span>
        ))}

        {hasFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="ml-auto text-xs text-gray-400 underline-offset-2 transition hover:text-[#111111] hover:underline"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* ── Filter panel ─────────────────────────────────────────────────── */}
      {open && (
        <div
          id="filter-panel"
          role="search"
          aria-label="Filtros de búsqueda"
          className="mt-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Texto libre */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="filter-search" className={labelCls}>Buscar</label>
              <input
                id="filter-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
                placeholder="Título o descripción…"
                className={inputCls}
              />
            </div>

            {/* Categoría */}
            <div>
              <label htmlFor="filter-category" className={labelCls}>Categoría</label>
              <select
                id="filter-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
              >
                <option value="">Todas las categorías</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Modelo */}
            <div>
              <label htmlFor="filter-model" className={labelCls}>Modelo</label>
              <select
                id="filter-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={inputCls}
              >
                <option value="">Todos los modelos</option>
                {MODEL_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Condición */}
            <div>
              <label htmlFor="filter-condition" className={labelCls}>Condición</label>
              <select
                id="filter-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className={inputCls}
              >
                <option value="">Cualquier condición</option>
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Precio mín / máx */}
            <div>
              <label htmlFor="filter-price-min" className={labelCls}>Precio mínimo (€)</label>
              <input
                id="filter-price-min"
                type="number"
                min="0"
                step="1"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="filter-price-max" className={labelCls}>Precio máximo (€)</label>
              <input
                id="filter-price-max"
                type="number"
                min="0"
                step="1"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Sin límite"
                className={inputCls}
              />
            </div>

            {/* Specs dinámicos */}
            {activeSpecFields.length > 0 && (
              <>
                <div className="sm:col-span-2 lg:col-span-3">
                  <hr className="border-gray-100" />
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                    Especificaciones — {CATEGORIES.find(c => c.value === category)?.label}
                  </p>
                </div>
                {activeSpecFields.map((field) => (
                  <div key={field.key}>
                    <label htmlFor={`filter-spec-${field.key}`} className={labelCls}>
                      {field.label}
                    </label>
                    <select
                      id={`filter-spec-${field.key}`}
                      value={specs[field.key] ?? ""}
                      onChange={(e) => handleSpecChange(field.key, e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Cualquiera</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              id="filter-clear"
              type="button"
              onClick={handleClear}
              className="rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50 active:scale-95"
            >
              Limpiar
            </button>
            <button
              id="filter-apply"
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-[#FF6B2B] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#FF8C57] active:scale-95"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
