// src/components/ventesclients/PaiementPdf.jsx
import jsPDF from 'jspdf';
import axiosInstance from '../AxiosInstance';

// ========== RÉCUPÉRATION DES DONNÉES DE L'ÉTABLISSEMENT ==========
let etablissementCache = null;
let etablissementLoading = false;
let etablissementPromise = null;

const getEtablissement = async () => {
  // Si déjà en cache, retourner directement
  if (etablissementCache) {
    return etablissementCache;
  }

  // Si une requête est déjà en cours, attendre sa résolution
  if (etablissementPromise) {
    return await etablissementPromise;
  }

  // Démarrer une nouvelle requête
  etablissementPromise = (async () => {
    try {
      const token = localStorage.getItem('Token');
      const response = await axiosInstance.get('/etablissements/unique/', {
        headers: token ? { Authorization: `Token ${token}` } : {}
      });
      
      if (response.data && response.data.id) {
        etablissementCache = response.data;
        return etablissementCache;
      }
      return null;
    } catch (error) {
      console.error('Erreur chargement établissement:', error);
      return null;
    } finally {
      etablissementPromise = null;
    }
  })();

  return await etablissementPromise;
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

// ========== FONCTIONS DE FORMATAGE ==========
const formatNumber = (n) => {
  const num = parseFloat(n) || 0;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const formatCurrency = (amt) => `${formatNumber(amt)} FCFA`;

const formatDate = (d) => {
  if (!d) return '-';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
};

// ========== GESTION DES STATUTS ==========
const getStatusInfo = (status) => {
  const map = {
    draft: { label: 'Brouillon', color: [158, 158, 158] },
    confirmed: { label: 'Confirmée', color: [33, 150, 243] },
    paid: { label: 'Payée', color: [76, 175, 80] },
    delivered: { label: 'Livrée', color: [0, 150, 136] },
    cancelled: { label: 'Annulée', color: [244, 67, 54] },
    returned: { label: 'Retournée', color: [255, 152, 0] },
    pending: { label: 'En attente', color: [255, 193, 7] },
    completed: { label: 'Terminée', color: [76, 175, 80] },
    processing: { label: 'En cours', color: [33, 150, 243] },
    failed: { label: 'Échoué', color: [244, 67, 54] },
    successful: { label: 'Réussi', color: [76, 175, 80] },
    pending_payment: { label: 'En attente', color: [255, 193, 7] }
  };
  return map[status] || { label: '-', color: [158, 158, 158] };
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

// ========== FONCTION POUR OBTENIR LE LIBELLÉ DU MODE DE PAIEMENT ==========
const getMethodLabel = (method) => {
  const map = {
    cash: 'Espèces',
    card: 'Carte bancaire',
    check: 'Chèque',
    transfer: 'Virement',
    mobile_money: 'Mobile Money',
    credit: 'Crédit',
    bank_transfer: 'Virement bancaire',
    credit_card: 'Carte de crédit',
    debit_card: 'Carte de débit',
    paypal: 'PayPal',
    stripe: 'Stripe',
    orange_money: 'Orange Money',
    mtn_money: 'MTN Mobile Money'
  };
  return map[method] || method || '-';
};

// ========== FONCTION DE GÉNÉRATION PDF ==========
const generatePaiementPdf = async (paiement, options = {}) => {
  if (!paiement || typeof paiement !== 'object') {
    throw new Error('Données du paiement invalides');
  }

  try {
    // ========== RÉCUPÉRER LES DONNÉES DE L'ÉTABLISSEMENT ==========
    const etab = await getEtablissement();
    
    // ========== INFORMATIONS DE L'ENTREPRISE (DYNAMIQUES) ==========
    const company = {
      name: etab?.nom || 'BOUTIQUE STATION SODEPCI',
      sigle: etab?.sigle || '',
      address: etab?.adresse || 'PARA EN FACE DU GRAND HOPITAL DE PARA',
      phone: etab?.telephone || '070 84 29 609 / 074 75 57 169',
      email: etab?.email || '',
      site_web: etab?.site_web || '',
      devise: etab?.devise || 'FCFA',
      // Valeurs par défaut pour compatibilité
      phone1: (etab?.telephone || '070 84 29 609').split('/')[0].trim(),
      phone2: (etab?.telephone || '070 84 29 609 / 074 75 57 169').split('/')[1]?.trim() || '',
      gérant: 'ZAKARIA',
      rccm: etab?.rccm || '',
      nif: etab?.nif || '',
      capital: etab?.capital || '',
      bank_name: etab?.bank_name || '',
      bank_account: etab?.bank_account || '',
      bank_currency: etab?.devise || 'FCFA'
    };

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margins = { left: 15, right: 15, top: 18, bottom: 18 };
    const contentWidth = pageWidth - margins.left - margins.right;
    let y = margins.top;

    // ========== DONNÉES DU PAIEMENT ==========
    const statusInfo = getStatusInfo(paiement.status);
    const totalEnLettres = nombreEnLettres(parseFloat(paiement.amount) || 0);
    const datePaiement = paiement.payment_date || paiement.date || new Date().toISOString().split('T')[0];
    
    // Informations client
    const clientNom = paiement.client_name || paiement.client?.nom || 'Client anonyme';
    const clientAdresse = paiement.client_address || paiement.client?.adresse || '';
    const clientTelephone = paiement.client_phone || paiement.client?.telephone || '';
    const clientEmail = paiement.client_email || paiement.client?.email || '';

    // ========== CHARGEMENT DU LOGO (DEPUIS L'ÉTABLISSEMENT) ==========
    const loadLogo = async () => {
      if (!etab?.logo) return null;
      
      try {
        // Construire l'URL complète du logo
        let logoUrl = etab.logo;
        if (!logoUrl.startsWith('http://') && !logoUrl.startsWith('https://')) {
          const baseURL = axiosInstance.defaults.baseURL || '';
          logoUrl = `${baseURL}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
        }
        
        return new Promise((resolve) => {
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
          img.src = logoUrl;
        });
      } catch {
        return null;
      }
    };
    
    let logoData = await loadLogo();

    // Filigrane
    const watermarkText = options.watermark || 'REÇU DE PAIEMENT';
    const watermarkOptions = {
      fontSize: options.watermarkSize || 40,
      color: options.watermarkColor || [200, 200, 200],
      opacity: options.watermarkOpacity || 0.10,
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
    
    // Nom de l'entreprise
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(26, 35, 126);
    doc.text(company.name, textStartX, y + 6);
    
    // Sigle si présent
    if (company.sigle) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(84, 110, 122);
      doc.text(company.sigle, textStartX, y + 11);
      y += 5;
    }
    
    // Sous-titres
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(84, 110, 122);
    doc.text(company.address.toUpperCase(), textStartX, y + 12);
    doc.text(`Tél: ${company.phone}`, textStartX, y + 16.5);
    if (company.email) {
      doc.text(`Email: ${company.email}`, textStartX, y + 21);
      y += 5;
    }
    
    // Titre du document
    const titleX = pageWidth - margins.right;
    const titleY = y + 4;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(26, 35, 126);
    doc.text('REÇU DE PAIEMENT', titleX, titleY, { align: 'right' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(84, 110, 122);
    doc.text(`N° ${paiement.id || paiement.receipt_number || '-'}`, titleX, titleY + 8, { align: 'right' });
    doc.text(`Date: ${formatDate(datePaiement)}`, titleX, titleY + 16, { align: 'right' });

    y += 32;
    doc.setDrawColor(26, 35, 126);
    doc.setLineWidth(0.4);
    doc.line(margins.left, y, pageWidth - margins.right, y);
    y += 8;

    // ================================================================
    // GRILLE D'INFORMATIONS
    // ================================================================
    const gridY = y;
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margins.left, gridY, contentWidth, 24, 2, 2, 'F');
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.5);
    doc.roundedRect(margins.left, gridY, contentWidth, 24, 2, 2, 'S');

    const colWidth = contentWidth / 2;
    const gridX1 = margins.left;
    const gridX2 = margins.left + colWidth;

    // Client
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 144, 156);
    doc.text('CLIENT', gridX1 + 4, gridY + 4.5);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text(clientNom, gridX1 + 4, gridY + 11);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(84, 110, 122);
    if (clientAdresse) doc.text(clientAdresse, gridX1 + 4, gridY + 17);
    if (clientTelephone) doc.text(`Tél: ${clientTelephone}`, gridX1 + 4, gridY + 22);

    // Statut
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 144, 156);
    doc.text('STATUT', gridX2 + 4, gridY + 4.5);

    const statusX = gridX2 + 4;
    const statusY = gridY + 11;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(statusInfo.color[0], statusInfo.color[1], statusInfo.color[2]);
    doc.text(statusInfo.label, statusX, statusY);

    // Mode de paiement
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 144, 156);
    doc.text('MODE DE PAIEMENT', gridX2 + 4, gridY + 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(26, 35, 126);
    doc.text(getMethodLabel(paiement.method), gridX2 + 4, gridY + 24);

    y = gridY + 28;

    // ================================================================
    // TABLEAU DES DÉTAILS DU PAIEMENT
    // ================================================================
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text('DÉTAIL DU PAIEMENT', margins.left, y);
    y += 2;
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.5);
    doc.line(margins.left, y, pageWidth - margins.right, y);
    y += 6;

    // Colonnes
    const colDescX = margins.left;
    const colRefX = margins.left + 55;
    const colMethodX = margins.left + 100;
    const colTotalX = pageWidth - margins.right - 2;

    // En-tête
    const headerY = y;
    doc.setFillColor(26, 35, 126);
    doc.roundedRect(colDescX, headerY, contentWidth, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Désignation', colDescX + 3, headerY + 4.5);
    doc.text('Référence', colRefX + 3, headerY + 4.5);
    doc.text('Mode de paiement', colMethodX + 3, headerY + 4.5);
    doc.text('Montant', colTotalX - 3, headerY + 4.5, { align: 'right' });

    y = headerY + 7;
    let currentY = y;

    // Récupérer les détails du paiement
    const paymentLines = paiement.lines || paiement.items || [];
    const hasLines = paymentLines.length > 0;

    if (!hasLines) {
      // Si pas de lignes, afficher les infos du paiement directement
      const rowY = currentY;
      
      doc.setFillColor(248, 249, 250);
      doc.rect(colDescX, rowY - 0.5, contentWidth, 6.5, 'F');
      
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.1);
      doc.line(colDescX, rowY, colDescX, rowY + 6);
      doc.line(colRefX, rowY, colRefX, rowY + 6);
      doc.line(colMethodX, rowY, colMethodX, rowY + 6);
      doc.line(colTotalX, rowY, colTotalX, rowY + 6);

      doc.setTextColor(33, 33, 33);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Paiement N° ${paiement.id || '-'}`, colDescX + 3, rowY + 4);
      doc.text(paiement.reference || paiement.invoice_number || '-', colRefX + 3, rowY + 4);
      doc.text(getMethodLabel(paiement.method), colMethodX + 3, rowY + 4);
      
      const amountText = formatCurrency(paiement.amount);
      doc.text(amountText, colTotalX - 3, rowY + 4, { align: 'right' });

      currentY = rowY + 6.5;
    } else {
      for (let idx = 0; idx < paymentLines.length; idx++) {
        const line = paymentLines[idx];
        const description = line.description || line.product_name || 'Paiement';
        const reference = line.reference || line.invoice_number || '-';
        const method = getMethodLabel(line.method || paiement.method);
        const amount = parseFloat(line.amount || line.total || paiement.amount) || 0;

        if (currentY > pageHeight - 60) {
          doc.addPage();
          addWatermark(doc, watermarkText, watermarkOptions);
          
          currentY = margins.top;
          doc.setFillColor(26, 35, 126);
          doc.roundedRect(colDescX, currentY, contentWidth, 7, 2, 2, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.text('Désignation', colDescX + 3, currentY + 4.5);
          doc.text('Référence', colRefX + 3, currentY + 4.5);
          doc.text('Mode de paiement', colMethodX + 3, currentY + 4.5);
          doc.text('Montant', colTotalX - 3, currentY + 4.5, { align: 'right' });
          currentY += 7;
        }

        if (idx % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(colDescX, currentY - 0.5, contentWidth, 6.5, 'F');
        }

        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.1);
        doc.line(colDescX, currentY, colDescX, currentY + 6);
        doc.line(colRefX, currentY, colRefX, currentY + 6);
        doc.line(colMethodX, currentY, colMethodX, currentY + 6);
        doc.line(colTotalX, currentY, colTotalX, currentY + 6);

        doc.setTextColor(33, 33, 33);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.text(description, colDescX + 3, currentY + 4);
        doc.text(reference, colRefX + 3, currentY + 4);
        doc.text(method, colMethodX + 3, currentY + 4);
        
        const amountText = formatCurrency(amount);
        doc.text(amountText, colTotalX - 3, currentY + 4, { align: 'right' });

        currentY += 6.5;
      }
    }

    doc.setDrawColor(180, 180, 190);
    doc.setLineWidth(0.3);
    doc.line(colDescX, currentY, pageWidth - margins.right, currentY);
    y = currentY + 5;

    // ================================================================
    // TOTAUX
    // ================================================================
    let ay = y;

    const amount = parseFloat(paiement.amount) || 0;
    const fees = parseFloat(paiement.fees) || 0;
    const netAmount = parseFloat(paiement.net_amount) || amount;

    // 1. Bloc TOTAL
    const amountBoxWidth = 70;
    const amountBoxX = pageWidth - margins.right - amountBoxWidth;
    const amountBoxHeight = 12;

    doc.setFillColor(26, 35, 126);
    doc.roundedRect(amountBoxX - 7, ay - 2, amountBoxWidth + 8, amountBoxHeight, 2, 2, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL PAYÉ', amountBoxX + 4, ay + 6);

    const totalFormatted = formatCurrency(amount);
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    let fontSizeTotal = 12;
    let textWidthTotal = doc.getTextWidth(totalFormatted);
    if (textWidthTotal > amountBoxWidth - 10) {
      fontSizeTotal = 10;
      doc.setFontSize(fontSizeTotal);
      if (doc.getTextWidth(totalFormatted) > amountBoxWidth - 10) {
        fontSizeTotal = 8;
        doc.setFontSize(fontSizeTotal);
      }
    }
    doc.text(totalFormatted, amountBoxX + amountBoxWidth, ay + 6, { align: 'right' });

    ay += amountBoxHeight + 4;

    // 2. Montant en toutes lettres
    const lettresBoxHeight = 14;
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margins.left, ay, contentWidth, lettresBoxHeight, 2, 2, 'F');
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.5);
    doc.roundedRect(margins.left, ay, contentWidth, lettresBoxHeight, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(84, 110, 122);
    doc.text('Montant en toutes lettres :', margins.left + 6, ay + 9);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(33, 33, 33);

    const lettresStartX = margins.left + 65;
    const lettresAvailableWidth = contentWidth - 70;

    let lettresFontSize = 8;
    doc.setFontSize(lettresFontSize);
    let lettresWidth = doc.getTextWidth(totalEnLettres);

    while (lettresWidth > lettresAvailableWidth && lettresFontSize > 5) {
      lettresFontSize -= 0.5;
      doc.setFontSize(lettresFontSize);
      lettresWidth = doc.getTextWidth(totalEnLettres);
    }

    if (lettresWidth > lettresAvailableWidth) {
      const splitLettres = doc.splitTextToSize(totalEnLettres, lettresAvailableWidth);
      doc.text(splitLettres, lettresStartX, ay + 5);
    } else {
      doc.text(totalEnLettres, lettresStartX, ay + 9);
    }

    ay += lettresBoxHeight + 6;

    // 3. Frais éventuels
    if (fees > 0) {
      const feesBoxHeight = 14;
      doc.setFillColor(255, 248, 230);
      doc.roundedRect(margins.left, ay, contentWidth, feesBoxHeight, 2, 2, 'F');
      doc.setDrawColor(255, 204, 128);
      doc.setLineWidth(0.5);
      doc.roundedRect(margins.left, ay, contentWidth, feesBoxHeight, 2, 2, 'S');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(230, 81, 0);
      doc.text('Frais de traitement', margins.left + 6, ay + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(66, 66, 66);
      doc.text(formatCurrency(fees), margins.left + contentWidth - 6, ay + 5, { align: 'right' });
      
      doc.setFontSize(7);
      doc.setTextColor(120, 144, 156);
      doc.text(`Net: ${formatCurrency(netAmount)}`, margins.left + contentWidth - 6, ay + 11, { align: 'right' });
      
      ay += feesBoxHeight + 6;
    }

    // 4. Notes
    if (paiement.notes && typeof paiement.notes === 'string' && paiement.notes.trim()) {
      const notesBoxHeight = 20;
      doc.setFillColor(255, 248, 230);
      doc.roundedRect(margins.left, ay, contentWidth, notesBoxHeight, 2, 2, 'F');
      doc.setDrawColor(255, 204, 128);
      doc.setLineWidth(0.5);
      doc.roundedRect(margins.left, ay, contentWidth, notesBoxHeight, 2, 2, 'S');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(230, 81, 0);
      doc.text('Notes', margins.left + 6, ay + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(66, 66, 66);
      const splitNotes = doc.splitTextToSize(paiement.notes, contentWidth - 12);
      doc.text(splitNotes, margins.left + 6, ay + 12);
      
      ay += notesBoxHeight + 6;
    }

    y = ay;

    // ================================================================
    // QR CODE (si disponible)
    // ================================================================
    const qrCodeData = paiement.qr_code_url || paiement.qr_code || null;
    
    if (qrCodeData) {
      try {
        let qrImageUrl = qrCodeData;
        if (qrCodeData.startsWith('/')) {
          const baseURL = axiosInstance.defaults.baseURL || window.location.origin || 'http://127.0.0.1:8000';
          qrImageUrl = `${baseURL}${qrCodeData}`;
        }
        
        const qrImage = await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          const timeout = setTimeout(() => reject(new Error('Timeout QR Code')), 5000);
          img.onload = () => { clearTimeout(timeout); resolve(img); };
          img.onerror = () => { clearTimeout(timeout); reject(new Error('Erreur chargement QR Code')); };
          img.src = qrImageUrl;
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = qrImage.width;
        canvas.height = qrImage.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(qrImage, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        
        const qrSize = 35;
        const qrX = pageWidth - margins.right - qrSize;
        const qrY = y + 2;
        
        // Fond pour le QR Code
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 14, 2, 2, 'F');
        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.5);
        doc.roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 14, 2, 2, 'S');
        
        doc.addImage(dataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        
        doc.setFontSize(5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 144, 156);
        doc.text('Scanner pour détails', qrX + qrSize/2, qrY + qrSize + 6, { align: 'center' });
        
        y += qrSize + 22;
      } catch (error) {
        console.error('Erreur chargement QR Code:', error);
        // Continuer sans QR Code
      }
    }

    // ================================================================
    // SIGNATURES
    // ================================================================
    const signatureY = y + 8;
    const signatureWidth = 85;
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
    doc.text(clientNom, signatureX1 + (signatureWidth / 2), signatureY + 12, { align: 'center' });
    doc.text(`Date: ${formatDate(new Date().toISOString())}`, signatureX1 + (signatureWidth / 2), signatureY + 18, { align: 'center' });

    doc.line(signatureX2, signatureY + 5, signatureX2 + signatureWidth, signatureY + 5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(84, 110, 122);
    doc.text('Signature de l\'entreprise', signatureX2 + (signatureWidth / 2), signatureY, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 144, 156);
    doc.text(company.name, signatureX2 + (signatureWidth / 2), signatureY + 12, { align: 'center' });
    doc.text(`Gérant: ${company.gérant}`, signatureX2 + (signatureWidth / 2), signatureY + 18, { align: 'center' });

    y = signatureY + 24;

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
    doc.text(company.address, pageWidth / 2, footerY + 8, { align: 'center' });
    
    if (company.email) {
      doc.setFontSize(6);
      doc.setTextColor(160, 160, 170);
      doc.text(`Email: ${company.email}`, pageWidth / 2, footerY + 13, { align: 'center' });
    }
    doc.setFontSize(6);
    doc.setTextColor(160, 160, 170);
    doc.text('Merci pour votre confiance', pageWidth / 2, footerY + 17, { align: 'center' });

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

    // ================================================================
    // SAUVEGARDE
    // ================================================================
    const filename = options.filename || `Reçu_Paiement_${paiement.id || 'paiement'}.pdf`;
    doc.save(filename);
    return true;

  } catch (error) {
    console.error('Erreur generatePaiementPdf:', error);
    throw error;
  }
};

// ========== FONCTION DE TÉLÉCHARGEMENT ==========
export const downloadPaiementPdf = async (paiement, filename = null) => {
  try {
    if (!paiement || typeof paiement !== 'object') {
      throw new Error('Les données du paiement sont invalides');
    }

    const options = {};
    if (filename) options.filename = filename;
    
    const result = await generatePaiementPdf(paiement, options);
    return result;
  } catch (error) {
    console.error('Erreur lors du téléchargement du reçu :', error);
    throw error;
  }
};

// ========== COMPOSANT REACT ==========
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import { Loader2, AlertCircle } from 'lucide-react';

const PaiementPdf = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const generatePdf = async () => {
      try {
        const token = localStorage.getItem('Token');
        if (!token) {
          setError('Session expirée');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        setProgress(10);
        
        // Récupérer les données du paiement
        const response = await AxiosInstance.get(`/payments/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        
        setProgress(40);
        const paiement = response.data;
        
        // Récupérer les données de l'établissement (fait automatiquement dans generatePaiementPdf)
        setProgress(60);
        
        await generatePaiementPdf(paiement);
        setProgress(100);
        
        setTimeout(() => {
          navigate(`/paiements/${id}`);
        }, 1500);
        
      } catch (err) {
        console.error('Erreur:', err);
        setError(err.message || 'Erreur lors de la génération du PDF');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      generatePdf();
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md w-full px-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto mb-4" />
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-gray-500">Génération du PDF en cours...</p>
          <p className="text-sm text-gray-400 mt-2">{progress}%</p>
          <p className="text-xs text-gray-400 mt-1">Le téléchargement va commencer automatiquement</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Erreur</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => navigate(`/paiements/${id}`)} className="btn btn-primary">
            Retour au paiement
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default PaiementPdf;