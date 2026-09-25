import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface ThemeColors {
  fondo: string;
  tarjeta: string;
  texto: string;
  textoSecundario: string;
  borde: string;
  principal: string;
  principalClaro: string;
  navegacionInactiva: string;
}

interface ThemeContextValue {
  oscuro: boolean;
  colores: ThemeColors;
  cambiarTema: (valor: boolean) => void;
}

const STORAGE_KEY = "tema-aplicacion";

const temaClaro: ThemeColors = {
  fondo: "#F1ECFA",
  tarjeta: "#FFFFFF",
  texto: "#203527",
  textoSecundario: "#6F7180",
  borde: "#E7E1F0",
  principal: "#2E7D32",
  principalClaro: "#E8F5E9",
  navegacionInactiva: "#7A857A",
};

const temaOscuro: ThemeColors = {
  fondo: "#15121C",
  tarjeta: "#231E2C",
  texto: "#F5F1F8",
  textoSecundario: "#B9B1C2",
  borde: "#54287A",
  principal: "#69BE73",
  principalClaro: "#263B2B",
  navegacionInactiva: "#9991A3",
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [oscuro, setOscuro] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((temaGuardado) => {
      if (temaGuardado) {
        setOscuro(temaGuardado === "oscuro");
      }
    });
  }, []);

  function cambiarTema(valor: boolean) {
    setOscuro(valor);
    AsyncStorage.setItem(STORAGE_KEY, valor ? "oscuro" : "claro");
  }

  return (
    <ThemeContext.Provider
      value={{
        oscuro,
        colores: oscuro ? temaOscuro : temaClaro,
        cambiarTema,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const contexto = useContext(ThemeContext);

  if (!contexto) {
    throw new Error("useTheme debe utilizarse dentro de ThemeProvider.");
  }

  return contexto;
}
