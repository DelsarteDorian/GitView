class ProfileUtils {
    static async validateGitHubToken(token) {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Token invalide');
            }
            
            const data = await response.json();
            return {
                valid: true,
                username: data.login,
                scope: response.headers.get('x-oauth-scopes')
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    static async exportProfile(profile) {
        const data = {
            version: '1.0',
            profile: {
                ...profile,
                token: await this.encryptToken(profile.token)
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `gitview-profile-${profile.name}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static async importProfile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.version !== '1.0') {
                        throw new Error('Version de fichier non supportée');
                    }
                    
                    const profile = {
                        ...data.profile,
                        token: await this.decryptToken(data.profile.token)
                    };
                    
                    resolve(profile);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
            reader.readAsText(file);
        });
    }

    static async encryptToken(token) {
        // Utiliser l'API de chiffrement du navigateur
        const encoder = new TextEncoder();
        const data = encoder.encode(token);
        const key = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );
        
        return {
            data: Array.from(new Uint8Array(encrypted)),
            iv: Array.from(iv),
            key: await crypto.subtle.exportKey('raw', key)
        };
    }

    static async decryptToken(encrypted) {
        const key = await crypto.subtle.importKey(
            'raw',
            new Uint8Array(encrypted.key),
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(encrypted.iv) },
            key,
            new Uint8Array(encrypted.data)
        );
        
        return new TextDecoder().decode(decrypted);
    }

    static async groupProfiles(profiles, groupName) {
        const groupedProfiles = profiles.map(profile => ({
            ...profile,
            group: groupName
        }));
        
        await chrome.storage.local.set({ profiles: groupedProfiles });
        return groupedProfiles;
    }
} 