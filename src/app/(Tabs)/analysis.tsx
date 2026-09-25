import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSensor } from "../../Context/SensorContext";
import { useTheme } from "../../Context/ThemeContext";
import { EstadoMedicion } from "../../Models/analysis";

function obtenerColor(estado: EstadoMedicion, oscuro: boolean) {
  switch (estado) {
    case "optimo":
      return oscuro ? "#76D27F" : "#2E7D32";
    case "advertencia":
      return oscuro ? "#FFB84D" : "#F9A825";
    case "critico":
      return oscuro ? "#FF8585" : "#C62828";
    default:
      return oscuro ? "#B9B1C2" : "#757575";
  }
}

function obtenerTextoEstado(estado: EstadoMedicion) {
  switch (estado) {
    case "optimo":
      return "Óptimo";
    case "advertencia":
      return "Advertencia";
    case "critico":
      return "Crítico";
    default:
      return "Sin datos";
  }
}

export default function AnalysisScreen() {
  const { analisis, cargando, error } = useSensor();
  const { oscuro, colores } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = crearEstilos(colores, oscuro);

  if (cargando && !analisis) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Procesando medición...</Text>
      </View>
    );
  }

  if (error || !analisis) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error ?? "No existe un análisis disponible."}
        </Text>
      </View>
    );
  }

  async function compartirResultado() {
    if (!analisis) {
      return;
    }

    const mediciones = analisis.resultados
      .map(
        (resultado) =>
          `${resultado.nombre}: ${resultado.valor} ${resultado.unidad} - ${obtenerTextoEstado(resultado.estado)}`,
      )
      .join("\n");

    const recomendaciones = analisis.recomendaciones
      .map(
        (recomendacion) =>
          `• ${recomendacion.titulo}: ${recomendacion.descripcion}`,
      )
      .join("\n");

    await Share.share({
      title: "Análisis del suelo",
      message:
        `Suelo Inteligente\n\n` +
        `Estado general: ${obtenerTextoEstado(analisis.estado_general)}\n` +
        `Puntaje: ${analisis.puntaje_general}/100\n\n` +
        `Mediciones:\n${mediciones}\n\n` +
        `Recomendaciones:\n${recomendaciones}`,
    });
  }

  const colorEstado = obtenerColor(analisis.estado_general, oscuro);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Análisis del suelo</Text>

      <Text style={styles.subtitle}>
        Resultado del procesamiento de la última lectura
      </Text>

      <View style={[styles.summaryCard, { borderLeftColor: colorEstado }]}>
        <View>
          <Text style={styles.label}>Estado general</Text>

          <Text style={[styles.status, { color: colorEstado }]}>
            {obtenerTextoEstado(analisis.estado_general)}
          </Text>
        </View>

        <View
          style={[
            styles.scoreCircle,
            { backgroundColor: `${colorEstado}${oscuro ? "25" : "18"}` },
          ]}
        >
          <Text style={[styles.score, { color: colorEstado }]}>
            {analisis.puntaje_general}
          </Text>

          <Text style={styles.scoreLabel}>puntos</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Resultados</Text>

      {analisis.resultados.map((resultado) => {
        const color = obtenerColor(resultado.estado, oscuro);

        return (
          <View key={resultado.variable} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultInformation}>
                <Text style={styles.resultName}>{resultado.nombre}</Text>

                <Text style={styles.range}>
                  Recomendado: {resultado.rango_recomendado.min} a{" "}
                  {resultado.rango_recomendado.max} {resultado.unidad}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: `${color}${oscuro ? "25" : "18"}`,
                  },
                ]}
              >
                <Text style={[styles.statusBadgeText, { color }]}>
                  {obtenerTextoEstado(resultado.estado)}
                </Text>
              </View>
            </View>

            <Text style={styles.value}>
              {resultado.valor}{" "}
              <Text style={styles.unit}>{resultado.unidad}</Text>
            </Text>

            <Text style={styles.message}>{resultado.mensaje}</Text>
          </View>
        );
      })}

      <Text style={styles.sectionTitle}>Alertas</Text>

      {analisis.alertas.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons
            name="checkmark-circle-outline"
            size={25}
            color={colores.principal}
          />

          <Text style={styles.emptyText}>
            No existen alertas en esta medición.
          </Text>
        </View>
      ) : (
        analisis.alertas.map((alerta, index) => {
          const color = obtenerColor(alerta.nivel, oscuro);

          return (
            <View key={`${alerta.variable}-${index}`} style={styles.alertCard}>
              <Ionicons name="warning-outline" size={25} color={color} />

              <View style={styles.alertContent}>
                <Text style={[styles.alertVariable, { color }]}>
                  {alerta.variable}
                </Text>

                <Text style={styles.alertMessage}>{alerta.mensaje}</Text>
              </View>
            </View>
          );
        })
      )}

      <Text style={styles.sectionTitle}>Recomendaciones</Text>

      {analisis.recomendaciones.map((recomendacion, index) => (
        <View
          key={`${recomendacion.titulo}-${index}`}
          style={styles.recommendationCard}
        >
          <Ionicons name="leaf-outline" size={25} color={colores.principal} />

          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>
              {recomendacion.titulo}
            </Text>

            <Text style={styles.priority}>
              Prioridad: {recomendacion.prioridad}
            </Text>

            <Text style={styles.recommendationText}>
              {recomendacion.descripcion}
            </Text>
          </View>
        </View>
      ))}

      <Pressable
        style={({ pressed }) => [
          styles.shareButton,
          pressed && styles.shareButtonPressed,
        ]}
        onPress={compartirResultado}
      >
        <Ionicons
          name="share-social-outline"
          size={21}
          color={oscuro ? "#112516" : "#FFFFFF"}
        />

        <Text style={styles.shareButtonText}>Compartir resultado</Text>
      </Pressable>
    </ScrollView>
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
    principalClaro: string;
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
      padding: 20,
      paddingBottom: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colores.texto,
    },
    subtitle: {
      marginTop: 5,
      marginBottom: 20,
      fontSize: 15,
      color: colores.textoSecundario,
    },
    summaryCard: {
      ...card,
      padding: 20,
      marginBottom: 25,
      borderRadius: 18,
      borderLeftWidth: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      elevation: oscuro ? 0 : 2,
      shadowColor: "#000000",
      shadowOpacity: oscuro ? 0 : 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    label: {
      fontSize: 14,
      color: colores.textoSecundario,
    },
    status: {
      marginTop: 4,
      fontSize: 24,
      fontWeight: "bold",
    },
    scoreCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    score: {
      fontSize: 25,
      fontWeight: "bold",
    },
    scoreLabel: {
      fontSize: 11,
      color: colores.textoSecundario,
    },
    sectionTitle: {
      marginBottom: 12,
      fontSize: 21,
      fontWeight: "bold",
      color: colores.texto,
    },
    resultCard: {
      ...card,
      padding: 17,
      marginBottom: 12,
      borderRadius: 16,
    },
    resultHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    resultInformation: {
      flex: 1,
      paddingRight: 10,
    },
    resultName: {
      fontSize: 17,
      fontWeight: "600",
      color: colores.texto,
    },
    range: {
      marginTop: 3,
      fontSize: 12,
      color: colores.textoSecundario,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: "600",
    },
    value: {
      marginTop: 15,
      fontSize: 27,
      fontWeight: "bold",
      color: colores.texto,
    },
    unit: {
      fontSize: 16,
      fontWeight: "normal",
      color: colores.textoSecundario,
    },
    message: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 20,
      color: colores.textoSecundario,
    },
    emptyCard: {
      ...card,
      padding: 16,
      marginBottom: 24,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    emptyText: {
      flex: 1,
      fontSize: 14,
      color: colores.textoSecundario,
    },
    alertCard: {
      ...card,
      padding: 16,
      marginBottom: 12,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    alertContent: {
      flex: 1,
    },
    alertVariable: {
      fontSize: 15,
      fontWeight: "bold",
      textTransform: "capitalize",
    },
    alertMessage: {
      marginTop: 3,
      fontSize: 14,
      lineHeight: 20,
      color: colores.textoSecundario,
    },
    recommendationCard: {
      padding: 17,
      marginBottom: 12,
      borderWidth: oscuro ? 1 : 0,
      borderColor: colores.borde,
      borderRadius: 14,
      backgroundColor: colores.principalClaro,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    recommendationContent: {
      flex: 1,
    },
    recommendationTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colores.texto,
    },
    priority: {
      marginTop: 3,
      fontSize: 12,
      fontWeight: "600",
      color: colores.principal,
      textTransform: "capitalize",
    },
    recommendationText: {
      marginTop: 6,
      fontSize: 14,
      lineHeight: 20,
      color: colores.textoSecundario,
    },
    center: {
      flex: 1,
      padding: 25,
      backgroundColor: colores.fondo,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      fontSize: 16,
      color: colores.principal,
    },
    errorText: {
      fontSize: 16,
      color: oscuro ? "#FF8585" : "#C62828",
      textAlign: "center",
    },
    shareButton: {
      minHeight: 52,
      marginTop: 12,
      borderRadius: 15,
      backgroundColor: colores.principal,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
    },
    shareButtonPressed: {
      opacity: 0.8,
    },
    shareButtonText: {
      fontSize: 16,
      fontWeight: "bold",
      color: oscuro ? "#112516" : "#FFFFFF",
    },
  });
}
