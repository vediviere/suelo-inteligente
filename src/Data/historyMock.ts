import { EstadoMedicion } from "../Models/analysis";

export interface HistorialItem {
  analisis_id: string;
  lectura_id: string;
  dispositivo_id: string;
  campo_id: string;
  campo_nombre: string;
  cultivo: string;
  fecha_procesamiento: string;
  estado_general: EstadoMedicion;
  puntaje_general: number;
  ph: number;
  conductividad: number;
  humedad: number;
  orp: number;
  temperatura: number;
}

export const historialMock: HistorialItem[] = [
  {
    analisis_id: "ana_003",
    lectura_id: "lec_003",
    dispositivo_id: "sensor_03",
    campo_id: "campo_003",
    campo_nombre: "Parcela sur",
    cultivo: "Chile",
    fecha_procesamiento: "2026-09-23T10:30:00Z",
    estado_general: "advertencia",
    puntaje_general: 72,
    ph: 6.4,
    conductividad: 1.23,
    humedad: 28,
    orp: 215,
    temperatura: 24.3,
  },
  {
    analisis_id: "ana_002",
    lectura_id: "lec_002",
    dispositivo_id: "sensor_02",
    campo_id: "campo_002",
    campo_nombre: "Invernadero principal",
    cultivo: "Tomate",
    fecha_procesamiento: "2026-09-22T17:15:00Z",
    estado_general: "optimo",
    puntaje_general: 91,
    ph: 6.6,
    conductividad: 1.35,
    humedad: 44,
    orp: 238,
    temperatura: 23.8,
  },
  {
    analisis_id: "ana_001",
    lectura_id: "lec_001",
    dispositivo_id: "sensor_01",
    campo_id: "campo_001",
    campo_nombre: "Parcela norte",
    cultivo: "Maíz",
    fecha_procesamiento: "2026-09-21T09:45:00Z",
    estado_general: "critico",
    puntaje_general: 48,
    ph: 5.2,
    conductividad: 2.8,
    humedad: 19,
    orp: 180,
    temperatura: 29.1,
  },
];
