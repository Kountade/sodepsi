// src/components/achats/CommandePdf.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import AxiosInstance from '../AxiosInstance';
import logoSvg from '../../assets/logo.svg';
import { Loader2, AlertCircle, Download, ArrowLeft, FileText } from 'lucide-react';

// ============================================================
// FONCTION PRINCIPALE DE GÉNÉRATION DU PDF DE COMMANDE
// ============================================================
export const generatePurchaseOrderPdf = async (order, companyInfo = null) => {
  if (!order || typeof order !== 'object') {
    throw new Error('Données de la commande invalides');
  }

  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margins = { left: 15, right: 15, top: 10, bottom: 10 };
    const contentWidth = pageWidth - margins.left - margins.right;
    let yPosition = margins.top;

    // === INFORMATIONS SOCIÉTÉ ===
    const defaultCompany = {
      name: 'SEYDY GROUP',
      address: 'Dakar, Sénégal',
      address2: 'Immeuble Seydy, Avenue Cheikh Anta Diop',
      phone: '+221 33 123 45 67',
      email: 'contact@seydygroup.sn',
      website: 'www.seydygroup.sn',
      ninea: '123456789A',
      rccm: 'SN/DKR/2023/B-12345',
      ...companyInfo,
    };

    // === FONCTIONS DE FORMAT ===
    const formatNumber = (n) => {
      const num = parseFloat(n) || 0;
      return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
    };
    const formatCurrency = (amount) => (amount ? formatNumber(amount) + ' FCFA' : '0 FCFA');
    const formatDate = (dateString) => {
      if (!dateString) return '-';
      try { return new Date(dateString).toLocaleDateString('fr-FR'); } catch { return '-'; }
    };
    const getStatusLabel = (status) => {
      const map = {
        draft: 'Brouillon',
        sent: 'Envoyé',
        confirmed: 'Confirmé',
        partial: 'Partiellement reçu',
        received: 'Reçu',
        cancelled: 'Annulé'
      };
      return map[status] || status || '-';
    };

    // === CHARGEMENT DU LOGO ===
    const loadLogo = (src) => new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
    let logoData = null;
    try { logoData = await loadLogo(logoSvg); } catch { /* ignore */ }

    // ========== EN-TÊTE AVEC LOGO ==========
    const logoWidth = 35;
    const logoHeight = 17;
    if (logoData) {
      doc.addImage(logoData, 'PNG', margins.left, yPosition, logoWidth, logoHeight);
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(defaultCompany.name, margins.left, yPosition + 6);
    }

    const textStartX = margins.left + (logoData ? logoWidth + 5 : 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(defaultCompany.name, textStartX, yPosition + 4);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(defaultCompany.address, textStartX, yPosition + 9);
    doc.text(defaultCompany.address2, textStartX, yPosition + 13.5);
    doc.setFontSize(6);
    doc.text(`Tél: ${defaultCompany.phone} | Email: ${defaultCompany.email} | ${defaultCompany.website}`, textStartX, yPosition + 18);
    doc.text(`NINEA: ${defaultCompany.ninea} | RCCM: ${defaultCompany.rccm}`, textStartX, yPosition + 22);
    yPosition += 28;

    // Ligne séparatrice
    doc.setDrawColor(180, 180, 180);
    doc.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
    yPosition += 5;

    // ========== TITRE CENTRÉ ==========
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('BON DE COMMANDE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`N° ${order.po_number}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // ========== BLOC STATUT ==========
    const statusColor = order.status === 'confirmed' ? [34, 197, 94] : 
                        order.status === 'cancelled' ? [239, 68, 68] : [59, 130, 246];
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.rect(pageWidth - margins.right - 35, yPosition - 7, 35, 8, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(getStatusLabel(order.status), pageWidth - margins.right - 17.5, yPosition - 1.5, { align: 'center' });

    // ========== TABLEAU RÉCAPITULATIF ==========
    const summaryHeight = 38;
    doc.setFillColor(248, 248, 248);
    doc.rect(margins.left, yPosition, contentWidth, summaryHeight, 'F');
    doc.rect(margins.left, yPosition, contentWidth, summaryHeight, 'S');
    
    let summaryY = yPosition + 5;
    const col1 = margins.left + 5;
    const col2 = margins.left + 70;
    const col3 = margins.left + 120;
    const col4 = margins.left + 155;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Date commande :', col1, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(order.order_date), col1 + 35, summaryY);
    doc.setFont('helvetica', 'bold');
    doc.text('Livraison prévue :', col2, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(order.expected_delivery_date), col2 + 35, summaryY);
    summaryY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Fournisseur :', col1, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(order.supplier_name || '-', col1 + 28, summaryY);
    doc.setFont('helvetica', 'bold');
    doc.text('Total :', col3, summaryY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text(formatCurrency(order.total), col3 + 18, summaryY);
    summaryY += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Référence fournisseur :', col1, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(order.supplier_reference || '-', col1 + 48, summaryY);
    summaryY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Mode de paiement :', col1, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(order.payment_method || 'Virement bancaire', col1 + 40, summaryY);
    
    yPosition += summaryHeight + 5;

    // ========== DÉTAILS FOURNISSEUR ==========
    doc.setFillColor(55, 65, 85);
    doc.rect(margins.left, yPosition, contentWidth, 6, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('INFORMATIONS FOURNISSEUR', margins.left + 5, yPosition + 4.5);
    yPosition += 8;
    
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const supplierInfo = [
      `Raison sociale : ${order.supplier_name || '-'}`,
      order.supplier_address ? `Adresse : ${order.supplier_address}` : null,
      order.supplier_phone ? `Téléphone : ${order.supplier_phone}` : null,
      order.supplier_email ? `Email : ${order.supplier_email}` : null,
    ].filter(Boolean);
    supplierInfo.forEach((line, idx) => {
      doc.text(line, margins.left + 5, yPosition + (idx * 5));
    });
    yPosition += supplierInfo.length * 5 + 6;

    // ========== TABLEAU DES PRODUITS ==========
    // Titre centré
    doc.setFillColor(55, 65, 85);
    doc.rect(margins.left, yPosition, contentWidth, 7, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('PRODUITS COMMANDÉS', pageWidth / 2, yPosition + 5, { align: 'center' });
    yPosition += 7;

    // En-têtes du tableau - BIEN ALIGNÉS
    doc.setFillColor(220, 220, 220);
    doc.rect(margins.left, yPosition, contentWidth, 6, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    // Définir les positions des colonnes (optimisées)
    const colPositions = {
      product: margins.left + 3,
      qty: margins.left + 70,
      unitPrice: margins.left + 92,
      discount: margins.left + 120,
      total: margins.left + 152
    };
    
    doc.text('DÉSIGNATION', colPositions.product, yPosition + 4.5);
    doc.text('Qté', colPositions.qty, yPosition + 4.5, { align: 'center' });
    doc.text('Prix unit.', colPositions.unitPrice, yPosition + 4.5, { align: 'center' });
    doc.text('Remise', colPositions.discount, yPosition + 4.5, { align: 'center' });
    doc.text('Total HT', colPositions.total, yPosition + 4.5, { align: 'center' });
    yPosition += 6;

    // Lignes des produits
    let lineY = yPosition;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    if (order.lines && order.lines.length > 0) {
      order.lines.forEach((line, index) => {
        if (lineY > pageHeight - 70) {
          doc.addPage();
          lineY = margins.top;
          // Réafficher l'en-tête sur la nouvelle page
          doc.setFillColor(55, 65, 85);
          doc.rect(margins.left, lineY, contentWidth, 7, 'F');
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text('PRODUITS COMMANDÉS', pageWidth / 2, lineY + 5, { align: 'center' });
          lineY += 7;
          
          doc.setFillColor(220, 220, 220);
          doc.rect(margins.left, lineY, contentWidth, 6, 'F');
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text('DÉSIGNATION', colPositions.product, lineY + 4.5);
          doc.text('Qté', colPositions.qty, lineY + 4.5, { align: 'center' });
          doc.text('Prix unit.', colPositions.unitPrice, lineY + 4.5, { align: 'center' });
          doc.text('Remise', colPositions.discount, lineY + 4.5, { align: 'center' });
          doc.text('Total HT', colPositions.total, lineY + 4.5, { align: 'center' });
          lineY += 6;
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
        }
        
        const productName = line.product_name || line.product?.name || '-';
        const productNameDisplay = productName.length > 40 ? productName.substring(0, 37) + '...' : productName;
        
        // Calcul du total ligne
        const lineTotal = (line.quantity * line.unit_price) - (line.discount || 0);
        
        doc.text(productNameDisplay, colPositions.product, lineY + 4);
        doc.text(line.quantity.toString(), colPositions.qty, lineY + 4, { align: 'center' });
        doc.text(formatCurrency(line.unit_price), colPositions.unitPrice, lineY + 4, { align: 'center' });
        doc.text(formatCurrency(line.discount || 0), colPositions.discount, lineY + 4, { align: 'center' });
        doc.text(formatCurrency(lineTotal), colPositions.total, lineY + 4, { align: 'center' });
        
        lineY += 5.5;
      });
    } else {
      doc.text('Aucun produit', colPositions.product, lineY + 4);
      lineY += 6;
    }
    
    yPosition = lineY + 4;

    // ========== TOTAUX (alignés à droite) ==========
    doc.setDrawColor(200, 200, 200);
    doc.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
    yPosition += 3;
    
    // Largeur pour les totaux
    const totalsWidth = 55;
    const totalsX = pageWidth - margins.right - totalsWidth;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    
    // Sous-total
    doc.text('Sous-total :', totalsX, yPosition);
    doc.text(formatCurrency(order.subtotal), pageWidth - margins.right - 2, yPosition, { align: 'right' });
    yPosition += 5;
    
    // Remise
    if (order.discount_amount > 0) {
      doc.text('Remise :', totalsX, yPosition);
      doc.text(`-${formatCurrency(order.discount_amount)}`, pageWidth - margins.right - 2, yPosition, { align: 'right' });
      yPosition += 5;
    }
    
    // TVA
    if (order.tax_amount > 0) {
      doc.text(`TVA (${order.tax_rate}%) :`, totalsX, yPosition);
      doc.text(formatCurrency(order.tax_amount), pageWidth - margins.right - 2, yPosition, { align: 'right' });
      yPosition += 5;
    }
    
    // Frais de livraison
    if (order.shipping_cost > 0) {
      doc.text('Frais de livraison :', totalsX, yPosition);
      doc.text(formatCurrency(order.shipping_cost), pageWidth - margins.right - 2, yPosition, { align: 'right' });
      yPosition += 5;
    }
    
    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.line(totalsX - 5, yPosition, pageWidth - margins.right, yPosition);
    yPosition += 4;
    
    // TOTAL
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text('TOTAL TTC :', totalsX, yPosition);
    doc.text(formatCurrency(order.total), pageWidth - margins.right - 2, yPosition, { align: 'right' });
    yPosition += 10;

    // ========== NOTES ==========
    if (order.notes) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margins.left, yPosition, contentWidth, 7, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('NOTES', margins.left + 5, yPosition + 5);
      yPosition += 7;
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const splitNotes = doc.splitTextToSize(order.notes, contentWidth - 10);
      const notesLines = splitNotes.slice(0, 4);
      doc.text(notesLines, margins.left + 5, yPosition);
      yPosition += notesLines.length * 4 + 4;
    }

    // ========== CONDITIONS GÉNÉRALES ==========
    if (yPosition > pageHeight - 55) {
      doc.addPage();
      yPosition = margins.top;
    }
    
    doc.setFillColor(245, 245, 245);
    doc.rect(margins.left, yPosition, contentWidth, 7, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('CONDITIONS GÉNÉRALES', margins.left + 5, yPosition + 5);
    yPosition += 7;
    
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const conditions = [
      '1. Délai de livraison : la commande sera livrée à la date indiquée sous réserve de disponibilité des stocks.',
      '2. Paiement : selon les conditions convenues avec le fournisseur.',
      '3. Annulation : toute annulation doit être notifiée par écrit au moins 7 jours avant la livraison.',
      '4. Réception : tout produit manquant ou endommagé doit être signalé dans les 48h suivant la réception.'
    ];
    conditions.forEach((condition, idx) => {
      doc.text(condition, margins.left + 5, yPosition + (idx * 4.5));
    });
    yPosition += conditions.length * 4.5 + 6;

    // ========== SIGNATURES ==========
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margins.top;
    }
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
    yPosition += 5;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('VALIDATION', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 7;
    
    const signatureWidth = (contentWidth - 10) / 2;
    const signatureHeight = 28;
    
    // Signature fournisseur (gauche)
    doc.rect(margins.left, yPosition, signatureWidth, signatureHeight, 'S');
    doc.setFillColor(248, 248, 248);
    doc.rect(margins.left, yPosition, signatureWidth, 5, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 70, 70);
    doc.text("BON POUR COMMANDE", margins.left + signatureWidth / 2, yPosition + 4, { align: 'center' });
    let sigY = yPosition + 9;
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Fournisseur : ${order.supplier_name || '________________'}`, margins.left + 4, sigY);
    sigY += 6;
    doc.text('Date : _______________', margins.left + 4, sigY);
    sigY += 6;
    doc.text('Signature et cachet : _______________', margins.left + 4, sigY);
    
    // Signature société (droite)
    const employerX = margins.left + signatureWidth + 10;
    doc.rect(employerX, yPosition, signatureWidth, signatureHeight, 'S');
    doc.setFillColor(248, 248, 248);
    doc.rect(employerX, yPosition, signatureWidth, 5, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text("BON DE COMMANDE", employerX + signatureWidth / 2, yPosition + 4, { align: 'center' });
    sigY = yPosition + 9;
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Société : ${defaultCompany.name}`, employerX + 4, sigY);
    sigY += 6;
    doc.text('Date : _______________', employerX + 4, sigY);
    sigY += 6;
    doc.text('Signature : _______________', employerX + 4, sigY);
    
    yPosition += signatureHeight + 8;

    // ========== PIED DE PAGE ==========
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(margins.left, pageHeight - margins.bottom - 14, pageWidth - margins.right, pageHeight - margins.bottom - 14);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(defaultCompany.name, pageWidth / 2, pageHeight - margins.bottom - 10, { align: 'center' });
    doc.text(`NINEA: ${defaultCompany.ninea} | RCCM: ${defaultCompany.rccm}`, pageWidth / 2, pageHeight - margins.bottom - 6, { align: 'center' });
    doc.text(`Tél: ${defaultCompany.phone} | Email: ${defaultCompany.email}`, pageWidth / 2, pageHeight - margins.bottom - 2, { align: 'center' });
    doc.setFontSize(5);
    doc.setTextColor(130, 130, 130);
    doc.text(`Document généré le ${formatDate(new Date().toISOString())}`, pageWidth / 2, pageHeight - margins.bottom + 2, { align: 'center' });

    // Sauvegarde du PDF
    const fileName = `Bon_Commande_${order.po_number}_${order.supplier_name || 'fournisseur'}.pdf`;
    doc.save(fileName);
    return true;
    
  } catch (error) {
    console.error('Erreur generatePurchaseOrderPdf:', error);
    throw new Error('Génération PDF échouée : ' + error.message);
  }
};

// ============================================================
// COMPOSANT REACT
// ============================================================
const CommandePdf = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('Token');
        const res = await AxiosInstance.get(`/purchase-orders/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setOrder(res.data);
      } catch (err) {
        console.error('Erreur chargement:', err);
        setError('Erreur lors du chargement de la commande');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  const handleGenerate = async () => {
    if (!order) return;
    setGenerating(true);
    try {
      await generatePurchaseOrderPdf(order);
    } catch (err) {
      console.error(err);
      alert('Erreur : ' + (err.message || 'Génération échouée'));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)] bg-gray-50">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
        <p className="ml-2 text-gray-500">Chargement de la commande...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Erreur</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => navigate('/commandes-fournisseurs')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-xl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <button onClick={() => navigate(`/commandes-fournisseurs/${id}`)} className="btn btn-ghost gap-2">
                <ArrowLeft size={16} /> Retour
              </button>
              <button onClick={handleGenerate} disabled={generating} className="btn btn-primary gap-2">
                {generating ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                Télécharger le PDF
              </button>
            </div>
            
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold">{order?.po_number}</h2>
              <p className="text-base-content/60 mt-2">{order?.supplier_name}</p>
              <p className="text-base-content/50 mt-1 text-sm">
                Montant total: {order?.total?.toLocaleString()} FCFA
              </p>
              <p className="text-base-content/40 mt-4 text-sm">
                Cliquez sur le bouton pour générer le bon de commande PDF
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandePdf;