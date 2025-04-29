# Guide d'Installation de GitView

## Installation depuis le code source

### Prérequis
- Chrome, Firefox ou Edge (dernière version)
- Node.js (v14 ou supérieur)
- npm ou yarn

### Étapes d'installation

1. Clonez le dépôt :
```bash
git clone https://github.com/yourusername/gitview.git
cd gitview
```

2. Installez les dépendances :
```bash
npm install
```

3. Construisez l'extension :
```bash
npm run build
```

4. Chargez l'extension dans votre navigateur :
   - Chrome :
     1. Allez sur `chrome://extensions/`
     2. Activez le "Mode développeur"
     3. Cliquez sur "Charger l'extension non empaquetée"
     4. Sélectionnez le dossier `dist` généré par la build

   - Firefox :
     1. Allez sur `about:debugging`
     2. Cliquez sur "Ce Firefox"
     3. Cliquez sur "Charger un module temporaire"
     4. Sélectionnez le fichier `manifest.json` dans le dossier `dist`

## Configuration initiale

1. Cliquez sur l'icône de GitView dans votre barre d'outils
2. Cliquez sur "Ajouter un profil"
3. Entrez les informations suivantes :
   - Nom du profil
   - Nom d'utilisateur GitHub
   - Token d'accès personnel (optionnel, pour les dépôts privés)

## Dépannage

### L'extension ne se charge pas
- Vérifiez que vous utilisez la dernière version de votre navigateur
- Assurez-vous que le mode développeur est activé
- Essayez de recharger l'extension

### Problèmes de connexion
- Vérifiez votre connexion Internet
- Assurez-vous que votre token GitHub est valide
- Essayez de vous déconnecter et vous reconnecter

### Problèmes d'affichage
- Essayez de rafraîchir la page
- Vérifiez que JavaScript est activé
- Effacez le cache de votre navigateur

## Support

Si vous rencontrez des problèmes, n'hésitez pas à :
1. Consulter la [documentation](https://github.com/yourusername/gitview/wiki)
2. Ouvrir une [issue](https://github.com/yourusername/gitview/issues)
3. Nous contacter à support@gitview.com 