export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,Notion-Version");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { path } = req.query;
  const url = `https://api.notion.com/v1/${Array.isArray(path) ? path.join("/") : path || ""}`;

  const response = await fetch(url, {
    method: req.method,
    headers: {
      "Authorization": req.headers.authorization,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
  });

  const data = await response.json();
  res.status(response.status).json(data);
}