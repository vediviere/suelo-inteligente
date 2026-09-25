import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Text, View } from "react-native";
import { AuthProvider, useAuth } from "../Context/AuthContext";
import { SensorProvider } from "../Context/SensorContext";
import { ThemeProvider, useTheme } from "../Context/ThemeContext";

function RootNavigator() {
  const { sesion, cargandoSesion } = useAuth();
  const { colores } = useTheme();

  if (cargandoSesion) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colores.fondo,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colores.principal} />
        <Text
          style={{
            marginTop: 12,
            fontSize: 15,
            color: colores.principal,
          }}
        >
          Iniciando aplicación...
        </Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!sesion}>
        <Stack.Screen name="login" />
      </Stack.Protected>

      <Stack.Protected guard={!!sesion}>
        <Stack.Screen name="(Tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

function AppContent() {
  const { oscuro } = useTheme();

  return (
    <>
      <StatusBar style={oscuro ? "light" : "dark"} />

      <AuthProvider>
        <SensorProvider>
          <RootNavigator />
        </SensorProvider>
      </AuthProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
