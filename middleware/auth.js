const Company = require('../models/Company');
const SysAdmin = require('../models/SysAdmin');

// Middleware pour vérifier l'authentification de l'admin système
const authSysAdmin = async (req, res, next) => {
    if (!req.session.adminId) {
        return res.redirect('/admin/login');
    }
    try {
        const admin = await SysAdmin.findById(req.session.adminId);
        if (!admin) {
            req.session.destroy();
            return res.redirect('/admin/login');
        }
        next();
    } catch (error) {
        res.status(500).send("Erreur serveur");
    }
};

// Middleware pour vérifier l'authentification de l'entreprise
const authCompany = async (req, res, next) => {
    if (!req.session.companyId) {
        return res.redirect('/login');
    }
    try {
        const company = await Company.findById(req.session.companyId);
        if (!company) {
            req.session.destroy();
            return res.redirect('/login');
        }
        next();
    } catch (error) {
        res.status(500).send("Erreur serveur");
    }
};

module.exports = {
    authSysAdmin,
    authCompany
}; 