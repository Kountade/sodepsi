// src/components/achats/PurchaseReturnForm.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, CheckCircle, AlertCircle, Package,
  Search, Truck, Info, Loader2, Building2, FileText, Warehouse
} from 'lucide-react';

const PurchaseReturnForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const receiptIdParam = searchParams.get('receipt');
  const poIdParam = searchParams.get('purchase_order');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptLines, setReceiptLines] = useState([]);
  const [returnLines, setReturnLines] = useState([]);
  const [searchReceipt, setSearchReceipt] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const [formData, setFormData] = useState({
    receipt: receiptIdParam || '',
    purchase_order: poIdParam || '',
    reason: 'defective',
    notes: ''
  });

  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 5000);
  }, []);

  const getToken = () => localStorage.getItem('Token');

  // ─── Sélection d'une réception ───────────────────────────────
  const handleReceiptSelect = useCallback(async (receipt) => {
    console.log('📥 Réception sélectionnée:', receipt);

    setSelectedReceipt(receipt);

    const poId = receipt.purchase_order_id || receipt.purchase_order;
    console.log('🔗 Purchase Order ID:', poId);

    setFormData(prev => ({
      ...prev,
      receipt: receipt.id,
      purchase_order: poId
    }));

    try {
      const token = getToken();
      const response = await AxiosInstance.get(
        `/receipts/${receipt.id}/`,
        { headers: { 'Authorization': `Token ${token}` } }
      );
      const lines = response.data.lines || [];
      setReceiptLines(lines);

      setReturnLines(
        lines.map(line => ({
          receipt_line: line.id,
          product: line.product,
          product_name: line.product_name,
          product_code: line.product_code,
          quantity_ordered: line.quantity_ordered,
          quantity_received: line.quantity_received,
          quantity_damaged: line.quantity_damaged || 0,
          quantity: 0,
          unit_price: parseFloat(line.po_line_unit_price || 0),
          max_quantity: line.quantity_received
        }))
      );
    } catch (error) {
      console.error('Erreur lignes:', error);
      showNotification('Erreur de chargement des lignes', 'error');
    }
  }, [showNotification]);

  // ─── Chargement des réceptions disponibles ───────────────────
  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const token = getToken();
        const response = await AxiosInstance.get(
          '/receipts/?status=completed&is_invoiced=false',
          { headers: { 'Authorization': `Token ${token}` } }
        );

        console.log('📋 Réceptions chargées:', response.data.length);
        setReceipts(response.data);

        if (receiptIdParam) {
          const found = response.data.find(r => r.id === parseInt(receiptIdParam));
          if (found) await handleReceiptSelect(found);
        }
      } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur de chargement des réceptions', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, [receiptIdParam, handleReceiptSelect, showNotification]);

  // ─── Gestion des quantités / prix ───────────────────────────
  const handleQuantityChange = (index, value) => {
    const qty = Math.max(
      0,
      Math.min(parseInt(value) || 0, returnLines[index].max_quantity)
    );
    const updated = [...returnLines];
    updated[index].quantity = qty;
    setReturnLines(updated);
  };

  const handlePriceChange = (index, value) => {
    const updated = [...returnLines];
    updated[index].unit_price = parseFloat(value) || 0;
    setReturnLines(updated);
  };

  const calculateTotal = () =>
    returnLines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);

  // ─── Soumission ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.receipt) {
      showNotification('Veuillez sélectionner une réception', 'error');
      return;
    }

    if (!formData.purchase_order) {
      showNotification('Erreur : la réception n\'a pas de commande associée', 'error');
      console.error('❌ purchase_order manquant. Réception:', selectedReceipt);
      return;
    }

    const validLines = returnLines.filter(l => l.quantity > 0);
    if (validLines.length === 0) {
      showNotification('Veuillez saisir au moins une quantité à retourner', 'error');
      return;
    }

    setSaving(true);
    try {
      const token = getToken();

      const payload = {
        purchase_order: parseInt(formData.purchase_order),
        receipt: parseInt(formData.receipt),
        reason: formData.reason,
        notes: formData.notes || '',
        lines: validLines.map(l => ({
          receipt_line: parseInt(l.receipt_line),
          quantity: parseInt(l.quantity)
        }))
      };

      console.log('═══════════════════════════════════');
      console.log('📤 PAYLOAD ENVOYÉ:');
      console.log(JSON.stringify(payload, null, 2));
      console.log('═══════════════════════════════════');

      const response = await AxiosInstance.post('/purchase-returns/', payload, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ RÉPONSE:', response.data);
      showNotification('✅ Retour créé avec succès', 'success');
      setTimeout(() => navigate(`/retours-fournisseurs/${response.data.id}`), 1200);

    } catch (error) {
      console.error('═══════════════════════════════════');
      console.error('❌ ERREUR CRÉATION RETOUR');
      console.error('Status:', error.response?.status);
      console.error('Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('═══════════════════════════════════');

      const errData = error.response?.data;
      let msg = 'Erreur lors de la création du retour';

      if (typeof errData === 'string') {
        msg = errData;
      } else if (errData?.detail) {
        msg = errData.detail;
      } else if (errData && typeof errData === 'object') {
        const allErrors = [];
        Object.entries(errData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            allErrors.push(`${key}: ${value.join(', ')}`);
          } else if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([k2, v2]) => {
              allErrors.push(`${k2}: ${Array.isArray(v2) ? v2.join(', ') : v2}`);
            });
          } else {
            allErrors.push(`${key}: ${value}`);
          }
        });
        msg = allErrors.join(' | ') || msg;
      }

      showNotification(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Filtre des réceptions ──────────────────────────────────
  const filteredReceipts = receipts.filter(r =>
    !searchReceipt ||
    r.receipt_number?.toLowerCase().includes(searchReceipt.toLowerCase()) ||
    r.supplier_name?.toLowerCase().includes(searchReceipt.toLowerCase()) ||
    r.po_number?.toLowerCase().includes(searchReceipt.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-base font-semibold text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Truck className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Nouveau retour fournisseur
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Créer une demande de retour de marchandise
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/retours-fournisseurs')}
            className="btn btn-outline gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Section 1 : Informations générales */}
        <div className="bg-white rounded-xl shadow-md p-5 space-y-4">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" /> Informations générales
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Réception *</span>
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une réception..."
                  className="input input-bordered w-full pl-9 input-sm"
                  value={searchReceipt}
                  onChange={(e) => setSearchReceipt(e.target.value)}
                />
              </div>
              <select
                className="select select-bordered w-full"
                value={formData.receipt}
                onChange={(e) => {
                  const r = receipts.find(x => x.id === parseInt(e.target.value));
                  if (r) handleReceiptSelect(r);
                }}
                required
              >
                <option value="">-- Sélectionner une réception --</option>
                {filteredReceipts.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.receipt_number} — {r.supplier_name} (
                    {new Date(r.receipt_date).toLocaleDateString('fr-FR')})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Raison du retour *</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
              >
                <option value="defective">Produit défectueux</option>
                <option value="wrong_product">Produit incorrect</option>
                <option value="expired">Produit expiré</option>
                <option value="damaged">Produit endommagé</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          {/* ✅ BLOC INFO : fond blanc, texte NOIR, bordures bleues */}
          {selectedReceipt && (
            <div className="rounded-xl border-2 border-blue-500 overflow-hidden bg-white">
              {/* Header bleu (texte blanc autorisé car fond foncé) */}
              <div className="bg-blue-600 px-4 py-2">
                <p className="text-white font-bold text-sm uppercase tracking-wide">
                  Détails de la réception sélectionnée
                </p>
              </div>

              {/* Contenu : FOND BLANC + TEXTE NOIR */}
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">

                {/* Commande */}
                <div className="p-4 flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Commande
                    </p>
                    <p className="text-base font-black text-black font-mono truncate">
                      {selectedReceipt.po_number || '—'}
                    </p>
                  </div>
                </div>

                {/* Fournisseur */}
                <div className="p-4 flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Fournisseur
                    </p>
                    <p className="text-base font-black text-black truncate">
                      {selectedReceipt.supplier_name || '—'}
                    </p>
                  </div>
                </div>

                {/* Entrepôt */}
                <div className="p-4 flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Warehouse className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Entrepôt
                    </p>
                    <p className="text-base font-black text-black truncate">
                      {selectedReceipt.warehouse_name || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pied : ID commande */}
              {formData.purchase_order && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
                  <p className="text-xs text-gray-600">
                    ID Commande interne :{' '}
                    <span className="font-mono font-bold text-black">
                      {formData.purchase_order}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Notes</span>
            </label>
            <textarea
              className="textarea textarea-bordered"
              rows="3"
              placeholder="Détails supplémentaires sur le retour..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        {/* Section 2 : Lignes à retourner */}
        {selectedReceipt && receiptLines.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-5 space-y-4">
            <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Produits à retourner
            </h2>

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th>Produit</th>
                    <th className="text-center">Qté reçue</th>
                    <th className="text-center">Qté endommagée</th>
                    <th className="text-center w-32">Qté à retourner</th>
                    <th className="text-center w-32">Prix unitaire</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {returnLines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td>
                        <div className="font-semibold">{line.product_name}</div>
                        <div className="text-xs text-gray-500 font-mono">
                          {line.product_code}
                        </div>
                      </td>
                      <td className="text-center font-semibold">
                        {line.quantity_received}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${line.quantity_damaged > 0 ? 'badge-error' : 'badge-ghost'}`}>
                          {line.quantity_damaged}
                        </span>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max={line.max_quantity}
                          className="input input-bordered input-sm w-full text-center"
                          value={line.quantity}
                          onChange={(e) => handleQuantityChange(idx, e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input input-bordered input-sm w-full text-right"
                          value={line.unit_price}
                          onChange={(e) => handlePriceChange(idx, e.target.value)}
                        />
                      </td>
                      <td className="text-right font-bold">
                        {(line.quantity * line.unit_price).toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="5" className="text-right font-bold text-lg">
                      TOTAL À RETOURNER
                    </td>
                    <td className="text-right font-black text-primary text-lg">
                      {calculateTotal().toLocaleString('fr-FR')} FCFA
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/retours-fournisseurs')}
            className="btn btn-outline gap-2"
            disabled={saving}
          >
            <X className="w-4 h-4" /> Annuler
          </button>
          <button
            type="submit"
            className="btn bg-gradient-to-r from-primary to-primary/80 text-white border-none gap-2 shadow-lg"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Créer le retour
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseReturnForm;