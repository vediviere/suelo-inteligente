import AsyncStorage from "@react-native-async-storage/async-storage";
import { ResultadoAnalisis } from "../Models/analysis";
import { LecturaSensor } from "../Models/sensor";

const PENDIENTES_KEY = "@suelo_inteligente_lecturas_pendientes";

interface LecturaPendiente {
  lectura: LecturaSensor;
  creadaEn: string;
  intentos: number;
  ultimoError?: string;
}

export interface LecturaSincronizada {
  lectura: LecturaSensor;
  analisis: ResultadoAnalisis;
}

export interface ResultadoSincronizacion {
  sincronizadas: LecturaSincronizada[];
  pendientes: number;
}

let sincronizando = false;

async function leerPendientes(): Promise<LecturaPendiente[]> {
  try {
    const contenido = await AsyncStorage.getItem(PENDIENTES_KEY);

    if (!contenido) {
      return [];
    }

    const pendientes = JSON.parse(contenido);

    return Array.isArray(pendientes) ? pendientes : [];
  } catch {
    return [];
  }
}

async function guardarPendientes(pendientes: LecturaPendiente[]) {
  await AsyncStorage.setItem(PENDIENTES_KEY, JSON.stringify(pendientes));
}

export async function guardarLecturaPendiente(lectura: LecturaSensor) {
  const pendientes = await leerPendientes();

  const yaExiste = pendientes.some(
    (item) => item.lectura.lectura_id === lectura.lectura_id,
  );

  if (yaExiste) {
    return;
  }

  pendientes.push({
    lectura,
    creadaEn: new Date().toISOString(),
    intentos: 0,
  });

  await guardarPendientes(pendientes);
}

export async function eliminarLecturaPendiente(lecturaId: string) {
  const pendientes = await leerPendientes();

  const restantes = pendientes.filter(
    (item) => item.lectura.lectura_id !== lecturaId,
  );

  await guardarPendientes(restantes);
}

export async function contarLecturasPendientes() {
  const pendientes = await leerPendientes();

  return pendientes.length;
}

export async function sincronizarPendientes(
  enviar: (lectura: LecturaSensor) => Promise<ResultadoAnalisis>,
): Promise<ResultadoSincronizacion> {
  if (sincronizando) {
    return {
      sincronizadas: [],
      pendientes: await contarLecturasPendientes(),
    };
  }

  sincronizando = true;

  try {
    const pendientes = await leerPendientes();
    const restantes: LecturaPendiente[] = [];
    const sincronizadas: LecturaSincronizada[] = [];

    for (const item of pendientes) {
      try {
        const analisis = await enviar(item.lectura);

        sincronizadas.push({
          lectura: item.lectura,
          analisis,
        });
      } catch (error) {
        const mensaje =
          error instanceof Error
            ? error.message
            : "No fue posible sincronizar la lectura.";

        restantes.push({
          ...item,
          intentos: item.intentos + 1,
          ultimoError: mensaje,
        });
      }
    }

    await guardarPendientes(restantes);

    return {
      sincronizadas,
      pendientes: restantes.length,
    };
  } finally {
    sincronizando = false;
  }
}
