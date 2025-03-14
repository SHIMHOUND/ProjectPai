const uuid = require('uuid');
const mongoose = require('mongoose');
const websocket = require('./websocket');

const taskSchema = new mongoose.Schema({
    _id: { type: String, default: uuid.v4 },
    name: { type: String, required: true },
    startDate: {
        type: Date,
        required: true,
        validate: {
            validator: value => value instanceof Date && !isNaN(value),
            message: 'Invalid start date'
        }
    },
    endDate: {
        type: Date,
        validate: {
            validator: value => !value || (value instanceof Date && !isNaN(value)),
            message: 'Invalid end date'
        }
    },
    assignedPeople: { type: [String], default: [] }
}, { _id: false });

const schema = new mongoose.Schema({
    _id: { type: String, default: uuid.v4 },
    name: {
        type: String,
        required: true,
        validate: {
            validator: value => /^\p{L}/u.test(value),
            message: props => `${props.value} contains invalid characters`
        }
    },
    startDate: {
        type: Date,
        required: true,
        validate: {
            validator: value => value instanceof Date && !isNaN(value),
            message: 'Invalid start date'
        },
        transform: value => value.toISOString().substring(0, 10)
    },
    endDate: {
        type: Date,
        validate: {
            validator: value => !value || (value instanceof Date && !isNaN(value)),
            message: 'Invalid end date'
        },
        transform: value => value?.toISOString().substring(0, 10)
    },
    contractor_ids: { type: [String], default: [] },
    tasks: { type: [taskSchema], default: [] }
}, {
    versionKey: false,
    additionalProperties: false
});

const project = module.exports = {
    endpoint: '/api/project',
    model: null,

    init: conn => {
        project.model = conn.model('project', schema);
    },

    getTasks: (req, res) => {
        project.model.findById(req.params.projectId)
            .then(data => {
                if (!data) return res.status(404).json({ error: 'Project not found' });
                res.json(data.tasks || []);
            })
            .catch(err => res.status(400).json({ error: err.message }));
    },

    get: (req, res) => {
        let sort = {};
        if (req.query.sort) {
            sort[req.query.sort] = req.query.order === 'desc' ? -1 : 1;
        }

        const matching = { $match: { name: { $regex: req.query.search || '' } } };
        const aggregation = [matching];

        if (req.query.sort) aggregation.push({ $sort: sort });

        const skip = +req.query.skip || 0;
        if (skip > 0) aggregation.push({ $skip: skip });

        const limit = +req.query.limit || 0;
        if (limit > 0) aggregation.push({ $limit: limit });

        aggregation.push({
            $lookup: {
                from: 'people',
                localField: 'contractor_ids',
                foreignField: '_id',
                as: 'contractors'
            }
        });

        project.model.aggregate([{ $facet: {
                total: [matching, { $count: 'count' }],
                data: aggregation
            }}])
            .then(([result]) => {
                result.total = result.total?.[0]?.count || 0;
                result.data = result.data.map(item => {
                    const newItem = new project.model(item).toObject();
                    newItem.contractors = item.contractors?.map(c =>
                        `${c.firstName?.charAt(0)}${c.lastName?.charAt(0)}`
                    ) || [];
                    return newItem;
                });
                res.json(result);
            })
            .catch(() => res.status(400).json({ error: 'Database read failed' }));
    },

    post: (req, res) => {
        if (!req.body) return res.status(400).json({ error: 'Missing data' });

        const item = new project.model(req.body);
        const error = item.validateSync();
        if (error) return res.status(400).json({ error: error.message });

        item.save()
            .then(savedItem => {
                const message = { type: 'PROJECT_ADDED', data: savedItem };
                Object.values(websocket.map).forEach(client => {
                    if (client.readyState === client.OPEN) {
                        client.send(JSON.stringify(message));
                    }
                });
                res.json(savedItem);
            })
            .catch(err => res.status(400).json({ error: err.message }));
    },

    put: (req, res) => {
        if (!req.body?._id) return res.status(400).json({ error: 'Missing update data' });

        const _id = req.body._id;
        delete req.body._id;

        project.model.findOneAndUpdate(
            { _id },
            { $set: req.body },
            { new: true, runValidators: true }
        )
            .then(updatedItem => {
                const message = { type: 'PROJECT_UPDATED', data: updatedItem };
                Object.values(websocket.map).forEach(client => {
                    if (client.readyState === client.OPEN) {
                        client.send(JSON.stringify(message));
                    }
                });
                res.json(updatedItem);
            })
            .catch(err => res.status(400).json({ error: err.message }));
    },

    delete: (req, res) => {
        if (!req.query._id) return res.status(400).json({ error: 'Missing deletion data' });

        project.model.findOneAndDelete({ _id: req.query._id })
            .then(deletedItem => {
                const message = { type: 'PROJECT_DELETED', data: deletedItem };
                Object.values(websocket.map).forEach(client => {
                    if (client.readyState === client.OPEN) {
                        client.send(JSON.stringify(message));
                    }
                });
                res.json(deletedItem);
            })
            .catch(err => res.status(400).json({ error: err.message }));
    },

    updateTasks: (req, res) => {
        if (!req.body?._id || !req.body.tasks) return res.status(400).json({ error: 'Missing task data' });

        const _id = req.body._id;
        const tasks = req.body.tasks;

        project.model.findOneAndUpdate(
            { _id },
            { $set: { tasks } },
            { new: true, runValidators: true }
        )
            .then(updatedProject => {
                const message = { type: 'TASKS_UPDATED', data: updatedProject };
                Object.values(websocket.map).forEach(client => {
                    if (client.readyState === client.OPEN) {
                        client.send(JSON.stringify(message));
                    }
                });
                res.json(updatedProject);
            })
            .catch(err => res.status(400).json({ error: err.message }));
    }
};