// src/components/station/VenteServiceForm.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Wrench, Droplet, Sparkles, Zap, Activity,
  Save, X, CheckCircle, AlertCircle, User, CreditCard,
  Wallet, Banknote, Smartphone, FileText, Plus, Search,
  Calculator, Users, Building2, Clock, Calendar
} from 'lucide-react';

const VenteServiceForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Données
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});

  // Formulaire
  const [form, setForm] = useState({
    service: searchParams.get('service') || '',
    client: '',
    quantite: 1,
    prix_unitaire: '',
    remise: 0,
    type_paiement: 'cash',
    reference_paiement: '',
    est_paye: true,
    notes: '',
  });

  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');
  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(parseFloat(n || 0));
  const formatCurrency = (n) => new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XOF'
  }).format(parseFloat(n || 0)).replace('XOF', 'FCFA');

  // Types de service
  const TYPE_ICONS = {
    lavage_manuel: Droplet,
    lavage_auto: Sparkles,
    gonflage: Zap,
    vidange: Droplet,
    graissage: Wrench,
    autre: Activity,
  };

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const [servicesRes, clientsRes] = await Promise.all([
          AxiosInstance.get('/services/?est_actif=true', {
            headers: { Authorization: `Token ${token}` }
          }).catch(() => ({ data: [] })),
          AxiosInstance.get('/clients/', {
            headers: { Authorization: `Token ${token}` }
          }).catch(() => ({ data: [] })),
        ]);

        const servicesData = Array.isArray(servicesRes.data)
          ? servicesRes.data
          : (servicesRes.data.results || []);
        const clientsData = Array.isArray(clientsRes.data)
          ? clientsRes.data
          : (clientsRes.data.results || []);

        setServices(servicesData);
        setClients(clientsData);

        // Pré-sélection service
        const sid = searchParams.get('service');
        if (sid) {
          const found = servicesData.find(s => String(s.id) === String(sid));
          if (found) {
            setForm(prev => ({
              ...prev,
              service: String(found.id),
              prix_unitaire: String(found.prix || ''),
            }));
          }
        }
      } catch (e) {
        console.error(e);
        showNotification('Erreur de chargement', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedService = useMemo(
    () => services.find(s => String(s.id) === String(form.service)),
    [services, form.service]
  );

  const selectedClient = useMemo(
    () => clients.find(c => String(c.id) === String(form.client)),
    [clients, form.client]
  );

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients.slice(0, 15);
    const q = clientSearch.toLowerCase();
    return clients.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.code || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    ).slice(0, 15);
  }, [clients, clientSearch]);

  // Auto-remplir le prix quand service change
  useEffect(() => {
    if (selectedService && !form.prix_unitaire) {
      setForm(prev => ({
        ...prev,
        prix_unitaire: String(selectedService.prix || ''),
      }));
    }
  }, [selectedService]);

  // Calculs
  const montantBrut = useMemo(() => {
    return parseFloat(form.quantite || 0) * parseFloat(form.prix_unitaire || 0);
  }, [form.quantite, form.prix_unitaire]);

  const montantNet = useMemo(() => {
    return Math.max(0, montantBrut - parseFloat(form.remise || 0));
  }, [montantBrut, form.remise]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!form.service) {
      showNotification('Veuillez sélectionner un service', 'error');
      return;
    }
    if (!form.quantite || parseFloat(form.quantite) <= 0) {
      showNotification('Quantité invalide', 'error');
      return;
    }
    if (!form.prix_unitaire || parseFloat(form.prix_unitaire) <= 0) {
      showNotification('Prix invalide', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      const payload = {
        service: parseInt(form.service),
        client: form.client ? parseInt(form.client) : null,
        quantite: parseInt(form.quantite),
        prix_unitaire: parseFloat(form.prix_unitaire),
        remise: parseFloat(form.remise || 0),
        type_paiement: form.type_paiement,
        est_paye: form.est_paye,
        notes: form.notes || '',
      };

      const res = await AxiosInstance.post('/ventes-services/', payload, {
        headers: { Authorization: `Token ${token}` }
      });

      showNotification(
        `✅ Vente ${res.data.numero_vente} enregistrée (${formatCurrency(res.data.montant_net)})`,
        'success'
      );
      setTimeout(() => navigate('/ventes-services'), 1500);
    } catch (err) {
      console.error(err);
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        setErrors(data);
        const firstError = Object.values(data).flat?.()?.[0] ||
          data.error || data.detail || 'Erreur';
        showNotification(String(firstError), 'error');
      } else {
        showNotification('Erreur lors de l\'enregistrement', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      service: '', client: '', quantite: 1,
      prix_unitaire: '', remise: 0,
      type_paiement: 'cash', reference_paiement: '',
      est_paye: true, notes: '',
    });
    setErrors({});
    setShowNotes(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-50">
        <div className="text-center space-y-3">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success'
                ? <CheckCircle className="w-5 h-5" />
                : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification({ ...notification, show: false })}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/ventes-services')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Wrench className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black text-primary leading-tight">
              Nouvelle vente de service
            </h1>
            <p className="text-sm text-gray-500 leading-tight">
              Enregistrez une prestation de service
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-ghost btn-sm gap-2"
          >
            <X className="w-4 h-4" /> Réinitialiser
          </button>
          <button
            type="button"
            onClick={() => navigate('/ventes-services')}
            className="btn btn-outline btn-sm"
          >
            Annuler
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden"
      >
        {/* ============ COLONNE 1 : Service + Client ============ */}
        <div className="flex flex-col gap-4 overflow-y-auto">

          {/* Service */}
          <div className="bg-white rounded-xl shadow-md p-4 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-5 h-5 text-primary" />
              <h2 className="font-bold">Service</h2>
              <span className="badge badge-primary badge-sm ml-auto">{services.length}</span>
            </div>

            {services.length === 0 ? (
              <div className="text-center py-6">
                <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm mb-3">Aucun service actif</p>
                <button
                  type="button"
                  onClick={() => navigate('/services/nouveau')}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Plus className="w-4 h-4" /> Créer un service
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-1">
                {services.map(s => {
                  const isSelected = String(form.service) === String(s.id);
                  const Icon = TYPE_ICONS[s.type_service] || Wrench;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        handleChange('service', String(s.id));
                        handleChange('prix_unitaire', String(s.prix || ''));
                      }}
                      className={`text-left p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-primary/20' : 'bg-info/10'
                          }`}>
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-info'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{s.nom}</p>
                            <p className="text-xs text-gray-500">{s.code}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />}
                      </div>

                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="font-bold text-primary">
                          {formatNumber(s.prix)} FCFA
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3 h-3" />
                          {s.duree_estimee} min
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============ COLONNE 2 : Client + Quantité + Paiement ============ */}
        <div className="flex flex-col gap-4 overflow-y-auto">

          {/* Client */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-primary" />
              <h2 className="font-bold">Client</h2>
              <span className="text-xs text-gray-500 ml-auto">Optionnel</span>
            </div>

            {selectedClient ? (
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{selectedClient.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {selectedClient.code} · {selectedClient.phone || 'N/A'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('client', '')}
                  className="btn btn-ghost btn-sm btn-circle flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  className="input input-bordered w-full pl-9"
                  value={clientSearch}
                  onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                  onFocus={() => setShowClientDropdown(true)}
                />
                {showClientDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowClientDropdown(false)} />
                    <div className="absolute z-40 mt-1 w-full bg-white rounded-lg shadow-xl border max-h-64 overflow-y-auto">
                      {filteredClients.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          Aucun client trouvé
                        </div>
                      ) : (
                        filteredClients.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              handleChange('client', String(c.id));
                              setShowClientDropdown(false);
                              setClientSearch('');
                            }}
                            className="w-full p-3 text-left hover:bg-primary/5 border-b last:border-b-0"
                          >
                            <p className="font-medium text-sm">{c.name}</p>
                            <p className="text-xs text-gray-500">
                              {c.code} · {c.phone || 'N/A'}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quantité et prix */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-primary" />
              <h2 className="font-bold">Quantité et prix</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2">
                  Quantité <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className="input input-bordered input-lg w-full text-lg font-bold"
                  value={form.quantite}
                  onChange={(e) => handleChange('quantite', e.target.value)}
                  required
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {[1, 2, 3, 4, 5, 10].map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleChange('quantite', String(q))}
                      className="btn btn-sm btn-outline"
                    >
                      x{q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold block mb-2">
                    Prix (FCFA) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input input-bordered w-full"
                    value={form.prix_unitaire}
                    onChange={(e) => handleChange('prix_unitaire', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-2">Remise (FCFA)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input input-bordered w-full"
                    value={form.remise}
                    onChange={(e) => handleChange('remise', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Paiement */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="font-bold">Mode de paiement</h2>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { value: 'cash', label: 'Espèces', icon: Banknote, color: 'text-success' },
                { value: 'carte', label: 'Carte', icon: CreditCard, color: 'text-info' },
                { value: 'mobile_money', label: 'Mobile', icon: Smartphone, color: 'text-warning' },
                { value: 'wallet', label: 'Wallet', icon: Wallet, color: 'text-secondary' },
                { value: 'credit', label: 'Crédit', icon: FileText, color: 'text-error' },
                { value: 'carte_carburant', label: 'Carburant', icon: CreditCard, color: 'text-primary' },
              ].map(method => {
                const Icon = method.icon;
                const isSelected = form.type_paiement === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => {
                      handleChange('type_paiement', method.value);
                      handleChange('est_paye', method.value !== 'credit');
                    }}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Icon className={`w-5 h-5 ${method.color}`} />
                      <span className="text-xs font-medium text-center leading-tight">
                        {method.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <label className="label cursor-pointer justify-start gap-3 p-0">
              <input
                type="checkbox"
                className="toggle toggle-success"
                checked={form.est_paye}
                onChange={(e) => handleChange('est_paye', e.target.checked)}
              />
              <span className="text-sm font-semibold">
                Payé immédiatement
              </span>
            </label>
          </div>

          {/* Notes compactes */}
          <div className="bg-white rounded-xl shadow-md p-3">
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="w-full flex items-center justify-between gap-2 text-left"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Notes</span>
                {form.notes && <span className="badge badge-primary badge-xs">1</span>}
              </div>
              <span className="text-xs text-gray-500">
                {showNotes ? 'Masquer' : 'Ajouter'}
              </span>
            </button>

            {showNotes && (
              <textarea
                className="textarea textarea-bordered w-full mt-3 text-sm"
                rows="3"
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Commentaires éventuels..."
                autoFocus
              />
            )}
          </div>
        </div>

        {/* ============ COLONNE 3 : Récapitulatif ============ */}
        <div className="flex flex-col gap-4 overflow-y-auto">

          <div className="bg-white rounded-xl shadow-lg p-5 border-t-4 border-primary">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Récapitulatif</h3>
            </div>

            <div className="space-y-2.5 text-sm">
              {selectedService ? (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 flex-shrink-0">Service</span>
                  <span className="font-medium text-right truncate">
                    {selectedService.nom}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 flex-shrink-0">Service</span>
                  <span className="text-gray-400 italic">Non sélectionné</span>
                </div>
              )}

              {selectedClient && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 flex-shrink-0">Client</span>
                  <span className="font-medium text-right truncate">
                    {selectedClient.name}
                  </span>
                </div>
              )}

              <div className="divider my-1"></div>

              <div className="flex justify-between">
                <span className="text-gray-500">Quantité</span>
                <span className="font-bold text-info">
                  x {form.quantite}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Prix unitaire</span>
                <span className="font-medium">
                  {formatNumber(form.prix_unitaire)} FCFA
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Montant brut</span>
                <span className="font-medium">{formatCurrency(montantBrut)}</span>
              </div>
              {parseFloat(form.remise || 0) > 0 && (
                <div className="flex justify-between text-error">
                  <span>Remise</span>
                  <span>- {formatCurrency(form.remise)}</span>
                </div>
              )}

              <div className="divider my-1"></div>

              <div className="flex justify-between items-center">
                <span className="font-bold">TOTAL</span>
                <span className="text-xl font-black text-success">
                  {formatCurrency(montantNet)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Statut</span>
                <span className={`badge badge-sm ${form.est_paye ? 'badge-success' : 'badge-warning'}`}>
                  {form.est_paye ? 'Payé' : 'En attente'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !form.service || !form.prix_unitaire}
              className="btn btn-primary w-full gap-2 mt-5"
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Save className="w-4 h-4" />
              )}
              Enregistrer la vente
            </button>
          </div>

          {/* Info service sélectionné */}
          {selectedService && (
            <div className="rounded-xl p-4 bg-info/10 border-l-4 border-info">
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-info">
                    Durée estimée
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    <strong>{selectedService.duree_estimee} min</strong> par unité
                    {form.quantite > 1 && (
                      <>
                        {' → '}
                        <strong>
                          {selectedService.duree_estimee * form.quantite} min total
                        </strong>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default VenteServiceForm;