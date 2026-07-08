// src/pages/CompanyConfigView.jsx
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
  Edit,
  Printer,
  Download,
  Shield,
  FileText,
  Image,
  Palette,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Link2,
  Users,
  Banknote,
  Briefcase,
  Home,
  MapPinned,
  Smartphone,
  AtSign,
  Hash,
  ArrowLeft
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

const CompanyConfigView = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [debugInfo, setDebugInfo] = useState(null);

  // Charger la configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('Token');
        if (!token) {
          navigate('/login');
          return;
        }

        console.log('🔍 Tentative de chargement de la configuration...');
        console.log('📡 Token:', token.substring(0, 20) + '...');

        // ESSAYER AVEC ET SANS SLASH
        let response = null;
        let usedUrl = '';

        // Essayer avec slash
        try {
          console.log('📤 GET /parametres/company-config/active/');
          response = await AxiosInstance.get('/parametres/company-config/active/');
          usedUrl = '/parametres/company-config/active/';
          console.log('✅ Succès avec slash');
        } catch (err) {
          console.log('❌ Échec avec slash:', err.response?.status);
          
          // Essayer sans slash
          try {
            console.log('📤 GET /parametres/company-config/active');
            response = await AxiosInstance.get('/parametres/company-config/active');
            usedUrl = '/parametres/company-config/active';
            console.log('✅ Succès sans slash');
          } catch (err2) {
            console.log('❌ Échec sans slash:', err2.response?.status);
            throw err2;
          }
        }
        
        if (response?.data) {
          setConfig(response.data);
          setDebugInfo({ url: usedUrl, status: 'success' });
          setError(null);
        } else {
          throw new Error('Aucune donnée reçue');
        }
        
      } catch (err) {
        console.error('❌ Erreur chargement configuration:', err);
        
        let errorMessage = 'Impossible de charger la configuration de l\'entreprise';
        let details = '';
        
        if (err.response) {
          // Le serveur a répondu avec un statut d'erreur
          details = `Statut: ${err.response.status}`;
          if (err.response.status === 404) {
            errorMessage = 'Configuration non trouvée. Veuillez en créer une.';
          } else if (err.response.status === 401) {
            errorMessage = 'Session expirée. Veuillez vous reconnecter.';
            navigate('/login');
          } else if (err.response.status === 403) {
            errorMessage = 'Vous n\'avez pas les permissions nécessaires.';
          } else if (err.response.status === 500) {
            errorMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.';
          }
        } else if (err.request) {
          // La requête a été faite mais pas de réponse
          details = 'Le serveur ne répond pas. Vérifiez qu\'il est en cours d\'exécution.';
          errorMessage = 'Impossible de contacter le serveur.';
        } else {
          // Erreur lors de la configuration de la requête
          details = err.message;
        }
        
        setError(errorMessage);
        setDebugInfo({ 
          url: '/parametres/company-config/active/ ou /active', 
          status: 'error',
          details: details,
          fullError: err.message
        });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [navigate]);

  // Fonction pour formater les champs
  const formatField = (value, defaultValue = 'Non renseigné') => {
    if (!value) return defaultValue;
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    return value;
  };

  // Fonction pour afficher un champ avec icône
  const InfoField = ({ icon: Icon, label, value, className = '' }) => (
    <div className={`flex items-start gap-3 p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors ${className}`}>
      <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-base-content/50 uppercase font-medium">{label}</p>
        <div className="text-sm font-medium text-base-content break-words">{value}</div>
      </div>
    </div>
  );

  // Sections du formulaire
  const sections = {
    general: {
      title: 'Informations Générales',
      icon: Building2,
      fields: [
        { key: 'company_name', label: 'Nom de l\'entreprise', icon: Building2 },
        { key: 'company_sigle', label: 'Sigle', icon: Building2 },
        { key: 'legal_form', label: 'Forme juridique', icon: FileText },
        { key: 'activity', label: 'Activité', icon: Briefcase },
        { key: 'is_active', label: 'Statut', icon: CheckCircle }
      ]
    },
    address: {
      title: 'Adresse',
      icon: MapPin,
      fields: [
        { key: 'address', label: 'Adresse', icon: MapPin },
        { key: 'address2', label: 'Complément d\'adresse', icon: MapPinned },
        { key: 'city', label: 'Ville', icon: Home },
        { key: 'postal_code', label: 'Code postal', icon: Hash },
        { key: 'country', label: 'Pays', icon: Globe }
      ]
    },
    contact: {
      title: 'Contact',
      icon: Phone,
      fields: [
        { key: 'phone', label: 'Téléphone', icon: Smartphone },
        { key: 'phone2', label: 'Téléphone secondaire', icon: Smartphone },
        { key: 'email', label: 'Email', icon: AtSign },
        { key: 'website', label: 'Site web', icon: Link2 }
      ]
    },
    fiscal: {
      title: 'Identifiants Fiscaux',
      icon: Shield,
      fields: [
        { key: 'tax_id', label: 'N° Identification fiscale', icon: FileText },
        { key: 'registration_number', label: 'N° Registre de commerce', icon: FileText },
        { key: 'nif', label: 'NIF', icon: Hash },
        { key: 'rccm', label: 'RCCM', icon: Shield }
      ]
    },
    banking: {
      title: 'Informations Bancaires',
      icon: CreditCard,
      fields: [
        { key: 'bank_name', label: 'Banque', icon: Banknote },
        { key: 'bank_account', label: 'Numéro de compte', icon: CreditCard },
        { key: 'bank_currency', label: 'Devise du compte', icon: Banknote },
        { key: 'bank_iban', label: 'IBAN', icon: Hash },
        { key: 'bank_swift', label: 'SWIFT/BIC', icon: CreditCard }
      ]
    },
    branding: {
      title: 'Branding',
      icon: Palette,
      fields: [
        { key: 'primary_color', label: 'Couleur primaire', icon: Palette },
        { key: 'secondary_color', label: 'Couleur secondaire', icon: Palette },
        { key: 'logo', label: 'Logo', icon: Image },
        { key: 'favicon', label: 'Favicon', icon: Image }
      ]
    },
    configuration: {
      title: 'Configuration',
      icon: Calendar,
      fields: [
        { key: 'fiscal_year_start', label: 'Début exercice', icon: Calendar },
        { key: 'fiscal_year_end', label: 'Fin exercice', icon: Calendar },
        { key: 'currency', label: 'Devise', icon: Banknote },
        { key: 'currency_symbol', label: 'Symbole devise', icon: Banknote },
        { key: 'timezone', label: 'Fuseau horaire', icon: Clock }
      ]
    }
  };

  // Rendu d'un champ avec valeur
  const renderFieldValue = (fieldKey) => {
    const value = config?.[fieldKey];
    if (fieldKey === 'logo' || fieldKey === 'favicon') {
      if (value) {
        return (
          <div className="mt-2">
            <img 
              src={value} 
              alt={fieldKey === 'logo' ? 'Logo' : 'Favicon'} 
              className="max-w-32 max-h-32 object-contain border border-base-300 rounded-lg p-2 bg-white"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
        );
      }
      return 'Non défini';
    }
    if (fieldKey === 'primary_color' || fieldKey === 'secondary_color') {
      if (value) {
        return (
          <div className="flex items-center gap-2 mt-1">
            <div 
              className="w-8 h-8 rounded-lg border border-base-300" 
              style={{ backgroundColor: value }}
            />
            <span className="font-mono text-sm">{value}</span>
          </div>
        );
      }
      return 'Non défini';
    }
    if (fieldKey === 'is_active') {
      return value ? (
        <span className="badge badge-success gap-1">
          <CheckCircle className="w-3 h-3" /> Active
        </span>
      ) : (
        <span className="badge badge-error gap-1">
          <XCircle className="w-3 h-3" /> Inactive
        </span>
      );
    }
    return formatField(value);
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-2xl bg-base-100 rounded-2xl shadow-xl p-8 border border-error/20">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-error mb-2">Erreur</h2>
          <p className="text-base-content/70 mb-4">{error}</p>
          
          {debugInfo && (
            <div className="mb-6 p-4 bg-base-200 rounded-lg text-left text-sm">
              <p className="font-mono text-xs text-base-content/50">
                <strong>Debug:</strong><br />
                URL: {debugInfo.url}<br />
                Statut: {debugInfo.status}<br />
                {debugInfo.details && <span>Détails: {debugInfo.details}<br /></span>}
                {debugInfo.fullError && <span>Erreur: {debugInfo.fullError}</span>}
              </p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-3 justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
            >
              Réessayer
            </button>
            <button 
              onClick={() => navigate('/company-config/edit')} 
              className="btn btn-ghost"
            >
              Créer une configuration
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md bg-base-100 rounded-2xl shadow-xl p-8 border border-primary/20">
          <Building2 className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Aucune configuration</h2>
          <p className="text-base-content/60 mb-6">
            Aucune configuration d'entreprise n'a été trouvée.
            <br />
            Veuillez en créer une pour commencer.
          </p>
          <button 
            onClick={() => navigate('/company-config/edit')} 
            className="btn btn-primary"
          >
            Créer la configuration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* En-tête */}
        <div className="bg-base-100 rounded-2xl shadow-xl p-6 mb-6 border border-primary/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {config.logo ? (
                <img 
                  src={config.logo} 
                  alt="Logo" 
                  className="w-16 h-16 object-contain rounded-xl border border-base-300 p-1 bg-white"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-8 h-8 text-primary-content" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-base-content">
                  {config.company_name}
                </h1>
                <p className="text-base-content/50 flex items-center gap-2 flex-wrap">
                  <span className="badge badge-primary badge-sm">{config.company_sigle || 'N/A'}</span>
                  <span className="badge badge-soft badge-neutral">{config.legal_form || 'N/A'}</span>
                  <span className="badge badge-soft badge-info">{config.activity || 'N/A'}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigate('/company-config/edit')}
                className="btn btn-primary gap-2"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
              <button
                onClick={() => window.print()}
                className="btn btn-ghost gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimer
              </button>
            </div>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="bg-base-100 rounded-2xl shadow-xl overflow-hidden border border-primary/20">
          <div className="border-b border-base-200">
            <div className="flex overflow-x-auto p-2 gap-1">
              {Object.entries(sections).map(([key, section]) => (
                <button
                  key={key}
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
                </button>
              ))}
            </div>
          </div>

          {/* Contenu des onglets */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sections[activeTab].fields.map((field) => (
                <InfoField
                  key={field.key}
                  icon={field.icon}
                  label={field.label}
                  value={renderFieldValue(field.key)}
                />
              ))}
            </div>

            {/* Informations supplémentaires */}
            <div className="mt-6 pt-6 border-t border-base-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm text-base-content/50">
                  <Calendar className="w-4 h-4" />
                  <span>Créé le: {new Date(config.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-base-content/50">
                  <Calendar className="w-4 h-4" />
                  <span>Mis à jour le: {new Date(config.updated_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-base-content/50">
                  {config.is_active ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-error" />
                  )}
                  <span>Statut: {config.is_active ? 'Actif' : 'Inactif'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyConfigView;