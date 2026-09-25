import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../Context/AuthContext";
import { useTheme } from "../Context/ThemeContext";

export default function LoginScreen() {
  const { iniciarSesion } = useAuth();
  const { oscuro, colores } = useTheme();
  const styles = crearEstilos(colores, oscuro);

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingresar() {
    if (!correo.trim() || !password) {
      setError("Ingresa el correo y la contraseña.");
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const resultado = await iniciarSesion(correo, password);

      if (resultado) {
        setError(resultado);
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logo}>
          <Ionicons name="leaf-outline" size={55} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>Suelo Inteligente</Text>

        <Text style={styles.subtitle}>
          Monitoreo y análisis del estado del suelo
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar sesión</Text>

          <Text style={styles.cardSubtitle}>
            Ingresa tus datos para consultar las mediciones
          </Text>

          <Text style={styles.label}>Correo electrónico</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={21}
              color={colores.textoSecundario}
            />

            <TextInput
              style={styles.input}
              value={correo}
              onChangeText={setCorreo}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={oscuro ? "#81798A" : "#A0A9A3"}
              selectionColor={colores.principal}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              keyboardAppearance={oscuro ? "dark" : "light"}
              editable={!cargando}
            />
          </View>

          <Text style={styles.label}>Contraseña</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={21}
              color={colores.textoSecundario}
            />

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              placeholderTextColor={oscuro ? "#81798A" : "#A0A9A3"}
              selectionColor={colores.principal}
              secureTextEntry={!mostrarPassword}
              autoCapitalize="none"
              keyboardAppearance={oscuro ? "dark" : "light"}
              editable={!cargando}
              onSubmitEditing={ingresar}
            />

            <Pressable
              style={styles.passwordButton}
              onPress={() => setMostrarPassword((actual) => !actual)}
            >
              <Ionicons
                name={mostrarPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={colores.textoSecundario}
              />
            </Pressable>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={oscuro ? "#FF8585" : "#C62828"}
              />

              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.loginButtonPressed,
              cargando && styles.loginButtonDisabled,
            ]}
            onPress={ingresar}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color={oscuro ? "#112516" : "#FFFFFF"} />
            ) : (
              <Text style={styles.loginButtonText}>Ingresar</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.footer}>Prototipo de monitoreo agrícola</Text>
      </ScrollView>
    </KeyboardAvoidingView>
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
  return StyleSheet.create({
    keyboardView: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 24,
      paddingBottom: 40,
    },
    logo: {
      width: 96,
      height: 96,
      alignSelf: "center",
      borderRadius: 30,
      backgroundColor: oscuro ? "#347C3D" : colores.principal,
      alignItems: "center",
      justifyContent: "center",
      elevation: oscuro ? 0 : 4,
      shadowColor: oscuro ? "#000000" : "#1E4029",
      shadowOpacity: oscuro ? 0 : 0.22,
      shadowRadius: 9,
      shadowOffset: { width: 0, height: 4 },
    },
    title: {
      marginTop: 20,
      fontSize: 30,
      fontWeight: "bold",
      color: colores.texto,
      textAlign: "center",
    },
    subtitle: {
      maxWidth: 310,
      alignSelf: "center",
      marginTop: 7,
      marginBottom: 25,
      fontSize: 15,
      lineHeight: 21,
      color: colores.textoSecundario,
      textAlign: "center",
    },
    card: {
      width: "100%",
      maxWidth: 430,
      alignSelf: "center",
      padding: 21,
      borderWidth: 1,
      borderColor: colores.borde,
      borderRadius: 22,
      backgroundColor: colores.tarjeta,
      elevation: oscuro ? 0 : 3,
      shadowColor: "#000000",
      shadowOpacity: oscuro ? 0 : 0.08,
      shadowRadius: 9,
      shadowOffset: { width: 0, height: 3 },
    },
    cardTitle: {
      fontSize: 23,
      fontWeight: "bold",
      color: colores.texto,
    },
    cardSubtitle: {
      marginTop: 5,
      marginBottom: 22,
      fontSize: 14,
      lineHeight: 19,
      color: colores.textoSecundario,
    },
    label: {
      marginBottom: 7,
      fontSize: 13,
      fontWeight: "600",
      color: colores.texto,
    },
    inputContainer: {
      minHeight: 53,
      paddingHorizontal: 14,
      marginBottom: 17,
      borderWidth: 1,
      borderColor: colores.borde,
      borderRadius: 14,
      backgroundColor: oscuro ? "#1B1722" : "#F8FAF8",
      flexDirection: "row",
      alignItems: "center",
    },
    input: {
      flex: 1,
      paddingHorizontal: 10,
      fontSize: 15,
      color: colores.texto,
    },
    passwordButton: {
      padding: 5,
    },
    errorContainer: {
      padding: 11,
      marginBottom: 15,
      borderRadius: 11,
      backgroundColor: oscuro ? "#44262C" : "#FFEBEE",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    errorText: {
      flex: 1,
      fontSize: 13,
      color: oscuro ? "#FF9A9A" : "#C62828",
    },
    loginButton: {
      minHeight: 53,
      borderRadius: 14,
      backgroundColor: colores.principal,
      alignItems: "center",
      justifyContent: "center",
    },
    loginButtonPressed: {
      opacity: 0.85,
    },
    loginButtonDisabled: {
      opacity: 0.65,
    },
    loginButtonText: {
      fontSize: 16,
      fontWeight: "bold",
      color: oscuro ? "#112516" : "#FFFFFF",
    },
    footer: {
      marginTop: 22,
      fontSize: 12,
      color: colores.textoSecundario,
      textAlign: "center",
    },
  });
}
