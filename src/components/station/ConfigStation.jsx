// src/components/station/ConfigStation.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Settings, Save, RefreshCw, AlertCircle, CheckCircle, X,
  Fuel, Droplet, Gauge, Bell, Shield, Database, Server,
  Building2, Calendar, Clock, DollarSign, Hash, Wrench,
  TrendingUp, Zap, Eye, EyeOff, Award, Target, Activity,
  AlertTriangle, Info, FileText, Users, Lock
} from 'lucide-react';

const ConfigStation = () => {
  const navigate = useNavigate();

  // États
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [activeTab, setActiveTab] = useState('general');

  // Établissement
  const [etablissement, setEtablissement] = useState(null);

  // Statistiques système (compteurs)
  const [systemStats, setSystemStats] = useState({
    cuves: 0,
    pompes: 0,
    services: 0,
    prixActifs: 0,
    ventesCarburant: 0,
    ventesServices: 0,
  });

  // Formulaire de configuration (stocké en localStorage)
  const [config, setConfig] = useState({
    // Général
    stationNom: '',
    stationCode: '',
    devise: 'FCFA',
    langue: 'fr',
    timezone: 'Africa/Abidjan',

    // Cuves & Carburants
    capaciteAlerteDefaut: 500,
    decimalesLitres: 2,
    decimalesMontant: 2,

    // Pompes
    prixDefautPompe: 0,
    compteurObligatoire: true,

    // Ventes
    venteSansClient: true,
    remiseMax: 5000,
    tvaDefaut: 0,

    // Alertes
    alertesActives: true,
    seuilAlertePourcentage: 20,
    emailAlertes: '',
    notifierCuvesAlerte: true,
    notifierLotsExpirants: true,
    notifierImpayes: true,

    // Impression
    imprimanteDefaut: 'A4',
    imprimerAutoTicket: false,
    enteteRecu: '',
    piedRecu: 'Merci de votre confiance',
  });

  const getToken = () => localStorage.getItem('Token');
  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(parseFloat(n || 0));

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  // Charger les données
  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const headers = { Authorization: `Token ${token}` };

        const results = await Promise.allSettled([
          AxiosInstance.get('/etablissements/unique/', { headers }),
          AxiosInstance.get('/cuves/', { headers }),
          AxiosInstance.get('/pompes/', { headers }),
          AxiosInstance.get('/services/', { headers }),
          AxiosInstance.get('/prix-carburant/?est_actif=true', { headers }),
          AxiosInstance.get('/ventes-carburant/', { headers }),
          AxiosInstance.get('/ventes-services/', { headers }),
        ]);

        const extract = (r) => {
          if (r.status !== 'fulfilled') return [];
          const data = r.value.data;
          return Array.isArray(data) ? data : (data.results || []);
        };

        // Établissement
        if (results[0].status === 'fulfilled') {
          const etab = results[0].value.data;
          setEtablissement(etab);
          setConfig(prev => ({
            ...prev,
            stationNom: etab?.nom || '',
            stationCode: etab?.sigle || '',
            enteteRecu: etab?.nom || '',
          }));
        }

        setSystemStats({
          cuves: extract(results[1]).length,
          pompes: extract(results[2]).length,
          services: extract(results[3]).length,
          prixActifs: extract(results[4]).length,
          ventesCarburant: extract(results[5]).length,
          ventesServices: extract(results[6]).length,
        });

        // Charger config sauvegardée
        const saved = localStorage.getItem('station-config');
        if (saved) {
          try {
            setConfig(prev => ({ ...prev, ...JSON.parse(saved) }));
          } catch (e) { /* ignore */ }
        }
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          showNotification('Session expirée', 'error');
          setTimeout(() => navigate('/login'), 2000);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simuler une sauvegarde (localStorage pour l'instant)
      localStorage.setItem('station-config', JSON.stringify(config));
      await new Promise(r => setTimeout(r, 600)); // petit délai visuel
      showNotification('Configuration sauvegardée avec succès', 'success');
    } catch (err) {
      showNotification('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm('Réinitialiser la configuration aux valeurs par défaut ?')) return;
    localStorage.removeItem('station-config');
    window.location.reload();
  };

  // Onglets
  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'cuves', label: 'Cuves', icon: Fuel },
    { id: 'pompes', label: 'Pompes', icon: Server },
    { id: 'ventes', label: 'Ventes', icon: DollarSign },
    { id: 'alertes', label: 'Alertes', icon: Bell },
    { id: 'impression', label: 'Impression', icon: FileText },
    { id: 'systeme', label: 'Système', icon: Database },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 bg-gray-50 min-h-screen">

      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium text-sm">{notification.message}</span>
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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Settings className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Configuration Station
              </h1>
              <p className="text-sm text-gray-500">
                Paramètres généraux, cuves, pompes et alertes
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleReset} className="btn btn-sm btn-ghost gap-2">
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
            <button onClick={handleSave} disabled={saving} className="btn btn-sm btn-primary gap-2">
              {saving ? <span className="loading loading-spinner loading-sm"></span> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>

      {/* Info établissement */}
      {etablissement && (
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg truncate">
              {etablissement.nom || 'Établissement sans nom'}
            </p>
            <p className="text-sm text-gray-500">
              {etablissement.sigle && `${etablissement.sigle} · `}
              {etablissement.email || 'Email non renseigné'}
            </p>
          </div>
          <button
            onClick={() => navigate('/company-config')}
            className="btn btn-sm btn-outline gap-2"
          >
            <Eye className="w-4 h-4" /> Voir
          </button>
        </div>
      )}

      {/* Cartes stats système */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl shadow-md p-3 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Cuves</p>
              <p className="text-xl font-bold text-primary">{systemStats.cuves}</p>
            </div>
            <Fuel className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 border-l-4 border-info">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pompes</p>
              <p className="text-xl font-bold text-info">{systemStats.pompes}</p>
            </div>
            <Server className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 border-l-4 border-secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Services</p>
              <p className="text-xl font-bold text-secondary">{systemStats.services}</p>
            </div>
            <Wrench className="w-8 h-8 text-secondary/20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 border-l-4 border-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Prix actifs</p>
              <p className="text-xl font-bold text-warning">{systemStats.prixActifs}</p>
            </div>
            <DollarSign className="w-8 h-8 text-warning/20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 border-l-4 border-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">V. carburant</p>
              <p className="text-xl font-bold text-success">{systemStats.ventesCarburant}</p>
            </div>
            <Fuel className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-3 border-l-4 border-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">V. services</p>
              <p className="text-xl font-bold text-accent">{systemStats.ventesServices}</p>
            </div>
            <Wrench className="w-8 h-8 text-accent/20" />
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b overflow-x-auto">
          <div className="flex">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-gray-500 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">

          {/* ============ ONGLET GÉNÉRAL ============ */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Informations générales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Nom de la station</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={config.stationNom}
                      onChange={(e) => handleChange('stationNom', e.target.value)}
                      placeholder="Ex: Station SODEPCI"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Code station</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={config.stationCode}
                      onChange={(e) => handleChange('stationCode', e.target.value)}
                      placeholder="Ex: STA-001"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Devise</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={config.devise}
                      onChange={(e) => handleChange('devise', e.target.value)}
                    >
                      <option value="FCFA">FCFA (XOF)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="USD">Dollar (USD)</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Langue</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={config.langue}
                      onChange={(e) => handleChange('langue', e.target.value)}
                    >
                      <option value="fr">Français</option>
                      <option value="en">Anglais</option>
                    </select>
                  </div>
                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text font-semibold">Fuseau horaire</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={config.timezone}
                      onChange={(e) => handleChange('timezone', e.target.value)}
                    >
                      <option value="Africa/Abidjan">Africa/Abidjan (GMT+0)</option>
                      <option value="Africa/Dakar">Africa/Dakar (GMT+0)</option>
                      <option value="Africa/Accra">Africa/Accra (GMT+0)</option>
                      <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="divider"></div>

              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-primary" />
                  Format des nombres
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Décimales litres</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={config.decimalesLitres}
                      onChange={(e) => handleChange('decimalesLitres', parseInt(e.target.value))}
                    >
                      <option value="0">0 décimale</option>
                      <option value="1">1 décimale</option>
                      <option value="2">2 décimales</option>
                      <option value="3">3 décimales</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Décimales montants</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={config.decimalesMontant}
                      onChange={(e) => handleChange('decimalesMontant', parseInt(e.target.value))}
                    >
                      <option value="0">0 décimale</option>
                      <option value="2">2 décimales</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ ONGLET CUVES ============ */}
          {activeTab === 'cuves' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-primary" />
                  Paramètres des cuves
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Seuil d'alerte par défaut (L)</span>
                      <span className="label-text-alt text-gray-500">
                        Utilisé lors de la création d'une nouvelle cuve
                      </span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={config.capaciteAlerteDefaut}
                      onChange={(e) => handleChange('capaciteAlerteDefaut', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Seuil d'alerte (%)</span>
                      <span className="label-text-alt text-gray-500">
                        {/* ✅ CORRECTION : '<' échappé en &lt; */}
                        Alerte visuelle si niveau &lt; X%
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="input input-bordered"
                      value={config.seuilAlertePourcentage}
                      onChange={(e) => handleChange('seuilAlertePourcentage', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="alert alert-info">
                <Info className="w-5 h-5" />
                <div>
                  <p className="font-semibold text-sm">Cuves actuelles</p>
                  <p className="text-xs">
                    Vous avez <strong>{systemStats.cuves}</strong> cuve(s) configurée(s).
                    Gérez-les depuis <button onClick={() => navigate('/cuves')} className="link link-primary">la page des cuves</button>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============ ONGLET POMPES ============ */}
          {activeTab === 'pompes' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Server className="w-5 h-5 text-primary" />
                  Paramètres des pompes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Prix par défaut (FCFA/L)</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={config.prixDefautPompe}
                      onChange={(e) => handleChange('prixDefautPompe', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={config.compteurObligatoire}
                        onChange={(e) => handleChange('compteurObligatoire', e.target.checked)}
                      />
                      <div>
                        <span className="label-text font-semibold">Compteur obligatoire</span>
                        <p className="text-xs text-gray-500">
                          Exiger le relevé de compteur à chaque vente
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="alert alert-info">
                <Info className="w-5 h-5" />
                <div>
                  <p className="font-semibold text-sm">Pompes actuelles</p>
                  <p className="text-xs">
                    Vous avez <strong>{systemStats.pompes}</strong> pompe(s) configurée(s).
                    Gérez-les depuis <button onClick={() => navigate('/pompes')} className="link link-primary">la page des pompes</button>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============ ONGLET VENTES ============ */}
          {activeTab === 'ventes' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Paramètres des ventes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={config.venteSansClient}
                        onChange={(e) => handleChange('venteSansClient', e.target.checked)}
                      />
                      <div>
                        <span className="label-text font-semibold">Ventes sans client</span>
                        <p className="text-xs text-gray-500">
                          Autoriser les ventes au comptoir
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Remise maximale (FCFA)</span>
                      <span className="label-text-alt text-gray-500">
                        0 = pas de limite
                      </span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={config.remiseMax}
                      onChange={(e) => handleChange('remiseMax', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text font-semibold">TVA par défaut (%)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input input-bordered"
                      value={config.tvaDefaut}
                      onChange={(e) => handleChange('tvaDefaut', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ ONGLET ALERTES ============ */}
          {activeTab === 'alertes' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Notifications et alertes
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold text-sm">Alertes actives</p>
                        <p className="text-xs text-gray-500">
                          Activer toutes les notifications
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={config.alertesActives}
                      onChange={(e) => handleChange('alertesActives', e.target.checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Fuel className="w-5 h-5 text-error" />
                      <div>
                        <p className="font-semibold text-sm">Cuves en alerte</p>
                        <p className="text-xs text-gray-500">
                          Notifier quand une cuve est basse
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-error"
                      checked={config.notifierCuvesAlerte}
                      onChange={(e) => handleChange('notifierCuvesAlerte', e.target.checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-warning" />
                      <div>
                        <p className="font-semibold text-sm">Lots expirants</p>
                        <p className="text-xs text-gray-500">
                          Notifier quand un lot approche de la date d'expiration
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-warning"
                      checked={config.notifierLotsExpirants}
                      onChange={(e) => handleChange('notifierLotsExpirants', e.target.checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-info" />
                      <div>
                        <p className="font-semibold text-sm">Impayés clients</p>
                        <p className="text-xs text-gray-500">
                          Notifier quand une facture est en retard
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-info"
                      checked={config.notifierImpayes}
                      onChange={(e) => handleChange('notifierImpayes', e.target.checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="divider"></div>

              <div>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Email des alertes
                </h3>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  placeholder="alertes@exemple.com"
                  value={config.emailAlertes}
                  onChange={(e) => handleChange('emailAlertes', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Laissez vide pour désactiver l'envoi d'emails
                </p>
              </div>
            </div>
          )}

          {/* ============ ONGLET IMPRESSION ============ */}
          {activeTab === 'impression' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Impression des reçus
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Format d'impression</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={config.imprimanteDefaut}
                      onChange={(e) => handleChange('imprimanteDefaut', e.target.value)}
                    >
                      <option value="A4">A4 (Standard)</option>
                      <option value="A5">A5 (Demi-page)</option>
                      <option value="ticket">Ticket thermique (80mm)</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={config.imprimerAutoTicket}
                        onChange={(e) => handleChange('imprimerAutoTicket', e.target.checked)}
                      />
                      <div>
                        <span className="label-text font-semibold">Impression auto</span>
                        <p className="text-xs text-gray-500">
                          Imprimer le reçu dès validation
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text font-semibold">En-tête du reçu</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      placeholder="Ex: Station SODEPCI - Abidjan"
                      value={config.enteteRecu}
                      onChange={(e) => handleChange('enteteRecu', e.target.value)}
                    />
                  </div>

                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text font-semibold">Pied de reçu</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered"
                      rows="2"
                      value={config.piedRecu}
                      onChange={(e) => handleChange('piedRecu', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Aperçu */}
              <div className="divider">Aperçu du reçu</div>
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 max-w-md mx-auto">
                <div className="text-center border-b-2 border-dashed pb-3 mb-3">
                  <p className="font-bold">{config.enteteRecu || 'Nom de la station'}</p>
                  <p className="text-xs text-gray-500">
                    Reçu de vente
                  </p>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Carburant (20 L)</span>
                    <span className="font-semibold">17 000 FCFA</span>
                  </div>
                </div>
                <div className="border-t-2 border-dashed pt-3 mt-3 text-center">
                  <p className="text-xs italic">{config.piedRecu || 'Merci de votre confiance'}</p>
                </div>
              </div>
            </div>
          )}

          {/* ============ ONGLET SYSTÈME ============ */}
          {activeTab === 'systeme' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Informations système
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Version</p>
                    <p className="font-bold">v2.1.0</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Backend</p>
                    <p className="font-bold">Django REST Framework</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Frontend</p>
                    <p className="font-bold">React + Tailwind CSS</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Dernière mise à jour</p>
                    <p className="font-bold">
                      {new Date().toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="divider"></div>

              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Statistiques système
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-primary/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Cuves</p>
                    <p className="text-2xl font-black text-primary">{systemStats.cuves}</p>
                  </div>
                  <div className="bg-info/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Pompes</p>
                    <p className="text-2xl font-black text-info">{systemStats.pompes}</p>
                  </div>
                  <div className="bg-secondary/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Services</p>
                    <p className="text-2xl font-black text-secondary">{systemStats.services}</p>
                  </div>
                  <div className="bg-warning/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Prix actifs</p>
                    <p className="text-2xl font-black text-warning">{systemStats.prixActifs}</p>
                  </div>
                  <div className="bg-success/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">V. carburant</p>
                    <p className="text-2xl font-black text-success">{systemStats.ventesCarburant}</p>
                  </div>
                  <div className="bg-accent/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">V. services</p>
                    <p className="text-2xl font-black text-accent">{systemStats.ventesServices}</p>
                  </div>
                </div>
              </div>

              <div className="alert alert-warning">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <p className="font-semibold text-sm">Zone sensible</p>
                  <p className="text-xs">
                    Les modifications ici affectent le comportement global de la station.
                    Sauvegardez avant de continuer.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/system-settings')}
                  className="btn btn-outline btn-sm gap-2"
                >
                  <Settings className="w-4 h-4" /> Paramètres système
                </button>
                <button
                  onClick={() => navigate('/backups')}
                  className="btn btn-outline btn-sm gap-2"
                >
                  <Database className="w-4 h-4" /> Sauvegardes
                </button>
                <button
                  onClick={() => navigate('/audit')}
                  className="btn btn-outline btn-sm gap-2"
                >
                  <Eye className="w-4 h-4" /> Journal d'audit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barre d'action flottante */}
      <div className="sticky bottom-4 z-30">
        <div className="bg-white rounded-xl shadow-lg p-3 flex items-center justify-between gap-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Info className="w-4 h-4" />
            <span>Les modifications sont sauvegardées localement</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="btn btn-ghost btn-sm gap-2">
              <RefreshCw className="w-4 h-4" /> Annuler
            </button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm gap-2">
              {saving ? <span className="loading loading-spinner loading-sm"></span> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigStation;