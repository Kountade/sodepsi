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

    const fraisDetails = d.frais_details || [];
    const entreesDetails = d.entrees_details || [];
    const sortiesDetails = d.sorties_details || [];

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
    // RÉCAPITULATIF
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

    // Colonne droite - Détails
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

    y = detailY + detailBoxHeight + 6;

    // ================================================================
    // VARIATION NETTE
    // ================================================================
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
    // ✅ TABLEAU DÉTAIL DES FRAIS
    // ================================================================
    if (fraisDetails.length > 0) {
      checkPageBreak(25, 'DÉTAIL DES FRAIS');
      
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68);
      doc.text(`DÉTAIL DES FRAIS (${fraisDetails.length})`, margins.left, y);
      y += 1.5;
      doc.setDrawColor(239, 68, 68);
      doc.setLineWidth(0.3);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 4;

      // Colonnes (total = contentWidth = 186mm)
      const fraisCols = [
        { label: 'Réf. Frais', width: 22 },
        { label: 'Mouvement', width: 22 },
        { label: 'Titre / Libellé', width: 48 },
        { label: 'Catégorie', width: 22 },
        { label: 'Bénéficiaire', width: 28 },
        { label: 'Mode', width: 22 },
        { label: 'Montant', width: 22 },
      ];
      // Total = 186

      // En-tête tableau
      doc.setFillColor(239, 68, 68);
      doc.rect(margins.left, y, contentWidth, 6, 'F');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      let cx = margins.left + 1.5;
      fraisCols.forEach((col, i) => {
        const align = i === fraisCols.length - 1 ? 'right' : 'left';
        const textX = align === 'right' ? cx + col.width - 1.5 : cx;
        doc.text(col.label, textX, y + 4, { align });
        cx += col.width;
      });
      y += 6;

      // Lignes
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      let rowIdx = 0;
      fraisDetails.forEach((f) => {
        checkPageBreak(8, 'DÉTAIL DES FRAIS (suite)');
        
        const rowHeight = 6;
        if (rowIdx % 2 === 0) {
          doc.setFillColor(252, 252, 252);
          doc.rect(margins.left, y, contentWidth, rowHeight, 'F');
        }
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.1);
        doc.line(margins.left, y + rowHeight, pageWidth - margins.right, y + rowHeight);

        const rowData = [
          String(f.source_reference || '-').substring(0, 12),
          String(f.mouvement_reference || '-').substring(0, 12),
          String(f.titre || f.libelle || '-').substring(0, 32),
          String(f.categorie || '-').substring(0, 14),
          String(f.beneficiaire || '-').substring(0, 18),
          String(f.mode_paiement || '-').substring(0, 14),
          formatNumber(f.montant),
        ];

        cx = margins.left + 1.5;
        rowData.forEach((val, i) => {
          const col = fraisCols[i];
          const isLast = i === fraisCols.length - 1;
          const align = isLast ? 'right' : 'left';
          const textX = align === 'right' ? cx + col.width - 1.5 : cx;
          
          if (isLast) doc.setTextColor(239, 68, 68);
          else doc.setTextColor(33, 33, 33);
          
          doc.text(val, textX, y + 4, { align });
          cx += col.width;
        });
        y += rowHeight;
        rowIdx++;
      });

      // Ligne total
      doc.setFillColor(254, 226, 226);
      doc.rect(margins.left, y, contentWidth, 6.5, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68);
      doc.text('TOTAL FRAIS', margins.left + 1.5, y + 4.5);
      doc.text(formatCurrency(sortiesFrais), pageWidth - margins.right - 1.5, y + 4.5, { align: 'right' });
      y += 6.5 + 6;
    }

    // ================================================================
    // ✅ TABLEAU DÉTAIL DES ENTRÉES
    // ================================================================
    if (entreesDetails.length > 0) {
      checkPageBreak(25, 'DÉTAIL DES ENTRÉES');
      
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text(`DÉTAIL DES ENTRÉES (${entreesDetails.length})`, margins.left, y);
      y += 1.5;
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.3);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 4;

      const entCols = [
        { label: 'Référence', width: 26 },
        { label: 'Libellé', width: 55 },
        { label: 'Source', width: 25 },
        { label: 'Mode', width: 24 },
        { label: 'Destination', width: 30 },
        { label: 'Heure', width: 14 },
        { label: 'Montant', width: 12 },
      ];
      // Total = 186

      doc.setFillColor(34, 197, 94);
      doc.rect(margins.left, y, contentWidth, 6, 'F');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      let cx = margins.left + 1.5;
      entCols.forEach((col, i) => {
        const align = i === entCols.length - 1 ? 'right' : 'left';
        const textX = align === 'right' ? cx + col.width - 1.5 : cx;
        doc.text(col.label, textX, y + 4, { align });
        cx += col.width;
      });
      y += 6;

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      let rowIdx = 0;
      entreesDetails.forEach((e) => {
        checkPageBreak(8, 'DÉTAIL DES ENTRÉES (suite)');
        
        const rowHeight = 6;
        if (rowIdx % 2 === 0) {
          doc.setFillColor(252, 252, 252);
          doc.rect(margins.left, y, contentWidth, rowHeight, 'F');
        }
        doc.setDrawColor(240, 240, 240);
        doc.line(margins.left, y + rowHeight, pageWidth - margins.right, y + rowHeight);

        const dest = e.caisse && e.caisse !== '-' ? e.caisse : (e.compte_bancaire && e.compte_bancaire !== '-' ? e.compte_bancaire : '-');
        const heure = e.date_mouvement ? String(e.date_mouvement).split(' ')[1] || '-' : '-';

        const rowData = [
          String(e.mouvement_reference || '-').substring(0, 14),
          String(e.libelle || '-').substring(0, 38),
          String(e.source_reference || '-').substring(0, 14),
          String(e.mode_paiement || '-').substring(0, 16),
          String(dest).substring(0, 20),
          heure.substring(0, 5),
          formatNumber(e.montant),
        ];

        cx = margins.left + 1.5;
        rowData.forEach((val, i) => {
          const col = entCols[i];
          const isLast = i === entCols.length - 1;
          const align = isLast ? 'right' : 'left';
          const textX = align === 'right' ? cx + col.width - 1.5 : cx;
          
          if (isLast) doc.setTextColor(34, 197, 94);
          else doc.setTextColor(33, 33, 33);
          
          doc.text(val, textX, y + 4, { align });
          cx += col.width;
        });
        y += rowHeight;
        rowIdx++;
      });

      doc.setFillColor(220, 252, 231);
      doc.rect(margins.left, y, contentWidth, 6.5, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text('TOTAL ENTRÉES', margins.left + 1.5, y + 4.5);
      doc.text(formatCurrency(totalEntrees), pageWidth - margins.right - 1.5, y + 4.5, { align: 'right' });
      y += 6.5 + 6;
    }

    // ================================================================
    // ✅ TABLEAU DÉTAIL DES AUTRES SORTIES
    // ================================================================
    if (sortiesDetails.length > 0) {
      checkPageBreak(25, 'DÉTAIL DES AUTRES SORTIES');
      
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68);
      doc.text(`DÉTAIL DES AUTRES SORTIES (${sortiesDetails.length})`, margins.left, y);
      y += 1.5;
      doc.setDrawColor(239, 68, 68);
      doc.line(margins.left, y, pageWidth - margins.right, y);
      y += 4;

      const sortCols = [
        { label: 'Référence', width: 26 },
        { label: 'Libellé', width: 52 },
        { label: 'Type source', width: 26 },
        { label: 'Mode', width: 24 },
        { label: 'Source', width: 30 },
        { label: 'Heure', width: 14 },
        { label: 'Montant', width: 14 },
      ];

      doc.setFillColor(239, 68, 68);
      doc.rect(margins.left, y, contentWidth, 6, 'F');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      let cx = margins.left + 1.5;
      sortCols.forEach((col, i) => {
        const align = i === sortCols.length - 1 ? 'right' : 'left';
        const textX = align === 'right' ? cx + col.width - 1.5 : cx;
        doc.text(col.label, textX, y + 4, { align });
        cx += col.width;
      });
      y += 6;

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      let rowIdx = 0;
      let totalAutresSorties = 0;
      sortiesDetails.forEach((s) => {
        checkPageBreak(8, 'DÉTAIL DES AUTRES SORTIES (suite)');
        totalAutresSorties += parseFloat(s.montant || 0);

        const rowHeight = 6;
        if (rowIdx % 2 === 0) {
          doc.setFillColor(252, 252, 252);
          doc.rect(margins.left, y, contentWidth, rowHeight, 'F');
        }
        doc.setDrawColor(240, 240, 240);
        doc.line(margins.left, y + rowHeight, pageWidth - margins.right, y + rowHeight);

        const dest = s.caisse && s.caisse !== '-' ? s.caisse : (s.compte_bancaire && s.compte_bancaire !== '-' ? s.compte_bancaire : '-');
        const heure = s.date_mouvement ? String(s.date_mouvement).split(' ')[1] || '-' : '-';

        const rowData = [
          String(s.mouvement_reference || '-').substring(0, 14),
          String(s.libelle || '-').substring(0, 35),
          String(s.source_type || '-').substring(0, 16),
          String(s.mode_paiement || '-').substring(0, 16),
          String(dest).substring(0, 20),
          heure.substring(0, 5),
          formatNumber(s.montant),
        ];

        cx = margins.left + 1.5;
        rowData.forEach((val, i) => {
          const col = sortCols[i];
          const isLast = i === sortCols.length - 1;
          const align = isLast ? 'right' : 'left';
          const textX = align === 'right' ? cx + col.width - 1.5 : cx;
          
          if (isLast) doc.setTextColor(239, 68, 68);
          else doc.setTextColor(33, 33, 33);
          
          doc.text(val, textX, y + 4, { align });
          cx += col.width;
        });
        y += rowHeight;
        rowIdx++;
      });

      doc.setFillColor(254, 226, 226);
      doc.rect(margins.left, y, contentWidth, 6.5, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68);
      doc.text('TOTAL AUTRES SORTIES', margins.left + 1.5, y + 4.5);
      doc.text(formatCurrency(totalAutresSorties), pageWidth - margins.right - 1.5, y + 4.5, { align: 'right' });
      y += 6.5 + 6;
    }

    // ================================================================
    // SIGNATURES
    // ================================================================
    checkPageBreak(25);
    
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