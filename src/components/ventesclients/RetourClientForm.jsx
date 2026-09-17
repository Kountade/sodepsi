// src/components/retours-clients/RetourClientForm.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Loader2, AlertCircle, CheckCircle,
  Undo2, User, FileText, DollarSign, Package, AlertTriangle,
  RefreshCw
} from 'lucide-react';

const RetourClientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [clients, setClients] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [loadingVentes, setLoadingVentes] = useState(false);

  const [formData, setFormData] = useState({
    client: '',
    sale: '',
    type: 'refund',
    amount: 0,
    reason: '',
    notes: '',
    restore_stock: true   // ✅ Nouveau champ : restauration du stock
  });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================================
  // CHARGEMENT DES CLIENTS
  // ============================================================
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = getToken();
        const response = await AxiosInstance.get('/clients/', {
          headers: { 'Authorization': `Token ${token}` }
        });
        setClients(response.data || []);
      } catch (error) {
        console.error('Erreur chargement clients:', error);
      }
    };
    fetchClients();
  }, []);

  // ============================================================
  // CHARGEMENT DES VENTES DU CLIENT SÉLECTIONNÉ
  // ============================================================
  useEffect(() => {
    if (!formData.client) {
      setVentes([]);
      return;
    }

    const fetchVentes = async () => {
      setLoadingVentes(true);
      try {
        const token = getToken();
        const response = await AxiosInstance.get(
          `/sales/?client=${formData.client}&status=paid,delivered,confirmed`,
          { headers: { 'Authorization': `Token ${token}` } }
        );

        let data = response.data;
        let ventesData = Array.isArray(data) ? data : (data.results || []);
        setVentes(ventesData);
      } catch (error) {
        console.error('Erreur chargement ventes:', error);
        setVentes([]);
      } finally {
        setLoadingVentes(false);
      }
    };
    fetchVentes();
  }, [formData.client]);

  // ============================================================
  // CHARGEMENT DE L'AVOIR EN MODIFICATION
  // ============================================================
  useEffect(() => {
    if (isEdit && id) {
      const fetchAvoir = async () => {
        setLoading(true);
        try {
          const token = getToken();
          const response = await AxiosInstance.get(`/avoirs/${id}/`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          const data = response.data;
          setFormData({
            client: data.client || '',
            sale: data.sale || '',
            type: data.type || 'refund',
            amount: data.amount || 0,
            reason: data.reason || '',
            notes: data.notes || '',
            restore_stock: false  // En modification, on ne restaure pas automatiquement
          });
        } catch (error) {
          console.error('Erreur chargement avoir:', error);
          showNotification('Erreur de chargement', 'error');
          setTimeout(() => navigate('/retours-clients'), 1500);
        } finally {
          setLoading(false);
        }
      };
      fetchAvoir();
    }
  }, [id, isEdit, navigate]);

  // ============================================================
  // RÉCUPÉRATION DE LA VENTE SÉLECTIONNÉE
  // ============================================================
  const selectedVente = ventes.find(v => v.id === parseInt(formData.sale));

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    // Validations
    if (!formData.client) {
      showNotification('Veuillez sélectionner un client', 'error');
      return;
    }

    if (formData.type === 'return' && !formData.sale) {
      showNotification('Une vente est requise pour un retour', 'error');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      showNotification('Le montant doit être supérieur à 0', 'error');
      return;
    }

    if (selectedVente && formData.amount > selectedVente.total) {
      showNotification(
        `Le montant ne peut pas dépasser ${selectedVente.total.toLocaleString('fr-FR')} FCFA`,
        'error'
      );
      return;
    }

    if (!formData.reason.trim()) {
      showNotification('La raison est obligatoire', 'error');
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      const dataToSend = {
        client: parseInt(formData.client),
        sale: formData.sale ? parseInt(formData.sale) : null,
        type: formData.type,
        amount: parseFloat(formData.amount),
        reason: formData.reason,
        notes: formData.notes || '',
        restore_stock: formData.restore_stock
      };

      let response;
      if (isEdit) {
        response = await AxiosInstance.put(
          `/avoirs/${id}/`,
          dataToSend,
          { headers: { 'Authorization': `Token ${token}` } }
        );
        showNotification('Retour modifié avec succès', 'success');
      } else {
        response = await AxiosInstance.post(
          '/avoirs/',
          dataToSend,
          { headers: { 'Authorization': `Token ${token}` } }
        );
        showNotification('Retour créé avec succès', 'success');
      }

      setTimeout(() => {
        navigate(`/retours-clients/${response.data?.avoir?.id || response.data?.id}`);
      }, 1500);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      let errorMessage = 'Erreur lors de la sauvegarde';

      if (error.response?.data) {
        const data = error.response.data;
        if (data.detail) errorMessage = data.detail;
        else if (data.error) errorMessage = data.error;
        else if (typeof data === 'object') {
          const firstError = Object.values(data).flat()[0];
          if (firstError) errorMessage = firstError;
        }
      }

      showNotification(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-warning w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown max-w-md w-full">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success'
                ? <CheckCircle className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(null)}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/retours-clients')}
              className="btn btn-ghost btn-sm gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-xl">
                <Undo2 className="w-6 h-6 text-warning" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                {isEdit ? 'Modifier le retour' : 'Nouveau retour client'}
              </h1>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="btn btn-warning gap-2"
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-warning" /> Informations générales
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Client <span className="text-error">*</span>
                </span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.client}
                onChange={(e) => setFormData({
                  ...formData,
                  client: e.target.value,
                  sale: ''
                })}
                required
              >
                <option value="">Sélectionner un client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.code} - {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vente associée */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Vente associée
                  {formData.type === 'return' && <span className="text-error"> *</span>}
                  <span className="text-xs text-gray-400 ml-1">(optionnel pour remboursement)</span>
                </span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.sale}
                onChange={(e) => {
                  const saleId = e.target.value;
                  const vente = ventes.find(v => v.id === parseInt(saleId));
                  setFormData({
                    ...formData,
                    sale: saleId,
                    amount: vente ? vente.total : formData.amount
                  });
                }}
                disabled={!formData.client || loadingVentes}
              >
                <option value="">Aucune vente associée</option>
                {loadingVentes && <option>Chargement...</option>}
                {ventes.map(vente => (
                  <option key={vente.id} value={vente.id}>
                    {vente.invoice_number} - {vente.total.toLocaleString('fr-FR')} FCFA ({vente.client_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Type de retour <span className="text-error">*</span>
                </span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="refund">💸 Remboursement</option>
                <option value="return">📦 Retour de marchandise</option>
                <option value="discount">🏷️ Remise / Geste commercial</option>
                <option value="error">⚠️ Erreur de facturation</option>
              </select>
            </div>

            {/* Montant */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Montant (FCFA) <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={formData.amount}
                onChange={(e) => setFormData({
                  ...formData,
                  amount: parseFloat(e.target.value) || 0
                })}
                step="0.01"
                min="0"
                max={selectedVente?.total || undefined}
                required
              />
              {selectedVente && (
                <label className="label">
                  <span className="label-text-alt text-gray-400">
                    Max: {selectedVente.total.toLocaleString('fr-FR')} FCFA
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* ✅ OPTION DE RESTAURATION DU STOCK */}
          {formData.sale && (formData.type === 'refund' || formData.type === 'return') && !isEdit && (
            <div className="mt-4 p-4 bg-warning/5 border border-warning/20 rounded-xl">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-warning mt-0.5" />
                <div className="flex-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-warning"
                      checked={formData.restore_stock}
                      onChange={(e) => setFormData({
                        ...formData,
                        restore_stock: e.target.checked
                      })}
                    />
                    <span className="font-medium text-gray-700">
                      Restaurer automatiquement le stock
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-7">
                    Si coché, les produits de la vente seront remis en stock.
                    Un mouvement de stock sera créé pour la traçabilité.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Raison */}
          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text font-medium">
                Raison du retour <span className="text-error">*</span>
              </span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows="3"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ex: Produit défectueux, erreur de facturation, geste commercial..."
              required
            />
          </div>

          {/* Notes */}
          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text font-medium">Notes internes</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes pour usage interne"
            />
          </div>
        </div>

        {/* Aperçu de la vente sélectionnée */}
        {selectedVente && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Vente sélectionnée
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">N° Facture</p>
                <p className="font-semibold">{selectedVente.invoice_number}</p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-semibold">
                  {new Date(selectedVente.sale_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Total</p>
                <p className="font-semibold text-primary">
                  {selectedVente.total.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
              <div>
                <p className="text-gray-500">Statut</p>
                <span className="badge badge-info">{selectedVente.status_display}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/retours-clients')}
            className="btn btn-ghost"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-warning gap-2"
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Enregistrement...' : 'Enregistrer le retour'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RetourClientForm;