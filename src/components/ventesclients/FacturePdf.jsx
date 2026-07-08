// src/components/factures/FacturePdf.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AxiosInstance from '../AxiosInstance';
import logoSvg from '../../assets/logo.svg';
import { Loader2, AlertCircle } from 'lucide-react';

export const generateFacturePdf = async (facture, companyInfo = null) => {
  if (!facture || typeof facture !== 'object') {
    throw new Error('Données de la facture invalides');
  }

  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margins = { left: 12, right: 12, top: 5, bottom: 5 };
    const contentWidth = pageWidth - margins.left - margins.right;
    let yPosition = margins.top;

    const defaultCompany = {
      name: 'ETABLISSEMENTS BAH SOULEYMANE ET FILS',
      sigle: 'E.B.S.F',
      address: 'Pita Centre – Grand Marché',
      address2: 'République de Guinée',
      phone1: '+224 626 53 32 53',
      phone2: '+224 612 37 37 47',
      email: 'ebsfservices@gmail.com',
      rccm: 'GN.KAL.2018.A.083 913',
      nif: '051501F',
      bank_name: 'VISTA BANK GUINÉE S.A',
      bank_account: '1604533019',
      bank_currency: 'GNF',
      ...companyInfo,
    };

    const formatCurrency = (amount) => {
      if (!amount) return '0 GNF';
      return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' GNF';
    };

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      try { return new Date(dateString).toLocaleDateString('fr-FR'); } catch { return '-'; }
    };

    const getStatusLabel = (status) => {
      const map = {
        draft: 'Brouillon',
        sent: 'Envoyée',
        paid: 'Payée',
        overdue: 'En retard',
        cancelled: 'Annulée'
      };
      return map[status] || status || '-';
    };

    // Chargement du logo
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

    // En-tête
    const logoWidth = 25;
    const logoHeight = 12;
    if (logoData) {
      doc.addImage(logoData, 'PNG', margins.left, yPosition, logoWidth, logoHeight);
    }

    const textStartX = margins.left + (logoData ? logoWidth + 3 : 0);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(defaultCompany.name, textStartX, yPosition + 2.5);
    
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Adresse: ${defaultCompany.address}`, textStartX, yPosition + 6);
    doc.text(`Tél: ${defaultCompany.phone1}`, textStartX, yPosition + 9);
    doc.text(`Email: ${defaultCompany.email}`, textStartX, yPosition + 12);
    doc.text(`RCCM: ${defaultCompany.rccm} | NIF: ${defaultCompany.nif}`, textStartX, yPosition + 15);
    
    yPosition += 28;

    // Titre
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`N° ${facture.invoice_number}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Informations
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Client:', margins.left, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(facture.client_name || '-', margins.left + 25, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', margins.left + 90, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(facture.invoice_date), margins.left + 110, yPosition);
    yPosition += 4.5;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Adresse:', margins.left, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(facture.client_address || '-', margins.left + 25, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Échéance:', margins.left + 90, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(facture.due_date), margins.left + 110, yPosition);
    yPosition += 4.5;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Tél:', margins.left, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(facture.client_phone || '-', margins.left + 25, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Statut:', margins.left + 90, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(getStatusLabel(facture.status), margins.left + 110, yPosition);
    
    yPosition += 8;

    // QR Code
    const qrCodeData = facture.qr_code_url || facture.qr_code;
    
    if (qrCodeData) {
      const qrSize = 30;
      const qrX = pageWidth - margins.right - qrSize - 8;
      const qrY = yPosition + 2;
      
      doc.setFillColor(248, 248, 248);
      doc.rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 22, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 22, 'S');
      
      try {
        let qrImageUrl = qrCodeData;
        if (qrCodeData.startsWith('/')) {
          const baseUrl = window.location.origin || 'http://127.0.0.1:8000';
          qrImageUrl = `${baseUrl}${qrCodeData}`;
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
        
        doc.addImage(dataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        
        doc.setFontSize(4.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Scanner pour détails', qrX + qrSize/2, qrY + qrSize + 4.5, { align: 'center' });
        doc.setFontSize(4);
        doc.setTextColor(130, 130, 130);
        doc.text('Facture', qrX + qrSize/2, qrY + qrSize + 8, { align: 'center' });
        doc.setFontSize(3.5);
        doc.setTextColor(150, 150, 150);
        doc.text(`N° ${facture.invoice_number}`, qrX + qrSize/2, qrY + qrSize + 11.5, { align: 'center' });
        
        yPosition += 42;
      } catch (error) {
        doc.setFillColor(200, 200, 200);
        doc.rect(qrX, qrY, qrSize, qrSize, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('QR', qrX + qrSize/2, qrY + qrSize/2 + 2.5, { align: 'center' });
        yPosition += 42;
      }
    }

    // Tableau des montants
    const tableData = [
      ['Sous-total', '', formatCurrency(facture.subtotal)],
      ['TVA', '', formatCurrency(facture.tax_amount)],
      ['Total', '', formatCurrency(facture.total)],
      ['Montant payé', '', formatCurrency(facture.amount_paid)],
      ['Reste à payer', '', formatCurrency(facture.remaining_amount)]
    ];

    autoTable(doc, {
      head: [['Désignation', '', 'Montant']],
      body: tableData,
      startY: yPosition,
      margin: { left: margins.left, right: margins.right },
      tableWidth: contentWidth,
      styles: { fontSize: 7, cellPadding: 3 },
      headStyles: { 
        fillColor: [55, 65, 85], 
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20 },
        2: { cellWidth: 50, halign: 'right' }
      },
      didParseCell: function(data) {
        if (data.row.index === 2) {
          data.cell.styles.fillColor = [34, 197, 94];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.row.index === 4) {
          data.cell.styles.fillColor = [239, 68, 68];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 12;

    // Signatures
    doc.setDrawColor(200, 200, 200);
    doc.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
    yPosition += 5;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('VALIDATION', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 7;
    
    const signatureWidth = (contentWidth - 8) / 2;
    const signatureHeight = 22;
    
    // Client
    doc.rect(margins.left, yPosition, signatureWidth, signatureHeight, 'S');
    doc.setFillColor(248, 248, 248);
    doc.rect(margins.left, yPosition, signatureWidth, 4, 'F');
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.text("BON POUR PAIEMENT", margins.left + signatureWidth / 2, yPosition + 3, { align: 'center' });
    let sigY = yPosition + 7;
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Client : ${facture.client_name || '________________'}`, margins.left + 3, sigY);
    sigY += 5;
    doc.text('Date : _______________', margins.left + 3, sigY);
    sigY += 5;
    doc.text('Signature : _______________', margins.left + 3, sigY);
    
    // Société
    const employerX = margins.left + signatureWidth + 8;
    doc.rect(employerX, yPosition, signatureWidth, signatureHeight, 'S');
    doc.setFillColor(248, 248, 248);
    doc.rect(employerX, yPosition, signatureWidth, 4, 'F');
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.text("BON DE FACTURE", employerX + signatureWidth / 2, yPosition + 3, { align: 'center' });
    sigY = yPosition + 7;
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.text(`E.B.S.F`, employerX + 3, sigY);
    sigY += 5;
    doc.text('Date : _______________', employerX + 3, sigY);
    sigY += 5;
    doc.text('Signature : _______________', employerX + 3, sigY);
    
    yPosition += signatureHeight + 12;

    // Pied de page
    if (yPosition < pageHeight - margins.bottom - 22) {
      yPosition = pageHeight - margins.bottom - 22;
    }
    
    doc.setDrawColor(180, 180, 180);
    doc.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
    yPosition += 3;
    
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'bold');
    doc.text('COORDONNÉES BANCAIRES', pageWidth / 2, yPosition + 1.5, { align: 'center' });
    yPosition += 4;
    
    doc.setFontSize(4);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${defaultCompany.bank_name} - Compte: ${defaultCompany.bank_account}`, 
      pageWidth / 2, 
      yPosition + 1.5, 
      { align: 'center' }
    );
    yPosition += 4;
    
    doc.setFontSize(4);
    doc.setFont('italic');
    doc.text('Merci pour votre confiance', pageWidth / 2, yPosition + 1.5, { align: 'center' });

    doc.save(`Facture_${facture.invoice_number}.pdf`);
    return true;
    
  } catch (error) {
    console.error('Erreur generateFacturePdf:', error);
    throw new Error('Génération PDF échouée : ' + error.message);
  }
};

const FacturePdf = () => {
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
        
        const response = await AxiosInstance.get(`/factures/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        
        setProgress(50);
        const facture = response.data;
        
        await generateFacturePdf(facture);
        setProgress(100);
        
        setTimeout(() => {
          navigate(`/factures/${id}`);
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
          <button onClick={() => navigate(`/factures/${id}`)} className="btn btn-primary">
            Retour à la facture
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default FacturePdf;