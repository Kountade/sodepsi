// src/components/retours-clients/RetourClientDetail.jsx
// ============================================================
// DÉTAIL D'UN RETOUR CLIENT AVEC LIGNES DE PRODUITS
// ============================================================

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Undo2, User, FileText, DollarSign, Package,
  Download, Edit, RefreshCw, CheckCircle, AlertCircle,
  Loader2, Phone, Mail, MapPin, Ban, X, Calendar,
  CreditCard, AlertTriangle, TrendingDown, Layers,
  PackageCheck, Info, Percent, Hash, Clock
} from 'lucide-react';

const RetourClientDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [avoir, setAvoir] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================================
  // CHARGEMENT DE L'AVOIR
  // ============================================================
  const fetchAvoir = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get(`/avoirs/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      console.log('📥 Avoir reçu:', response.data);
      setAvoir(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 404) {
        showNotification('Retour non trouvé', 'error');
        setTimeout(() => navigate('/retours-clients'), 1500);
      } else if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchAvoir();
  }, [id]);

  // ============================================================
  // SUPPRESSION
  // ============================================================
  const handleDelete = async () => {
    try {
      const token = getToken();
      await AxiosInstance.delete(`/avoirs/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Retour supprimé', 'success');
      setTimeout(() => navigate('/retours-clients'), 1500);
    } catch (error) {
      console.error('Erreur suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
      setShowDeleteModal(false);
    }
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '0 FCFA';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0 FCFA';
    return `${num.toLocaleString('fr-FR')} FCFA`;
  };

  const formatNumber = (num) => {
    const n = parseFloat(num) || 0;
    return n % 1 === 0 ? n.toString() : n.toFixed(2);
  };

  const formatDate = (dateString) => {
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

  const formatDateTime = (dateString) => {
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

  // ============================================================
  // BADGES
  // ============================================================
  const getTypeBadge = (type) => {
    const configs = {
      refund: { label: '💸 Remboursement', className: 'badge-error' },
      return: { label: '📦 Retour marchandise', className: 'badge-warning' },
      discount: { label: '🏷️ Remise', className: 'badge-info' },
      error: { label: '⚠️ Erreur facturation', className: 'badge-ghost' }
    };
    const config = configs[type] || { label: type, className: 'badge-ghost' };
    return <span className={`badge ${config.className} badge-lg gap-1`}>{config.label}</span>;
  };

  // ============================================================
  // CALCULS
  // ============================================================
  const lignes = avoir?.lignes || [];
  const nombreProduits = lignes.length;
  const quantiteTotale = lignes.reduce(
    (sum, l) => sum + (parseFloat(l.quantity) || 0), 0
  );
  const montantLignes = lignes.reduce(
    (sum, l) => sum + (parseFloat(l.total) || 0), 0
  );

  // ============================================================
  // RENDU — CHARGEMENT
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-warning w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement du retour...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU — NON TROUVÉ
  // ============================================================
  if (!avoir) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Retour non trouvé</h2>
          <p className="text-gray-500 mb-6">
            Le retour que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <button onClick={() => navigate('/retours-clients')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ==================== NOTIFICATION ==================== */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown max-w-md w-full">
          <div className={`alert ${
            notification.type === 'success' ? 'alert-success' : 'alert-error'
          } shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success'
                ? <CheckCircle className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification(null)}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL SUPPRESSION ==================== */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cet avoir ?</p>
              <p className="font-semibold text-error mt-2 font-mono">
                {avoir.avoir_number}
              </p>
              <p className="text-sm text-gray-500 mt-1">{avoir.client_name}</p>
              <p className="text-sm text-gray-500">
                Montant : {formatCurrency(avoir.amount)}
              </p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button
                className="btn btn-ghost flex-1"
                onClick={() => setShowDeleteModal(false)}
              >
                Annuler
              </button>
              <button
                className="btn btn-error flex-1 gap-2"
                onClick={handleDelete}
              >
                <Ban className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== HEADER ==================== */}
      <div className="bg-gradient-to-r from-warning/10 via-warning/5 to-transparent border-b border-warning/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/retours-clients')}
                className="btn btn-ghost btn-sm gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-warning/15 rounded-xl">
                  <Undo2 className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 font-mono">
                    {avoir.avoir_number}
                  </h1>
                  <p className="text-sm text-gray-500">{avoir.client_name}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate(`/retours-clients/${id}/pdf`)}
                className="btn btn-primary btn-sm gap-2"
              >
                <Download className="w-4 h-4" /> PDF
              </button>
              <button
                onClick={() => navigate(`/retours-clients/${id}/modifier`)}
                className="btn btn-outline btn-sm gap-2"
              >
                <Edit className="w-4 h-4" /> Modifier
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-error btn-sm gap-2"
              >
                <Ban className="w-4 h-4" /> Supprimer
              </button>
              <button
                onClick={fetchAvoir}
                className="btn btn-ghost btn-sm btn-circle"
                title="Actualiser"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== CONTENU ==================== */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* ==================== CARTES INFO ==================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">N° Avoir</p>
                <p className="font-semibold font-mono text-sm">{avoir.avoir_number}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-error/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-error" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Montant total</p>
                <p className="font-bold text-lg text-error">
                  {formatCurrency(avoir.amount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Layers className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Produits retournés</p>
                <p className="font-bold text-lg text-warning">
                  {nombreProduits}
                  <span className="text-xs text-gray-500 ml-1">
                    ({quantiteTotale} unité{quantiteTotale > 1 ? 's' : ''})
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                avoir.restore_stock ? 'bg-success/10' : 'bg-gray-100'
              }`}>
                <PackageCheck className={`w-5 h-5 ${
                  avoir.restore_stock ? 'text-success' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Stock</p>
                {avoir.restore_stock ? (
                  <p className="font-semibold text-success text-sm">
                    ✅ Restauré
                  </p>
                ) : (
                  <p className="font-semibold text-gray-400 text-sm">
                    Non restauré
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== DÉTAILS — GRILLE 2/3 + 1/3 ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* ============================================================ */}
          {/* COLONNE PRINCIPALE (2/3) — LIGNES DE PRODUITS */}
          {/* ============================================================ */}
          <div className="lg:col-span-2 space-y-6">

            {/* ==================== TABLEAU DES PRODUITS RETOURNÉS ==================== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-warning/10 to-transparent px-6 py-3 border-b border-warning/20">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4 text-warning" />
                    Produits retournés
                    <span className="badge badge-warning badge-sm">
                      {nombreProduits}
                    </span>
                  </h3>
                  <div className="text-xs text-gray-500">
                    Total : <span className="font-bold text-warning">
                      {formatCurrency(montantLignes)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                        Produit
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                        Quantité retournée
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                        Prix unit.
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                        Remise
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.length > 0 ? (
                      lignes.map((ligne, index) => (
                        <tr
                          key={ligne.id || index}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-sm">
                              {ligne.product_name || ligne.product?.name || 'Produit'}
                            </p>
                            {ligne.product_code && (
                              <p className="text-xs text-gray-400 font-mono">
                                {ligne.product_code}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="badge badge-warning badge-md font-bold">
                              {formatNumber(ligne.quantity)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            {formatCurrency(ligne.unit_price)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-error">
                            {parseFloat(ligne.discount) > 0
                              ? `-${formatCurrency(ligne.discount)}`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-warning">
                            {formatCurrency(ligne.total)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                          <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                          <p>Aucun produit retourné</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Cet avoir est un remboursement global ou une remise
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {/* ==================== PIED DU TABLEAU ==================== */}
                  {lignes.length > 0 && (
                    <tfoot className="bg-gradient-to-r from-warning/10 to-transparent border-t-2 border-warning">
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-right font-semibold text-sm">
                          Quantité totale retournée
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-warning">
                          {formatNumber(quantiteTotale)}
                        </td>
                      </tr>
                      <tr className="border-t border-warning/20">
                        <td colSpan="4" className="px-4 py-4 text-right font-bold">
                          Montant total de l'avoir
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-xl text-error">
                          {formatCurrency(avoir.amount)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* ==================== RAISON + NOTES ==================== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Raison du retour
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Motif</p>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {avoir.reason || 'Aucune raison spécifiée'}
                    </p>
                  </div>
                </div>
                {avoir.notes && (
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500 mb-1">Notes internes</p>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {avoir.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ==================== VENTE ASSOCIÉE ==================== */}
            {avoir.sale && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" /> Vente d'origine
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-mono font-semibold">
                          {avoir.sale_number || avoir.sale}
                        </p>
                        <p className="text-xs text-gray-500">Facture originale</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/ventes/${avoir.sale}`)}
                      className="btn btn-sm btn-outline gap-2"
                    >
                      <Package className="w-4 h-4" /> Voir la vente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* COLONNE DROITE (1/3) */}
          {/* ============================================================ */}
          <div className="space-y-6">

            {/* ==================== CLIENT ==================== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Client
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="avatar placeholder">
                    <div className="bg-primary/10 text-primary rounded-full w-10">
                      <span className="text-lg font-bold">
                        {(avoir.client_name || 'C').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{avoir.client_name || '-'}</p>
                    {avoir.client_phone && (
                      <p className="text-xs text-gray-500">{avoir.client_phone}</p>
                    )}
                  </div>
                </div>

                {avoir.client_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{avoir.client_phone}</span>
                  </div>
                )}

                {avoir.client?.id && (
                  <button
                    onClick={() => navigate(`/clients/${avoir.client.id}`)}
                    className="btn btn-ghost btn-sm w-full mt-2 gap-2"
                  >
                    <User className="w-4 h-4" /> Voir le client
                  </button>
                )}
              </div>
            </div>

            {/* ==================== TYPE D'AVOIR ==================== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" /> Type
                </h3>
              </div>
              <div className="p-4">
                {getTypeBadge(avoir.type)}
                <p className="text-xs text-gray-500 mt-3">
                  {avoir.type === 'refund' && "Remboursement complet ou partiel accordé au client."}
                  {avoir.type === 'return' && "Retour de marchandise : les produits retournés sont remis en stock."}
                  {avoir.type === 'discount' && "Remise accordée au client (geste commercial)."}
                  {avoir.type === 'error' && "Erreur de facturation à corriger."}
                </p>
              </div>
            </div>

            {/* ==================== RESTAURATION DU STOCK ==================== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-primary" /> Restauration stock
                </h3>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Statut</span>
                  {avoir.restore_stock ? (
                    <span className="badge badge-success badge-sm gap-1">
                      <CheckCircle className="w-3 h-3" /> Restauré
                    </span>
                  ) : (
                    <span className="badge badge-ghost badge-sm">
                      Non restauré
                    </span>
                  )}
                </div>
                {avoir.stock_restored_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium text-xs">
                      {formatDateTime(avoir.stock_restored_at)}
                    </span>
                  </div>
                )}
                {avoir.restore_stock && (
                  <div className="mt-2 p-2 bg-success/5 border border-success/20 rounded text-xs text-success">
                    ✅ Les {quantiteTotale} unité{quantiteTotale > 1 ? 's' : ''} ont
                    été remises en stock.
                  </div>
                )}
                {!avoir.restore_stock && lignes.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    ⚠️ Le stock n'a pas été restauré pour ce retour.
                  </div>
                )}
              </div>
            </div>

            {/* ==================== INFORMATIONS ==================== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Informations
                </h3>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Créé par</span>
                  <span className="font-medium">
                    {avoir.created_by_name || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">{formatDate(avoir.date)}</span>
                </div>
                {avoir.created_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Créé le</span>
                    <span className="font-medium text-xs">
                      {formatDateTime(avoir.created_at)}
                    </span>
                  </div>
                )}
                {avoir.updated_at && avoir.updated_at !== avoir.created_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Modifié le</span>
                    <span className="font-medium text-xs">
                      {formatDateTime(avoir.updated_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ==================== RÉCAPITULATIF ==================== */}
            <div className="bg-gradient-to-br from-warning/10 to-error/10 rounded-xl shadow-sm border border-warning/20 p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3 text-warning">
                <TrendingDown className="w-4 h-4" /> Récapitulatif
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Produits</span>
                  <span className="font-semibold">{nombreProduits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantité totale</span>
                  <span className="font-semibold">{formatNumber(quantiteTotale)}</span>
                </div>
                <div className="flex justify-between border-t border-warning/20 pt-2">
                  <span className="font-semibold">Montant</span>
                  <span className="font-bold text-lg text-error">
                    {formatCurrency(avoir.amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetourClientDetail;