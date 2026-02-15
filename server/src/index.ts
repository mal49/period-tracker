import { Hono } from "hono";
import { cors } from "hono/cors";
import { sendPushNotification } from "./webpush.ts";

// ─── Types ─────────────────────────────────────────────────────

interface Env {
  DB: D1Database;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_EMAIL: string;
  ALLOWED_ORIGINS: string;
}

interface ScheduleRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  notify_at: number;
  title: string;
  body: string;
  created_at: number;
}

// ─── App ───────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env }>();

// Dynamic CORS based on ALLOWED_ORIGINS env var
app.use(
  "*",
  async (c, next) => {
    const allowedOrigins = (c.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    const origin = c.req.header("Origin") || "";
    const isAllowed = allowedOrigins.length === 0 || allowedOrigins.includes(origin);

    return cors({
      origin: isAllowed ? origin : allowedOrigins[0] || "*",
      allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type"],
    })(c, next);
  }
);

// ─── Routes ────────────────────────────────────────────────────

// Health check
app.get("/health", (c) => {
  return c.json({ ok: true, time: new Date().toISOString() });
});

// Return VAPID public key
app.get("/api/vapid-public-key", (c) => {
  return c.json({ publicKey: c.env.VAPID_PUBLIC_KEY });
});

// Create or update a push schedule
app.post("/api/schedule", async (c) => {
  const { subscription, notifyAt, title, body } = await c.req.json();

  if (
    !subscription?.endpoint ||
    !subscription?.keys?.p256dh ||
    !subscription?.keys?.auth
  ) {
    return c.json({ error: "Invalid subscription object" }, 400);
  }
  if (!notifyAt) {
    return c.json({ error: "notifyAt is required" }, 400);
  }

  const notifyAtUnix = Math.floor(new Date(notifyAt).getTime() / 1000);
  if (isNaN(notifyAtUnix) || notifyAtUnix <= 0) {
    return c.json({ error: "Invalid notifyAt date" }, 400);
  }

  // Use a hash of the endpoint as stable ID (one schedule per device)
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(subscription.endpoint)
  );
  const hashArray = new Uint8Array(hashBuffer);
  let id = "";
  for (const b of hashArray) {
    id += b.toString(16).padStart(2, "0");
  }
  id = id.slice(0, 64);

  await c.env.DB.prepare(
    `INSERT OR REPLACE INTO push_schedules (id, endpoint, p256dh, auth, notify_at, title, body)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth,
      notifyAtUnix,
      title || "HerDay Reminder",
      body || "Time to check your cycle!"
    )
    .run();

  return c.json({
    ok: true,
    notifyAt: new Date(notifyAtUnix * 1000).toISOString(),
  });
});

// Remove a push schedule
app.delete("/api/schedule", async (c) => {
  const { endpoint } = await c.req.json();
  if (!endpoint) {
    return c.json({ error: "endpoint is required" }, 400);
  }
  await c.env.DB.prepare(
    "DELETE FROM push_schedules WHERE endpoint = ?"
  )
    .bind(endpoint)
    .run();
  return c.json({ ok: true });
});

// Check schedule status
app.post("/api/schedule/status", async (c) => {
  const { endpoint } = await c.req.json();
  if (!endpoint) {
    return c.json({ error: "endpoint is required" }, 400);
  }
  const row = await c.env.DB.prepare(
    "SELECT * FROM push_schedules WHERE endpoint = ? LIMIT 1"
  )
    .bind(endpoint)
    .first<ScheduleRow>();

  if (row) {
    return c.json({
      scheduled: true,
      notifyAt: new Date(row.notify_at * 1000).toISOString(),
      title: row.title,
      body: row.body,
    });
  }
  return c.json({ scheduled: false });
});

// ─── Cron Handler ──────────────────────────────────────────────

async function processDueNotifications(env: Env): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  const { results: dueRows } = await env.DB.prepare(
    "SELECT * FROM push_schedules WHERE notify_at <= ?"
  )
    .bind(now)
    .all<ScheduleRow>();

  if (!dueRows || dueRows.length === 0) return;

  console.log(`[cron] Processing ${dueRows.length} due notification(s)...`);

  const vapid = {
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
    email: env.VAPID_EMAIL,
  };

  for (const row of dueRows) {
    const subscription = {
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth },
    };

    try {
      const result = await sendPushNotification(
        subscription,
        { title: row.title, body: row.body, url: "/" },
        vapid
      );
      console.log(
        `[cron] Push to ${row.id.slice(0, 12)}...: ${result.status} ${result.message}`
      );
    } catch (err) {
      console.error(`[cron] Failed for ${row.id.slice(0, 12)}:`, err);
    }

    // Remove after attempting (one-shot notification)
    await env.DB.prepare("DELETE FROM push_schedules WHERE id = ?")
      .bind(row.id)
      .run();
  }
}

// ─── Export ────────────────────────────────────────────────────

export default {
  fetch: app.fetch,

  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(processDueNotifications(env));
  },
};
