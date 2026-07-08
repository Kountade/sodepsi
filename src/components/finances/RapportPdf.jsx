// src/components/finances/RapportPdf.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AxiosInstance from '../AxiosInstance';
import logoSvg from '../../assets/logo.svg';
import { Loader2, AlertCircle } from 'lucide-react';

export const generateRapportPdf = async (rapport, companyInfo = null) => {
  if (!rapport || typeof rapport !== 'object') {
    throw new Error('Données du rapport invalides');
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

    const getTypeLabel = (type) => {
      const map = {
        bilan: 'Bilan comptable',
        compte_resultat: 'Compte de résultat',
        tresorerie: 'Tableau de trésorerie',
        budget: 'Suivi budgétaire',
        ventes: 'Rapport de ventes',
        depenses: 'Rapport de dépenses',
        achats: "Rapport d'achats",
        client: 'Rapport client',
        fournisseur: 'Rapport fournisseur'
      };
      return map[type] || type || '-';
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
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(rapport.nom || 'RAPPORT FINANCIER', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Type: ${getTypeLabel(rapport.type)}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.setFontSize(8);
    doc.text(`Période: ${formatDate(rapport.date_debut)} - ${formatDate(rapport.date_fin)}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.setFontSize(8);
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Récupérer les données du rapport
    const data = rapport.contenu?.data || {};

    // === BILAN ===
    if (rapport.type === 'bilan') {
      // Trésorerie
      const treso = data.tresorerie || {};
      if (treso.details?.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('TRÉSORERIE', margins.left, yPosition);
        yPosition += 5;
        
        const tableData = [['Compte', 'Solde']];
        treso.details.forEach(item => {
          tableData.push([item.nom || '-', formatCurrency(item.solde)]);
        });
        tableData.push(['Total', formatCurrency(treso.total || 0)]);
        
        autoTable(doc, {
          head: [tableData[0]],
          body: tableData.slice(1),
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
            1: { cellWidth: 'auto', halign: 'right' }
          },
          didParseCell: function(data) {
            if (data.row.index === tableData.length - 2) {
              data.cell.styles.fillColor = [34, 197, 94];
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        });
        yPosition = doc.lastAutoTable.finalY + 8;
      }

      // Créances
      const creances = data.creances || {};
      if (creances.details?.length > 0) {
        if (yPosition > pageHeight - margins.bottom - 50) {
          doc.addPage();
          yPosition = margins.top + 10;
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('CRÉANCES CLIENTS', margins.left, yPosition);
        yPosition += 5;
        
        const tableData = [['Facture', 'Client', 'Montant']];
        creances.details.forEach(item => {
          tableData.push([item.facture || '-', item.client || '-', formatCurrency(item.montant)]);
        });
        tableData.push(['Total', '', formatCurrency(creances.total || 0)]);
        
        autoTable(doc, {
          head: [tableData[0]],
          body: tableData.slice(1),
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
            0: { cellWidth: 40 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 'auto', halign: 'right' }
          },
          didParseCell: function(data) {
            if (data.row.index === tableData.length - 2) {
              data.cell.styles.fillColor = [34, 197, 94];
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        });
        yPosition = doc.lastAutoTable.finalY + 8;
      }

      // Dettes
      const dettes = data.dettes || {};
      if (dettes.details?.length > 0) {
        if (yPosition > pageHeight - margins.bottom - 50) {
          doc.addPage();
          yPosition = margins.top + 10;
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('DETTES FOURNISSEURS', margins.left, yPosition);
        yPosition += 5;
        
        const tableData = [['Facture', 'Fournisseur', 'Montant']];
        dettes.details.forEach(item => {
          tableData.push([item.facture || '-', item.fournisseur || '-', formatCurrency(item.montant)]);
        });
        tableData.push(['Total', '', formatCurrency(dettes.total || 0)]);
        
        autoTable(doc, {
          head: [tableData[0]],
          body: tableData.slice(1),
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
            0: { cellWidth: 40 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 'auto', halign: 'right' }
          },
          didParseCell: function(data) {
            if (data.row.index === tableData.length - 2) {
              data.cell.styles.fillColor = [239, 68, 68];
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        });
        yPosition = doc.lastAutoTable.finalY + 8;
      }

      // Résultat
      const resultat = data.resultat || 0;
      if (yPosition > pageHeight - margins.bottom - 30) {
        doc.addPage();
        yPosition = margins.top + 10;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const resultColor = resultat >= 0 ? [34, 197, 94] : [239, 68, 68];
      doc.setTextColor(resultColor[0], resultColor[1], resultColor[2]);
      doc.text(
        `RÉSULTAT: ${formatCurrency(resultat)}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      doc.setTextColor(0, 0, 0);
    }

    // === COMPTE DE RÉSULTAT ===
    else if (rapport.type === 'compte_resultat') {
      // Ventes
      const ventes = data.ventes || {};
      if (ventes.details?.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('PRODUITS (VENTES)', margins.left, yPosition);
        yPosition += 5;
        
        const tableData = [['Facture', 'Client', 'Montant']];
        ventes.details.forEach(item => {
          tableData.push([item.invoice || '-', item.client || '-', formatCurrency(item.montant)]);
        });
        tableData.push(['Total', `${ventes.nombre || 0} ventes`, formatCurrency(ventes.total || 0)]);
        
        autoTable(doc, {
          head: [tableData[0]],
          body: tableData.slice(1),
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
            0: { cellWidth: 40 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 'auto', halign: 'right' }
          },
          didParseCell: function(data) {
            if (data.row.index === tableData.length - 2) {
              data.cell.styles.fillColor = [34, 197, 94];
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        });
        yPosition = doc.lastAutoTable.finalY + 8;
      }

      // Dépenses
      const depenses = data.depenses || {};
      if (depenses.details?.length > 0) {
        if (yPosition > pageHeight - margins.bottom - 50) {
          doc.addPage();
          yPosition = margins.top + 10;
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('CHARGES (DÉPENSES)', margins.left, yPosition);
        yPosition += 5;
        
        const tableData = [['Référence', 'Catégorie', 'Montant']];
        depenses.details.forEach(item => {
          tableData.push([item.reference || '-', item.categorie || '-', formatCurrency(item.montant)]);
        });
        tableData.push(['Total', `${depenses.nombre || 0} dépenses`, formatCurrency(depenses.total || 0)]);
        
        autoTable(doc, {
          head: [tableData[0]],
          body: tableData.slice(1),
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
            0: { cellWidth: 40 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 'auto', halign: 'right' }
          },
          didParseCell: function(data) {
            if (data.row.index === tableData.length - 2) {
              data.cell.styles.fillColor = [239, 68, 68];
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        });
        yPosition = doc.lastAutoTable.finalY + 8;
      }

      // Résultat
      const resultat = data.resultat || 0;
      if (yPosition > pageHeight - margins.bottom - 30) {
        doc.addPage();
        yPosition = margins.top + 10;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const resultColor = resultat >= 0 ? [34, 197, 94] : [239, 68, 68];
      doc.setTextColor(resultColor[0], resultColor[1], resultColor[2]);
      doc.text(
        `RÉSULTAT: ${formatCurrency(resultat)}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      doc.setTextColor(0, 0, 0);
    }

    // === TRÉSORERIE ===
    else if (rapport.type === 'tresorerie') {
      const treso = data.tresorerie || {};
      const mouvements = data.mouvements || {};
      
      // Soldes
      if (treso.details?.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('SOLDES DES COMPTES', margins.left, yPosition);
        yPosition += 5;
        
        const tableData = [['Compte', 'Solde', 'Minimum']];
        treso.details.forEach(item => {
          tableData.push([item.nom || '-', formatCurrency(item.solde), formatCurrency(item.minimum)]);
        });
        
        autoTable(doc, {
          head: [tableData[0]],
          body: tableData.slice(1),
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
            1: { cellWidth: 'auto', halign: 'right' },
            2: { cellWidth: 'auto', halign: 'right' }
          }
        });
        yPosition = doc.lastAutoTable.finalY + 8;
      }

      // Mouvements
      if (mouvements.details?.length > 0) {
        if (yPosition > pageHeight - margins.bottom - 50) {
          doc.addPage();
          yPosition = margins.top + 10;
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('MOUVEMENTS', margins.left, yPosition);
        yPosition += 5;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total entrées: ${formatCurrency(mouvements.entrees || 0)}`, margins.left, yPosition);
        yPosition += 4;
        doc.text(`Total sorties: ${formatCurrency(mouvements.sorties || 0)}`, margins.left, yPosition);
        yPosition += 4;
        doc.text(`Solde net: ${formatCurrency(mouvements.solde || 0)}`, margins.left, yPosition);
        yPosition += 8;
        
        const tableData = [['Date', 'Type', 'Montant', 'Description']];
        mouvements.details.slice(0, 15).forEach(item => {
          tableData.push([
            item.date || '-',
            item.type || '-',
            formatCurrency(item.montant),
            item.description || '-'
          ]);
        });
        if (mouvements.details.length > 15) {
          tableData.push(['...', '...', '...', '...']);
        }
        
        autoTable(doc, {
          head: [tableData[0]],
          body: tableData.slice(1),
          startY: yPosition,
          margin: { left: margins.left, right: margins.right },
          tableWidth: contentWidth,
          styles: { fontSize: 6, cellPadding: 2 },
          headStyles: { 
            fillColor: [55, 65, 85], 
            textColor: [255, 255, 255],
            fontSize: 7,
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 25 },
            2: { cellWidth: 'auto', halign: 'right' },
            3: { cellWidth: 'auto' }
          },
          didParseCell: function(data) {
            if (data.column.index === 1 && data.cell.raw === 'Entrée') {
              data.cell.styles.textColor = [34, 197, 94];
            } else if (data.column.index === 1 && data.cell.raw === 'Sortie') {
              data.cell.styles.textColor = [239, 68, 68];
            }
          }
        });
        yPosition = doc.lastAutoTable.finalY + 8;
      }
    }

    // === BUDGET ===
    else if (rapport.type === 'budget') {
      const budgets = data.budgets || [];
      
      if (budgets.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('SUIVI BUDGÉTAIRE', margins.left, yPosition);
        yPosition += 5;
        
        const tableData = [['Budget', 'Total', 'Utilisé', 'Restant', '%']];
        budgets.forEach(item => {
          const pourcent = item.pourcentage || 0;
          tableData.push([
            item.nom || '-',
            formatCurrency(item.total),
            formatCurrency(item.utilise),
            formatCurrency(item.restant),
            `${pourcent.toFixed(1)}%`
          ]);
        });
        
        autoTable(doc, {
          head: [tableData[0]],
          body: tableData.slice(1),
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
            1: { cellWidth: 'auto', halign: 'right' },
            2: { cellWidth: 'auto', halign: 'right' },
            3: { cellWidth: 'auto', halign: 'right' },
            4: { cellWidth: 'auto', halign: 'right' }
          },
          didParseCell: function(data) {
            if (data.column.index === 4 && data.row.index > 0) {
              const val = parseFloat(data.cell.raw);
              if (val > 80) {
                data.cell.styles.textColor = [239, 68, 68];
              } else if (val > 50) {
                data.cell.styles.textColor = [234, 179, 8];
              }
            }
          }
        });
        yPosition = doc.lastAutoTable.finalY + 8;
      }
    }

    // === VENTES ===
    else if (rapport.type === 'ventes') {
      const ventes = data.ventes || {};
      
      if (ventes.details?.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('RAPPORT DE VENTES', margins.left, yPosition);
        yPosition += 5;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total: ${formatCurrency(ventes.total || 0)}`, margins.left, yPosition);
        yPosition += 4;
        doc.text(`Nombre: ${ventes.nombre || 0} ventes`, margins.left, yPosition);
        yPosition += 8;
        
        // Par statut
        const parStatut = ventes.par_statut || {};
        if (Object.keys(parStatut).length > 0) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Répartition par statut', margins.left, yPosition);
          yPosition += 5;
          
          const statutData = [['Statut', 'Nombre']];
          Object.entries(parStatut).forEach(([statut, count]) => {
            statutData.push([statut, count.toString()]);
          });
          
          autoTable(doc, {
            head: [statutData[0]],
            body: statutData.slice(1),
            startY: yPosition,
            margin: { left: margins.left, right: margins.right },
            tableWidth: contentWidth * 0.5,
            styles: { fontSize: 7, cellPadding: 3 },
            headStyles: { 
              fillColor: [55, 65, 85], 
              textColor: [255, 255, 255],
              fontSize: 8,
              fontStyle: 'bold'
            }
          });
          yPosition = doc.lastAutoTable.finalY + 8;
        }
        
        // Détails
        const details = ventes.details || [];
        if (details.length > 0) {
          if (yPosition > pageHeight - margins.bottom - 50) {
            doc.addPage();
            yPosition = margins.top + 10;
          }
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Détails des ventes', margins.left, yPosition);
          yPosition += 5;
          
          const detailData = [['Facture', 'Client', 'Date', 'Montant']];
          details.slice(0, 15).forEach(item => {
            detailData.push([
              item.invoice || '-',
              item.client || '-',
              item.date || '-',
              formatCurrency(item.montant)
            ]);
          });
          if (details.length > 15) {
            detailData.push(['...', '...', '...', '...']);
          }
          
          autoTable(doc, {
            head: [detailData[0]],
            body: detailData.slice(1),
            startY: yPosition,
            margin: { left: margins.left, right: margins.right },
            tableWidth: contentWidth,
            styles: { fontSize: 6, cellPadding: 2 },
            headStyles: { 
              fillColor: [55, 65, 85], 
              textColor: [255, 255, 255],
              fontSize: 7,
              fontStyle: 'bold'
            },
            columnStyles: {
              0: { cellWidth: 30 },
              1: { cellWidth: 'auto' },
              2: { cellWidth: 30 },
              3: { cellWidth: 'auto', halign: 'right' }
            }
          });
          yPosition = doc.lastAutoTable.finalY + 8;
        }
      }
    }

    // === DÉPENSES ===
    else if (rapport.type === 'depenses') {
      const depenses = data.depenses || {};
      
      if (depenses.details?.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('RAPPORT DE DÉPENSES', margins.left, yPosition);
        yPosition += 5;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total: ${formatCurrency(depenses.total || 0)}`, margins.left, yPosition);
        yPosition += 4;
        doc.text(`Nombre: ${depenses.nombre || 0} dépenses`, margins.left, yPosition);
        yPosition += 8;
        
        // Par catégorie
        const parCategorie = depenses.par_categorie || {};
        if (Object.keys(parCategorie).length > 0) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Répartition par catégorie', margins.left, yPosition);
          yPosition += 5;
          
          const catData = [['Catégorie', 'Montant']];
          Object.entries(parCategorie).forEach(([cat, montant]) => {
            catData.push([cat, formatCurrency(montant)]);
          });
          
          autoTable(doc, {
            head: [catData[0]],
            body: catData.slice(1),
            startY: yPosition,
            margin: { left: margins.left, right: margins.right },
            tableWidth: contentWidth * 0.6,
            styles: { fontSize: 7, cellPadding: 3 },
            headStyles: { 
              fillColor: [55, 65, 85], 
              textColor: [255, 255, 255],
              fontSize: 8,
              fontStyle: 'bold'
            },
            columnStyles: {
              0: { cellWidth: 'auto' },
              1: { cellWidth: 'auto', halign: 'right' }
            }
          });
          yPosition = doc.lastAutoTable.finalY + 8;
        }
        
        // Détails
        const details = depenses.details || [];
        if (details.length > 0) {
          if (yPosition > pageHeight - margins.bottom - 50) {
            doc.addPage();
            yPosition = margins.top + 10;
          }
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Détails des dépenses', margins.left, yPosition);
          yPosition += 5;
          
          const detailData = [['Référence', 'Catégorie', 'Date', 'Montant']];
          details.slice(0, 15).forEach(item => {
            detailData.push([
              item.reference || '-',
              item.categorie || '-',
              item.date || '-',
              formatCurrency(item.montant)
            ]);
          });
          if (details.length > 15) {
            detailData.push(['...', '...', '...', '...']);
          }
          
          autoTable(doc, {
            head: [detailData[0]],
            body: detailData.slice(1),
            startY: yPosition,
            margin: { left: margins.left, right: margins.right },
            tableWidth: contentWidth,
            styles: { fontSize: 6, cellPadding: 2 },
            headStyles: { 
              fillColor: [55, 65, 85], 
              textColor: [255, 255, 255],
              fontSize: 7,
              fontStyle: 'bold'
            },
            columnStyles: {
              0: { cellWidth: 30 },
              1: { cellWidth: 'auto' },
              2: { cellWidth: 30 },
              3: { cellWidth: 'auto', halign: 'right' }
            }
          });
          yPosition = doc.lastAutoTable.finalY + 8;
        }
      }
    }

    // Pied de page
    if (yPosition > pageHeight - margins.bottom - 30) {
      doc.addPage();
      yPosition = margins.top + 10;
    }
    
    doc.setDrawColor(180, 180, 180);
    doc.line(margins.left, pageHeight - margins.bottom - 15, pageWidth - margins.right, pageHeight - margins.bottom - 15);
    
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'bold');
    doc.text('COORDONNÉES BANCAIRES', pageWidth / 2, pageHeight - margins.bottom - 10, { align: 'center' });
    
    doc.setFontSize(4);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${defaultCompany.bank_name} - Compte: ${defaultCompany.bank_account}`, 
      pageWidth / 2, 
      pageHeight - margins.bottom - 6, 
      { align: 'center' }
    );
    
    doc.setFontSize(4);
    doc.setFont('italic');
    doc.text('Document généré automatiquement', pageWidth / 2, pageHeight - margins.bottom - 2, { align: 'center' });

    doc.save(`${rapport.nom || 'rapport'}.pdf`);
    return true;
    
  } catch (error) {
    console.error('Erreur generateRapportPdf:', error);
    throw new Error('Génération PDF échouée : ' + error.message);
  }
};

const RapportPdf = () => {
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
        
        const response = await AxiosInstance.get(`/rapports/${id}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        
        setProgress(50);
        const rapport = response.data;
        
        await generateRapportPdf(rapport);
        setProgress(100);
        
        setTimeout(() => {
          navigate(`/rapports-financiers/${id}`);
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
          <button onClick={() => navigate(`/rapports-financiers/${id}`)} className="btn btn-primary">
            Retour au rapport
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default RapportPdf;