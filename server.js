const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

// Statische Dateien ausliefern
app.use(express.static(__dirname));

// WebSocket Server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    // Robuste URL-Auflösung (verhindert Absturz bei Proxy-Headern)
    let room = 'SIM1';
    try {
        const parsedUrl = new URL(req.url, 'http://localhost');
        room = (parsedUrl.searchParams.get('room') || 'SIM1').toUpperCase();
    } catch (e) {
        room = 'SIM1';
    }

    ws.room = room;
    ws.isAlive = true;

    // Pong-Antwort registrieren
    ws.on('pong', () => { ws.isAlive = true; });

    // Fehler abfangen (verhindert Node.js Crash bei plötzlichem iPad-Standby)
    ws.on('error', (err) => {
        console.warn(`[WS Error in Raum ${room}]:`, err.message);
    });

    ws.on('message', (message) => {
        try {
            const messageString = message.toString('utf-8');
            // Nur an Clients im selben Raum weiterleiten
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN && client.room === room) {
                    client.send(messageString);
                }
            });
        } catch (err) {
            console.error('Fehler beim Weiterleiten:', err);
        }
    });

    console.log(`Client verbunden in Raum [${room}]. Aktive Clients: ${wss.clients.size}`);
});

// Ping-Intervall gegen den aggressiven iOS-Ruhezustand
const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        try { ws.ping(); } catch (e) {}
    });
}, 15000);

wss.on('close', () => clearInterval(pingInterval));

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft auf Port ${PORT}`);
});