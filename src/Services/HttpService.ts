const TIEMPO_LIMITE = 15000;

export async function obtenerJson<T>(
  url: string,
  opciones: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const temporizador = setTimeout(() => controller.abort(), TIEMPO_LIMITE);

  try {
    const response = await fetch(url, {
      ...opciones,
      signal: controller.signal,
    });

    if (!response.ok) {
      let mensaje = `Error HTTP ${response.status}`;

      try {
        const contenido = await response.text();

        if (contenido) {
          const errorApi = JSON.parse(contenido);
          mensaje = errorApi.message ?? errorApi.title ?? mensaje;
        }
      } catch {
        // Se mantiene el mensaje HTTP original.
      }

      throw new Error(mensaje);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("La API tardó demasiado tiempo en responder.");
    }

    if (error instanceof TypeError) {
      throw new Error("No fue posible establecer comunicación con la API.");
    }

    throw error;
  } finally {
    clearTimeout(temporizador);
  }
}
