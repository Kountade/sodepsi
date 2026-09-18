// src/components/retours-clients/RetourClientForm.jsx
// ============================================================
// FORMULAIRE DE RETOUR CLIENT AVEC RETOUR PARTIEL PAR PRODUIT
// ============================================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Loader2, AlertCircle, CheckCircle,
  Undo2, FileText, Package, CheckSquare, Square, Calculator,
  User, DollarSign, Percent, TrendingDown, Info,
  AlertTriangle, RefreshCw
} from 'lucide-react';

const RetourClientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  // ============================================================
  // ÉTATS
  // ============================================================
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [clients, setClients] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [loadingVentes, setLoadingVentes] = useState(false);
  const [saleDetails, setSaleDetails] = useState(null);
  const [existingAvoirs, setExistingAvoirs] = useState({}); // { ligne_vente_id: quantité_déjà_retournée }

  const [formData, setFormData] = useState({
    client: '',
    sale: '',
    type: 'refund',
    reason: '',
    notes: '',
    restore_stock: true,
    lignes: []
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
        const data = response.data;
        setClients(Array.isArray(data) ? data : (data.results || []));
      } catch (error) {
        console.error('Erreur chargement clients:', error);
      }
    };
    fetchClients();
  }, []);

  // ============================================================
  // CHARGEMENT DES VENTES DU CLIENT
  // ============================================================
  useEffect(() => {
    if (!formData.client) {
      setVentes([]);
      setSaleDetails(null);
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
        const data = response.data;
        setVentes(Array.isArray(data) ? data : (data.results || []));
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
  // CHARGEMENT DES DÉTAILS DE LA VENTE + AVOIRS EXISTANTS
  // ============================================================
  useEffect(() => {
    if (!formData.sale) {
      setSaleDetails(null);
      setExistingAvoirs({});
      return;
    }

    const fetchSaleDetails = async () => {
      try {
        const token = getToken();

        // 1. Récupérer les détails de la vente
        const saleResponse = await AxiosInstance.get(
          `/sales/${formData.sale}/`,
          { headers: { 'Authorization': `Token ${token}` } }
        );
        const sale = saleResponse.data;
        setSaleDetails(sale);

        // 2. Récupérer les avoirs existants pour cette vente
        const avoirsResponse = await AxiosInstance.get(
          `/avoirs/?sale=${formData.sale}`,
          { headers: { 'Authorization': `Token ${token}` } }
        );
        const avoirsData = avoirsResponse.data;
        const avoirsList = Array.isArray(avoirsData)
          ? avoirsData
          : (avoirsData.results || []);

        // 3. Calculer les quantités déjà retournées par ligne de vente
        const dejaRetournes = {};
        for (const avoir of avoirsList) {
          if (avoir.lignes && Array.isArray(avoir.lignes)) {
            for (const ligne of avoir.lignes) {
              if (ligne.ligne_vente) {
                const key = ligne.ligne_vente;
                dejaRetournes[key] = (dejaRetournes[key] || 0) +
                  parseFloat(ligne.quantity || 0);
              }
            }
          }
        }
        setExistingAvoirs(dejaRetournes);

        // 4. Initialiser les lignes avec quantité 0
        const initialLignes = (sale.lines || []).map(line => {
          const dejaRetourne = dejaRetournes[line.id] || 0;
          const restant = line.quantity - dejaRetourne;

          return {
            product: line.product,
            product_name: line.product_name || line.product?.name || 'Produit',
            product_code: line.product_code || line.product?.code || '',
            ligne_vente: line.id,
            quantity_sold: parseFloat(line.quantity) || 0,
            quantity_already_returned: dejaRetourne,
            quantity_remaining: restant,
            quantity: 0,
            unit_price: parseFloat(line.unit_price) || 0,
            discount: parseFloat(line.discount) || 0,
            selected: false,
            max_returnable: restant,
          };
        });

        setFormData(prev => ({ ...prev, lignes: initialLignes }));
      } catch (error) {
        console.error('Erreur chargement détails vente:', error);
        showNotification('Impossible de charger les détails de la vente', 'error');
      }
    };

    fetchSaleDetails();
  }, [formData.sale]);

  // ============================================================
  // CHARGEMENT EN MODE ÉDITION
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
            reason: data.reason || '',
            notes: data.notes || '',
            restore_stock: false,
            lignes: []
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
  // CALCULS
  // ============================================================
  const lignesSelectionnees = useMemo(
    () => formData.lignes.filter(l => l.selected && l.quantity > 0),
    [formData.lignes]
  );

  const totalRetour = useMemo(() => {
    return lignesSelectionnees.reduce((sum, l) => {
      const lineTotal = (l.quantity * l.unit_price);
      const lineDiscount = l.quantity_sold > 0
        ? (l.discount * l.quantity / l.quantity_sold)
        : 0;
      return sum + (lineTotal - lineDiscount);
    }, 0);
  }, [lignesSelectionnees]);

  const nombreProduits = lignesSelectionnees.length;
  const quantiteTotale = lignesSelectionnees.reduce((s, l) => s + l.quantity, 0);

  // ============================================================
  // GESTION DES LIGNES
  // ============================================================
  const toggleLineSelection = (index) => {
    const newLignes = [...formData.lignes];
    const ligne = newLignes[index];

    // Ne pas permettre la sélection si rien à retourner
    if (!ligne.selected && ligne.max_returnable <= 0) {
      showNotification(
        `Aucune quantité restante à retourner pour ${ligne.product_name}`,
        'warning'
      );
      return;
    }

    ligne.selected = !ligne.selected;
    if (!ligne.selected) {
      ligne.quantity = 0;
    } else if (ligne.quantity === 0) {
      ligne.quantity = Math.min(1, ligne.max_returnable);
    }

    setFormData({ ...formData, lignes: newLignes });
  };

  const updateLineQuantity = (index, value) => {
    const newLignes = [...formData.lignes];
    let qty = parseFloat(value) || 0;

    if (qty < 0) qty = 0;
    if (qty > newLignes[index].max_returnable) {
      qty = newLignes[index].max_returnable;
      showNotification(
        `Maximum retournable : ${newLignes[index].max_returnable}`,
        'warning'
      );
    }

    newLignes[index].quantity = qty;
    newLignes[index].selected = qty > 0;
    setFormData({ ...formData, lignes: newLignes });
  };

  const selectAll = () => {
    const newLignes = formData.lignes.map(l => ({
      ...l,
      selected: l.max_returnable > 0,
      quantity: l.max_returnable > 0
        ? (l.quantity > 0 ? l.quantity : l.max_returnable)
        : 0
    }));
    setFormData({ ...formData, lignes: newLignes });
  };

  const deselectAll = () => {
    const newLignes = formData.lignes.map(l => ({
      ...l,
      selected: false,
      quantity: 0
    }));
    setFormData({ ...formData, lignes: newLignes });
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    // ---- VALIDATIONS ----
    if (!formData.client) {
      showNotification('Veuillez sélectionner un client', 'error');
      return;
    }

    if (!formData.sale) {
      showNotification('Veuillez sélectionner une vente', 'error');
      return;
    }

    if (!formData.reason.trim()) {
      showNotification('La raison est obligatoire', 'error');
      return;
    }

    const lignesValides = formData.lignes.filter(
      l => l.selected && l.quantity > 0
    );

    if (lignesValides.length === 0) {
      showNotification('Sélectionnez au moins un produit à retourner', 'error');
      return;
    }

    // Vérification finale : aucune quantité ne dépasse le max
    for (const ligne of lignesValides) {
      if (ligne.quantity > ligne.max_returnable) {
        showNotification(
          `Quantité trop élevée pour ${ligne.product_name} (max: ${ligne.max_returnable})`,
          'error'
        );
        return;
      }
    }

    setSaving(true);
    try {
      const token = getToken();

      const dataToSend = {
        client: parseInt(formData.client),
        sale: parseInt(formData.sale),
        type: formData.type,
        reason: formData.reason.trim(),
        notes: formData.notes.trim() || '',
        restore_stock: formData.restore_stock,
        lignes: lignesValides.map(l => ({
          product: l.product,
          ligne_vente: l.ligne_vente,
          quantity: l.quantity,
          unit_price: l.unit_price,
          discount: l.quantity_sold > 0
            ? (l.discount * l.quantity / l.quantity_sold)
            : 0,
        }))
      };

      console.log('📤 Envoi:', dataToSend);

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
        const avoirId = response.data?.avoir?.id || response.data?.id || id;
        navigate(`/retours-clients/${avoirId}`);
      }, 1500);

    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      let errorMessage = 'Erreur lors de la sauvegarde';

      if (error.response?.data) {
        const data = error.response.data;
        if (data.lignes) {
          errorMessage = Array.isArray(data.lignes) ? data.lignes[0] : data.lignes;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'object') {
          const firstError = Object.values(data).flat()[0];
          if (firstError) errorMessage = String(firstError);
        }
      }

      showNotification(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return `${num.toLocaleString('fr-FR')} FCFA`;
  };

  // ============================================================
  // RENDU CONDITIONNEL
  // ============================================================
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

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* ==================== NOTIFICATION ==================== */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown max-w-md w-full">
          <div className={`alert ${
            notification.type === 'success' ? 'alert-success' :
            notification.type === 'warning' ? 'alert-warning' :
            'alert-error'
          } shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' && <CheckCircle className="w-4 h-4" />}
              {notification.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
              {notification.type === 'error' && <AlertCircle className="w-4 h-4" />}
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

      {/* ==================== HEADER ==================== */}
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
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {isEdit ? 'Modifier le retour' : 'Nouveau retour client'}
                </h1>
                <p className="text-xs text-gray-500">
                  Sélectionnez les produits et quantités à retourner
                </p>
              </div>
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

        {/* ==================== INFORMATIONS GÉNÉRALES ==================== */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-warning" /> Informations générales
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  sale: '',
                  lignes: []
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

            {/* Vente */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Vente <span className="text-error">*</span>
                </span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.sale}
                onChange={(e) => setFormData({ ...formData, sale: e.target.value })}
                disabled={!formData.client || loadingVentes}
                required
              >
                <option value="">Sélectionner une vente</option>
                {loadingVentes && <option disabled>Chargement...</option>}
                {ventes.map(vente => (
                  <option key={vente.id} value={vente.id}>
                    {vente.invoice_number} - {formatCurrency(vente.total)}
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Type <span className="text-error">*</span>
                </span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="refund">💸 Remboursement</option>
                <option value="return">📦 Retour marchandise</option>
                <option value="discount">🏷️ Remise</option>
                <option value="error">⚠️ Erreur facturation</option>
              </select>
            </div>

            {/* Restauration stock */}
            {(formData.type === 'refund' || formData.type === 'return') && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Option</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-warning/5 rounded-lg border border-warning/20">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-warning checkbox-sm"
                    checked={formData.restore_stock}
                    onChange={(e) => setFormData({
                      ...formData,
                      restore_stock: e.target.checked
                    })}
                  />
                  <span className="text-xs">
                    📦 Restaurer le stock
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Raison */}
          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text font-medium">
                Raison du retour <span className="text-error">*</span>
              </span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows="2"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ex: Produit défectueux, erreur de facturation, geste commercial..."
              required
            />
          </div>

          {/* Notes */}
          <div className="form-control mt-3">
            <label className="label">
              <span className="label-text font-medium">Notes internes</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes pour usage interne (optionnel)"
            />
          </div>
        </div>

        {/* ==================== SÉLECTION DES PRODUITS ==================== */}
        {saleDetails && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-warning" />
                Produits à retourner
                {nombreProduits > 0 && (
                  <span className="badge badge-warning badge-sm">
                    {nombreProduits} produit(s)
                  </span>
                )}
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="btn btn-outline btn-xs gap-1"
                  disabled={formData.lignes.every(l => l.max_returnable <= 0)}
                >
                  <CheckSquare className="w-3 h-3" /> Tout sélectionner
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="btn btn-outline btn-xs gap-1"
                  disabled={nombreProduits === 0}
                >
                  <Square className="w-3 h-3" /> Tout désélectionner
                </button>
              </div>
            </div>

            {/* Info vente */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <span>
                  <strong>Facture :</strong> {saleDetails.invoice_number}
                </span>
                <span>
                  <strong>Date :</strong>{' '}
                  {new Date(saleDetails.sale_date).toLocaleDateString('fr-FR')}
                </span>
                <span>
                  <strong>Total vente :</strong>{' '}
                  <span className="font-semibold text-primary">
                    {formatCurrency(saleDetails.total)}
                  </span>
                </span>
                <span>
                  <strong>Statut :</strong>{' '}
                  <span className="badge badge-info badge-sm">
                    {saleDetails.status_display || saleDetails.status}
                  </span>
                </span>
              </div>
            </div>

            {/* Info dépassement */}
            {Object.keys(existingAvoirs).length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-800">
                  Certains produits ont déjà fait l'objet de retours antérieurs.
                  La quantité maximum retournable est ajustée automatiquement.
                </p>
              </div>
            )}

            {/* Tableau des produits */}
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12"></th>
                    <th>Produit</th>
                    <th className="text-center">Vendu</th>
                    <th className="text-center">Déjà retourné</th>
                    <th className="text-center">Max retournable</th>
                    <th className="text-center">Qté à retourner</th>
                    <th className="text-right">Prix unit.</th>
                    <th className="text-right">Sous-total</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.lignes.map((ligne, index) => {
                    const sousTotal = ligne.quantity * ligne.unit_price;
                    const dejaRetourne = ligne.quantity_already_returned || 0;
                    const max = ligne.max_returnable;
                    const epuise = max <= 0;

                    return (
                      <tr
                        key={index}
                        className={`border-b hover:bg-gray-50 transition-colors ${
                          epuise ? 'opacity-50' : ''
                        } ${ligne.selected ? 'bg-warning/5' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-warning checkbox-sm"
                            checked={ligne.selected}
                            onChange={() => toggleLineSelection(index)}
                            disabled={epuise}
                          />
                        </td>

                        {/* Produit */}
                        <td>
                          <p className="font-medium text-sm">{ligne.product_name}</p>
                          {ligne.product_code && (
                            <p className="text-xs text-gray-400">{ligne.product_code}</p>
                          )}
                        </td>

                        {/* Vendu */}
                        <td className="text-center text-sm">
                          {ligne.quantity_sold}
                        </td>

                        {/* Déjà retourné */}
                        <td className="text-center">
                          {dejaRetourne > 0 ? (
                            <span className="badge badge-error badge-sm">
                              {dejaRetourne}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* Max retournable */}
                        <td className="text-center">
                          {epuise ? (
                            <span className="badge badge-ghost badge-sm">
                              Épuisé
                            </span>
                          ) : (
                            <span className="badge badge-success badge-sm">
                              {max}
                            </span>
                          )}
                        </td>

                        {/* Quantité à retourner */}
                        <td className="text-center">
                          <input
                            type="number"
                            className="input input-bordered input-sm w-20 text-center"
                            value={ligne.quantity || 0}
                            onChange={(e) => updateLineQuantity(index, e.target.value)}
                            min="0"
                            max={max}
                            step="1"
                            disabled={!ligne.selected || epuise}
                          />
                        </td>

                        {/* Prix unitaire */}
                        <td className="text-right text-sm">
                          {formatCurrency(ligne.unit_price)}
                        </td>

                        {/* Sous-total */}
                        <td className="text-right font-semibold text-sm">
                          {ligne.quantity > 0 ? (
                            <span className="text-warning">
                              {formatCurrency(sousTotal)}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {formData.lignes.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-gray-400">
                        Aucun produit dans cette vente
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ==================== RÉCAPITULATIF ==================== */}
            {nombreProduits > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-warning/10 to-warning/5 rounded-xl border border-warning/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-warning">
                  <Calculator className="w-4 h-4" />
                  Récapitulatif du retour
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Produits sélectionnés</p>
                    <p className="font-bold text-lg text-warning">{nombreProduits}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Quantité totale</p>
                    <p className="font-bold text-lg text-warning">{quantiteTotale}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Type</p>
                    <p className="font-bold text-sm">
                      {formData.type === 'refund' ? '💸 Remboursement' :
                       formData.type === 'return' ? '📦 Retour' :
                       formData.type === 'discount' ? '🏷️ Remise' : '⚠️ Erreur'}
                    </p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-gray-500">Montant total</p>
                    <p className="font-bold text-xl text-error">
                      {formatCurrency(totalRetour)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== ACTIONS ==================== */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/retours-clients')}
            className="btn btn-ghost"
            disabled={saving}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-warning gap-2"
            disabled={saving || nombreProduits === 0}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Enregistrement...' : `Enregistrer le retour (${formatCurrency(totalRetour)})`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RetourClientForm;