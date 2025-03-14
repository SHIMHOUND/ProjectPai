const auth = require('./auth');
const websocket = require('./websocket');

module.exports = {
    whoGet: (req, res) => {
        auth.User.find()
            .then(usersFromDB => {
                const users = {};
                usersFromDB.forEach(user => {
                    users[user.username] = { sessions: 0, websocket: false };
                });

                req.sessionStore.all((err, sessions) => {
                    if (err) {
                        return res.status(500).json({ error: 'Session retrieval failed' });
                    }

                    for (const sessionID in sessions) {
                        const session = sessions[sessionID];
                        if (session.passport?.user) {
                            const username = session.passport.user;
                            if (users[username]) {
                                users[username].sessions += 1;
                                users[username].websocket = !!websocket.map[sessionID];
                            }
                        }
                    }
                    res.json(users);
                });
            })
            .catch(err => res.status(400).json({ error: err.message }));
    }
};