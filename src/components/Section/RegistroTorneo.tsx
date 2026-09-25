import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import emailjs from "@emailjs/browser";
import {
  MapPin,
  Clock,
  Wallet,
  Trophy,
  Users,
  ChevronRight,
  CircleCheck,
  Download,
  FileWarning,
} from "lucide-react";

type CategoriaId = "futbol" | "basquetbol" | "voleibol";

interface Categoria {
  id: CategoriaId;
  nombre: string;
  minimo: number;
  label: string;
  cerrada?: boolean;
}

interface ColorEquipo {
  id: string;
  nombre: string;
  hex: string;
}

interface FormState {
  equipo: string;
  categorias: CategoriaId[];
  integrantesPorCategoria: Partial<Record<CategoriaId, string>>;
  color: string;
  capitan: string;
  telefono: string;
  correo: string;
}

const CATEGORIAS: Categoria[] = [
  {
    id: "futbol",
    nombre: "Fútbol",
    minimo: 11,
    label: "11 integrantes mínimo",
  },
  {
    id: "basquetbol",
    nombre: "Basquetbol",
    minimo: 6,
    label: "Mínimo 6 integrantes",
    cerrada: true, // cupo lleno — cambia a false (o quita la línea) para reabrir
  },
  {
    id: "voleibol",
    nombre: "Vóleibol Mixto",
    minimo: 7,
    label: "Mínimo 7 integrantes",
  },
];

const COLORES: ColorEquipo[] = [
  { id: "rojo", nombre: "Rojo", hex: "#dc2626" },
  { id: "naranja", nombre: "Naranja", hex: "#ff6a13" },
  { id: "amarillo", nombre: "Amarillo", hex: "#eab308" },
  { id: "verde", nombre: "Verde", hex: "#16a34a" },
  { id: "azul", nombre: "Azul", hex: "#2563eb" },
  { id: "morado", nombre: "Morado", hex: "#9333ea" },
  { id: "negro", nombre: "Negro", hex: "#171717" },
  { id: "blanco", nombre: "Blanco", hex: "#f5f5f5" },
];

const CUPO_POR_CATEGORIA = 8;

const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbyZ0q0BHcGRml8Duozb9HHisBk_894xM5wRePcrdhRveEkHZzpJgtNNuvbuM2Is7fT2/exec";

const EMAILJS_SERVICE_ID = "service_9zn70uh";
const EMAILJS_TEMPLATE_ID = "template_uqyfn4n";
const EMAILJS_PUBLIC_KEY = "ZJaWSKHxAeJlk8YYq";

const FORM_INICIAL: FormState = {
  equipo: "",
  categorias: [],
  integrantesPorCategoria: {},
  color: "",
  capitan: "",
  telefono: "",
  correo: "",
};

