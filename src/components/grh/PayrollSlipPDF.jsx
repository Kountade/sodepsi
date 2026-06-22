// src/components/drh/PayrollSlipPDF.jsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Styles avec les couleurs de l'entreprise
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica'
  },
  header: {
    textAlign: 'center',
    marginBottom: 25,
    borderBottomWidth: 2,
    borderBottomColor: '#003C3f',
    borderBottomStyle: 'solid',
    paddingBottom: 10
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003C3f',
    letterSpacing: 2,
    marginBottom: 5
  },
  companySubtitle: {
    fontSize: 10,
    color: '#DA4A0E',
    fontWeight: 'bold',
    marginBottom: 5
  },
  documentTitle: {
    fontSize: 16,
    marginTop: 5,
    color: '#003C3f',
    fontWeight: 'bold'
  },
  payrollNumber: {
    fontSize: 9,
    color: '#999',
    marginTop: 3
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'solid'
  },
  infoBlock: {
    flex: 1
  },
  infoLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 8,
    color: '#003C3f',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333'
  },
  infoSubValue: {
    fontSize: 9,
    color: '#666',
    marginTop: 2
  },
  table: {
    marginTop: 15,
    marginBottom: 15
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#003C3f',
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#ffffff',
    fontSize: 9,
    textTransform: 'uppercase'
  },
  tableRow: {
    flexDirection: 'row',
    padding: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    borderBottomStyle: 'solid'
  },
  tableRowEven: {
    backgroundColor: '#fafafa'
  },
  tableAltRow: {
    backgroundColor: '#f0f7f7'
  },
  col1: { width: '70%' },
  col2: { width: '30%', textAlign: 'right' },
  totalRow: {
    backgroundColor: '#e8f5e9',
    fontWeight: 'bold',
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: '#c8e6c9'
  },
  grandTotalRow: {
    backgroundColor: '#ffe0b2',
    fontWeight: 'bold'
  },
  totalBox: {
    marginTop: 25,
    padding: 15,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    borderStyle: 'solid'
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003C3f'
  },
  totalSubtext: {
    fontSize: 9,
    color: '#666',
    marginTop: 5
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#aaa',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderTopStyle: 'solid',
    paddingTop: 10
  },
  watermark: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
    opacity: 0.05,
    transform: 'rotate(-45deg)'
  },
  watermarkText: {
    fontSize: 50,
    color: '#003C3f',
    fontWeight: 'bold'
  },
  signatureBox: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#999',
    borderTopStyle: 'solid',
    width: 200,
    marginTop: 5
  },
  signatureText: {
    fontSize: 8,
    color: '#666',
    marginTop: 5,
    textAlign: 'center'
  },
  statusBadge: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#e8f5e9',
    alignSelf: 'flex-start'
  },
  statusText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#4caf50'
  },
  statusPending: {
    backgroundColor: '#fff3e0'
  },
  statusPendingText: {
    color: '#ff9800'
  }
});

