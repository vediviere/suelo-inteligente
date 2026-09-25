import { EstadoMedicion } from "../Models/analysis";

export interface HistorialItem {
  analisis_id: string;
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
