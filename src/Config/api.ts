export const API_CONFIG = {
  usarMocks: process.env.EXPO_PUBLIC_USAR_MOCKS !== "false",
  datos: {
    url: process.env.EXPO_PUBLIC_DATOS_API_URL ?? "",
    lecturaActual: "/api/lecturas/actual",
  },

  analisis: {
    url: process.env.EXPO_PUBLIC_ANALISIS_API_URL ?? "",
    procesar: "/api/analisis",
  },
};

// al cambiar a nuestra API real, debemos asegurarnos de que la variable de entorno EXPO_PUBLIC_USAR_MOCKS esté establecida en "false" para desactivar el uso de datos simulados.

// EXPO_PUBLIC_USAR_MOCKS=false
// EXPO_PUBLIC_DATOS_API_URL=https://tu-api-csharp.onrender.com
// EXPO_PUBLIC_ANALISIS_API_URL=https://tu-api-python.onrender.com
