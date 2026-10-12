// src/pages/inventaires/InventaireForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, X, ClipboardList, Warehouse, Calendar,
  FileText, Info, AlertCircle, CheckCircle,
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// ✅ HELPERS
// ============================================================
const getToken = () => {
  try {
    return localStorage.getItem('Token');
  } catch {
    return null;
  }
};

/** Normalise TOUJOURS en tableau */
const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

/**
 * ✅ Formate une Date en chaîne `datetime-local` (heure LOCALE, pas UTC)
 * Format : "YYYY-MM-DDTHH:mm"
 */
const toLocalDatetimeInput = (dateLike) => {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
};

/**
 * ✅ Convertit une valeur `datetime-local` (heure locale) en ISO UTC
 * pour l'envoyer au backend Django.
 */
const toISOStringFromLocal = (localValue) => {
  if (!localValue) return null;
  // `new Date("2026-01-15T14:30")` est interprété en LOCAL par les navigateurs modernes
  const d = new Date(localValue);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
};

/**
 * ✅ Parse les erreurs DRF de manière robuste et récursive.
 */
const extractErrorMessage = (data) => {
  if (!data) return 'Erreur inconnue';
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return data.map(extractErrorMessage).join(' • ');
  if (typeof data === 'object') {
    return Object.entries(data)
      .map(([key, value]) => {
        const msg = extractErrorMessage(value);
        return key === 'non_field_errors' || key === 'detail'
          ? msg
          : `${key}: ${msg}`;
      })
      .join(' • ');
  }
  return String(data);
};

// ============================================================
// COMPOSANT
// ============================================================
const InventaireForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const token = getToken();

  // ✅ Mémoïsation : évite de recréer les headers à chaque render
  const authHeaders = useMemo(
    () => ({ Authorization: `Token ${token}` }),
    [token]
  );

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    warehouse: '',
    start_date: '', // ✅ Initialisé dans useEffect pour éviter le décalage UTC
    notes: '',
  });

  // ============================================================
  // CHARGEMENT
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      // ✅ Valeur par défaut : maintenant en heure LOCALE
      const now = new Date();
      // ⚠️ On enlève 60s de marge pour éviter "date dans le passé"
      now.setSeconds(0, 0);
      const defaultStart = toLocalDatetimeInput(now);

      try {
        // --- Chargement des entrepôts ---
        const wsRes = await AxiosInstance.get('/warehouses/', {
          headers: authHeaders,
          params: { active: 'true' },
        });
        // ✅ Correction CRITIQUE : normaliser en tableau
        const warehouseList = ensureArray(wsRes.data);

        if (!cancelled) setWarehouses(warehouseList);

        // --- Chargement de l'inventaire en mode édition ---
        if (isEditMode) {
          const invRes = await AxiosInstance.get(`/inventories/${id}/`, {
            headers: authHeaders,
          });
          const current = invRes.data;

          if (!cancelled) {
            setFormData({
              name: current.name || '',
              description: current.description || '',
              warehouse: current.warehouse || '',
              start_date: current.start_date
                ? toLocalDatetimeInput(current.start_date)
                : defaultStart,
              notes: current.notes || '',
            });
          }
        } else {
          if (!cancelled) {
            setFormData((prev) => ({ ...prev, start_date: defaultStart }));
          }
        }
      } catch (err) {
        console.error('❌ Erreur chargement inventaire:', err);
        if (!cancelled) {
          setError(
            err?.response?.status === 404
              ? 'Inventaire introuvable'
              : 'Impossible de charger les données'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id, isEditMode, authHeaders]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // --- Validations ---
    if (!formData.name.trim()) {
      setError("Le nom de l'inventaire est obligatoire");
      return;
    }
    if (!formData.warehouse) {
      setError('Veuillez sélectionner un entrepôt');
      return;
    }
    if (!formData.start_date) {
      setError('La date de début est obligatoire');
      return;
    }

    // ✅ Convertir en ISO UTC pour Django
    const startDateISO = toISOStringFromLocal(formData.start_date);
    if (!startDateISO) {
      setError('Date de début invalide');
      return;
    }

    // ✅ Petite marge : si la date est dans le passé (< maintenant), on la remplace par maintenant
    const now = new Date();
    const startDate = new Date(startDateISO);
    const finalStartDate =
      startDate.getTime() < now.getTime() ? now : startDate;

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      warehouse: parseInt(formData.warehouse, 10),
      start_date: finalStartDate.toISOString(),
      notes: formData.notes.trim(),
    };

    setSaving(true);
    try {
      let response;
      if (isEditMode) {
        // ✅ PATCH au lieu de PUT : tolérant aux champs manquants
        response = await AxiosInstance.patch(
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
      const newId = response?.data?.id || id;
      setTimeout(() => {
        if (newId) {
          navigate(`/inventaires/${newId}`);
        } else {
          navigate('/inventaires');
        }
      }, 1000);
    } catch (err) {
      console.error('❌ Erreur sauvegarde:', err);
      const data = err?.response?.data;
      setError(extractErrorMessage(data) || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // RENDU — LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  const backLink = isEditMode ? `/inventaires/${id}` : '/inventaires';

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <Link
          to={backLink}
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
                maxLength={200}
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
                {/* ✅ safeWarehouses : garantit un tableau */}
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
              {warehouses.length === 0 && (
                <label className="label">
                  <span className="label-text-alt text-warning">
                    Aucun entrepôt actif disponible
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
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  La date ne peut pas être dans le passé
                </span>
              </label>
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
            <Link to={backLink} className="btn btn-ghost gap-1">
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