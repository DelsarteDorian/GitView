class ProfileManager {
    constructor() {
        this.profiles = [];
        this.activeProfileId = null;
        this.init();
    }

    async init() {
        await this.loadProfiles();
        this.setupEventListeners();
        this.updateProfilesList();
    }

    async loadProfiles() {
        try {
            const result = await chrome.storage.local.get(['profiles', 'activeProfileId']);
            console.log('Données brutes du stockage:', result);
            
            if (Array.isArray(result.profiles)) {
                this.profiles = result.profiles.map(profile => {
                    if (!profile.id) {
                        console.log('Profil sans ID trouvé, génération d\'un nouvel ID:', profile);
                        return { ...profile, id: crypto.randomUUID() };
                    }
                    return profile;
                });
            } else {
                console.warn('Les profils stockés ne sont pas un tableau, réinitialisation');
                this.profiles = [];
            }
            
            this.activeProfileId = result.activeProfileId || null;
            console.log('Profils chargés et nettoyés:', this.profiles);
        } catch (error) {
            console.error('Erreur lors du chargement des profils:', error);
            this.profiles = [];
            this.activeProfileId = null;
        }
    }

    async saveProfile(profile) {
        try {
            console.log('Début de la sauvegarde du profil:', profile);
            
            if (profile.token) {
                const validation = await ProfileUtils.validateGitHubToken(profile.token);
                if (!validation.valid) {
                    throw new Error('Token GitHub invalide');
                }
                if (validation.username && !profile.username) {
                    profile.username = validation.username;
                }
            }

            // Si c'est un nouveau profil (pas d'ID)
            if (!profile.id) {
                console.log('Création d\'un nouveau profil');
                
                // Vérifier si un profil similaire existe déjà
                const existingProfile = this.profiles.find(p => 
                    (p.username && p.username === profile.username) || 
                    (p.token && p.token === profile.token)
                );

                if (existingProfile) {
                    // Si le profil existe, on le met à jour au lieu d'en créer un nouveau
                    console.log('Profil existant trouvé, mise à jour:', existingProfile);
                    profile.id = existingProfile.id;
                    const index = this.profiles.findIndex(p => p.id === existingProfile.id);
                    this.profiles[index] = {
                        ...this.profiles[index],
                        ...profile
                    };
                } else {
                    // Création d'un nouveau profil
                    profile.id = crypto.randomUUID();
                    this.profiles.push(profile);
                }
            } else {
                // Mise à jour d'un profil existant
                const existingIndex = this.profiles.findIndex(p => p.id === profile.id);
                if (existingIndex !== -1) {
                    console.log('Mise à jour du profil existant:', existingIndex);
                    this.profiles[existingIndex] = {
                        ...this.profiles[existingIndex],
                        ...profile
                    };
                } else {
                    // Si le profil n'existe pas mais a un ID, on le crée
                    console.log('Profil non trouvé avec cet ID, création d\'un nouveau');
                    profile.id = crypto.randomUUID();
                    this.profiles.push(profile);
                }
            }

            console.log('Profils avant sauvegarde:', this.profiles);
            await this.saveProfiles();
            console.log('Profils après sauvegarde:', this.profiles);
            
            this.updateProfilesList();
            return profile;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du profil:', error);
            throw error;
        }
    }

    async deleteProfile(profileId) {
        if (!profileId) {
            console.error('ID de profil manquant pour la suppression');
            return;
        }

        try {
            console.log('Tentative de suppression du profil:', profileId);
            console.log('Profils actuels:', this.profiles);
            
            const profileExists = this.profiles.some(p => p.id === profileId);
            if (!profileExists) {
                console.warn('Profil non trouvé pour la suppression:', profileId);
                return;
            }
            
            this.profiles = this.profiles.filter(p => p.id !== profileId);
            console.log('Profils après suppression:', this.profiles);
            
            if (this.activeProfileId === profileId) {
                this.activeProfileId = this.profiles.length > 0 ? this.profiles[0].id : null;
            }

            await this.saveProfiles();
            this.updateProfilesList();
        } catch (error) {
            console.error('Erreur lors de la suppression du profil:', error);
            throw error;
        }
    }

    async setActiveProfile(profileId) {
        if (!profileId) {
            console.error('ID de profil manquant pour la modification du profil actif');
            return;
        }

        try {
            if (this.activeProfileId === profileId) {
                this.activeProfileId = null;
            } else {
                this.activeProfileId = profileId;
            }
            
            await this.saveProfiles();
            this.updateProfilesList();
        } catch (error) {
            console.error('Erreur lors de la modification du profil actif:', error);
            throw error;
        }
    }

    getActiveProfile() {
        return this.profiles.find(p => p.id === this.activeProfileId) || null;
    }

    editProfile(profileId) {
        if (!profileId) {
            console.error('ID de profil manquant pour la modification');
            return;
        }

        const profile = this.profiles.find(p => p.id === profileId);
        if (!profile) {
            console.warn('Tentative de modification d\'un profil inexistant:', profileId);
            return;
        }

        const form = document.getElementById('add-profile-form');
        if (!form) return;

        const nameInput = form.querySelector('#profile-name');
        const usernameInput = form.querySelector('#profile-username');
        const tokenInput = form.querySelector('#profile-token');

        if (nameInput) nameInput.value = profile.name || '';
        if (usernameInput) usernameInput.value = profile.username || '';
        if (tokenInput) tokenInput.value = profile.token || '';

        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Modifier le profil';
            submitButton.dataset.editing = 'true';
            submitButton.dataset.profileId = profileId;
        }

        form.scrollIntoView({ behavior: 'smooth' });
    }

    updateProfilesList() {
        const profilesList = document.getElementById('profiles-list');
        if (!profilesList) return;

        console.log('Mise à jour de la liste des profils:', this.profiles);

        const newList = document.createElement('div');
        newList.id = 'profiles-list';
        newList.className = 'profiles-list';

        this.profiles.forEach(profile => {
            if (!profile.id) {
                console.error('Profil sans ID trouvé lors de la mise à jour:', profile);
                return;
            }

            const isActive = profile.id === this.activeProfileId;
            const profileElement = document.createElement('div');
            profileElement.className = `profile-item ${isActive ? 'active' : ''}`;
            
            profileElement.innerHTML = `
                <div class="profile-info">
                    <div class="profile-header">
                        <h3>${profile.name || `Profil ${this.profiles.indexOf(profile) + 1}`}</h3>
                        ${isActive ? '<span class="active-badge">Profil actif</span>' : ''}
                    </div>
                    <p>GitHub: ${profile.username || 'Non défini'}</p>
                </div>
                <div class="profile-actions">
                    <button class="search-profile" data-username="${profile.username}">Rechercher</button>
                    <button class="edit-profile" data-id="${profile.id}">Modifier</button>
                    <button class="delete-profile" data-id="${profile.id}">Supprimer</button>
                    <button class="set-active-profile" data-id="${profile.id}">
                        ${isActive ? 'Définir comme non actif' : 'Définir comme actif'}
                    </button>
                </div>
            `;
            
            newList.appendChild(profileElement);
        });

        profilesList.parentNode.replaceChild(newList, profilesList);

        newList.querySelectorAll('.delete-profile').forEach(button => {
            const profileId = button.getAttribute('data-id');
            if (!profileId) {
                console.error('ID de profil manquant sur le bouton de suppression');
                return;
            }
            
            button.addEventListener('click', () => {
                console.log('Clic sur le bouton de suppression pour le profil:', profileId);
                this.deleteProfile(profileId);
            });
        });

        newList.querySelectorAll('.edit-profile').forEach(button => {
            const profileId = button.getAttribute('data-id');
            if (!profileId) {
                console.error('ID de profil manquant sur le bouton de modification');
                return;
            }
            
            button.addEventListener('click', () => {
                console.log('Clic sur le bouton de modification pour le profil:', profileId);
                this.editProfile(profileId);
            });
        });

        newList.querySelectorAll('.search-profile').forEach(button => {
            const username = button.getAttribute('data-username');
            if (!username) {
                console.error('Nom d\'utilisateur manquant sur le bouton de recherche');
                return;
            }
            
            button.addEventListener('click', () => {
                console.log('Clic sur le bouton de recherche pour l\'utilisateur:', username);
                this.searchProfile(username);
            });
        });

        newList.querySelectorAll('.set-active-profile').forEach(button => {
            const profileId = button.getAttribute('data-id');
            if (!profileId) {
                console.error('ID de profil manquant sur le bouton de profil actif');
                return;
            }
            
            button.addEventListener('click', () => {
                console.log('Clic sur le bouton de profil actif pour le profil:', profileId);
                this.setActiveProfile(profileId);
            });
        });
    }

    async searchProfile(username) {
        if (!username) return;

        document.querySelector('[data-tab="search"]').click();
        
        const searchInput = document.getElementById('username');
        const searchButton = document.getElementById('search-btn');
        
        if (searchInput && searchButton) {
            searchInput.value = username;
            searchButton.click();
        }
    }

    async saveProfiles() {
        try {
            console.log('Sauvegarde des profils dans le stockage:', this.profiles);
            await chrome.storage.local.set({ 
                profiles: this.profiles,
                activeProfileId: this.activeProfileId
            });
            
            const result = await chrome.storage.local.get(['profiles', 'activeProfileId']);
            console.log('Vérification après sauvegarde:', result);
            
            if (!Array.isArray(result.profiles) || result.profiles.length !== this.profiles.length) {
                console.error('Erreur de sauvegarde: les données ne correspondent pas');
                throw new Error('Erreur lors de la sauvegarde des profils');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des profils:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Gestion du formulaire
        const addProfileForm = document.getElementById('add-profile-form');
        if (addProfileForm) {
            // Supprimer tous les écouteurs d'événements existants
            const newForm = addProfileForm.cloneNode(true);
            addProfileForm.parentNode.replaceChild(newForm, addProfileForm);

            // Ajouter un seul écouteur d'événement
            newForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Soumission du formulaire');

                const submitButton = newForm.querySelector('button[type="submit"]');
                const isEditing = submitButton.dataset.editing === 'true';
                const oldProfileId = submitButton.dataset.profileId;

                const profile = {
                    id: oldProfileId,
                    name: newForm.querySelector('#profile-name').value,
                    username: newForm.querySelector('#profile-username').value,
                    token: newForm.querySelector('#profile-token').value
                };

                try {
                    console.log('Sauvegarde du profil:', profile);
                    await this.saveProfile(profile);
                    newForm.reset();
                    
                    // Réinitialiser le bouton
                    submitButton.textContent = 'Enregistrer le profil';
                    delete submitButton.dataset.editing;
                    delete submitButton.dataset.profileId;
                } catch (error) {
                    console.error('Erreur lors de la sauvegarde:', error);
                    alert('Erreur lors de la sauvegarde du profil: ' + error.message);
                }
            });
        }

        // Supprimer les anciens boutons s'ils existent
        const oldActions = document.querySelector('.profile-actions');
        if (oldActions) {
            oldActions.remove();
        }

        // Ajouter les boutons d'import/export
        const profilesSection = document.querySelector('.profiles-section');
        if (profilesSection) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'profile-actions';
            actionsDiv.innerHTML = `
                <button id="import-profiles" class="secondary-button" data-tooltip="Importer des profils depuis un fichier">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <path fill="currentColor" d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14A6 6 0 1 1 8 2a6 6 0 0 1 0 12zm-1-5V4h2v5h3l-4 4-4-4h3z"/>
                    </svg>
                    Importer
                </button>
                <button id="export-profiles" class="secondary-button" data-tooltip="Exporter tous les profils">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <path fill="currentColor" d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14A6 6 0 1 1 8 2a6 6 0 0 1 0 12zm-1-5V4h2v5h3l-4 4-4-4h3z"/>
                    </svg>
                    Exporter
                </button>
            `;
            profilesSection.insertBefore(actionsDiv, document.getElementById('profiles-list'));

            // Gestion de l'import
            const importButton = document.getElementById('import-profiles');
            if (importButton) {
                importButton.addEventListener('click', async () => {
                    try {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json';
                        input.style.display = 'none';
                        document.body.appendChild(input);

                        input.onchange = async (e) => {
                            const file = e.target.files[0];
                            if (!file) {
                                document.body.removeChild(input);
                                return;
                            }

                            const text = await file.text();
                            const data = JSON.parse(text);
                            let profiles = [];

                            if (Array.isArray(data)) {
                                profiles = data;
                            } else if (data.version === '1.0' && data.profiles) {
                                profiles = data.profiles;
                            } else {
                                throw new Error('Format de fichier invalide');
                            }

                            // Créer la boîte de dialogue de sélection
                            const dialog = document.createElement('div');
                            dialog.className = 'import-dialog';
                            dialog.innerHTML = `
                                <div class="import-dialog-content">
                                    <h3>Sélectionner les profils à importer</h3>
                                    <div class="import-profiles-list">
                                        ${profiles.map((profile, index) => `
                                            <div class="import-profile-item">
                                                <input type="checkbox" id="profile-${index}" checked>
                                                <label for="profile-${index}">
                                                    <strong>${profile.name || 'Sans nom'}</strong>
                                                    <span>GitHub: ${profile.username || 'Non défini'}</span>
                                                </label>
                                            </div>
                                        `).join('')}
                                    </div>
                                    <div class="import-dialog-actions">
                                        <button class="import-all">Tout importer</button>
                                        <button class="import-selected">Importer la sélection</button>
                                        <button class="import-cancel">Annuler</button>
                                    </div>
                                </div>
                            `;

                            document.body.appendChild(dialog);

                            // Gestion des boutons
                            dialog.querySelector('.import-all').addEventListener('click', async () => {
                                for (const profile of profiles) {
                                    await this.saveProfile(profile);
                                }
                                document.body.removeChild(dialog);
                                document.body.removeChild(input);
                            });

                            dialog.querySelector('.import-selected').addEventListener('click', async () => {
                                const selectedProfiles = profiles.filter((_, index) => 
                                    dialog.querySelector(`#profile-${index}`).checked
                                );
                                for (const profile of selectedProfiles) {
                                    await this.saveProfile(profile);
                                }
                                document.body.removeChild(dialog);
                                document.body.removeChild(input);
                            });

                            dialog.querySelector('.import-cancel').addEventListener('click', () => {
                                document.body.removeChild(dialog);
                                document.body.removeChild(input);
                            });
                        };

                        input.click();
                    } catch (error) {
                        console.error('Erreur lors de l\'import:', error);
                        alert('Erreur lors de l\'import des profils: ' + error.message);
                    }
                });
            }

            // Gestion de l'export
            const exportButton = document.getElementById('export-profiles');
            if (exportButton) {
                exportButton.addEventListener('click', async () => {
                    try {
                        const exportData = {
                            version: '1.0',
                            profiles: this.profiles.map(profile => ({
                                name: profile.name,
                                username: profile.username,
                                token: profile.token
                            }))
                        };

                        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);

                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'gitview-profiles.json';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    } catch (error) {
                        console.error('Erreur lors de l\'export:', error);
                        alert('Erreur lors de l\'export des profils: ' + error.message);
                    }
                });
            }
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
}); 