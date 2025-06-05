# Guide de Contribution

## Introduction
Merci de votre intérêt pour contribuer à GitView ! Ce guide vous aidera à comprendre comment contribuer au projet.

## Prérequis
- Node.js (v14 ou supérieur)
- npm ou yarn
- Git
- Un éditeur de code (VS Code recommandé)

## Installation

1. Clonez le dépôt :
```bash
git clone https://github.com/DelsarteDorian/GitView.git
cd GitView
```

2. Installez les dépendances :
```bash
npm install
```

3. Lancez le mode développement :
```bash
npm run dev
```

## Structure du Projet
```
GitView/
├── docs/               # Documentation
├── js/                 # Code source JavaScript
├── styles/            # Fichiers CSS
├── manifest.json      # Configuration de l'extension
└── popup.html         # Interface utilisateur
```

## Conventions de Code

### JavaScript
- Utilisez ES6+ features
- Suivez les conventions Airbnb
- Documentez vos fonctions avec JSDoc
- Écrivez des tests unitaires

### CSS
- Utilisez BEM pour le nommage des classes
- Préférez les variables CSS pour les thèmes
- Évitez les sélecteurs trop spécifiques

### Git
- Branches : `feature/`, `fix/`, `docs/`
- Commits : Suivez le format conventional commits
- PR : Incluez une description claire

## Processus de Contribution

1. **Issue**
   - Vérifiez les issues existantes
   - Créez une nouvelle issue si nécessaire
   - Décrivez clairement le problème/amélioration

2. **Développement**
   - Créez une branche depuis `main`
   - Développez votre fonctionnalité
   - Ajoutez des tests
   - Mettez à jour la documentation

3. **Pull Request**
   - Assurez-vous que les tests passent
   - Mettez à jour la documentation
   - Décrivez vos changements
   - Référencez les issues concernées

## Tests

### Tests Unitaires
```bash
npm run test
```

### Tests E2E
```bash
npm run test:e2e
```

## Documentation

### Mise à Jour de la Documentation
- Guide utilisateur : `docs/USER_GUIDE.md`
- API : `docs/API.md`
- Changelog : `CHANGELOG.md`

### Format
- Utilisez Markdown
- Incluez des exemples de code
- Ajoutez des captures d'écran si nécessaire

## Déploiement

1. Versionnez votre code :
```bash
npm version patch|minor|major
```

2. Construisez l'extension :
```bash
npm run build
```

3. Testez la version de production :
```bash
npm run test:prod
```

## Support

### Communication
- Issues GitHub
- Discussions GitHub
- Email : support@gitview.com

### Ressources
- [Documentation API](docs/API.md)
- [Guide de Style](docs/STYLE_GUIDE.md)
- [FAQ](docs/FAQ.md)

## Licence
Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails. 