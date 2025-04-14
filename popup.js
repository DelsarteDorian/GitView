// Gestion des profils GitHub
let profiles = [];

// Charger les profils au démarrage
chrome.storage.local.get(['profiles'], (result) => {
    if (result.profiles) {
        profiles = result.profiles;
        updateProfilesList();
    }
});

// Éléments DOM
const profileList = document.getElementById('profile-list');
const addProfileForm = document.getElementById('add-profile-form');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

// Gestion des profils
function updateProfilesList() {
    profileList.innerHTML = '';
    profiles.forEach((profile, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${profile.name}</span>
            <button onclick="removeProfile(${index})">Supprimer</button>
        `;
        profileList.appendChild(li);
    });
}

function addProfile(event) {
    event.preventDefault();
    const name = document.getElementById('profile-name').value;
    const username = document.getElementById('github-username').value;
    const token = document.getElementById('github-token').value;

    profiles.push({ name, username, token });
    chrome.storage.local.set({ profiles }, () => {
        updateProfilesList();
        addProfileForm.reset();
    });
}

function removeProfile(index) {
    profiles.splice(index, 1);
    chrome.storage.local.set({ profiles }, updateProfilesList);
}

// Recherche de dépôts
async function searchRepositories(query) {
    if (!query) return;

    try {
        const response = await fetch(`https://api.github.com/search/repositories?q=${query}`);
        const data = await response.json();
        displayResults(data.items);
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
    }
}

function displayResults(repositories) {
    searchResults.innerHTML = '';
    repositories.forEach(repo => {
        const div = document.createElement('div');
        div.className = 'repo-item';
        div.innerHTML = `
            <h3>${repo.name}</h3>
            <p>${repo.description || 'Pas de description'}</p>
            <a href="${repo.html_url}" target="_blank">Voir sur GitHub</a>
        `;
        searchResults.appendChild(div);
    });
}

// Événements
addProfileForm.addEventListener('submit', addProfile);
searchInput.addEventListener('input', (e) => searchRepositories(e.target.value)); 