// Cloudflare Pages Function at /api/review: receives the documents, asks Claude for the review,
// and streams the answer back to the page as it is written.
// Needs the secret ANTHROPIC_API_KEY (Pages > Settings > Variables and Secrets).
// Optional variables: ACCESS_CODE (visitors must type it), CLAUDE_MODEL.
import { buildPrompt } from "../../lib/playbook.js";

const MAX_TEXT = 150000;        // characters per document
const MAX_IMAGES = 5;           // scanned pages in total
const MAX_IMAGE_B64 = 700000;   // ~500 KB per page image
const HOURLY_LIMIT = 8;         // reviews per visitor per hour (best effort)
const ERR = "\u0000ERROR:";     // marks an error inside the stream
const hits = new Map();

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function tooMany(ip) {
  const now = Date.now(), hour = 3600_000;
  const list = (hits.get(ip) || []).filter(t => now - t < hour);
  if (list.length >= HOURLY_LIMIT) { hits.set(ip, list); return true; }
  list.push(now); hits.set(ip, list); return false;
}

function cleanDoc(d) {
  if (!d || typeof d !== "object") return null;
  const name = String(d.name || "Document").slice(0, 120);
  const text = typeof d.text === "string" ? d.text.slice(0, MAX_TEXT) : "";
  const images = Array.isArray(d.images) ? d.images.filter(s => typeof s === "string" && s.length < MAX_IMAGE_B64) : [];
  if (!text.trim() && !images.length) return null;
  return { name, text, images, scanned: !text.trim() && images.length > 0 };
}

export async function onRequestGet() {
  return json(405, { error: "Use POST." });
}

export async function onRequestPost({ request, env }) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(500, { error: "The review service isn't set up yet. The site owner needs to add the ANTHROPIC_API_KEY secret in Cloudflare." });

  let body;
  try { body = await request.json(); } catch { return json(400, { error: "That upload didn't come through. Try again." }); }

  if (env.ACCESS_CODE && String(body.accessCode || "").trim() !== env.ACCESS_CODE) {
    return json(401, { error: "That access code isn't right. Ask whoever shared this site for the code.", needCode: true });
  }
  if (tooMany(request.headers.get("CF-Connecting-IP") || "unknown")) {
    return json(429, { error: "You've run several reviews in the last hour. Please wait a bit and try again." });
  }

  const loi = cleanDoc(body.loi), lease = cleanDoc(body.lease);
  if (!loi && !lease) return json(400, { error: "Upload an LOI or a lease first." });

  const content = [];
  let used = 0;
  for (const [label, d] of [["LOI", loi], ["LEASE", lease]]) {
    if (!d?.images.length) continue;
    for (const [i, data] of d.images.entries()) {
      if (used >= MAX_IMAGES) break;
      used++;
      content.push({ type: "text", text: `${label} page ${i + 1}:` });
      content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data } });
    }
  }
  content.push({ type: "text", text: buildPrompt({
    loi, lease,
    notes: String(body.notes || "").slice(0, 2000),
    tone: String(body.tone || "balanced"),
    sender: String(body.sender || "").slice(0, 100)
  }) });

  let upstream;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: env.CLAUDE_MODEL || "claude-sonnet-5-5", max_tokens: 12000, stream: true, messages: [{ role: "user", content }] })
    });
  } catch {
    return json(502, { error: "Couldn't reach the review service. Try again." });
  }
  if (!upstream.ok) {
    let msg = "";
    try { msg = (await upstream.json())?.error?.message || ""; } catch {}
    console.error("Anthropic error", upstream.status, msg);
    const error = upstream.status === 401 ? "The review service isn't set up correctly. The site owner needs to check the API key."
      : upstream.status === 429 || upstream.status === 529 ? "The review service is busy right now. Try again in a few minutes."
      : /credit balance/i.test(msg) ? "The review service is out of credit. Please let the site owner know."
      : /too long/i.test(msg) || upstream.status === 413 ? "These documents are too long to review at once. Try the LOI alone, or paste only the main lease sections."
      : "The review couldn't be completed. Try again.";
    return json(502, { error });
  }

  // Turn Claude's event stream into plain text for the page.
  const enc = new TextEncoder(), dec = new TextDecoder();
  const reader = upstream.body.getReader();
  let buf = "", closed = false;
  const out = new ReadableStream({
    async start(controller) {
      const send = (t) => { if (!closed) { try { controller.enqueue(enc.encode(t)); } catch { closed = true; } } };
      try {
        while (!closed) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i;
          while ((i = buf.indexOf("\n\n")) >= 0) {
            const evt = buf.slice(0, i); buf = buf.slice(i + 2);
            const line = evt.split("\n").find(l => l.startsWith("data:"));
            if (!line) continue;
            let data; try { data = JSON.parse(line.slice(5)); } catch { continue; }
            if (data.type === "content_block_delta" && data.delta?.type === "text_delta") send(data.delta.text);
            else if (data.type === "error") send(ERR + "The review was interrupted. Try again.");
          }
        }
      } catch {
        send(ERR + "The review was interrupted. Try again.");
      }
      if (!closed) { closed = true; try { controller.close(); } catch {} }
    },
    // The visitor closed or left the page: stop the review so it doesn't keep costing money.
    cancel() { closed = true; reader.cancel().catch(() => {}); }
  });
  return new Response(out, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
