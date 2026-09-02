// src/components/devis/DevisPdf.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AxiosInstance from '../AxiosInstance';
import { Loader2, AlertCircle } from 'lucide-react';

// ========== RÉCUPÉRATION DES DONNÉES DE L'ÉTABLISSEMENT ==========
let etablissementCache = null;
let etablissementPromise = null;

const getEtablissement = async () => {
  // Si déjà en cache, retourner directement
  if (etablissementCache) {
    return etablissementCache;
  }

  // Si une requête est déjà en cours, attendre sa résolution
  if (etablissementPromise) {
    return await etablissementPromise;
  }

  // Démarrer une nouvelle requête
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

// ========== FONCTION POUR ÉCRIRE LES NOMBRES EN LETTRES ==========
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

export const generateDevisPdf = async (devis, companyInfo = null) => {
  if (!devis || typeof devis !== 'object') {
    throw new Error('Données du devis invalides');
  }

  try {
    // ========== RÉCUPÉRER LES DONNÉES DE L'ÉTABLISSEMENT ==========
    const etab = await getEtablissement();
    
    // ========== INFORMATIONS DE LA SOCIÉTÉ (DYNAMIQUES) ==========
    const defaultCompany = {
      name: etab?.nom || 'BOUTIQUE STATION SODEPCI DE PARA',
      sigle: etab?.sigle || '',
      address: etab?.adresse || 'Station SODEPCI, Para',
      phone: etab?.telephone || '07 47 55 71 69 / 07 08 42 96 09',
      email: etab?.email || '',
      site_web: etab?.site_web || '',
      devise: etab?.devise || 'FCFA',
      // Compatibilité avec l'ancien format
      phone1: (etab?.telephone || '07 47 55 71 69').split('/')[0].trim(),
      phone2: (etab?.telephone || '07 47 55 71 69 / 07 08 42 96 09').split('/')[1]?.trim() || '',
      rccm: '',
      nif: '',
      bank_name: '',
      bank_account: '',
      bank_currency: etab?.devise || 'FCFA',
      ...companyInfo,
    };

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margins = { left: 15, right: 15, top: 15, bottom: 15 };
    const contentWidth = pageWidth - margins.left - margins.right;
    let yPosition = margins.top;

    // ========== FORMATAGE ==========
    const formatCurrency = (amount) => {
      if (!amount) return `0 ${defaultCompany.devise}`;
      return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ` ${defaultCompany.devise}`;
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
        sent: 'Envoyé',
        accepted: 'Accepté',
        refused: 'Refusé',
        expired: 'Expiré',
        converted: 'Converti en vente'
      };
      return map[status] || status || '-';
    };

    // ========== CHARGEMENT DU LOGO (DEPUIS L'ÉTABLISSEMENT) ==========
    const loadLogo = async () => {
      if (!etab?.logo) return null;
      
      try {
        // Construire l'URL complète du logo
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

    // ============ EN-TÊTE ============
    const logoWidth = 30;
    const logoHeight = 18;
    
    // Logo à gauche
    if (logoData) {
      try {
        doc.addImage(logoData, 'PNG', margins.left, yPosition, logoWidth, logoHeight);
      } catch {
        // Si l'image ne peut pas être ajoutée, on continue sans logo
      }
    }

    // Informations de la société
    const infoX = margins.left + (logoData ? logoWidth + 6 : 0);
    
    // Nom de l'entreprise
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(defaultCompany.name, infoX, yPosition + 4);
    
    // Sigle si présent
    if (defaultCompany.sigle) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(defaultCompany.sigle, infoX, yPosition + 11);
      yPosition += 3;
    }
    
    // Informations de contact
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`Tél: ${defaultCompany.phone}`, infoX, yPosition + 11);
    doc.text(`Adresse: ${defaultCompany.address}`, infoX, yPosition + 17);
    
    if (defaultCompany.email) {
      doc.text(`Email: ${defaultCompany.email}`, infoX, yPosition + 23);
      yPosition += 6;
    }
    
    yPosition += 24;

    // Ligne de séparation
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
    doc.text(`N° ${devis.devis_number || '---'}`, pageWidth / 2, yPosition + 14, { align: 'center' });
    
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
    doc.text('Téléphone:', margins.left, infoY);
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
    doc.text('Valable jusqu\'au:', margins.left + colWidth, infoY);
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
      tableRows.push(['', '', '', 'Remise', `- ${formatCurrency(devis.discount_amount)}`]);
    }
    
    if (devis.tax_amount > 0) {
      tableRows.push(['', '', '', `TVA (${devis.tax_rate || 0}%)`, formatCurrency(devis.tax_amount)]);
    }
    
    if (devis.shipping_fee > 0) {
      tableRows.push(['', '', '', 'Frais livraison', formatCurrency(devis.shipping_fee)]);
    }
    
    tableRows.push(['', '', '', 'TOTAL TTC', formatCurrency(devis.total)]);

    autoTable(doc, {
      head: [['DÉSIGNATION', 'QTÉ', 'PRIX UNITAIRE', 'REMISE', 'TOTAL']],
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
        // Mettre en gras les libellés des totaux
        if (data.section === 'body' && 
            data.column.index === 3 && 
            (data.cell.raw === 'Sous-total' || 
             data.cell.raw === 'Remise' || 
             data.cell.raw?.startsWith('TVA') || 
             data.cell.raw === 'Frais livraison' ||
             data.cell.raw === 'TOTAL TTC')) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [40, 40, 40];
        }
        // Aligner les nombres à droite
        if (data.section === 'body' && data.column.index >= 2) {
          data.cell.styles.halign = 'right';
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 8;

    // ============ MONTANT EN TOUTES LETTRES ============
    const totalEnLettres = nombreEnLettres(parseFloat(devis.total) || 0);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Montant en toutes lettres :', margins.left, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(33, 33, 33);
    const lettresAvailableWidth = contentWidth - 60;
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
      doc.text(splitLettres, margins.left + 60, yPosition);
      yPosition += splitLettres.length * 4.5;
    } else {
      doc.text(totalEnLettres, margins.left + 60, yPosition);
      yPosition += 5;
    }
    
    yPosition += 4;

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
    if (yPosition < pageHeight - margins.bottom - 30) {
      yPosition = pageHeight - margins.bottom - 30;
    }
    
    // Ligne de séparation
    doc.setDrawColor(180, 180, 180);
    doc.line(margins.left, yPosition, pageWidth - margins.right, yPosition);
    yPosition += 4;
    
    // Coordonnées de l'entreprise
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(defaultCompany.name, pageWidth / 2, yPosition + 2, { align: 'center' });
    doc.text(`Tél: ${defaultCompany.phone}`, pageWidth / 2, yPosition + 7, { align: 'center' });
    doc.text(defaultCompany.address, pageWidth / 2, yPosition + 12, { align: 'center' });
    
    if (defaultCompany.email) {
      doc.text(`Email: ${defaultCompany.email}`, pageWidth / 2, yPosition + 17, { align: 'center' });
      yPosition += 5;
    }
    
    yPosition += 10;
    
    // Message de remerciement
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('MERCI ET À LA PROCHAINE', pageWidth / 2, yPosition + 2, { align: 'center' });
    
    yPosition += 10;

    // ============ NUMÉRO DE PAGE ============
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page 1/1 - ${devis.devis_number || ''}`, pageWidth / 2, pageHeight - margins.bottom + 2, { align: 'center' });

    // ============ TÉLÉCHARGEMENT ============
    doc.save(`Devis_${devis.devis_number || 'sans_numero'}.pdf`);
    return true;
    
  } catch (error) {
    console.error('Erreur generateDevisPdf:', error);
    throw new Error('Génération PDF échouée : ' + error.message);
  }
};

// ============ FONCTION DE TÉLÉCHARGEMENT ============
export const downloadDevisPdf = async (devis, filename = null) => {
  try {
    if (!devis || typeof devis !== 'object') {
      throw new Error('Les données du devis sont invalides');
    }

    const options = {};
    if (filename) options.filename = filename;
    
    const result = await generateDevisPdf(devis, options);
    return result;
  } catch (error) {
    console.error('Erreur lors du téléchargement du devis :', error);
    throw error;
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

        setProgress(10);
        
        const response = await AxiosInstance.get(`/devis/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        
        setProgress(40);
        const devis = response.data;
        
        // Récupérer les données de l'établissement (fait automatiquement dans generateDevisPdf)
        setProgress(60);
        
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
          <p className="text-gray-500 font-medium">Génération du PDF en cours...</p>
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