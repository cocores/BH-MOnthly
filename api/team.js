// Shared team storage for the Monthly Delivery Board.
// Backed by Vercel KV (Upstash Redis REST API) — provision it in the
// Vercel dashboard (Storage -> KV) and link it to this project; Vercel
// injects KV_REST_API_URL and KV_REST_API_TOKEN automatically.
//
// GET  /api/team?id=<code>  -> {ok:true, data: <last pushed payload or null>}
// POST /api/team?id=<code>  -> body is the JSON payload to store; {ok:true}

const ID_RE = /^[A-Za-z0-9_-]{3,64}$/;
const MAX_BYTES = 900000;

module.exports = async function handler(req, res) {
  const base = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!base || !token) {
    res.status(503).json({
      ok: false,
      error: "Shared storage isn't set up for this deployment yet. Add Vercel KV to the project (Storage -> KV) and redeploy."
    });
    return;
  }

  const id = String((req.query && req.query.id) || "").trim();
  if (!ID_RE.test(id)) {
    res.status(400).json({ ok: false, error: "Shared board code must be 3-64 characters: letters, numbers, - or _." });
    return;
  }
  const key = "monthly-team:" + id;

  try {
    if (req.method === "GET") {
      const r = await fetch(base + "/get/" + encodeURIComponent(key), {
        headers: { Authorization: "Bearer " + token }
      });
      if (!r.ok) { res.status(502).json({ ok: false, error: "Shared storage didn't respond." }); return; }
      const j = await r.json();
      let data = null;
      if (j && j.result) { try { data = JSON.parse(j.result); } catch (e) { data = null; } }
      res.status(200).json({ ok: true, data: data });
      return;
    }

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = null; } }
      if (!body || typeof body !== "object") {
        res.status(400).json({ ok: false, error: "Missing JSON body." });
        return;
      }
      const payload = JSON.stringify(body);
      if (payload.length > MAX_BYTES) {
        res.status(413).json({ ok: false, error: "That board is too large to push to shared storage." });
        return;
      }
      const r = await fetch(base + "/set/" + encodeURIComponent(key), {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: payload
      });
      if (!r.ok) { res.status(502).json({ ok: false, error: "Shared storage didn't respond." }); return; }
      const j = await r.json();
      if (!j || j.result !== "OK") {
        res.status(502).json({ ok: false, error: "Shared storage didn't confirm the save." });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ ok: false, error: "Method not allowed." });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Shared storage request failed." });
  }
};
