const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();
const session = require('express-session');

// Import des routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const companyRoutes = require('./routes/company');

const app = express();

// Configuration d'Express
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'zC<T[+`%;=E~qapV"A5^K,LU"rB4Rx_f>{h:w39HQjmtb6M}*8',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
    }
}));

// État de la base de données
let dbStatus = {
    connected: false,
    error: null
};

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        dbStatus.connected = true;
    })
    .catch((err) => {
        dbStatus.error = err.message;
    });

// Routes publiques
app.get("/", (req, res) => {
    res.render("index", { dbStatus });
});

app.get("/contact", (req, res) => {
    res.render("contact");
});

app.post("/contact", (req, res) => {
    res.redirect("/contact?success=true");
});

// Utilisation des routes modulaires
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/company', companyRoutes);

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).render('404');
});

// Démarrage du serveur
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});

module.exports = app;