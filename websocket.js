const websocketMap = {};

module.exports = {
    map: websocketMap,

    handle: (ws, req) => {
        ws.sessionID = req.sessionID;
        websocketMap[req.sessionID] = ws;

        // Обработка ошибок WebSocket
        ws.on('error', (err) => {
            console.error('WebSocket error:', err.message);
            delete websocketMap[ws.sessionID];
        });

        ws.on('message', rawData => {
            let data = {};
            try {
                data = JSON.parse(rawData);
            } catch (err) {
                console.error(err.message, rawData);
                return;
            }

            if (data.type === 'PROJECT_UPDATED' || data.type === 'TASKS_UPDATED') {
                Object.values(websocketMap).forEach(client => {
                    if (client.readyState === client.OPEN) {
                        client.send(JSON.stringify(data));
                    }
                });
            }
        });

        ws.on('close', () => {
            delete websocketMap[ws.sessionID];
        });
    }
};