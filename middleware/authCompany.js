const Company = require('../models/Company');

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

        if (req.session.managerId) {
            const manager = company.managers.find(m => m.email === req.session.managerId);
            if (!manager) {
                req.session.destroy();
                return res.redirect('/login');
            }
        }

        next();
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        req.session.destroy();
        res.redirect('/login');
    }
};

module.exports = authCompany; 