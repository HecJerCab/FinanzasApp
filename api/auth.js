const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || "finanzas-secret-2026";
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "").split(",").map(e => e.trim().toLowerCase());

// Rate limiting en memoria
const attempts = {};
const blocked = {};

function getIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "unknown";
}

function checkRateLimit(ip) {
  const now = Date.now();
  if (blocked[ip] && blocked[ip] > now) {
    const minutos = Math.ceil((blocked[ip] - now) / 60000);
    throw new Error(`IP bloqueada. Intentá de nuevo en ${minutos} minutos.`);
  }
  if (blocked[ip] && blocked[ip] <= now) {
    delete blocked[ip];
    delete attempts[ip];
  }
}

function registerFailedAttempt(ip) {
  const now = Date.now();
  if (!attempts[ip]) attempts[ip] = { count: 0, first: now };
  // Reset si pasaron más de 15 minutos
  if (now - attempts[ip].first > 15 * 60 * 1000) {
    attempts[ip] = { count: 0, first: now };
  }
  attempts[ip].count++;
  if (attempts[ip].count >= 5) {
    blocked[ip] = now + 60 * 60 * 1000; // bloqueo 1 hora
    delete attempts[ip];
  }
}

function clearAttempts(ip) {
  delete attempts[ip];
  delete blocked[ip];
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const ip = getIP(req);

  try {
    const { action, credential, redirectUri } = req.body || {};

    // ── VERIFICAR TOKEN EXISTENTE ─────────────────────────────────────────
    if (action === "verify") {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Sin token" });
      try {
        const decoded = jwt.verify(authHeader.replace("Bearer ", ""), JWT_SECRET);
        return res.json({ success: true, username: decoded.username });
      } catch {
        return res.status(401).json({ error: "Token inválido o expirado" });
      }
    }

    // ── LOGIN CON GOOGLE ──────────────────────────────────────────────────
    if (action === "googleLogin") {
      // Verificar rate limit
      try { checkRateLimit(ip); } catch(e) {
        return res.status(429).json({ error: e.message });
      }

      const client = new OAuth2Client(CLIENT_ID);
      let email;

      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        email = payload.email?.toLowerCase();
      } catch {
        registerFailedAttempt(ip);
        return res.status(401).json({ error: "Token de Google inválido" });
      }

      // Verificar si el email está permitido
      if (!ALLOWED_EMAILS.includes(email)) {
        registerFailedAttempt(ip);
        const att = attempts[ip]?.count || 0;
        const restantes = Math.max(0, 5 - att);
        return res.status(403).json({ 
          error: `Acceso denegado. Este email no está autorizado.${restantes > 0 ? ` Te quedan ${restantes} intentos.` : ""}` 
        });
      }

      // Login exitoso
      clearAttempts(ip);
      const token = jwt.sign({ username: email }, JWT_SECRET, { expiresIn: "7d" });
      return res.json({ success: true, token, username: email });
    }

    res.status(400).json({ error: "Acción inválida" });

  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};