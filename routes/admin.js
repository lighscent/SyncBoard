const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Company = require('../models/Company');
const User = require('../models/User');
const authSysAdmin = require('../middleware/authSysAdmin');
const nodemailer = require('nodemailer');
const { generateSecurePassword } = require('../utils/passwordGenerator');

// Dashboard admin
router.get("/", authSysAdmin, async (req, res) => {
    try {
        const companies = await Company.find().select('name email createdAt status userCount managers');
        res.render("admin-panel", {
            companies: companies.map(company => ({
                ...company.toObject(),
                createdAt: company.createdAt.toLocaleDateString('fr-FR'),
                status: company.status || 'actif',
                userCount: company.userCount || 0,
                managers: company.managers || []
            })),
            admin: req.admin
        });
    } catch (error) {
        res.status(500).send("Erreur serveur");
    }
});

// Gestion des entreprises
router.post("/companies", authSysAdmin, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingCompany = await Company.findOne({ email });
        if (existingCompany) {
            return res.status(400).json({ error: "Une entreprise avec cet email existe déjà" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await Company.create({
            name,
            email,
            password: hashedPassword,
            status: 'actif',
            userCount: 0,
            createdAt: new Date()
        });

        res.redirect("/admin");
    } catch (error) {
        res.status(500).json({ error: "Une erreur est survenue lors de la création de l'entreprise" });
    }
});

// Gestion des gérants
router.get("/companies/:id/managers", authSysAdmin, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ error: "Entreprise non trouvée" });
        }
        res.json({ managers: company.managers || [] });
    } catch (error) {
        res.status(500).json({ error: "Une erreur est survenue" });
    }
});

// Ajout d'un gérant
router.post("/companies/:id/managers", authSysAdmin, async (req, res) => {
    try {
        const { firstName, name, email, phone } = req.body;
        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ error: "Entreprise non trouvée" });
        }

        // Vérifier si l'email est déjà utilisé
        const existingManager = company.managers.find(m => m.email === email);
        if (existingManager) {
            return res.status(400).json({ error: "Un gérant avec cet email existe déjà" });
        }

        // Générer un mot de passe sécurisé
        const password = generateSecurePassword();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Ajouter le gérant avec tous les champs
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
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: { rejectUnauthorized: false }
        });

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

        res.json({
            message: "Gérant ajouté avec succès",
            manager: {
                firstName,
                name,
                email,
                phone,
                createdAt: new Date()
            }
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: "Une erreur est survenue lors de l'ajout du gérant" });
    }
});

// Réinitialisation des identifiants d'une entreprise
router.post("/companies/:id/credentials", authSysAdmin, async (req, res) => {
    try {
        const { password } = req.body;
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ error: "Entreprise non trouvée" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        company.password = hashedPassword;
        await company.save();

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: { rejectUnauthorized: false }
        });

        await transporter.sendMail({
            from: `"SyncBoard" <${process.env.SMTP_USER}>`,
            to: company.email,
            subject: "Vos nouveaux identifiants de connexion",
            html: `
                <h1>Nouveaux identifiants de connexion</h1>
                <p>Voici vos nouveaux identifiants de connexion :</p>
                <p><strong>Email :</strong> ${company.email}</p>
                <p><strong>Mot de passe :</strong> ${password}</p>
                <p>Pour vous connecter, rendez-vous sur : <a href="https://syncboard.aparis.pro/login">https://syncboard.aparis.pro/login</a></p>
                <p>Nous vous recommandons de changer ce mot de passe lors de votre prochaine connexion.</p>
            `
        });

        res.json({ message: "Identifiants envoyés avec succès" });
    } catch (error) {
        res.status(500).json({ error: "Une erreur est survenue" });
    }
});

// Réinitialisation du mot de passe d'un gérant
router.post("/companies/:id/managers/:email/reset-password", authSysAdmin, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ error: "Entreprise non trouvée" });
        }

        const manager = company.managers.find(m => m.email === req.params.email);
        if (!manager) {
            return res.status(404).json({ error: "Gérant non trouvé" });
        }

        const newPassword = generateSecurePassword();
        manager.password = await bcrypt.hash(newPassword, 10);
        await company.save();

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: { rejectUnauthorized: false }
        });

        await transporter.sendMail({
            from: `"SyncBoard" <${process.env.SMTP_USER}>`,
            to: manager.email,
            subject: "Vos nouveaux identifiants de connexion",
            html: `
                <h1>Nouveaux identifiants de connexion</h1>
                <p>Vos identifiants de gérant ont été réinitialisés :</p>
                <p><strong>Email :</strong> ${manager.email}</p>
                <p><strong>Mot de passe :</strong> ${newPassword}</p>
                <p>Pour vous connecter, rendez-vous sur : <a href="https://syncboard.aparis.pro/login">https://syncboard.aparis.pro/login</a></p>
                <p>Nous vous recommandons de changer ce mot de passe lors de votre prochaine connexion.</p>
            `
        });

        res.json({ message: "Mot de passe réinitialisé avec succès" });
    } catch (error) {
        res.status(500).json({ error: "Une erreur est survenue" });
    }
});

// Suppression d'un gérant
router.delete("/companies/:id/managers/:email", authSysAdmin, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ error: "Entreprise non trouvée" });
        }

        company.managers = company.managers.filter(m => m.email !== req.params.email);
        await company.save();

        res.json({ message: "Gérant supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ error: "Une erreur est survenue" });
    }
});

// Liste de tous les gérants
router.get("/managers", authSysAdmin, async (req, res) => {
    try {
        const companies = await Company.find().select('name managers');
        const allManagers = companies.reduce((acc, company) => {
            return acc.concat(company.managers.map(manager => ({
                ...manager.toObject(),
                companyName: company.name,
                companyId: company._id
            })));
        }, []);

        res.render("admin-managers", {
            managers: allManagers.map(manager => ({
                ...manager,
                createdAt: manager.createdAt.toLocaleDateString('fr-FR')
            }))
        });
    } catch (error) {
        res.status(500).send("Erreur serveur");
    }
});

// Récupérer les informations d'un gérant
router.get("/companies/:id/managers/:email", authSysAdmin, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ error: "Entreprise non trouvée" });
        }

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
router.put("/companies/:id/managers/:email", authSysAdmin, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ error: "Entreprise non trouvée" });
        }

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

        // Mettre à jour les informations
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

// Route pour afficher la liste des utilisateurs
router.get("/users", authSysAdmin, async (req, res) => {
    try {
        const users = await User.find()
            .populate('company', 'name')
            .select('name email company createdAt status')
            .lean();

        const formattedUsers = users.map(user => ({
            ...user,
            companyName: user.company ? user.company.name : 'N/A',
            createdAt: new Date(user.createdAt).toLocaleDateString('fr-FR'),
            status: user.status || 'actif'
        }));

        res.render("admin-users", {
            users: formattedUsers
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).send("Erreur serveur");
    }
});

module.exports = router; 