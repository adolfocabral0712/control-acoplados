const CABECERAS_JSON = {
  "content-type": "application/json; charset=UTF-8",
  "cache-control": "no-store, no-cache, must-revalidate",
  "x-content-type-options": "nosniff"
};

function respuestaJSON(datos, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: CABECERAS_JSON
  });
}

async function obtenerAcoplados(env) {
  const valorSecreto = String(env.CONTROL_ACOPLADOS_URL || "").trim();

  if (!valorSecreto) {
    return respuestaJSON({
      error: true,
      mensaje: "Falta configurar el secret CONTROL_ACOPLADOS_URL."
    }, 500);
  }

  let urlOrigen;
  try {
    urlOrigen = new URL(valorSecreto);
    urlOrigen.searchParams.set("t", Date.now().toString());
  } catch {
    return respuestaJSON({
      error: true,
      mensaje: "El secret CONTROL_ACOPLADOS_URL no contiene una URL válida."
    }, 500);
  }

  try {
    const respuesta = await fetch(urlOrigen.toString(), {
      headers: { "accept": "application/json" },
      cf: { cacheTtl: 0, cacheEverything: false }
    });

    if (!respuesta.ok) {
      throw new Error(`La fuente respondió HTTP ${respuesta.status}`);
    }

    const texto = await respuesta.text();
    JSON.parse(texto);

    return new Response(texto, {
      status: 200,
      headers: CABECERAS_JSON
    });
  } catch (error) {
    return respuestaJSON({
      error: true,
      mensaje: "Error interno al consultar la fuente.",
      detalle: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/acoplados") {
      if (request.method !== "GET") {
        return respuestaJSON({ error: true, mensaje: "Método no permitido." }, 405);
      }
      return obtenerAcoplados(env);
    }

    return env.ASSETS.fetch(request);
  }
};
