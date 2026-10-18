// src/components/finances/BudgetCategorieForm.jsx
// ============================================================
// VERSION CORRIGÉE - Formulaire catégorie de budget
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Loader2, AlertCircle,
  CheckCircle, ChartPie, Tag, Hash, FileText,
  AlertTriangle
} from 'lucide-react';

// ============================================================
// COMPOSANT
// ============================================================
const BudgetCategorieForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  // ==========================================================
  // ÉTATS
  // ==========================================================
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    description: '',
    is_active: true,
  });

  const abortRef = useRef(null);

  const getToken = () => localStorage.getItem('Token');

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, show: false })),
      4000
    );
  }, []);

  // ==========================================================
  // CHARGEMENT CATÉGORIE (mode édition)
  // ==========================================================
  const fetchCategorie = useCallback(async () => {
    if (!isEdit) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await AxiosInstance.get(`/budget-categories/${id}/`, {
        headers: { Authorization: `Token ${token}` },
        signal: controller.signal,
      });

      const data = response.data;
      setFormData({
        nom: data.nom || '',
        code: data.code || '',
        description: data.description || '',
        is_active: data.is_active !== undefined ? data.is_active : true,
      });
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      console.error('❌ Erreur chargement catégorie:', err);
      if (err.response?.status === 404) {
        showNotification('Catégorie introuvable', 'error');
        setTimeout(() => navigate('/budget-categories'), 1500);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [id, isEdit, navigate, showNotification]);

  // ==========================================================
  // EFFETS
  // ==========================================================
  useEffect(() => {
    if (isEdit) fetchCategorie();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchCategorie, isEdit]);

  // ==========================================================
  // HANDLERS
  // ==========================================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================
  const validateForm = () => {
    const newErrors = {};

    if (!formData.code || formData.code.trim() === '') {
      newErrors.code = 'Le code est requis';
    }
    if (!formData.nom || formData.nom.trim() === '') {
      newErrors.nom = 'Le nom est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==========================================================
  // SOUMISSION
  // ==========================================================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      showNotification('Veuillez corriger les erreurs du formulaire', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      if (!token) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const dataToSend = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        nom: formData.nom.trim(),
      };

      if (isEdit) {
        await AxiosInstance.put(`/budget-categories/${id}/`, dataToSend, {
          headers: { Authorization: `Token ${token}` },
        });
        showNotification('Catégorie modifiée avec succès', 'success');
      } else {
        await AxiosInstance.post('/budget-categories/', dataToSend, {
          headers: { Authorization: `Token ${token}` },
        });
        showNotification('Catégorie créée avec succès', 'success');
      }

      setTimeout(() => navigate('/budget-categories'), 1500);
    } catch (err) {
      console.error('❌ Erreur enregistrement:', err);

      let errorMsg = "Erreur lors de l'enregistrement";

      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'object') {
          if (data.code) {
            setErrors((prev) => ({ ...prev, code: data.code[0] }));
            errorMsg = data.code[0];
          } else if (data.nom) {
            setErrors((prev) => ({ ...prev, nom: data.nom[0] }));
            errorMsg = data.nom[0];
          } else if (data.detail) {
            errorMsg = data.detail;
          } else if (data.message) {
            errorMsg = data.message;
          } else if (data.non_field_errors) {
            errorMsg = data.non_field_errors.join(', ');
          } else {
            const firstError = Object.values(data)[0];
            if (Array.isArray(firstError)) errorMsg = firstError[0];
            else if (typeof firstError === 'string') errorMsg = firstError;
          }
        } else if (typeof data === 'string') {
          errorMsg = data;
        }
      }

      showNotification(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/budget-categories');
  };

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">
            Chargement de la catégorie…
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDU
  // ==========================================================
  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown max-w-md">
          <div
            className={`alert ${
              notification.type === 'success'
                ? 'alert-success'
                : notification.type === 'warning'
                ? 'alert-warning'
                : 'alert-error'
            } shadow-xl rounded-xl`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : notification.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() =>
                setNotification((prev) => ({ ...prev, show: false }))
              }
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCancel}
          className="btn btn-ghost btn-sm btn-circle"
          disabled={submitting}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ChartPie className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie de budget'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-1">
            {isEdit
              ? `Catégorie #${id}`
              : 'Créer une nouvelle catégorie de budget'}
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Code */}
            <div>
              <label className="label text-sm font-medium text-gray-700">
                <Hash className="w-4 h-4 inline mr-1" />
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className={`input input-bordered w-full uppercase ${
                  errors.code ? 'input-error' : ''
                }`}
                placeholder="Ex: FOURN, ENERG, LOYER…"
                disabled={submitting}
              />
              {errors.code && (
                <p className="text-red-500 text-xs mt-1">{errors.code}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Code unique en majuscules
              </p>
            </div>

            {/* Nom */}
            <div>
              <label className="label text-sm font-medium text-gray-700">
                <Tag className="w-4 h-4 inline mr-1" />
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className={`input input-bordered w-full ${
                  errors.nom ? 'input-error' : ''
                }`}
                placeholder="Ex: Fournitures de bureau, Énergie…"
                disabled={submitting}
              />
              {errors.nom && (
                <p className="text-red-500 text-xs mt-1">{errors.nom}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="label text-sm font-medium text-gray-700">
                <FileText className="w-4 h-4 inline mr-1" />
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="textarea textarea-bordered w-full h-24"
                placeholder="Description de la catégorie de budget…"
                disabled={submitting}
              />
            </div>

            {/* Statut actif */}
            <div>
              <label className="label text-sm font-medium text-gray-700">
                Statut
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="checkbox checkbox-success"
                  disabled={submitting}
                />
                <span className="text-sm">
                  {formData.is_active ? 'Actif' : 'Inactif'}
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <button
              type="submit"
              className="btn btn-primary gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Mettre à jour' : 'Créer la catégorie'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-ghost gap-2"
              disabled={submitting}
            >
              <X className="w-4 h-4" /> Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetCategorieForm;