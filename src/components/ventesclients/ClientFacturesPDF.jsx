// src/components/clients/ClientFacturesPDF.jsx
import jsPDF from 'jspdf';
import logoSvg from '../../assets/logo.svg';

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

// ========== FONCTIONS DE FORMATAGE ==========
const formatNumber = (n) => {
  const num = parseFloat(n) || 0;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const formatCurrency = (amt) => {
  const num = parseFloat(amt) || 0;
  return `${formatNumber(num)} FCFA`;
};

const formatDate = (d) => {
  if (!d) return '-';
  try {
    let date;
    if (typeof d === 'string' && d.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = d.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(d);
    }
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
};

const formatDateTime = (d) => {
  if (!d) return '-';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return d;
  }
};

// ========== FONCTION POUR AJOUTER UN FILIGRANE OBLIQUE ==========
const addWatermark = (doc, text, options = {}) => {
  const {
    fontSize = 40,
    color = [200, 200, 200],
    opacity = 0.08,
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
const ClientFacturesPDF = async (client, factures, options = {}) => {
  if (!client || typeof client !== 'object') {
    throw new Error('Données du client invalides');
  }
  if (!Array.isArray(factures)) {
    throw new Error('Les factures doivent être un tableau');
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
      name: 'SODEPCI PARA',
      address: 'Dakar, Sénégal',
      phone: '+221 33 800 00 00',
      email: 'contactsodepci@gmail.com',
      rccm: '2025/G/001',
      nif: '123456789',
      capital: '50 000 000 FCFA'
    };

    // ========== DONNÉES DU CLIENT ET FACTURES ==========
    const clientName = client.name || 'Client';
    const clientCode = client.code || '-';
    const clientPhone = client.phone || '-';
    const clientEmail = client.email || '-';
    const clientAddress = client.address ? `${client.address}, ${client.city || ''} ${client.country || ''}` : '-';

    // Calcul des totaux
    let totalGeneral = 0;
    let totalPaye = 0;
    let totalReste = 0;

    const facturesAvecDetails = factures.map(f => {
      const total = parseFloat(f.total) || 0;
      const paye = parseFloat(f.amount_paid) || 0;
      const reste = total - paye;
      totalGeneral += total;
      totalPaye += paye;
      totalReste += reste;

      return {
        ...f,
        total,
        paye,
        reste,
        invoice_date: f.invoice_date || f.created_at || new Date().toISOString().split('T')[0],
        due_date: f.due_date || f.invoice_date || new Date().toISOString().split('T')[0],
        invoice_number: f.invoice_number || f.number || `FAC-${String(f.id || '').padStart(4, '0')}`,
        status: f.status || 'draft'
      };
    });

    const montantEnLettres = nombreEnLettres(totalGeneral);

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
    const watermarkText = options.watermark || 'RELEVÉ DE FACTURES';
    const watermarkOptions = {
      fontSize: options.watermarkSize || 40,
      color: options.watermarkColor || [200, 200, 200],
      opacity: options.watermarkOpacity || 0.08,
      angle: options.watermarkAngle || -45,
      repeat: options.watermarkRepeat !== undefined ? options.watermarkRepeat : true,
      spacing: options.watermarkSpacing || 100
    };

    // ================================================================
    // EN-TÊTE
    // ================================================================
    const logoWidth = 26;
    const logoHeight = 26;
    
    if (logoData) {
      doc.addImage(logoData, 'PNG', margins.left, y, logoWidth, logoHeight);
    }

    const textStartX = margins.left + logoWidth + 7;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text(company.name, textStartX, y + 6);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(84, 110, 122);
    doc.text(`S.A.R.L au capital de ${company.capital}`, textStartX, y + 12);
    doc.text(`RC: ${company.rccm} - NIF: ${company.nif}`, textStartX, y + 17);
    doc.text(company.address.toUpperCase(), textStartX, y + 22);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text('RELEVÉ DE FACTURES', pageWidth - margins.right, y + 6, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(84, 110, 122);
    doc.text(`Client: ${clientName} (${clientCode})`, pageWidth - margins.right, y + 12, { align: 'right' });
    doc.text(`Émis le ${formatDateTime(new Date().toISOString())}`, pageWidth - margins.right, y + 17, { align: 'right' });

    y += 30;
    doc.setDrawColor(26, 35, 126);
    doc.setLineWidth(0.4);
    doc.line(margins.left, y, pageWidth - margins.right, y);
    y += 8;

    // ================================================================
    // INFORMATIONS CLIENT
    // ================================================================
    const clientInfoY = y;
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margins.left, clientInfoY, contentWidth, 16, 2, 2, 'F');
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.5);
    doc.roundedRect(margins.left, clientInfoY, contentWidth, 16, 2, 2, 'S');

    const colWidth = contentWidth / 4;
    const gridX1 = margins.left;
    const gridX2 = margins.left + colWidth;
    const gridX3 = margins.left + colWidth * 2;
    const gridX4 = margins.left + colWidth * 3;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 144, 156);
    
    doc.text('TÉLÉPHONE', gridX1 + 4, clientInfoY + 4.5);
    doc.text('EMAIL', gridX2 + 4, clientInfoY + 4.5);
    doc.text('ADRESSE', gridX3 + 4, clientInfoY + 4.5);
    doc.text('NOMBRE FACTURES', gridX4 + 4, clientInfoY + 4.5);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(26, 35, 126);
    doc.text(clientPhone, gridX1 + 4, clientInfoY + 12);
    doc.text(clientEmail, gridX2 + 4, clientInfoY + 12);
    doc.text(clientAddress, gridX3 + 4, clientInfoY + 12);
    doc.text(factures.length.toString(), gridX4 + 4, clientInfoY + 12);

    y = clientInfoY + 20;

    // ================================================================
    // TABLEAU DES FACTURES - COLONNES RÉÉQUILIBRÉES
    // ================================================================
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text('DÉTAIL DES FACTURES', margins.left, y);
    y += 2;
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.5);
    doc.line(margins.left, y, pageWidth - margins.right, y);
    y += 6;

    // Définition des colonnes (largeurs rééquilibrées)
    const colNumX = margins.left;                 // 15
    const colNumFactureX = margins.left + 6;      // 21
    const colDateX = colNumFactureX + 32;         // 53
    const colEcheanceX = colDateX + 22;           // 75
    const colTotalX = colEcheanceX + 22;          // 97
    const colPayeX = colTotalX + 24;              // 121
    const colResteX = colPayeX + 24;              // 145
    const colStatutX = pageWidth - margins.right - 2; // 193

    // En-tête du tableau
    const headerY = y;
    doc.setFillColor(232, 234, 246);
    doc.rect(colNumX, headerY, contentWidth, 7, 'F');
    doc.setDrawColor(197, 202, 233);
    doc.setLineWidth(0.5);
    doc.line(colNumX, headerY + 7, pageWidth - margins.right, headerY + 7);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text('N°', colNumX + 3, headerY + 4.5);
    doc.text('N° Facture', colNumFactureX + 3, headerY + 4.5);
    doc.text('Date', colDateX + 3, headerY + 4.5);
    doc.text('Échéance', colEcheanceX + 3, headerY + 4.5);
    doc.text('Total', colTotalX + 3, headerY + 4.5);
    doc.text('Payé', colPayeX + 3, headerY + 4.5);
    doc.text('Reste', colResteX + 3, headerY + 4.5);
    doc.text('Statut', colStatutX - 3, headerY + 4.5, { align: 'right' });

    y = headerY + 7;
    let currentY = y;
    let rowIndex = 0;

    if (facturesAvecDetails.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 144, 156);
      doc.text('Aucune facture trouvée pour ce client', pageWidth / 2, currentY + 10, { align: 'center' });
      currentY += 20;
    } else {
      for (let idx = 0; idx < facturesAvecDetails.length; idx++) {
        const facture = facturesAvecDetails[idx];

        if (currentY > pageHeight - 70) {
          doc.addPage();
          addWatermark(doc, watermarkText, watermarkOptions);
          
          currentY = margins.top;
          doc.setFillColor(232, 234, 246);
          doc.rect(colNumX, currentY, contentWidth, 7, 'F');
          doc.setDrawColor(197, 202, 233);
          doc.setLineWidth(0.5);
          doc.line(colNumX, currentY + 7, pageWidth - margins.right, currentY + 7);

          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(26, 35, 126);
          doc.text('N°', colNumX + 3, currentY + 4.5);
          doc.text('N° Facture', colNumFactureX + 3, currentY + 4.5);
          doc.text('Date', colDateX + 3, currentY + 4.5);
          doc.text('Échéance', colEcheanceX + 3, currentY + 4.5);
          doc.text('Total', colTotalX + 3, currentY + 4.5);
          doc.text('Payé', colPayeX + 3, currentY + 4.5);
          doc.text('Reste', colResteX + 3, currentY + 4.5);
          doc.text('Statut', colStatutX - 3, currentY + 4.5, { align: 'right' });
          currentY += 7;
        }

        // Alternance des couleurs
        if (rowIndex % 2 === 0) {
          doc.setFillColor(255, 255, 255);
          doc.rect(colNumX, currentY - 0.5, contentWidth, 6.5, 'F');
        } else {
          doc.setFillColor(250, 250, 250);
          doc.rect(colNumX, currentY - 0.5, contentWidth, 6.5, 'F');
        }

        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.1);
        doc.line(colNumX, currentY, pageWidth - margins.right, currentY);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(66, 66, 66);

        // Numéro de ligne
        doc.text((idx + 1).toString(), colNumX + 3, currentY + 4);

        // N° Facture
        const invNum = facture.invoice_number;
        const maxWidthInv = colDateX - colNumFactureX - 6;
        if (doc.getTextWidth(invNum) > maxWidthInv) {
          doc.setFontSize(6.5);
          doc.text(invNum, colNumFactureX + 3, currentY + 4);
          doc.setFontSize(8);
        } else {
          doc.text(invNum, colNumFactureX + 3, currentY + 4);
        }

        // Date
        doc.text(formatDate(facture.invoice_date), colDateX + 3, currentY + 4);

        // Échéance
        const dueDate = formatDate(facture.due_date);
        const isOverdue = new Date(facture.due_date) < new Date() && facture.status !== 'paid';
        if (isOverdue) {
          doc.setTextColor(211, 47, 47); // rouge
        }
        doc.text(dueDate, colEcheanceX + 3, currentY + 4);
        if (isOverdue) {
          doc.setTextColor(66, 66, 66);
        }

        // Total
        doc.setTextColor(26, 35, 126);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(facture.total), colTotalX + 3, currentY + 4);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(66, 66, 66);

        // Payé
        doc.setTextColor(46, 125, 50); // vert
        doc.text(formatCurrency(facture.paye), colPayeX + 3, currentY + 4);
        doc.setTextColor(66, 66, 66);

        // Reste
        const reste = facture.reste;
        if (reste > 0) {
          doc.setTextColor(211, 47, 47); // rouge
        } else {
          doc.setTextColor(46, 125, 50);
        }
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(reste), colResteX + 3, currentY + 4);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(66, 66, 66);

        // Statut (badge coloré aligné à droite)
        let statusLabel = '';
        let statusColor = '';
        switch (facture.status) {
          case 'draft': statusLabel = 'Brouillon'; statusColor = [158, 158, 158]; break;
          case 'sent': statusLabel = 'Envoyée'; statusColor = [33, 150, 243]; break;
          case 'partial': statusLabel = 'Partielle'; statusColor = [255, 152, 0]; break;
          case 'paid': statusLabel = 'Payée'; statusColor = [76, 175, 80]; break;
          case 'overdue': statusLabel = 'En retard'; statusColor = [211, 47, 47]; break;
          case 'cancelled': statusLabel = 'Annulée'; statusColor = [211, 47, 47]; break;
          default: statusLabel = facture.status || 'Inconnu'; statusColor = [158, 158, 158];
        }
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        const badgeWidth = doc.getTextWidth(statusLabel) + 6;
        const badgeX = colStatutX - badgeWidth - 2; // aligné à droite
        doc.roundedRect(badgeX, currentY - 0.5, badgeWidth, 5.5, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.text(statusLabel, badgeX + 3, currentY + 3.8);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(66, 66, 66);

        currentY += 6.5;
        rowIndex++;
      }

      doc.setDrawColor(180, 180, 190);
      doc.setLineWidth(0.3);
      doc.line(colNumX, currentY, pageWidth - margins.right, currentY);
      y = currentY + 5;
    }

    // ================================================================
    // TOTAUX
    // ================================================================
    let ay = y;

    const totalBoxHeight = 24;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margins.left, ay, contentWidth, totalBoxHeight, 2, 2, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(84, 110, 122);
    doc.text('Total général des factures', margins.left + 6, ay + 7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text(formatCurrency(totalGeneral), pageWidth - margins.right - 6, ay + 7, { align: 'right' });

    ay += 7;
    doc.text('Total payé', margins.left + 6, ay + 7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(46, 125, 50);
    doc.text(formatCurrency(totalPaye), pageWidth - margins.right - 6, ay + 7, { align: 'right' });

    ay += 7;
    doc.text('Reste à payer', margins.left + 6, ay + 7);
    doc.setFont('helvetica', 'bold');
    const resteTotal = totalGeneral - totalPaye;
    if (resteTotal > 0) {
      doc.setTextColor(211, 47, 47);
    } else {
      doc.setTextColor(46, 125, 50);
    }
    doc.text(formatCurrency(resteTotal), pageWidth - margins.right - 6, ay + 7, { align: 'right' });

    ay += totalBoxHeight + 6;

    // ================================================================
    // MONTANT EN TOUTES LETTRES
    // ================================================================
    const lettresBoxHeight = 14;
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margins.left, ay, contentWidth, lettresBoxHeight, 2, 2, 'F');
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.5);
    doc.roundedRect(margins.left, ay, contentWidth, lettresBoxHeight, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(84, 110, 122);
    doc.text('Montant total en toutes lettres :', margins.left + 6, ay + 9);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(33, 33, 33);

    const lettresStartX = margins.left + 70;
    const lettresAvailableWidth = contentWidth - 75;

    let lettresFontSize = 8;
    doc.setFontSize(lettresFontSize);
    let lettresWidth = doc.getTextWidth(montantEnLettres);

    while (lettresWidth > lettresAvailableWidth && lettresFontSize > 5) {
      lettresFontSize -= 0.5;
      doc.setFontSize(lettresFontSize);
      lettresWidth = doc.getTextWidth(montantEnLettres);
    }

    if (lettresWidth > lettresAvailableWidth) {
      const splitLettres = doc.splitTextToSize(montantEnLettres, lettresAvailableWidth);
      doc.text(splitLettres, lettresStartX, ay + 5);
    } else {
      doc.text(montantEnLettres, lettresStartX, ay + 9);
    }

    ay += lettresBoxHeight + 8;
    y = ay;

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
    doc.text('Signature du client', signatureX1 + (signatureWidth / 2), signatureY, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 144, 156);
    doc.text(`Date: ${formatDate(new Date().toISOString())}`, signatureX1 + (signatureWidth / 2), signatureY + 12, { align: 'center' });

    doc.line(signatureX2, signatureY + 5, signatureX2 + signatureWidth, signatureY + 5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(84, 110, 122);
    doc.text('Signature SEYDI GROUP', signatureX2 + (signatureWidth / 2), signatureY, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 144, 156);
    doc.text('Responsable commercial', signatureX2 + (signatureWidth / 2), signatureY + 12, { align: 'center' });

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
    doc.text(`${company.name} - ${company.address}`, pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Tél: ${company.phone} - Email: ${company.email}`, pageWidth / 2, footerY + 4, { align: 'center' });
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

    const filename = options.filename || `Releve_factures_${client.code || 'client'}_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(filename);
    return true;

  } catch (error) {
    console.error('Erreur ClientFacturesPDF:', error);
    throw error;
  }
};

// ========== FONCTION DE TÉLÉCHARGEMENT ==========
export const downloadClientFacturesPDF = async (client, factures, filename = null) => {
  try {
    if (!client || typeof client !== 'object') {
      throw new Error('Les données du client sont invalides');
    }
    if (!Array.isArray(factures)) {
      throw new Error('Les factures doivent être un tableau');
    }

    const options = {};
    if (filename) options.filename = filename;
    
    const result = await ClientFacturesPDF(client, factures, options);
    return result;
  } catch (error) {
    console.error('Erreur lors du téléchargement du relevé de factures :', error);
    throw error;
  }
};

export default ClientFacturesPDF;