export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = env.ALLOWED_ORIGIN || "";
    const corsOrigin = allowed && origin === allowed ? origin : "null";
    const headers = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json; charset=utf-8",
      "Vary": "Origin"
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return new Response(JSON.stringify({ error: "Use POST." }), { status: 405, headers });
    if (corsOrigin === "null") return new Response(JSON.stringify({ error: "Origin not allowed." }), { status: 403, headers });
    if (!allowed) return new Response(JSON.stringify({ error: "Set ALLOWED_ORIGIN in Worker settings." }), { status: 503, headers });

    try {
      const raw = await request.text();
      if (raw.length > 2_500_000) return new Response(JSON.stringify({ error: "Image request is too large." }), { status: 413, headers });
      const body = JSON.parse(raw);
      if (body.action === "wine-search" || body.action === "wine-detail") {
        if (!env.WINEAPI_KEY) return new Response(JSON.stringify({ error: "WineAPI is not configured. Add the WINEAPI_KEY secret in Cloudflare." }), { status: 503, headers });
        let url;
        if (body.action === "wine-search") {
          const query = String(body.query || "").trim().slice(0, 160);
          if (query.length < 2) return new Response(JSON.stringify({ error: "Enter at least two characters to search." }), { status: 400, headers });
          url = "https://api.wineapi.io/wines/search?q=" + encodeURIComponent(query) + "&limit=8&offset=0";
        } else {
          const id = String(body.id || "");
          if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(JSON.stringify({ error: "Invalid wine record ID." }), { status: 400, headers });
          url = "https://api.wineapi.io/wines/" + encodeURIComponent(id);
        }
        const wineResponse = await fetch(url, { headers: { "X-API-Key": env.WINEAPI_KEY, "Accept": "application/json" } });
        const wineText = await wineResponse.text();
        return new Response(wineText, { status: wineResponse.status, headers });
      }
      if (!env.OPENAI_API_KEY) return new Response(JSON.stringify({ error: "AI service is not configured. Add OPENAI_API_KEY in Cloudflare." }), { status: 503, headers });
      const type = body.type === "wine" ? "wine" : body.type === "beer" ? "beer" : null;
      if (!type || typeof body.image !== "string" || !/^data:image\/(jpeg|jpg|png|webp);base64,/.test(body.image)) {
        return new Response(JSON.stringify({ error: "Provide a beer or wine type and a JPEG, PNG, or WebP image." }), { status: 400, headers });
      }

      const fields = type === "wine"
        ? ["name", "winery", "grape", "region", "vintage", "country", "abv"]
        : ["name", "brewery", "style", "region", "packaging", "country", "abv"];
      const properties = Object.fromEntries(fields.map(key => [key, { type: ["vintage", "abv"].includes(key) ? ["string", "null"] : ["string", "null"] }]));
      const schema = {
        type: "object",
        properties,
        required: fields,
        additionalProperties: false
      };
      const prompt = type === "wine"
        ? "Read this wine label. Extract only information clearly visible or confidently identifiable on the label. Return null for anything uncertain or absent. Do not guess. For abv, look carefully for alcohol by volume, Alc., alcohol vol. or a percentage such as 12.5% vol. Return only the numeric percentage as a string, without the % sign. vintage and abv must be strings."
        : "Read this beer label. Extract only information clearly visible or confidently identifiable on the label. Return null for anything uncertain or absent. Do not guess. For abv, look carefully for alcohol by volume, Alc., alcohol vol. or a percentage such as 8.5% vol. Return only the numeric percentage as a string, without the % sign. abv must be a string.";

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + env.OPENAI_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-4.1-mini",
          input: [{
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: body.image, detail: "high" }
            ]
          }],
          text: {
            format: {
              type: "json_schema",
              name: "cheers_label",
              strict: true,
              schema
            }
          }
        })
      });
      const result = await response.json();
      if (!response.ok) {
        return new Response(JSON.stringify({ error: result.error?.message || "AI provider request failed." }), { status: 502, headers });
      }
      const output = (result.output || []).flatMap(item => item.content || []).find(item => item.type === "output_text")?.text;
      if (!output) return new Response(JSON.stringify({ error: "No readable label data returned." }), { status: 502, headers });
      return new Response(output, { status: 200, headers });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Request could not be processed." }), { status: 400, headers });
    }
  }
};
