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
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

// ========== NOMBRES EN LETTRES ==========
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

// ========== FILIGRANE ==========
const addWatermark = (doc, text, options = {}) => {
  const {
    fontSize = 40, color = [200, 200, 200], opacity = 0.10,
    angle = -45, repeat = true, spacing = 100
  } = options;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currentFontSize = doc.internal.getFontSize();
  const currentTextColor = doc.internal.getTextColor();

  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setGState(new doc.GState({ opacity }));

  const diagonal = Math.sqrt(pageWidth * pageWidth + pageHeight * pageHeight);
  const textWidth = doc.getTextWidth(text);
  const numX = Math.ceil((diagonal + textWidth) / (textWidth + spacing));
  const numY = Math.ceil(diagonal / spacing);
  const offsetX = (pageWidth - numX * (textWidth + spacing)) / 2;
  const offsetY = (pageHeight - numY * spacing) / 2;

  if (!repeat) {
    doc.text(text, pageWidth / 2, pageHeight / 2, { align: 'center', angle, baseline: 'middle' });
  } else {
    for (let i = 0; i < numY; i++) {
      for (let j = 0; j < numX; j++) {
        doc.text(text, offsetX + j * (textWidth + spacing), offsetY + i * spacing, {
          angle, baseline: 'middle'
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
    const margins = { left: 12, right: 12, top: 15, bottom: 15 };
    const contentWidth = pageWidth - margins.left - margins.right;
    let y = margins.top;

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

    const entreesVentes = parseFloat(d.entrees_ventes) || 0;
    const entreesReglements = parseFloat(d.entrees_reglements) || 0;
    const entreesAutres = parseFloat(d.entrees_autres) || 0;

    const sortiesAchats = parseFloat(d.sorties_achats) || 0;
    const sortiesFrais = parseFloat(d.sorties_frais) || 0;
    const sortiesSalaires = parseFloat(d.sorties_salaires) || 0;
    const sortiesAutres = parseFloat(d.sorties_autres) || 0;

    // ✅ On récupère les compteurs des détails (sans afficher les lignes)
    const fraisDetails = d.frais_details || [];
    const entreesDetails = d.entrees_details || [];
    const sortiesDetails = d.sorties_details || [];

    const nbFrais = fraisDetails.length;
    const nbEntreesDetails = entreesDetails.length;
    const nbSortiesDetails = sortiesDetails.length;

    const variationEnLettres = nombreEnLettres(Math.abs(variation));
    const isPositive = variation >= 0;

    // Logo
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

    const watermarkText = options.watermark || 'TRÉSORERIE JOURNALIÈRE';
    const watermarkOptions = {
      fontSize: 40, color: [200, 200, 200], opacity: 0.10,
      angle: -45, repeat: true, spacing: 100
    };

    // ========== HELPER : Ajouter une page si nécessaire ==========
    const checkPageBreak = (neededHeight, headerText = null) => {
      if (y + neededHeight > pageHeight - margins.bottom - 5) {
        doc.addPage();
        y = margins.top;
        if (headerText) {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(26, 35, 126);
          doc.text(headerText, margins.left, y);
          y += 2;
          doc.setDrawColor(224, 224, 224);
          doc.line(margins.left, y, pageWidth - margins.right, y);
          y += 5;
        }
      }
    };

    // ================================================================
    // EN-TÊTE
    // ================================================================
    const logoWidth = 24;
    const logoHeight = 24;
    if (logoData) {
      doc.addImage(logoData, 'PNG', margins.left, y, logoWidth, logoHeight);
    }

    const textStartX = margins.left + logoWidth + 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(26, 35, 126);
    doc.text(company.name, textStartX, y + 6);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(84, 110, 122);
    doc.text(`S.A.R.L au capital de ${company.capital}`, textStartX, y + 11.5);
    doc.text(`RC: ${company.rccm} - NIF: ${company.nif}`, textStartX, y + 15.5);
    doc.text(company.address.toUpperCase(), textStartX, y + 19.5);

    const titleX = pageWidth - margins.right;
    const titleY = y + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(26, 35, 126);
    doc.text('TRÉSORERIE', titleX, titleY, { align: 'right' });
    doc.text('JOURNALIÈRE', titleX, titleY + 7.5, { align: 'right' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(84, 110, 122);
    doc.text(`Date: ${dateFormatted}`, titleX, titleY + 17, { align: 'right' });
    doc.text(`Entrepôt: ${warehouse}`, titleX, titleY + 21.5, { align: 'right' });

    y += 30;
    doc.setDrawColor(26, 35, 126);
    doc.setLineWidth(0.4);
    doc.line(margins.left, y, pageWidth - margins.right, y);
    y += 6;

    // ================================================================
    // GRILLE D'INFOS
    // ================================================================
    const gridY = y;
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margins.left, gridY, contentWidth, 16, 2, 2, 'F');
    doc.setDrawColor(224, 224, 224);
    doc.roundedRect(margins.left, gridY, contentWidth, 16, 2, 2, 'S');

    const colWidth = contentWidth / 4;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 144, 156);
    doc.text('DATE', margins.left + 4, gridY + 4);
    doc.text('ENTREPÔT', margins.left + colWidth + 4, gridY + 4);
    doc.text('OPÉRATIONS', margins.left + colWidth * 2 + 4, gridY + 4);
    doc.text('ENTRÉES / SORTIES', margins.left + colWidth * 3 + 4, gridY + 4);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text(dateFormatted, margins.left + 4, gridY + 11);
    doc.text(String(warehouse).substring(0, 20), margins.left + colWidth + 4, gridY + 11);
    doc.text(String(nbOperations), margins.left + colWidth * 2 + 4, gridY + 11);
    doc.text(`${nbEntrees} / ${nbSorties}`, margins.left + colWidth * 3 + 4, gridY + 11);

    y = gridY + 20;

    // ================================================================
    // RÉCAPITULATIF DES FLUX (totaux)
    // ================================================================
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text('RÉCAPITULATIF DES FLUX', margins.left, y);
    y += 1.5;
    doc.setDrawColor(224, 224, 224);
    doc.line(margins.left, y, pageWidth - margins.right, y);
    y += 5;

    const detailY = y;
    const detailBoxHeight = 62;
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margins.left, detailY, contentWidth / 2 - 2, detailBoxHeight, 2, 2, 'F');
    doc.setDrawColor(224, 224, 224);
    doc.roundedRect(margins.left, detailY, contentWidth / 2 - 2, detailBoxHeight, 2, 2, 'S');

    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margins.left + contentWidth / 2 + 2, detailY, contentWidth / 2 - 2, detailBoxHeight, 2, 2, 'F');
    doc.roundedRect(margins.left + contentWidth / 2 + 2, detailY, contentWidth / 2 - 2, detailBoxHeight, 2, 2, 'S');

    // Colonne gauche - Résumé global
    let leftY = detailY + 6;
    const leftLabelX = margins.left + 5;
    const leftValueX = margins.left + contentWidth / 2 - 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(84, 110, 122);
    doc.text('Solde d\'ouverture', leftLabelX, leftY);
    doc.setTextColor(26, 35, 126);
    doc.text(formatCurrency(soldeOuverture), leftValueX, leftY, { align: 'right' });
    leftY += 6;

    doc.setTextColor(84, 110, 122);
    doc.text('Solde de fermeture', leftLabelX, leftY);
    doc.setTextColor(26, 35, 126);
    doc.text(formatCurrency(soldeFermeture), leftValueX, leftY, { align: 'right' });
    leftY += 6;

    doc.setTextColor(84, 110, 122);
    doc.text('Variation', leftLabelX, leftY);
    if (isPositive) doc.setTextColor(34, 197, 94);
    else doc.setTextColor(239, 68, 68);
    doc.text(formatCurrency(variation), leftValueX, leftY, { align: 'right' });
    leftY += 8;

    doc.setDrawColor(224, 224, 224);
    doc.line(leftLabelX, leftY - 3, leftValueX, leftY - 3);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text('Total entrées', leftLabelX, leftY + 1);
    doc.text(formatCurrency(totalEntrees), leftValueX, leftY + 1, { align: 'right' });
    leftY += 6;

    doc.setTextColor(239, 68, 68);
    doc.text('Total sorties', leftLabelX, leftY + 1);
    doc.text(formatCurrency(totalSorties), leftValueX, leftY + 1, { align: 'right' });

    // Colonne droite - Détails (totaux par rubrique)
    let rightY = detailY + 6;
    const rightLabelX = margins.left + contentWidth / 2 + 6;
    const rightValueX = pageWidth - margins.right - 5;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text('ENTRÉES', rightLabelX, rightY);
    rightY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(84, 110, 122);
    doc.setFontSize(7.5);
    doc.text('Ventes', rightLabelX + 3, rightY);
    doc.setTextColor(26, 35, 126);
    doc.text(formatCurrency(entreesVentes), rightValueX, rightY, { align: 'right' });
    rightY += 4.5;

    doc.setTextColor(84, 110, 122);
    doc.text('Règlements', rightLabelX + 3, rightY);
    doc.setTextColor(26, 35, 126);
    doc.text(formatCurrency(entreesReglements), rightValueX, rightY, { align: 'right' });
    rightY += 4.5;

    doc.setTextColor(84, 110, 122);
    doc.text('Autres', rightLabelX + 3, rightY);
    doc.setTextColor(26, 35, 126);
    doc.text(formatCurrency(entreesAutres), rightValueX, rightY, { align: 'right' });
    rightY += 6;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(239, 68, 68);
    doc.setFontSize(7.5);
    doc.text('SORTIES', rightLabelX, rightY);
    rightY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(84, 110, 122);
    doc.text('Achats', rightLabelX + 3, rightY);
    doc.setTextColor(26, 35, 126);
    doc.text(formatCurrency(sortiesAchats), rightValueX, rightY, { align: 'right' });
    rightY += 4.5;

    doc.setTextColor(84, 110, 122);
    doc.text('Frais', rightLabelX + 3, rightY);
    doc.setTextColor(26, 35, 126);
    doc.text(formatCurrency(sortiesFrais), rightValueX, rightY, { align: 'right' });
    rightY += 4.5;

    doc.setTextColor(84, 110, 122);
    doc.text('Salaires', rightLabelX + 3, rightY);
    doc.setTextColor(26, 35, 126);
    doc.text(formatCurrency(sortiesSalaires), rightValueX, rightY, { align: 'right' });
    rightY += 4.5;

    doc.setTextColor(84, 110, 122);
    doc.text('Autres', rightLabelX + 3, rightY);
    doc.setTextColor(26, 35, 126);
    doc.text(formatCurrency(sortiesAutres), rightValueX, rightY, { align: 'right' });

    y = detailY + detailBoxHeight + 8;

    // ================================================================
    // ✅ TABLEAU SYNTHÈSE DES TOTAUX (nouveau — pas de détail)
    // ================================================================
    checkPageBreak(90, 'SYNTHÈSE DES TOTAUX');

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text('SYNTHÈSE DES TOTAUX', margins.left, y);
    y += 1.5;
    doc.setDrawColor(224, 224, 224);
    doc.line(margins.left, y, pageWidth - margins.right, y);
    y += 4;

    // Colonnes : Rubrique | Nb | Montant | Part
    const synthCols = [
      { label: 'RUBRIQUE', width: 78, align: 'left' },
      { label: 'NB', width: 18, align: 'right' },
      { label: 'MONTANT', width: 52, align: 'right' },
      { label: 'PART', width: 38, align: 'right' },
    ];

    // En-tête
    doc.setFillColor(26, 35, 126);
    doc.rect(margins.left, y, contentWidth, 7, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    let scx = margins.left + 2;
    synthCols.forEach((col) => {
      const textX = col.align === 'right' ? scx + col.width - 2 : scx;
      doc.text(col.label, textX, y + 4.5, { align: col.align });
      scx += col.width;
    });
    y += 7;

    // Données
    const totalFlux = (totalEntrees + totalSorties) || 1;
    const lignes = [
      { label: 'ENTRÉES', type: 'section', color: [34, 197, 94] },
      { label: 'Ventes', nb: '-', montant: entreesVentes, color: [34, 197, 94] },
      { label: 'Règlements', nb: '-', montant: entreesReglements, color: [34, 197, 94] },
      { label: 'Autres entrées', nb: '-', montant: entreesAutres, color: [34, 197, 94] },
      { label: 'Sous-total ENTRÉES', nb: nbEntrees, montant: totalEntrees, color: [34, 197, 94], bold: true, highlight: [220, 252, 231] },
      { label: 'SORTIES', type: 'section', color: [239, 68, 68] },
      { label: 'Achats', nb: '-', montant: sortiesAchats, color: [239, 68, 68] },
      { label: 'Frais', nb: nbFrais > 0 ? nbFrais : '-', montant: sortiesFrais, color: [239, 68, 68] },
      { label: 'Salaires', nb: '-', montant: sortiesSalaires, color: [239, 68, 68] },
      { label: 'Autres sorties', nb: nbSortiesDetails > 0 ? nbSortiesDetails : '-', montant: sortiesAutres, color: [239, 68, 68] },
      { label: 'Sous-total SORTIES', nb: nbSorties, montant: totalSorties, color: [239, 68, 68], bold: true, highlight: [254, 226, 226] },
    ];

    let rowIdx = 0;
    lignes.forEach((l) => {
      if (l.type === 'section') {
        // Bandeau de section
        checkPageBreak(10);
        doc.setFillColor(245, 245, 250);
        doc.rect(margins.left, y, contentWidth, 7, 'F');
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(l.color[0], l.color[1], l.color[2]);
        doc.text(l.label, margins.left + 2, y + 5);
        y += 7;
        rowIdx = 0;
        return;
      }

      checkPageBreak(8);
      const rowHeight = 6.5;

      // Fond
      if (l.highlight) {
        doc.setFillColor(l.highlight[0], l.highlight[1], l.highlight[2]);
        doc.rect(margins.left, y, contentWidth, rowHeight, 'F');
      } else if (rowIdx % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(margins.left, y, contentWidth, rowHeight, 'F');
      }

      // Bordure basse
      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.1);
      doc.line(margins.left, y + rowHeight, pageWidth - margins.right, y + rowHeight);

      // Texte
      const fontStyle = l.bold ? 'bold' : 'normal';
      doc.setFont('helvetica', fontStyle);

      // Rubrique
      doc.setFontSize(8);
      doc.setTextColor(33, 33, 33);
      doc.text(String(l.label).substring(0, 40), margins.left + 2, y + 4.5);

      // Nb
      doc.setTextColor(84, 110, 122);
      doc.text(String(l.nb ?? '-'), margins.left + synthCols[0].width + synthCols[1].width - 2, y + 4.5, { align: 'right' });

      // Montant
      doc.setTextColor(l.color[0], l.color[1], l.color[2]);
      doc.text(formatNumber(l.montant), margins.left + synthCols[0].width + synthCols[1].width + synthCols[2].width - 2, y + 4.5, { align: 'right' });

      // Part (%)
      const pct = ((l.montant / totalFlux) * 100).toFixed(1) + '%';
      doc.setTextColor(120, 144, 156);
      doc.text(pct, pageWidth - margins.right - 2, y + 4.5, { align: 'right' });

      y += rowHeight;
      rowIdx++;
    });

    y += 4;

    // ================================================================
    // VARIATION NETTE
    // ================================================================
    checkPageBreak(30);

    const amountBoxHeight = 14;
    doc.setFillColor(232, 234, 246);
    doc.roundedRect(margins.left, y, contentWidth, amountBoxHeight, 2, 2, 'F');
    doc.setDrawColor(197, 202, 233);
    doc.roundedRect(margins.left, y, contentWidth, amountBoxHeight, 2, 2, 'S');

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text('VARIATION NETTE', margins.left + 6, y + 9);

    doc.setFontSize(13);
    if (isPositive) doc.setTextColor(34, 197, 94);
    else doc.setTextColor(239, 68, 68);
    doc.text(formatCurrency(variation), pageWidth - margins.right - 6, y + 9, { align: 'right' });

    y += amountBoxHeight + 4;

    if (Math.abs(variation) > 0) {
      const lettresBoxHeight = 12;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margins.left, y, contentWidth, lettresBoxHeight, 2, 2, 'F');
      doc.setDrawColor(224, 224, 224);
      doc.roundedRect(margins.left, y, contentWidth, lettresBoxHeight, 2, 2, 'S');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(84, 110, 122);
      const variationText = isPositive ? 'Variation positive en lettres :' : 'Variation négative en lettres :';
      doc.text(variationText, margins.left + 5, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 33, 33);
      const lettresStartX = margins.left + 62;
      const lettresAvailWidth = contentWidth - 67;
      let fs = 7.5;
      doc.setFontSize(fs);
      let w = doc.getTextWidth(variationEnLettres);
      while (w > lettresAvailWidth && fs > 5) {
        fs -= 0.5;
        doc.setFontSize(fs);
        w = doc.getTextWidth(variationEnLettres);
      }
      doc.text(variationEnLettres, lettresStartX, y + 8);
      y += lettresBoxHeight + 6;
    }

    // ================================================================
    // ✅ RÉCAPITULATIF DES MOUVEMENTS (compteurs uniquement)
    // ================================================================
    checkPageBreak(35);

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text('RÉCAPITULATIF DES MOUVEMENTS', margins.left, y);
    y += 1.5;
    doc.setDrawColor(224, 224, 224);
    doc.line(margins.left, y, pageWidth - margins.right, y);
    y += 4;

    const recapCols = [
      { label: 'TYPE', width: 90, align: 'left' },
      { label: 'NOMBRE', width: 48, align: 'right' },
      { label: 'MONTANT TOTAL', width: 48, align: 'right' },
    ];

    doc.setFillColor(26, 35, 126);
    doc.rect(margins.left, y, contentWidth, 7, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    let rcx = margins.left + 2;
    recapCols.forEach((col) => {
      const textX = col.align === 'right' ? rcx + col.width - 2 : rcx;
      doc.text(col.label, textX, y + 4.5, { align: col.align });
      rcx += col.width;
    });
    y += 7;

    const recapRows = [
      { label: 'Entrées (toutes sources)', nb: nbEntrees, montant: totalEntrees, color: [34, 197, 94] },
      { label: 'Sorties (toutes sources)', nb: nbSorties, montant: totalSorties, color: [239, 68, 68] },
      { label: 'Total opérations', nb: nbOperations, montant: totalEntrees + totalSorties, color: [26, 35, 126], bold: true, highlight: [232, 234, 246] },
    ];

    let rrowIdx = 0;
    recapRows.forEach((r) => {
      checkPageBreak(8);
      const rowHeight = 7;
      if (r.highlight) {
        doc.setFillColor(r.highlight[0], r.highlight[1], r.highlight[2]);
        doc.rect(margins.left, y, contentWidth, rowHeight, 'F');
      } else if (rrowIdx % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(margins.left, y, contentWidth, rowHeight, 'F');
      }
      doc.setDrawColor(240, 240, 240);
      doc.line(margins.left, y + rowHeight, pageWidth - margins.right, y + rowHeight);

      doc.setFont('helvetica', r.bold ? 'bold' : 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(33, 33, 33);
      doc.text(r.label, margins.left + 2, y + 5);

      doc.setTextColor(84, 110, 122);
      doc.text(String(r.nb), margins.left + recapCols[0].width + recapCols[1].width - 2, y + 5, { align: 'right' });

      doc.setTextColor(r.color[0], r.color[1], r.color[2]);
      doc.text(formatCurrency(r.montant), pageWidth - margins.right - 2, y + 5, { align: 'right' });

      y += rowHeight;
      rrowIdx++;
    });

    y += 6;

    // ================================================================
    // SIGNATURES
    // ================================================================
    checkPageBreak(30);

    const signatureY = y + 6;
    const signatureWidth = 75;

    doc.setDrawColor(66, 66, 66);
    doc.setLineWidth(0.5);
    doc.line(margins.left, signatureY + 5, margins.left + signatureWidth, signatureY + 5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(84, 110, 122);
    doc.text('Signature du responsable', margins.left + signatureWidth / 2, signatureY, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 144, 156);
    doc.text(`Date: ${dateFormatted}`, margins.left + signatureWidth / 2, signatureY + 11, { align: 'center' });

    const sigX2 = pageWidth - margins.right - signatureWidth;
    doc.setDrawColor(66, 66, 66);
    doc.line(sigX2, signatureY + 5, sigX2 + signatureWidth, signatureY + 5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(84, 110, 122);
    doc.text('Signature du comptable', sigX2 + signatureWidth / 2, signatureY, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 144, 156);
    doc.text('SODEPCI', sigX2 + signatureWidth / 2, signatureY + 11, { align: 'center' });

    // ================================================================
    // PIED DE PAGE + FILIGRANE + PAGINATION
    // ================================================================
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Filigrane
      addWatermark(doc, watermarkText, watermarkOptions);

      // Pied de page
      const footerY = pageHeight - margins.bottom;
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.5);
      doc.line(margins.left, footerY - 4, pageWidth - margins.right, footerY - 4);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 144, 156);
      doc.text(company.name, pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Tél: ${company.phone} - RC: ${company.rccm} - NIF: ${company.nif}`, pageWidth / 2, footerY + 4, { align: 'center' });

      // Pagination
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 170);
      doc.text(`Page ${i}/${pageCount}`, pageWidth - margins.right, footerY + 4, { align: 'right' });
    }

    const filename = options.filename || `tresorerie_journaliere_${d.date}_${warehouse}.pdf`;
    doc.save(filename);
    return true;

  } catch (error) {
    console.error('Erreur TresorerieJournalPdf:', error);
    throw error;
  }
};

// ========== TÉLÉCHARGEMENT ==========
export const downloadTresorerieJournalPdf = async (data, warehouseName, filename = null) => {
  try {
    if (!data || typeof data !== 'object') {
      throw new Error('Les données de trésorerie journalière sont invalides');
    }
    const options = {};
    if (filename) options.filename = filename;
    return await TresorerieJournalPdf(data, warehouseName, options);
  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF:', error);
    throw error;
  }
};

export default TresorerieJournalPdf;