import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_CONFIG } from "../../Config/api";
import { useAuth } from "../../Context/AuthContext";
import { useTheme } from "../../Context/ThemeContext";

const variables = [
  {
    nombre: "pH",
    descripcion: "Indica el nivel de acidez o alcalinidad del suelo.",
    imagen: require("../../../assets/iconos/ph.png"),
  },
  {
    nombre: "Conductividad",
    descripcion: "Estima la concentración de sales presentes en el suelo.",
    imagen: require("../../../assets/iconos/conductividad.png"),
  },
  {
    nombre: "Humedad",
    descripcion: "Representa el porcentaje de agua disponible en el suelo.",
    imagen: require("../../../assets/iconos/humedad.png"),
  },
  {
    nombre: "ORP",
    descripcion: "Mide la capacidad de oxidación o reducción del suelo.",
    imagen: require("../../../assets/iconos/orp.png"),
  },
  {
    nombre: "Temperatura",
    descripcion: "Registra la temperatura actual alrededor del sensor.",
    imagen: require("../../../assets/iconos/temperatura.png"),
  },
];

export default function InfoScreen() {
  const insets = useSafeAreaInsets();
  const { sesion, cerrarSesion } = useAuth();
  const { oscuro, colores } = useTheme();
  const styles = crearEstilos(colores);

  function confirmarCierre() {
    Alert.alert("Cerrar sesión", "¿Deseas salir de la aplicación?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: cerrarSesion,
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}
    >
      <Text style={styles.title}>Información</Text>
      <Text style={styles.subtitle}>
        Conoce las variables analizadas por la aplicación
      </Text>

      <View
        style={[
          styles.aboutCard,
          {
            backgroundColor: oscuro ? "#163A25" : "#2E7D32",
          },
        ]}
      >
        <View style={styles.logo}>
          <Image
            source={require("../../../assets/images/tlalcani-logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.aboutContent}>
          <Text style={styles.appName}>TLALCANI</Text>
          <Text style={styles.version}>Monitoreo inteligente del suelo</Text>
        </View>
      </View>

      <View style={styles.connectionCard}>
        <View
          style={[
            styles.connectionIcon,
            {
              backgroundColor: API_CONFIG.usarMocks
                ? oscuro
                  ? "#493719"
                  : "#FFF3E0"
                : colores.principalClaro,
            },
          ]}
        >
          <Ionicons
            name={API_CONFIG.usarMocks ? "flask-outline" : "cloud-done-outline"}
            size={25}
            color={API_CONFIG.usarMocks ? "#E6A63A" : colores.principal}
          />
        </View>

        <View style={styles.connectionContent}>
          <Text style={styles.connectionTitle}>
            {API_CONFIG.usarMocks ? "Modo simulado" : "APIs conectadas"}
          </Text>

          <Text style={styles.connectionText}>
            {API_CONFIG.usarMocks
              ? "La aplicación está utilizando datos de prueba generados localmente."
              : "La aplicación está obteniendo y procesando información desde las APIs."}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Variables del suelo</Text>

      {variables.map((variable) => (
        <View key={variable.nombre} style={styles.variableCard}>
          <View style={styles.iconContainer}>
            <Image source={variable.imagen} style={styles.variableIcon} />
          </View>

          <View style={styles.variableContent}>
            <Text style={styles.variableName}>{variable.nombre}</Text>
            <Text style={styles.variableDescription}>
              {variable.descripcion}
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.accountCard}>
        <View style={styles.accountIcon}>
          <Ionicons name="person-outline" size={25} color={colores.principal} />
        </View>

        <View style={styles.accountContent}>
          <Text style={styles.accountName}>{sesion?.nombre}</Text>
          <Text style={styles.accountEmail}>{sesion?.correo}</Text>
        </View>

        <Pressable style={styles.logoutButton} onPress={confirmarCierre}>
          <Ionicons name="log-out-outline" size={23} color="#E05252" />
        </Pressable>
      </View>

      <View style={styles.noticeCard}>
        <Ionicons
          name="information-circle-outline"
          size={26}
          color={colores.principal}
        />

        <Text style={styles.noticeText}>
          Los datos mostrados actualmente son simulados. Posteriormente serán
          obtenidos desde el dispositivo de medición y procesados por el
          sistema.
        </Text>
      </View>
    </ScrollView>
  );
}

function crearEstilos(colores: {
  fondo: string;
  tarjeta: string;
  texto: string;
  textoSecundario: string;
  borde: string;
  principal: string;
  principalClaro: string;
}) {
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
    aboutCard: {
      padding: 20,
      marginBottom: 12,
      borderRadius: 18,
      flexDirection: "row",
      alignItems: "center",
    },
    logo: {
      width: 64,
      height: 64,
      marginRight: 15,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.32)",
      borderRadius: 32,
      backgroundColor: "rgba(255,255,255,0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    logoImage: {
      width: 54,
      height: 54,
    },
    aboutContent: {
      flex: 1,
    },
    appName: {
      fontSize: 21,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    version: {
      marginTop: 4,
      fontSize: 13,
      color: "#E4F1E5",
    },
    connectionCard: {
      padding: 16,
      marginBottom: 25,
      borderRadius: 15,
      backgroundColor: colores.tarjeta,
      borderWidth: 1,
      borderColor: colores.borde,
      flexDirection: "row",
      alignItems: "center",
    },
    connectionIcon: {
      width: 48,
      height: 48,
      marginRight: 13,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    connectionContent: {
      flex: 1,
    },
    connectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colores.texto,
    },
    connectionText: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 18,
      color: colores.textoSecundario,
    },
    sectionTitle: {
      marginBottom: 12,
      fontSize: 21,
      fontWeight: "bold",
      color: colores.texto,
    },
    variableCard: {
      padding: 16,
      marginBottom: 12,
      borderRadius: 15,
      backgroundColor: colores.tarjeta,
      borderWidth: 1,
      borderColor: colores.borde,
      flexDirection: "row",
      alignItems: "center",
    },
    iconContainer: {
      width: 52,
      height: 52,
      marginRight: 14,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    variableIcon: {
      width: 48,
      height: 48,
      resizeMode: "contain",
    },
    variableContent: {
      flex: 1,
    },
    variableName: {
      fontSize: 16,
      fontWeight: "bold",
      color: colores.texto,
    },
    variableDescription: {
      marginTop: 4,
      fontSize: 14,
      lineHeight: 19,
      color: colores.textoSecundario,
    },
    accountCard: {
      padding: 16,
      marginTop: 14,
      borderRadius: 15,
      backgroundColor: colores.tarjeta,
      borderWidth: 1,
      borderColor: colores.borde,
      flexDirection: "row",
      alignItems: "center",
    },
    accountIcon: {
      width: 48,
      height: 48,
      marginRight: 13,
      borderRadius: 24,
      backgroundColor: colores.principalClaro,
      alignItems: "center",
      justifyContent: "center",
    },
    accountContent: {
      flex: 1,
    },
    accountName: {
      fontSize: 16,
      fontWeight: "bold",
      color: colores.texto,
    },
    accountEmail: {
      marginTop: 3,
      fontSize: 13,
      color: colores.textoSecundario,
    },
    logoutButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: "#44262C",
      alignItems: "center",
      justifyContent: "center",
    },
    noticeCard: {
      padding: 17,
      marginTop: 14,
      borderRadius: 15,
      backgroundColor: colores.principalClaro,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    noticeText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: colores.texto,
    },
  });
}
