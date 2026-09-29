// src/components/station/RetraitModal.jsx
import React, { useState } from 'react';
import AxiosInstance from '../AxiosInstance';
import { X, Minus, TrendingDown } from 'lucide-react';

const RetraitModal = ({ cuve, onClose, onSuccess }) => {
  const [quantite, setQuantite] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('Token');
      await AxiosInstance.post(
        `/cuves/${cuve.id}/retirer/`,
        { quantite: parseFloat(quantite), reference, notes },
        { headers: { Authorization: `Token ${token}` } }
      );
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du retrait');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-warning/10 rounded-lg">
              <TrendingDown className="w-5 h-5 text-warning" />
            </div>
            <h3 className="font-bold text-lg">Retrait de carburant</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-base-200 rounded-lg p-3 mb-4 text-sm">
          <p><strong>{cuve.nom}</strong> ({cuve.code})</p>
          <p className="text-gray-500">
            Disponible : {formatNumber(cuve.niveau_actuel)} L
          </p>
        </div>

        {error && <div className="alert alert-error mb-3 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="form-control">
            <label className="label"><span className="label-text font-semibold">Quantité (L) *</span></label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={cuve.niveau_actuel}
              className="input input-bordered"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              placeholder="Ex: 50"
              required
            />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text font-semibold">Référence</span></label>
            <input
              type="text"
              className="input input-bordered"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
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
            <button type="submit" disabled={loading} className="btn btn-warning gap-2">
              {loading ? <span className="loading loading-spinner loading-sm"></span> : <Minus className="w-4 h-4" />}
              Retirer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RetraitModal;