# Proxy Server

A lightweight HTTP proxy server built with Express.js that forwards requests to any configurable target URL.

## Purpose

This proxy server acts as an intermediary between clients and target servers, enabling:

- **Cross-Origin Request Handling**: Bypasses CORS restrictions by serving as a same-origin endpoint
- **API Gateway Functionality**: Routes requests to different backend services through a single entry point
- **Development Testing**: Allows local development against remote APIs without CORS issues
- **Request Forwarding**: Transparently forwards all HTTP methods (GET, POST, PUT, DELETE) with original headers and body content

## Quick Setup

1. Install dependencies: `pnpm install`
2. Create `.env` file:
```env
PORT=1337
PROXY_URL=https://your-target-server.com
```
3. Start server: `node index.js`

## Usage

The server receives requests at `http://localhost:1337` and forwards them to the configured `PROXY_URL`. For example:

- Request to: `http://localhost:1337/api/users`
- Forwards to: `https://your-target-server.com/api/users`

All request data, headers, and methods are preserved during forwarding. The response from the target server is returned to the original client.

## Configuration

Set these environment variables in your `.env` file:
- `PORT`: Server port (default: 1337)
- `PROXY_URL`: Target server URL (required)
