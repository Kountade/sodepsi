// src/components/achats/PurchaseReturnPdf.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import AxiosInstance from '../AxiosInstance';
import logoSvg from '../../assets/logo.svg';
import { Loader2, AlertCircle } from 'lucide-react';

// ============================================================
// FONCTION PRINCIPALE DE GÉNÉRATION DU PDF DE RETOUR
// ============================================================
export const generatePurchaseReturnPdf = async (returnItem, companyInfo = null) => {
  if (!returnItem || typeof returnItem !== 'object') {
    throw new Error('Données du retour invalides');
  }

  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margins = { left: 12, right: 12, top: 5, bottom: 5 };
    const contentWidth = pageWidth - margins.left - margins.right;
    const footerHeight = 20;
    let yPosition = margins.top;

    // === INFORMATIONS SOCIÉTÉ - E.B.S.F ===
    const defaultCompany = {
      name: 'ETABLISSEMENTS BAH SOULEYMANE ET FILS',
      sigle: 'E.B.S.F',
      legal_form: 'Entreprise individuelle',
      activity: 'Commerce Général',
      address: 'Pita Centre – Grand Marché',
      address2: 'République de Guinée',
      phone1: '+224 626 53 32 53',
      phone2: '+224 612 37 37 47',
      phone3: '+224 613 37 37 47',
      email: 'ebsfservices@gmail.com',
      rccm: 'GN.KAL.2018.A.083 913',
      nif: '051501F',
      bank_name: 'VISTA BANK GUINÉE S.A',
      bank_account: '1604533019',
      bank_currency: 'GNF (Franc guinéen)',
      ...companyInfo,
    };

    // === FONCTIONS DE FORMAT ===
    const formatNumber = (n) => {
      const num = parseFloat(n) || 0;
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };
    
    const formatCurrency = (amount) => {
      if (!amount) return '0 GNF';
      return formatNumber(amount) + ' GNF';
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '-';
      try { return new Date(dateString).toLocaleDateString('fr-FR'); } catch { return '-'; }
    };
    
    const getStatusLabel = (status) => {
      const map = {
        requested: 'Demandé',
        approved: 'Approuvé',
        shipped: 'Expédié',
        refunded: 'Remboursé',
        replaced: 'Remplacé',
        rejected: 'Refusé'
      };
      return map[status] || status || '-';
    };
    
    const getReasonLabel = (reason) => {
      const map = {
        defective: 'Produit défectueux',
        wrong_product: 'Produit incorrect',
        expired: 'Produit expiré',
        damaged: 'Produit endommagé',
        other: 'Autre'
      };
      return map[reason] || reason || '-';
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

    // ========== EN-TÊTE AVEC LOGO (COMPACT) ==========
    const logoWidth = 25;
    const logoHeight = 12;
    if (logoData) {
      doc.addImage(logoData, 'PNG', margins.left, yPosition, logoWidth, logoHeight);
    } else {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(defaultCompany.sigle || defaultCompany.name, margins.left, yPosition + 4);
    }

    const textStartX = margins.left + (logoData ? logoWidth + 3 : 0);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(defaultCompany.name, textStartX, yPosition + 2.5);
    
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(`Sigle: ${defaultCompany.sigle}`, textStartX, yPosition + 6);
    
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Adresse: ${defaultCompany.address}`, textStartX, yPosition + 9);
    doc.text(` ${defaultCompany.address2}`, textStartX, yPosition + 12);
    
    doc.setFontSize(5);
    doc.text(`Tél: ${defaultCompany.phone1} / ${defaultCompany.phone2}`, textStartX, yPosition + 15);
    doc.text(`Email: ${defaultCompany.email}`, textStartX, yPosition + 18);
    
    doc.setFontSize(5);
    doc.text(`RCCM: ${defaultCompany.rccm} | NIF: ${defaultCompany.nif}`, textStartX, yPosition + 21);
    
    yPosition += 25;

    // ========== TITRE CENTRÉ ==========
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('BON DE RETOUR', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`N° ${returnItem.return_number || 'N/A'}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;

    // ========== BLOC STATUT ==========
    const statusColor = returnItem.status === 'approved' || returnItem.status === 'refunded' ? [34, 197, 94] : 
                        returnItem.status === 'rejected' ? [239, 68, 68] : [59, 130, 246];
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.rect(pageWidth - margins.right - 25, yPosition - 5, 25, 6, 'F');
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(getStatusLabel(returnItem.status), pageWidth - margins.right - 12.5, yPosition - 1, { align: 'center' });

    // ========== TABLEAU RÉCAPITULATIF (COMPACT) ==========
    const summaryHeight = 18;
    doc.setFillColor(248, 248, 248);
    doc.rect(margins.left, yPosition, contentWidth, summaryHeight, 'F');
    doc.rect(margins.left, yPosition, contentWidth, summaryHeight, 'S');
    
    let summaryY = yPosition + 2.5;
    const col1 = margins.left + 4;
    const col2 = margins.left + 55;
    const col3 = margins.left + 100;

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Date retour :', col1, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(returnItem.return_date), col1 + 24, summaryY);
    doc.setFont('helvetica', 'bold');
    doc.text('Commande :', col2, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(returnItem.po_number || '-', col2 + 20, summaryY);
    summaryY += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Fournisseur :', col1, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(returnItem.supplier_name || '-', col1 + 24, summaryY);
    doc.setFont('helvetica', 'bold');
    doc.text('Raison :', col3, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(getReasonLabel(returnItem.reason), col3 + 16, summaryY);
    summaryY += 4;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Réception :', col1, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(returnItem.receipt_number || '-', col1 + 20, summaryY);
    
    yPosition += summaryHeight + 3;

    // ========== PRODUITS RETOURNÉS (COMPACT) ==========
    doc.setFillColor(55, 65, 85);
    doc.rect(margins.left, yPosition, contentWidth, 5, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('PRODUITS RETOURNÉS', pageWidth / 2, yPosition + 3.5, { align: 'center' });
    yPosition += 5;

    // En-têtes du tableau
    doc.setFillColor(220, 220, 220);
    doc.rect(margins.left, yPosition, contentWidth, 4.5, 'F');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    const colPositions = {
      product: margins.left + 3,
      qty: margins.left + 75,
      unitPrice: margins.left + 105,
      total: margins.left + 145
    };
    
    doc.text('DÉSIGNATION', colPositions.product, yPosition + 3.5);
    doc.text('Qté', colPositions.qty, yPosition + 3.5, { align: 'center' });
    doc.text('Prix unit.', colPositions.unitPrice, yPosition + 3.5, { align: 'center' });
    doc.text('Total', colPositions.total, yPosition + 3.5, { align: 'center' });
    yPosition += 4.5;

    // Lignes des produits
    let lineY = yPosition;
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    if (returnItem.lines && returnItem.lines.length > 0) {
      returnItem.lines.forEach((line, index) => {
        if (lineY > pageHeight - margins.bottom - footerHeight - 50) {
          doc.addPage();
          lineY = margins.top;
          doc.setFillColor(55, 65, 85);
          doc.rect(margins.left, lineY, contentWidth, 5, 'F');
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text('PRODUITS RETOURNÉS', pageWidth / 2, lineY + 3.5, { align: 'center' });
          lineY += 5;
          
          doc.setFillColor(220, 220, 220);
          doc.rect(margins.left, lineY, contentWidth, 4.5, 'F');
          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text('DÉSIGNATION', colPositions.product, lineY + 3.5);
          doc.text('Qté', colPositions.qty, lineY + 3.5, { align: 'center' });
          doc.text('Prix unit.', colPositions.unitPrice, lineY + 3.5, { align: 'center' });
          doc.text('Total', colPositions.total, lineY + 3.5, { align: 'center' });
          lineY += 4.5;
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
        }
        
        const productName = line.product_name || line.product?.name || '-';
        const productNameDisplay = productName.length > 35 ? productName.substring(0, 32) + '...' : productName;
        
        doc.text(productNameDisplay, colPositions.product, lineY + 2.5);
        doc.text((line.quantity || 0).toString(), colPositions.qty, lineY + 2.5, { align: 'center' });
        doc.text(formatCurrency(line.unit_price || 0), colPositions.unitPrice, lineY + 2.5, { align: 'center' });
        doc.text(formatCurrency(line.total || 0), colPositions.total, lineY + 2.5, { align: 'center' });
        
        lineY += 4;
      });
    } else {
      doc.text('Aucun produit', colPositions.product, lineY + 2.5);
      lineY += 4;
    }
    
    yPosition = lineY + 3;

    // ========== TOTAL (SANS TRAIT AVANT) ==========
    const totalX = pageWidth - margins.right - 45;
    
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text('TOTAL RETOUR :', totalX, yPosition);
    const totalAmount = returnItem.lines?.reduce((sum, line) => sum + (line.total || 0), 0) || 0;
    doc.text(formatCurrency(totalAmount), pageWidth - margins.right - 2, yPosition, { align: 'right' });
    yPosition += 6;

    // ========== NOTES ==========
    if (returnItem.notes) {
      yPosition += 2;
      
      if (yPosition > pageHeight - margins.bottom - footerHeight - 35) {
        doc.addPage();
        yPosition = margins.top;
      }
      
      doc.setFillColor(55, 65, 85);
      doc.rect(margins.left, yPosition, contentWidth, 4, 'F');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('NOTES', margins.left + 4, yPosition + 3);
      yPosition += 6.5;
      
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const splitNotes = doc.splitTextToSize(returnItem.notes, contentWidth - 8);
      const maxNotesLines = Math.min(splitNotes.length, 3);
      for (let i = 0; i < maxNotesLines; i++) {
        doc.text(splitNotes[i], margins.left + 4, yPosition + (i * 4));
      }
      yPosition += maxNotesLines * 4 + 5;
    }

    // ========== QR CODE ==========
    const qrCodeData = returnItem.qr_code_url || returnItem.qr_code;
    
    if (qrCodeData) {
      yPosition += 3;
      
      if (yPosition > pageHeight - margins.bottom - footerHeight - 50) {
        doc.addPage();
        yPosition = margins.top + 10;
      }
      
      const qrSize = 30;
      const qrX = margins.left + 5;
      const qrY = yPosition + 1;
      
      doc.setFillColor(248, 248, 248);
      doc.rect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 16, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 16, 'S');
      
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
        
        doc.setFontSize(4);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Scanner pour détails', qrX + qrSize/2, qrY + qrSize + 3.5, { align: 'center' });
        
        doc.setFontSize(3.5);
        doc.setTextColor(130, 130, 130);
        doc.text('Bon de retour', qrX + qrSize/2, qrY + qrSize + 6.5, { align: 'center' });
        
        doc.setFontSize(3);
        doc.setTextColor(150, 150, 150);
        doc.text(`N° ${returnItem.return_number}`, qrX + qrSize/2, qrY + qrSize + 9.5, { align: 'center' });
        
        yPosition += 34;
        
      } catch (error) {
        console.error('Erreur chargement QR Code:', error);
        
        doc.setFillColor(200, 200, 200);
        doc.rect(qrX, qrY, qrSize, qrSize, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('QR', qrX + qrSize/2, qrY + qrSize/2 + 2.5, { align: 'center' });
        
        doc.setFontSize(4.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Non disponible', qrX + qrSize/2, qrY + qrSize + 4, { align: 'center' });
        doc.text(`N° ${returnItem.return_number}`, qrX + qrSize/2, qrY + qrSize + 7, { align: 'center' });
        
        yPosition += 34;
      }
    }

    // ========== SIGNATURES ==========
    yPosition += 6;
    
    if (yPosition > pageHeight - margins.bottom - footerHeight - 35) {
      doc.addPage();
      yPosition = margins.top;
    }
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
    yPosition += 4;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('VALIDATION', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 7;
    
    const signatureWidth = (contentWidth - 8) / 2;
    const signatureHeight = 22;
    
    // Signature fournisseur
    doc.rect(margins.left, yPosition, signatureWidth, signatureHeight, 'S');
    doc.setFillColor(248, 248, 248);
    doc.rect(margins.left, yPosition, signatureWidth, 4, 'F');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 70, 70);
    doc.text("BON POUR RETOUR", margins.left + signatureWidth / 2, yPosition + 3, { align: 'center' });
    let sigY = yPosition + 7;
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Fournisseur : ${returnItem.supplier_name || '________________'}`, margins.left + 4, sigY);
    sigY += 5;
    doc.text('Date : _______________', margins.left + 4, sigY);
    sigY += 5;
    doc.text('Signature : _______________', margins.left + 4, sigY);
    
    // Signature société
    const employerX = margins.left + signatureWidth + 8;
    doc.rect(employerX, yPosition, signatureWidth, signatureHeight, 'S');
    doc.setFillColor(248, 248, 248);
    doc.rect(employerX, yPosition, signatureWidth, 4, 'F');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text("BON DE RETOUR", employerX + signatureWidth / 2, yPosition + 3, { align: 'center' });
    sigY = yPosition + 7;
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`E.B.S.F - ${defaultCompany.name}`, employerX + 4, sigY);
    sigY += 5;
    doc.text('Date : _______________', employerX + 4, sigY);
    sigY += 5;
    doc.text('Signature : _______________', employerX + 4, sigY);
    
    yPosition += signatureHeight + 12;

    // ========== PIED DE PAGE ==========
    if (yPosition < pageHeight - margins.bottom - 22) {
      yPosition = pageHeight - margins.bottom - 22;
    }
    
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
    yPosition += 2.5;
    
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('COORDONNÉES BANCAIRES', pageWidth / 2, yPosition + 1.5, { align: 'center' });
    yPosition += 3.5;
    
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`${defaultCompany.bank_name} - Compte: ${defaultCompany.bank_account} - ${defaultCompany.bank_currency}`, pageWidth / 2, yPosition + 1.5, { align: 'center' });
    yPosition += 3.5;
    
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Merci pour votre confiance', pageWidth / 2, yPosition + 1.5, { align: 'center' });
    yPosition += 3.5;
    
    doc.setFontSize(4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130, 130, 130);
    doc.text(`Document généré le ${formatDate(new Date().toISOString())}`, pageWidth / 2, yPosition + 1.5, { align: 'center' });

    // Sauvegarde du PDF
    const fileName = `Bon_Retour_${returnItem.return_number || 'retour'}_${returnItem.supplier_name || 'fournisseur'}.pdf`;
    doc.save(fileName);
    return true;
    
  } catch (error) {
    console.error('Erreur generatePurchaseReturnPdf:', error);
    throw new Error('Génération PDF échouée : ' + error.message);
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
        const returnItem = response.data;
        
        await generatePurchaseReturnPdf(returnItem);
        setProgress(100);
        
        setTimeout(() => {
          navigate(`/purchase-returns/${id}`);
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
          <button onClick={() => navigate(`/purchase-returns/${id}`)} className="btn btn-primary">
            Retour au retour
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default PurchaseReturnPdf;