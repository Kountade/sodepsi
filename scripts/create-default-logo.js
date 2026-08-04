// scripts/create-default-logo.js
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer un logo SVG avec "SODEPCI"
const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#60a5fa;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#93c5fd;stop-opacity:0.1" />
    </linearGradient>
  </defs>
  
  <!-- Fond -->
  <rect width="512" height="512" rx="100" fill="url(#grad)"/>
  
  <!-- Cercle décoratif -->
  <circle cx="256" cy="256" r="220" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="8"/>
  <circle cx="256" cy="256" r="200" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"/>
  
  <!-- Icône d'eau -->
  <path d="M256 140 
           L320 220 
           C340 250 340 280 320 310 
           L256 380 
           L192 310 
           C172 280 172 250 192 220 
           Z" 
        fill="url(#grad2)" 
        stroke="rgba(255,255,255,0.3)" 
        stroke-width="4"/>
  
  <!-- Goutte d'eau centrale -->
  <path d="M256 180 
           L280 220 
           C290 240 285 260 270 270 
           L256 280 
           L242 270 
           C227 260 222 240 232 220 
           Z" 
        fill="rgba(255,255,255,0.6)"/>
  
  <!-- Texte -->
  <text x="256" y="420" 
        font-size="56" 
        text-anchor="middle" 
        fill="white" 
        font-family="Arial, sans-serif" 
        font-weight="bold" 
        letter-spacing="8">
    SODEPCI
  </text>
  
  <!-- Sous-titre -->
  <text x="256" y="460" 
        font-size="20" 
        text-anchor="middle" 
        fill="#93c5fd" 
        font-family="Arial, sans-serif" 
        letter-spacing="4">
    GESTION
  </text>
</svg>
`;

const outputPath = path.join(__dirname, '..', 'logo.png');

console.log('🎨 Création du logo SODEPCI...');

sharp(Buffer.from(svg))
  .png({
    quality: 95,
    compressionLevel: 9
  })
  .toFile(outputPath)
  .then(() => {
    console.log('✅ Logo SODEPCI créé avec succès !');
    console.log(`📁 Fichier : ${outputPath}`);
    console.log('🔄 Vous pouvez maintenant exécuter : npm run generate-icons');
  })
  .catch(err => {
    console.error('❌ Erreur lors de la création du logo:', err.message);
  });