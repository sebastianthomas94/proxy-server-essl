import express from "express";
import cors from "cors";
import dotenv from "dotenv";

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

const PROXY_URL = process.env.PROXY_URL;

if (!PROXY_URL) {
  console.error("Error: PROXY_URL is not defined in environment variables.");
  process.exit(1);
}

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
