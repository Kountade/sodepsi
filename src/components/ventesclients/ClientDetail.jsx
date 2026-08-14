// src/components/clients/ClientDetail.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, User, Building2, Phone, Mail, MapPin,
  CreditCard, Award, Edit, RefreshCw, Star,
  Users, FileText, AlertCircle, Loader2,
  TrendingUp, Calendar, Clock, CheckCircle,
  XCircle, ShoppingCart, DollarSign, Package,
  FileDown, Printer, X, Globe
} from 'lucide-react';
import { downloadClientFacturesPDF } from './ClientFacturesPDF'; // Import de la fonction PDF

const ClientDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [factures, setFactures] = useState([]);
  const [stats, setStats] = useState(null);
  const [notification, setNotification] = useState(null);

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchClientDetails = async () => {
    setLoading(true);
    try {
      const token = getToken();
      
      // Récupérer les détails du client
      const clientRes = await AxiosInstance.get(`/clients/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setClient(clientRes.data);

      // Récupérer les ventes du client
      const salesRes = await AxiosInstance.get(`/clients/${id}/sales/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setSales(salesRes.data || []);

      // Récupérer les factures du client
      const facturesRes = await AxiosInstance.get(`/factures/?client=${id}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setFactures(facturesRes.data.results || facturesRes.data || []);

      // Récupérer les statistiques
      const statsRes = await AxiosInstance.get(`/clients/${id}/statistics/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setStats(statsRes.data);

    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        showNotification('Client non trouvé', 'error');
        setTimeout(() => navigate('/clients'), 1500);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientDetails();
  }, [id]);

  // ========== GÉNÉRATION PDF ==========
  const handleGeneratePDF = async () => {
    if (factures.length === 0) {
      showNotification('Aucune facture à télécharger', 'error');
      return;
    }
    try {
      // Appel de la fonction d'export PDF importée
      await downloadClientFacturesPDF(client, factures, {
        filename: `Releve_factures_${client.code}_${new Date().toISOString().slice(0,10)}.pdf`
      });
      showNotification('PDF généré avec succès', 'success');
    } catch (error) {
      console.error('Erreur PDF:', error);
      showNotification('Erreur lors de la génération du PDF', 'error');
    }
  };

  // ========== FONCTIONS DE FORMATAGE ==========
  // Correction : suppression des espaces (séparateurs de milliers) pour éviter les artefacts
  const formatCurrency = (amount) => {
    if (!amount) return '0 FCFA';
    const num = Number(amount);
    // On retire tous les espaces générés par toLocaleString
    return `${Math.round(num).toLocaleString('fr-FR').replace(/\s/g, '')} FCFA`;
    // Alternative sans séparateur du tout : return `${Math.round(num)} FCFA`;
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  // ========== BADGES ==========
  const getStatutBadge = (statut) => {
    switch(statut) {
      case 'actif': return <span className="badge badge-success gap-1"><CheckCircle className="w-3 h-3" /> Actif</span>;
      case 'inactif': return <span className="badge badge-error gap-1"><XCircle className="w-3 h-3" /> Inactif</span>;
      case 'bloque': return <span className="badge badge-warning gap-1"><AlertCircle className="w-3 h-3" /> Bloqué</span>;
      default: return <span className="badge badge-ghost">{statut}</span>;
    }
  };

  const getTypeBadge = (type) => {
    const configs = {
      particulier: { label: 'Particulier', className: 'badge-info' },
      entreprise: { label: 'Entreprise', className: 'badge-primary' },
      revendeur: { label: 'Revendeur', className: 'badge-warning' },
      grossiste: { label: 'Grossiste', className: 'badge-success' }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getPaymentStatusBadge = (status) => {
    switch(status) {
      case 'paid': return <span className="badge badge-success">Payée</span>;
      case 'partial': return <span className="badge badge-warning">Partiel</span>;
      case 'pending': return <span className="badge badge-error">En attente</span>;
      default: return <span className="badge badge-ghost">{status}</span>;
    }
  };

  const getSaleStatusBadge = (status) => {
    switch(status) {
      case 'confirmed': return <span className="badge badge-info">Confirmée</span>;
      case 'paid': return <span className="badge badge-success">Payée</span>;
      case 'delivered': return <span className="badge badge-primary">Livrée</span>;
      case 'cancelled': return <span className="badge badge-error">Annulée</span>;
      case 'returned': return <span className="badge badge-warning">Retournée</span>;
      default: return <span className="badge badge-ghost">{status}</span>;
    }
  };

  const getFactureStatusBadge = (status) => {
    const configs = {
      draft: { label: 'Brouillon', className: 'badge-ghost' },
      sent: { label: 'Envoyée', className: 'badge-info' },
      partial: { label: 'Partielle', className: 'badge-warning' },
      paid: { label: 'Payée', className: 'badge-success' },
      overdue: { label: 'En retard', className: 'badge-error' },
      cancelled: { label: 'Annulée', className: 'badge-error' }
    };
    const config = configs[status] || configs.draft;
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  // Calcul des totaux des factures
  const totalFactures = factures.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
  const totalPaye = factures.reduce((sum, f) => sum + (Number(f.amount_paid) || 0), 0);
  const totalRestant = totalFactures - totalPaye;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement du client...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Client non trouvé</h2>
          <button onClick={() => navigate('/clients')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(null)}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/clients')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  {client.type === 'entreprise' ? <Building2 className="w-6 h-6 text-primary" /> : <User className="w-6 h-6 text-primary" />}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    {client.name}
                    {client.is_favorite && <Star className="w-5 h-5 text-warning fill-warning" />}
                  </h1>
                  <p className="text-sm text-gray-500">{client.code}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate(`/clients/${id}/modifier`)} 
                className="btn btn-primary btn-sm gap-2"
              >
                <Edit className="w-4 h-4" /> Modifier
              </button>
              <button onClick={fetchClientDetails} className="btn btn-ghost btn-sm btn-circle" title="Actualiser">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Cartes d'information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total achats</p>
                <p className="font-semibold">{formatCurrency(client.total_purchases)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Nombre de commandes</p>
                <p className="font-semibold">{stats?.total_orders || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Award className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Note</p>
                <p className="font-semibold">{client.rating || 0} / 5</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Limite de crédit</p>
                <p className="font-semibold">{formatCurrency(client.credit_limit)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Détails du client */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Informations générales
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Code</span>
                <span className="font-mono font-medium">{client.code}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Nom</span>
                <span className="font-medium">{client.name}</span>
              </div>
              {client.commercial_name && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Nom commercial</span>
                  <span className="font-medium">{client.commercial_name}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Type</span>
                {getTypeBadge(client.type)}
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Statut</span>
                {getStatutBadge(client.statut)}
              </div>
              {client.contact_person && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Personne de contact</span>
                  <span className="font-medium">{client.contact_person}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Favori</span>
                <span>{client.is_favorite ? <Star className="w-4 h-4 text-warning fill-warning" /> : 'Non'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" /> Contacts & Adresse
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="flex-1 text-gray-600">Téléphone</span>
                <span className="font-medium">{client.phone}</span>
              </div>
              {client.mobile && (
                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-gray-600">Mobile</span>
                  <span className="font-medium">{client.mobile}</span>
                </div>
              )}
              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="flex-1 text-gray-600">Email</span>
                <span className="font-medium">{client.email}</span>
              </div>
              {client.website && (
                <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-gray-600">Site web</span>
                  <span className="font-medium">{client.website}</span>
                </div>
              )}
              <div className="flex items-start gap-3 py-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="flex-1 text-gray-600">Adresse</span>
                <span className="font-medium text-right max-w-[200px]">
                  {client.address}<br />
                  {client.city}, {client.country}
                  {client.postal_code && ` (${client.postal_code})`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Informations fiscales et commerciales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Informations fiscales
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">N° IF</span>
                <span className="font-medium">{client.tax_id || '-'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">N° RCCM</span>
                <span className="font-medium">{client.registration_number || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Conditions commerciales
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Délai de paiement</span>
                <span className="font-medium">{client.payment_terms === 'cash' ? 'Comptant' : `${client.payment_terms} jours`}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Limite de crédit</span>
                <span className="font-medium">{formatCurrency(client.credit_limit)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Solde actuel</span>
                <span className="font-medium">{formatCurrency(client.current_balance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Historique des factures avec bouton PDF */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gray-50 px-6 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Factures
              <span className="badge badge-ghost badge-sm ml-1">{factures.length}</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGeneratePDF}
                disabled={factures.length === 0}
                className={`btn btn-primary btn-sm gap-2 ${factures.length === 0 ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}`}
                title={factures.length === 0 ? 'Aucune facture à télécharger' : 'Générer le PDF des factures'}
              >
                <FileDown className="w-4 h-4" /> Télécharger PDF
              </button>
            </div>
          </div>
          
          {/* Résumé des totaux des factures */}
          {factures.length > 0 && (
            <div className="grid grid-cols-3 gap-4 px-6 py-3 bg-info/5 border-b border-gray-100">
              <div className="text-center">
                <p className="text-xs text-gray-500">Total factures</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(totalFactures)}</p>
              </div>
              <div className="text-center border-x border-gray-200">
                <p className="text-xs text-gray-500">Total payé</p>
                <p className="text-lg font-bold text-success">{formatCurrency(totalPaye)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Reste à payer</p>
                <p className={`text-lg font-bold ${totalRestant > 0 ? 'text-error' : 'text-success'}`}>
                  {formatCurrency(totalRestant)}
                </p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold">N° Facture</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Échéance</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Payé</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Reste</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {factures.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      Aucune facture trouvée pour ce client
                    </td>
                  </tr>
                ) : (
                  factures.map(facture => {
                    const isOverdue = new Date(facture.due_date) < new Date() && facture.status !== 'paid';
                    const remaining = Number(facture.total) - Number(facture.amount_paid);
                    return (
                      <tr key={facture.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/factures/${facture.id}`)}
                            className="font-mono text-sm font-medium text-primary hover:underline"
                          >
                            {facture.invoice_number}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">{formatShortDate(facture.invoice_date)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={isOverdue ? 'text-error font-medium' : ''}>
                            {formatShortDate(facture.due_date)}
                            {isOverdue && (
                              <span className="ml-1 badge badge-error badge-xs">En retard</span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(facture.total)}</td>
                        <td className="px-4 py-3 text-right text-success">{formatCurrency(facture.amount_paid)}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          <span className={remaining > 0 ? 'text-error' : 'text-success'}>
                            {formatCurrency(remaining)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">{getFactureStatusBadge(facture.status)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {factures.length > 0 && (
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right font-bold">
                      TOTAUX
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-primary">
                      {formatCurrency(totalFactures)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-success">
                      {formatCurrency(totalPaye)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      <span className={totalRestant > 0 ? 'text-error' : 'text-success'}>
                        {formatCurrency(totalRestant)}
                      </span>
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Historique des ventes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" /> Historique des ventes
              <span className="badge badge-ghost badge-sm ml-1">{sales.length}</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold">N° Facture</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Montant</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Statut</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Paiement</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      Aucune vente pour ce client
                    </td>
                  </tr>
                ) : (
                  sales.map(sale => (
                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/sales/${sale.id}`)}
                          className="font-mono text-sm font-medium text-primary hover:underline"
                        >
                          {sale.invoice_number}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDate(sale.sale_date)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(sale.total)}</td>
                      <td className="px-4 py-3 text-center">{getSaleStatusBadge(sale.status)}</td>
                      <td className="px-4 py-3 text-center">{getPaymentStatusBadge(sale.payment_status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {client.notes && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Notes
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">{client.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetail;