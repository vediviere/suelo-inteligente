import { API_CONFIG } from "../Config/api";
import { escenariosMock } from "../Data/scenarios";
import {
  EstadoMedicion,
  InterpretacionIa,
  ResultadoAnalisis
} from "../Models/analysis";
import { CultivoCatalogo, LecturaSensor } from "../Models/sensor";
import { obtenerJson } from "./HttpService";
import {
  eliminarLecturaPendiente,
  guardarLecturaPendiente,
  sincronizarPendientes,
} from "./SyncService";

interface RespuestaRegistro {
  lectura: {
    lecturaId: string;
    dispositivoId: string;
    zona: string;
    cultivo: string;
    ph: number;
    conductividad: number;
    humedad: number;
    orp: number;
    temperatura: number;
    fechaRecepcion: string;
    origen: string;
    estado: EstadoMedicion;
    procesado: boolean;
  };
  analisis: ResultadoAnalisis;
}

export interface ResultadoProcesamiento {
  lectura: LecturaSensor;
  analisis: ResultadoAnalisis | null;
  pendiente: boolean;
}

let indiceEscenario = 0;

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function obtenerZonas(): Promise<string[]> {
  return obtenerJson<string[]>(
    `${API_CONFIG.datos.url}${API_CONFIG.datos.zonas}`,
  );
}

export async function obtenerCultivosPorZona(
  zona: string,
): Promise<CultivoCatalogo[]> {
  return obtenerJson<CultivoCatalogo[]>(
    `${API_CONFIG.datos.url}${API_CONFIG.datos.cultivosPorZona}/${encodeURIComponent(zona)}/cultivos`,
  );
}

export async function registrarLecturaEnApi(
  lectura: LecturaSensor,
): Promise<ResultadoAnalisis> {
  if (!API_CONFIG.datos.url) {
    throw new Error("No se configuró la URL de la API.");
  }

  const respuesta = await obtenerJson<RespuestaRegistro>(
    `${API_CONFIG.datos.url}${API_CONFIG.datos.registrarLectura}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lecturaId: lectura.lectura_id,
        dispositivoId: lectura.dispositivo_id,
        campoId: lectura.campo_id,
        campoNombre: lectura.campo_nombre,
        zona: lectura.contexto_suelo.zona,
        cultivo: lectura.contexto_suelo.cultivo,
        fechaCaptura: lectura.fecha_hora,
        ph: lectura.lecturas.ph,
        conductividad: lectura.lecturas.conductividad_ds_m,
        humedad: lectura.lecturas.humedad_porcentaje,
        orp: lectura.lecturas.orp_mv,
        temperatura: lectura.lecturas.temperatura_c,
      }),
    },
  );

  return respuesta.analisis;
}

export async function obtenerInterpretacionIa(
  analisisId: string,
): Promise<InterpretacionIa> {
  if (!API_CONFIG.analisis.url) {
    throw new Error("No se configuró la URL de la API.");
  }

  return obtenerJson<InterpretacionIa>(
    `${API_CONFIG.analisis.url}${API_CONFIG.analisis.interpretacionBase}/${encodeURIComponent(analisisId)}/interpretacion-ia`,
    {
      method: "POST",
    },
  );
}

export async function obtenerLecturaActual(): Promise<LecturaSensor> {
  if (API_CONFIG.usarMocks) {
    await esperar(500);

    const escenario = escenariosMock[indiceEscenario];
    indiceEscenario = (indiceEscenario + 1) % escenariosMock.length;

    return {
      ...escenario,
      lectura_id: `lec_${Date.now()}`,
      fecha_hora: new Date().toISOString(),
    };
  }

  throw new Error(
    "La conexión Bluetooth todavía no está habilitada en esta demo.",
  );
}

export async function obtenerDatosProcesados(
  zona: string,
  cultivo: string,
  intentarEnvio: boolean,
): Promise<ResultadoProcesamiento> {
  const lecturaBase = await obtenerLecturaActual();

  const lectura: LecturaSensor = {
    ...lecturaBase,
    contexto_suelo: {
      ...lecturaBase.contexto_suelo,
      zona,
      cultivo,
    },
  };

  await guardarLecturaPendiente(lectura);

  if (!intentarEnvio) {
    return {
      lectura,
      analisis: null,
      pendiente: true,
    };
  }

  try {
    const analisis = await registrarLecturaEnApi(lectura);
    await eliminarLecturaPendiente(lectura.lectura_id);

    return {
      lectura,
      analisis,
      pendiente: false,
    };
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "No fue posible enviar la lectura.";

    console.warn("Lectura guardada para sincronización posterior:", mensaje);

    return {
      lectura,
      analisis: null,
      pendiente: true,
    };
  }
}

export async function sincronizarLecturasPendientes() {
  return sincronizarPendientes(registrarLecturaEnApi);
}
