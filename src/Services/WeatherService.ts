export interface ClimaActual {
  temperatura: number;
  humedad: number;
  precipitacion: number;
  codigo: number;
  fecha: string;
}

interface OpenMeteoResponse {
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
  };
}

const latitud = Number(process.env.EXPO_PUBLIC_CLIMA_LATITUD ?? "19.4326");
const longitud = Number(process.env.EXPO_PUBLIC_CLIMA_LONGITUD ?? "-99.1332");

export async function obtenerClimaActual(): Promise<ClimaActual> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const variables =
      "temperature_2m,relative_humidity_2m,precipitation,weather_code";

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitud}` +
      `&longitude=${longitud}` +
      `&current=${variables}` +
      `&timezone=auto`;

    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("No fue posible consultar el clima.");
    }

    const data: OpenMeteoResponse = await response.json();

    if (!data.current) {
      throw new Error("La API no devolvió información del clima.");
    }

    return {
      temperatura: data.current.temperature_2m,
      humedad: data.current.relative_humidity_2m,
      precipitacion: data.current.precipitation,
      codigo: data.current.weather_code,
      fecha: data.current.time,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("La consulta del clima tardó demasiado.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
