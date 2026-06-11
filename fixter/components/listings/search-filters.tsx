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
  "block w-full rounded-[var(--radius-md)] border border-[var(--color-gray-200)] bg-white px-3 py-2 text-sm text-[var(--color-gray-900)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-brand-orange)] focus:shadow-[0_0_0_3px_rgb(255_107_43_/_0.10)]";

const labelCls = "mb-1 block text-xs font-medium text-[var(--color-gray-600)]";

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

  const parsed = paramsToFilters(searchParams);
  const [search,    setSearch]    = useState(parsed.search);
  const [category,  setCategory]  = useState(parsed.category);
  const [model,     setModel]     = useState(parsed.model);
  const [condition, setCondition] = useState(parsed.condition);
  const [priceMin,  setPriceMin]  = useState(parsed.priceMin);
  const [priceMax,  setPriceMax]  = useState(parsed.priceMax);
  const [specs,     setSpecs]     = useState<Record<string, string>>(parsed.specs);
  const [open,      setOpen]      = useState(false);

  const activeSpecsCount = Object.values(specs).filter(Boolean).length;
  const hasFilters =
    !!(search || category || model || condition || priceMin || priceMax || activeSpecsCount);

  // Sincroniza el estado del formulario con la URL cuando cambia (navegación,
  // botón atrás, links externos). Sin esto, el formulario puede mostrar valores
  // distintos a los filtros realmente activos.
  const searchParamsStr = searchParams.toString();
  useEffect(() => {
    const p = paramsToFilters(searchParams);
    setSearch(p.search);
    setCategory(p.category);
    setModel(p.model);
    setCondition(p.condition);
    setPriceMin(p.priceMin);
    setPriceMax(p.priceMax);
    setSpecs(p.specs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsStr]);

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

  const filterLabels: string[] = [];
  if (search)    filterLabels.push(`"${search}"`);
  if (category)  filterLabels.push(CATEGORIES.find(c => c.value === category)?.label ?? category);
  if (model)     filterLabels.push(model);
  if (condition) filterLabels.push(CONDITIONS.find(c => c.value === condition)?.label ?? condition);
  if (priceMin)  filterLabels.push(`Desde ${priceMin} €`);
  if (priceMax)  filterLabels.push(`Hasta ${priceMax} €`);
  Object.entries(specs).forEach(([, v]) => { if (v) filterLabels.push(v); });

  return (
    <div className="mb-6 lg:mb-0">
      {/* ── Backdrop móvil ──────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* ── Toggle bar — solo móvil ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 lg:hidden">
        <button
          id="filter-toggle"
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="filter-panel"
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-gray-200)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-gray-800)] shadow-[var(--shadow-card)] transition-[background-color] duration-200 hover:bg-[var(--color-gray-50)] active:scale-[0.98]"
          style={{ transitionTimingFunction: "var(--ease-out)" }}
        >
          <svg
            className="h-4 w-4 shrink-0 text-[var(--color-gray-500)]"
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
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand-orange)] text-[10px] font-bold text-white">
              {filterLabels.length}
            </span>
          )}
        </button>

        {/* Chips activos en móvil */}
        {filterLabels.map((label) => (
          <span
            key={label}
            className="inline-flex items-center rounded-full border border-[#FFD5C0] bg-[#FFF0EA] px-3 py-1 text-xs font-medium text-[var(--color-brand-orange)]"
          >
            {label}
          </span>
        ))}

        {hasFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="ml-auto text-xs text-[var(--color-gray-400)] underline-offset-2 transition-colors duration-150 hover:text-[var(--color-gray-900)] hover:underline"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* Chips activos en desktop (encima del panel) */}
      {hasFilters && filterLabels.length > 0 && (
        <div className="mb-3 hidden flex-wrap gap-1.5 lg:flex">
          {filterLabels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center rounded-full border border-[#FFD5C0] bg-[#FFF0EA] px-2.5 py-1 text-xs font-medium text-[var(--color-brand-orange)]"
            >
              {label}
            </span>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-[var(--color-gray-400)] underline-offset-2 transition-colors duration-150 hover:text-[var(--color-gray-900)] hover:underline"
          >
            Limpiar
          </button>
        </div>
      )}

      {/* ── Panel de filtros ────────────────────────────────────────────── */}
      {/*
        Móvil: fixed bottom sheet con translate-y, z-50, max-h 85dvh, rounded top
        Desktop (lg+): static, sin sombra, sin bordes — el sidebar de page.tsx provee el contexto
      */}
      <div
        id="filter-panel"
        role="search"
        aria-label="Filtros de búsqueda"
        className={[
          // Móvil base
          "fixed bottom-0 left-0 right-0 z-50 max-h-[85dvh] overflow-y-auto",
          "rounded-t-[var(--radius-lg)] bg-white p-5",
          "shadow-[0_-4px_40px_rgb(0_0_0_/_0.14)]",
          "transition-transform duration-300",
          // Desktop override: vuelve a flujo normal
          "lg:relative lg:inset-auto lg:z-auto lg:max-h-none lg:overflow-visible",
          "lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none lg:block",
          // Visibilidad móvil via transform
          open ? "translate-y-0" : "translate-y-full",
          // Desktop siempre visible
          "lg:translate-y-0",
        ].join(" ")}
        style={{ transitionTimingFunction: "var(--ease-out)" }}
      >
        {/* Cabecera móvil dentro del drawer */}
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="text-sm font-semibold text-[var(--color-gray-900)]">Filtros</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-gray-500)] transition-[background-color] duration-150 hover:bg-[var(--color-gray-50)]"
            aria-label="Cerrar filtros"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M3 3 L13 13 M13 3 L3 13" />
            </svg>
          </button>
        </div>

        {/* Campos de filtro */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">

          {/* Texto libre */}
          <div className="sm:col-span-2 lg:col-span-1">
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
              onChange={(e) => { setCategory(e.target.value); setSpecs({}); }}
              className={inputCls}
            >
              <option value="">Todas</option>
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
              <option value="">Todos</option>
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
              <option value="">Cualquiera</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Precio */}
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
              <div className="sm:col-span-2 lg:col-span-1">
                <hr className="border-[var(--color-gray-100)]" />
                <p className="mt-3 text-xs font-medium text-[var(--color-gray-600)]">
                  {CATEGORIES.find(c => c.value === category)?.label}
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

        {/* Acciones */}
        <div className="mt-4 flex items-center gap-2 border-t border-[var(--color-gray-100)] pt-4">
          <button
            id="filter-clear"
            type="button"
            onClick={handleClear}
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-gray-200)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-gray-700)] transition-[background-color] duration-200 hover:bg-[var(--color-gray-50)] active:scale-[0.98]"
            style={{ transitionTimingFunction: "var(--ease-out)" }}
          >
            Limpiar
          </button>
          <button
            id="filter-apply"
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-brand-orange)] px-4 py-2 text-sm font-medium text-white transition-[background-color,transform] duration-200 hover:bg-[#e8601f] active:scale-[0.97]"
            style={{ transitionTimingFunction: "var(--ease-out)" }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
