import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { questions } from "./questions";
import { Answers, SurveyFormProps } from "./types";

// Tipografías: importar en index.html o en tu CSS global, no aquí, para evitar
// duplicar la petición en cada render. Deja este bloque como referencia:
//
// <link rel="preconnect" href="https://fonts.googleapis.com" />
// <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
// <link
//   href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,400&family=Manrope:wght@400;500;600&display=swap"
//   rel="stylesheet"
// />

const serif = { fontFamily: "'Fraunces', ui-serif, Georgia, serif" };
const sans = { fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif" };

export default function SurveyForm({
  onSubmit,
  title = "Encuesta del ministerio",
  description = "Tu opinión nos ayuda a mejorar. Tómate un par de minutos para responder con honestidad — no hay respuestas correctas o incorrectas.",
}: SurveyFormProps) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const total = questions.length;
  const current = questions[step];
  const progress = started ? ((step + (submitted ? 1 : 0)) / total) * 100 : 0;

  const currentValue = answers[current?.id];
  const isAnswered =
    current?.type === "open"
      ? current.optional || (typeof currentValue === "string" && currentValue.trim().length > 0)
      : currentValue !== undefined;

  function setAnswer(value: string | number) {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  }

  function goNext() {
    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      void handleFinalSubmit();
    }
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  async function handleFinalSubmit() {
    setSubmitting(true);
    try {
      await onSubmit(answers);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && isAnswered) {
      e.preventDefault();
      goNext();
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-[#f2f1ec] flex flex-col" style={sans}>
      {/* Barra de progreso */}
      <div className="h-[2px] w-full bg-[#1c1c1c]">
        <div
          className="h-full bg-[#f2f1ec] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 sm:px-10">
        <div className="w-full max-w-xl">
          {!started && !submitted && (
            <div className="flex flex-col gap-8">
              <p className="text-xs tracking-wide text-[#8a8a85]">{`${total} preguntas · 2–3 min`}</p>
              <h1 className="text-4xl sm:text-5xl leading-[1.1]" style={serif}>
                {title}
              </h1>
              <p className="text-[#b8b7b0] text-base leading-relaxed max-w-md">{description}</p>
              <button
                onClick={() => setStarted(true)}
                className="group self-start flex items-center gap-3 border border-[#3a3a37] rounded-full pl-6 pr-2 py-2 hover:border-[#f2f1ec] transition-colors"
              >
                <span className="text-sm">Comenzar</span>
                <span className="w-8 h-8 rounded-full bg-[#f2f1ec] text-[#0a0a0a] flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight size={16} />
                </span>
              </button>
            </div>
          )}

          {started && !submitted && current && (
            <div className="flex flex-col gap-10" key={current.id}>
              <div className="flex items-baseline gap-4">
                <span className="text-5xl text-[#3a3a37] select-none" style={serif}>
                  {String(step + 1).padStart(2, "0")}
                </span>
                <span className="text-xs tracking-wide text-[#8a8a85]">
                  {current.section} · {step + 1}/{total}
                </span>
              </div>

              <h2
                className="text-2xl sm:text-3xl leading-snug"
                style={serif}
                onKeyDown={handleKeyDown}
              >
                {current.prompt}
                {current.type === "open" && current.optional && (
                  <span className="text-base text-[#8a8a85] ml-2">(opcional)</span>
                )}
              </h2>

              {current.type === "rating" && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: current.scale }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        onClick={() => setAnswer(n)}
                        className={`w-10 h-10 rounded-full border text-sm transition-colors ${
                          currentValue === n
                            ? "bg-[#f2f1ec] text-[#0a0a0a] border-[#f2f1ec]"
                            : "border-[#3a3a37] text-[#d8d7d0] hover:border-[#f2f1ec]"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-[#8a8a85] pt-1">
                    <span>{current.lowLabel}</span>
                    <span>{current.highLabel}</span>
                  </div>
                </div>
              )}

              {current.type === "choice" && (
                <div className="flex flex-col gap-2">
                  {current.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswer(opt)}
                      className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                        currentValue === opt
                          ? "bg-[#f2f1ec] text-[#0a0a0a] border-[#f2f1ec]"
                          : "border-[#2a2a27] text-[#d8d7d0] hover:border-[#f2f1ec]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {current.type === "open" && (
                <textarea
                  autoFocus
                  value={(currentValue as string) ?? ""}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={current.placeholder}
                  rows={3}
                  className="w-full bg-transparent border-b border-[#3a3a37] focus:border-[#f2f1ec] outline-none resize-none py-2 text-lg placeholder:text-[#5a5a56] transition-colors"
                />
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={goBack}
                  disabled={step === 0}
                  className="flex items-center gap-2 text-sm text-[#8a8a85] hover:text-[#f2f1ec] disabled:opacity-0 transition-colors"
                >
                  <ArrowLeft size={15} />
                  Atrás
                </button>

                <button
                  onClick={goNext}
                  disabled={!isAnswered || submitting}
                  className="flex items-center gap-2 text-sm bg-[#f2f1ec] text-[#0a0a0a] rounded-full px-5 py-2.5 disabled:bg-[#2a2a27] disabled:text-[#6a6a66] transition-colors"
                >
                  {submitting ? "Enviando..." : step === total - 1 ? "Enviar" : "Siguiente"}
                  {!submitting && <ArrowRight size={15} />}
                </button>
              </div>
            </div>
          )}

          {submitted && (
            <div className="flex flex-col items-start gap-6">
              <span className="w-12 h-12 rounded-full border border-[#f2f1ec] flex items-center justify-center">
                <Check size={20} />
              </span>
              <h1 className="text-3xl sm:text-4xl leading-snug" style={serif}>
                Gracias por tu tiempo.
              </h1>
              <p className="text-[#b8b7b0] max-w-md leading-relaxed">
                Tus respuestas fueron recibidas. Le sirven mucho al ministerio para mejorar en la
                próxima etapa.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}