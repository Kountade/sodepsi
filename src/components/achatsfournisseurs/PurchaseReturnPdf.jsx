// src/components/achats/PurchaseReturnPdf.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import AxiosInstance from '../AxiosInstance';
import { Loader2, AlertCircle } from 'lucide-react';

// ========== RÉCUPÉRATION DES DONNÉES DE L'ÉTABLISSEMENT ==========
let etablissementCache = null;
let etablissementPromise = null;

const getEtablissement = async () => {
  if (etablissementCache) return etablissementCache;
  if (etablissementPromise) return await etablissementPromise;

  etablissementPromise = (async () => {
    try {
      const token = localStorage.getItem('Token');
      const response = await AxiosInstance.get('/etablissements/unique/', {
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

// ========== FONCTIONS DE FORMATAGE ==========
const formatNumber = (n) => {
  const num = parseFloat(n) || 0;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const formatCurrency = (amt, devise = 'FCFA') => {
  const num = parseFloat(amt) || 0;
  return `${formatNumber(num)} ${devise}`;
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

// ========== GESTION DES STATUTS ==========
const getStatusInfo = (status) => {
  const map = {
    requested: { label: 'Demandé', color: [255, 152, 0] },
    approved: { label: 'Approuvé', color: [33, 150, 243] },
    shipped: { label: 'Expédié', color: [156, 39, 176] },
    refunded: { label: 'Remboursé', color: [76, 175, 80] },
    replaced: { label: 'Remplacé', color: [0, 188, 212] },
    rejected: { label: 'Refusé', color: [211, 47, 47] }
  };
  return map[status] || { label: status || 'Inconnu', color: [158, 158, 158] };
};

const getReasonLabel = (reason) => {
  const map = {
    defective: 'Produit défectueux',
    wrong_product: 'Produit incorrect',
    expired: 'Produit expiré',
    damaged: 'Produit endommagé',
    other: 'Autre'
  };
  return map[reason] || reason || 'Non précisé';
};

// ========== FILIGRANE ==========
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
    doc.text(text, pageWidth / 2, pageHeight / 2, {
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

// ========== CHARGEMENT DU QR CODE ==========
const loadQrCode = async (qrUrl) => {
  if (!qrUrl) return null;

  try {
    let fullUrl = qrUrl;
    if (!qrUrl.startsWith('http://') && !qrUrl.startsWith('https://')) {
      const baseURL = AxiosInstance.defaults.baseURL || '';
      fullUrl = `${baseURL}${qrUrl.startsWith('/') ? '' : '/'}${qrUrl}`;
    }

    const token = localStorage.getItem('Token');
    const response = await fetch(fullUrl, {
      headers: token ? { Authorization: `Token ${token}` } : {}
    });

    if (!response.ok) {
      console.warn('QR Code non accessible:', response.status);
      return null;
    }

    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Erreur chargement QR Code:', error);
    return null;
  }
};

// ========== GÉNÉRATION PDF ==========
export const generatePurchaseReturnPdf = async (returnData, options = {}) => {
  if (!returnData || typeof returnData !== 'object') {
    throw new Error('Données du retour invalides');
  }

  try {
    const etab = await getEtablissement();

    const company = {
      name: etab?.nom || 'BOUTIQUE STATION SODEPCI',
      sigle: etab?.sigle || '',
      address: etab?.adresse || 'PARA EN FACE DU GRAND HOPITAL DE PARA',
      phone: etab?.telephone || '070 84 29 609 / 074 75 57 169',
      email: etab?.email || '',
      site_web: etab?.site_web || '',
      devise: etab?.devise || 'FCFA',
      phone1: (etab?.telephone || '070 84 29 609').split('/')[0].trim(),
      phone2: (etab?.telephone || '070 84 29 609 / 074 75 57 169').split('/')[1]?.trim() || '',
      gérant: 'ZAKARIA',
      rccm: etab?.rccm || '',
      nif: etab?.nif || '',
      capital: etab?.capital || '',
    };

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margins = { left: 15, right: 15, top: 18, bottom: 18 };
    const contentWidth = pageWidth - margins.left - margins.right;
    let y = margins.top;

    const statusInfo = getStatusInfo(returnData.status);
    const dateRetour = returnData.return_date || new Date().toISOString().split('T')[0];

    // ========== LOGO ==========
    const loadLogo = async () => {
      if (!etab?.logo) return null;
      try {
        let logoUrl = etab.logo;
        if (!logoUrl.startsWith('http://') && !logoUrl.startsWith('https://')) {
          const baseURL = AxiosInstance.defaults.baseURL || '';
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

    // ========== QR CODE ==========
    const qrCodeUrl = returnData.qr_code_url || returnData.qr_code || null;
    let qrCodeData = null;
    if (qrCodeUrl) {
      qrCodeData = await loadQrCode(qrCodeUrl);
    }

    // Filigrane
    const watermarkText = options.watermark || 'RETOUR FOURNISSEUR';
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

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(26, 35, 126);
    doc.text(company.name, textStartX, y + 6);

    if (company.sigle) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(84, 110, 122);
      doc.text(company.sigle, textStartX, y + 11);
      y += 5;
    }

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(84, 110, 122);
    doc.text(company.address.toUpperCase(), textStartX, y + 12);
    doc.text(`Tél: ${company.phone}`, textStartX, y + 16.5);
    if (company.email) {
      doc.text(`Email: ${company.email}`, textStartX, y + 21);
      y += 5;
    }

    const titleX = pageWidth - margins.right;
    const titleY = y + 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(220, 38, 38); // Rouge
    doc.text('RETOUR FOURNISSEUR', titleX, titleY, { align: 'right' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(84, 110, 122);
    doc.text(`N° ${returnData.return_number || '-'}`, titleX, titleY + 8, { align: 'right' });
    doc.text(`Date: ${formatDate(dateRetour)}`, titleX, titleY + 16, { align: 'right' });

    y += 32;
    doc.setDrawColor(220, 38, 38);
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

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 144, 156);
    doc.text('FOURNISSEUR', gridX1 + 4, gridY + 4.5);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text(returnData.supplier_name || 'Fournisseur inconnu', gridX1 + 4, gridY + 11);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(84, 110, 122);
    if (returnData.po_number) doc.text(`Commande N° ${returnData.po_number}`, gridX1 + 4, gridY + 17);
    if (returnData.receipt_number) doc.text(`Réception N° ${returnData.receipt_number}`, gridX1 + 4, gridY + 22);

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

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 144, 156);
    doc.text('MOTIF', gridX2 + 4, gridY + 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(153, 27, 27);
    doc.text(getReasonLabel(returnData.reason), gridX2 + 4, gridY + 24);

    y = gridY + 28;

    // ================================================================
    // TABLEAU DES PRODUITS
    // ================================================================
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text('DÉTAIL DES PRODUITS RETOURNÉS', margins.left, y);
    y += 2;
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.5);
    doc.line(margins.left, y, pageWidth - margins.right, y);
    y += 6;

    const colDescX = margins.left;
    const colLotX = margins.left + 70;
    const colQtyX = margins.left + 105;
    const colPuX = margins.left + 125;
    const colTotX = pageWidth - margins.right - 2;

    const headerY = y;
    doc.setFillColor(26, 35, 126);
    doc.roundedRect(colDescX, headerY, contentWidth, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Désignation', colDescX + 3, headerY + 4.5);
    doc.text('N° Lot', colLotX + 3, headerY + 4.5);
    doc.text('Qté', colQtyX + 3, headerY + 4.5);
    doc.text('P.U.', colPuX + 3, headerY + 4.5);
    doc.text('Total', colTotX - 3, headerY + 4.5, { align: 'right' });

    y = headerY + 7;
    let currentY = y;
    let rowIndex = 0;

    const lines = returnData.lines || returnData.items || [];

    if (lines.length === 0) {
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('Aucun produit dans ce retour.', colDescX + 3, currentY + 5);
      currentY += 10;
    } else {
      for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        const productName = line.product_name || line.product?.name || 'Produit inconnu';
        const productCode = line.product_code || '';
        const qty = line.quantity || 0;
        const unitPrice = parseFloat(line.unit_price) || 0;
        const total = parseFloat(line.total) || 0;
        const lotNumber = line.lot_number || '-';

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
          doc.text('N° Lot', colLotX + 3, currentY + 4.5);
          doc.text('Qté', colQtyX + 3, currentY + 4.5);
          doc.text('P.U.', colPuX + 3, currentY + 4.5);
          doc.text('Total', colTotX - 3, currentY + 4.5, { align: 'right' });
          currentY += 7;
        }

        if (rowIndex % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(colDescX, currentY - 0.5, contentWidth, 6.5, 'F');
        }

        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.1);
        doc.line(colDescX, currentY, colDescX, currentY + 6);
        doc.line(colLotX, currentY, colLotX, currentY + 6);
        doc.line(colQtyX, currentY, colQtyX, currentY + 6);
        doc.line(colPuX, currentY, colPuX, currentY + 6);
        doc.line(colTotX, currentY, colTotX, currentY + 6);

        doc.setTextColor(33, 33, 33);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(productName, colDescX + 3, currentY + 3);
        if (productCode) {
          doc.setFontSize(5.5);
          doc.setTextColor(120, 144, 156);
          doc.text(productCode, colDescX + 3, currentY + 5.5);
          doc.setFontSize(7);
          doc.setTextColor(33, 33, 33);
        }
        doc.text(lotNumber, colLotX + 3, currentY + 4);
        doc.setFont('helvetica', 'bold');
        doc.text(qty.toString(), colQtyX + 3, currentY + 4);
        doc.setFont('helvetica', 'normal');
        doc.text(formatNumber(unitPrice), colPuX + 3, currentY + 4);
        doc.setFont('helvetica', 'bold');
        doc.text(formatNumber(total), colTotX - 3, currentY + 4, { align: 'right' });

        currentY += 6.5;
        rowIndex++;
      }
    }

    doc.setDrawColor(180, 180, 190);
    doc.setLineWidth(0.3);
    doc.line(colDescX, currentY, pageWidth - margins.right, currentY);
    y = currentY + 5;

    // ================================================================
    // RÉCAPITULATIF DU MONTANT
    // ================================================================
    let ay = y;

    const totalAmount = lines.reduce((sum, l) => sum + (parseFloat(l.total) || 0), 0);
    const totalQuantity = lines.reduce((sum, l) => sum + (parseInt(l.quantity) || 0), 0);

    const totalBoxHeight = 18;
    doc.setFillColor(254, 226, 226);
    doc.roundedRect(margins.left, ay, contentWidth, totalBoxHeight, 2, 2, 'F');
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.4);
    doc.roundedRect(margins.left, ay, contentWidth, totalBoxHeight, 2, 2, 'S');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(153, 27, 27);
    doc.text('TOTAL À RETOURNER', margins.left + 6, ay + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(153, 27, 27);
    doc.text(`${totalQuantity} article(s)`, margins.left + 6, ay + 13);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(220, 38, 38);
    doc.text(formatCurrency(totalAmount, company.devise), pageWidth - margins.right - 6, ay + 11, { align: 'right' });

    ay += totalBoxHeight + 6;

    // ================================================================
    // NOTES (gauche) + SIGNATURES (droite)
    // ================================================================
    const notesText = (returnData.notes && typeof returnData.notes === 'string' && returnData.notes.trim())
      ? returnData.notes.trim()
      : '';

    const blockGap = 6;
    const leftColWidth = (contentWidth - blockGap) * 0.55;
    const rightColWidth = (contentWidth - blockGap) * 0.45;
    const leftColX = margins.left;
    const rightColX = margins.left + leftColWidth + blockGap;

    const blockHeight = 42;
    const blockY = ay;

    // COLONNE GAUCHE : NOTES
    if (notesText) {
      doc.setFillColor(255, 248, 230);
      doc.roundedRect(leftColX, blockY, leftColWidth, blockHeight, 2, 2, 'F');
      doc.setDrawColor(255, 204, 128);
      doc.setLineWidth(0.4);
      doc.roundedRect(leftColX, blockY, leftColWidth, blockHeight, 2, 2, 'S');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(230, 81, 0);
      doc.text('NOTES', leftColX + 5, blockY + 6);

      doc.setDrawColor(255, 204, 128);
      doc.setLineWidth(0.3);
      doc.line(leftColX + 5, blockY + 8, leftColX + leftColWidth - 5, blockY + 8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(66, 66, 66);
      doc.setFontSize(7.5);

      const notesPadding = 5;
      const notesMaxWidth = leftColWidth - (notesPadding * 2);
      const notesMaxHeight = blockHeight - 14;

      let notesFontSize = 7.5;
      doc.setFontSize(notesFontSize);
      let splitNotes = doc.splitTextToSize(notesText, notesMaxWidth);

      while (splitNotes.length * 3.5 > notesMaxHeight && notesFontSize > 5.5) {
        notesFontSize -= 0.5;
        doc.setFontSize(notesFontSize);
        splitNotes = doc.splitTextToSize(notesText, notesMaxWidth);
      }

      const maxLines = Math.floor(notesMaxHeight / 3.5);
      if (splitNotes.length > maxLines) {
        splitNotes = splitNotes.slice(0, maxLines);
        splitNotes[maxLines - 1] = splitNotes[maxLines - 1].slice(0, -3) + '...';
      }

      doc.text(splitNotes, leftColX + notesPadding, blockY + 14);
    } else {
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(leftColX, blockY, leftColWidth, blockHeight, 2, 2, 'F');
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.3);
      doc.roundedRect(leftColX, blockY, leftColWidth, blockHeight, 2, 2, 'S');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(180, 180, 180);
      doc.text('Aucune note', leftColX + leftColWidth / 2, blockY + blockHeight / 2, { align: 'center' });
    }

    // COLONNE DROITE : SIGNATURES
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(rightColX, blockY, rightColWidth, blockHeight, 2, 2, 'F');
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.4);
    doc.roundedRect(rightColX, blockY, rightColWidth, blockHeight, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text('SIGNATURES', rightColX + 5, blockY + 6);

    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.3);
    doc.line(rightColX + 5, blockY + 8, rightColX + rightColWidth - 5, blockY + 8);

    const sigGap = 4;
    const sigInnerPadding = 4;
    const sigColWidth = (rightColWidth - (sigInnerPadding * 2) - sigGap) / 2;
    const sig1X = rightColX + sigInnerPadding;
    const sig2X = sig1X + sigColWidth + sigGap;

    const sigLineY = blockY + blockHeight - 12;

    // Préparé par
    doc.setDrawColor(66, 66, 66);
    doc.setLineWidth(0.4);
    doc.line(sig1X, sigLineY, sig1X + sigColWidth, sigLineY);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(84, 110, 122);
    doc.text('Préparé par', sig1X + sigColWidth / 2, sigLineY + 4, { align: 'center' });

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 144, 156);
    const preparerDisplay = (returnData.created_by_name || 'Gestionnaire').length > 20
      ? (returnData.created_by_name || 'Gestionnaire').substring(0, 18) + '...'
      : (returnData.created_by_name || 'Gestionnaire');
    doc.text(preparerDisplay, sig1X + sigColWidth / 2, sigLineY + 8, { align: 'center' });

    // Reçu par (Fournisseur)
    doc.setDrawColor(66, 66, 66);
    doc.setLineWidth(0.4);
    doc.line(sig2X, sigLineY, sig2X + sigColWidth, sigLineY);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(84, 110, 122);
    doc.text('Reçu par (Fournisseur)', sig2X + sigColWidth / 2, sigLineY + 4, { align: 'center' });

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 144, 156);
    doc.text('Signature & cachet', sig2X + sigColWidth / 2, sigLineY + 8, { align: 'center' });

    // ================================================================
    // QR CODE
    // ================================================================
    if (qrCodeData) {
      const qrSize = 24;
      const qrX = pageWidth - margins.right - qrSize;
      const qrY = blockY + blockHeight + 5;

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 9, 2, 2, 'F');
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.3);
      doc.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 9, 2, 2, 'S');

      doc.addImage(qrCodeData, 'PNG', qrX, qrY, qrSize, qrSize);

      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(84, 110, 122);
      doc.text('Vérification', qrX + qrSize / 2, qrY + qrSize + 3.5, { align: 'center' });
      doc.setFontSize(5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 144, 156);
      doc.text(`N° ${returnData.return_number || '-'}`, qrX + qrSize / 2, qrY + qrSize + 7, { align: 'center' });
    }

    y = blockY + blockHeight + 6;

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
    // PAGINATION + FILIGRANE
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
    const filename = options.filename || `Retour_Fournisseur_${returnData.return_number || 'retour'}.pdf`;
    doc.save(filename);
    return true;

  } catch (error) {
    console.error('Erreur generatePurchaseReturnPdf:', error);
    throw error;
  }
};

// ============================================================
// COMPOSANT REACT - TÉLÉCHARGEMENT AUTOMATIQUE
// ============================================================
const PurchaseReturnPdf = () => {
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

        const response = await AxiosInstance.get(`/purchase-returns/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });

        setProgress(50);
        const returnData = response.data;

        await generatePurchaseReturnPdf(returnData);
        setProgress(100);

        setTimeout(() => {
          navigate(`/retours-fournisseurs/${id}`);
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
          <button onClick={() => navigate(`/retours-fournisseurs/${id}`)} className="btn btn-primary">
            Retour au détail
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default PurchaseReturnPdf;