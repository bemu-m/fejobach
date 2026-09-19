import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import RegistroTorneo from "./components/Section/RegistroTorneo";
import UnderConstruction from "./components/Section/UnderConstruction";
import SurveyForm from "./components/SurveyForm/SurveyForm";
import { Answers } from "./components/SurveyForm/types";

// URL de tu implementación de Apps Script (AppsScript.gs), termina en /exec
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbx_yR5JB0Fw9vJeqKGSOvFAA3eFNUivYc44xBiLFLVRvC_cVRj5napq8iED9W5wAeBH/exec";

async function handleSurveySubmit(answers: Answers) {
  // mode: "no-cors" porque Apps Script no responde con headers CORS;
  // el POST sí llega y se guarda, solo no podemos leer la respuesta desde el navegador.
  await fetch(SHEETS_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // evita el preflight OPTIONS
    body: JSON.stringify(answers),
  });
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UnderConstruction />} />
        <Route
          path="/extra-settings/formulario"
          element={<SurveyForm onSubmit={handleSurveySubmit} />}
        />
        <Route path="/evento-deportivo" element={<RegistroTorneo />} />
      </Routes>
    </Router>
  );
}