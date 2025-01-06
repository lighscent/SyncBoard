const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Company = require('../models/Company');
const SysAdmin = require('../models/SysAdmin');

// Page de connexion principale
router.get("/login", (req, res) => {
    res.render("login", { error: null });
});

// Page de connexion admin
router.get("/admin/login", (req, res) => {
    res.render("admin-login", { error: null });
});

// Connexion utilisateur
router.post("/login/user", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.render("login", { error: "Email ou mot de passe incorrect" });
        }

        req.session.userId = user._id;
        res.redirect("/dashboard");
    } catch (error) {
        res.render("login", { error: "Une erreur est survenue" });
    }
});

// Connexion admin/entreprise
router.post("/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier si c'est un admin système
        const admin = await SysAdmin.findOne({ email });
        if (admin && await bcrypt.compare(password, admin.password)) {
            req.session.adminId = admin._id;
            return res.redirect("/admin");
        }

        res.render("admin-login", { error: "Email ou mot de passe incorrect" });
    } catch (error) {
        res.render("admin-login", { error: "Une erreur est survenue" });
    }
});

// Connexion entreprise
router.post("/login/admin", async (req, res) => {
    try {
        const { email, password } = req.body;

        const company = await Company.findOne({ email });
        if (company && await bcrypt.compare(password, company.password)) {
            req.session.companyId = company._id;
            req.session.isMainAccount = true;
            return res.redirect("/company");
        }

        // Vérifier si c'est un gérant
        const managerCompany = await Company.findOne({ 'managers.email': email });
        if (managerCompany) {
            const manager = managerCompany.managers.find(m => m.email === email);
            if (await bcrypt.compare(password, manager.password)) {
                req.session.companyId = managerCompany._id;
                req.session.managerId = manager.email;
                req.session.isMainAccount = false;
                return res.redirect("/company");
            }
        }

        res.render("login", { error: "Email ou mot de passe incorrect" });
    } catch (error) {
        res.render("login", { error: "Une erreur est survenue" });
    }
});

module.exports = router; 