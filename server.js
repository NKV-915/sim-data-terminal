const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname));

// WebSocket-Server mit UTF-8 Zwang und Raum-Logik
wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const room = (url.searchParams.get('room') || 'SIM1').toUpperCase();
    
    ws.room = room;
    ws.isAlive = true;

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (data) => {
        // Zwingend als UTF-8 String übertragen (verhindert Safari Blob-Fehler)
        const messageString = data.toString('utf-8');

        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN && client.room === room) {
                client.send(messageString);
            }
        });
    });
});

// Keep-Alive Ping-Intervall gegen Standby-Trennung bei iOS
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 20000);

wss.on('close', () => clearInterval(interval));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Sim-Server aktiv auf Port ${PORT}`);
});