// src/pages/inventaires/InventaireForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, X, ClipboardList, Warehouse, Calendar,
  FileText, Info, AlertCircle, CheckCircle,
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const InventaireForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const token = localStorage.getItem('Token');
  const authHeaders = { Authorization: `Token ${token}` };

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    warehouse: '',
    start_date: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  // ============================================================
  // CHARGEMENT
  // ============================================================
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const wsRes = await AxiosInstance.get('/warehouses/', {
          headers: authHeaders,
          params: { active: true },
        });
        setWarehouses(wsRes.data || []);

        if (isEditMode) {
          const invRes = await AxiosInstance.get(`/inventories/${id}/`, {
            headers: authHeaders,
          });
          const current = invRes.data;
          setFormData({
            name: current.name || '',
            description: current.description || '',
            warehouse: current.warehouse || '',
            start_date: current.start_date
              ? new Date(current.start_date).toISOString().slice(0, 16)
              : new Date().toISOString().slice(0, 16),
            notes: current.notes || '',
          });
        }
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ============================================================
  // SOUMISSION
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.name.trim()) {
      setError("Le nom de l'inventaire est obligatoire");
      return;
    }
    if (!formData.warehouse) {
      setError('Veuillez sélectionner un entrepôt');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        warehouse: parseInt(formData.warehouse),
        start_date: new Date(formData.start_date).toISOString(),
        notes: formData.notes,
      };

      let response;
      if (isEditMode) {
        response = await AxiosInstance.put(
          `/inventories/${id}/`,
          payload,
          { headers: authHeaders }
        );
      } else {
        response = await AxiosInstance.post('/inventories/', payload, {
          headers: authHeaders,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(`/inventaires/${response.data.id}`);
      }, 1200);
    } catch (err) {
      console.error(err);
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const messages = Object.values(data).flat().join(' • ');
        setError(messages || 'Erreur lors de la sauvegarde');
      } else {
        setError('Erreur lors de la sauvegarde');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <Link
          to={isEditMode ? `/inventaires/${id}` : '/inventaires'}
          className="text-sm text-base-content/60 hover:text-primary inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          {isEditMode ? "Retour à l'inventaire" : 'Retour aux inventaires'}
        </Link>
        <h1 className="text-2xl font-bold mt-2 flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-primary" />
          {isEditMode ? "Modifier l'inventaire" : 'Nouvel inventaire'}
        </h1>
        <p className="text-base-content/60 text-sm mt-1">
          {isEditMode
            ? 'Modifiez les informations de cet inventaire'
            : "Créez une session d'inventaire physique"}
        </p>
      </div>

      {/* Messages */}
      {success && (
        <div className="alert alert-success shadow-lg mb-6">
          <CheckCircle className="w-5 h-5" />
          <span>
            {isEditMode ? 'Inventaire modifié !' : 'Inventaire créé !'}{' '}
            Redirection...
          </span>
        </div>
      )}
      {error && (
        <div className="alert alert-error shadow-lg mb-6">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom */}
            <div className="form-control w-full md:col-span-2">
              <label className="label">
                <span className="label-text font-medium">
                  Nom <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Inventaire mensuel Décembre 2025"
                className="input input-bordered w-full"
                required
              />
            </div>

            {/* Entrepôt */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Warehouse className="w-4 h-4" />
                  Entrepôt <span className="text-error">*</span>
                </span>
              </label>
              <select
                name="warehouse"
                value={formData.warehouse}
                onChange={handleChange}
                className="select select-bordered w-full"
                required
                disabled={isEditMode}
              >
                <option value="">Sélectionner un entrepôt</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
              {isEditMode && (
                <label className="label">
                  <span className="label-text-alt text-info">
                    L'entrepôt ne peut pas être modifié
                  </span>
                </label>
              )}
            </div>

            {/* Date */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date de début <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="datetime-local"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
              />
            </div>

            {/* Description */}
            <div className="form-control w-full md:col-span-2">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Description de l'inventaire..."
                className="textarea textarea-bordered w-full resize-none"
              />
            </div>

            {/* Notes */}
            <div className="form-control w-full md:col-span-2">
              <label className="label">
                <span className="label-text font-medium">Notes internes</span>
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                placeholder="Notes complémentaires..."
                className="textarea textarea-bordered w-full resize-none"
              />
            </div>
          </div>

          {/* Info */}
          <div className="alert alert-info mt-4">
            <Info className="w-5 h-5" />
            <span className="text-sm">
              Après création, cliquez sur <b>Démarrer</b> dans le détail pour
              générer automatiquement les lignes à partir des stocks actuels.
            </span>
          </div>

          {/* Actions */}
          <div className="card-actions justify-end mt-4 pt-4 border-t">
            <Link
              to={isEditMode ? `/inventaires/${id}` : '/inventaires'}
              className="btn btn-ghost gap-1"
            >
              <X className="w-4 h-4" /> Annuler
            </Link>
            <button
              type="submit"
              className="btn btn-primary gap-2 min-w-[160px]"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? 'Enregistrer' : "Créer l'inventaire"}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InventaireForm;