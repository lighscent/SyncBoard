// Gestion des formulaires d'ajout
document.getElementById('addUserForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = {
        firstName: document.getElementById('userFirstName').value,
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        phone: document.getElementById('userPhone').value
    };

    fetch('/company/users', {
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
                alert('Utilisateur ajouté avec succès');
                closeModal('addUserModal');
                window.location.reload();
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert("Une erreur est survenue lors de l'ajout de l'utilisateur");
        });
});

document.getElementById('addManagerForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = {
        firstName: document.getElementById('managerFirstName').value,
        name: document.getElementById('managerName').value,
        email: document.getElementById('managerEmail').value,
        phone: document.getElementById('managerPhone').value
    };

    fetch('/company/managers', {
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
                alert('Gérant ajouté avec succès. Un email avec les identifiants a été envoyé.');
                closeModal('addManagerModal');
                window.location.reload();
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert("Une erreur est survenue lors de l'ajout du gérant");
        });
});

// Gestion des utilisateurs
function editUser(userId) {
    fetch(`/company/users/${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }

            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'editUserModal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h2>Modifier l'utilisateur</h2>
                    <form id="editUserForm">
                        <div class="form-group">
                            <label for="editUserFirstName">Prénom *</label>
                            <input type="text" id="editUserFirstName" name="firstName" value="${data.user.firstName}" required />
                        </div>
                        <div class="form-group">
                            <label for="editUserName">Nom *</label>
                            <input type="text" id="editUserName" name="name" value="${data.user.name}" required />
                        </div>
                        <div class="form-group">
                            <label for="editUserEmail">Email professionnel *</label>
                            <input type="email" id="editUserEmail" name="email" value="${data.user.email}" required />
                        </div>
                        <div class="form-group">
                            <label for="editUserPhone">Numéro de téléphone *</label>
                            <input type="tel" id="editUserPhone" name="phone" value="${data.user.phone}" required pattern="[0-9]{10}" />
                            <small>Format: 0612345678</small>
                        </div>
                        <div class="modal-buttons">
                            <button type="submit" class="btn-primary">Modifier</button>
                            <button type="button" onclick="closeEditModal('editUserModal')" class="btn-secondary">Annuler</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
            modal.style.display = 'block';

            document.getElementById('editUserForm').onsubmit = function (e) {
                e.preventDefault();
                updateUser(userId);
            };
        });
}

function updateUser(userId) {
    const formData = {
        firstName: document.getElementById('editUserFirstName').value,
        name: document.getElementById('editUserName').value,
        email: document.getElementById('editUserEmail').value,
        phone: document.getElementById('editUserPhone').value
    };

    fetch(`/company/users/${userId}`, {
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
                alert('Utilisateur modifié avec succès');
                closeEditModal('editUserModal');
                window.location.reload();
            }
        });
}

function deleteUser(userId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
        fetch(`/company/users/${userId}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    alert('Utilisateur supprimé avec succès');
                    window.location.reload();
                }
            });
    }
}

// Gestion des gérants
function editManager(email) {
    fetch(`/company/managers/${encodeURIComponent(email)}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }

            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'editManagerModal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h2>Modifier le gérant</h2>
                    <form id="editManagerForm">
                        <div class="form-group">
                            <label for="editManagerFirstName">Prénom *</label>
                            <input type="text" id="editManagerFirstName" name="firstName" value="${data.manager.firstName}" required />
                        </div>
                        <div class="form-group">
                            <label for="editManagerName">Nom *</label>
                            <input type="text" id="editManagerName" name="name" value="${data.manager.name}" required />
                        </div>
                        <div class="form-group">
                            <label for="editManagerEmail">Email professionnel *</label>
                            <input type="email" id="editManagerEmail" name="email" value="${data.manager.email}" required />
                        </div>
                        <div class="form-group">
                            <label for="editManagerPhone">Numéro de téléphone *</label>
                            <input type="tel" id="editManagerPhone" name="phone" value="${data.manager.phone}" required pattern="[0-9]{10}" />
                            <small>Format: 0612345678</small>
                        </div>
                        <div class="modal-buttons">
                            <button type="submit" class="btn-primary">Modifier</button>
                            <button type="button" onclick="closeEditModal('editManagerModal')" class="btn-secondary">Annuler</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
            modal.style.display = 'block';

            document.getElementById('editManagerForm').onsubmit = function (e) {
                e.preventDefault();
                updateManager(email);
            };
        });
}

function updateManager(email) {
    const formData = {
        firstName: document.getElementById('editManagerFirstName').value,
        name: document.getElementById('editManagerName').value,
        email: document.getElementById('editManagerEmail').value,
        phone: document.getElementById('editManagerPhone').value
    };

    fetch(`/company/managers/${encodeURIComponent(email)}`, {
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
                closeEditModal('editManagerModal');
                window.location.reload();
            }
        });
}

function deleteManager(email) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce gérant ?')) {
        fetch(`/company/managers/${encodeURIComponent(email)}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    alert('Gérant supprimé avec succès');
                    window.location.reload();
                }
            });
    }
}

function closeEditModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.remove();
    }
} 