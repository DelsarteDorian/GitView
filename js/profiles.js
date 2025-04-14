class ProfileManager {
    constructor() {
        this.profiles = [];
        this.loadProfiles();
    }

    async loadProfiles() {
        const result = await chrome.storage.local.get('profiles');
        this.profiles = result.profiles || [];
        this.updateProfilesList();
    }

    async saveProfile(profile) {
        const existingIndex = this.profiles.findIndex(p => p.name === profile.name);
        if (existingIndex !== -1) {
            this.profiles[existingIndex] = profile;
        } else {
            this.profiles.push(profile);
        }
        await chrome.storage.local.set({ profiles: this.profiles });
        this.updateProfilesList();
    }

    async deleteProfile(profileName) {
        this.profiles = this.profiles.filter(p => p.name !== profileName);
        await chrome.storage.local.set({ profiles: this.profiles });
        this.updateProfilesList();
    }

    editProfile(profileName) {
        const profile = this.profiles.find(p => p.name === profileName);
        if (!profile) return;

        const form = document.getElementById('add-profile-form');
        if (!form) return;

        // Remplir le formulaire avec les données du profil
        document.getElementById('profile-name').value = profile.name;
        document.getElementById('profile-username').value = profile.username;
        document.getElementById('profile-token').value = profile.token;

        // Changer le texte du bouton
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Modifier le profil';
            submitButton.dataset.editing = 'true';
            submitButton.dataset.profileName = profileName;
        }
    }

    updateProfilesList() {
        const profilesList = document.getElementById('profiles-list');
        if (!profilesList) return;

        profilesList.innerHTML = '';
        this.profiles.forEach(profile => {
            const profileElement = document.createElement('div');
            profileElement.className = 'profile-item';
            profileElement.innerHTML = `
                <div class="profile-info">
                    <h3>${profile.name}</h3>
                    <p>${profile.username}</p>
                </div>
                <div class="profile-actions">
                    <button class="search-profile" data-username="${profile.username}">Rechercher</button>
                    <button class="edit-profile" data-name="${profile.name}">Modifier</button>
                    <button class="delete-profile" data-name="${profile.name}">Supprimer</button>
                </div>
            `;
            profilesList.appendChild(profileElement);
        });

        // Ajouter les écouteurs d'événements pour les boutons
        document.querySelectorAll('.delete-profile').forEach(button => {
            button.addEventListener('click', (e) => {
                const profileName = e.target.dataset.name;
                this.deleteProfile(profileName);
            });
        });

        document.querySelectorAll('.edit-profile').forEach(button => {
            button.addEventListener('click', (e) => {
                const profileName = e.target.dataset.name;
                this.editProfile(profileName);
            });
        });

        document.querySelectorAll('.search-profile').forEach(button => {
            button.addEventListener('click', (e) => {
                const username = e.target.dataset.username;
                this.searchProfile(username);
            });
        });
    }

    async searchProfile(username) {
        // Basculer vers l'onglet de recherche
        document.querySelector('[data-tab="search"]').click();
        
        // Récupérer le token du profil
        const profiles = await chrome.storage.local.get('profiles');
        const profile = profiles.profiles?.find(p => p.username === username);
        const token = profile?.token || null;
        
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
            const oldProfileName = submitButton.dataset.profileName;

            const profile = {
                name: document.getElementById('profile-name').value,
                username: document.getElementById('profile-username').value,
                token: document.getElementById('profile-token').value
            };

            if (isEditing && oldProfileName !== profile.name) {
                // Si le nom a changé, supprimer l'ancien profil
                await profileManager.deleteProfile(oldProfileName);
            }

            await profileManager.saveProfile(profile);
            addProfileForm.reset();
            
            // Réinitialiser le bouton
            submitButton.textContent = 'Enregistrer le profil';
            delete submitButton.dataset.editing;
            delete submitButton.dataset.profileName;
        });
    }
}); 