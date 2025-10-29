import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createProxyMiddleware } from "http-proxy-middleware";

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

// create a route that proxies every request to the configured URL

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
    // Update the proxy middleware with the new URL
    updateProxyMiddleware(newUrl);
    res.send(`PROXY_URL updated to: ${PROXY_URL}`);
  } else {
    res.status(400).send("Invalid PROXY_URL");
  }
});

// Create proxy middleware with WebSocket support
let proxyMiddleware = createProxyMiddleware({
  target: PROXY_URL,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  logger: console,
  on: {
    error: (err, req, res, target) => {
      console.error("Proxy Error:", err.message);
      if (res && !res.headersSent) {
        res.status(500).json({ error: "Proxy server error", message: err.message });
      }
    },
    proxyReq: (proxyReq, req, res) => {
      console.log(`[HTTP] Proxying ${req.method} request to: ${proxyReq.path}`);
    },
    proxyReqWs: (proxyReq, req, socket, options, head) => {
      console.log(`[WebSocket] Proxying WebSocket connection to: ${proxyReq.path}`);
    },
    open: (proxySocket) => {
      console.log("[WebSocket] Connection opened");
    },
    close: (res, socket, head) => {
      console.log("[WebSocket] Connection closed");
    }
  }
});

// Function to update proxy middleware when PROXY_URL changes
function updateProxyMiddleware(newUrl) {
  proxyMiddleware = createProxyMiddleware({
    target: newUrl,
    changeOrigin: true,
    ws: true,
    logger: console,
    on: {
      error: (err, req, res, target) => {
        console.error("Proxy Error:", err.message);
        if (res && !res.headersSent) {
          res.status(500).json({ error: "Proxy server error", message: err.message });
        }
      },
      proxyReq: (proxyReq, req, res) => {
        console.log(`[HTTP] Proxying ${req.method} request to: ${proxyReq.path}`);
      },
      proxyReqWs: (proxyReq, req, socket, options, head) => {
        console.log(`[WebSocket] Proxying WebSocket connection to: ${proxyReq.path}`);
      },
      open: (proxySocket) => {
        console.log("[WebSocket] Connection opened");
      },
      close: (res, socket, head) => {
        console.log("[WebSocket] Connection closed");
      }
    }
  });
}

// Use the proxy middleware for all remaining routes
app.use((req, res, next) => {
  // Skip proxy for our management endpoints
  if (req.path === "/set-proxy" || req.path === "/get-proxy") {
    return next();
  }
  return proxyMiddleware(req, res, next);
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Proxying to: ${PROXY_URL}`);
  console.log(`WebSocket support: Enabled`);
});

// Enable WebSocket proxying by listening to the upgrade event
server.on('upgrade', (req, socket, head) => {
  console.log(`[WebSocket] Upgrade request received for: ${req.url}`);
  proxyMiddleware.upgrade(req, socket, head);
});
