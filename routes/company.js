const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const User = require('../models/User');
const { authCompany } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const { transporter } = require('../utils/transporter');
const { generateSecurePassword } = require('../utils/passwordGenerator');

// Dashboard entreprise
router.get("/", authCompany, async (req, res) => {
    try {
        const company = await Company.findById(req.session.companyId);
        if (!company) {
            req.session.destroy();
            return res.redirect('/login');
        }

        const users = await User.find({ company: company._id })
            .select('name email role status lastLogin');

        res.render("company-panel", {
            company: {
                ...company.toObject(),
                createdAt: company.createdAt.toLocaleDateString('fr-FR'),
                status: company.status || 'actif',
                userCount: company.userCount || 0
            },
            users: users.map(user => ({
                ...user.toObject(),
                lastLogin: user.lastLogin ? user.lastLogin.toLocaleDateString('fr-FR') : 'Jamais',
                status: user.status || 'actif'
            })),
            isManager: req.session.managerId ? true : false,
            admin: {
                email: req.session.managerId || company.email,
                name: req.session.managerId ?
                    company.managers.find(m => m.email === req.session.managerId).name :
                    company.name
            }
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).send("Erreur serveur");
    }
});

// Gestion des utilisateurs
router.post("/users", authCompany, async (req, res) => {
    try {
        const { firstName, name, email, phone } = req.body;
        const company = await Company.findById(req.session.companyId);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Un utilisateur avec cet email existe déjà" });
        }

        const user = await User.create({
            firstName,
            name,
            email,
            phone,
            company: company._id,
            status: 'actif',
            createdAt: new Date()
        });

        company.userCount += 1;
        await company.save();

        res.json({ message: "Utilisateur ajouté avec succès", user });
    } catch (error) {
        res.status(500).json({ error: "Une erreur est survenue" });
    }
});

