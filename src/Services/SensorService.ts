import { API_CONFIG } from "../Config/api";
import { escenariosMock } from "../Data/scenarios";
import {
  Alerta,
  EstadoMedicion,
  Recomendacion,
  ResultadoAnalisis,
  ResultadoVariable,
} from "../Models/analysis";
import { LecturaSensor } from "../Models/sensor";
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

let indiceEscenario = 0;

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function evaluar(
  valor: number,
  minimoOptimo: number,
  maximoOptimo: number,
  minimoAdvertencia: number,
  maximoAdvertencia: number,
): EstadoMedicion {
  if (valor >= minimoOptimo && valor <= maximoOptimo) {
    return "optimo";
  }

  if (valor >= minimoAdvertencia && valor <= maximoAdvertencia) {
    return "advertencia";
  }

  return "critico";
}

function crearResultado(
  variable: string,
  nombre: string,
  valor: number,
  unidad: string,
  minimo: number,
  maximo: number,
  minimoAdvertencia: number,
  maximoAdvertencia: number,
): ResultadoVariable {
  const estado = evaluar(
    valor,
    minimo,
    maximo,
    minimoAdvertencia,
    maximoAdvertencia,
  );

  const mensajes: Record<EstadoMedicion, string> = {
    optimo: `${nombre} se encuentra dentro del rango recomendado.`,
    advertencia: `${nombre} requiere seguimiento.`,
    critico: `${nombre} se encuentra fuera del rango seguro.`,
    sin_datos: `No existen datos disponibles para ${nombre}.`,
  };

  return {
    variable,
    nombre,
    valor,
    unidad,
    estado,
    rango_recomendado: {
      min: minimo,
      max: maximo,
    },
    mensaje: mensajes[estado],
  };
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

  if (!API_CONFIG.datos.url) {
    throw new Error("No se configuró la URL de la API de datos.");
  }

  return obtenerJson<LecturaSensor>(
    `${API_CONFIG.datos.url}${API_CONFIG.datos.lecturaActual}`,
  );
}

export async function procesarLectura(
  lectura: LecturaSensor,
): Promise<ResultadoAnalisis> {
  await esperar(300);

  const resultados: ResultadoVariable[] = [
    crearResultado("ph", "pH", lectura.lecturas.ph, "pH", 6, 7.5, 5.5, 8),
    crearResultado(
      "conductividad",
      "Conductividad",
      lectura.lecturas.conductividad_ds_m,
      "dS/m",
      0.8,
      2,
      0.4,
      3,
    ),
    crearResultado(
      "humedad",
      "Humedad",
      lectura.lecturas.humedad_porcentaje,
      "%",
      35,
      60,
      25,
      70,
    ),
    crearResultado(
      "orp",
      "ORP",
      lectura.lecturas.orp_mv,
      "mV",
      200,
      400,
      100,
      500,
    ),
    crearResultado(
      "temperatura",
      "Temperatura",
      lectura.lecturas.temperatura_c,
      "°C",
      18,
      28,
      10,
      35,
    ),
  ];

  const criticos = resultados.filter(
    (resultado) => resultado.estado === "critico",
  ).length;

  const advertencias = resultados.filter(
    (resultado) => resultado.estado === "advertencia",
  ).length;

  const estadoGeneral: EstadoMedicion =
    criticos > 0 ? "critico" : advertencias > 0 ? "advertencia" : "optimo";

  const alertas: Alerta[] = resultados
    .filter((resultado) => resultado.estado !== "optimo")
    .map((resultado) => ({
      nivel: resultado.estado,
      variable: resultado.nombre,
      mensaje: resultado.mensaje,
    }));

  const recomendaciones: Recomendacion[] =
    alertas.length > 0
      ? [
          {
            prioridad: criticos > 0 ? "alta" : "media",
            titulo: `Revisar ${alertas[0].variable}`,
            descripcion:
              alertas[0].mensaje +
              " Se recomienda realizar seguimiento antes de la siguiente medición.",
          },
        ]
      : [
          {
            prioridad: "baja",
            titulo: "Mantener condiciones actuales",
            descripcion:
              "Las variables se encuentran dentro de los rangos recomendados.",
          },
        ];

  return {
    analisis_id: `ana_${Date.now()}`,
    lectura_id: lectura.lectura_id,
    fecha_procesamiento: new Date().toISOString(),
    estado_general: estadoGeneral,
    puntaje_general: Math.max(0, 100 - criticos * 25 - advertencias * 10),
    resultados,
    alertas,
    recomendaciones,
  };
}

export async function sincronizarLecturasPendientes() {
  return sincronizarPendientes(async (lectura) => {
    await registrarLecturaEnApi(lectura);
  });
}

export async function obtenerDatosProcesados() {
  const lectura = await obtenerLecturaActual();

  await guardarLecturaPendiente(lectura);

  try {
    const analisis = await registrarLecturaEnApi(lectura);
    await eliminarLecturaPendiente(lectura.lectura_id);

    return {
      lectura,
      analisis,
    };
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "No fue posible obtener el análisis desde la API.";

    console.warn("Lectura guardada para sincronización posterior:", mensaje);

    const analisis = await procesarLectura(lectura);

    return {
      lectura,
      analisis,
    };
  }
}
