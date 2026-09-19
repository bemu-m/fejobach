import SurveyForm from "./SurveyForm";
import { Answers } from "./types";

const SHEETS_URL = "https://script.google.com/macros/s/AKfycbx-HFO-Qhjj7cgHtMULoRJ2Cveqo-VDqIERiNfUKGMHZxnXVkrZjcr4YbBkIhU7hbzc/exec";

export default function EncuestaMinisterioPage() {
  async function handleSubmit(answers: Answers) {

    await fetch(SHEETS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, 
      body: JSON.stringify(answers),
    });
  }

  return (
    <SurveyForm
      onSubmit={handleSubmit}
      title="Encuesta del ministerio"
      description="Tu opinión nos ayuda a mejorar. Tómate un par de minutos para responder con honestidad — no hay respuestas correctas o incorrectas."
    />
  );
}