const SysAdmin = require('../models/SysAdmin');

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
        req.admin = admin;
        next();
    } catch (error) {
        res.redirect('/admin/login');
    }
};

module.exports = authSysAdmin; 