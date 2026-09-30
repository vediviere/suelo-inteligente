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
  fondo: "#EDF2EE",
  tarjeta: "#F8FAF8",
  texto: "#203126",
  textoSecundario: "#657269",
  borde: "#C8D5CA",
  principal: "#2E7D32",
  principalClaro: "#DCEEDE",
  navegacionInactiva: "#657269",
};

const temaOscuro: ThemeColors = {
  fondo: "#101712",
  tarjeta: "#18221A",
  texto: "#F0F6F1",
  textoSecundario: "#A7B6AA",
  borde: "#31533A",
  principal: "#6ED47A",
  principalClaro: "#243B29",
  navegacionInactiva: "#A7B6AA",
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
