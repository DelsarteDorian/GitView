# Chemin vers l'icône SVG source
$svgPath = "icons\icon.svg"

# Tailles requises
$sizes = @(16, 32, 48, 128)

# Vérifier si ImageMagick est installé
try {
    $null = Get-Command magick -ErrorAction Stop
} catch {
    Write-Host "ImageMagick n'est pas installé. Veuillez l'installer depuis https://imagemagick.org/script/download.php"
    exit 1
}

# Générer les icônes pour chaque taille
foreach ($size in $sizes) {
    $outputPath = "icons\icon-$size.png"
    magick convert -background none -resize "${size}x${size}" $svgPath $outputPath
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Icône ${size}x${size} générée avec succès"
    } else {
        Write-Host "Erreur lors de la génération de l'icône ${size}x${size}"
        exit 1
    }
}

Write-Host "Génération des icônes terminée" 