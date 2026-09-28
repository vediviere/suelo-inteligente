import { ResultadoAnalisis } from "../Models/analysis";
import { LecturaSensor } from "../Models/sensor";

export const lecturaMock: LecturaSensor = {
  lectura_id: "lec_001",
  escenario_id: "esc_01",
  dispositivo_id: "sensor_01",
  campo_id: "campo_001",
  campo_nombre: "Parcela norte",
  fecha_hora: "2026-09-23T16:30:00Z",
  lecturas: {
    ph: 6.5,
    conductividad_ds_m: 1.4,
    humedad_porcentaje: 45,
    orp_mv: 240,
    temperatura_c: 23.5,
  },
  contexto_suelo: {
    tipo_textura: "franco_limoso",
    materia_organica_porcentaje: 3.2,
    etapa_cultivo: "desarrollo_vegetativo",
    cultivo: "maiz",
  },
};

export const analisisMock: ResultadoAnalisis = {
  analisis_id: "ana_001",
  lectura_id: "lec_001",
  fecha_procesamiento: "2026-09-23T16:30:03Z",
  estado_general: "optimo",
  puntaje_general: 92,
  resultados: [
    {
      variable: "ph",
      nombre: "pH",
      valor: 6.5,
      unidad: "pH",
      estado: "optimo",
      rango_recomendado: { min: 6, max: 7 },
      mensaje: "El pH se encuentra dentro del rango recomendado.",
    },
    {
      variable: "conductividad",
      nombre: "Conductividad",
      valor: 1.4,
      unidad: "dS/m",
      estado: "optimo",
      rango_recomendado: { min: 0.8, max: 2 },
      mensaje: "La conductividad se encuentra dentro del rango recomendado.",
    },
    {
      variable: "humedad",
      nombre: "Humedad",
      valor: 45,
      unidad: "%",
      estado: "optimo",
      rango_recomendado: { min: 35, max: 60 },
      mensaje: "La humedad es adecuada para el cultivo.",
    },
    {
      variable: "orp",
      nombre: "ORP",
      valor: 240,
      unidad: "mV",
      estado: "optimo",
      rango_recomendado: { min: 200, max: 400 },
      mensaje: "El potencial de oxidación-reducción es adecuado.",
    },
    {
      variable: "temperatura",
      nombre: "Temperatura",
      valor: 23.5,
      unidad: "°C",
      estado: "optimo",
      rango_recomendado: { min: 18, max: 28 },
      mensaje: "La temperatura del suelo es adecuada.",
    },
  ],
  alertas: [],
  recomendaciones: [
    {
      prioridad: "baja",
      titulo: "Mantener condiciones actuales",
      descripcion:
        "Las variables principales se encuentran dentro de los rangos recomendados.",
    },
  ],
};
