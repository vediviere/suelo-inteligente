import { LecturaSensor } from "../Models/sensor";

export const escenariosMock: LecturaSensor[] = [
  {
    lectura_id: "lec_ideal",
    escenario_id: "esc_ideal",
    dispositivo_id: "sensor_01",
    fecha_hora: new Date().toISOString(),
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
  },
  {
    lectura_id: "lec_seco",
    escenario_id: "esc_seco",
    dispositivo_id: "sensor_01",
    fecha_hora: new Date().toISOString(),
    lecturas: {
      ph: 6.4,
      conductividad_ds_m: 1.8,
      humedad_porcentaje: 28,
      orp_mv: 180,
      temperatura_c: 31,
    },
    contexto_suelo: {
      tipo_textura: "franco_arenoso",
      materia_organica_porcentaje: 2.1,
      etapa_cultivo: "floracion",
      cultivo: "jitomate",
    },
  },
  {
    lectura_id: "lec_acido",
    escenario_id: "esc_acido",
    dispositivo_id: "sensor_01",
    fecha_hora: new Date().toISOString(),
    lecturas: {
      ph: 5.3,
      conductividad_ds_m: 0.6,
      humedad_porcentaje: 38,
      orp_mv: 150,
      temperatura_c: 24,
    },
    contexto_suelo: {
      tipo_textura: "arcilloso",
      materia_organica_porcentaje: 4.1,
      etapa_cultivo: "fructificacion",
      cultivo: "chile",
    },
  },
];
