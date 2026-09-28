import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { HistorialItem, historialMock } from "../Data/historyMock";
import { ResultadoAnalisis } from "../Models/analysis";
import { LecturaSensor } from "../Models/sensor";
import {
  obtenerDatosProcesados,
  sincronizarLecturasPendientes,
} from "../Services/SensorService";
import { contarLecturasPendientes } from "../Services/SyncService";

const HISTORIAL_KEY = "@suelo_inteligente_historial";

interface SensorContextValue {
  lectura: LecturaSensor | null;
  analisis: ResultadoAnalisis | null;
  historial: HistorialItem[];
  cargando: boolean;
  error: string | null;
  lecturasPendientes: number;
  actualizarDatos: () => Promise<void>;
  limpiarHistorial: () => Promise<void>;
  sincronizar: () => Promise<void>;
}

const SensorContext = createContext<SensorContextValue | undefined>(undefined);

export function SensorProvider({ children }: { children: ReactNode }) {
  const [lectura, setLectura] = useState<LecturaSensor | null>(null);
  const [analisis, setAnalisis] = useState<ResultadoAnalisis | null>(null);
  const [historial, setHistorial] = useState<HistorialItem[]>(historialMock);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lecturasPendientes, setLecturasPendientes] = useState(0);
  const historialRef = useRef<HistorialItem[]>(historialMock);
  const cargandoRef = useRef(false);

  function asignarHistorial(datos: HistorialItem[]) {
    historialRef.current = datos;
    setHistorial(datos);
  }

  async function cargarHistorial() {
    try {
      const datosGuardados = await AsyncStorage.getItem(HISTORIAL_KEY);

      if (datosGuardados) {
        asignarHistorial(JSON.parse(datosGuardados));
        return;
      }

      await AsyncStorage.setItem(HISTORIAL_KEY, JSON.stringify(historialMock));
    } catch {
      asignarHistorial(historialMock);
    }
  }

  async function actualizarCantidadPendiente() {
    const cantidad = await contarLecturasPendientes();
    setLecturasPendientes(cantidad);
  }

  async function sincronizar() {
    await sincronizarLecturasPendientes();
    await actualizarCantidadPendiente();
  }

  async function actualizarDatos() {
    if (cargandoRef.current) {
      return;
    }

    try {
      cargandoRef.current = true;
      setCargando(true);
      setError(null);

      const datos = await obtenerDatosProcesados();

      setLectura(datos.lectura);
      setAnalisis(datos.analisis);

      const nuevoRegistro: HistorialItem = {
        analisis_id: datos.analisis.analisis_id,
        lectura_id: datos.lectura.lectura_id,
        dispositivo_id: datos.lectura.dispositivo_id,
        campo_id: datos.lectura.campo_id,
        campo_nombre: datos.lectura.campo_nombre,
        cultivo: datos.lectura.contexto_suelo.cultivo,
        fecha_procesamiento: datos.analisis.fecha_procesamiento,
        estado_general: datos.analisis.estado_general,
        puntaje_general: datos.analisis.puntaje_general,
        ph: datos.lectura.lecturas.ph,
        conductividad: datos.lectura.lecturas.conductividad_ds_m,
        humedad: datos.lectura.lecturas.humedad_porcentaje,
        orp: datos.lectura.lecturas.orp_mv,
        temperatura: datos.lectura.lecturas.temperatura_c,
      };

      const historialActualizado = [
        nuevoRegistro,
        ...historialRef.current,
      ].slice(0, 20);

      asignarHistorial(historialActualizado);

      await AsyncStorage.setItem(
        HISTORIAL_KEY,
        JSON.stringify(historialActualizado),
      );
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No fue posible obtener las mediciones.";

      setError(mensaje);
    } finally {
      await actualizarCantidadPendiente();
      cargandoRef.current = false;
      setCargando(false);
    }
  }

  async function limpiarHistorial() {
    asignarHistorial([]);
    await AsyncStorage.setItem(HISTORIAL_KEY, JSON.stringify([]));
  }

  useEffect(() => {
    async function iniciar() {
      await cargarHistorial();
      await sincronizar();
      await actualizarDatos();
    }

    iniciar();

    const cancelarSuscripcion = NetInfo.addEventListener((estado) => {
      if (estado.isConnected) {
        sincronizar().catch((error) => {
          console.warn("No fue posible sincronizar las lecturas:", error);
        });
      }
    });

    return cancelarSuscripcion;

    // La carga inicial debe ejecutarse solamente una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SensorContext.Provider
      value={{
        lectura,
        analisis,
        historial,
        cargando,
        error,
        lecturasPendientes,
        actualizarDatos,
        limpiarHistorial,
        sincronizar,
      }}
    >
      {children}
    </SensorContext.Provider>
  );
}

export function useSensor() {
  const context = useContext(SensorContext);

  if (!context) {
    throw new Error("useSensor debe utilizarse dentro de SensorProvider.");
  }

  return context;
}
