const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Créer un dossier dist si nécessaire
const distDir = path.join(__dirname, 'dist-edge');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Créer un fichier zip
const output = fs.createWriteStream(path.join(distDir, 'gitview-edge.zip'));
const archive = archiver('zip', {
    zlib: { level: 9 }
});

// Gérer les erreurs
output.on('close', () => {
    console.log('Package créé avec succès !');
    console.log(`Taille totale : ${archive.pointer()} bytes`);
});

archive.on('error', (err) => {
    throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Vérifier que tous les fichiers nécessaires existent
const requiredFiles = [
    'popup.html',
    'popup.js',
    'popup.css',
    'background.js',
    'edge-manifest.json'
];

const requiredIcons = [
    'icons/icon-16.png',
    'icons/icon-32.png',
    'icons/icon-48.png',
    'icons/icon-128.png'
];

// Vérifier les fichiers requis
requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        console.error(`Erreur: Le fichier ${file} n'existe pas`);
        process.exit(1);
    }
});

// Vérifier les icônes requises
requiredIcons.forEach(icon => {
    if (!fs.existsSync(icon)) {
        console.error(`Erreur: L'icône ${icon} n'existe pas`);
        process.exit(1);
    }
});

// Ajouter les fichiers nécessaires
archive.directory('icons/', 'icons');
archive.file('popup.html', { name: 'popup.html' });
archive.file('popup.js', { name: 'popup.js' });
archive.file('popup.css', { name: 'popup.css' });
archive.file('background.js', { name: 'background.js' });
archive.file('edge-manifest.json', { name: 'manifest.json' });

// Finaliser l'archive
archive.finalize(); 