// Ajout d'un gérant d'entreprise
router.post("/managers", authCompany, async (req, res) => {
    try {
        const { firstName, name, email, phone } = req.body;
        const company = await Company.findById(req.session.companyId);

        // Vérifier si l'email est déjà utilisé
        const existingManager = company.managers.find(m => m.email === email);
        if (existingManager) {
            return res.status(400).json({ error: "Un gérant avec cet email existe déjà" });
        }

        // Générer un mot de passe sécurisé
        const password = generateSecurePassword();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Ajouter le gérant
        company.managers.push({
            firstName,
            name,
            email,
            phone,
            password: hashedPassword,
            createdAt: new Date()
        });

        await company.save();

        // Envoyer les identifiants par email
        await transporter.sendMail({
            from: `"SyncBoard" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Vos identifiants de gérant SyncBoard",
            html: `
                <h1>Bienvenue sur SyncBoard</h1>
                <p>Vous avez été désigné comme gérant pour l'entreprise ${company.name}.</p>
                <p>Voici vos identifiants de connexion :</p>
                <p><strong>Email :</strong> ${email}</p>
                <p><strong>Mot de passe :</strong> ${password}</p>
                <p>Pour vous connecter, rendez-vous sur : <a href="https://syncboard.aparis.pro/login">https://syncboard.aparis.pro/login</a></p>
                <p>Nous vous recommandons de changer ce mot de passe lors de votre première connexion.</p>
            `
        });

        res.json({ message: "Gérant ajouté avec succès" });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: "Une erreur est survenue lors de l'ajout du gérant" });
    }
});

// Modification du profil entreprise
router.put("/profile", authCompany, async (req, res) => {
    try {
        const { name, email } = req.body;
        const company = await Company.findById(req.session.companyId);

        if (email !== company.email) {
            const existingCompany = await Company.findOne({ email });
            if (existingCompany) {
                return res.status(400).json({ error: "Cet email est déjà utilisé" });
            }
        }

        company.name = name;
        company.email = email;
        await company.save();

        res.json({ message: "Profil mis à jour avec succès" });
    } catch (error) {
        res.status(500).json({ error: "Une erreur est survenue" });
    }
});

// Route pour afficher la liste des utilisateurs de l'entreprise
router.get("/users", authCompany, async (req, res) => {
    try {
        const company = await Company.findById(req.session.companyId);
        const users = await User.find({ company: req.session.companyId })
            .select('firstName name email phone createdAt status')
            .sort({ createdAt: -1 });

        res.render("company-users", {
            company,
            users
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).send("Erreur serveur");
    }
});

// Récupérer un utilisateur
router.get("/users/:id", authCompany, async (req, res) => {
    try {
        const user = await User.findOne({
            _id: req.params.id,
            company: req.session.companyId
        });

        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: "Une erreur est survenue" });
    }
});

// Modifier un utilisateur
router.put("/users/:id", authCompany, async (req, res) => {
    try {
        const { firstName, name, email, phone } = req.body;
        const user = await User.findOne({
            _id: req.params.id,
            company: req.session.companyId
        });

        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        // Vérifier si le nouvel email est déjà utilisé
        if (email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: "Un utilisateur avec cet email existe déjà" });
            }
        }

        user.firstName = firstName;
        user.name = name;
        user.email = email;
        user.phone = phone;

        await user.save();
        res.json({ message: "Utilisateur modifié avec succès" });
    } catch (error) {
        res.status(500).json({ error: "Une erreur est survenue" });
    }
});

// Supprimer un utilisateur
router.delete("/users/:id", authCompany, async (req, res) => {
    try {
        const user = await User.findOneAndDelete({
            _id: req.params.id,
            company: req.session.companyId
        });

        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        const company = await Company.findById(req.session.companyId);
        company.userCount -= 1;
        await company.save();

        res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ error: "Une erreur est survenue" });
    }
});

// Récupérer un gérant
router.get("/managers/:email", authCompany, async (req, res) => {
    try {
        const company = await Company.findById(req.session.companyId);
        const manager = company.managers.find(m => m.email === req.params.email);

        if (!manager) {
            return res.status(404).json({ error: "Gérant non trouvé" });
        }

        res.json({ manager });
    } catch (error) {
        res.status(500).json({ error: "Une erreur est survenue" });
    }
});

// Modifier un gérant
router.put("/managers/:email", authCompany, async (req, res) => {
    try {
        const company = await Company.findById(req.session.companyId);
        const managerIndex = company.managers.findIndex(m => m.email === req.params.email);

        if (managerIndex === -1) {
            return res.status(404).json({ error: "Gérant non trouvé" });
        }

        // Vérifier si le nouvel email est déjà utilisé
        if (req.body.email !== req.params.email) {
            const existingManager = company.managers.find(m => m.email === req.body.email);
            if (existingManager) {
                return res.status(400).json({ error: "Un gérant avec cet email existe déjà" });
            }
        }

        company.managers[managerIndex] = {
            ...company.managers[managerIndex].toObject(),
            ...req.body
        };

        await company.save();
        res.json({ message: "Gérant modifié avec succès" });
    } catch (error) {
        res.status(500).json({ error: "Une erreur est survenue" });
    }
});

// Supprimer un gérant
router.delete("/managers/:email", authCompany, async (req, res) => {
    try {
        const company = await Company.findById(req.session.companyId);
        const managerIndex = company.managers.findIndex(m => m.email === req.params.email);

        if (managerIndex === -1) {
            return res.status(404).json({ error: "Gérant non trouvé" });
        }

        company.managers.splice(managerIndex, 1);
        await company.save();

        res.json({ message: "Gérant supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ error: "Une erreur est survenue" });
    }
});

// Route pour afficher la liste des gérants de l'entreprise
router.get("/managers", authCompany, async (req, res) => {
    try {
        const company = await Company.findById(req.session.companyId);

        // Vérifier si l'utilisateur est le compte principal
        if (req.session.managerId) {
            return res.status(403).json({ error: "Accès non autorisé" });
        }

        const managers = company.managers.map(manager => ({
            ...manager.toObject(),
            createdAt: manager.createdAt.toLocaleDateString('fr-FR')
        }));

        res.render("company-users", {
            company,
            users: await User.find({ company: req.session.companyId })
                .select('firstName name email phone createdAt status')
                .sort({ createdAt: -1 }),
            managers: managers,
            isMainAccount: true
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).send("Erreur serveur");
    }
});

module.exports = router; 