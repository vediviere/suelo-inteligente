const URL_API =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://api-suelo-inteligente.onrender.com";

export const API_CONFIG = {
  usarMocks: process.env.EXPO_PUBLIC_USAR_MOCKS !== "false",
  salud: "/health",

  datos: {
    url: URL_API,
    lecturaActual: "/api/lecturas/ultima",
    registrarLectura: "/api/lecturas",
    ultimaLectura: "/api/lecturas/ultima",
    lecturas: "/api/lecturas",
    zonas: "/api/catalogo/zonas",
    cultivosPorZona: "/api/catalogo/zonas",
  },

  analisis: {
    url: URL_API,
    ultimo: "/api/lecturas/analisis/ultimo",
    historial: "/api/lecturas/analisis",
    interpretacionBase: "/api/lecturas/analisis",
  },
};
