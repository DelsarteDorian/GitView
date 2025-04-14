// Gestionnaire de messages entre les différentes parties de l'extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_PROFILE') {
        chrome.storage.local.get('currentProfile', async (data) => {
            if (data.currentProfile) {
                const profileData = await chrome.storage.local.get(`profile_${data.currentProfile}`);
                sendResponse(profileData[`profile_${data.currentProfile}`]);
            } else {
                sendResponse(null);
            }
        });
        return true; // Indique que la réponse sera envoyée de manière asynchrone
    }
    if (request.action === 'search') {
        searchGitHub(request.query)
            .then(results => sendResponse({ success: true, results }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Indique que la réponse sera envoyée de manière asynchrone
    }
});

// Gestion des mises à jour de l'extension
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Initialisation lors de la première installation
        chrome.storage.local.set({
            theme: 'light',
            currentProfile: null
        });
    }
});

// Gestion des erreurs
chrome.runtime.onError.addListener((error) => {
    console.error('Erreur dans l\'extension:', error);
});

// Fonction de logging pour le débogage
function log(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[GitView] ${message}`, data ? data : '');
    }
}

// Exemple d'utilisation du logging
log('Extension démarrée');

// Fonction de recherche GitHub
async function searchGitHub(query) {
    try {
        const response = await fetch(`https://api.github.com/search/repositories?q=${query}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la recherche');
        }
        const data = await response.json();
        return data.items;
    } catch (error) {
        console.error('Erreur lors de la recherche GitHub:', error);
        throw error;
    }
} 