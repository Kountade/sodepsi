// src/components/devis/DevisPdf.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AxiosInstance from '../AxiosInstance';
import logoSvg from '../../assets/logo.svg';
import { Loader2, AlertCircle } from 'lucide-react';

export const generateDevisPdf = async (devis, companyInfo = null) => {
  if (!devis || typeof devis !== 'object') {
    throw new Error('Données du devis invalides');
  }

  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margins = { left: 12, right: 12, top: 5, bottom: 5 };
    const contentWidth = pageWidth - margins.left - margins.right;
    let yPosition = margins.top;

    // Informations de la société
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
      if (!amount) return '0 FCFA';
      return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
    };

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      try { 
        return new Date(dateString).toLocaleDateString('fr-FR'); 
      } catch { 
        return '-'; 
      }
    };

    const getStatusLabel = (status) => {
      const map = {
        draft: 'Brouillon',
        sent: 'Envoyé',
        accepted: 'Accepté',
        refused: 'Refusé',
        expired: 'Expiré',
        converted: 'Converti en vente'
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
    try { 
      logoData = await loadLogo(logoSvg); 
    } catch { 
      // Ignorer l'erreur
    }

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
    doc.text('DEVIS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`N° ${devis.devis_number}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Informations
    doc.setFontSize(7);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Client:', margins.left, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(devis.client_name || '-', margins.left + 25, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', margins.left + 90, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(devis.devis_date), margins.left + 110, yPosition);
    yPosition += 4.5;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Adresse:', margins.left, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(devis.client_address || '-', margins.left + 25, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Statut:', margins.left + 90, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(getStatusLabel(devis.status), margins.left + 110, yPosition);
    yPosition += 4.5;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Tél:', margins.left, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(devis.client_phone || '-', margins.left + 25, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Valable jusqu\'au:', margins.left + 90, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(devis.valid_until), margins.left + 110, yPosition);
    
    yPosition += 8;

    // Tableau des produits
    const tableRows = [];
    
    if (devis.lignes && devis.lignes.length > 0) {
      devis.lignes.forEach(line => {
        tableRows.push([
          line.product_name || '-',
          String(line.quantity || 0),
          formatCurrency(line.unit_price),
          formatCurrency(line.discount || 0),
          formatCurrency(line.total)
        ]);
      });
    }

    tableRows.push(['', '', '', 'Sous-total', formatCurrency(devis.subtotal)]);
    
    if (devis.discount_amount > 0) {
      tableRows.push(['', '', '', 'Remise', `-${formatCurrency(devis.discount_amount)}`]);
    }
    
    if (devis.tax_amount > 0) {
      tableRows.push(['', '', '', `TVA (${devis.tax_rate || 0}%)`, formatCurrency(devis.tax_amount)]);
    }
    
    if (devis.shipping_fee > 0) {
      tableRows.push(['', '', '', 'Frais livraison', formatCurrency(devis.shipping_fee)]);
    }
    
    tableRows.push(['', '', '', 'TOTAL TTC', formatCurrency(devis.total)]);

    autoTable(doc, {
      head: [['Produit', 'Qté', 'Prix unit.', 'Remise', 'Total']],
      body: tableRows,
      startY: yPosition,
      margin: { left: margins.left, right: margins.right },
      tableWidth: contentWidth,
      styles: { 
        fontSize: 6, 
        cellPadding: 2,
        valign: 'middle'
      },
      headStyles: { 
        fillColor: [55, 65, 85], 
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      didParseCell: function(data) {
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fillColor = [34, 197, 94];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 7;
        }
        if (data.section === 'body' && 
            (data.cell.raw === 'Sous-total' || 
             data.cell.raw === 'Remise' || 
             data.cell.raw === 'TVA' || 
             data.cell.raw === 'Frais livraison' ||
             data.cell.raw === 'TOTAL TTC')) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 8;

    // Notes
    if (devis.notes) {
      yPosition += 5;
      
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', margins.left, yPosition);
      yPosition += 4;
      
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(devis.notes, contentWidth);
      splitNotes.forEach(line => {
        doc.text(line, margins.left, yPosition);
        yPosition += 3.5;
      });
      yPosition += 4;
    }

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
    doc.text('Ce devis est valable 30 jours', pageWidth / 2, yPosition + 1.5, { align: 'center' });
    yPosition += 4;

    doc.save(`Devis_${devis.devis_number}.pdf`);
    return true;
    
  } catch (error) {
    console.error('Erreur generateDevisPdf:', error);
    throw new Error('Génération PDF échouée : ' + error.message);
  }
};

// Composant React
const DevisPdf = () => {
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
        
        const response = await AxiosInstance.get(`/devis/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        
        setProgress(50);
        const devis = response.data;
        
        await generateDevisPdf(devis);
        setProgress(100);
        
        setTimeout(() => {
          navigate(`/devis/${id}`);
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
          <button onClick={() => navigate(`/devis/${id}`)} className="btn btn-primary">
            Retour au devis
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default DevisPdf;