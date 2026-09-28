const URL_API =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://api-suelo-inteligente.onrender.com";

export const API_CONFIG = {
  usarMocks: process.env.EXPO_PUBLIC_USAR_MOCKS !== "false",

  datos: {
    url: URL_API,
    lecturaActual: "/api/lecturas/ultima",
    registrarLectura: "/api/lecturas",
    ultimaLectura: "/api/lecturas/ultima",
    lecturas: "/api/lecturas",
  },

  analisis: {
    url: URL_API,
    procesar: "/api/analisis",
    ultimo: "/api/analisis/ultimo",
    historial: "/api/analisis",
  },
};
