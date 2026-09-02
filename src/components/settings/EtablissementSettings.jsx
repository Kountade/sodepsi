// src/components/settings/EtablissementSettings.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../AxiosInstance';
import { Upload, X, Save, Building2, AlertCircle, Plus, CheckCircle } from 'lucide-react';

const EtablissementSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    nom: '',
    sigle: '',
    adresse: '',
    telephone: '',
    email: '',
    site_web: '',
    devise: 'F CFA',
    systeme_notation: 'sur20',
    logo: null,
    logo_preview: null,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoDeleted, setLogoDeleted] = useState(false);

  // État pour les notifications flottantes
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Fonction pour afficher une notification
  const afficherMessage = (texte, type = 'success') => {
    setMessageText(texte);
    setMessageType(type);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 5000);
  };

  // Récupération initiale
  useEffect(() => {
    const fetchEtablissement = async () => {
      try {
        console.log('🔍 Récupération de l\'établissement...');
        const response = await axiosInstance.get('/etablissements/unique/');
        console.log('✅ Données récupérées:', response.data);
        if (response.data && response.data.id) {
          const data = response.data;
          setFormData({
            id: data.id,
            nom: data.nom || '',
            sigle: data.sigle || '',
            adresse: data.adresse || '',
            telephone: data.telephone || '',
            email: data.email || '',
            site_web: data.site_web || '',
            devise: data.devise || 'F CFA',
            systeme_notation: data.systeme_notation || 'sur20',
            logo: data.logo || null,
            logo_preview: data.logo ? `${axiosInstance.defaults.baseURL}${data.logo}` : null,
          });
          setError(null);
        } else {
          setError('Aucun établissement trouvé. Vous pouvez en créer un ci-dessous.');
        }
      } catch (error) {
        console.error('❌ Erreur chargement:', error);
        let msg = '';
        if (error.response && error.response.status === 404) {
          msg = 'Route /etablissements/unique/ introuvable. Vérifiez l\'inclusion des URLs de l\'application "config" dans votre backend.';
        } else if (error.response && error.response.status === 401) {
          msg = 'Vous devez être authentifié.';
        } else if (error.response && error.response.status === 403) {
          msg = 'Vous n\'avez pas les droits pour accéder à cette ressource.';
        } else if (error.request) {
          msg = 'Le serveur ne répond pas. Vérifiez que le backend est en cours d\'exécution.';
        } else {
          msg = 'Erreur : ' + error.message;
        }
        setError(msg);
        afficherMessage('❌ ' + msg, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchEtablissement();
  }, []);

  // Gestion des champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Gestion du logo
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      afficherMessage('❌ Le fichier est trop volumineux (max 2 Mo)', 'error');
      e.target.value = '';
      return;
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 
      'image/svg+xml', 'image/webp'
    ];
    if (!allowedTypes.includes(file.type)) {
      afficherMessage('❌ Format non supporté. Utilisez JPG, PNG, GIF, SVG ou WebP.', 'error');
      e.target.value = '';
      return;
    }

    if (file.type !== 'image/svg+xml') {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        setLogoFile(file);
        setLogoDeleted(false);
        setFormData(prev => ({ ...prev, logo_preview: url }));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        afficherMessage('❌ Le fichier semble être corrompu ou n\'est pas une image valide.', 'error');
        e.target.value = '';
      };
      img.src = url;
    } else {
      const url = URL.createObjectURL(file);
      setLogoFile(file);
      setLogoDeleted(false);
      setFormData(prev => ({ ...prev, logo_preview: url }));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoDeleted(true);
    setFormData(prev => ({ ...prev, logo: null, logo_preview: null }));
    const input = document.getElementById('logo-upload');
    if (input) input.value = '';
  };

  // Création
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const data = {
        nom: formData.nom || 'Mon Établissement',
        sigle: formData.sigle || '',
        adresse: formData.adresse || '',
        telephone: formData.telephone || '',
        email: formData.email || '',
        site_web: formData.site_web || '',
        devise: formData.devise,
        systeme_notation: formData.systeme_notation,
      };

      console.log('📤 Création:', data);
      const response = await axiosInstance.post('/etablissements/', data, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('✅ Création réussie:', response.data);

      const created = response.data;
      setFormData(prev => ({
        ...prev,
        id: created.id,
        nom: created.nom,
        sigle: created.sigle || '',
        adresse: created.adresse || '',
        telephone: created.telephone || '',
        email: created.email || '',
        site_web: created.site_web || '',
        devise: created.devise,
        systeme_notation: created.systeme_notation,
        logo: created.logo || null,
        logo_preview: created.logo ? `${axiosInstance.defaults.baseURL}${created.logo}` : null,
      }));
      setError(null);
      afficherMessage('✅ Établissement créé avec succès !', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('❌ Erreur création:', error);
      let msg = 'Erreur lors de la création.';
      if (error.response && error.response.data) {
        const details = Object.values(error.response.data).flat().join(' ');
        msg += ' ' + details;
      } else if (error.request) {
        msg += ' Le serveur ne répond pas.';
      } else {
        msg += ' ' + error.message;
      }
      setError(msg);
      afficherMessage('❌ ' + msg, 'error');
    } finally {
      setCreating(false);
    }
  };

  // Mise à jour
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id) {
      afficherMessage('❌ Aucun établissement existant. Créez-en un d\'abord.', 'error');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nom', formData.nom);
      formDataToSend.append('sigle', formData.sigle || '');
      formDataToSend.append('adresse', formData.adresse || '');
      formDataToSend.append('telephone', formData.telephone || '');
      formDataToSend.append('email', formData.email || '');
      formDataToSend.append('site_web', formData.site_web || '');
      formDataToSend.append('devise', formData.devise);
      formDataToSend.append('systeme_notation', formData.systeme_notation);

      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      } else if (logoDeleted) {
        formDataToSend.append('logo', '');
      }

      console.log('📤 Envoi de la mise à jour...');
      const response = await axiosInstance.put(`/etablissements/${formData.id}/`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('✅ Mise à jour réussie:', response.data);
      const updated = response.data;
      setFormData(prev => ({
        ...prev,
        nom: updated.nom,
        sigle: updated.sigle,
        adresse: updated.adresse,
        telephone: updated.telephone,
        email: updated.email,
        site_web: updated.site_web,
        devise: updated.devise,
        systeme_notation: updated.systeme_notation,
        logo: updated.logo,
        logo_preview: updated.logo ? `${axiosInstance.defaults.baseURL}${updated.logo}` : null,
      }));
      setLogoFile(null);
      setLogoDeleted(false);

      afficherMessage('✅ Établissement mis à jour avec succès !', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('❌ Erreur mise à jour:', error);
      let msg = 'Erreur lors de la mise à jour.';
      if (error.response) {
        if (error.response.status === 400) {
          const details = Object.values(error.response.data).flat().join(' ');
          msg += ' ' + details;
        } else if (error.response.status === 403) {
          msg = '⛔ Vous n\'avez pas la permission.';
        } else if (error.response.status === 404) {
          msg = 'L\'établissement n\'existe pas.';
        } else {
          msg += ` Code ${error.response.status}`;
        }
      } else if (error.request) {
        msg += ' Le serveur ne répond pas.';
      } else {
        msg += ' ' + error.message;
      }
      setError(msg);
      afficherMessage('❌ ' + msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasId = !!formData.id;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Notification flottante */}
      {showMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md animate-slideDown">
          <div className={`alert shadow-lg border-l-4 ${
            messageType === 'error' 
              ? 'alert-error border-l-error' 
              : 'alert-success border-l-success'
          }`}>
            <div className="flex items-center gap-3">
              {messageType === 'error' ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{messageText}</span>
            </div>
            <button onClick={() => setShowMessage(false)} className="btn btn-sm btn-ghost btn-circle">✕</button>
          </div>
        </div>
      )}

      <div className="bg-base-100 rounded-2xl shadow-xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-base-content">Paramètres de l'établissement</h1>
        </div>

        {error && (
          <div className="alert alert-warning shadow-lg mb-6">
            <AlertCircle className="w-6 h-6" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="btn btn-sm btn-ghost">✕</button>
          </div>
        )}

        <form onSubmit={hasId ? handleSubmit : handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label"><span className="label-text font-medium">Nom *</span></label>
              <input type="text" name="nom" value={formData.nom} onChange={handleChange} className="input input-bordered w-full" required placeholder="Ex: Institut Sodepci" />
            </div>
            <div>
              <label className="label"><span className="label-text font-medium">Sigle</span></label>
              <input type="text" name="sigle" value={formData.sigle} onChange={handleChange} className="input input-bordered w-full" placeholder="Ex: SODEPCI" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label"><span className="label-text font-medium">Adresse</span></label>
              <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} className="input input-bordered w-full" />
            </div>
            <div>
              <label className="label"><span className="label-text font-medium">Téléphone</span></label>
              <input type="tel" name="telephone" value={formData.telephone} onChange={handleChange} className="input input-bordered w-full" />
            </div>
            <div>
              <label className="label"><span className="label-text font-medium">Email</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input input-bordered w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label"><span className="label-text font-medium">Site web</span></label>
              <input type="url" name="site_web" value={formData.site_web} onChange={handleChange} className="input input-bordered w-full" placeholder="https://..." />
            </div>
            <div>
              <label className="label"><span className="label-text font-medium">Devise</span></label>
              <input type="text" name="devise" value={formData.devise} onChange={handleChange} className="input input-bordered w-full" />
            </div>
          </div>

          <div>
            <label className="label"><span className="label-text font-medium">Système de notation</span></label>
            <select name="systeme_notation" value={formData.systeme_notation} onChange={handleChange} className="select select-bordered w-full">
              <option value="sur20">Sur 20</option>
              <option value="sur100">Sur 100</option>
              <option value="lettre">Lettres (A, B, C)</option>
            </select>
          </div>

          <div>
            <label className="label"><span className="label-text font-medium">Logo</span></label>
            <div className="flex flex-wrap items-center gap-4">
              {formData.logo_preview ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-base-300 flex-shrink-0">
                  <img src={formData.logo_preview} alt="Logo" className="w-full h-full object-cover" />
                  <button type="button" onClick={removeLogo} className="absolute top-1 right-1 bg-error text-white rounded-full p-1 hover:bg-error/80 transition"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-base-300 flex items-center justify-center text-base-content/40"><Upload className="w-8 h-8" /></div>
              )}
              <div className="flex-1 min-w-[200px]">
                <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} className="file-input file-input-bordered w-full" />
                <p className="text-xs text-base-content/50 mt-1">PNG, JPG, GIF, SVG, WebP (max 2MB)</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-base-200">
            {!hasId ? (
              <button type="submit" disabled={creating} className="btn btn-success gap-2 min-w-[200px]">
                {creating ? <span className="loading loading-spinner loading-sm"></span> : <Plus className="w-4 h-4" />}
                {creating ? 'Création...' : 'Créer l\'établissement'}
              </button>
            ) : (
              <button type="submit" disabled={saving} className="btn btn-primary gap-2 min-w-[200px]">
                {saving ? <span className="loading loading-spinner loading-sm"></span> : <Save className="w-4 h-4" />}
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EtablissementSettings;