// src/components/retours-clients/RetourClientPdf.jsx
import jsPDF from 'jspdf';
import axiosInstance from '../AxiosInstance';

// ========== RÉCUPÉRATION DES DONNÉES DE L'ÉTABLISSEMENT ==========
let etablissementCache = null;
let etablissementPromise = null;

const getEtablissement = async () => {
  if (etablissementCache) return etablissementCache;

  if (etablissementPromise) return await etablissementPromise;

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

// ========== NOMBRE EN LETTRES ==========
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

// ========== TYPE D'AVOIR ==========
const getTypeInfo = (type) => {
  const map = {
    refund: { label: 'REMBOURSEMENT', color: [244, 67, 54] },
    return: { label: 'RETOUR DE MARCHANDISE', color: [255, 152, 0] },
    discount: { label: 'REMISE', color: [33, 150, 243] },
    error: { label: 'ERREUR DE FACTURATION', color: [158, 158, 158] }
  };
  return map[type] || { label: 'AVOIR', color: [158, 158, 158] };
};

// ========== FILIGRANE ==========
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
  doc.setGState(new doc.GState({ opacity }));

  const diagonal = Math.sqrt(pageWidth * pageWidth + pageHeight * pageHeight);
  const textWidth = doc.getTextWidth(text);

  const numX = Math.ceil((diagonal + textWidth) / (textWidth + spacing));
  const numY = Math.ceil(diagonal / spacing);

  const offsetX = (pageWidth - numX * (textWidth + spacing)) / 2;
  const offsetY = (pageHeight - numY * spacing) / 2;

  if (!repeat) {
    doc.text(text, pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle,
      baseline: 'middle'
    });
  } else {
    for (let i = 0; i < numY; i++) {
      for (let j = 0; j < numX; j++) {
        doc.text(text, offsetX + j * (textWidth + spacing), offsetY + i * spacing, {
          angle,
          baseline: 'middle'
        });
      }
    }
  }

  doc.setFontSize(currentFontSize);
  doc.setTextColor(currentTextColor[0], currentTextColor[1], currentTextColor[2]);
  doc.setGState(new doc.GState({ opacity: 1 }));
};

