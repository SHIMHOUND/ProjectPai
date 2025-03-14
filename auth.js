const crypto = require('crypto');
const mongoose = require('mongoose');
const uuid = require('uuid');

const schema = new mongoose.Schema({
    _id: { type: String, default: uuid.v4 },
    username: { type: String, required: true },
    password: { type: String, required: true },
    roles: { type: [Number] }
}, { versionKey: false });

const makeHash = password => crypto.createHash('sha256').update(password).digest('base64');

const getIntersection = (arr1, arr2) => {
    const set = new Set(arr2);
    return arr1.filter(item => set.has(item));
};

const auth = module.exports = {
    makeHash,
    User: null,

    init: conn => {
        auth.User = conn.model('user', schema);

        auth.User.findOne({ username: 'admin' })
            .then(user => {
                if (!user) {
                    new auth.User({
                        username: 'admin',
                        password: makeHash('admin'),
                        roles: [0]
                    }).save();
                }
            });

        auth.User.findOne({ username: 'user' })
            .then(user => {
                if (!user) {
                    new auth.User({
                        username: 'user',
                        password: makeHash('user'),
                        roles: [1]
                    }).save();
                }
            });
    },

    checkCredentials: (username, password, done) => {
        auth.User.findOne({ username, password: makeHash(password) })
            .then(user => done(null, user || false))
            .catch(() => done(null, false));
    },

    checkIfInRole: roles => (req, res, next) => {
        const intersection = getIntersection(roles || [], req.user?.roles || []);
        if (!req.isAuthenticated()) res.status(401).json({ error: 'Unauthorized' });
        else if (intersection.length) next();
        else res.status(403).json({ error: 'Permission denied' });
    },

    serialize: (user, done) => done(null, user.username),

    deserialize: (username, done) => {
        auth.User.findOne({ username })
            .then(user => user ? done(null, user) : done(new Error('User not found')))
            .catch(err => done(err));
    },

    login: (req, res) => auth.whoami(req, res),

    logout: (req, res) => req.logout(() => auth.whoami(req, res)),

    whoami: (req, res) => {
        req.session.roles = req.user?.roles || [];
        req.session.save();
        res.json({
            sessionid: req.session.id,
            ...(req.user && {
                username: req.user.username,
                roles: req.user.roles
            })
        });
    },

    errorHandler: (err, req, res) => res.status(401).json({ error: `Error [${err.message}]` })
};