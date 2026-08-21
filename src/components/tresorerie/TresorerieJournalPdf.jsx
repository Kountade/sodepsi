// src/components/tresorerie/TresorerieJournalPdf.js
import jsPDF from 'jspdf';
import logoSvg from '../../assets/logo.svg';

// ========== FONCTIONS DE FORMATAGE ==========
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const formatCurrency = (num) => `${formatNumber(num)} FCFA`;

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

// ========== FONCTION POUR ÉCRIRE LES NOMBRES EN LETTRES ==========
const nombreEnLettres = (montant) => {
  const unite = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const dizaine = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  const centaine = ['', 'cent', 'deux cents', 'trois cents', 'quatre cents', 'cinq cents', 'six cents', 'sept cents', 'huit cents', 'neuf cents'];

  const sousBloc = (n) => {
    if (n === 0) return '';
    let lettres = '';
    const cents = Math.floor(n / 100);
    const reste = n % 100;
    if (cents > 0) {
      lettres += centaine[cents];
      if (reste > 0) lettres += ' ';
    }
    if (reste > 0) {
      if (reste < 10) lettres += unite[reste];
      else if (reste < 20) {
        const u = reste - 10;
        if (u === 0) lettres += 'dix';
        else if (u === 1) lettres += 'onze';
        else if (u === 2) lettres += 'douze';
        else if (u === 3) lettres += 'treize';
        else if (u === 4) lettres += 'quatorze';
        else if (u === 5) lettres += 'quinze';
        else if (u === 6) lettres += 'seize';
        else lettres += dizaine[1] + (u ? '-' + unite[u] : '');
      } else {
        const d = Math.floor(reste / 10);
        const u = reste % 10;
        if (d === 7 || d === 9) {
          lettres += dizaine[d - 1] + '-' + (u === 0 ? '' : (u === 1 ? 'onze' : unite[u + 10]));
        } else {
          lettres += dizaine[d];
          if (u === 1 && d !== 8) lettres += ' et un';
          else if (u > 0) lettres += '-' + unite[u];
        }
      }
    }
    return lettres.trim();
  };

  const milliers = Math.floor(montant / 1000);
  const resteMilliers = montant % 1000;
  let result = '';
  if (milliers > 0) {
    if (milliers === 1) result += 'mille';
    else result += sousBloc(milliers) + ' mille';
    if (resteMilliers > 0) result += ' ';
  }
  if (resteMilliers > 0) result += sousBloc(resteMilliers);
  if (result === '') result = 'zéro';
  return result.charAt(0).toUpperCase() + result.slice(1) + ' Francs CFA';
};

// ========== FONCTION POUR AJOUTER UN FILIGRANE OBLIQUE ==========
const addWatermark = (doc, text, options = {}) => {
  const {
    fontSize = 40,
    color = [200, 200, 200],
    opacity = 0.10,
    angle = -45,
    repeat = true,
    spacing = 100
  } = options;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const currentFontSize = doc.internal.getFontSize();
  const currentTextColor = doc.internal.getTextColor();
  
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(color[0], color[1], color[2]);
  
  doc.setGState(new doc.GState({ opacity: opacity }));
  
  const diagonal = Math.sqrt(pageWidth * pageWidth + pageHeight * pageHeight);
  const textWidth = doc.getTextWidth(text);
  
  const numX = Math.ceil((diagonal + textWidth) / (textWidth + spacing));
  const numY = Math.ceil(diagonal / spacing);
  
  const offsetX = (pageWidth - numX * (textWidth + spacing)) / 2;
  const offsetY = (pageHeight - numY * spacing) / 2;
  
  if (!repeat) {
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    doc.text(text, centerX, centerY, { 
      align: 'center',
      angle: angle,
      baseline: 'middle'
    });
  } else {
    for (let i = 0; i < numY; i++) {
      for (let j = 0; j < numX; j++) {
        const x = offsetX + j * (textWidth + spacing);
        const y = offsetY + i * spacing;
        doc.text(text, x, y, {
          angle: angle,
          baseline: 'middle'
        });
      }
    }
  }
  
  doc.setFontSize(currentFontSize);
  doc.setTextColor(currentTextColor[0], currentTextColor[1], currentTextColor[2]);
  doc.setGState(new doc.GState({ opacity: 1 }));
};

