const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');

const app = express();
const port = process.env.PORT || 3000;

// Statische Dateien ausliefern
app.use(express.static(path.join(__dirname)));

// Route für das Fahrzeug-Terminal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route für die Leitstellen-Steuerung
app.get('/control', (req, res) => {
    res.sendFile(path.join(__dirname, 'control.html'));
});

// HTTP-Server erstellen
const server = http.createServer(app);

// WebSocket-Server für Echtzeit-Synchronisation zwischen Geräten
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
    console.log('⚡ Neues Gerät (Terminal oder Steuerungskonsole) verbunden.');

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('📡 Übertragung empfangen:', message.type);

            // Nachricht an alle anderen verbundenen Geräte weiterleiten
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === ws.OPEN) {
                    client.send(JSON.stringify(message));
                }
            });
        } catch (err) {
            console.error('Fehler beim Verarbeiten der Nachricht:', err);
        }
    });

    ws.on('close', () => {
        console.log('Gerät getrennt.');
    });
});

server.listen(port, () => {
    console.log(`====================================================`);
    console.log(`🚀 Sim Data Terminal Server läuft auf Port ${port}`);
    console.log(`💻 Fahrzeug-Terminal:  http://localhost:${port}/`);
    console.log(`🎛️  Leitstellen-Pult:   http://localhost:${port}/control`);
    console.log(`====================================================`);
});