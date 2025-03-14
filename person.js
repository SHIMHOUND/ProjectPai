const uuid = require('uuid');
const mongoose = require('mongoose');
const project = require('./project');
const websocket = require('./websocket');

const schema = new mongoose.Schema({
    _id: { type: String, default: uuid.v4 },
    firstName: {
        type: String,
        required: true,
        validate: {
            validator: value => /^\p{L}/u.test(value),
            message: props => `${props.value} contains invalid characters`
        }
    },
    lastName: {
        type: String,
        required: true,
        validate: {
            validator: value => /^\p{L}/u.test(value),
            message: props => `${props.value} contains invalid characters`
        }
    },
    birthDate: {
        type: Date,
        required: true,
        validate: {
            validator: value => value <= new Date(),
            message: props => `${props.value} is not a valid birth date`
        },
        transform: value => value.toISOString().substr(0, 10)
    }
}, {
    versionKey: false,
    additionalProperties: false
});

const person = module.exports = {
    endpoint: '/api/person',
    model: null,

    init: conn => {
        person.model = conn.model('person', schema);
    },

    get: (req, res) => {
        let sort = {};
        if(req.query.sort) {
            sort[req.query.sort] = req.query.order === 'desc' ? -1 : 1;
        }

        const matching = {
            $match: {
                $or: [
                    { firstName: { $regex: req.query.search || '' }},
                    { lastName: { $regex: req.query.search || '' }}
                ]
            }
        };

        const aggregation = [matching];

        if(req.query.sort) aggregation.push({ $sort: sort });

        const skip = +req.query.skip || 0;
        if(skip > 0) aggregation.push({ $skip: skip });

        const limit = +req.query.limit || 0;
        if(limit > 0) aggregation.push({ $limit: limit });

        aggregation.push({
            $lookup: {
                from: 'projects',
                localField: '_id',
                foreignField: 'contractor_ids',
                as: 'projects'
            }
        });

        person.model.aggregate([{ $facet: {
                total: [ matching, { $count: 'count' } ],
                data: aggregation
            }}])
            .then(([facet]) => {
                facet.total = facet.total?.[0]?.count || 0;
                facet.data = facet.data.map(item => {
                    const newItem = new person.model(item).toObject();
                    newItem.projects = item.projects?.length || 0;
                    return newItem;
                });
                res.json(facet);
            })
            .catch(() => res.status(400).json({ error: 'Failed to read from database' }));
    },

    post: (req, res) => {
        if(!req.body) return res.status(400).json({ error: 'Missing data' });

        const item = new person.model(req.body);
        const error = item.validateSync();
        if(error) return res.status(400).json({ error: error.message });

        item.save()
            .then(savedItem => {
                const message = { type: 'PERSON_ADDED', data: savedItem };
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
        if(!req.body?._id) return res.status(400).json({ error: 'Missing update data' });

        const _id = req.body._id;
        delete req.body._id;

        person.model.findOneAndUpdate(
            { _id },
            { $set: req.body },
            { new: true, runValidators: true }
        )
            .then(updatedItem => {
                const message = { type: 'PERSON_UPDATED', data: updatedItem };
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
        if(!req.query._id) return res.status(400).json({ error: 'Missing deletion data' });

        const _id = req.query._id;
        project.model.updateMany(
            { contractor_ids: _id },
            { $pull: { contractor_ids: _id } }
        )
            .then(() => {
                person.model.findOneAndDelete({ _id })
                    .then(deletedItem => {
                        const message = { type: 'PERSON_DELETED', data: deletedItem };
                        Object.values(websocket.map).forEach(client => {
                            if (client.readyState === client.OPEN) {
                                client.send(JSON.stringify(message));
                            }
                        });
                        res.json(deletedItem);
                    })
                    .catch(err => res.status(400).json({ error: err.message }));
            })
            .catch(err => res.status(400).json({ error: err.message }));
    }
};