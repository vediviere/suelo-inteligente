export interface Lecturas {
  ph: number;
  conductividad_ds_m: number;
  humedad_porcentaje: number;
  orp_mv: number;
  temperatura_c: number;
}

export interface ContextoSuelo {
  tipo_textura: string;
  materia_organica_porcentaje: number;
  etapa_cultivo: string;
  cultivo: string;
}

export interface LecturaSensor {
  lectura_id: string;
  escenario_id: string;
  dispositivo_id: string;
  campo_id: string;
  campo_nombre: string;
  fecha_hora: string;
  lecturas: Lecturas;
  contexto_suelo: ContextoSuelo;
}
