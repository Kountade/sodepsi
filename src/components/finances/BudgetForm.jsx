// src/components/finances/BudgetForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Loader2, AlertCircle,
  CheckCircle, PiggyBank, Calendar, DollarSign,
  Plus, Trash2, FileText, Tag
} from 'lucide-react';

const BudgetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [totalLignes, setTotalLignes] = useState(0);

  const [formData, setFormData] = useState({
    nom: '',
    type: 'annuel',
    montant_total: '',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: '',
    statut: 'en_cours',
    notes: ''
  });

  const getToken = () => localStorage.getItem('Token');

  const fetchCategories = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/budget-categories/?is_active=true', {
        headers: { 'Authorization': `Token ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  const fetchBudget = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/budgets/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        nom: data.nom || '',
        type: data.type || 'annuel',
        montant_total: data.montant_total || '',
        date_debut: data.date_debut || '',
        date_fin: data.date_fin || '',
        statut: data.statut || 'en_cours',
        notes: data.notes || ''
      });
      
      if (data.lignes) {
        setLignes(data.lignes.map(l => ({
          id: l.id,
          categorie: l.categorie || '',
          categorie_nom: l.categorie_nom || '',
          montant_prevu: l.montant_prevu || '',
          montant_utilise: l.montant_utilise || 0,
          montant_restant: l.montant_restant || 0,
          notes: l.notes || ''
        })));
        setTotalLignes(data.lignes.reduce((sum, l) => sum + (l.montant_prevu || 0), 0));
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement du budget');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchBudget();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLigneChange = (index, field, value) => {
    const newLignes = [...lignes];
    newLignes[index][field] = value;
    
    if (field === 'categorie') {
      const cat = categories.find(c => c.id === parseInt(value));
      newLignes[index].categorie_nom = cat ? cat.nom : '';
    }
    
    setLignes(newLignes);
    updateTotalLignes(newLignes);
  };

  const addLigne = () => {
    setLignes([...lignes, {
      categorie: '',
      categorie_nom: '',
      montant_prevu: '',
      montant_utilise: 0,
      montant_restant: 0,
      notes: ''
    }]);
  };

  const removeLigne = (index) => {
    const newLignes = lignes.filter((_, i) => i !== index);
    setLignes(newLignes);
    updateTotalLignes(newLignes);
  };

  const updateTotalLignes = (newLignes) => {
    const total = newLignes.reduce((sum, l) => sum + (parseFloat(l.montant_prevu) || 0), 0);
    setTotalLignes(total);
    setFormData(prev => ({ ...prev, montant_total: total }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const token = getToken();
      
      // Valider que le montant total correspond à la somme des lignes
      if (Math.abs(totalLignes - parseFloat(formData.montant_total || 0)) > 0.01) {
        setError('Le montant total ne correspond pas à la somme des lignes');
        setSaving(false);
        return;
      }

      const dataToSend = {
        ...formData,
        montant_total: parseFloat(formData.montant_total) || 0,
        lignes: lignes.map(l => ({
          categorie: parseInt(l.categorie),
          montant_prevu: parseFloat(l.montant_prevu) || 0,
          notes: l.notes || ''
        }))
      };

      let response;
      if (id) {
        response = await AxiosInstance.put(`/budgets/${id}/`, dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      } else {
        response = await AxiosInstance.post('/budgets/', dataToSend, {
          headers: { 'Authorization': `Token ${token}` }
        });
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/budgets');
      }, 1500);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.data) {
        const errors = Object.values(error.response.data).flat().join(' ');
        setError(errors || 'Erreur lors de l\'enregistrement');
      } else {
        setError('Erreur lors de l\'enregistrement');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement du budget...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/budgets')}
          className="btn btn-ghost btn-sm btn-circle"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <PiggyBank className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {id ? 'Modifier le budget' : 'Nouveau budget'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-1">
            {id ? `Budget #${id}` : 'Créer un nouveau budget'}
          </p>
        </div>
      </div>

      {/* Notification de succès */}
      {success && (
        <div className="alert alert-success shadow-lg animate-slideDown">
          <CheckCircle className="w-5 h-5" />
          <span>Budget enregistré avec succès !</span>
        </div>
      )}

      {/* Formulaire */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Erreur */}
          {error && (
            <div className="alert alert-error shadow-lg">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
              <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setError(null)}>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Nom du budget *</span>
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Ex: Budget 2024, Projet X..."
                required
              />
            </div>

            {/* Type */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Type *</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="select select-bordered w-full"
                required
              >
                <option value="annuel">Annuel</option>
                <option value="trimestriel">Trimestriel</option>
                <option value="mensuel">Mensuel</option>
                <option value="projet">Projet</option>
              </select>
            </div>

            {/* Date début */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Date début *</span>
              </label>
              <input
                type="date"
                name="date_debut"
                value={formData.date_debut}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>

            {/* Date fin */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Date fin *</span>
              </label>
              <input
                type="date"
                name="date_fin"
                value={formData.date_fin}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>

            {/* Statut */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Statut</span>
              </label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                className="select select-bordered w-full"
              >
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
            </div>

            {/* Montant total (automatique) */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Montant total</span>
              </label>
              <input
                type="number"
                name="montant_total"
                value={formData.montant_total}
                onChange={handleChange}
                className="input input-bordered w-full bg-gray-100"
                placeholder="Calculé automatiquement"
                step="0.01"
                readOnly
              />
              <label className="label">
                <span className="label-text-alt text-gray-400">Calculé à partir des lignes</span>
              </label>
            </div>

            {/* Notes */}
            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text font-medium">Notes</span>
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="textarea textarea-bordered w-full h-20"
                placeholder="Notes supplémentaires..."
              />
            </div>
          </div>

          {/* Lignes de budget */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Lignes de budget
              </h2>
              <button
                type="button"
                onClick={addLigne}
                className="btn btn-primary btn-sm gap-2"
              >
                <Plus className="w-4 h-4" /> Ajouter une ligne
              </button>
            </div>

            {lignes.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Aucune ligne de budget</p>
                <button
                  type="button"
                  onClick={addLigne}
                  className="btn btn-primary btn-sm mt-2 gap-2"
                >
                  <Plus className="w-4 h-4" /> Ajouter une ligne
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {lignes.map((ligne, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-xs text-gray-500">Catégorie *</label>
                      <select
                        value={ligne.categorie}
                        onChange={(e) => handleLigneChange(index, 'categorie', e.target.value)}
                        className="select select-bordered select-sm w-full"
                        required
                      >
                        <option value="">Sélectionner</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.code} - {c.nom}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Montant prévu *</label>
                      <input
                        type="number"
                        value={ligne.montant_prevu}
                        onChange={(e) => handleLigneChange(index, 'montant_prevu', e.target.value)}
                        className="input input-bordered input-sm w-full"
                        placeholder="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Notes</label>
                      <input
                        type="text"
                        value={ligne.notes || ''}
                        onChange={(e) => handleLigneChange(index, 'notes', e.target.value)}
                        className="input input-bordered input-sm w-full"
                        placeholder="Notes..."
                      />
                    </div>
                    <div className="flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => removeLigne(index)}
                        className="btn btn-error btn-sm btn-circle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {lignes.length > 0 && (
              <div className="flex justify-end mt-4 p-3 bg-primary/5 rounded-lg">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total des lignes</p>
                  <p className="text-lg font-bold text-primary">{totalLignes.toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <button
              type="submit"
              className="btn btn-primary gap-2"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Enregistrement...' : id ? 'Mettre à jour' : 'Créer le budget'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/budgets')}
              className="btn btn-ghost gap-2"
            >
              <X className="w-4 h-4" /> Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetForm;