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
    const margins = { left: 15, right: 15, top: 15, bottom: 15 };
    const contentWidth = pageWidth - margins.left - margins.right;
    let yPosition = margins.top;

    // ✅ INFORMATIONS DE LA SOCIÉTÉ (CORRIGÉES)
    const defaultCompany = {
      name: 'BOUTIQUE STATION SODEPCI DE PARA',
      address: 'Station SODEPCI, Para',
      phone1: '07 47 55 71 69',
      phone2: '07 08 42 96 09',
      email: '',
      rccm: '',
      nif: '',
      bank_name: '',
      bank_account: '',
      bank_currency: 'FCFA',
      ...companyInfo,
    };

    // ✅ FORMATAGE EN FCFA
    const formatCurrency = (amount) => {
      if (!amount) return '0 FCFA';
      return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
    };

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      try { 
        return new Date(dateString).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }); 
      } catch { 
        return '-'; 
      }
    };

    const getStatusLabel = (status) => {
      const map = {
        draft: 'Brouillon',
        sent: 'Envoye',
        accepted: 'Accepte',
        refused: 'Refuse',
        expired: 'Expire',
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

    // ============ EN-TETE ============
    const logoWidth = 30;
    const logoHeight = 18;
    
    // Logo à gauche
    if (logoData) {
      try {
        doc.addImage(logoData, 'PNG', margins.left, yPosition, logoWidth, logoHeight);
      } catch {
        // Si l'image ne peut pas être ajoutee, on continue sans logo
      }
    }

    // Informations de la societe
    const infoX = margins.left + (logoData ? logoWidth + 6 : 0);
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('BOUTIQUE STATION SODEPCI DE PARA', infoX, yPosition + 4);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('Tel: 07 47 55 71 69 / 07 08 42 96 09', infoX, yPosition + 11);
    doc.text('Adresse: Station SODEPCI, Para', infoX, yPosition + 17);
    
    yPosition += 24;

    // Ligne de separation
    doc.setDrawColor(100, 100, 100);
    doc.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
    yPosition += 5;

    // ============ TITRE ============
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('DEVIS', pageWidth / 2, yPosition + 4, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text('N° ' + (devis.devis_number || '---'), pageWidth / 2, yPosition + 14, { align: 'center' });
    
    yPosition += 22;

    // ============ INFORMATIONS CLIENT ============
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    const colWidth = contentWidth / 2;
    
    // Colonne gauche
    let infoY = yPosition;
    doc.text('Client:', margins.left, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(devis.client_name || '-', margins.left + 28, infoY);
    
    infoY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Adresse:', margins.left, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(devis.client_address || '-', margins.left + 28, infoY);
    
    infoY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Telephone:', margins.left, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(devis.client_phone || '-', margins.left + 28, infoY);
    
    // Colonne droite
    infoY = yPosition;
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', margins.left + colWidth, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(devis.devis_date), margins.left + colWidth + 28, infoY);
    
    infoY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Valable jusqu au:', margins.left + colWidth, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(devis.valid_until), margins.left + colWidth + 28, infoY);
    
    infoY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Statut:', margins.left + colWidth, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(getStatusLabel(devis.status), margins.left + colWidth + 28, infoY);
    
    yPosition += 26;

    // ============ TABLEAU DES PRODUITS ============
    const tableRows = [];
    
    if (devis.lignes && devis.lignes.length > 0) {
      devis.lignes.forEach((line) => {
        tableRows.push([
          line.product_name || '-',
          String(line.quantity || 0),
          formatCurrency(line.unit_price),
          formatCurrency(line.discount || 0),
          formatCurrency(line.total)
        ]);
      });
    }

    // Lignes de totaux
    tableRows.push(['', '', '', 'Sous-total', formatCurrency(devis.subtotal)]);
    
    if (devis.discount_amount > 0) {
      tableRows.push(['', '', '', 'Remise', '- ' + formatCurrency(devis.discount_amount)]);
    }
    
    if (devis.tax_amount > 0) {
      tableRows.push(['', '', '', 'TVA (' + (devis.tax_rate || 0) + '%)', formatCurrency(devis.tax_amount)]);
    }
    
    if (devis.shipping_fee > 0) {
      tableRows.push(['', '', '', 'Frais livraison', formatCurrency(devis.shipping_fee)]);
    }
    
    tableRows.push(['', '', '', 'TOTAL TTC', formatCurrency(devis.total)]);

    autoTable(doc, {
      head: [['DESIGNATION', 'QTE', 'PRIX UNITAIRE', 'REMISE', 'TOTAL']],
      body: tableRows,
      startY: yPosition,
      margin: { left: margins.left, right: margins.right },
      tableWidth: contentWidth,
      styles: { 
        fontSize: 8, 
        cellPadding: 4,
        valign: 'middle',
        lineColor: [180, 180, 180],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [60, 60, 60], 
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 32, halign: 'right' },
        3: { cellWidth: 32, halign: 'right' },
        4: { cellWidth: 38, halign: 'right' }
      },
      didParseCell: function(data) {
        // Surligner la ligne du total
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fillColor = [60, 60, 60];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 9;
        }
        // Mettre en gras les libelles des totaux
        if (data.section === 'body' && 
            data.column.index === 3 && 
            (data.cell.raw === 'Sous-total' || 
             data.cell.raw === 'Remise' || 
             data.cell.raw.startsWith('TVA') || 
             data.cell.raw === 'Frais livraison' ||
             data.cell.raw === 'TOTAL TTC')) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [40, 40, 40];
        }
        // Aligner les nombres a droite
        if (data.section === 'body' && data.column.index >= 2) {
          data.cell.styles.halign = 'right';
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 8;

    // ============ NOTES ============
    if (devis.notes) {
      doc.setFontSize(7);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', margins.left, yPosition);
      yPosition += 4;
      
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(devis.notes, contentWidth);
      splitNotes.forEach((line) => {
        doc.text(line, margins.left, yPosition);
        yPosition += 4.5;
      });
      yPosition += 4;
    }

    // ============ PIED DE PAGE ============
    // S'assurer que le pied de page est en bas
    if (yPosition < pageHeight - margins.bottom - 20) {
      yPosition = pageHeight - margins.bottom - 20;
    }
    
    // Ligne de separation
    doc.setDrawColor(180, 180, 180);
    doc.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
    yPosition += 4;
    
    // Message de remerciement
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('MERCI ET A LA PROCHAINE', pageWidth / 2, yPosition + 2, { align: 'center' });
    
    yPosition += 10;

    // ============ NUMERO DE PAGE ============
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('Page 1/1 - ' + (devis.devis_number || ''), pageWidth / 2, pageHeight - margins.bottom + 2, { align: 'center' });

    // ============ TELECHARGEMENT ============
    doc.save('Devis_' + (devis.devis_number || 'sans_numero') + '.pdf');
    return true;
    
  } catch (error) {
    console.error('Erreur generateDevisPdf:', error);
    throw new Error('Generation PDF echouee : ' + error.message);
  }
};

// ============ COMPOSANT REACT ============
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
        
        const response = await AxiosInstance.get('/devis/' + id + '/', {
          headers: { Authorization: 'Token ' + token }
        });
        
        setProgress(50);
        const devis = response.data;
        
        await generateDevisPdf(devis);
        setProgress(100);
        
        setTimeout(() => {
          navigate('/devis/' + id);
        }, 1500);
        
      } catch (err) {
        console.error('Erreur:', err);
        setError(err.message || 'Erreur lors de la generation du PDF');
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
              style={{ width: progress + '%' }}
            ></div>
          </div>
          <p className="text-gray-500 font-medium">Generation du PDF en cours...</p>
          <p className="text-sm text-gray-400 mt-2">{progress}%</p>
          <p className="text-xs text-gray-400 mt-1">Le telechargement va commencer automatiquement</p>
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
          <button onClick={() => navigate('/devis/' + id)} className="btn btn-primary">
            Retour au devis
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default DevisPdf;