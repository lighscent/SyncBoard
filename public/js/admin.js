const { generateSecurePassword } = require('../utils/passwordGenerator');

function openModal() {
    const modal = document.getElementById('companyModal');
    const passwordInput = document.getElementById('companyPassword');
    passwordInput.value = generateSecurePassword();
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('companyModal').style.display = 'none';
}

function copyPassword() {
    const passwordInput = document.getElementById('companyPassword');
    passwordInput.select();
    document.execCommand('copy');

    // Feedback visuel
    const copyBtn = document.querySelector('.copy-btn');
    const originalIcon = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
        copyBtn.innerHTML = originalIcon;
    }, 2000);
}

function toggleActions(companyId) {
    const dropdown = document.getElementById(`actions-${companyId}`);
    dropdown.classList.toggle('show');

    // Ferme les autres dropdowns
    document.querySelectorAll('.actions-content').forEach(content => {
        if (content.id !== `actions-${companyId}` && content.classList.contains('show')) {
            content.classList.remove('show');
        }
    });
}

// Ferme le dropdown si on clique ailleurs
window.onclick = function (event) {
    if (!event.target.matches('.actions-btn') && !event.target.matches('.fa-ellipsis-v')) {
        document.querySelectorAll('.actions-content').forEach(content => {
            if (content.classList.contains('show')) {
                content.classList.remove('show');
            }
        });
    }
}

function editCompany(companyId) {
    // Fermer le menu d'actions s'il est ouvert
    const dropdown = document.getElementById(`actions-${companyId}`);
    if (dropdown) {
        dropdown.classList.remove('show');
    }

    // Récupérer les données de l'entreprise
    fetch(`/admin/companies/${companyId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur réseau');
            }
            return response.json();
        })
        .then(company => {
            // Créer et afficher le modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'editCompanyModal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h2>Modifier l'entreprise</h2>
                    <form id="editCompanyForm">
                        <div class="form-group">
                            <label for="editCompanyName">Nom de l'entreprise</label>
                            <input type="text" id="editCompanyName" name="name" value="${company.name}" required />
                        </div>
                        <div class="form-group">
                            <label for="editCompanyEmail">Email professionnel</label>
                            <input type="email" id="editCompanyEmail" name="email" value="${company.email}" required />
                        </div>
                        <div class="modal-buttons">
                            <button type="submit" class="btn-primary">Modifier</button>
                            <button type="button" onclick="closeEditModal()" class="btn-secondary">Annuler</button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);
            modal.style.display = 'block';

            document.getElementById('editCompanyForm').onsubmit = function (e) {
                e.preventDefault();

                const formData = {
                    name: document.getElementById('editCompanyName').value,
                    email: document.getElementById('editCompanyEmail').value
                };

                fetch(`/admin/companies/${companyId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            alert(data.error);
                        } else {
                            window.location.reload();
                        }
                    })
                    .catch(error => {
                        console.error('Erreur:', error);
                        alert("Une erreur est survenue lors de la modification");
                    });
            };
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert("Une erreur est survenue lors de la récupération des données");
        });
}

function closeEditModal() {
    const modal = document.getElementById('editCompanyModal');
    if (modal) {
        modal.style.display = 'none';
        modal.remove();
    }
}

function sendCredentials(companyId) {
    // Fermer le menu d'actions
    const dropdown = document.getElementById(`actions-${companyId}`);
    if (dropdown) {
        dropdown.classList.remove('show');
    }

    // Afficher le popup de confirmation
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal';
    confirmModal.id = 'confirmCredentialsModal';
    confirmModal.innerHTML = `
        <div class="modal-content">
            <h2>Réinitialisation des identifiants</h2>
            <p>Cette action va :</p>
            <ul>
                <li>Générer un nouveau mot de passe</li>
                <li>Envoyer les nouveaux identifiants par email</li>
                <li>Déconnecter tous les utilisateurs actuels</li>
            </ul>
            <p>Êtes-vous sûr de vouloir continuer ?</p>
            <div class="modal-buttons">
                <button onclick="confirmSendCredentials('${companyId}')" class="btn-primary">Confirmer</button>
                <button onclick="closeConfirmModal()" class="btn-secondary">Annuler</button>
            </div>
        </div>
    `;

    document.body.appendChild(confirmModal);
    confirmModal.style.display = 'block';
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmCredentialsModal');
    if (modal) {
        modal.style.display = 'none';
        modal.remove();
    }
}

function confirmSendCredentials(companyId) {
    if (!companyId) {
        console.error('ID de l\'entreprise manquant');
        alert("Une erreur est survenue : ID de l'entreprise manquant");
        return;
    }

    const newPassword = generateSecurePassword();

    fetch(`/admin/companies/${companyId}/credentials`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: newPassword })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur réseau');
            }
            return response.json();
        })
        .then(data => {
            closeConfirmModal();
            if (data.error) {
                alert(data.error);
            } else {
                alert("Les identifiants ont été réinitialisés et envoyés avec succès");
                window.location.reload();
            }
        })
        .catch(error => {
            closeConfirmModal();
            console.error('Erreur:', error);
            alert("Une erreur est survenue lors de l'envoi des identifiants");
        });
}

let currentCompanyId = null;

function addManager(companyId) {
    currentCompanyId = companyId;
    const modal = document.getElementById('managerModal');
    modal.style.display = 'block';
}

