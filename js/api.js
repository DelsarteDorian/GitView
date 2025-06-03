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

    async searchRepositories(query, filters = {}) {
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };

        if (filters.token) {
            headers['Authorization'] = `token ${filters.token}`;
        }

        try {
            let searchQuery = query;
            
            // Ajout des filtres de recherche
            if (filters.organization) {
                searchQuery += ` org:${filters.organization}`;
            }
            if (filters.language) {
                searchQuery += ` language:${filters.language}`;
            }
            if (filters.stars) {
                searchQuery += ` stars:>=${filters.stars}`;
            }
            if (filters.created) {
                searchQuery += ` created:>=${filters.created}`;
            }
            if (filters.updated) {
                searchQuery += ` pushed:>=${filters.updated}`;
            }

            const endpoint = `${this.baseUrl}/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=${filters.sort || 'updated'}&order=${filters.order || 'desc'}&per_page=100`;

            const response = await fetch(endpoint, { headers });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(this.handleError(response.status, error.message));
            }

            const data = await response.json();
            return this.processRepositories(data.items);
        } catch (error) {
            console.error('Erreur lors de la recherche des dépôts:', error);
            throw error;
        }
    }

    async getOrganizations(username, token = null) {
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };

        if (token) {
            headers['Authorization'] = `token ${token}`;
        }

        try {
            const endpoint = token 
                ? `${this.baseUrl}/user/orgs` 
                : `${this.baseUrl}/users/${username}/orgs`;

            const response = await fetch(endpoint, { headers });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(this.handleError(response.status, error.message));
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la récupération des organisations:', error);
            throw error;
        }
    }

    async getRepositoryStats(owner, repo, token = null) {
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };

        if (token) {
            headers['Authorization'] = `token ${token}`;
        }

        try {
            const endpoint = `${this.baseUrl}/repos/${owner}/${repo}`;
            const response = await fetch(endpoint, { headers });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(this.handleError(response.status, error.message));
            }

            const data = await response.json();
            return {
                stars: data.stargazers_count,
                forks: data.forks_count,
                watchers: data.watchers_count,
                open_issues: data.open_issues_count,
                last_updated: new Date(data.updated_at),
                created_at: new Date(data.created_at)
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            throw error;
        }
    }

    filterRepositories(repos, filters) {
        return repos.filter(repo => {
            // Filtre par type (public/privé)
            if (filters.type !== 'all' && repo.private !== (filters.type === 'private')) {
                return false;
            }

            // Filtre par langage
            if (filters.language !== 'all' && repo.language !== filters.language) {
                return false;
            }

            // Filtre par nombre d'étoiles
            if (filters.minStars && repo.stars < filters.minStars) {
                return false;
            }

            // Filtre par date de mise à jour
            if (filters.updatedAfter) {
                const updatedDate = new Date(filters.updatedAfter);
                if (repo.updated_at < updatedDate) {
                    return false;
                }
            }

            // Filtre par date de création
            if (filters.createdAfter) {
                const createdDate = new Date(filters.createdAfter);
                if (repo.created_at < createdDate) {
                    return false;
                }
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