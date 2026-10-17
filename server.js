const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Statische HTML/JS/CSS Dateien aus dem Projektordner ausliefern
app.use(express.static(__dirname));

// WebSocket-Server mit Raum-Logik
wss.on('connection', (ws, req) => {
    // Raum aus der URL abfragen (Standard: SIM1)
    const url = new URL(req.url, `http://${req.headers.host}`);
    const room = url.searchParams.get('room') || 'SIM1';
    
    ws.room = room; // Raum auf dem Client-Objekt speichern
    console.log(`📡 Neuer Client verbunden in Raum: ${room}`);

    ws.on('message', (message) => {
        // Nachricht NUR an Clients im selben Raum weiterleiten
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN && client.room === room) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log(`🔌 Client aus Raum ${room} getrennt.`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server läuft auf Port ${PORT}`);
});