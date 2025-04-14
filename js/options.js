document.addEventListener('DOMContentLoaded', () => {
    const profilesList = document.getElementById('profiles-list');
    const addProfileForm = document.getElementById('add-profile-form');
    const profileNameInput = document.getElementById('profile-name');
    const profileUsernameInput = document.getElementById('profile-username');
    const profileTokenInput = document.getElementById('profile-token');

    // Charger les profils existants
    loadProfiles();

    // Gérer l'ajout d'un nouveau profil
    addProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const profileName = profileNameInput.value.trim();
        const username = profileUsernameInput.value.trim();
        const token = profileTokenInput.value.trim();

        if (!profileName || !username) {
            showError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        try {
            await saveProfile(profileName, username, token);
            addProfileForm.reset();
            loadProfiles();
        } catch (error) {
            showError('Erreur lors de la sauvegarde du profil');
            console.error(error);
        }
    });

    async function loadProfiles() {
        const data = await chrome.storage.local.get(null);
        profilesList.innerHTML = '';

        for (const [key, value] of Object.entries(data)) {
            if (key.startsWith('profile_')) {
                const profileName = key.replace('profile_', '');
                const profileCard = createProfileCard(profileName, value.username);
                profilesList.appendChild(profileCard);
            }
        }
    }

    function createProfileCard(profileName, username) {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.innerHTML = `
            <div class="profile-info">
                <h3>${profileName}</h3>
                <p>Utilisateur GitHub: ${username}</p>
            </div>
            <div class="profile-actions">
                <button onclick="switchToProfile('${profileName}')">Utiliser</button>
                <button class="delete" onclick="deleteProfile('${profileName}')">Supprimer</button>
            </div>
        `;
        return card;
    }

    async function saveProfile(profileName, username, token) {
        const profileData = {
            username: username
        };

        if (token) {
            await cryptoManager.saveEncryptedToken(token, profileName);
        }

        await chrome.storage.local.set({
            [`profile_${profileName}`]: profileData
        });
    }

    window.switchToProfile = async (profileName) => {
        await chrome.storage.local.set({ currentProfile: profileName });
        showSuccess('Profil sélectionné avec succès');
    };

    window.deleteProfile = async (profileName) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce profil ?')) {
            await chrome.storage.local.remove(`profile_${profileName}`);
            loadProfiles();
            showSuccess('Profil supprimé avec succès');
        }
    };

    function showError(message) {
        // Implémenter l'affichage d'erreur
        console.error(message);
    }

    function showSuccess(message) {
        // Implémenter l'affichage de succès
        console.log(message);
    }
}); 