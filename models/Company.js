const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
    firstName: String,
    name: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: String,
    password: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const companySchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    status: {
        type: String,
        default: 'actif'
    },
    userCount: {
        type: Number,
        default: 0
    },
    managers: [managerSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Company', companySchema); 