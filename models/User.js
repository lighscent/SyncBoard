const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    role: {
        type: String,
        enum: ['user', 'manager', 'admin'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['actif', 'inactif'],
        default: 'actif'
    },
    lastLogin: Date
}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema); 