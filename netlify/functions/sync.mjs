import { getStore } from "@netlify/blobs";

// Single-record encrypted sync store for the projection app.
// The browser encrypts the payload before sending, so this function
// (and Netlify) only ever see ciphertext. Optimistic concurrency via
// baseUpdatedAt guards against one device silently overwriting another.

const STORE_NAME = "projection-sync";
const RECORD_KEY = "state";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export default async (req) => {
  // Optional shared-secret gate. Set SYNC_TOKEN in the Netlify UI to require it.
  const required = process.env.SYNC_TOKEN;
  if (required) {
    const given = req.headers.get("x-sync-token");
    if (given !== required) return json({ error: "unauthorized" }, 401);
  }

  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  try {
    if (req.method === "GET") {
      const rec = await store.get(RECORD_KEY, { type: "json" });
      return json(rec || { updatedAt: 0, payload: null });
    }

    if (req.method === "POST") {
      let body;
      try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
      const payload = body && typeof body.payload === "string" ? body.payload : null;
      if (!payload) return json({ error: "no payload" }, 400);

      const current = await store.get(RECORD_KEY, { type: "json" });
      const serverUpdatedAt = (current && current.updatedAt) || 0;
      const base = Number(body.baseUpdatedAt || 0);

      // Someone wrote since this device last loaded: report a conflict
      if (!body.force && serverUpdatedAt > base) {
        return json({ conflict: true, updatedAt: serverUpdatedAt }, 409);
      }

      const updatedAt = Date.now();
      await store.setJSON(RECORD_KEY, { updatedAt, payload });
      return json({ ok: true, updatedAt });
    }

    return json({ error: "method not allowed" }, 405);
  } catch (e) {
    return json({ error: String((e && e.message) || e) }, 500);
  }
};
