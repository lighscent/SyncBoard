const mongoose = require('mongoose');

const sysAdminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'admin',
        enum: ['admin', 'super_admin']
    },
    lastLogin: {
        type: Date
    }
});

module.exports = mongoose.model('SysAdmin', sysAdminSchema); 