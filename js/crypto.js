class CryptoManager {
    constructor() {
        this.algorithm = {
            name: 'AES-GCM',
            length: 256
        };
        this.ivLength = 12;
    }

    async generateKey() {
        return await window.crypto.subtle.generateKey(
            this.algorithm,
            true,
            ['encrypt', 'decrypt']
        );
    }

    async encrypt(text, key) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const iv = window.crypto.getRandomValues(new Uint8Array(this.ivLength));
        
        const encryptedContent = await window.crypto.subtle.encrypt(
            {
                name: this.algorithm.name,
                iv: iv
            },
            key,
            data
        );

        const encryptedArray = new Uint8Array(encryptedContent);
        const result = new Uint8Array(iv.length + encryptedArray.length);
        result.set(iv);
        result.set(encryptedArray, iv.length);

        return btoa(String.fromCharCode.apply(null, result));
    }

    async decrypt(encryptedText, key) {
        const encryptedData = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
        const iv = encryptedData.slice(0, this.ivLength);
        const data = encryptedData.slice(this.ivLength);

        const decryptedContent = await window.crypto.subtle.decrypt(
            {
                name: this.algorithm.name,
                iv: iv
            },
            key,
            data
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedContent);
    }

    async saveEncryptedToken(token, profileName) {
        const key = await this.generateKey();
        const encryptedToken = await this.encrypt(token, key);
        
        // Convertir la clé en format exportable
        const exportedKey = await window.crypto.subtle.exportKey('raw', key);
        const keyString = btoa(String.fromCharCode.apply(null, new Uint8Array(exportedKey)));

        // Sauvegarder dans chrome.storage
        await chrome.storage.local.set({
            [`profile_${profileName}`]: {
                token: encryptedToken,
                key: keyString
            }
        });
    }

    async getDecryptedToken(profileName) {
        const data = await chrome.storage.local.get(`profile_${profileName}`);
        if (!data[`profile_${profileName}`]) return null;

        const { token, key } = data[`profile_${profileName}`];
        
        // Importer la clé
        const keyData = Uint8Array.from(atob(key), c => c.charCodeAt(0));
        const importedKey = await window.crypto.subtle.importKey(
            'raw',
            keyData,
            this.algorithm,
            false,
            ['decrypt']
        );

        return await this.decrypt(token, importedKey);
    }
}

const cryptoManager = new CryptoManager(); 