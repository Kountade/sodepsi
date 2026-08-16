// src/components/pos/TicketPOS.jsx
import jsPDF from 'jspdf';
import AxiosInstance from '../AxiosInstance';

/**
 * Génère un ticket de caisse format 80mm
 * @param {Object} vente - Objet vente provenant de l'API ou ID de la vente
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<jsPDF>}
 */
const TicketPOS = async (venteOrId, options = {}) => {
  try {
    // ============================================================
    // RÉCUPÉRATION DES DONNÉES SI SEUL L'ID EST PASSÉ
    // ============================================================
    let vente = venteOrId;
    
    // Si c'est un ID (string ou number), on récupère les données
    if (typeof venteOrId === 'string' || typeof venteOrId === 'number') {
      const token = localStorage.getItem('Token');
      if (!token) {
        throw new Error('Session expirée');
      }
      
      const response = await AxiosInstance.get(`/sales/${venteOrId}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      vente = response.data;
    }

    if (!vente || typeof vente !== 'object') {
      throw new Error('Données de la vente invalides');
    }

    // ============================================================
    // VÉRIFICATION ET NORMALISATION DES LIGNES
    // ============================================================
    // Les lignes peuvent être dans vente.lines ou vente.lignes
    let lines = vente.lines || vente.lignes || [];
    
    // Normaliser les lignes pour avoir des noms de propriétés cohérents
    lines = lines.map(line => ({
      quantity: line.quantity || line.qte || 0,
      unit_price: line.unit_price || line.prix_unitaire || line.price || 0,
      total: line.total || 0,
      discount: line.discount || line.remise || 0,
      product_name: line.product_name || line.nom_produit || line.product?.name || 'Produit',
      product_code: line.product_code || line.code_produit || line.product?.code || '',
      product: line.product || null
    }));

    // ============================================================
    // FORMAT 80mm x 210mm
    // ============================================================
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 210]
    });

    // ============================================================
    // CONFIGURATION
    // ============================================================
    const pageWidth = 80;
    const margins = { left: 3, right: 3, top: 4, bottom: 4 };
    let y = margins.top;
    const lineHeight = 4.5;

    // ============================================================
    // FONCTIONS DE FORMATAGE
    // ============================================================
    const formatNumber = (n) => {
      const num = parseFloat(n) || 0;
      return Math.round(num).toString();
    };

    const formatCurrency = (amount) => {
      const num = parseFloat(amount) || 0;
      const rounded = Math.round(num);
      return rounded.toString() + ' FCFA';
    };

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch { return '-'; }
    };

    const centerText = (text, size = 10, style = 'normal') => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.text(text, pageWidth / 2, y, { align: 'center' });
      y += lineHeight;
      return y;
    };

    const leftText = (text, size = 9, style = 'normal') => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.text(text, margins.left, y);
      y += lineHeight;
      return y;
    };

    const twoColumnText = (left, right, size = 9, leftStyle = 'normal', rightStyle = 'normal') => {
      doc.setFontSize(size);
      doc.setFont('helvetica', leftStyle);
      doc.text(left, margins.left, y);
      doc.setFont('helvetica', rightStyle);
      doc.text(right, pageWidth - margins.right, y, { align: 'right' });
      y += lineHeight;
      return y;
    };

    const separator = (char = '-', length = 28) => {
      doc.setFontSize(5);
      doc.text(char.repeat(length), pageWidth / 2, y, { align: 'center' });
      y += 2.5;
      return y;
    };

    const doubleSeparator = () => {
      doc.setFontSize(5);
      doc.text('='.repeat(30), pageWidth / 2, y, { align: 'center' });
      y += 2.5;
      return y;
    };

    const sectionSpacer = (height = 2) => {
      y += height;
      return y;
    };

    // ============================================================
    // DONNEES
    // ============================================================
    // Informations de la boutique (paramétrables)
    const shopName = options.shopName || 'BOUTIQUE STATION SODEPCI DE PARA';
    const shopPhone = options.shopPhone || '07 47 55 71 69 / 07 08 42 96 09';
    const shopFooter = options.shopFooter || 'MERCI ET LA PROCHAINE';

    // ============================================================
    // 1. EN-TETE - BOUTIQUE
    // ============================================================
    y = centerText(shopName, 11, 'bold');
    y = sectionSpacer(1);
    y = centerText('Tél: ' + shopPhone, 7, 'normal');
    y = sectionSpacer(3);

    y = separator('-');
    y = sectionSpacer(2);

    // --- NUMERO ET DATE ---
    const ticketNumber = vente.invoice_number || vente.numero_facture || '---';
    y = centerText('TICKET N° ' + ticketNumber, 10, 'bold');
    y = centerText(formatDate(vente.sale_date || vente.date_vente), 7, 'normal');
    y = sectionSpacer(2);

    y = separator('-');
    y = sectionSpacer(2);

    // --- CLIENT ---
    const clientName = vente.client_name || vente.client?.name || 'Client anonyme';
    y = leftText('Client: ' + clientName, 8, 'bold');
    
    if (vente.client_phone || vente.client?.phone) {
      y = leftText('Tél: ' + (vente.client_phone || vente.client?.phone), 7, 'normal');
    }
    if (vente.client_email || vente.client?.email) {
      y = leftText('Email: ' + (vente.client_email || vente.client?.email), 7, 'normal');
    }
    if (vente.client_address || vente.client?.address) {
      const address = (vente.client_address || vente.client?.address || '');
      const shortAddress = address.length > 25 ? address.substring(0, 25) + '...' : address;
      y = leftText('Adresse: ' + shortAddress, 7, 'normal');
    }
    y = sectionSpacer(1);
    y = separator('-');
    y = sectionSpacer(2);

    // ============================================================
    // 2. TABLEAU DES PRODUITS
    // ============================================================
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');

    const colQte = margins.left;
    const colDesignation = margins.left + 8;
    const colPrix = pageWidth - margins.right - 22;
    const colTotal = pageWidth - margins.right;

    doc.text('Qté', colQte, y);
    doc.text('Produit', colDesignation, y);
    doc.text('Prix', colPrix, y, { align: 'right' });
    doc.text('Total', colTotal, y, { align: 'right' });
    y += 2.5;

    doc.setFontSize(4.5);
    doc.text('-'.repeat(30), pageWidth / 2, y, { align: 'center' });
    y += 2.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    // ============================================================
    // AFFICHAGE DES PRODUITS - VERSION CORRIGÉE
    // ============================================================
    if (lines && lines.length > 0) {
      lines.forEach((line, index) => {
        // Récupération des valeurs avec des fallbacks
        const qty = parseFloat(line.quantity) || 0;
        const price = parseFloat(line.unit_price) || 0;
        const total = parseFloat(line.total) || 0;
        let productName = line.product_name || 'Produit';
        
        // Si productName est vide ou trop court, essayer d'autres sources
        if (!productName || productName === 'Produit') {
          if (line.product && line.product.name) {
            productName = line.product.name;
          } else if (line.nom) {
            productName = line.nom;
          }
        }
        
        // Tronquer le nom si trop long
        const shortName = productName.length > 18 ? productName.substring(0, 16) + '..' : productName;

        // Afficher la quantité
        doc.text(String(qty), colQte, y);
        
        // Afficher le nom du produit
        doc.text(shortName, colDesignation, y);
        
        // Afficher le prix unitaire
        doc.text(formatNumber(price), colPrix, y, { align: 'right' });
        
        // Afficher le total (en gras)
        doc.setFont('helvetica', 'bold');
        doc.text(formatNumber(total), colTotal, y, { align: 'right' });
        doc.setFont('helvetica', 'normal');

        y += 4.5;

        // Gestion de la pagination
        if (y > 170) {
          doc.addPage();
          y = margins.top + 10;
          // Réafficher les en-têtes sur la nouvelle page
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.text('Qté', colQte, y);
          doc.text('Produit', colDesignation, y);
          doc.text('Prix', colPrix, y, { align: 'right' });
          doc.text('Total', colTotal, y, { align: 'right' });
          y += 2.5;
          doc.setFont('helvetica', 'normal');
        }
      });
    } else {
      // Si aucune ligne n'est trouvée, afficher un message
      y = leftText('Aucun produit trouvé', 7, 'bold');
      y = leftText('Vérifiez les données de la vente', 6);
    }

    y = sectionSpacer(1.5);
    y = separator('-');
    y = sectionSpacer(1.5);

    // ============================================================
    // 3. TOTAUX
    // ============================================================
    const subtotal = parseFloat(vente.subtotal) || 0;
    const discountAmount = parseFloat(vente.discount_amount) || 0;
    const taxAmount = parseFloat(vente.tax_amount) || 0;
    const taxRate = parseFloat(vente.tax_rate) || 0;
    const shippingFee = parseFloat(vente.shipping_fee) || 0;
    const total = parseFloat(vente.total) || 0;
    const amountPaid = parseFloat(vente.amount_paid) || 0;
    const amountDue = parseFloat(vente.amount_due) || 0;

    // Sous-total
    twoColumnText('Sous-total', formatCurrency(subtotal), 8);

    // Remise
    if (discountAmount > 0) {
      twoColumnText('Remise', '- ' + formatCurrency(discountAmount), 8);
    }

    // TVA
    if (taxAmount > 0) {
      twoColumnText('TVA (' + taxRate + '%)', formatCurrency(taxAmount), 8);
    }

    // Frais de livraison
    if (shippingFee > 0) {
      twoColumnText('Livraison', formatCurrency(shippingFee), 8);
    }

    y = sectionSpacer(1);
    y = doubleSeparator();
    y = sectionSpacer(1);

    // TOTAL
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', margins.left, y);
    doc.text(formatCurrency(total), pageWidth - margins.right, y, { align: 'right' });
    y += lineHeight + 1;

    // Montant payé
    if (amountPaid > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Payé', margins.left, y);
      doc.text(formatCurrency(amountPaid), pageWidth - margins.right, y, { align: 'right' });
      y += lineHeight;
    }

    // Montant dû
    if (amountDue > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Reste à payer', margins.left, y);
      doc.text(formatCurrency(amountDue), pageWidth - margins.right, y, { align: 'right' });
      y += lineHeight;
    }

    // Statut paiement
    if (vente.payment_status) {
      const statusMap = {
        'paid': '✓ Payé',
        'partial': 'Partiel',
        'pending': 'En attente'
      };
      const statusLabel = statusMap[vente.payment_status] || vente.payment_status;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text('Paiement: ' + statusLabel, margins.left, y);
      y += lineHeight;
    }

    y = sectionSpacer(2);
    y = separator('-');
    y = sectionSpacer(2);

    // ============================================================
    // 4. STATUT DE LA VENTE
    // ============================================================
    if (vente.status) {
      const statusMap = {
        'draft': 'Brouillon',
        'confirmed': 'Confirmée',
        'paid': 'Payée',
        'delivered': 'Livrée',
        'cancelled': 'Annulée',
        'returned': 'Retournée'
      };
      const statusLabel = statusMap[vente.status] || vente.status;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Statut: ' + statusLabel, margins.left, y);
      y += lineHeight;
    }

    // Méthode de paiement
    if (vente.payment_method) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Méthode: ' + vente.payment_method, margins.left, y);
      y += lineHeight;
    }

    y = sectionSpacer(1);

    // ============================================================
    // 5. NOTES
    // ============================================================
    if (vente.notes) {
      const notes = doc.splitTextToSize(vente.notes, pageWidth - margins.left - margins.right - 4);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', margins.left, y);
      y += lineHeight;
      notes.forEach(line => {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('  ' + line, margins.left, y);
        y += lineHeight;
      });
      y = sectionSpacer(1);
    }

    y = separator('-');
    y = sectionSpacer(3);

    // ============================================================
    // 6. PIED DE PAGE
    // ============================================================
    y = centerText(shopFooter, 10, 'bold');
    y = centerText('À très bientôt !', 8, 'normal');
    y = centerText('Votre satisfaction est notre priorité', 7, 'normal');
    y = sectionSpacer(3);

    // Code barre / Numéro
    doc.setFontSize(5);
    const barCode = ticketNumber || 'TICKET';
    y = centerText('*' + barCode + '*', 5, 'normal');

    y = sectionSpacer(2);

    // Fin
    doc.setFontSize(4.5);
    doc.text('-'.repeat(30), pageWidth / 2, y, { align: 'center' });
    y += 2.5;

    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR');
    y = centerText('Imprimé le ' + dateStr, 4.5, 'normal');

    // ============================================================
    // 7. PAGES
    // ============================================================
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(4);
      doc.text('Page ' + i + '/' + pageCount, pageWidth - margins.right, 205, { align: 'right' });
    }

    // ============================================================
    // SAUVEGARDE
    // ============================================================
    const fileName = 'Ticket_' + (ticketNumber || 'ticket') + '.pdf';
    doc.save(fileName);
    return doc;

  } catch (error) {
    console.error('Erreur TicketPOS:', error);
    throw error;
  }
};

export default TicketPOS;