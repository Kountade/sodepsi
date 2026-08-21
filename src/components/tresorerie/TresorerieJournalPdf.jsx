// src/components/tresorerie/TresorerieJournalPdf.jsx
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Polices (optionnel)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helvetica/v12/...' }
  ]
});

// Styles professionnels
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'column',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#1a237e',
    borderBottomStyle: 'solid',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    marginRight: 12,
    backgroundColor: '#1a237e',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  companyInfo: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    fontFamily: 'Helvetica',
    letterSpacing: 1,
  },
  companySub: {
    fontSize: 8,
    color: '#546e7a',
    marginTop: 1,
  },
  headerRight: {
    textAlign: 'right',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    fontFamily: 'Helvetica',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingTop: 4,
  },
  documentRef: {
    fontSize: 9,
    color: '#546e7a',
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'solid',
  },
  infoCol: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 4,
  },
  infoLabel: {
    fontSize: 7,
    color: '#78909c',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 15,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    borderBottomStyle: 'solid',
    fontFamily: 'Helvetica',
    letterSpacing: 0.5,
  },
  detailCard: {
    marginTop: 5,
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'solid',
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
    borderBottomStyle: 'solid',
  },
  detailRowLast: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  detailLabel: {
    width: '40%',
    fontSize: 9,
    color: '#546e7a',
  },
  detailValue: {
    width: '60%',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1a237e',
    textAlign: 'right',
  },
  detailSubRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    borderBottomWidth: 0.3,
    borderBottomColor: '#e0e0e0',
    borderBottomStyle: 'solid',
    paddingLeft: 20,
  },
  amountBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#e8eaf6',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#c5cae9',
    borderStyle: 'solid',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a237e',
    fontFamily: 'Helvetica',
    letterSpacing: 1,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    fontFamily: 'Helvetica',
  },
  signature: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signatureBlock: {
    textAlign: 'center',
    marginLeft: 40,
  },
  signatureLine: {
    width: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#424242',
    borderBottomStyle: 'solid',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#546e7a',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderTopStyle: 'solid',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#78909c',
  },
  watermark: {
    position: 'absolute',
    bottom: 150,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 40,
    color: 'rgba(26, 35, 126, 0.05)',
    fontFamily: 'Helvetica',
    transform: 'rotate(-30deg)',
  },
});

// Formatage
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const formatCurrency = (num) => `${formatNumber(num)} FCFA`;

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