const PayrollSlipPDF = ({ payroll }) => {
  // Vérification si payroll est valide
  if (!payroll || !payroll.id) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={{ textAlign: 'center', marginTop: 100, color: '#f44336' }}>
            Données manquantes pour générer le bulletin.
          </Text>
        </Page>
      </Document>
    );
  }

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0,00';
    return new Intl.NumberFormat('fr-FR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(num);
  };

  const getMonthName = (month) => {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[month - 1] || 'Inconnu';
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'paid':
        return { badge: styles.statusBadge, text: styles.statusText };
      case 'pending':
        return { badge: [styles.statusBadge, styles.statusPending], text: [styles.statusText, styles.statusPendingText] };
      default:
        return { badge: styles.statusBadge, text: styles.statusText };
    }
  };

  const gross = payroll.gross_salary || 0;
  const net = payroll.net_salary || 0;
  const deductions = gross - net;

  const earnings = [
    { label: 'Salaire de base', amount: payroll.base_salary, isBase: true },
    { label: 'Prime de performance', amount: payroll.performance_bonus },
    { label: "Prime d'ancienneté", amount: payroll.seniority_bonus },
    { label: 'Heures supplémentaires', amount: payroll.overtime_amount },
    { label: 'Indemnité transport', amount: payroll.transport_bonus },
    { label: 'Forfait téléphone', amount: payroll.phone_bonus },
    { label: 'Autres primes', amount: payroll.other_bonus }
  ].filter(item => item.amount && item.amount > 0);

  const deductionsItems = [
    { label: 'Sécurité sociale (CNSS)', amount: payroll.social_security },
    { label: "Impôt sur le revenu (IRPP)", amount: payroll.income_tax },
    { label: 'Fonds de pension (IPRES)', amount: payroll.pension_fund },
    { label: 'Mutuelle santé', amount: payroll.health_insurance },
    { label: 'Congé sans solde', amount: payroll.unpaid_leave },
    { label: 'Avantages en nature', amount: payroll.nature_benefits },
    { label: 'Autres déductions', amount: payroll.other_deductions }
  ].filter(item => item.amount && item.amount > 0);

  const statusStyle = getStatusStyle(payroll.status);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Filigrane */}
        <View style={styles.watermark} fixed>
          <Text style={styles.watermarkText}>BULLETIN OFFICIEL</Text>
        </View>

        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.companyName}>SEYDI GROUP</Text>
          <Text style={styles.companySubtitle}>ERP Multi-Agences</Text>
          <Text style={styles.documentTitle}>BULLETIN DE PAIE</Text>
          <Text style={styles.payrollNumber}>N° {payroll.payroll_number || 'N/A'}</Text>
        </View>

        {/* Section informations */}
        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Employé</Text>
            <Text style={styles.infoValue}>{payroll.employee_name || 'Non spécifié'}</Text>
            <Text style={styles.infoSubValue}>Matricule: {payroll.employee_number || 'N/A'}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Période</Text>
            <Text style={styles.infoValue}>{getMonthName(payroll.month)} {payroll.year}</Text>
            <Text style={styles.infoSubValue}>Date d'émission: {new Date().toLocaleDateString('fr-FR')}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Statut</Text>
            <View style={statusStyle.badge}>
              <Text style={statusStyle.text}>
                {payroll.status_display || payroll.status || 'Inconnu'}
              </Text>
            </View>
            {payroll.position_title && (
              <Text style={styles.infoSubValue}>{payroll.position_title}</Text>
            )}
          </View>
        </View>

        {/* Section rémunérations */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>Rémunérations</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>Montant (€)</Text>
          </View>
          {earnings.length > 0 ? (
            earnings.map((item, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.tableRow, 
                  idx % 2 === 1 && styles.tableRowEven,
                  item.isBase && { backgroundColor: '#f0f7f7' }
                ]}
              >
                <Text style={styles.col1}>{item.label}</Text>
                <Text style={styles.col2}>{formatNumber(item.amount)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={styles.col1}>Salaire de base</Text>
              <Text style={styles.col2}>{formatNumber(payroll.base_salary)}</Text>
            </View>
          )}
          <View style={[styles.tableRow, styles.totalRow]}>
            <Text style={[styles.col1, { fontWeight: 'bold' }]}>Total brut</Text>
            <Text style={[styles.col2, { fontWeight: 'bold' }]}>{formatNumber(gross)}</Text>
          </View>
        </View>

        {/* Section cotisations et déductions */}
        {deductionsItems.length > 0 && (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.col1]}>Cotisations et déductions</Text>
              <Text style={[styles.tableHeaderText, styles.col2]}>Montant (€)</Text>
            </View>
            {deductionsItems.map((item, idx) => (
              <View key={idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowEven]}>
                <Text style={styles.col1}>{item.label}</Text>
                <Text style={styles.col2}>{formatNumber(item.amount)}</Text>
              </View>
            ))}
            {deductions > 0 && (
              <View style={[styles.tableRow, styles.totalRow]}>
                <Text style={[styles.col1, { fontWeight: 'bold' }]}>Total des déductions</Text>
                <Text style={[styles.col2, { fontWeight: 'bold' }]}>{formatNumber(deductions)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Total net à payer */}
        <View style={styles.totalBox}>
          <Text style={styles.totalText}>NET À PAYER : {formatNumber(net)} €</Text>
          {payroll.payment_method && (
            <Text style={styles.totalSubtext}>
              Mode de paiement : {payroll.payment_method === 'bank' ? 'Virement bancaire' : 'Chèque'}
            </Text>
          )}
        </View>

        {/* Signature */}
        <View style={styles.signatureBox}>
          <View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Signature de l'employeur</Text>
          </View>
          <View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Signature de l'employé</Text>
          </View>
        </View>

        {/* Pied de page */}
        <View style={styles.footer} fixed>
          <Text>SEYDI GROUP – ERP Multi-Agences</Text>
          <Text>Document généré automatiquement le {new Date().toLocaleDateString('fr-FR')}</Text>
          <Text>Ce bulletin tient lieu de fiche de paie officielle. Il est conforme à la législation en vigueur.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PayrollSlipPDF;