// ========== CHARGEMENT LOGO ==========
const loadLogo = async (logoUrl) => {
  if (!logoUrl) return null;
  try {
    let fullUrl = logoUrl;
    if (!logoUrl.startsWith('http://') && !logoUrl.startsWith('https://')) {
      const baseURL = axiosInstance.defaults.baseURL || '';
      fullUrl = `${baseURL}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
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
      img.src = fullUrl;
    });
  } catch {
    return null;
  }
};

// ========== CHARGEMENT QR CODE ==========
const loadQrCode = async (qrUrl) => {
  if (!qrUrl) return null;
  try {
    let fullUrl = qrUrl;
    if (!qrUrl.startsWith('http://') && !qrUrl.startsWith('https://')) {
      const baseURL = axiosInstance.defaults.baseURL || '';
      fullUrl = `${baseURL}${qrUrl.startsWith('/') ? '' : '/'}${qrUrl}`;
    }
    const token = localStorage.getItem('Token');
    const response = await fetch(fullUrl, {
      headers: token ? { Authorization: `Token ${token}` } : {}
    });
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Erreur QR Code:', error);
    return null;
  }
};

// ========== GÉNÉRATION PDF ==========
const generateRetourPdf = async (avoir, options = {}) => {
  if (!avoir || typeof avoir !== 'object') {
    throw new Error('Données du retour invalides');
  }

  try {
    const etab = await getEtablissement();

    const company = {
      name: etab?.nom || 'ETABLISSEMENTS BAH SOULEYMANE ET FILS',
      sigle: etab?.sigle || 'E.B.S.F',
      address: etab?.adresse || 'Pita Centre – Grand Marché, Guinée',
      phone: etab?.telephone || '+224 626 53 32 53',
      email: etab?.email || 'ebsfservices@gmail.com',
      gérant: 'ZAKARIA'
    };

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margins = { left: 15, right: 15, top: 18, bottom: 18 };
    const contentWidth = pageWidth - margins.left - margins.right;
    let y = margins.top;

    const typeInfo = getTypeInfo(avoir.type);
    const totalEnLettres = nombreEnLettres(parseFloat(avoir.amount) || 0);

    const logoData = await loadLogo(etab?.logo);
    const qrCodeData = avoir.qr_code_url ? await loadQrCode(avoir.qr_code_url) : null;

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
    doc.setFontSize(13);
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
    }

    const titleX = pageWidth - margins.right;
    const titleY = y + 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(typeInfo.color[0], typeInfo.color[1], typeInfo.color[2]);
    doc.text('AVOIR', titleX, titleY, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text(`N° ${avoir.avoir_number || '-'}`, titleX, titleY + 8, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(84, 110, 122);
    doc.text(`Date: ${formatDate(avoir.date)}`, titleX, titleY + 16, { align: 'right' });

    y += 32;
    doc.setDrawColor(26, 35, 126);
    doc.setLineWidth(0.4);
    doc.line(margins.left, y, pageWidth - margins.right, y);
    y += 8;

    // ================================================================
    // BANDEAU TYPE
    // ================================================================
    doc.setFillColor(typeInfo.color[0], typeInfo.color[1], typeInfo.color[2]);
    doc.roundedRect(margins.left, y, contentWidth, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(typeInfo.label, pageWidth / 2, y + 6.5, { align: 'center' });
    y += 14;

    // ================================================================
    // GRILLE D'INFORMATIONS
    // ================================================================
    const gridY = y;
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margins.left, gridY, contentWidth, 26, 2, 2, 'F');
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.5);
    doc.roundedRect(margins.left, gridY, contentWidth, 26, 2, 2, 'S');

    const colWidth = contentWidth / 2;
    const gridX1 = margins.left;
    const gridX2 = margins.left + colWidth;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 144, 156);
    doc.text('CLIENT', gridX1 + 4, gridY + 4.5);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text(avoir.client_name || 'Client', gridX1 + 4, gridY + 12);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(84, 110, 122);
    if (avoir.client_phone) {
      doc.text(`Tél: ${avoir.client_phone}`, gridX1 + 4, gridY + 18);
    }

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 144, 156);
    doc.text('VENTE ASSOCIÉE', gridX2 + 4, gridY + 4.5);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text(avoir.sale_number || avoir.sale || 'Aucune', gridX2 + 4, gridY + 12);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 144, 156);
    doc.text('MONTANT', gridX2 + 4, gridY + 20);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(typeInfo.color[0], typeInfo.color[1], typeInfo.color[2]);
    doc.text(formatCurrency(avoir.amount), gridX2 + 4, gridY + 26);

    y = gridY + 30;

    // ================================================================
    // RAISON
    // ================================================================
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 35, 126);
    doc.text('RAISON DU RETOUR', margins.left, y);
    y += 2;
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.5);
    doc.line(margins.left, y, pageWidth - margins.right, y);
    y += 6;

    doc.setFillColor(255, 248, 230);
    doc.roundedRect(margins.left, y, contentWidth, 22, 2, 2, 'F');
    doc.setDrawColor(255, 204, 128);
    doc.setLineWidth(0.4);
    doc.roundedRect(margins.left, y, contentWidth, 22, 2, 2, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(66, 66, 66);

    const raisonText = avoir.reason || 'Aucune raison spécifiée';
    const splitRaison = doc.splitTextToSize(raisonText, contentWidth - 10);
    doc.text(splitRaison.slice(0, 5), margins.left + 5, y + 6);

    y += 26;

    // ================================================================
    // MONTANT EN LETTRES
    // ================================================================
    const lettresBoxHeight = 14;
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margins.left, y, contentWidth, lettresBoxHeight, 2, 2, 'F');
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.5);
    doc.roundedRect(margins.left, y, contentWidth, lettresBoxHeight, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(84, 110, 122);
    doc.text('Montant en toutes lettres :', margins.left + 6, y + 9);

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
      doc.text(splitLettres, lettresStartX, y + 5);
    } else {
      doc.text(totalEnLettres, lettresStartX, y + 9);
    }

    y += lettresBoxHeight + 8;

    // ================================================================
    // NOTES + SIGNATURES
    // ================================================================
    const notesText = (avoir.notes && typeof avoir.notes === 'string' && avoir.notes.trim())
      ? avoir.notes.trim()
      : '';

    const blockGap = 6;
    const leftColWidth = (contentWidth - blockGap) * 0.55;
    const rightColWidth = (contentWidth - blockGap) * 0.45;
    const leftColX = margins.left;
    const rightColX = margins.left + leftColWidth + blockGap;

    const blockHeight = 42;
    const blockY = y;

    // Notes
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

      const splitNotes = doc.splitTextToSize(notesText, leftColWidth - 10);
      doc.text(splitNotes.slice(0, 8), leftColX + 5, blockY + 14);
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

    // Signatures
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

    doc.setDrawColor(66, 66, 66);
    doc.setLineWidth(0.4);
    doc.line(sig1X, sigLineY, sig1X + sigColWidth, sigLineY);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(84, 110, 122);
    doc.text('Client', sig1X + sigColWidth / 2, sigLineY + 4, { align: 'center' });

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 144, 156);
    const clientNomDisplay = (avoir.client_name || 'Client').length > 20
      ? (avoir.client_name || 'Client').substring(0, 18) + '...'
      : (avoir.client_name || 'Client');
    doc.text(clientNomDisplay, sig1X + sigColWidth / 2, sigLineY + 8, { align: 'center' });

    doc.setDrawColor(66, 66, 66);
    doc.setLineWidth(0.4);
    doc.line(sig2X, sigLineY, sig2X + sigColWidth, sigLineY);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(84, 110, 122);
    doc.text('Entreprise', sig2X + sigColWidth / 2, sigLineY + 4, { align: 'center' });

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 144, 156);
    doc.text(`Gérant: ${company.gérant}`, sig2X + sigColWidth / 2, sigLineY + 8, { align: 'center' });

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
      doc.text(`N° ${avoir.avoir_number || '-'}`, qrX + qrSize / 2, qrY + qrSize + 7, { align: 'center' });
    }

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
    doc.text('Document généré électroniquement', pageWidth / 2, footerY + 17, { align: 'center' });

    // ================================================================
    // FILIGRANE + PAGINATION
    // ================================================================
    const watermarkText = options.watermark || 'AVOIR';
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addWatermark(doc, watermarkText, {
        fontSize: 40,
        color: [200, 200, 200],
        opacity: 0.10,
        angle: -45,
        repeat: true,
        spacing: 100
      });
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 170);
      doc.text(`Page ${i}/${pageCount}`, pageWidth - margins.right, pageHeight - margins.bottom, { align: 'right' });
    }

    // ================================================================
    // SAUVEGARDE
    // ================================================================
    const filename = options.filename || `Avoir_${avoir.avoir_number || 'retour'}.pdf`;
    doc.save(filename);
    return true;

  } catch (error) {
    console.error('Erreur generateRetourPdf:', error);
    throw error;
  }
};

// ========== TÉLÉCHARGEMENT ==========
export const downloadRetourPdf = async (avoir, filename = null) => {
  try {
    if (!avoir || typeof avoir !== 'object') {
      throw new Error('Les données du retour sont invalides');
    }
    const options = {};
    if (filename) options.filename = filename;
    return await generateRetourPdf(avoir, options);
  } catch (error) {
    console.error('Erreur téléchargement PDF retour:', error);
    throw error;
  }
};

// ========== COMPOSANT REACT ==========
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import { Loader2, AlertCircle } from 'lucide-react';

const RetourClientPdf = () => {
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

        const response = await AxiosInstance.get(`/avoirs/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });

        setProgress(40);
        const avoir = response.data;

        setProgress(60);
        await generateRetourPdf(avoir);
        setProgress(100);

        setTimeout(() => navigate(`/retours-clients/${id}`), 1500);
      } catch (err) {
        console.error('Erreur:', err);
        setError(err.message || 'Erreur lors de la génération du PDF');
      } finally {
        setLoading(false);
      }
    };

    if (id) generatePdf();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md w-full px-4">
          <Loader2 className="animate-spin text-warning w-12 h-12 mx-auto mb-4" />
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className="bg-warning h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-gray-500">Génération du PDF en cours...</p>
          <p className="text-sm text-gray-400 mt-2">{progress}%</p>
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
          <button onClick={() => navigate(`/retours-clients/${id}`)} className="btn btn-primary">
            Retour au détail
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default RetourClientPdf;