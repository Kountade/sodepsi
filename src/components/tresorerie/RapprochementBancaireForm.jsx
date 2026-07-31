// src/components/tresorerie/RapprochementBancaireForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, AlertCircle, CheckCircle, Building2,
  Calendar, DollarSign, FileText, RefreshCw, Plus, Trash2
} from 'lucide-react';

const RapprochementBancaireForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [formData, setFormData] = useState({
    warehouse: '',
    compte_bancaire: '',
    date_debut: '',
    date_fin: '',
    solde_comptable: '',
    solde_bancaire: '',
    encours_emission: '0',
    encours_encaissement: '0',
    commissions: '0',
    autres_ecarts: '0',
    notes: '',
    status: 'brouillon'
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // Charger les entrepôts et comptes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        const [whRes, cptRes] = await Promise.all([
          AxiosInstance.get('/warehouses/?is_active=true', { headers: { 'Authorization': `Token ${token}` } }),
          AxiosInstance.get('/comptes-bancaires/?is_active=true', { headers: { 'Authorization': `Token ${token}` } })
        ]);
        setWarehouses(whRes.data || []);
        setComptes(cptRes.data || []);
      } catch (error) {
        console.error('Erreur chargement données:', error);
        showNotification('Erreur de chargement des données', 'error');
      }
    };
    fetchData();
  }, []);

  // Si édition, charger les données existantes
  useEffect(() => {
    if (isEdit && id) {
      const fetchRapprochement = async () => {
        setLoading(true);
        try {
          const token = getToken();
          const response = await AxiosInstance.get(`/rapprochements/${id}/`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          const data = response.data;
          setFormData({
            warehouse: data.warehouse || '',
            compte_bancaire: data.compte_bancaire || '',
            date_debut: data.date_debut || '',
            date_fin: data.date_fin || '',
            solde_comptable: data.solde_comptable || '',
            solde_bancaire: data.solde_bancaire || '',
            encours_emission: data.encours_emission || '0',
            encours_encaissement: data.encours_encaissement || '0',
            commissions: data.commissions || '0',
            autres_ecarts: data.autres_ecarts || '0',
            notes: data.notes || '',
            status: data.status || 'brouillon'
          });
        } catch (error) {
          console.error('Erreur chargement rapprochement:', error);
          showNotification('Erreur de chargement du rapprochement', 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchRapprochement();
    }
  }, [id, isEdit]);

  // Gestion des changements
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validation
  const validate = () => {
    const newErrors = {};
    if (!formData.warehouse) newErrors.warehouse = 'Veuillez sélectionner un entrepôt';
    if (!formData.compte_bancaire) newErrors.compte_bancaire = 'Veuillez sélectionner un compte bancaire';
    if (!formData.date_debut) newErrors.date_debut = 'La date de début est requise';
    if (!formData.date_fin) newErrors.date_fin = 'La date de fin est requise';
    if (formData.date_debut && formData.date_fin && formData.date_debut > formData.date_fin) {
      newErrors.date_fin = 'La date de fin doit être postérieure à la date de début';
    }
    if (!formData.solde_comptable || parseFloat(formData.solde_comptable) < 0) {
      newErrors.solde_comptable = 'Le solde comptable est requis et doit être ≥ 0';
    }
    if (!formData.solde_bancaire || parseFloat(formData.solde_bancaire) < 0) {
      newErrors.solde_bancaire = 'Le solde bancaire est requis et doit être ≥ 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const token = getToken();
      const url = isEdit ? `/rapprochements/${id}/` : '/rapprochements/';
      const method = isEdit ? 'put' : 'post';
      
      // Préparer les données (convertir en nombres)
      const payload = {
        ...formData,
        solde_comptable: parseFloat(formData.solde_comptable) || 0,
        solde_bancaire: parseFloat(formData.solde_bancaire) || 0,
        encours_emission: parseFloat(formData.encours_emission) || 0,
        encours_encaissement: parseFloat(formData.encours_encaissement) || 0,
        commissions: parseFloat(formData.commissions) || 0,
        autres_ecarts: parseFloat(formData.autres_ecarts) || 0,
      };

      const response = await AxiosInstance[method](url, payload, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification(
        isEdit ? 'Rapprochement mis à jour avec succès' : 'Rapprochement créé avec succès',
        'success'
      );
      setTimeout(() => navigate('/rapprochement-bancaire'), 1500);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      if (error.response && error.response.data) {
        setErrors(error.response.data);
        showNotification('Erreur de validation', 'error');
      } else {
        showNotification('Erreur lors de la sauvegarde', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
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
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                {isEdit ? 'Modifier le rapprochement' : 'Nouveau rapprochement bancaire'}
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              {isEdit ? 'Mettez à jour les informations' : 'Saisissez les informations du rapprochement'}
            </p>
          </div>
          <button onClick={() => navigate('/rapprochement-bancaire')} className="btn btn-sm sm:btn-md btn-outline gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Entrepôt */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Entrepôt *</span>
            </label>
            <select
              name="warehouse"
              className={`select select-bordered w-full ${errors.warehouse ? 'select-error' : ''}`}
              value={formData.warehouse}
              onChange={handleChange}
            >
              <option value="">Sélectionner un entrepôt</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
            {errors.warehouse && <span className="text-error text-xs mt-1">{errors.warehouse}</span>}
          </div>

          {/* Compte bancaire */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Compte bancaire *</span>
            </label>
            <select
              name="compte_bancaire"
              className={`select select-bordered w-full ${errors.compte_bancaire ? 'select-error' : ''}`}
              value={formData.compte_bancaire}
              onChange={handleChange}
            >
              <option value="">Sélectionner un compte</option>
              {comptes.map(c => (
                <option key={c.id} value={c.id}>{c.banque} - {c.nom} ({c.numero_compte})</option>
              ))}
            </select>
            {errors.compte_bancaire && <span className="text-error text-xs mt-1">{errors.compte_bancaire}</span>}
          </div>

          {/* Date début */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Date de début *</span>
            </label>
            <input
              type="date"
              name="date_debut"
              className={`input input-bordered w-full ${errors.date_debut ? 'input-error' : ''}`}
              value={formData.date_debut}
              onChange={handleChange}
            />
            {errors.date_debut && <span className="text-error text-xs mt-1">{errors.date_debut}</span>}
          </div>

          {/* Date fin */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Date de fin *</span>
            </label>
            <input
              type="date"
              name="date_fin"
              className={`input input-bordered w-full ${errors.date_fin ? 'input-error' : ''}`}
              value={formData.date_fin}
              onChange={handleChange}
            />
            {errors.date_fin && <span className="text-error text-xs mt-1">{errors.date_fin}</span>}
          </div>

          {/* Solde comptable */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Solde comptable *</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">FCFA</span>
              <input
                type="number"
                name="solde_comptable"
                step="0.01"
                min="0"
                className={`input input-bordered w-full pl-16 ${errors.solde_comptable ? 'input-error' : ''}`}
                value={formData.solde_comptable}
                onChange={handleChange}
              />
            </div>
            {errors.solde_comptable && <span className="text-error text-xs mt-1">{errors.solde_comptable}</span>}
          </div>

          {/* Solde bancaire */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Solde bancaire *</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">FCFA</span>
              <input
                type="number"
                name="solde_bancaire"
                step="0.01"
                min="0"
                className={`input input-bordered w-full pl-16 ${errors.solde_bancaire ? 'input-error' : ''}`}
                value={formData.solde_bancaire}
                onChange={handleChange}
              />
            </div>
            {errors.solde_bancaire && <span className="text-error text-xs mt-1">{errors.solde_bancaire}</span>}
          </div>

          {/* En-cours émission */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">En-cours d'émission</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">FCFA</span>
              <input
                type="number"
                name="encours_emission"
                step="0.01"
                min="0"
                className="input input-bordered w-full pl-16"
                value={formData.encours_emission}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* En-cours encaissement */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">En-cours d'encaissement</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">FCFA</span>
              <input
                type="number"
                name="encours_encaissement"
                step="0.01"
                min="0"
                className="input input-bordered w-full pl-16"
                value={formData.encours_encaissement}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Commissions */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Commissions bancaires</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">FCFA</span>
              <input
                type="number"
                name="commissions"
                step="0.01"
                min="0"
                className="input input-bordered w-full pl-16"
                value={formData.commissions}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Autres écarts */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Autres écarts</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">FCFA</span>
              <input
                type="number"
                name="autres_ecarts"
                step="0.01"
                min="0"
                className="input input-bordered w-full pl-16"
                value={formData.autres_ecarts}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Statut (seulement en édition, sinon on fixe brouillon) */}
          {isEdit && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Statut</span>
              </label>
              <select
                name="status"
                className="select select-bordered w-full"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="brouillon">Brouillon</option>
                <option value="en_cours">En cours</option>
                <option value="partiel">Partiel</option>
                <option value="complete">Complet</option>
                <option value="ecart">Écart</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div className="form-control md:col-span-2">
            <label className="label">
              <span className="label-text font-medium">Notes</span>
            </label>
            <textarea
              name="notes"
              rows="3"
              className="textarea textarea-bordered w-full"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Informations complémentaires..."
            />
          </div>
        </div>

        {/* Boutons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/rapprochement-bancaire')}
            className="btn btn-ghost gap-2"
          >
            <X className="w-4 h-4" /> Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary gap-2"
            disabled={saving}
          >
            {saving ? <span className="loading loading-spinner loading-sm"></span> : <Save className="w-4 h-4" />}
            {isEdit ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RapprochementBancaireForm;