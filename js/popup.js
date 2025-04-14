document.addEventListener('DOMContentLoaded', async () => {
    // Gestion des onglets
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Désactiver tous les onglets
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.add('hidden'));

            // Activer l'onglet sélectionné
            button.classList.add('active');
            const tabId = button.dataset.tab + '-tab';
            document.getElementById(tabId).classList.remove('hidden');
        });
    });

    // Enregistrement du service worker
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('service-worker.js');
            console.log('Service Worker enregistré avec succès:', registration);
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
        }
    }

    // Éléments du DOM
    const usernameInput = document.getElementById('username');
    const searchBtn = document.getElementById('search-btn');
    const typeFilter = document.getElementById('type-filter');
    const languageFilter = document.getElementById('language-filter');
    const sortFilter = document.getElementById('sort-filter');
    const repositoriesContainer = document.getElementById('repositories-container');
    const errorMessage = document.getElementById('error-message');
    const repositoryTemplate = document.getElementById('repository-template');

    // Vérification des éléments
    if (!usernameInput || !searchBtn || !typeFilter || !languageFilter || !sortFilter || 
        !repositoriesContainer || !errorMessage || !repositoryTemplate) {
        console.error('Un ou plusieurs éléments du DOM sont manquants');
        return;
    }

    let repositories = [];
    let currentFilters = {
        type: 'all',
        language: 'all',
        sort: 'updated'
    };

    // Événements
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    if (typeFilter) {
        typeFilter.addEventListener('change', () => updateFilters('type', typeFilter.value));
    }
    if (languageFilter) {
        languageFilter.addEventListener('change', () => updateFilters('language', languageFilter.value));
    }
    if (sortFilter) {
        sortFilter.addEventListener('change', () => updateFilters('sort', sortFilter.value));
    }

    async function handleSearch() {
        const username = usernameInput.value.trim();
        if (!username) {
            showError('Veuillez entrer un nom d\'utilisateur');
            return;
        }

        try {
            // Récupérer le token du profil correspondant
            const profiles = await chrome.storage.local.get('profiles');
            const profile = profiles.profiles?.find(p => p.username === username);
            const token = profile?.token || null;

            const repos = await githubAPI.fetchRepositories(username, token);
            repositories = repos;
            updateLanguageFilter(repos);
            displayRepositories(repos);
            hideError();
        } catch (error) {
            showError(error.message);
        }
    }

    function displayRepositories(repos) {
        const filteredRepos = githubAPI.filterRepositories(repos, currentFilters);
        repositoriesContainer.innerHTML = '';

        filteredRepos.forEach(repo => {
            const clone = repositoryTemplate.content.cloneNode(true);
            
            // Remplir les données du dépôt
            const repoName = clone.querySelector('.repo-name');
            const repoVisibility = clone.querySelector('.repo-visibility');
            const repoDescription = clone.querySelector('.repo-description');
            const languageColor = clone.querySelector('.language-color');
            const languageName = clone.querySelector('.language-name');
            const repoStars = clone.querySelector('.repo-stars');
            const repoForks = clone.querySelector('.repo-forks');
            const repoUpdated = clone.querySelector('.repo-updated');

            if (repoName) repoName.href = repo.html_url;
            if (repoName) repoName.textContent = repo.name;
            if (repoVisibility) {
                repoVisibility.textContent = repo.private ? 'Privé' : 'Public';
                repoVisibility.style.display = repo.private ? 'inline-block' : 'none';
            }
            if (repoDescription) repoDescription.textContent = repo.description || 'Pas de description';
            if (languageColor && repo.language) {
                languageColor.style.backgroundColor = getLanguageColor(repo.language);
            }
            if (languageName) languageName.textContent = repo.language || 'Non spécifié';
            if (repoStars) repoStars.textContent = `⭐ ${repo.stars}`;
            if (repoForks) repoForks.textContent = `🍴 ${repo.forks}`;
            if (repoUpdated) repoUpdated.textContent = formatDate(repo.updated_at);

            repositoriesContainer.appendChild(clone);
        });
    }

    function updateLanguageFilter(repos) {
        const languages = new Set(repos.map(repo => repo.language).filter(Boolean));
        languageFilter.innerHTML = '<option value="all">Tous les langages</option>';
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = lang;
            languageFilter.appendChild(option);
        });
    }

    function updateFilters(type, value) {
        currentFilters[type] = value;
        displayRepositories(repositories);
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    function getLanguageColor(language) {
        const colors = {
            'JavaScript': '#f1e05a',
            'TypeScript': '#3178c6',
            'Python': '#3572A5',
            'Java': '#b07219',
            'C++': '#f34b7d',
            'C#': '#178600',
            'PHP': '#4F5D95',
            'Ruby': '#701516',
            'Go': '#00ADD8',
            'Rust': '#dea584',
            'Swift': '#F05138',
            'Kotlin': '#A97BFF',
            'HTML': '#e34c26',
            'CSS': '#563d7c',
            'Shell': '#89e051',
            'Dockerfile': '#384d54',
            'Makefile': '#427819',
            'Vue': '#41b883',
            'React': '#61dafb',
            'Angular': '#dd0031',
            'Svelte': '#ff3e00',
            'Solid': '#2c4f7c',
            'Elm': '#60B5CC',
            'Clojure': '#db5855',
            'Haskell': '#5e5086',
            'Scala': '#c22d40',
            'R': '#198CE7',
            'Julia': '#a270ba',
            'Dart': '#00B4AB',
            'Lua': '#000080',
            'Perl': '#0298c3',
            'Racket': '#3c5caa',
            'Erlang': '#B83998',
            'Elixir': '#6e4a7e',
            'OCaml': '#3be133',
            'F#': '#b845fc',
            'ClojureScript': '#db5855',
            'CoffeeScript': '#244776',
            'PureScript': '#1D222D',
            'Reason': '#ff5847',
            'Nim': '#ffc200',
            'Crystal': '#000100',
            'Groovy': '#e69f56',
            'D': '#ba595e',
            'Fantom': '#14253c',
            'Perl6': '#0000fb',
            'Pony': '#f2a4dd',
            'Red': '#f50000',
            'Rebol': '#358a5b',
            'Ren\'Py': '#ff7f7f',
            'Ring': '#2D54CB',
            'Roff': '#ecdebe',
            'Rouge': '#cc0088',
            'Ruby': '#701516',
            'RUNOFF': '#665a4e',
            'Rust': '#dea584',
            'SAS': '#B34936',
            'Scala': '#c22d40',
            'Scheme': '#1e4aec',
            'Scilab': '#ca0f21',
            'Self': '#0579aa',
            'Shell': '#89e051',
            'Shen': '#120F14',
            'Slash': '#007eff',
            'Slice': '#003fa2',
            'Smalltalk': '#596706',
            'Solidity': '#AA6746',
            'SourcePawn': '#5c7611',
            'Squirrel': '#800000',
            'SRecode Template': '#348a34',
            'Stan': '#b2011d',
            'Standard ML': '#dc566d',
            'Starlark': '#76d275',
            'Stata': '#1a5f91',
            'SuperCollider': '#46390b',
            'Svelte': '#ff3e00',
            'Swift': '#F05138',
            'SystemVerilog': '#DAE1C2',
            'Tcl': '#e4cc98',
            'TeX': '#3D6117',
            'Terra': '#00004c',
            'Thrift': '#D12127',
            'TI Program': '#A0AA87',
            'TLA': '#4b0079',
            'TOML': '#9c4221',
            'TSQL': '#e38c00',
            'TSX': '#3178c6',
            'Turing': '#cf142b',
            'Twig': '#c1d026',
            'TypeScript': '#3178c6',
            'Unified Parallel C': '#4e3617',
            'Unity3D Asset': '#222c37',
            'Uno': '#9933cc',
            'UnrealScript': '#a54c4d',
            'V': '#4f87c4',
            'Vala': '#fbe5cd',
            'VCL': '#148AA8',
            'Verilog': '#b2b7f8',
            'VHDL': '#adb2cb',
            'Vim script': '#199f4b',
            'Visual Basic .NET': '#945db7',
            'Volt': '#1F1F1F',
            'Vue': '#41b883',
            'WebAssembly': '#04133b',
            'WebIDL': '#8b9dc3',
            'wisp': '#7582D1',
            'X10': '#4B6BEF',
            'xBase': '#403a40',
            'XC': '#99DA07',
            'XML': '#0060ac',
            'Xojo': '#81bd41',
            'XProc': '#8ca7db',
            'XQuery': '#5232e7',
            'XSLT': '#EB8CEB',
            'Xtend': '#24255d',
            'Yacc': '#4B6C4B',
            'YAML': '#cb171e',
            'YARA': '#220000',
            'YASnippet': '#32AB90',
            'ZAP': '#0d665e',
            'Zeek': '#88cc00',
            'ZenScript': '#00BCD1',
            'Zephir': '#118f9e',
            'Zig': '#ec915c',
            'ZIL': '#dc75e5',
            'Zimpl': '#d67711'
        };
        return colors[language] || '#ccc';
    }

    function formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Aujourd\'hui';
        if (days === 1) return 'Hier';
        if (days < 7) return `Il y a ${days} jours`;
        if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
        if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
        return `Il y a ${Math.floor(days / 365)} ans`;
    }
}); 