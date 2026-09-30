import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import type { ImageSourcePropType } from "react-native";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSensor } from "../../Context/SensorContext";
import { useTheme } from "../../Context/ThemeContext";
import type { HistorialItem } from "../../Data/historyMock";
import type { EstadoMedicion } from "../../Models/analysis";

const iconos = {
  ph: require("../../../assets/iconos/ph.png"),
  conductividad: require("../../../assets/iconos/conductividad.png"),
  humedad: require("../../../assets/iconos/humedad.png"),
  orp: require("../../../assets/iconos/orp.png"),
  temperatura: require("../../../assets/iconos/temperatura.png"),
  suelo: require("../../../assets/iconos/suelo.png"),
  cultivo: require("../../../assets/iconos/cultivo.png"),
};

function obtenerEstado(estado: EstadoMedicion, oscuro: boolean) {
  switch (estado) {
    case "optimo":
      return {
        texto: "Óptimo",
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

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HistoryCard({
  item,
  onPress,
}: {
  item: HistorialItem;
  onPress: () => void;
}) {
  const { oscuro, colores } = useTheme();
  const styles = crearEstilos(colores, oscuro);
  const estado = obtenerEstado(item.estado_general, oscuro);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.date}>
            {formatearFecha(item.fecha_procesamiento)}
          </Text>

          <Text style={styles.identifier}>Análisis: {item.analisis_id}</Text>

          <View style={styles.origin}>
            <Ionicons
              name="location-outline"
              size={15}
              color={colores.principal}
            />

            <Text style={styles.originText} numberOfLines={2}>
              {item.zona ?? "Zona no identificada"} ·{" "}
              {item.campo_nombre ?? "Campo no identificado"} ·{" "}
              {item.cultivo ?? "Cultivo no identificado"}
            </Text>
          </View>

          <Text style={styles.sensorText}>
            Sensor: {item.dispositivo_id ?? "No identificado"}
          </Text>
        </View>

        <View style={[styles.badge, { backgroundColor: estado.fondo }]}>
          <Text style={[styles.badgeText, { color: estado.color }]}>
            {estado.texto}
          </Text>
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <Ionicons name="analytics-outline" size={25} color={estado.color} />

        <Text style={styles.scoreLabel}>Puntaje general</Text>

        <Text style={[styles.score, { color: estado.color }]}>
          {item.puntaje_general}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardFooterText}>Consultar mediciones</Text>

        <Ionicons name="chevron-forward" size={20} color={colores.principal} />
      </View>
    </Pressable>
  );
}

