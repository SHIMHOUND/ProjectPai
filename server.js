const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const expressSession = require('express-session');
const passport = require('passport');
const passportJson = require('passport-json');
const expressWs = require('express-ws');

const auth = require('./auth');
const websocket = require('./websocket');
const control = require('./control');
const person = require('./person');
const project = require('./project');
const {getTasks} = require("./project");

let config = {
    port: 8000,
    frontend: './pai2024-vue/dist',
    dbUrl: 'mongodb://localhost:27017/pai2024'
};

const app = express();

app.use(morgan('tiny'));
app.use(cors());
app.use(bodyParser.json());
app.use((err, req, res, next) => {
    res.status(400).json({ error: err.message });
});

app.use(express.static(config.frontend));

const session = expressSession({
    secret: config.dbUrl,
    resave: false,
    saveUninitialized: true
});
app.use(session);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportJson.Strategy(auth.checkCredentials));
passport.serializeUser(auth.serialize);
passport.deserializeUser(auth.deserialize);

const wsEndpoint = '/ws';
expressWs(app);
app.ws(wsEndpoint, (_ws, req, next) => session(req, {}, next), websocket.handle);

const authEndpoint = '/api/auth';
app.get(authEndpoint, auth.whoami);
app.post(authEndpoint,
    passport.authenticate('json', { failWithError: true }),
    auth.login,
    auth.errorHandler
);
app.delete(authEndpoint, auth.logout);

const whoEndpoint = '/api/control';
app.get(whoEndpoint + '/who', auth.checkIfInRole([0, 1]), control.whoGet);

// Person endpoints
app.get(person.endpoint, auth.checkIfInRole([0, 1]), person.get);
app.post(person.endpoint, auth.checkIfInRole([0]), person.post);
app.put(person.endpoint, auth.checkIfInRole([0]), person.put);
app.delete(person.endpoint, auth.checkIfInRole([0]), person.delete);


// Project endpoints
app.get(project.endpoint, auth.checkIfInRole([0, 1]), project.get);
app.post(project.endpoint, auth.checkIfInRole([0]), project.post);
app.put(project.endpoint, auth.checkIfInRole([0]), project.put);
app.delete(project.endpoint, auth.checkIfInRole([0]), project.delete);
app.put(`${project.endpoint}/tasks`, auth.checkIfInRole([0]), project.updateTasks, getTasks);

// Analysis endpoints
app.get('/api/analysis/projects', auth.checkIfInRole([0]), (req, res) => {
    project.model.find({}, 'name startDate endDate tasks')
        .then(data => {
            const processed = data.map(p => {
                const project = p.toObject();
                const now = new Date();

                if (!project.endDate || project.endDate > now) {
                    project.isActive = true;
                    project.endDate = project.endDate || now;
                }

                project.tasks = project.tasks?.map(t => {
                    const taskEnd = t.endDate || now;
                    if (!t.endDate || t.endDate > now) {
                        t.isActive = true;
                        t.endDate = taskEnd;
                    }
                    return t;
                }) || [];

                return project;
            });
            res.json(processed);
        })
        .catch(err => res.status(400).json({ error: err.message }));
});

app.get('/api/analysis/projects/:projectId/tasks', auth.checkIfInRole([0]), (req, res) => {
    project.model.findById(req.params.projectId, 'tasks')
        .then(data => {
            if (!data) return res.status(404).json({ error: 'Project not found' });

            const now = new Date();
            const processedTasks = data.tasks.map(t => ({
                ...t.toObject(),
                isActive: !t.endDate || t.endDate > now,
                endDate: t.endDate || now
            }));

            res.json(processedTasks);
        })
        .catch(err => res.status(400).json({ error: err.message }));
});

try {
    config = JSON.parse(fs.readFileSync('config.json'));
    console.log('Configuration loaded from config.json');
} catch(err) {
    console.log('Using default configuration');
}

console.log('Connecting to database...');
mongoose.connect(config.dbUrl)
    .then(conn => {
        console.log('Database connection established');
        auth.init(conn);
        person.init(conn);
        project.init(conn);

        app.listen(config.port, () => {
            console.log('Backend listening on port', config.port);
        });
    })
    .catch(err => {
        console.error('Database connection failed:', err.message);
        process.exit(0);
    });