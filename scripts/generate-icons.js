// scripts/generate-icons.js
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tailles d'icônes à générer (incluant toutes les tailles nécessaires)
const sizes = [16, 32, 57, 60, 72, 76, 96, 120, 128, 144, 152, 167, 180, 192, 256, 384, 512];

// Chemin vers votre logo source
const sourceImage = path.join(__dirname, '..', 'logo.png');

// Dossier de destination
const outputDir = path.join(__dirname, '..', 'public', 'icons');

// Vérifier si le dossier source existe
if (!fs.existsSync(sourceImage)) {
  console.error('❌ Logo source non trouvé !');
  console.log(`📁 Veuillez placer votre logo à : ${sourceImage}`);
  console.log('💡 Exécutez d\'abord: npm run create-logo');
  process.exit(1);
}

// Créer le dossier de destination s'il n'existe pas
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`📁 Dossier créé : ${outputDir}`);
}

console.log('🎨 Génération des icônes SODEPCI en cours...');
console.log('📝 Taille des icônes:', sizes.join(', '));

// Fonction pour générer une icône
async function generateIcon(size) {
  const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
  
  try {
    await sharp(sourceImage)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png({
        quality: 90,
        compressionLevel: 9
      })
      .toFile(outputPath);
    
    console.log(`✅ Icon ${size}x${size} générée`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur pour ${size}x${size}:`, error.message);
    return false;
  }
}

// Générer toutes les icônes en parallèle
async function generateAllIcons() {
  const results = await Promise.all(sizes.map(size => generateIcon(size)));
  
  const successCount = results.filter(r => r).length;
  const failCount = results.length - successCount;
  
  console.log(`\n✨ Génération terminée !`);
  console.log(`✅ ${successCount} icônes générées`);
  if (failCount > 0) {
    console.log(`❌ ${failCount} échecs`);
  }
  
  // Générer favicon.ico (format spécial)
  try {
    const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
    await sharp(sourceImage)
      .resize(32, 32)
      .toFile(faviconPath);
    console.log('✅ favicon.ico généré');
  } catch (error) {
    console.error('❌ Erreur favicon.ico:', error.message);
  }
  
  // Générer apple-touch-icon.png
  try {
    const appleTouchPath = path.join(process.cwd(), 'public', 'apple-touch-icon.png');
    await sharp(sourceImage)
      .resize(180, 180)
      .toFile(appleTouchPath);
    console.log('✅ apple-touch-icon.png généré');
  } catch (error) {
    console.error('❌ Erreur apple-touch-icon:', error.message);
  }
  
  // Générer og-image.png pour les réseaux sociaux
  try {
    const ogPath = path.join(process.cwd(), 'public', 'og-image.png');
    await sharp(sourceImage)
      .resize(1200, 630, {
        fit: 'contain',
        background: { r: 30, g: 64, b: 175, alpha: 1 }
      })
      .toFile(ogPath);
    console.log('✅ og-image.png généré');
  } catch (error) {
    console.error('❌ Erreur og-image:', error.message);
  }
}

generateAllIcons();