export default function RegistroTorneo() {
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [coloresOcupados, setColoresOcupados] = useState<string[]>([]);
  const [cargandoColores, setCargandoColores] = useState(true);

  const categoriasSeleccionadas = CATEGORIAS.filter((c) =>
    form.categorias.includes(c.id)
  );
  const colorSeleccionado = COLORES.find((c) => c.id === form.color);

  useEffect(() => {
    let cancelado = false;

    const cargarColoresOcupados = async () => {
      try {
        const res = await fetch(`${GOOGLE_SHEETS_URL}?action=colores`);
        const data = await res.json();
        if (!cancelado && Array.isArray(data.ocupados)) {
          // el script guarda nombres en minúsculas (ej. "rojo"); los comparamos por id
          setColoresOcupados(data.ocupados);
        }
      } catch (err) {
        // si falla la consulta, simplemente no deshabilitamos nada — mejor eso que bloquear el formulario
        console.error("No se pudieron obtener los colores ocupados:", err);
      } finally {
        if (!cancelado) setCargandoColores(false);
      }
    };

    cargarColoresOcupados();
    return () => {
      cancelado = true;
    };
  }, []);

  const handleChange =
    (campo: "equipo" | "capitan" | "telefono" | "correo") =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [campo]: e.target.value }));
    };

  const toggleCategoria = (id: CategoriaId) => {
    const cat = CATEGORIAS.find((c) => c.id === id);
    if (cat?.cerrada) return; // cupo lleno, no se puede seleccionar

    setForm((f) => {
      const yaEsta = f.categorias.includes(id);
      const categorias = yaEsta
        ? f.categorias.filter((c) => c !== id)
        : [...f.categorias, id];

      const integrantesPorCategoria = { ...f.integrantesPorCategoria };
      if (yaEsta) {
        delete integrantesPorCategoria[id];
      }

      return { ...f, categorias, integrantesPorCategoria };
    });
  };

  const handleIntegrantesChange =
    (id: CategoriaId) => (e: ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({
        ...f,
        integrantesPorCategoria: {
          ...f.integrantesPorCategoria,
          [id]: e.target.value,
        },
      }));
    };

  const seleccionarColor = (id: string) => {
    setForm((f) => ({ ...f, color: id }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!form.equipo || !form.capitan || !form.telefono) {
      setError("Completa todos los campos antes de enviar.");
      return;
    }

    if (form.categorias.length === 0) {
      setError("Selecciona al menos una categoría.");
      return;
    }

    const categoriaCerradaElegida = categoriasSeleccionadas.find((c) => c.cerrada);
    if (categoriaCerradaElegida) {
      setError(`${categoriaCerradaElegida.nombre} ya alcanzó su cupo máximo.`);
      return;
    }

    if (!form.color) {
      setError("Elige un color para tu equipo.");
      return;
    }

    for (const cat of categoriasSeleccionadas) {
      const integrantes = form.integrantesPorCategoria[cat.id];
      if (!integrantes) {
        setError(`Indica el número de integrantes para ${cat.nombre}.`);
        return;
      }
      if (Number(integrantes) < cat.minimo) {
        setError(`${cat.nombre} requiere al menos ${cat.minimo} integrantes.`);
        return;
      }
    }

    setEnviando(true);

    const categoriasTexto = categoriasSeleccionadas.map((c) => c.nombre).join(", ");
    const integrantesTexto = categoriasSeleccionadas
      .map((c) => `${c.nombre}: ${form.integrantesPorCategoria[c.id]}`)
      .join(" · ");

    const payloadSheets = {
      equipo: form.equipo,
      categorias: categoriasTexto,
      integrantes: integrantesTexto,
      color: colorSeleccionado?.nombre ?? "",
      capitan: form.capitan,
      telefono: form.telefono,
      correo: form.correo,
    };

    const templateParams = {
      equipo: form.equipo,
      categorias: categoriasTexto,
      integrantes: integrantesTexto,
      color: colorSeleccionado?.nombre ?? "",
      capitan: form.capitan,
      telefono: form.telefono,
      correo: form.correo || "No proporcionado",
      fecha: new Date().toLocaleString("es-MX", {
        dateStyle: "long",
        timeStyle: "short",
      }),
    };

    try {
      const resSheets = await fetch(GOOGLE_SHEETS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payloadSheets),
      });
      // Con mode "no-cors" no podemos leer la respuesta, así que asumimos éxito
      // si el fetch no lanzó error de red.
      void resSheets;

      try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, {
          publicKey: EMAILJS_PUBLIC_KEY,
        });
      } catch (emailErr) {
        // eslint-disable-next-line no-console
        console.error("EmailJS error:", emailErr);
        setError(
          "El equipo se registró correctamente, pero el correo de aviso no pudo enviarse."
        );
      }

      // Reflejamos el color como ocupado de inmediato en esta sesión (aviso visual,
      // no hay validación del lado del servidor).
      setColoresOcupados((prev) =>
        prev.includes(form.color) ? prev : [...prev, form.color]
      );
      setEnviado(true);
    } catch (err) {
      setError("No se pudo enviar el registro. Intenta de nuevo o contáctanos directamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="w-full bg-[#0a0a0a] text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Anton', sans-serif; }
        .font-mono-sport { font-family: 'Rajdhani', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "linear-gradient(115deg, #0a0a0a 0%, #0a0a0a 38%, #ff6a13 50%, #0a0a0a 62%, #0a0a0a 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,106,19,0.35) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
            maskImage: "linear-gradient(to bottom, black, transparent 70%)",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-14 md:pt-24 md:pb-20">
          <div className="flex items-center gap-2 font-mono-sport text-sm tracking-[0.3em] text-orange-400 mb-6">
            <span className="inline-block w-6 h-px bg-orange-400" />
            FEJOBACH · ACTIVIDAD DEPORTIVA · 26 SEPTIEMBRE
          </div>

          <h1 className="font-display leading-[0.85] uppercase">
            <span className="block text-5xl md:text-7xl text-white">Registro de</span>
            <span className="block text-6xl md:text-8xl text-[#ff6a13]">Equipos</span>
          </h1>

          <p className="font-mono-sport text-lg md:text-xl tracking-wide text-neutral-300 mt-5">
            Fútbol&nbsp;·&nbsp;Basquetbol&nbsp;·&nbsp;Vóleibol Mixto
          </p>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-800 border border-neutral-800 rounded-lg overflow-hidden">
            {[
              { icon: MapPin, label: "Lugar", value: "Caña Hueca" },
              { icon: Clock, label: "Horario", value: "9:30 AM – 4:00 PM" },
              { icon: Wallet, label: "Inscripción", value: "$250 / equipo" },
              { icon: Trophy, label: "Premiación", value: "3:30 PM" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-[#0a0a0a] p-4 md:p-5">
                <Icon className="w-4 h-4 text-[#ff6a13] mb-2" strokeWidth={2.5} />
                <div className="font-mono-sport text-[11px] uppercase tracking-widest text-neutral-500">
                  {label}
                </div>
                <div className="font-body font-semibold text-sm md:text-base text-white mt-0.5">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-14 md:py-20">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-display text-3xl md:text-4xl uppercase text-white">
            Categorías
          </h2>
          <span className="font-mono-sport text-xs uppercase tracking-widest text-orange-400 border border-orange-400/40 rounded-full px-3 py-1">
            Cupo limitado
          </span>
        </div>
        <p className="font-body text-sm text-neutral-500 mb-8">
          Un mismo equipo puede inscribirse en más de una categoría sin costo adicional.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {CATEGORIAS.map((cat) => {
            const activa = form.categorias.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategoria(cat.id)}
                disabled={cat.cerrada}
                aria-pressed={activa}
                className={`text-left rounded-xl border p-6 transition-colors ${
                  cat.cerrada
                    ? "border-neutral-800 bg-neutral-900/30 opacity-50 cursor-not-allowed"
                    : activa
                    ? "border-[#ff6a13] bg-[#ff6a13]/10"
                    : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`font-mono-sport text-xs uppercase tracking-widest ${
                      cat.cerrada ? "text-red-400" : "text-neutral-500"
                    }`}
                  >
                    {cat.cerrada ? "Cupo lleno" : `${CUPO_POR_CATEGORIA} equipos`}
                  </span>
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      activa
                        ? "border-[#ff6a13] bg-[#ff6a13]"
                        : "border-neutral-700"
                    }`}
                  >
                    {activa && (
                      <CircleCheck className="w-4 h-4 text-[#0a0a0a]" strokeWidth={2.5} />
                    )}
                  </span>
                </div>
                <h3 className="font-display text-2xl uppercase text-white mb-1">
                  {cat.nombre}
                </h3>
                <div className="font-body text-sm text-neutral-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {cat.label}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-14 md:pb-20">
        <div className="rounded-xl border border-[#ff6a13]/30 bg-[#ff6a13]/5 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
          <div className="flex items-start gap-3 flex-1">
            <FileWarning className="w-5 h-5 text-[#ff6a13] mt-0.5 shrink-0" strokeWidth={2.2} />
            <div>
              <h3 className="font-display text-xl uppercase text-white mb-1">
                Carta responsiva
              </h3>
              <p className="font-body text-sm text-neutral-400">
                Cada participante debe descargar, llenar y firmar la carta responsiva.
                Es <span className="text-white font-semibold">requisito indispensable</span> para
                completar la inscripción — sin ella el equipo no podrá ingresar a la cancha el día del evento.
              </p>
            </div>
          </div>
          <a
            href="/documentos/carta-responsiva-fejobach.pdf"
            download
            className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#ff6a13] hover:bg-[#e85d04] transition-colors text-[#0a0a0a] font-display uppercase text-sm tracking-wide rounded-lg px-5 py-3 whitespace-nowrap"
          >
            <Download className="w-4 h-4" strokeWidth={2.5} />
            Descargar carta
          </a>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20 md:pb-28">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 md:p-10">
          <h2 className="font-display text-3xl uppercase text-white mb-1">
            Inscribe tu equipo
          </h2>
          <p className="font-body text-sm text-neutral-400 mb-8">
            La inscripción tiene un costo único de $250 por equipo, sin importar en cuántas categorías participe.
            Un integrante del comité confirmará tu lugar.
          </p>

          {enviado ? (
            <div className="rounded-xl border border-[#ff6a13]/40 bg-[#ff6a13]/10 p-6 text-center">
              <CircleCheck className="w-8 h-8 text-[#ff6a13] mx-auto mb-3" strokeWidth={2} />
              <p className="font-display text-xl uppercase text-white">¡Equipo registrado!</p>
              <p className="font-body text-sm text-neutral-400 mt-1">
                Nos pondremos en contacto para confirmar tu inscripción y el pago.
              </p>
              <p className="font-body text-sm text-neutral-300 mt-3">
                No olvides que cada integrante debe entregar su{" "}
                <span className="text-[#ff6a13] font-semibold">carta responsiva firmada</span> —
                es indispensable para poder participar.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="font-mono-sport text-xs uppercase tracking-widest text-neutral-500 block mb-1.5">
                  Nombre del equipo
                </label>
                <input
                  value={form.equipo}
                  onChange={handleChange("equipo")}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 font-body text-sm text-white outline-none focus:border-[#ff6a13] transition-colors"
                  placeholder="Ej. Los Tuxtlecos"
                />
              </div>

              <div>
                <label className="font-mono-sport text-xs uppercase tracking-widest text-neutral-500 block mb-1.5">
                  Categorías en las que participa
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIAS.map((cat) => {
                    const activa = form.categorias.includes(cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleCategoria(cat.id)}
                        disabled={cat.cerrada}
                        aria-pressed={activa}
                        title={cat.cerrada ? "Cupo lleno" : undefined}
                        className={`font-body text-sm rounded-lg px-3 py-2.5 border transition-colors ${
                          cat.cerrada
                            ? "border-neutral-800 text-neutral-600 opacity-50 cursor-not-allowed line-through"
                            : activa
                            ? "border-[#ff6a13] bg-[#ff6a13]/10 text-white"
                            : "border-neutral-800 text-neutral-400 hover:border-neutral-700"
                        }`}
                      >
                        {cat.nombre}
                      </button>
                    );
                  })}
                </div>
                <p className="font-body text-xs text-neutral-500 mt-1.5">
                  Puedes elegir más de una — algunos equipos participan en 2 o incluso las 3.
                  {CATEGORIAS.some((c) => c.cerrada) && (
                    <span className="block text-red-400 mt-1">
                      {CATEGORIAS.filter((c) => c.cerrada)
                        .map((c) => c.nombre)
                        .join(", ")}{" "}
                      ya {CATEGORIAS.filter((c) => c.cerrada).length > 1 ? "alcanzaron" : "alcanzó"} su cupo máximo.
                    </span>
                  )}
                </p>
              </div>

              {categoriasSeleccionadas.length > 0 && (
                <div className="space-y-3">
                  <label className="font-mono-sport text-xs uppercase tracking-widest text-neutral-500 block">
                    Integrantes por categoría
                  </label>
                  {categoriasSeleccionadas.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3"
                    >
                      <span className="font-body text-sm text-neutral-300 sm:w-32 sm:shrink-0">
                        {cat.nombre}
                      </span>
                      <input
                        type="number"
                        value={form.integrantesPorCategoria[cat.id] ?? ""}
                        onChange={handleIntegrantesChange(cat.id)}
                        className="w-full min-w-0 sm:flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 font-body text-sm text-white outline-none focus:border-[#ff6a13] transition-colors"
                        placeholder={`Mínimo ${cat.minimo}`}
                      />
                    </div>
                  ))}
                  <p className="font-body text-xs text-neutral-500">
                    Un jugador puede repetirse entre categorías, pero indica el roster de cada una por separado.
                  </p>
                </div>
              )}

              <div>
                <label className="font-mono-sport text-xs uppercase tracking-widest text-neutral-500 block mb-1.5">
                  Color del equipo
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {COLORES.map((c) => {
                    const activo = form.color === c.id;
                    const ocupado = coloresOcupados.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => !ocupado && seleccionarColor(c.id)}
                        disabled={ocupado}
                        aria-pressed={activo}
                        title={ocupado ? `${c.nombre} — ya lo tomó otro equipo` : c.nombre}
                        className={`relative w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                          activo ? "border-white scale-110" : "border-transparent"
                        } ${ocupado ? "opacity-30 cursor-not-allowed" : ""}`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {activo && !ocupado && (
                          <CircleCheck
                            className={`w-4 h-4 ${
                              c.id === "blanco" || c.id === "amarillo" ? "text-black" : "text-white"
                            }`}
                            strokeWidth={2.5}
                          />
                        )}
                        {ocupado && (
                          <span className="absolute inset-0 flex items-center justify-center text-white text-lg leading-none">
                            ×
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="font-body text-xs text-neutral-500 mt-2">
                  {cargandoColores
                    ? "Cargando colores disponibles..."
                    : colorSeleccionado
                    ? `Color elegido: ${colorSeleccionado.nombre}`
                    : "Ayuda a identificar a tu equipo el día del evento. Los colores tachados ya los tomó otro equipo."}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="font-mono-sport text-xs uppercase tracking-widest text-neutral-500 block mb-1.5">
                    Capitán del equipo
                  </label>
                  <input
                    value={form.capitan}
                    onChange={handleChange("capitan")}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 font-body text-sm text-white outline-none focus:border-[#ff6a13] transition-colors"
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <label className="font-mono-sport text-xs uppercase tracking-widest text-neutral-500 block mb-1.5">
                    Teléfono
                  </label>
                  <input
                    value={form.telefono}
                    onChange={handleChange("telefono")}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 font-body text-sm text-white outline-none focus:border-[#ff6a13] transition-colors"
                    placeholder="961 000 0000"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono-sport text-xs uppercase tracking-widest text-neutral-500 block mb-1.5">
                  Correo (opcional)
                </label>
                <input
                  value={form.correo}
                  onChange={handleChange("correo")}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 font-body text-sm text-white outline-none focus:border-[#ff6a13] transition-colors"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              {error && (
                <p className="font-body text-sm text-orange-400 border border-orange-400/30 bg-orange-400/5 rounded-lg px-4 py-2.5">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="w-full flex items-center justify-center gap-2 bg-[#ff6a13] hover:bg-[#e85d04] disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-[#0a0a0a] font-display uppercase text-lg tracking-wide rounded-lg py-3.5"
              >
                {enviando ? "Enviando..." : "Registrar equipo"}
                {!enviando && <ChevronRight className="w-5 h-5" strokeWidth={3} />}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}