function closeManagerModal() {
    const modal = document.getElementById('managerModal');
    modal.style.display = 'none';
    document.getElementById('addManagerForm').reset();
}

document.getElementById('addManagerForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = {
        firstName: document.getElementById('managerFirstName').value,
        name: document.getElementById('managerName').value,
        email: document.getElementById('managerEmail').value,
        phone: document.getElementById('managerPhone').value
    };

    fetch(`/admin/companies/${currentCompanyId}/managers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert('Gérant ajouté avec succès');
                closeManagerModal();
                window.location.reload();
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert("Une erreur est survenue lors de l'ajout du gérant");
        });
});

function showManagers(companyId) {
    // Fermer le menu d'actions
    const dropdown = document.getElementById(`actions-${companyId}`);
    if (dropdown) {
        dropdown.classList.remove('show');
    }

    fetch(`/admin/companies/${companyId}/managers`)
        .then(response => response.json())
        .then(data => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'managersListModal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h2>Gérants de l'entreprise</h2>
                    <div class="managers-list">
                        ${data.managers.length === 0 ?
                    '<p>Aucun gérant pour le moment</p>' :
                    `<table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Nom</th>
                                        <th>Email</th>
                                        <th>Date d'ajout</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.managers.map(manager => `
                                        <tr>
                                            <td>${manager.name}</td>
                                            <td>${manager.email}</td>
                                            <td>${new Date(manager.createdAt).toLocaleDateString('fr-FR')}</td>
                                            <td>
                                                <button onclick="resetManagerPassword('${companyId}', '${manager.email}')" class="btn-secondary">
                                                    <i class="fas fa-key"></i>
                                                </button>
                                                <button onclick="removeManager('${companyId}', '${manager.email}')" class="btn-danger">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>`
                }
                    </div>
                    <div class="modal-buttons">
                        <button onclick="addManager('${companyId}')" class="btn-primary">
                            <i class="fas fa-user-plus"></i>
                            Ajouter un gérant
                        </button>
                        <button onclick="closeManagersListModal()" class="btn-secondary">Fermer</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            modal.style.display = 'block';
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert("Une erreur est survenue lors de la récupération des gérants");
        });
}

function closeManagersListModal() {
    const modal = document.getElementById('managersListModal');
    if (modal) {
        modal.style.display = 'none';
        modal.remove();
    }
}

function resetManagerPassword(companyId, managerEmail) {
    if (confirm("Êtes-vous sûr de vouloir réinitialiser le mot de passe de ce gérant ?")) {
        fetch(`/admin/companies/${companyId}/managers/${encodeURIComponent(managerEmail)}/reset-password`, {
            method: 'POST'
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    alert("Le mot de passe a été réinitialisé et envoyé par email");
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                alert("Une erreur est survenue lors de la réinitialisation du mot de passe");
            });
    }
}

function removeManager(companyId, managerEmail) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce gérant ?")) {
        fetch(`/admin/companies/${companyId}/managers/${encodeURIComponent(managerEmail)}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    alert("Le gérant a été supprimé avec succès");
                    showManagers(companyId); // Rafraîchir la liste
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                alert("Une erreur est survenue lors de la suppression du gérant");
            });
    }
}

function editManager(companyId, managerEmail) {
    fetch(`/admin/companies/${companyId}/managers/${encodeURIComponent(managerEmail)}`)
        .then(response => response.json())
        .then(data => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'editManagerModal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h2>Modifier le gérant</h2>
                    <form id="editManagerForm">
                        <div class="form-group">
                            <label for="editManagerFirstName">Prénom</label>
                            <input type="text" id="editManagerFirstName" name="firstName" value="${data.manager.firstName}" required />
                        </div>
                        <div class="form-group">
                            <label for="editManagerName">Nom</label>
                            <input type="text" id="editManagerName" name="name" value="${data.manager.name}" required />
                        </div>
                        <div class="form-group">
                            <label for="editManagerEmail">Email professionnel</label>
                            <input type="email" id="editManagerEmail" name="email" value="${data.manager.email}" required />
                        </div>
                        <div class="form-group">
                            <label for="editManagerPhone">Numéro de téléphone</label>
                            <input type="tel" id="editManagerPhone" name="phone" value="${data.manager.phone}" required pattern="[0-9]{10}" />
                            <small>Format: 0612345678</small>
                        </div>
                        <div class="modal-buttons">
                            <button type="submit" class="btn-primary">Modifier</button>
                            <button type="button" onclick="closeEditManagerModal()" class="btn-secondary">Annuler</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
            modal.style.display = 'block';

            document.getElementById('editManagerForm').onsubmit = function (e) {
                e.preventDefault();
                const formData = {
                    firstName: document.getElementById('editManagerFirstName').value,
                    name: document.getElementById('editManagerName').value,
                    email: document.getElementById('editManagerEmail').value,
                    phone: document.getElementById('editManagerPhone').value
                };

                fetch(`/admin/companies/${companyId}/managers/${encodeURIComponent(managerEmail)}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            alert(data.error);
                        } else {
                            alert('Gérant modifié avec succès');
                            closeEditManagerModal();
                            window.location.reload();
                        }
                    })
                    .catch(error => {
                        console.error('Erreur:', error);
                        alert("Une erreur est survenue lors de la modification du gérant");
                    });
            };
        });
}

function closeEditManagerModal() {
    const modal = document.getElementById('editManagerModal');
    if (modal) {
        modal.style.display = 'none';
        modal.remove();
    }
}