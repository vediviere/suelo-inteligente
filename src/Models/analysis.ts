export type EstadoMedicion = "optimo" | "advertencia" | "critico" | "sin_datos";
export type Prioridad = "baja" | "media" | "alta";

export interface Rango {
  min: number;
  max: number;
}

export interface ResultadoVariable {
  variable: string;
  nombre: string;
  valor: number;
  unidad: string;
  estado: EstadoMedicion;
  rango_recomendado: Rango;
  mensaje: string;
}

export interface Alerta {
  nivel: EstadoMedicion;
  variable: string;
  mensaje: string;
}

export interface Recomendacion {
  prioridad: Prioridad;
  titulo: string;
  descripcion: string;
}

export interface ResultadoAnalisis {
  analisis_id: string;
  lectura_id: string;
  fecha_procesamiento: string;
  estado_general: EstadoMedicion;
  puntaje_general: number;
  resultados: ResultadoVariable[];
  alertas: Alerta[];
  recomendaciones: Recomendacion[];
}
