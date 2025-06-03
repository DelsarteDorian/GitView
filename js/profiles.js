class ProfileManager {
    constructor() {
        this.profiles = [];
        this.activeProfileId = null;
        this.loadProfiles();
    }

    async loadProfiles() {
        const result = await chrome.storage.local.get(['profiles', 'activeProfileId']);
        this.profiles = result.profiles || [];
        this.activeProfileId = result.activeProfileId || null;
        this.updateProfilesList();
    }

    async saveProfile(profile) {
        // Générer un ID unique si le profil est nouveau
        if (!profile.id) {
            profile.id = crypto.randomUUID();
        }

        // S'assurer que le nom n'est pas vide
        if (!profile.name || profile.name.trim() === '') {
            profile.name = `Profil ${this.profiles.length + 1}`;
        }

        const existingIndex = this.profiles.findIndex(p => p.id === profile.id);
        if (existingIndex !== -1) {
            this.profiles[existingIndex] = profile;
        } else {
            this.profiles.push(profile);
        }

        // Si c'est le premier profil, le définir comme actif
        if (this.profiles.length === 1) {
            this.activeProfileId = profile.id;
        }

        await chrome.storage.local.set({ 
            profiles: this.profiles,
            activeProfileId: this.activeProfileId
        });
        
        this.updateProfilesList();
    }

    async deleteProfile(profileId) {
        this.profiles = this.profiles.filter(p => p.id !== profileId);
        
        // Si le profil supprimé était actif, définir un nouveau profil actif
        if (this.activeProfileId === profileId) {
            this.activeProfileId = this.profiles.length > 0 ? this.profiles[0].id : null;
        }

        await chrome.storage.local.set({ 
            profiles: this.profiles,
            activeProfileId: this.activeProfileId
        });
        
        this.updateProfilesList();
    }

    async setActiveProfile(profileId) {
        // Si le profil est déjà actif, on le désactive
        if (this.activeProfileId === profileId) {
            this.activeProfileId = null;
        } else {
            this.activeProfileId = profileId;
        }
        
        // Sauvegarder et mettre à jour l'interface
        await chrome.storage.local.set({ activeProfileId: this.activeProfileId });
        this.updateProfilesList();
    }

    getActiveProfile() {
        return this.profiles.find(p => p.id === this.activeProfileId) || null;
    }

    editProfile(profileId) {
        const profile = this.profiles.find(p => p.id === profileId);
        if (!profile) return;

        const form = document.getElementById('add-profile-form');
        if (!form) return;

        // Remplir le formulaire avec les données du profil
        const nameInput = document.getElementById('profile-name');
        const usernameInput = document.getElementById('profile-username');
        const tokenInput = document.getElementById('profile-token');

        if (nameInput) nameInput.value = profile.name || '';
        if (usernameInput) usernameInput.value = profile.username || '';
        if (tokenInput) tokenInput.value = profile.token || '';

        // Changer le texte du bouton
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Modifier le profil';
            submitButton.dataset.editing = 'true';
            submitButton.dataset.profileId = profileId;
        }

        // Faire défiler jusqu'au formulaire
        form.scrollIntoView({ behavior: 'smooth' });
    }

    updateProfilesList() {
        const profilesList = document.getElementById('profiles-list');
        if (!profilesList) return;

        profilesList.innerHTML = '';
        this.profiles.forEach(profile => {
            const isActive = profile.id === this.activeProfileId;
            const profileElement = document.createElement('div');
            profileElement.className = `profile-item ${isActive ? 'active' : ''}`;
            
            // Créer la structure HTML
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
            
            // Ajouter l'élément à la liste
            profilesList.appendChild(profileElement);
        });

        // Ajouter les écouteurs d'événements pour les boutons
        document.querySelectorAll('.delete-profile').forEach(button => {
            button.addEventListener('click', (e) => {
                const profileId = e.target.dataset.id;
                this.deleteProfile(profileId);
            });
        });

        document.querySelectorAll('.edit-profile').forEach(button => {
            button.addEventListener('click', (e) => {
                const profileId = e.target.dataset.id;
                this.editProfile(profileId);
            });
        });

        document.querySelectorAll('.search-profile').forEach(button => {
            button.addEventListener('click', (e) => {
                const username = e.target.dataset.username;
                this.searchProfile(username);
            });
        });

        document.querySelectorAll('.set-active-profile').forEach(button => {
            button.addEventListener('click', async (e) => {
                const profileId = e.target.dataset.id;
                const isActive = profileId === this.activeProfileId;
                
                // Mettre à jour l'état
                if (isActive) {
                    this.activeProfileId = null;
                } else {
                    this.activeProfileId = profileId;
                }
                
                // Sauvegarder l'état
                await chrome.storage.local.set({ activeProfileId: this.activeProfileId });
                
                // Mettre à jour l'interface immédiatement
                const button = e.target;
                button.textContent = isActive ? 'Définir comme actif' : 'Définir comme non actif';
                
                // Mettre à jour le badge et la classe active
                const profileItem = button.closest('.profile-item');
                if (profileItem) {
                    if (isActive) {
                        profileItem.classList.remove('active');
                        const badge = profileItem.querySelector('.active-badge');
                        if (badge) badge.remove();
                    } else {
                        profileItem.classList.add('active');
                        const header = profileItem.querySelector('.profile-header');
                        if (header && !header.querySelector('.active-badge')) {
                            header.insertAdjacentHTML('beforeend', '<span class="active-badge">Profil actif</span>');
                        }
                    }
                }
                
                // Mettre à jour les autres boutons
                document.querySelectorAll('.set-active-profile').forEach(otherButton => {
                    if (otherButton !== button) {
                        otherButton.textContent = 'Définir comme actif';
                        const otherProfileItem = otherButton.closest('.profile-item');
                        if (otherProfileItem) {
                            otherProfileItem.classList.remove('active');
                            const badge = otherProfileItem.querySelector('.active-badge');
                            if (badge) badge.remove();
                        }
                    }
                });
            });
        });
    }

    async searchProfile(username) {
        // Basculer vers l'onglet de recherche
        document.querySelector('[data-tab="search"]').click();
        
        // Remplir le champ de recherche et lancer la recherche
        const searchInput = document.getElementById('username');
        const searchButton = document.getElementById('search-btn');
        
        if (searchInput && searchButton) {
            searchInput.value = username;
            searchButton.click();
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    const profileManager = new ProfileManager();
    const addProfileForm = document.getElementById('add-profile-form');

    if (addProfileForm) {
        addProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = e.target.querySelector('button[type="submit"]');
            const isEditing = submitButton.dataset.editing === 'true';
            const oldProfileId = submitButton.dataset.profileId;

            const profile = {
                id: oldProfileId, // Conserver l'ID si on modifie
                name: document.getElementById('profile-name').value,
                username: document.getElementById('profile-username').value,
                token: document.getElementById('profile-token').value
            };

            await profileManager.saveProfile(profile);
            addProfileForm.reset();
            
            // Réinitialiser le bouton
            submitButton.textContent = 'Enregistrer le profil';
            delete submitButton.dataset.editing;
            delete submitButton.dataset.profileId;
        });
    }
}); 