// Composant principal
const TresorerieJournalPdf = ({ data, warehouseName }) => {
  const d = data || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Filigrane */}
        <Text style={styles.watermark}>TRÉSORERIE JOURNALIÈRE</Text>

        {/* En-tête avec deux lignes séparées */}
        <View style={styles.header}>
          {/* Première ligne : logo + nom de l'entreprise */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>S</Text>
              </View>
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>BOUTIQUE STATION SODEPCI DE PARA</Text>
                <Text style={styles.companySub}>Station SODEPCI, Para – Tél: 07 47 55 71 69 / 07 08 42 96 09</Text>
              </View>
            </View>
          </View>

          {/* Deuxième ligne : titre à gauche, date et entrepôt à droite */}
          <View style={[styles.headerRow, { marginTop: 10 }]}>
            <View style={styles.headerLeft}>
              <Text style={styles.documentTitle}>TRÉSORERIE JOURNALIÈRE</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.documentRef}>{formatDate(d.date)} – {warehouseName || 'Entrepôt'}</Text>
            </View>
          </View>
        </View>

        {/* Informations générales */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(d.date)}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Entrepôt</Text>
            <Text style={styles.infoValue}>{warehouseName || '-'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Opérations</Text>
            <Text style={styles.infoValue}>{d.nb_operations || 0}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Entrées / Sorties</Text>
            <Text style={styles.infoValue}>{d.nb_entrees || 0} / {d.nb_sorties || 0}</Text>
          </View>
        </View>

        {/* Détails des flux */}
        <Text style={styles.sectionTitle}>RÉCAPITULATIF DES FLUX</Text>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Solde d'ouverture</Text>
            <Text style={styles.detailValue}>{formatCurrency(d.solde_ouverture)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Solde de fermeture</Text>
            <Text style={styles.detailValue}>{formatCurrency(d.solde_fermeture)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Variation</Text>
            <Text style={[styles.detailValue, { color: parseFloat(d.variation || 0) >= 0 ? '#22c55e' : '#ef4444' }]}>
              {formatCurrency(d.variation)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total entrées</Text>
            <Text style={[styles.detailValue, { color: '#22c55e' }]}>{formatCurrency(d.total_entrees)}</Text>
          </View>
          <View style={styles.detailSubRow}>
            <Text style={[styles.detailLabel, { fontSize: 8 }]}>- Ventes</Text>
            <Text style={[styles.detailValue, { fontSize: 8 }]}>{formatCurrency(d.entrees_ventes)}</Text>
          </View>
          <View style={styles.detailSubRow}>
            <Text style={[styles.detailLabel, { fontSize: 8 }]}>- Règlements</Text>
            <Text style={[styles.detailValue, { fontSize: 8 }]}>{formatCurrency(d.entrees_reglements)}</Text>
          </View>
          <View style={styles.detailSubRow}>
            <Text style={[styles.detailLabel, { fontSize: 8 }]}>- Autres entrées</Text>
            <Text style={[styles.detailValue, { fontSize: 8 }]}>{formatCurrency(d.entrees_autres)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total sorties</Text>
            <Text style={[styles.detailValue, { color: '#ef4444' }]}>{formatCurrency(d.total_sorties)}</Text>
          </View>
          <View style={styles.detailSubRow}>
            <Text style={[styles.detailLabel, { fontSize: 8 }]}>- Achats</Text>
            <Text style={[styles.detailValue, { fontSize: 8 }]}>{formatCurrency(d.sorties_achats)}</Text>
          </View>
          <View style={styles.detailSubRow}>
            <Text style={[styles.detailLabel, { fontSize: 8 }]}>- Frais</Text>
            <Text style={[styles.detailValue, { fontSize: 8 }]}>{formatCurrency(d.sorties_frais)}</Text>
          </View>
          <View style={styles.detailSubRow}>
            <Text style={[styles.detailLabel, { fontSize: 8 }]}>- Salaires</Text>
            <Text style={[styles.detailValue, { fontSize: 8 }]}>{formatCurrency(d.sorties_salaires)}</Text>
          </View>
          <View style={styles.detailSubRow}>
            <Text style={[styles.detailLabel, { fontSize: 8 }]}>- Autres sorties</Text>
            <Text style={[styles.detailValue, { fontSize: 8 }]}>{formatCurrency(d.sorties_autres)}</Text>
          </View>
        </View>

        {/* Variation nette */}
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>VARIATION NETTE</Text>
          <Text style={[styles.amountValue, { color: parseFloat(d.variation || 0) >= 0 ? '#22c55e' : '#ef4444' }]}>
            {formatCurrency(d.variation)}
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signature}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Signature du responsable</Text>
            <Text style={{ fontSize: 7, color: '#78909c', marginTop: 2 }}>
              {formatDate(d.date)}
            </Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Signature du comptable</Text>
            <Text style={{ fontSize: 7, color: '#78909c', marginTop: 2 }}>
              SODEPCI
            </Text>
          </View>
        </View>

        {/* Pied de page */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            BOUTIQUE STATION SODEPCI DE PARA - Para, Côte d'Ivoire
          </Text>
          <Text style={styles.footerText}>
            Tél: 07 47 55 71 69 / 07 08 42 96 09
          </Text>
          <Text style={styles.footerText}>
            Page 1/1
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default TresorerieJournalPdf;