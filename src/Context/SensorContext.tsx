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
import { CultivoCatalogo, LecturaSensor } from "../Models/sensor";
import { verificarConexionApi } from "../Services/ConnectionService";
import {
  obtenerCultivosPorZona,
  obtenerDatosProcesados,
  obtenerZonas,
  sincronizarLecturasPendientes,
} from "../Services/SensorService";
import {
  LecturaSincronizada,
  contarLecturasPendientes,
} from "../Services/SyncService";

const [historial, setHistorial] = useState<HistorialItem[]>([]);
const HISTORIAL_KEY = "@suelo_inteligente_historial";
const CATALOGO_KEY = "@tlalcani_catalogo";
const CONFIGURACION_KEY = "@tlalcani_configuracion";

export type EstadoConexion = "verificando" | "conectado" | "sin_conexion";

interface CatalogoGuardado {
  zonas: string[];
  cultivosPorZona: Record<string, CultivoCatalogo[]>;
}

interface ConfiguracionGuardada {
  zona: string;
  cultivo: string;
}

interface SensorContextValue {
  lectura: LecturaSensor | null;
  analisis: ResultadoAnalisis | null;
  historial: HistorialItem[];
  cargando: boolean;
  error: string | null;
  lecturasPendientes: number;
  zonas: string[];
  cultivos: CultivoCatalogo[];
  zonaSeleccionada: string;
  cultivoSeleccionado: string;
  cargandoCatalogo: boolean;
  estadoConexion: EstadoConexion;
  seleccionarZona: (zona: string) => Promise<void>;
  seleccionarCultivo: (cultivo: string) => void;
  actualizarDatos: () => Promise<void>;
  limpiarHistorial: () => Promise<void>;
  sincronizar: () => Promise<void>;
  comprobarConexion: () => Promise<boolean>;
}

const SensorContext = createContext<SensorContextValue | undefined>(undefined);

export function SensorProvider({ children }: { children: ReactNode }) {
  const [lectura, setLectura] = useState<LecturaSensor | null>(null);
  const [analisis, setAnalisis] = useState<ResultadoAnalisis | null>(null);
  const [historial, setHistorial] = useState<HistorialItem[]>(historialMock);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lecturasPendientes, setLecturasPendientes] = useState(0);
  const [zonas, setZonas] = useState<string[]>([]);
  const [cultivos, setCultivos] = useState<CultivoCatalogo[]>([]);
  const [zonaSeleccionada, setZonaSeleccionada] = useState("");
  const [cultivoSeleccionado, setCultivoSeleccionado] = useState("");
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [estadoConexion, setEstadoConexion] =
    useState<EstadoConexion>("verificando");

  const zonaRef = useRef("");
  const cultivoRef = useRef("");
  const historialRef = useRef<HistorialItem[]>(historialMock);
  const zonasRef = useRef<string[]>([]);
  const cultivosPorZonaRef = useRef<Record<string, CultivoCatalogo[]>>({});
  const cargandoRef = useRef(false);

  function asignarHistorial(datos: HistorialItem[]) {
    historialRef.current = datos;
    setHistorial(datos);
  }

  function crearRegistro(
    lecturaNueva: LecturaSensor,
    analisisNuevo: ResultadoAnalisis,
  ): HistorialItem {
    return {
      analisis_id: analisisNuevo.analisis_id,
      lectura_id: lecturaNueva.lectura_id,
      dispositivo_id: lecturaNueva.dispositivo_id,
      campo_id: lecturaNueva.campo_id,
      campo_nombre: lecturaNueva.campo_nombre,
      zona: lecturaNueva.contexto_suelo.zona,
      cultivo: lecturaNueva.contexto_suelo.cultivo,
      fecha_procesamiento: analisisNuevo.fecha_procesamiento,
      estado_general: analisisNuevo.estado_general,
      puntaje_general: analisisNuevo.puntaje_general,
      ph: lecturaNueva.lecturas.ph,
      conductividad: lecturaNueva.lecturas.conductividad_ds_m,
      humedad: lecturaNueva.lecturas.humedad_porcentaje,
      orp: lecturaNueva.lecturas.orp_mv,
      temperatura: lecturaNueva.lecturas.temperatura_c,
    };
  }

  async function incorporarSincronizadas(sincronizadas: LecturaSincronizada[]) {
    if (sincronizadas.length === 0) {
      return;
    }

    const nuevos = sincronizadas
      .map((item) => crearRegistro(item.lectura, item.analisis))
      .reverse();

    const idsNuevos = new Set(nuevos.map((item) => item.lectura_id));

    const historialActualizado = [
      ...nuevos,
      ...historialRef.current.filter((item) => !idsNuevos.has(item.lectura_id)),
    ].slice(0, 20);

    asignarHistorial(historialActualizado);

    await AsyncStorage.setItem(
      HISTORIAL_KEY,
      JSON.stringify(historialActualizado),
    );

    const ultima = sincronizadas[sincronizadas.length - 1];

    setLectura(ultima.lectura);
    setAnalisis(ultima.analisis);
  }

  async function cargarHistorial() {
    try {
      const datosGuardados = await AsyncStorage.getItem(HISTORIAL_KEY);

      if (!datosGuardados) {
        asignarHistorial(historialMock);

        await AsyncStorage.setItem(
          HISTORIAL_KEY,
          JSON.stringify(historialMock),
        );

        return;
      }

      const datos = JSON.parse(datosGuardados);

      asignarHistorial(Array.isArray(datos) ? datos : []);
    } catch {
      asignarHistorial(historialMock);
    }
  }

  async function actualizarCantidadPendiente() {
    const cantidad = await contarLecturasPendientes();
    setLecturasPendientes(cantidad);
  }

  async function guardarCatalogo() {
    const catalogo: CatalogoGuardado = {
      zonas: zonasRef.current,
      cultivosPorZona: cultivosPorZonaRef.current,
    };

    await AsyncStorage.setItem(CATALOGO_KEY, JSON.stringify(catalogo));
  }

  async function guardarConfiguracion() {
    if (!zonaRef.current || !cultivoRef.current) {
      return;
    }

    const configuracion: ConfiguracionGuardada = {
      zona: zonaRef.current,
      cultivo: cultivoRef.current,
    };

    await AsyncStorage.setItem(
      CONFIGURACION_KEY,
      JSON.stringify(configuracion),
    );
  }

  async function cargarCatalogoGuardado() {
    try {
      const [catalogoTexto, configuracionTexto] = await Promise.all([
        AsyncStorage.getItem(CATALOGO_KEY),
        AsyncStorage.getItem(CONFIGURACION_KEY),
      ]);

      if (!catalogoTexto) {
        return false;
      }

      const catalogo = JSON.parse(catalogoTexto) as CatalogoGuardado;

      if (!Array.isArray(catalogo.zonas) || catalogo.zonas.length === 0) {
        return false;
      }

      const configuracion = configuracionTexto
        ? (JSON.parse(configuracionTexto) as ConfiguracionGuardada)
        : null;

      zonasRef.current = catalogo.zonas;
      cultivosPorZonaRef.current = catalogo.cultivosPorZona ?? {};

      setZonas(catalogo.zonas);

      const zonaValida = catalogo.zonas.includes(configuracion?.zona ?? "");

      const zona = zonaValida ? configuracion!.zona : catalogo.zonas[0];

      zonaRef.current = zona;
      setZonaSeleccionada(zona);

      const cultivosGuardados = cultivosPorZonaRef.current[zona] ?? [];

      setCultivos(cultivosGuardados);

      const cultivoValido = cultivosGuardados.some(
        (item) => item.nombre === configuracion?.cultivo,
      );

      const cultivo = cultivoValido
        ? configuracion!.cultivo
        : (cultivosGuardados[0]?.nombre ?? "");

      cultivoRef.current = cultivo;
      setCultivoSeleccionado(cultivo);

      return true;
    } catch {
      return false;
    }
  }

  async function cargarCatalogoRemoto() {
    setCargandoCatalogo(true);

    try {
      const zonasApi = await obtenerZonas();

      if (zonasApi.length === 0) {
        throw new Error("La API no contiene zonas disponibles.");
      }

      zonasRef.current = zonasApi;
      setZonas(zonasApi);

      const zona = zonasApi.includes(zonaRef.current)
        ? zonaRef.current
        : zonasApi[0];

      zonaRef.current = zona;
      setZonaSeleccionada(zona);

      const cultivosApi = await obtenerCultivosPorZona(zona);

      cultivosPorZonaRef.current = {
        ...cultivosPorZonaRef.current,
        [zona]: cultivosApi,
      };

      setCultivos(cultivosApi);

      const cultivoActualValido = cultivosApi.some(
        (item) => item.nombre === cultivoRef.current,
      );

      const cultivo = cultivoActualValido
        ? cultivoRef.current
        : (cultivosApi[0]?.nombre ?? "");

      cultivoRef.current = cultivo;
      setCultivoSeleccionado(cultivo);

      await guardarCatalogo();
      await guardarConfiguracion();
    } finally {
      setCargandoCatalogo(false);
    }
  }

  async function comprobarConexion() {
    setEstadoConexion("verificando");

    const disponible = await verificarConexionApi();

    setEstadoConexion(disponible ? "conectado" : "sin_conexion");

    return disponible;
  }

  async function procesarSincronizacion() {
    const resultado = await sincronizarLecturasPendientes();

    await incorporarSincronizadas(resultado.sincronizadas);

    setLecturasPendientes(resultado.pendientes);
  }

  async function sincronizar() {
    const disponible = await comprobarConexion();

    if (!disponible) {
      await actualizarCantidadPendiente();
      return;
    }

    await procesarSincronizacion();
  }

  function seleccionarCultivo(cultivo: string) {
    cultivoRef.current = cultivo;
    setCultivoSeleccionado(cultivo);

    guardarConfiguracion().catch(() => {
      console.warn("No fue posible guardar el cultivo seleccionado.");
    });
  }

  async function seleccionarZona(zona: string) {
    zonaRef.current = zona;
    setZonaSeleccionada(zona);
    setError(null);

    const cultivosGuardados = cultivosPorZonaRef.current[zona] ?? [];

    if (cultivosGuardados.length > 0) {
      setCultivos(cultivosGuardados);

      const cultivo = cultivosGuardados[0].nombre;

      cultivoRef.current = cultivo;
      setCultivoSeleccionado(cultivo);

      await guardarConfiguracion();
    }

    if (estadoConexion !== "conectado") {
      if (cultivosGuardados.length === 0) {
        setCultivos([]);
        cultivoRef.current = "";
        setCultivoSeleccionado("");

        setError(
          "Los cultivos de esta zona todavía no están disponibles sin conexión.",
        );
      }

      return;
    }

    try {
      setCargandoCatalogo(true);

      const cultivosApi = await obtenerCultivosPorZona(zona);

      cultivosPorZonaRef.current = {
        ...cultivosPorZonaRef.current,
        [zona]: cultivosApi,
      };

      setCultivos(cultivosApi);

      const cultivo = cultivosApi[0]?.nombre ?? "";

      cultivoRef.current = cultivo;
      setCultivoSeleccionado(cultivo);

      await guardarCatalogo();
      await guardarConfiguracion();
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No fue posible cargar los cultivos.";

      setError(mensaje);
    } finally {
      setCargandoCatalogo(false);
    }
  }

  async function actualizarDatos() {
    if (cargandoRef.current) {
      return;
    }

    try {
      cargandoRef.current = true;
      setCargando(true);
      setError(null);

      if (!zonaRef.current || !cultivoRef.current) {
        throw new Error("Selecciona una zona y un cultivo.");
      }

      const disponible = await comprobarConexion();

      const datos = await obtenerDatosProcesados(
        zonaRef.current,
        cultivoRef.current,
        disponible,
      );

      setLectura(datos.lectura);

      if (!datos.analisis) {
        setError(
          "La nueva lectura quedó guardada y será analizada cuando regrese la conexión.",
        );

        return;
      }

      setLectura(datos.lectura);
      setAnalisis(datos.analisis);

      await incorporarSincronizadas([
        {
          lectura: datos.lectura,
          analisis: datos.analisis,
        },
      ]);
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No fue posible obtener la medición.";

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
    let activo = true;

    async function iniciar() {
      await Promise.all([
        cargarHistorial(),
        cargarCatalogoGuardado(),
        actualizarCantidadPendiente(),
      ]);

      const disponible = await comprobarConexion();

      if (!activo) {
        return;
      }

      if (!disponible) {
        return;
      }

      try {
        await cargarCatalogoRemoto();
        await procesarSincronizacion();
        await actualizarDatos();
      } catch (error) {
        const mensaje =
          error instanceof Error
            ? error.message
            : "No fue posible cargar la configuración.";

        setError(mensaje);
      }
    }

    iniciar().catch((error) => {
      console.warn("No fue posible iniciar el servicio de mediciones:", error);
    });

    const cancelarSuscripcion = NetInfo.addEventListener((estado) => {
      if (estado.isConnected) {
        sincronizar().catch((error) => {
          console.warn("No fue posible sincronizar las lecturas:", error);
        });
      } else {
        setEstadoConexion("sin_conexion");
      }
    });

    return () => {
      activo = false;
      cancelarSuscripcion();
    };

    // La inicialización debe ejecutarse solamente una vez.
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
        zonas,
        cultivos,
        zonaSeleccionada,
        cultivoSeleccionado,
        cargandoCatalogo,
        estadoConexion,
        seleccionarZona,
        seleccionarCultivo,
        actualizarDatos,
        limpiarHistorial,
        sincronizar,
        comprobarConexion,
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
