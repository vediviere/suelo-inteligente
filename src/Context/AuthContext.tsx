import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

const SESSION_KEY = "@suelo_inteligente_session";

interface Sesion {
  nombre: string;
  correo: string;
}

interface AuthContextValue {
  sesion: Sesion | null;
  cargandoSesion: boolean;
  iniciarSesion: (correo: string, password: string) => Promise<string | null>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    let activo = true;

    async function cargarSesion() {
      try {
        const datos = await AsyncStorage.getItem(SESSION_KEY);

        if (datos && activo) {
          setSesion(JSON.parse(datos));
        }
      } finally {
        if (activo) {
          setCargandoSesion(false);
        }
      }
    }

    cargarSesion();

    return () => {
      activo = false;
    };
  }, []);

  async function iniciarSesion(correo: string, password: string) {
    const correoNormalizado = correo.trim().toLowerCase();

    if (correoNormalizado !== "demo@suelo.app" || password !== "Demo1234") {
      return "El correo o la contraseña son incorrectos.";
    }

    const nuevaSesion: Sesion = {
      nombre: "Usuario Demo",
      correo: correoNormalizado,
    };

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nuevaSesion));
    setSesion(nuevaSesion);

    return null;
  }

  async function cerrarSesion() {
    await AsyncStorage.removeItem(SESSION_KEY);
    setSesion(null);
  }

  return (
    <AuthContext.Provider
      value={{
        sesion,
        cargandoSesion,
        iniciarSesion,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  }

  return context;
}
