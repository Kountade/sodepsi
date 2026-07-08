// src/components/pages/CompanyConfigEdit.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  CreditCard, 
  Calendar,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Palette,
  Clock,
  Banknote,
  Briefcase,
  FileText,
  Shield,
  Hash,
  Link2,
  Smartphone,
  AtSign,
  MapPinned,
  Home,
  ArrowLeft
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const CompanyConfigEdit = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    company_sigle: '',
    legal_form: '',
    activity: '',
    address: '',
    address2: '',
    city: '',
    postal_code: '',
    country: 'Sénégal',
    phone: '',
    phone2: '',
    email: '',
    website: '',
    tax_id: '',
    registration_number: '',
    nif: '',
    rccm: '',
    bank_name: '',
    bank_account: '',
    bank_currency: 'XOF',
    bank_iban: '',
    bank_swift: '',
    logo: null,
    favicon: null,
    primary_color: '#1a237e',
    secondary_color: '#0d47a1',
    fiscal_year_start: '',
    fiscal_year_end: '',
    currency: 'FCFA',
    currency_symbol: 'FCFA',
    timezone: 'Africa/Dakar',
    is_active: true
  });
  
  const [logoPreview, setLogoPreview] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [errors, setErrors] = useState({});
  const [configId, setConfigId] = useState(null);
  const [existingLogo, setExistingLogo] = useState(null);
  const [existingFavicon, setExistingFavicon] = useState(null);

  // Charger la configuration existante - URL SANS SLASH
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('Token');
        if (!token) {
          navigate('/login');
          return;
        }

        // ESSAYER AVEC ET SANS SLASH
        let response;
        try {
          // Essayer avec slash
          response = await AxiosInstance.get('/parametres/company-config/active/');
        } catch (err) {
          if (err.response?.status === 404) {
            // Essayer sans slash
            response = await AxiosInstance.get('/parametres/company-config/active');
          } else {
            throw err;
          }
        }
        
        if (response?.data) {
          const data = response.data;
          setConfigId(data.id);
          setFormData({
            company_name: data.company_name || '',
            company_sigle: data.company_sigle || '',
            legal_form: data.legal_form || '',
            activity: data.activity || '',
            address: data.address || '',
            address2: data.address2 || '',
            city: data.city || '',
            postal_code: data.postal_code || '',
            country: data.country || 'Sénégal',
            phone: data.phone || '',
            phone2: data.phone2 || '',
            email: data.email || '',
            website: data.website || '',
            tax_id: data.tax_id || '',
            registration_number: data.registration_number || '',
            nif: data.nif || '',
            rccm: data.rccm || '',
            bank_name: data.bank_name || '',
            bank_account: data.bank_account || '',
            bank_currency: data.bank_currency || 'XOF',
            bank_iban: data.bank_iban || '',
            bank_swift: data.bank_swift || '',
            logo: null,
            favicon: null,
            primary_color: data.primary_color || '#1a237e',
            secondary_color: data.secondary_color || '#0d47a1',
            fiscal_year_start: data.fiscal_year_start || '',
            fiscal_year_end: data.fiscal_year_end || '',
            currency: data.currency || 'FCFA',
            currency_symbol: data.currency_symbol || 'FCFA',
            timezone: data.timezone || 'Africa/Dakar',
            is_active: data.is_active !== undefined ? data.is_active : true
          });
          
          if (data.logo) {
            setLogoPreview(data.logo);
            setExistingLogo(data.logo);
          }
          if (data.favicon) {
            setFaviconPreview(data.favicon);
            setExistingFavicon(data.favicon);
          }
        }
      } catch (err) {
        console.error('Erreur chargement:', err);
        if (err.response?.status === 404) {
          setConfigId(null);
          setError('Aucune configuration trouvée. Créez-en une nouvelle.');
        } else {
          setError('Impossible de charger la configuration: ' + (err.response?.data?.detail || err.message));
        }
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [navigate]);

  // Gestion des changements
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Gestion des fichiers
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      setFormData(prev => ({ ...prev, [name]: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (name === 'logo') {
          setLogoPreview(reader.result);
        } else if (name === 'favicon') {
          setFaviconPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Supprimer un fichier
  const removeFile = (field) => {
    setFormData(prev => ({ ...prev, [field]: null }));
    if (field === 'logo') {
      setLogoPreview(null);
      setExistingLogo(null);
    }
    if (field === 'favicon') {
      setFaviconPreview(null);
      setExistingFavicon(null);
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.company_name) newErrors.company_name = 'Le nom de l\'entreprise est requis';
    if (!formData.address) newErrors.address = 'L\'adresse est requise';
    if (!formData.city) newErrors.city = 'La ville est requise';
    if (!formData.phone) newErrors.phone = 'Le téléphone est requis';
    if (!formData.email) newErrors.email = 'L\'email est requis';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission - URL SANS SLASH
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const firstError = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstError}"]`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'logo' || key === 'favicon') {
          if (formData[key] instanceof File) {
            formDataToSend.append(key, formData[key]);
          }
        } else if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      });

      let response;
      
      if (configId) {
        // MISE À JOUR - ESSAYER AVEC ET SANS SLASH
        try {
          response = await AxiosInstance.put(
            `/parametres/company-config/${configId}/`,
            formDataToSend,
            {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          );
        } catch (err) {
          if (err.response?.status === 404) {
            response = await AxiosInstance.put(
              `/parametres/company-config/${configId}`,
              formDataToSend,
              {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              }
            );
          } else {
            throw err;
          }
        }
      } else {
        // CRÉATION - ESSAYER AVEC ET SANS SLASH
        try {
          response = await AxiosInstance.post(
            '/parametres/company-config/',
            formDataToSend,
            {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          );
        } catch (err) {
          if (err.response?.status === 404) {
            response = await AxiosInstance.post(
              '/parametres/company-config',
              formDataToSend,
              {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              }
            );
          } else {
            throw err;
          }
        }
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/company-config');
      }, 2000);
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      
      let errorMessage = 'Erreur lors de la sauvegarde';
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'L\'URL de l\'API est incorrecte. Essayez avec ou sans slash final.';
        } else if (err.response.status === 400) {
          errorMessage = 'Données invalides: ' + JSON.stringify(err.response.data);
        } else if (err.response.status === 500) {
          errorMessage = 'Erreur interne du serveur';
        } else {
          errorMessage = err.response.data?.message || err.response.data?.detail || 'Erreur serveur';
        }
      } else if (err.request) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      }
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Sections du formulaire (inchangées)
  const sections = {
    general: {
      title: 'Informations Générales',
      icon: Building2,
      fields: [
        { key: 'company_name', label: 'Nom de l\'entreprise', type: 'text', required: true, placeholder: 'Ex: EBSF SARL' },
        { key: 'company_sigle', label: 'Sigle', type: 'text', placeholder: 'Ex: EBSF' },
        { key: 'legal_form', label: 'Forme juridique', type: 'text', placeholder: 'Ex: SARL, SA, EURL' },
        { key: 'activity', label: 'Activité', type: 'text', placeholder: 'Ex: Commerce de détail' },
        { key: 'is_active', label: 'Configuration active', type: 'checkbox' }
      ]
    },
    address: {
      title: 'Adresse',
      icon: MapPin,
      fields: [
        { key: 'address', label: 'Adresse', type: 'text', required: true, placeholder: 'Ex: 123 Rue de la Paix' },
        { key: 'address2', label: 'Complément d\'adresse', type: 'text', placeholder: 'Ex: Immeuble A, 2ème étage' },
        { key: 'city', label: 'Ville', type: 'text', required: true, placeholder: 'Ex: Dakar' },
        { key: 'postal_code', label: 'Code postal', type: 'text', placeholder: 'Ex: 10000' },
        { key: 'country', label: 'Pays', type: 'text', placeholder: 'Ex: Sénégal' }
      ]
    },
    contact: {
      title: 'Contact',
      icon: Phone,
      fields: [
        { key: 'phone', label: 'Téléphone', type: 'tel', required: true, placeholder: 'Ex: +221 77 123 45 67' },
        { key: 'phone2', label: 'Téléphone secondaire', type: 'tel', placeholder: 'Ex: +221 33 123 45 67' },
        { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Ex: contact@ebsf.com' },
        { key: 'website', label: 'Site web', type: 'url', placeholder: 'Ex: www.ebsf.com' }
      ]
    },
    fiscal: {
      title: 'Identifiants Fiscaux',
      icon: Shield,
      fields: [
        { key: 'tax_id', label: 'N° Identification fiscale', type: 'text', placeholder: 'Ex: 123456789' },
        { key: 'registration_number', label: 'N° Registre de commerce', type: 'text', placeholder: 'Ex: SN-DKR-2024-001' },
        { key: 'nif', label: 'NIF', type: 'text', placeholder: 'Ex: 123456789' },
        { key: 'rccm', label: 'RCCM', type: 'text', placeholder: 'Ex: SN-DKR-2024-001' }
      ]
    },
    banking: {
      title: 'Informations Bancaires',
      icon: CreditCard,
      fields: [
        { key: 'bank_name', label: 'Banque', type: 'text', placeholder: 'Ex: Ecobank' },
        { key: 'bank_account', label: 'Numéro de compte', type: 'text', placeholder: 'Ex: 12345678901' },
        { key: 'bank_currency', label: 'Devise du compte', type: 'text', placeholder: 'Ex: XOF, EUR, USD' },
        { key: 'bank_iban', label: 'IBAN', type: 'text', placeholder: 'Ex: SN123456789012345678901' },
        { key: 'bank_swift', label: 'SWIFT/BIC', type: 'text', placeholder: 'Ex: ECOCSN' }
      ]
    },
    branding: {
      title: 'Branding',
      icon: Palette,
      fields: [
        { key: 'primary_color', label: 'Couleur primaire', type: 'color', placeholder: '#1a237e' },
        { key: 'secondary_color', label: 'Couleur secondaire', type: 'color', placeholder: '#0d47a1' },
        { key: 'logo', label: 'Logo', type: 'file' },
        { key: 'favicon', label: 'Favicon', type: 'file' }
      ]
    },
    configuration: {
      title: 'Configuration',
      icon: Calendar,
      fields: [
        { key: 'fiscal_year_start', label: 'Début exercice', type: 'date' },
        { key: 'fiscal_year_end', label: 'Fin exercice', type: 'date' },
        { key: 'currency', label: 'Devise', type: 'text', placeholder: 'Ex: FCFA, EUR, USD' },
        { key: 'currency_symbol', label: 'Symbole devise', type: 'text', placeholder: 'Ex: FCFA, €, $' },
        { key: 'timezone', label: 'Fuseau horaire', type: 'text', placeholder: 'Ex: Africa/Dakar' }
      ]
    }
  };

  // Rendu d'un champ de formulaire (inchangé)
  const renderField = (field) => {
    const value = formData[field.key];
    const error = errors[field.key];

    if (field.type === 'checkbox') {
      return (
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              name={field.key}
              checked={value}
              onChange={handleChange}
              className="checkbox checkbox-primary"
            />
            <span className="label-text">{field.label}</span>
          </label>
        </div>
      );
    }

    if (field.type === 'file') {
      const preview = field.key === 'logo' ? logoPreview : faviconPreview;
      const existingFile = field.key === 'logo' ? existingLogo : existingFavicon;
      
      return (
        <div>
          <label className="label">
            <span className="label-text font-medium">{field.label}</span>
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="file"
                name={field.key}
                onChange={handleFileChange}
                accept="image/*"
                className="file-input file-input-bordered w-full file-input-primary"
              />
              <p className="text-xs text-base-content/40 mt-1">
                {field.key === 'logo' ? 'PNG, JPG, SVG (max 2MB)' : 'PNG, ICO (max 1MB)'}
              </p>
            </div>
            {(preview || existingFile) && (
              <div className="relative">
                <img
                  src={preview || existingFile}
                  alt={field.key}
                  className="w-16 h-16 object-contain rounded-lg border border-base-300 p-1 bg-white"
                />
                <button
                  type="button"
                  onClick={() => removeFile(field.key)}
                  className="absolute -top-2 -right-2 p-1 bg-error text-error-content rounded-full hover:bg-error/80 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          {error && <p className="text-error text-xs mt-1">{error}</p>}
        </div>
      );
    }

    if (field.type === 'color') {
      return (
        <div>
          <label className="label">
            <span className="label-text font-medium">{field.label}</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name={field.key}
              value={value}
              onChange={handleChange}
              className="w-12 h-12 rounded-lg border border-base-300 cursor-pointer"
            />
            <input
              type="text"
              name={field.key}
              value={value}
              onChange={handleChange}
              className="input input-bordered flex-1"
              placeholder={field.placeholder}
            />
          </div>
          {error && <p className="text-error text-xs mt-1">{error}</p>}
        </div>
      );
    }

    return (
      <div>
        <label className="label">
          <span className="label-text font-medium">
            {field.label}
            {field.required && <span className="text-error ml-1">*</span>}
          </span>
        </label>
        <input
          type={field.type || 'text'}
          name={field.key}
          value={value || ''}
          onChange={handleChange}
          placeholder={field.placeholder}
          className={`input input-bordered w-full ${error ? 'input-error' : ''}`}
        />
        {error && <p className="text-error text-xs mt-1">{error}</p>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/60">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-5xl mx-auto">
        
        {/* En-tête */}
        <div className="bg-base-100 rounded-2xl shadow-xl p-6 mb-6 border border-primary/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/company-config')}
                className="btn btn-ghost btn-sm gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-primary-content" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-base-content">
                  {configId ? 'Modifier la configuration' : 'Créer la configuration'}
                </h1>
                <p className="text-base-content/50 text-sm">
                  {configId ? 'Modifiez les informations de votre entreprise' : 'Configurez votre entreprise'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/company-config')}
                className="btn btn-ghost gap-2"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button
                type="submit"
                form="config-form"
                className="btn btn-primary gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {configId ? 'Mettre à jour' : 'Créer'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="alert alert-error mb-4 shadow-lg">
            <AlertCircle className="w-6 h-6" />
            <div>
              <span>{error}</span>
              <div className="text-xs mt-1 opacity-80">
                URLs testées:
                <br/>
                - http://127.0.0.1:8000/parametres/company-config/
                <br/>
                - http://127.0.0.1:8000/parametres/company-config
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success mb-4 shadow-lg">
            <CheckCircle className="w-6 h-6" />
            <span>Configuration sauvegardée avec succès !</span>
          </div>
        )}

        {/* Formulaire */}
        <form id="config-form" onSubmit={handleSubmit} className="bg-base-100 rounded-2xl shadow-xl overflow-hidden border border-primary/20">
          
          {/* Navigation par onglets */}
          <div className="border-b border-base-200">
            <div className="flex overflow-x-auto p-2 gap-1">
              {Object.entries(sections).map(([key, section]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap
                    ${activeTab === key 
                      ? 'bg-primary text-primary-content shadow-md' 
                      : 'hover:bg-primary/10 text-base-content/70'
                    }
                  `}
                >
                  <section.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{section.title}</span>
                  {sections[key].fields.some(f => errors[f.key]) && (
                    <span className="badge badge-error badge-xs">!</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Contenu des onglets */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sections[activeTab].fields.map((field) => (
                <div key={field.key} className={field.type === 'checkbox' ? 'col-span-2' : ''}>
                  {renderField(field)}
                </div>
              ))}
            </div>

            {/* Information de sauvegarde */}
            <div className="mt-6 pt-6 border-t border-base-200">
              <div className="flex items-center gap-2 text-sm text-base-content/50">
                <HelpCircle className="w-4 h-4" />
                <span>Tous les champs marqués d'un <span className="text-error">*</span> sont obligatoires</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyConfigEdit;