require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const SysAdmin = require('../models/SysAdmin');

const SALT_ROUNDS = 10;

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        try {
            const hashedPassword = await bcrypt.hash("aY`'!tX+Fg3<Tr;k)m.nBD", SALT_ROUNDS);
            const admin = await SysAdmin.create({
                email: "admin@syncboard.com",
                password: hashedPassword,
                role: "super_admin"
            });
            console.log('Admin créé avec succès:', admin);
        } catch (error) {
            console.error('Erreur lors de la création:', error);
        }
        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Erreur de connexion:', err);
    }); 