function DetailRow({
  icon,
  imagen,
  title,
  value,
  color,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  imagen?: ImageSourcePropType;
  title: string;
  value: string;
  color?: string;
}) {
  const { oscuro, colores } = useTheme();
  const styles = crearEstilos(colores, oscuro);
  const colorIcono = color ?? colores.principal;

  return (
    <View style={styles.detailRow}>
      <View
        style={[
          styles.detailIcon,
          !imagen && {
            backgroundColor: `${colorIcono}${oscuro ? "25" : "15"}`,
          },
        ]}
      >
        {imagen ? (
          <Image source={imagen} style={styles.detailImage} />
        ) : icon ? (
          <Ionicons name={icon} size={24} color={colorIcono} />
        ) : null}
      </View>

      <Text style={styles.detailTitle}>{title}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { historial, limpiarHistorial } = useSensor();
  const { oscuro, colores } = useTheme();
  const styles = crearEstilos(colores, oscuro);
  const [seleccionado, setSeleccionado] = useState<HistorialItem | null>(null);

  const promedio =
    historial.length > 0
      ? Math.round(
          historial.reduce((total, item) => total + item.puntaje_general, 0) /
            historial.length,
        )
      : 0;

  const registrosCriticos = historial.filter(
    (item) => item.estado_general === "critico",
  ).length;

  function confirmarLimpieza() {
    Alert.alert(
      "Limpiar historial",
      "¿Deseas eliminar todas las mediciones guardadas?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: limpiarHistorial,
        },
      ],
    );
  }

  const estadoSeleccionado = seleccionado
    ? obtenerEstado(seleccionado.estado_general, oscuro)
    : null;

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 18 },
        ]}
        data={historial}
        keyExtractor={(item) => item.analisis_id}
        renderItem={({ item }) => (
          <HistoryCard item={item} onPress={() => setSeleccionado(item)} />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.title}>Historial</Text>

              {historial.length > 0 && (
                <Pressable
                  style={styles.clearButton}
                  onPress={confirmarLimpieza}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={oscuro ? "#FF8585" : "#C62828"}
                  />

                  <Text style={styles.clearButtonText}>Limpiar</Text>
                </Pressable>
              )}
            </View>

            <Text style={styles.subtitle}>
              Resultados de mediciones anteriores
            </Text>

            {historial.length > 0 && (
              <View style={styles.summary}>
                <View style={styles.summaryItem}>
                  <Ionicons
                    name="documents-outline"
                    size={23}
                    color={colores.principal}
                  />

                  <Text style={styles.summaryValue}>{historial.length}</Text>

                  <Text style={styles.summaryLabel}>Mediciones</Text>
                </View>

                <View style={styles.summaryItem}>
                  <Ionicons
                    name="analytics-outline"
                    size={23}
                    color="#4F91FF"
                  />

                  <Text style={styles.summaryValue}>{promedio}</Text>

                  <Text style={styles.summaryLabel}>Promedio</Text>
                </View>

                <View style={styles.summaryItem}>
                  <Ionicons
                    name="warning-outline"
                    size={23}
                    color={oscuro ? "#FF8585" : "#C62828"}
                  />

                  <Text style={styles.summaryValue}>{registrosCriticos}</Text>

                  <Text style={styles.summaryLabel}>Críticas</Text>
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="file-tray-outline"
              size={48}
              color={colores.textoSecundario}
            />

            <Text style={styles.emptyTitle}>Sin mediciones</Text>

            <Text style={styles.emptyText}>
              Actualiza los datos desde la pantalla de inicio para generar un
              nuevo registro.
            </Text>
          </View>
        }
      />

      <Modal
        visible={seleccionado !== null}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setSeleccionado(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Detalle de medición</Text>

                {seleccionado && (
                  <Text style={styles.modalDate}>
                    {formatearFecha(seleccionado.fecha_procesamiento)}
                  </Text>
                )}
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={() => setSeleccionado(null)}
              >
                <Ionicons name="close" size={25} color={colores.texto} />
              </Pressable>
            </View>

            {seleccionado && estadoSeleccionado && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View
                  style={[
                    styles.modalStatus,
                    {
                      backgroundColor: estadoSeleccionado.fondo,
                    },
                  ]}
                >
                  <View>
                    <Text style={styles.modalStatusLabel}>Estado general</Text>

                    <Text
                      style={[
                        styles.modalStatusText,
                        {
                          color: estadoSeleccionado.color,
                        },
                      ]}
                    >
                      {estadoSeleccionado.texto}
                    </Text>
                  </View>

                  <View>
                    <Text
                      style={[
                        styles.modalScore,
                        {
                          color: estadoSeleccionado.color,
                        },
                      ]}
                    >
                      {seleccionado.puntaje_general}
                    </Text>

                    <Text style={styles.modalScoreLabel}>puntos</Text>
                  </View>
                </View>

                <Text style={styles.detailSectionTitle}>
                  Origen de la lectura
                </Text>

                <DetailRow
                  icon="map-outline"
                  title="Zona"
                  value={seleccionado.zona ?? "No identificada"}
                  color="#2E7D32"
                />

                {/* Se puede agregar este campo frente a campo_nombre (${seleccionado.campo_id}) */}
                <DetailRow
                  imagen={iconos.suelo}
                  title="Campo"
                  value={
                    seleccionado.campo_nombre
                      ? `${seleccionado.campo_nombre} `
                      : "No identificado"
                  }
                />

                <DetailRow
                  imagen={iconos.cultivo}
                  title="Cultivo"
                  value={seleccionado.cultivo ?? "No identificado"}
                />

                <DetailRow
                  icon="hardware-chip-outline"
                  title="Sensor"
                  value={seleccionado.dispositivo_id ?? "No identificado"}
                  color="#8854D0"
                />

                <Text style={styles.detailSectionTitle}>Mediciones</Text>

                <DetailRow
                  imagen={iconos.ph}
                  title="pH"
                  value={seleccionado.ph.toFixed(1)}
                />

                <DetailRow
                  imagen={iconos.conductividad}
                  title="Conductividad"
                  value={`${seleccionado.conductividad.toFixed(2)} dS/m`}
                />

                <DetailRow
                  imagen={iconos.humedad}
                  title="Humedad"
                  value={`${seleccionado.humedad.toFixed(0)} %`}
                />

                <DetailRow
                  imagen={iconos.orp}
                  title="ORP"
                  value={`${seleccionado.orp.toFixed(0)} mV`}
                />

                <DetailRow
                  imagen={iconos.temperatura}
                  title="Temperatura"
                  value={`${seleccionado.temperatura.toFixed(1)} °C`}
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

function crearEstilos(
  colores: {
    fondo: string;
    tarjeta: string;
    texto: string;
    textoSecundario: string;
    borde: string;
    principal: string;
  },
  oscuro: boolean,
) {
  const card = {
    backgroundColor: colores.tarjeta,
    borderWidth: oscuro ? 1 : 0,
    borderColor: colores.borde,
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 35,
    },
    header: {
      marginBottom: 20,
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colores.texto,
    },
    subtitle: {
      marginTop: 5,
      fontSize: 15,
      color: colores.textoSecundario,
    },
    clearButton: {
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 12,
      backgroundColor: oscuro ? "#44262C" : "#FFEBEE",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    clearButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: oscuro ? "#FF8585" : "#C62828",
    },
    card: {
      ...card,
      padding: 17,
      marginBottom: 15,
      borderRadius: 17,
      elevation: oscuro ? 0 : 2,
      shadowColor: "#000000",
      shadowOpacity: oscuro ? 0 : 0.07,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 2 },
    },
    cardPressed: {
      opacity: 0.8,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    cardHeaderText: {
      flex: 1,
      marginRight: 10,
    },
    date: {
      fontSize: 16,
      fontWeight: "bold",
      color: colores.texto,
    },
    identifier: {
      marginTop: 3,
      fontSize: 12,
      color: colores.textoSecundario,
    },
    origin: {
      marginTop: 9,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    originText: {
      flex: 1,
      fontSize: 13,
      fontWeight: "600",
      color: colores.texto,
    },
    sensorText: {
      marginTop: 4,
      fontSize: 12,
      color: colores.textoSecundario,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "bold",
    },
    scoreContainer: {
      marginTop: 17,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: colores.borde,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    scoreLabel: {
      flex: 1,
      fontSize: 14,
      color: colores.textoSecundario,
    },
    score: {
      fontSize: 23,
      fontWeight: "bold",
    },
    cardFooter: {
      paddingTop: 13,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
    },
    cardFooterText: {
      marginRight: 3,
      fontSize: 13,
      fontWeight: "600",
      color: colores.principal,
    },
    empty: {
      marginTop: 80,
      paddingHorizontal: 30,
      alignItems: "center",
    },
    emptyTitle: {
      marginTop: 12,
      fontSize: 18,
      fontWeight: "bold",
      color: colores.texto,
    },
    emptyText: {
      marginTop: 6,
      fontSize: 14,
      lineHeight: 20,
      color: colores.textoSecundario,
      textAlign: "center",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: oscuro ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.35)",
      justifyContent: "flex-end",
    },
    modalContent: {
      maxHeight: "88%",
      padding: 20,
      borderTopWidth: oscuro ? 1 : 0,
      borderColor: colores.borde,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      backgroundColor: colores.fondo,
    },
    modalHandle: {
      width: 45,
      height: 5,
      marginBottom: 18,
      borderRadius: 3,
      backgroundColor: colores.borde,
      alignSelf: "center",
    },
    modalHeader: {
      marginBottom: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    modalTitle: {
      fontSize: 23,
      fontWeight: "bold",
      color: colores.texto,
    },
    modalDate: {
      marginTop: 4,
      fontSize: 13,
      color: colores.textoSecundario,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colores.tarjeta,
      borderWidth: oscuro ? 1 : 0,
      borderColor: colores.borde,
      alignItems: "center",
      justifyContent: "center",
    },
    modalStatus: {
      padding: 18,
      marginBottom: 22,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    modalStatusLabel: {
      fontSize: 13,
      color: colores.textoSecundario,
    },
    modalStatusText: {
      marginTop: 3,
      fontSize: 21,
      fontWeight: "bold",
    },
    modalScore: {
      fontSize: 26,
      fontWeight: "bold",
      textAlign: "center",
    },
    modalScoreLabel: {
      fontSize: 11,
      color: colores.textoSecundario,
      textAlign: "center",
    },
    detailSectionTitle: {
      marginBottom: 12,
      fontSize: 19,
      fontWeight: "bold",
      color: colores.texto,
    },
    detailRow: {
      ...card,
      padding: 14,
      marginBottom: 10,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
    },
    detailIcon: {
      width: 43,
      height: 43,
      marginRight: 12,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    detailImage: {
      width: 41,
      height: 41,
      resizeMode: "contain",
    },
    detailTitle: {
      flex: 1,
      fontSize: 15,
      color: colores.textoSecundario,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: colores.texto,
    },
    summary: {
      marginTop: 18,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    summaryItem: {
      ...card,
      width: "31%",
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
    },
    summaryValue: {
      marginTop: 5,
      fontSize: 21,
      fontWeight: "bold",
      color: colores.texto,
    },
    summaryLabel: {
      marginTop: 2,
      fontSize: 11,
      color: colores.textoSecundario,
    },
  });
}
