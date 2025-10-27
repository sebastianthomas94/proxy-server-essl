import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 1337;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  express.text({ type: ["text/plain", "text/html", "*/*"], limit: "10mb" })
);

// create a rout that proxies every request to google.com

let PROXY_URL = process.env.PROXY_URL;

if (!PROXY_URL) {
  console.error("Error: PROXY_URL is not defined in environment variables.");
  process.exit(1);
}

app.get("/set-proxy", (req, res) => {
  res.sendFile(path.join(__dirname, "set-proxy-form.html"));
});

app.get("/get-proxy", (req, res) => {
  res.json({ proxyUrl: PROXY_URL });
});

app.post("/set-proxy", (req, res) => {
  const newUrl = req.body.proxyUrl;
  if (newUrl) {
    PROXY_URL = newUrl;
    res.send(`PROXY_URL updated to: ${PROXY_URL}`);
  } else {
    res.status(400).send("Invalid PROXY_URL");
  }
});

app.use(async (req, res) => {
  try {
    const url = `${PROXY_URL}${req.originalUrl}`;
    console.log(`Proxying request to: ${url}`);

    const response = await fetch(url, {
      method: req.method,
      headers: { ...req.headers, host: new URL(PROXY_URL).host },
      body:
        req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    });

    const data = await response.text();
    console.log(`Response from proxy: ${data}`);
    res.status(response.status).send(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
