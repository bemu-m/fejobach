export type QuestionType = "rating" | "choice" | "open";

export interface RatingQuestion {
  id: string;
  type: "rating";
  section: string;
  prompt: string;
  scale: number; // p.ej. 10 -> escala 1..10
  lowLabel: string;
  highLabel: string;
}

export interface ChoiceQuestion {
  id: string;
  type: "choice";
  section: string;
  prompt: string;
  options: string[];
}

export interface OpenQuestion {
  id: string;
  type: "open";
  section: string;
  prompt: string;
  placeholder?: string;
  optional?: boolean;
}

export type Question = RatingQuestion | ChoiceQuestion | OpenQuestion;

export type Answers = Record<string, string | number>;

export interface SurveyFormProps {
  /** Se llama al enviar la última pregunta con todas las respuestas. */
  onSubmit: (answers: Answers) => void | Promise<void>;
  /** Título mostrado en la pantalla de bienvenida. */
  title?: string;
  /** Subtítulo / descripción breve del propósito de la encuesta. */
  description?: string;
}