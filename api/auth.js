const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticator } = require("otplib");

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || "finanzas-secret-2026";

async function kvGet(key) {
  const r = await fetch(`${KV_URL}/get/${key}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
  const d = await r.json();
  return d.result ? JSON.parse(d.result) : null;
}

async function kvSet(key, value) {
  await fetch(`${KV_URL}/set/${key}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(JSON.stringify(value))
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { action, username, password, totpCode } = req.body || {};

  if (action === "setup") {
    const existing = await kvGet("users");
    if (existing) return res.status(400).json({ error: "Ya existe un usuario configurado" });
    const hashed = await bcrypt.hash(password, 10);
    const totpSecret = authenticator.generateSecret();
    await kvSet("users", [{ username, password: hashed, totpSecret }]);
    const otpAuthUrl = authenticator.keyuri(username, "FinanzasApp", totpSecret);
    return res.json({ success: true, totpSecret, otpAuthUrl });
  }

  if (action === "login") {
    const users = await kvGet("users");
    if (!users) return res.status(401).json({ error: "No hay usuarios configurados" });
    const user = users.find(u => u.username === username);
    if (!user) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    const validTotp = authenticator.verify({ token: totpCode, secret: user.totpSecret });
    if (!validTotp) return res.status(401).json({ error: "Código de autenticador incorrecto" });
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ success: true, token, username });
  }

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

  if (action === "addUser") {
    const authHeader = req.headers.authorization;
    try { jwt.verify(authHeader?.replace("Bearer ", ""), JWT_SECRET); }
    catch { return res.status(401).json({ error: "No autorizado" }); }
    const users = await kvGet("users") || [];
    const hashed = await bcrypt.hash(password, 10);
    const totpSecret = authenticator.generateSecret();
    users.push({ username, password: hashed, totpSecret });
    await kvSet("users", users);
    const otpAuthUrl = authenticator.keyuri(username, "FinanzasApp", totpSecret);
    return res.json({ success: true, totpSecret, otpAuthUrl });
  }

  res.status(400).json({ error: "Acción inválida" });
};