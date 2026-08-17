// src/components/ventesclients/TicketPOS.jsx
import jsPDF from 'jspdf';
import AxiosInstance from '../AxiosInstance';

/**
 * Génère un ticket de caisse format 80mm
 * @param {Object} vente - Objet vente provenant de l'API ou ID de la vente
 * @param {Object} options - Options supplémentaires
 * @param {boolean} options.openInBrowser - Si true, ouvre le PDF dans le navigateur
 * @param {boolean} options.autoPrint - Si true, imprime automatiquement
 * @returns {Promise<jsPDF|string|void>}
 */
const TicketPOS = async (venteOrId, options = {}) => {
  try {
    // ============================================================
    // RÉCUPÉRATION DES DONNÉES
    // ============================================================
    let vente = venteOrId;
    
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

    // Normalisation des lignes
    let lines = vente.lines || vente.lignes || [];
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

    const pageWidth = 80;
    const margins = { left: 3, right: 3, top: 4, bottom: 4 };
    let y = margins.top;
    const lineHeight = 4.5;

    // Fonctions de formatage
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

    // DONNEES
    const shopName = options.shopName || 'BOUTIQUE STATION SODEPCI DE PARA';
    const shopPhone = options.shopPhone || '07 47 55 71 69 / 07 08 42 96 09';
    const shopFooter = options.shopFooter || 'MERCI ET LA PROCHAINE';

    // EN-TETE
    y = centerText(shopName, 11, 'bold');
    y = sectionSpacer(1);
    y = centerText('Tél: ' + shopPhone, 7, 'normal');
    y = sectionSpacer(3);
    y = separator('-');
    y = sectionSpacer(2);

    const ticketNumber = vente.invoice_number || vente.numero_facture || '---';
    y = centerText('TICKET N° ' + ticketNumber, 10, 'bold');
    y = centerText(formatDate(vente.sale_date || vente.date_vente), 7, 'normal');
    y = sectionSpacer(2);
    y = separator('-');
    y = sectionSpacer(2);

    // CLIENT
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

    // TABLEAU DES PRODUITS
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

    if (lines && lines.length > 0) {
      lines.forEach((line) => {
        const qty = parseFloat(line.quantity) || 0;
        const price = parseFloat(line.unit_price) || 0;
        const total = parseFloat(line.total) || 0;
        let productName = line.product_name || 'Produit';
        
        if (!productName || productName === 'Produit') {
          if (line.product && line.product.name) {
            productName = line.product.name;
          } else if (line.nom) {
            productName = line.nom;
          }
        }
        
        const shortName = productName.length > 18 ? productName.substring(0, 16) + '..' : productName;

        doc.text(String(qty), colQte, y);
        doc.text(shortName, colDesignation, y);
        doc.text(formatNumber(price), colPrix, y, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.text(formatNumber(total), colTotal, y, { align: 'right' });
        doc.setFont('helvetica', 'normal');

        y += 4.5;

        if (y > 170) {
          doc.addPage();
          y = margins.top + 10;
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
      y = leftText('Aucun produit trouvé', 7, 'bold');
      y = leftText('Vérifiez les données', 6);
    }

    y = sectionSpacer(1.5);
    y = separator('-');
    y = sectionSpacer(1.5);

    // TOTAUX
    const subtotal = parseFloat(vente.subtotal) || 0;
    const discountAmount = parseFloat(vente.discount_amount) || 0;
    const taxAmount = parseFloat(vente.tax_amount) || 0;
    const taxRate = parseFloat(vente.tax_rate) || 0;
    const shippingFee = parseFloat(vente.shipping_fee) || 0;
    const total = parseFloat(vente.total) || 0;
    const amountPaid = parseFloat(vente.amount_paid) || 0;
    const amountDue = parseFloat(vente.amount_due) || 0;

    twoColumnText('Sous-total', formatCurrency(subtotal), 8);
    if (discountAmount > 0) {
      twoColumnText('Remise', '- ' + formatCurrency(discountAmount), 8);
    }
    if (taxAmount > 0) {
      twoColumnText('TVA (' + taxRate + '%)', formatCurrency(taxAmount), 8);
    }
    if (shippingFee > 0) {
      twoColumnText('Livraison', formatCurrency(shippingFee), 8);
    }

    y = sectionSpacer(1);
    y = doubleSeparator();
    y = sectionSpacer(1);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', margins.left, y);
    doc.text(formatCurrency(total), pageWidth - margins.right, y, { align: 'right' });
    y += lineHeight + 1;

    if (amountPaid > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Payé', margins.left, y);
      doc.text(formatCurrency(amountPaid), pageWidth - margins.right, y, { align: 'right' });
      y += lineHeight;
    }

    if (amountDue > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Reste à payer', margins.left, y);
      doc.text(formatCurrency(amountDue), pageWidth - margins.right, y, { align: 'right' });
      y += lineHeight;
    }

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

    // STATUT
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

    if (vente.payment_method) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Méthode: ' + vente.payment_method, margins.left, y);
      y += lineHeight;
    }

    y = sectionSpacer(1);

    // NOTES
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

    // PIED DE PAGE
    y = centerText(shopFooter, 10, 'bold');
    y = centerText('À très bientôt !', 8, 'normal');
    y = centerText('Votre satisfaction est notre priorité', 7, 'normal');
    y = sectionSpacer(3);

    doc.setFontSize(5);
    const barCode = ticketNumber || 'TICKET';
    y = centerText('*' + barCode + '*', 5, 'normal');
    y = sectionSpacer(2);

    doc.setFontSize(4.5);
    doc.text('-'.repeat(30), pageWidth / 2, y, { align: 'center' });
    y += 2.5;

    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR');
    y = centerText('Imprimé le ' + dateStr, 4.5, 'normal');

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(4);
      doc.text('Page ' + i + '/' + pageCount, pageWidth - margins.right, 205, { align: 'right' });
    }

    const fileName = 'Ticket_' + (ticketNumber || 'ticket') + '.pdf';
    const pdfBlob = doc.output('blob');

    // ============================================================
    // GESTION DE LA SORTIE
    // ============================================================
    
    // ✅ Impression automatique
    if (options.autoPrint) {
      return new Promise((resolve, reject) => {
        try {
          const url = URL.createObjectURL(pdfBlob);
          
          // Créer un iframe caché
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.right = '-9999px';
          iframe.style.top = '-9999px';
          iframe.style.width = '0px';
          iframe.style.height = '0px';
          iframe.style.border = 'none';
          
          document.body.appendChild(iframe);
          
          iframe.onload = function() {
            try {
              // Lancer l'impression
              iframe.contentWindow.print();
              
              // Nettoyer après l'impression
              setTimeout(() => {
                document.body.removeChild(iframe);
                URL.revokeObjectURL(url);
                resolve(true);
              }, 1000);
            } catch (err) {
              document.body.removeChild(iframe);
              URL.revokeObjectURL(url);
              reject(err);
            }
          };
          
          iframe.onerror = function(err) {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
            reject(err);
          };
          
          iframe.src = url;
          
        } catch (err) {
          reject(err);
        }
      });
    }

    // ✅ Ouverture dans le navigateur
    if (options.openInBrowser) {
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 10000);
      return url;
    }

    // ✅ Téléchargement (par défaut)
    doc.save(fileName);
    return doc;

  } catch (error) {
    console.error('Erreur TicketPOS:', error);
    throw error;
  }
};

export default TicketPOS;