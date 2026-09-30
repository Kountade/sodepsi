// src/components/station/VentePompeModal.jsx
import React, { useState } from 'react';
import AxiosInstance from '../AxiosInstance';
import { X, Plus, TrendingUp, AlertCircle } from 'lucide-react';

const VentePompeModal = ({ pompe, onClose, onSuccess }) => {
  const [quantite, setQuantite] = useState('');
  const [montant, setMontant] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(parseFloat(n || 0));

  // Calcul auto du montant
  const handleQuantiteChange = (val) => {
    setQuantite(val);
    if (val && pompe.prix_litre) {
      const calc = parseFloat(val) * parseFloat(pompe.prix_litre);
      setMontant(calc.toFixed(2));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('Token');
      await AxiosInstance.post(
        `/pompes/${pompe.id}/enregistrer-vente/`,
        {
          quantite: parseFloat(quantite),
          montant: parseFloat(montant),
          reference,
          notes,
        },
        { headers: { Authorization: `Token ${token}` } }
      );
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <h3 className="font-bold text-lg">Vente sur {pompe.nom}</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-base-200 rounded-lg p-3 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Prix au litre</span>
            <span className="font-bold">{formatNumber(pompe.prix_litre)} FCFA</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-500">Cuve</span>
            <span className="font-medium">{pompe.cuve_details?.nom || 'N/A'}</span>
          </div>
          {pompe.cuve_details && (
            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Stock cuve</span>
              <span className="font-medium">
                {formatNumber(pompe.cuve_details.niveau_actuel)} L
              </span>
            </div>
          )}
        </div>

        {error && <div className="alert alert-error mb-3 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="form-control">
            <label className="label"><span className="label-text font-semibold">Quantité (L) *</span></label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="input input-bordered input-lg text-lg font-bold"
              value={quantite}
              onChange={(e) => handleQuantiteChange(e.target.value)}
              placeholder="Ex: 20"
              required
              autoFocus
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-semibold">Montant (FCFA) *</span></label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input input-bordered"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              required
            />
            <span className="text-xs text-gray-500 mt-1">
              Calculé automatiquement (modifiable)
            </span>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-semibold">Référence</span></label>
            <input
              type="text"
              className="input input-bordered"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="N° ticket, plaque, etc."
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text font-semibold">Notes</span></label>
            <textarea
              className="textarea textarea-bordered"
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={onClose} className="btn btn-ghost">Annuler</button>
            <button type="submit" disabled={loading} className="btn btn-success gap-2">
              {loading ? <span className="loading loading-spinner loading-sm"></span> : <Plus className="w-4 h-4" />}
              Enregistrer la vente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VentePompeModal;