import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { API_CONFIG } from "../../Config/api";
import { useSensor } from "../../Context/SensorContext";
import { useTheme } from "../../Context/ThemeContext";
import type { EstadoMedicion } from "../../Models/analysis";
import type { ClimaActual } from "../../Services/WeatherService";
import { obtenerClimaActual } from "../../Services/WeatherService";

type IconName = ComponentProps<typeof Ionicons>["name"];

interface MeasurementItemProps {
  title: string;
  value: string;
  estado: EstadoMedicion;
  icon: IconName;
  color: string;
  backgroundColor: string;
  borderRight?: boolean;
  borderBottom?: boolean;
}

interface ClimateItemProps {
  icon: IconName;
  value: string;
}

function obtenerEstado(estado: EstadoMedicion, oscuro: boolean) {
  switch (estado) {
    case "optimo":
      return {
        texto: "Adecuado",
        color: oscuro ? "#76D27F" : "#2E7D32",
        fondo: oscuro ? "#243B29" : "#E8F5E9",
      };
    case "advertencia":
      return {
        texto: "Advertencia",
        color: oscuro ? "#FFB84D" : "#B26A00",
        fondo: oscuro ? "#493719" : "#FFF3E0",
      };
    case "critico":
      return {
        texto: "Crítico",
        color: oscuro ? "#FF8585" : "#C62828",
        fondo: oscuro ? "#44262C" : "#FFEBEE",
      };
    default:
      return {
        texto: "Sin datos",
        color: oscuro ? "#B9B1C2" : "#616161",
        fondo: oscuro ? "#332D3B" : "#EEEEEE",
      };
  }
}

function formatearTexto(valor: string) {
  return valor
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function ProgressCircle({ score, color }: { score: number; color: string }) {
  const { oscuro, colores } = useTheme();
  const themeStyles = crearTema(colores, oscuro);
  const size = 126;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(score, 100));
  const offset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.progressContainer}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colores.borde}
          strokeWidth={strokeWidth}
        />

        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      <View style={styles.progressContent}>
        <Text style={[styles.progressScore, themeStyles.text]}>{score}</Text>
        <Text style={[styles.progressLabel, themeStyles.secondaryText]}>
          / 100 pts
        </Text>
      </View>
    </View>
  );
}

function ClimateItem({ icon, value }: ClimateItemProps) {
  const { oscuro, colores } = useTheme();
  const themeStyles = crearTema(colores, oscuro);

  return (
    <View style={styles.climateItem}>
      <Ionicons name={icon} size={21} color="#3478F6" />
      <Text style={[styles.climateValue, themeStyles.text]}>{value}</Text>
    </View>
  );
}

function MeasurementItem({
  title,
  value,
  estado,
  icon,
  color,
  backgroundColor,
  borderRight,
  borderBottom,
}: MeasurementItemProps) {
  const { oscuro, colores } = useTheme();
  const themeStyles = crearTema(colores, oscuro);
  const estadoVisual = obtenerEstado(estado, oscuro);

  return (
    <View
      style={[
        styles.measurementItem,
        borderRight && styles.measurementBorderRight,
        borderRight && themeStyles.measurementBorderRight,
        borderBottom && styles.measurementBorderBottom,
        borderBottom && themeStyles.measurementBorderBottom,
      ]}
    >
      <View
        style={[
          styles.measurementIcon,
          {
            backgroundColor: oscuro ? `${color}25` : backgroundColor,
          },
        ]}
      >
        <Ionicons name={icon} size={24} color={color} />
      </View>

      <View style={styles.measurementInfo}>
        <Text style={[styles.measurementTitle, themeStyles.secondaryText]}>
          {title}
        </Text>

        <Text style={[styles.measurementValue, themeStyles.text]}>{value}</Text>

        <Text style={[styles.measurementStatus, { color: estadoVisual.color }]}>
          {estadoVisual.texto}
        </Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { oscuro, colores, cambiarTema } = useTheme();
  const themeStyles = crearTema(colores, oscuro);
  const {
    lectura,
    analisis,
    cargando,
    error,
    lecturasPendientes,
    actualizarDatos,
    sincronizar,
  } = useSensor();

  const [clima, setClima] = useState<ClimaActual | null>(null);
  const [cargandoClima, setCargandoClima] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [errorClima, setErrorClima] = useState<string | null>(null);

  const cargarClima = useCallback(async () => {
    try {
      setCargandoClima(true);
      setErrorClima(null);
      setClima(await obtenerClimaActual());
    } catch (error) {
      setErrorClima(
        error instanceof Error
          ? error.message
          : "No fue posible consultar el clima.",
      );
    } finally {
      setCargandoClima(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarClima();
  }, [cargarClima]);

  async function actualizarTodo() {
    await Promise.all([actualizarDatos(), cargarClima()]);
  }

  async function sincronizarAhora() {
    if (sincronizando) {
      return;
    }

    try {
      setSincronizando(true);
      await sincronizar();
    } finally {
      setSincronizando(false);
    }
  }

  function obtenerEstadoVariable(...variables: string[]): EstadoMedicion {
    const resultado = analisis?.resultados.find((item) =>
      variables.includes(item.variable),
    );

    return resultado?.estado ?? "sin_datos";
  }

  function formatearFecha(fecha?: string) {
    if (!fecha) {
      return "Sin mediciones";
    }

    return new Date(fecha).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (cargando && !lectura) {
    return (
      <View style={[styles.center, themeStyles.background]}>
        <ActivityIndicator size="large" color={colores.principal} />
        <Text style={[styles.loadingText, { color: colores.principal }]}>
          Obteniendo mediciones...
        </Text>
      </View>
    );
  }

  if (!lectura || !analisis) {
    return (
      <View style={[styles.center, themeStyles.background]}>
        <Ionicons name="cloud-offline-outline" size={50} color="#C62828" />

        <Text style={styles.errorText}>
          {error ?? "No fue posible obtener las mediciones."}
        </Text>

        <Pressable
          style={[styles.retryButton, { backgroundColor: colores.principal }]}
          onPress={actualizarTodo}
        >
          <Text
            style={[styles.retryButtonText, oscuro && themeStyles.buttonText]}
          >
            Intentar nuevamente
          </Text>
        </Pressable>
      </View>
    );
  }

  const estadoGeneral = obtenerEstado(analisis.estado_general, oscuro);
  //const recomendacion = analisis.recomendaciones[0];
  const actualizando = cargando || cargandoClima;

  return (
    <ScrollView
      style={[styles.container, themeStyles.background]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={actualizando}
          onRefresh={actualizarTodo}
          colors={[colores.principal]}
          tintColor={colores.principal}
          progressBackgroundColor={colores.tarjeta}
        />
      }
    >
      <ImageBackground
        source={
          oscuro
            ? require("../../../assets/images/header-landscape-dark.png")
            : require("../../../assets/images/header-landscape.png")
        }
        style={[
          styles.headerBackground,
          {
            height: insets.top + 155,
            paddingTop: insets.top + 10,
          },
        ]}
        imageStyle={styles.headerImage}
        resizeMode="cover"
      >
        <View
          style={[
            styles.headerOverlay,
            {
              backgroundColor: oscuro
                ? "rgba(10, 8, 18, 0.08)"
                : "rgba(255, 255, 255, 0.22)",
            },
          ]}
        />

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text
              style={[
                styles.title,
                {
                  color: oscuro ? "#FFFFFF" : "#173C25",
                },
              ]}
            >
              Suelo Inteligente
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: oscuro ? "#D8D1E0" : "#53645A",
                },
              ]}
            >
              Monitoreo del suelo
            </Text>
          </View>

          <View style={styles.headerActions}>
            <View
              style={[
                styles.simulationBadge,
                {
                  backgroundColor: oscuro
                    ? "rgba(35, 30, 44, 0.88)"
                    : "#E8F5E9",
                  borderWidth: oscuro ? 1 : 0,
                  borderColor: oscuro ? colores.borde : "transparent",
                },
              ]}
            >
              <View
                style={[
                  styles.simulationDot,
                  {
                    backgroundColor: API_CONFIG.usarMocks
                      ? oscuro
                        ? "#76D27F"
                        : "#2E7D32"
                      : "#3478F6",
                  },
                ]}
              />

              <Text
                style={[
                  styles.simulationText,
                  {
                    color: oscuro ? "#8FDF97" : "#2E7D32",
                  },
                ]}
              >
                {API_CONFIG.usarMocks ? "Simulado" : "Conectado"}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.themeButton,
                {
                  backgroundColor: oscuro
                    ? "rgba(35, 30, 44, 0.88)"
                    : "rgba(255, 255, 255, 0.88)",
                  borderColor: oscuro ? colores.borde : "#D7DDD8",
                },
                pressed && styles.themeButtonPressed,
              ]}
              onPress={() => cambiarTema(!oscuro)}
              accessibilityRole="button"
              accessibilityLabel={
                oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
              }
            >
              <Ionicons
                name={oscuro ? "moon" : "sunny"}
                size={21}
                color={oscuro ? "#D6B8FF" : "#E59A18"}
              />
            </Pressable>
            {lecturasPendientes > 0 && (
              <Pressable
                style={({ pressed }) => [
                  styles.syncButton,
                  {
                    backgroundColor: oscuro
                      ? "rgba(35, 30, 44, 0.88)"
                      : "rgba(255, 255, 255, 0.88)",
                    borderColor: oscuro ? colores.borde : "#D7DDD8",
                  },
                  pressed && styles.themeButtonPressed,
                ]}
                onPress={sincronizarAhora}
                disabled={sincronizando}
                accessibilityRole="button"
                accessibilityLabel={`${lecturasPendientes} lecturas pendientes de sincronización`}
              >
                {sincronizando ? (
                  <ActivityIndicator size="small" color={colores.principal} />
                ) : (
                  <>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={19}
                      color={colores.principal}
                    />

                    <Text
                      style={[
                        styles.syncButtonText,
                        { color: colores.principal },
                      ]}
                    >
                      {lecturasPendientes}
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.headerCurve} pointerEvents="none">
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 100 30"
            preserveAspectRatio="none"
          >
            <Path d="M0 22 Q50 2 100 22 L100 30 L0 30 Z" fill={colores.fondo} />
          </Svg>
        </View>
      </ImageBackground>

      {error && (
        <View style={[styles.warning, themeStyles.warning]}>
          <Ionicons name="warning-outline" size={20} color="#B26A00" />
          <Text style={[styles.warningText, themeStyles.warningText]}>
            {error}
          </Text>
        </View>
      )}

      <View style={[styles.climateCard, themeStyles.background]}>
        <View style={styles.climateTitleContainer}>
          <Text style={[styles.climateTitle, themeStyles.text]}>
            Clima local
          </Text>
        </View>

        {cargandoClima && !clima ? (
          <ActivityIndicator color="#3478F6" />
        ) : errorClima && !clima ? (
          <View style={styles.climateErrorContainer}>
            <Ionicons name="cloud-offline-outline" size={20} color="#C62828" />
            <Text style={styles.climateError}>Sin datos</Text>
          </View>
        ) : clima ? (
          <View style={styles.climateValues}>
            <ClimateItem
              icon="sunny-outline"
              value={`${clima.temperatura.toFixed(1)}°`}
            />

            <View
              style={[
                styles.climateDivider,
                { backgroundColor: colores.borde },
              ]}
            />

            <ClimateItem
              icon="water-outline"
              value={`${clima.humedad.toFixed(0)}%`}
            />

            <View
              style={[
                styles.climateDivider,
                { backgroundColor: colores.borde },
              ]}
            />

            <ClimateItem
              icon="rainy-outline"
              value={`${clima.precipitacion.toFixed(1)}`}
            />
          </View>
        ) : null}
      </View>

      <View style={[styles.statusCard, themeStyles.card]}>
        <View style={styles.indexSide}>
          <ProgressCircle
            score={analisis.puntaje_general}
            color={estadoGeneral.color}
          />
        </View>

        <View
          style={[styles.statusDivider, { backgroundColor: colores.borde }]}
        />

        <View style={styles.statusDetails}>
          <Text style={[styles.statusLabel, themeStyles.text]}>
            Índice del suelo
          </Text>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: estadoGeneral.fondo },
            ]}
          >
            <Ionicons name="leaf" size={19} color={estadoGeneral.color} />

            <Text style={[styles.statusTitle, { color: estadoGeneral.color }]}>
              {estadoGeneral.texto}
            </Text>
          </View>

          <View style={styles.dateContainer}>
            <Ionicons
              name="time-outline"
              size={18}
              color={colores.textoSecundario}
            />

            <Text style={[styles.statusDate, themeStyles.secondaryText]}>
              {formatearFecha(lectura.fecha_hora)}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.measurementsCard, themeStyles.card]}>
        <Text style={[styles.sectionTitle, themeStyles.text]}>Mediciones</Text>

        <View style={styles.measurementGrid}>
          <MeasurementItem
            title="pH"
            value={lectura.lecturas.ph.toFixed(1)}
            estado={obtenerEstadoVariable("ph")}
            icon="water-outline"
            color="#2E7D32"
            backgroundColor="#E8F5E9"
            borderRight
            borderBottom
          />

          <MeasurementItem
            title="Conductividad"
            value={`${lectura.lecturas.conductividad_ds_m.toFixed(2)} dS/m`}
            estado={obtenerEstadoVariable("ce", "conductividad")}
            icon="pulse-outline"
            color="#3478F6"
            backgroundColor="#EAF2FF"
            borderBottom
          />

          <MeasurementItem
            title="Humedad"
            value={`${lectura.lecturas.humedad_porcentaje.toFixed(0)} %`}
            estado={obtenerEstadoVariable("humedad")}
            icon="water"
            color="#3478F6"
            backgroundColor="#EAF2FF"
            borderRight
            borderBottom
          />

          <MeasurementItem
            title="ORP"
            value={`${lectura.lecturas.orp_mv.toFixed(0)} mV`}
            estado={obtenerEstadoVariable("orp")}
            icon="pulse-outline"
            color="#7B4BC4"
            backgroundColor="#F0E9FA"
            borderBottom
          />

          <MeasurementItem
            title="Temperatura"
            value={`${lectura.lecturas.temperatura_c.toFixed(1)} °C`}
            estado={obtenerEstadoVariable("temperatura")}
            icon="thermometer-outline"
            color="#E85D3F"
            backgroundColor="#FDEDEA"
            borderRight
          />
        </View>
      </View>

      <View style={[styles.contextBar, themeStyles.card]}>
        <View
          style={[
            styles.contextIcon,
            { backgroundColor: colores.principalClaro },
          ]}
        >
          <Ionicons name="leaf" size={25} color={colores.principal} />
        </View>

        <Text
          style={[styles.contextSummary, themeStyles.text]}
          numberOfLines={2}
        >
          {formatearTexto(lectura.contexto_suelo.cultivo)}
          {" · "}
          {formatearTexto(lectura.contexto_suelo.tipo_textura)}
          {" · "}
          {formatearTexto(lectura.contexto_suelo.etapa_cultivo)}
        </Text>
      </View>

      {/* {recomendacion && (
        <View
          style={[
            styles.recommendationBar,
            { backgroundColor: colores.principalClaro },
          ]}
        >
          <View
            style={[
              styles.recommendationIcon,
              { backgroundColor: colores.principal },
            ]}
          >
            <Ionicons name="bulb-outline" size={25} color="#FFFFFF" />
          </View>

          <View style={styles.recommendationContent}>
            <Text style={[styles.recommendationTitle, themeStyles.text]}>
              {recomendacion.titulo}
            </Text>

            <Text
              style={[styles.recommendationText, themeStyles.secondaryText]}
              numberOfLines={2}
            >
              {recomendacion.descripcion}
            </Text>
          </View>
        </View>
      )} */}

      <Pressable
        style={({ pressed }) => [
          styles.refreshButton,
          { backgroundColor: colores.principal },
          pressed && styles.refreshButtonPressed,
          actualizando && styles.refreshButtonDisabled,
        ]}
        onPress={actualizarTodo}
        disabled={actualizando}
      >
        {actualizando ? (
          <ActivityIndicator color={oscuro ? "#112516" : "#FFFFFF"} />
        ) : (
          <>
            <Ionicons
              name="refresh-outline"
              size={21}
              color={oscuro ? "#112516" : "#FFFFFF"}
            />
            <Text
              style={[
                styles.refreshButtonText,
                oscuro && themeStyles.buttonText,
              ]}
            >
              Actualizar información
            </Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1ECFA",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    padding: 25,
    backgroundColor: "#F1ECFA",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#2E7D32",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 22,
    color: "#C62828",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
  },
  retryButtonText: {
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerBackground: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  headerImage: {
    opacity: 0.95,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#173C25",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: "#53645A",
  },
  simulationBadge: {
    //marginLeft: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    flexDirection: "row",
    alignItems: "center",
  },
  simulationDot: {
    width: 8,
    height: 8,
    marginRight: 6,
    borderRadius: 4,
  },
  simulationText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E7D32",
  },
  warning: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#FFF3E0",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#8A5700",
  },
  climateCard: {
    minHeight: 50,
    paddingHorizontal: 20,
    marginHorizontal: -20,
    marginTop: -8,
    marginBottom: 2,
    backgroundColor: "#F1ECFA",
    flexDirection: "row",
    alignItems: "center",
  },
  climateTitleContainer: {
    width: 88,
    paddingRight: 8,
  },
  climateTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#203527",
  },
  climateValues: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  climateItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  climateValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#203527",
  },
  climateDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E7E1F0",
  },
  climateErrorContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  climateError: {
    fontSize: 12,
    color: "#C62828",
  },
  statusCard: {
    minHeight: 175,
    padding: 16,
    marginBottom: 15,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
  indexSide: {
    width: "43%",
    alignItems: "center",
  },
  progressContainer: {
    width: 126,
    height: 126,
    alignItems: "center",
    justifyContent: "center",
  },
  progressContent: {
    position: "absolute",
    alignItems: "center",
  },
  progressScore: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#203527",
  },
  progressLabel: {
    marginTop: -3,
    fontSize: 11,
    color: "#6F7180",
  },
  statusDivider: {
    width: 1,
    height: 125,
    backgroundColor: "#E7E1F0",
    marginLeft: 8,
  },
  statusDetails: {
    flex: 1,
    paddingLeft: 17,
  },
  statusLabel: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#203527",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: "bold",
  },
  dateContainer: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDate: {
    flex: 1,
    fontSize: 11,
    color: "#6F7180",
  },
  measurementsCard: {
    marginBottom: 15,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    paddingHorizontal: 17,
    paddingTop: 17,
    paddingBottom: 10,
    fontSize: 21,
    fontWeight: "bold",
    color: "#203527",
  },
  measurementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  measurementItem: {
    width: "50%",
    minHeight: 105,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  measurementBorderRight: {
    borderRightWidth: 1,
    borderRightColor: "#E7E1F0",
  },
  measurementBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#E7E1F0",
  },
  measurementIcon: {
    width: 42,
    height: 42,
    marginRight: 10,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  measurementInfo: {
    flex: 1,
  },
  measurementTitle: {
    fontSize: 12,
    color: "#6F7180",
  },
  measurementValue: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: "bold",
    color: "#203527",
  },
  measurementStatus: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
  },
  contextBar: {
    minHeight: 60,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  contextIcon: {
    width: 43,
    height: 43,
    marginRight: 12,
    borderRadius: 22,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  contextSummary: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#203527",
  },
  recommendationBar: {
    minHeight: 76,
    padding: 14,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    flexDirection: "row",
    alignItems: "center",
  },
  recommendationIcon: {
    width: 48,
    height: 48,
    marginRight: 12,
    borderRadius: 24,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1E4029",
  },
  recommendationText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: "#415447",
  },
  refreshButton: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  refreshButtonPressed: {
    opacity: 0.85,
  },
  refreshButtonDisabled: {
    opacity: 0.65,
  },
  refreshButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerCurve: {
    position: "absolute",
    right: 0,
    bottom: -1,
    left: 0,
    height: 38,
  },
  headerActions: {
    marginLeft: 10,
    alignItems: "flex-end",
  },
  themeButton: {
    width: 40,
    height: 40,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  themeButtonPressed: {
    opacity: 0.7,
  },
  syncButton: {
    minWidth: 40,
    height: 40,
    marginTop: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  syncButtonText: {
    fontSize: 13,
    fontWeight: "bold",
  },
});

function crearTema(
  colores: {
    fondo: string;
    tarjeta: string;
    texto: string;
    textoSecundario: string;
    borde: string;
    principal: string;
    principalClaro: string;
  },
  oscuro: boolean,
) {
  return StyleSheet.create({
    background: {
      backgroundColor: colores.fondo,
    },
    card: {
      backgroundColor: colores.tarjeta,
      borderWidth: oscuro ? 1 : 0,
      borderColor: colores.borde,
      elevation: oscuro ? 0 : undefined,
      shadowOpacity: oscuro ? 0 : undefined,
    },
    text: {
      color: colores.texto,
    },
    secondaryText: {
      color: colores.textoSecundario,
    },
    buttonText: {
      color: "#112516",
    },
    measurementBorderRight: {
      borderRightColor: colores.borde,
    },
    measurementBorderBottom: {
      borderBottomColor: colores.borde,
    },
    warning: {
      backgroundColor: oscuro ? "#493719" : "#FFF3E0",
    },
    warningText: {
      color: oscuro ? "#FFCA75" : "#8A5700",
    },
  });
}
