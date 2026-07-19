
// src/components/achats/CommandePdf.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import AxiosInstance from '../AxiosInstance';
import logoSvg from '../../assets/logo.svg';
import { Loader2, AlertCircle } from 'lucide-react';

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
    const margins = { left: 12, right: 12, top: 8, bottom: 8 };
    const contentWidth = pageWidth - margins.left - margins.right;
    let yPosition = margins.top;

    // === INFORMATIONS SOCIÉTÉ - BOUTIQUE STATION SODEPCI DE PARA ===
    const defaultCompany = {
      name: 'BOUTIQUE STATION SODEPCI DE PARA',
      sigle: 'BSSP',
      legal_form: 'Entreprise individuelle',
      activity: 'Commerce Général',
      address: 'Station SODEPCI de Para',
      address2: 'Côte d\'Ivoire, Abidjan',  // MODIFIÉ
      phone1: '07 47 55 71 69',
      phone2: '07 08 42 96 09',
      phone3: '',
      email: '',
      rccm: '',
      nif: '',
      bank_name: '',
      bank_account: '',
      bank_currency: 'FCFA (Franc CFA)',  // MODIFIÉ
      ...companyInfo,
    };

    // === FONCTIONS DE FORMAT ===
    const formatNumber = (n) => {
      const num = parseFloat(n) || 0;
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };
    
    const formatCurrency = (amount) => {
      if (!amount) return '0 FCFA';  // MODIFIÉ
      return formatNumber(amount) + ' FCFA';  // MODIFIÉ
    };
    
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
    const logoWidth = 32;
    const logoHeight = 16;
    if (logoData) {
      doc.addImage(logoData, 'PNG', margins.left, yPosition, logoWidth, logoHeight);
    } else {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(defaultCompany.sigle || defaultCompany.name, margins.left, yPosition + 5);
    }

    const textStartX = margins.left + (logoData ? logoWidth + 5 : 0);
    
    // Nom de l'entreprise
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(defaultCompany.name, textStartX, yPosition + 4);
    
    // Adresse
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(`Adresse: ${defaultCompany.address}`, textStartX, yPosition + 8.5);
    doc.text(` ${defaultCompany.address2}`, textStartX, yPosition + 12);  // Affiche "Côte d'Ivoire, Abidjan"
    
    // Téléphones
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    if (defaultCompany.phone2) {
      doc.text(`Tél: ${defaultCompany.phone1} / ${defaultCompany.phone2}`, textStartX, yPosition + 16.5);
    } else {
      doc.text(`Tél: ${defaultCompany.phone1}`, textStartX, yPosition + 16.5);
    }
    
    yPosition += 26;

    // ========== TITRE CENTRÉ ==========
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('BON DE COMMANDE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`N° ${order.po_number}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;

    // ========== BLOC STATUT ==========
    const statusColor = order.status === 'confirmed' ? [34, 197, 94] : 
                        order.status === 'cancelled' ? [239, 68, 68] : [59, 130, 246];
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.rect(pageWidth - margins.right - 32, yPosition - 5, 32, 6.5, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(getStatusLabel(order.status), pageWidth - margins.right - 16, yPosition - 0.5, { align: 'center' });

    // ========== TABLEAU RÉCAPITULATIF ==========
    const summaryHeight = 22;
    doc.setFillColor(248, 248, 248);
    doc.rect(margins.left, yPosition, contentWidth, summaryHeight, 'F');
    doc.rect(margins.left, yPosition, contentWidth, summaryHeight, 'S');
    
    let summaryY = yPosition + 3.5;
    const col1 = margins.left + 5;
    const col2 = margins.left + 65;
    const col3 = margins.left + 115;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Date commande :', col1, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(order.order_date), col1 + 30, summaryY);
    doc.setFont('helvetica', 'bold');
    doc.text('Livraison prévue :', col2, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(order.expected_delivery_date), col2 + 32, summaryY);
    summaryY += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Fournisseur :', col1, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(order.supplier_name || '-', col1 + 26, summaryY);
    doc.setFont('helvetica', 'bold');
    doc.text('Total :', col3, summaryY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text(formatCurrency(order.total), col3 + 14, summaryY);
    summaryY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Réf. fournisseur :', col1, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(order.supplier_reference || '-', col1 + 35, summaryY);
    doc.setFont('helvetica', 'bold');
    doc.text('Paiement :', col3, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(order.payment_method || 'Virement bancaire', col3 + 20, summaryY);
    
    yPosition += summaryHeight + 4;

    // ========== DÉTAILS FOURNISSEUR ==========
    doc.setFillColor(55, 65, 85);
    doc.rect(margins.left, yPosition, contentWidth, 4.5, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('INFORMATIONS FOURNISSEUR', margins.left + 5, yPosition + 3.5);
    yPosition += 7;
    
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const supplierInfo = [
      `Raison sociale : ${order.supplier_name || '-'}`,
      order.supplier_address ? `Adresse : ${order.supplier_address}` : null,
      order.supplier_phone ? `Tél : ${order.supplier_phone}` : null,
      order.supplier_email ? `Email : ${order.supplier_email}` : null,
    ].filter(Boolean);
    
    let infoY = yPosition + 1.5;
    supplierInfo.forEach((line, idx) => {
      doc.text(line, margins.left + 5, infoY + (idx * 4.5));
    });
    yPosition += supplierInfo.length * 4.5 + 4;

    // ========== TABLEAU DES PRODUITS ==========
    doc.setFillColor(55, 65, 85);
    doc.rect(margins.left, yPosition, contentWidth, 5.5, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('PRODUITS COMMANDÉS', pageWidth / 2, yPosition + 4, { align: 'center' });
    yPosition += 5.5;

    // En-têtes du tableau
    doc.setFillColor(220, 220, 220);
    doc.rect(margins.left, yPosition, contentWidth, 4.5, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    const colPositions = {
      product: margins.left + 3,
      qty: margins.left + 70,
      unitPrice: margins.left + 93,
      discount: margins.left + 122,
      total: margins.left + 152
    };
    
    doc.text('DÉSIGNATION', colPositions.product, yPosition + 3.5);
    doc.text('Qté', colPositions.qty, yPosition + 3.5, { align: 'center' });
    doc.text('Prix unit.', colPositions.unitPrice, yPosition + 3.5, { align: 'center' });
    doc.text('Remise', colPositions.discount, yPosition + 3.5, { align: 'center' });
    doc.text('Total HT', colPositions.total, yPosition + 3.5, { align: 'center' });
    yPosition += 4.5;

    // Lignes des produits
    let lineY = yPosition;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    if (order.lines && order.lines.length > 0) {
      order.lines.forEach((line, index) => {
        if (lineY > pageHeight - margins.bottom - 100) {
          doc.addPage();
          lineY = margins.top;
          doc.setFillColor(55, 65, 85);
          doc.rect(margins.left, lineY, contentWidth, 5.5, 'F');
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text('PRODUITS COMMANDÉS', pageWidth / 2, lineY + 4, { align: 'center' });
          lineY += 5.5;
          
          doc.setFillColor(220, 220, 220);
          doc.rect(margins.left, lineY, contentWidth, 4.5, 'F');
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text('DÉSIGNATION', colPositions.product, lineY + 3.5);
          doc.text('Qté', colPositions.qty, lineY + 3.5, { align: 'center' });
          doc.text('Prix unit.', colPositions.unitPrice, lineY + 3.5, { align: 'center' });
          doc.text('Remise', colPositions.discount, lineY + 3.5, { align: 'center' });
          doc.text('Total HT', colPositions.total, lineY + 3.5, { align: 'center' });
          lineY += 4.5;
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
        }
        
        const productName = line.product_name || line.product?.name || '-';
        const productNameDisplay = productName.length > 38 ? productName.substring(0, 35) + '...' : productName;
        const lineTotal = (line.quantity * line.unit_price) - (line.discount || 0);
        
        doc.text(productNameDisplay, colPositions.product, lineY + 3.5);
        doc.text(line.quantity.toString(), colPositions.qty, lineY + 3.5, { align: 'center' });
        doc.text(formatCurrency(line.unit_price), colPositions.unitPrice, lineY + 3.5, { align: 'center' });
        doc.text(formatCurrency(line.discount || 0), colPositions.discount, lineY + 3.5, { align: 'center' });
        doc.text(formatCurrency(lineTotal), colPositions.total, lineY + 3.5, { align: 'center' });
        
        lineY += 4.5;
      });
    } else {
      doc.text('Aucun produit', colPositions.product, lineY + 3.5);
      lineY += 4.5;
    }
    
    yPosition = lineY + 3;

    // ========== TOTAUX ==========
    const totalsX = pageWidth - margins.right - 50;
    
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    
    doc.text('Sous-total :', totalsX, yPosition);
    doc.text(formatCurrency(order.subtotal), pageWidth - margins.right - 2, yPosition, { align: 'right' });
    yPosition += 4;
    
    if (order.discount_amount > 0) {
      doc.text('Remise :', totalsX, yPosition);
      doc.text(`-${formatCurrency(order.discount_amount)}`, pageWidth - margins.right - 2, yPosition, { align: 'right' });
      yPosition += 4;
    }
    
    if (order.tax_amount > 0) {
      doc.text(`TVA (${order.tax_rate}%) :`, totalsX, yPosition);
      doc.text(formatCurrency(order.tax_amount), pageWidth - margins.right - 2, yPosition, { align: 'right' });
      yPosition += 4;
    }
    
    if (order.shipping_cost > 0) {
      doc.text('Frais livraison :', totalsX, yPosition);
      doc.text(formatCurrency(order.shipping_cost), pageWidth - margins.right - 2, yPosition, { align: 'right' });
      yPosition += 4;
    }
    
    doc.setDrawColor(200, 200, 200);
    doc.line(totalsX - 5, yPosition, pageWidth - margins.right, yPosition);
    yPosition += 2.5;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text('TOTAL TTC :', totalsX, yPosition);
    doc.text(formatCurrency(order.total), pageWidth - margins.right - 2, yPosition, { align: 'right' });
    yPosition += 7;

    // ========== NOTES ET CONDITIONS GÉNÉRALES ==========
    const hasNotes = order.notes && order.notes.trim().length > 0;
    
    // Vérifier l'espace disponible avant d'ajouter notes et conditions
    const spaceNeeded = (hasNotes ? 35 : 0) + 45;
    const availableSpace = pageHeight - margins.bottom - yPosition;
    
    if (availableSpace < spaceNeeded + 30) {
      doc.addPage();
      yPosition = margins.top;
    }
    
    if (hasNotes) {
      doc.setFillColor(55, 65, 85);
      doc.rect(margins.left, yPosition, contentWidth, 4.5, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('NOTES', margins.left + 5, yPosition + 3.5);
      yPosition += 6.5;
      
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const splitNotes = doc.splitTextToSize(order.notes, contentWidth - 10);
      const maxNotesLines = Math.min(splitNotes.length, 3);
      for (let i = 0; i < maxNotesLines; i++) {
        doc.text(splitNotes[i], margins.left + 5, yPosition + (i * 4.5));
      }
      yPosition += maxNotesLines * 4.5 + 3;
    }

    // CONDITIONS GÉNÉRALES
    doc.setFillColor(55, 65, 85);
    doc.rect(margins.left, yPosition, contentWidth, 4.5, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('CONDITIONS GÉNÉRALES', margins.left + 5, yPosition + 3.5);
    yPosition += 6.5;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const conditions = [
      '1. Délai de livraison : sous réserve de disponibilité des stocks.',
      '2. Paiement : selon conditions convenues.',
      '3. Annulation : par écrit au moins 7 jours avant livraison.',
      '4. Réception : réclamation dans les 48h.'
    ];
    conditions.forEach((condition, idx) => {
      doc.text(condition, margins.left + 5, yPosition + (idx * 4));
    });
    yPosition += conditions.length * 4 + 5;

    // ========== QR CODE ==========
    const qrCodeData = order.qr_code_url || order.qr_code;
    
    if (qrCodeData) {
      if (yPosition > pageHeight - margins.bottom - 55) {
        doc.addPage();
        yPosition = margins.top + 10;
      }
      
      const qrSize = 35;
      const qrX = pageWidth - margins.right - qrSize - 5;
      const qrY = yPosition;
      
      doc.setFillColor(248, 248, 248);
      doc.rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 18, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 18, 'S');
      
      try {
        let qrImageUrl = qrCodeData;
        
        if (qrCodeData.startsWith('/')) {
          const baseUrl = window.location.origin || 'http://127.0.0.1:8000';
          qrImageUrl = `${baseUrl}${qrCodeData}`;
        }
        
        const qrImage = await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          
          const timeout = setTimeout(() => {
            reject(new Error('Timeout QR Code'));
          }, 5000);
          
          img.onload = () => {
            clearTimeout(timeout);
            resolve(img);
          };
          
          img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Erreur chargement QR Code'));
          };
          
          img.src = qrImageUrl;
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = qrImage.width;
        canvas.height = qrImage.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(qrImage, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        
        doc.addImage(dataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Scanner pour détails', qrX + qrSize/2, qrY + qrSize + 5, { align: 'center' });
        
        doc.setFontSize(5);
        doc.setTextColor(130, 130, 130);
        doc.text('Bon de commande', qrX + qrSize/2, qrY + qrSize + 9, { align: 'center' });
        
        doc.setFontSize(4.5);
        doc.setTextColor(150, 150, 150);
        doc.text(`N° ${order.po_number}`, qrX + qrSize/2, qrY + qrSize + 13, { align: 'center' });
        
        yPosition += 42;
        
      } catch (error) {
        console.error('Erreur chargement QR Code:', error);
        
        doc.setFillColor(200, 200, 200);
        doc.rect(qrX, qrY, qrSize, qrSize, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('QR', qrX + qrSize/2, qrY + qrSize/2 + 3, { align: 'center' });
        
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Non disponible', qrX + qrSize/2, qrY + qrSize + 5, { align: 'center' });
        doc.text(`N° ${order.po_number}`, qrX + qrSize/2, qrY + qrSize + 9, { align: 'center' });
        
        yPosition += 42;
      }
    }

    // ========== SIGNATURES ==========
    if (yPosition > pageHeight - margins.bottom - 60) {
      doc.addPage();
      yPosition = margins.top + 10;
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('VALIDATION', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 7;
    
    const signatureWidth = (contentWidth - 8) / 2;
    const signatureHeight = 22;
    
    // Signature fournisseur (gauche)
    doc.rect(margins.left, yPosition, signatureWidth, signatureHeight, 'S');
    doc.setFillColor(248, 248, 248);
    doc.rect(margins.left, yPosition, signatureWidth, 4, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 70, 70);
    doc.text("BON POUR COMMANDE", margins.left + signatureWidth / 2, yPosition + 3, { align: 'center' });
    let sigY = yPosition + 7;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Fournisseur : ${order.supplier_name || '________________'}`, margins.left + 4, sigY);
    sigY += 5.5;
    doc.text('Date : _______________', margins.left + 4, sigY);
    sigY += 5.5;
    doc.text('Signature : _______________', margins.left + 4, sigY);
    
    // Signature société (droite)
    const employerX = margins.left + signatureWidth + 8;
    doc.rect(employerX, yPosition, signatureWidth, signatureHeight, 'S');
    doc.setFillColor(248, 248, 248);
    doc.rect(employerX, yPosition, signatureWidth, 4, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text("BON DE COMMANDE", employerX + signatureWidth / 2, yPosition + 3, { align: 'center' });
    sigY = yPosition + 7;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${defaultCompany.name}`, employerX + 4, sigY);
    sigY += 5.5;
    doc.text('Date : _______________', employerX + 4, sigY);
    sigY += 5.5;
    doc.text('Signature : _______________', employerX + 4, sigY);
    
    yPosition += signatureHeight + 10;

    // ========== PIED DE PAGE ==========
    if (yPosition < pageHeight - margins.bottom - 25) {
      yPosition = pageHeight - margins.bottom - 25;
    }
    
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
    yPosition += 2.5;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('MERCI ET LA PROCHAINE', pageWidth / 2, yPosition + 2, { align: 'center' });
    yPosition += 5.5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const footerText = `${defaultCompany.name} - Tél: ${defaultCompany.phone1}`;
    if (defaultCompany.phone2) {
      doc.text(`${footerText} / ${defaultCompany.phone2}`, pageWidth / 2, yPosition + 2, { align: 'center' });
    } else {
      doc.text(footerText, pageWidth / 2, yPosition + 2, { align: 'center' });
    }
    yPosition += 4.5;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${defaultCompany.address}, ${defaultCompany.address2}`, pageWidth / 2, yPosition + 2, { align: 'center' });
    yPosition += 4.5;
    
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(130, 130, 130);
    doc.text(`Document généré le ${formatDate(new Date().toISOString())}`, pageWidth / 2, yPosition + 2, { align: 'center' });

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
// COMPOSANT REACT - TÉLÉCHARGEMENT AUTOMATIQUE
// ============================================================
const CommandePdf = () => {
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

        setProgress(20);
        
        const response = await AxiosInstance.get(`/purchase-orders/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        
        setProgress(50);
        const order = response.data;
        
        await generatePurchaseOrderPdf(order);
        setProgress(100);
        
        setTimeout(() => {
          navigate(`/commandes-fournisseurs/${id}`);
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
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Erreur</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => navigate(`/commandes-fournisseurs/${id}`)} className="btn btn-primary">
            Retour à la commande
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default CommandePdf;