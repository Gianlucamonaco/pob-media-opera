import dgram from "dgram";
import WebSocket, { WebSocketServer } from "ws";

const UDP_PORTS = [8001];
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

    const [channel, key] = text.split(' ');

    if (channel && key) {
      data = {
        channel,
        key: toLowercaseFirstLetter(key),
        value: text.replace(`${channel} ${key} `, '').replaceAll('\x00', '').replaceAll(',', ''),
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

function toLowercaseFirstLetter(value) {
  return String(value).charAt(0).toLowerCase() + String(value).slice(1);
}
