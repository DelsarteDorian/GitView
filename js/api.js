class GitHubAPI {
    constructor() {
        this.baseUrl = 'https://api.github.com';
    }

    async fetchRepositories(username, token = null) {
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };

        if (token) {
            headers['Authorization'] = `token ${token}`;
        }

        try {
            const endpoint = token 
                ? `${this.baseUrl}/user/repos?per_page=100&type=all` 
                : `${this.baseUrl}/users/${username}/repos?per_page=100&type=all`;

            const response = await fetch(endpoint, {
                headers: headers
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Erreur API GitHub:', error);
                throw new Error(this.handleError(response.status, error.message));
            }

            const data = await response.json();
            console.log('Réponse API GitHub:', data);
            return this.processRepositories(data);
        } catch (error) {
            console.error('Erreur lors de la récupération des dépôts:', error);
            throw error;
        }
    }

    handleError(status, message) {
        switch (status) {
            case 401:
                return 'Token invalide ou expiré. Veuillez vérifier votre token dans les paramètres du profil.';
            case 403:
                return 'Limite de requêtes API atteinte. Si vous avez un token, essayez de le mettre à jour.';
            case 404:
                return 'Utilisateur non trouvé';
            default:
                return message || 'Erreur lors de la requête API';
        }
    }

    processRepositories(repos) {
        return repos.map(repo => ({
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            private: repo.private,
            html_url: repo.html_url,
            clone_url: repo.clone_url,
            ssh_url: repo.ssh_url,
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            created_at: new Date(repo.created_at),
            updated_at: new Date(repo.updated_at),
            default_branch: repo.default_branch
        }));
    }

    filterRepositories(repos, filters) {
        return repos.filter(repo => {
            if (filters.type !== 'all' && repo.private !== (filters.type === 'private')) {
                return false;
            }
            if (filters.language !== 'all' && repo.language !== filters.language) {
                return false;
            }
            return true;
        }).sort((a, b) => {
            switch (filters.sort) {
                case 'stars':
                    return b.stars - a.stars;
                case 'forks':
                    return b.forks - a.forks;
                case 'created':
                    return b.created_at - a.created_at;
                case 'updated':
                default:
                    return b.updated_at - a.updated_at;
            }
        });
    }
}

const githubAPI = new GitHubAPI(); 