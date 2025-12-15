import dgram from "dgram";
import WebSocket, { WebSocketServer } from "ws";

const UDP_PORTS = [8001, 8002, 8003, 8004];
const WS_PORT = 8080;

const wss = new WebSocketServer({ port: WS_PORT });
wss.on("connection", () => console.log("Web client connected"));

// Create one UDP socket per port
UDP_PORTS.forEach(port => {
  const udp = dgram.createSocket("udp4");
  udp.on("message", (msg) => {
    const text = msg.toString().trim();
    console.log("UDP:", text);

    // Simple parsing if needed
    let data = { raw: text };

    const match = text.split(' ');

    if (match.length) {
      data = {
        port,
        channel: Number(match[0].replace('channel_', '')),
        loudness: match[1] ? Number(match[1].replaceAll('\x00', '').replaceAll(',', '')) : 0,
        pitch: match[2] ? Number(match[2].replaceAll('\x00', '').replaceAll(',', '')) : 0,
        centroid: 0,
        flatness: 0,
        onset: 0,
      };
    }
    // Broadcast JSON to browser
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });
  udp.bind(port);
});

console.log(`Listening for UDP on ${UDP_PORTS.join(", ")}, WebSocket on ${WS_PORT}`);
