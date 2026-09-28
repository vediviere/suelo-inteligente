import AsyncStorage from "@react-native-async-storage/async-storage";
import { LecturaSensor } from "../Models/sensor";

const PENDIENTES_KEY = "@suelo_inteligente_lecturas_pendientes";

interface LecturaPendiente {
  lectura: LecturaSensor;
  creadaEn: string;
  intentos: number;
  ultimoError?: string;
}

export interface ResultadoSincronizacion {
  enviadas: number;
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
  enviar: (lectura: LecturaSensor) => Promise<void>,
): Promise<ResultadoSincronizacion> {
  if (sincronizando) {
    return {
      enviadas: 0,
      pendientes: await contarLecturasPendientes(),
    };
  }

  sincronizando = true;

  try {
    const pendientes = await leerPendientes();
    const restantes: LecturaPendiente[] = [];
    let enviadas = 0;

    for (const item of pendientes) {
      try {
        await enviar(item.lectura);
        enviadas++;
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
      enviadas,
      pendientes: restantes.length,
    };
  } finally {
    sincronizando = false;
  }
}
