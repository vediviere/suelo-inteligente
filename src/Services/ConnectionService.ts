import { API_CONFIG } from "../Config/api";

const TIEMPO_LIMITE = 8000;

export async function verificarConexionApi(): Promise<boolean> {
  if (!API_CONFIG.datos.url) {
    return false;
  }

  const controller = new AbortController();
  const temporizador = setTimeout(() => controller.abort(), TIEMPO_LIMITE);

  try {
    const response = await fetch(`${API_CONFIG.datos.url}${API_CONFIG.salud}`, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      return false;
    }

    const resultado = await response.json();

    return resultado?.estado === "Disponible";
  } catch {
    return false;
  } finally {
    clearTimeout(temporizador);
  }
}