// ========== COMPOSANT PRINCIPAL ==========
const TresorerieJournalPdf = async (data, warehouseName, options = {}) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Données de trésorerie journalière invalides');
  }

  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margins = { left: 15, right: 15, top: 18, bottom: 18 };
    const contentWidth = pageWidth - margins.left - margins.right;
    let y = margins.top;

    // ========== INFORMATIONS DE L'ENTREPRISE ==========
    const company = {
      name: 'BOUTIQUE STATION SODEPCI DE PARA',
      address: 'Station SODEPCI, Para, Côte d\'Ivoire',
      phone: '07 47 55 71 69 / 07 08 42 96 09',
      rccm: '2025/CI/001',
      nif: '123456789',
      capital: '100 000 000'
    };

    const d = data || {};
    const warehouse = warehouseName || d.warehouse || 'Entrepôt';
    const dateFormatted = formatDate(d.date);
    const soldeOuverture = parseFloat(d.solde_ouverture) || 0;
    const soldeFermeture = parseFloat(d.solde_fermeture) || 0;
    const variation = parseFloat(d.variation) || 0;
    const totalEntrees = parseFloat(d.total_entrees) || 0;
    const totalSorties = parseFloat(d.total_sorties) || 0;
    const nbOperations = d.nb_operations || 0;
    const nbEntrees = d.nb_entrees || 0;
    const nbSorties = d.nb_sorties || 0;

    // Détails des entrées
    const entreesVentes = parseFloat(d.entrees_ventes) || 0;
    const entreesReglements = parseFloat(d.entrees_reglements) || 0;
    const entreesAutres = parseFloat(d.entrees_autres) || 0;

    // Détails des sorties
    const sortiesAchats = parseFloat(d.sorties_achats) || 0;
    const sortiesFrais = parseFloat(d.sorties_frais) || 0;
    const sortiesSalaires = parseFloat(d.sorties_salaires) || 0;
    const sortiesAutres = parseFloat(d.sorties_autres) || 0;

    const variationEnLettres = nombreEnLettres(Math.abs(variation));
    const isPositive = variation >= 0;

    // ========== CHARGEMENT DU LOGO ==========
    const loadLogo = (src) => new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
    let logoData = null;
    try { logoData = await loadLogo(logoSvg); } catch { /* ignore */ }

    // Filigrane
    const watermarkText = options.watermark || 'TRÉSORERIE JOURNALIÈRE';
    const watermarkOptions = {
      fontSize: options.watermarkSize || 40,
      color: options.watermarkColor || [200, 200, 200],
      opacity: options.watermarkOpacity || 0.10,
      angle: options.watermarkAngle || -45,
      repeat: options.watermarkRepeat !== undefined ? options.watermarkRepeat : true,
      spacing: options.watermarkSpacing || 100
    };

    // ================================================================
    // EN-TÊTE - PARTIE GAUCHE (Logo + Nom entreprise)
    // ================================================================
    const logoWidth = 26;
    const logoHeight = 26;
    
    if (logoData) {
      doc.addImage(logoData, 'PNG', margins.left, y, logoWidth, logoHeight);
    }

    const textStartX = margins.left + logoWidth + 7;
    
    // ---- NOM DE L'ENTREPRISE (sur une ligne) ----
    const companyName = company.name;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(26, 35, 126);
    doc.text(companyName, textStartX, y + 6);

    // ---- SOUS-TITRES (sur plusieurs lignes) ----
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(84, 110, 122);
    doc.text(`S.A.R.L au capital de ${company.capital}`, textStartX, y + 12);
    doc.text(`RC: ${company.rccm} - NIF: ${company.nif}`, textStartX, y + 16.5);
    doc.text(company.address.toUpperCase(), textStartX, y + 21);
    
    // ================================================================
    // EN-TÊTE - PARTIE DROITE (Titre sur 2 lignes)
    // ================================================================
    const titleX = pageWidth - margins.right;
    const titleY = y + 4;
    
    // Première ligne : "TRÉSORERIE"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(26, 35, 126);
    doc.text('TRÉSORERIE', titleX, titleY, { align: 'right' });
    
    // Deuxième ligne : "JOURNALIÈRE"
    doc.setFontSize(16);
    doc.text('JOURNALIÈRE', titleX, titleY + 8, { align: 'right' });
    
    // ---- DATE ET ENTREPÔT ----
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(84, 110, 122);
    doc.text(`Date: ${dateFormatted}`, titleX, titleY + 18, { align: 'right' });
    doc.text(`Entrepôt: ${warehouse}`, titleX, titleY + 23, { align: 'right' });

    y += 32;
    doc.setDrawColor(26, 35, 126);
    doc.setLineWidth(0.4);
    doc.line(margins.left, y, pageWidth - margins.right, y);
    y += 8;

    // ================================================================
    // GRILLE D'INFORMATIONS GÉNÉRALES
    // ================================================================
    const gridY = y;
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margins.left, gridY, contentWidth, 18, 2, 2, 'F');
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.5);
    doc.roundedRect(margins.left, gridY, contentWidth, 18, 2, 2, 'S');

    const colWidth = contentWidth / 4;
    const gridX1 = margins.left;
    const gridX2 = margins.left + colWidth;
    const gridX3 = margins.left + colWidth * 2;
    const gridX4 = margins.left + colWidth * 3;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 144, 156);
    
    doc.text('DATE', gridX1 + 4, gridY + 4.5);
    doc.text('ENTREPÔT', gridX2 + 4, gridY + 4.5);
    doc.text('OPÉRATIONS', gridX3 + 4, gridY + 4.5);
    doc.text('ENTRÉES / SORTIES', gridX4 + 4, gridY + 4.5);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text(dateFormatted, gridX1 + 4, gridY + 12);
    doc.text(warehouse, gridX2 + 4, gridY + 12);
    doc.text(String(nbOperations), gridX3 + 4, gridY + 12);
    doc.text(`${nbEntrees} / ${nbSorties}`, gridX4 + 4, gridY + 12);

    y = gridY + 22;

    // ================================================================
    // RÉCAPITULATIF DES FLUX
    // ================================================================
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text('RÉCAPITULATIF DES FLUX', margins.left, y);
    y += 2;
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.5);
    doc.line(margins.left, y, pageWidth - margins.right, y);
    y += 6;

    const detailY = y;
    const detailBoxHeight = 180;
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margins.left, detailY, contentWidth, detailBoxHeight, 2, 2, 'F');
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.5);
    doc.roundedRect(margins.left, detailY, contentWidth, detailBoxHeight, 2, 2, 'S');

    let detailRowY = detailY + 4;
    const detailLabelX = margins.left + 6;
    const detailValueX = margins.left + 80;

    // Fonction pour afficher une ligne de détail
    const addDetailRow = (label, value, color = null) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(84, 110, 122);
      doc.text(label, detailLabelX, detailRowY);
      doc.setFont('helvetica', 'normal');
      if (color) {
        doc.setTextColor(color[0], color[1], color[2]);
      } else {
        doc.setTextColor(26, 35, 126);
      }
      doc.text(value, detailValueX, detailRowY);
      detailRowY += 6;
      
      // Ligne de séparation
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.3);
      doc.line(margins.left + 4, detailRowY - 3, pageWidth - margins.right - 4, detailRowY - 3);
    };

    // Ligne de sous-détail
    const addSubDetailRow = (label, value) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 144, 156);
      doc.text(label, detailLabelX + 10, detailRowY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(26, 35, 126);
      doc.text(value, detailValueX, detailRowY);
      detailRowY += 5.5;
    };

    // Solde d'ouverture
    addDetailRow('Solde d\'ouverture', formatCurrency(soldeOuverture));
    
    // Solde de fermeture
    addDetailRow('Solde de fermeture', formatCurrency(soldeFermeture));
    
    // Variation
    const variationColor = isPositive ? [34, 197, 94] : [239, 68, 68];
    addDetailRow('Variation', formatCurrency(variation), variationColor);
    
    // Total entrées
    addDetailRow('Total entrées', formatCurrency(totalEntrees), [34, 197, 94]);
    
    // Sous-détails entrées
    addSubDetailRow('- Ventes', formatCurrency(entreesVentes));
    addSubDetailRow('- Règlements', formatCurrency(entreesReglements));
    addSubDetailRow('- Autres entrées', formatCurrency(entreesAutres));
    
    detailRowY += 2;
    
    // Total sorties
    addDetailRow('Total sorties', formatCurrency(totalSorties), [239, 68, 68]);
    
    // Sous-détails sorties
    addSubDetailRow('- Achats', formatCurrency(sortiesAchats));
    addSubDetailRow('- Frais', formatCurrency(sortiesFrais));
    addSubDetailRow('- Salaires', formatCurrency(sortiesSalaires));
    addSubDetailRow('- Autres sorties', formatCurrency(sortiesAutres));

    y = detailY + detailBoxHeight + 8;

    // ================================================================
    // VARIATION NETTE
    // ================================================================
    const amountBoxHeight = 18;
    doc.setFillColor(232, 234, 246);
    doc.roundedRect(margins.left, y, contentWidth, amountBoxHeight, 2, 2, 'F');
    doc.setDrawColor(197, 202, 233);
    doc.setLineWidth(0.5);
    doc.roundedRect(margins.left, y, contentWidth, amountBoxHeight, 2, 2, 'S');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text('VARIATION NETTE', margins.left + 8, y + 12);

    const variationFormatted = formatCurrency(variation);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(variationColor[0], variationColor[1], variationColor[2]);
    doc.text(variationFormatted, pageWidth - margins.right - 8, y + 12, { align: 'right' });

    y += amountBoxHeight + 6;

    // ================================================================
    // MONTANT EN TOUTES LETTRES
    // ================================================================
    if (Math.abs(variation) > 0) {
      const lettresBoxHeight = 14;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margins.left, y, contentWidth, lettresBoxHeight, 2, 2, 'F');
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.roundedRect(margins.left, y, contentWidth, lettresBoxHeight, 2, 2, 'S');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(84, 110, 122);
      const variationText = isPositive ? 'Variation positive en toutes lettres :' : 'Variation négative en toutes lettres :';
      doc.text(variationText, margins.left + 6, y + 9);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);

      const lettresStartX = margins.left + 70;
      const lettresAvailableWidth = contentWidth - 75;

      let lettresFontSize = 8;
      doc.setFontSize(lettresFontSize);
      let lettresWidth = doc.getTextWidth(variationEnLettres);

      while (lettresWidth > lettresAvailableWidth && lettresFontSize > 5) {
        lettresFontSize -= 0.5;
        doc.setFontSize(lettresFontSize);
        lettresWidth = doc.getTextWidth(variationEnLettres);
      }

      if (lettresWidth > lettresAvailableWidth) {
        const splitLettres = doc.splitTextToSize(variationEnLettres, lettresAvailableWidth);
        doc.text(splitLettres, lettresStartX, y + 5);
      } else {
        doc.text(variationEnLettres, lettresStartX, y + 9);
      }

      y += lettresBoxHeight + 8;
    }

    // ================================================================
    // SIGNATURES
    // ================================================================
    const signatureY = y + 8;
    const signatureWidth = 80;
    const signatureX1 = margins.left;
    const signatureX2 = pageWidth - margins.right - signatureWidth;

    doc.setDrawColor(66, 66, 66);
    doc.setLineWidth(0.5);
    doc.line(signatureX1, signatureY + 5, signatureX1 + signatureWidth, signatureY + 5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(84, 110, 122);
    doc.text('Signature du responsable', signatureX1 + (signatureWidth / 2), signatureY, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 144, 156);
    doc.text(`Date: ${dateFormatted}`, signatureX1 + (signatureWidth / 2), signatureY + 12, { align: 'center' });

    doc.line(signatureX2, signatureY + 5, signatureX2 + signatureWidth, signatureY + 5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(84, 110, 122);
    doc.text('Signature du comptable', signatureX2 + (signatureWidth / 2), signatureY, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 144, 156);
    doc.text('SODEPCI', signatureX2 + (signatureWidth / 2), signatureY + 12, { align: 'center' });

    y = signatureY + 20;

    // ================================================================
    // PIED DE PAGE
    // ================================================================
    const footerY = pageHeight - margins.bottom - 10;
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.5);
    doc.line(margins.left, footerY - 5, pageWidth - margins.right, footerY - 5);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 144, 156);
    doc.text(company.name, pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Tél: ${company.phone}`, pageWidth / 2, footerY + 4, { align: 'center' });
    doc.text(`RC: ${company.rccm} - NIF: ${company.nif}`, pageWidth / 2, footerY + 8, { align: 'center' });

    // ================================================================
    // NUMÉROTATION DES PAGES ET FILIGRANE FINAL
    // ================================================================
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addWatermark(doc, watermarkText, watermarkOptions);
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 170);
      doc.text(`Page ${i}/${pageCount}`, pageWidth - margins.right, pageHeight - margins.bottom, { align: 'right' });
    }

    const filename = options.filename || `tresorerie_journaliere_${d.date}_${warehouse}.pdf`;
    doc.save(filename);
    return true;

  } catch (error) {
    console.error('Erreur TresorerieJournalPdf:', error);
    throw error;
  }
};

// ========== FONCTION DE TÉLÉCHARGEMENT ==========
export const downloadTresorerieJournalPdf = async (data, warehouseName, filename = null) => {
  try {
    if (!data || typeof data !== 'object') {
      throw new Error('Les données de trésorerie journalière sont invalides');
    }

    const options = {};
    if (filename) options.filename = filename;
    
    const result = await TresorerieJournalPdf(data, warehouseName, options);
    return result;
  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF de trésorerie journalière :', error);
    throw error;
  }
};

// Export par défaut
export default TresorerieJournalPdf;