// src/components/station/VenteCarburantForm.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Fuel, Server, Droplet, Save, X,
  CheckCircle, AlertCircle, User, CreditCard, Wallet,
  Banknote, Smartphone, FileText, AlertTriangle,
  Calculator, Users, Building2, Plus, Search
} from 'lucide-react';

const VenteCarburantForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [pompes, setPompes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    pompe: searchParams.get('pompe') || '',
    client: '',
    type_vente: 'client',
    quantite: '',
    prix_unitaire: '',
    remise: 0,
    type_paiement: 'cash',
    reference_paiement: '',
    est_paye: true,
    notes: '',
  });

  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showNotes, setShowNotes] = useState(false); // ✅ Notes cachées par défaut

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');
  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(parseFloat(n || 0));
  const formatCurrency = (n) => new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XOF'
  }).format(parseFloat(n || 0)).replace('XOF', 'FCFA');

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const [pompesRes, clientsRes] = await Promise.all([
          AxiosInstance.get('/pompes/', {
            headers: { Authorization: `Token ${token}` }
          }).catch(() => ({ data: [] })),
          AxiosInstance.get('/clients/', {
            headers: { Authorization: `Token ${token}` }
          }).catch(() => ({ data: [] })),
        ]);

        const pompesData = Array.isArray(pompesRes.data)
          ? pompesRes.data
          : (pompesRes.data.results || []);
        const clientsData = Array.isArray(clientsRes.data)
          ? clientsRes.data
          : (clientsRes.data.results || []);

        setPompes(pompesData.filter(p => p.est_disponible));
        setClients(clientsData);

        const pid = searchParams.get('pompe');
        if (pid) {
          const found = pompesData.find(p => String(p.id) === String(pid));
          if (found) {
            setForm(prev => ({
              ...prev,
              pompe: String(found.id),
              prix_unitaire: String(found.prix_litre || ''),
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

  const selectedPompe = useMemo(
    () => pompes.find(p => String(p.id) === String(form.pompe)),
    [pompes, form.pompe]
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

  useEffect(() => {
    if (selectedPompe && !form.prix_unitaire) {
      setForm(prev => ({
        ...prev,
        prix_unitaire: String(selectedPompe.prix_litre || ''),
      }));
    }
  }, [selectedPompe]);

  const montantBrut = useMemo(
    () => parseFloat(form.quantite || 0) * parseFloat(form.prix_unitaire || 0),
    [form.quantite, form.prix_unitaire]
  );

  const montantNet = useMemo(
    () => Math.max(0, montantBrut - parseFloat(form.remise || 0)),
    [montantBrut, form.remise]
  );

  const quantiteDisponible = useMemo(() => {
    if (!selectedPompe?.cuve_details) return null;
    return parseFloat(selectedPompe.cuve_details.niveau_actuel || 0);
  }, [selectedPompe]);

  const stockInsuffisant = useMemo(() => {
    if (quantiteDisponible === null) return false;
    return parseFloat(form.quantite || 0) > quantiteDisponible;
  }, [form.quantite, quantiteDisponible]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (form.type_vente === 'client' && !form.client) {
      showNotification('Veuillez sélectionner un client', 'error');
      return;
    }
    if (!form.pompe) {
      showNotification('Veuillez sélectionner une pompe', 'error');
      return;
    }
    if (!form.quantite || parseFloat(form.quantite) <= 0) {
      showNotification('Quantité invalide', 'error');
      return;
    }
    if (stockInsuffisant) {
      showNotification(`Stock insuffisant (${formatNumber(quantiteDisponible)} L)`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      const payload = {
        pompe: parseInt(form.pompe),
        client: form.type_vente === 'client' && form.client ? parseInt(form.client) : null,
        type_vente: form.type_vente,
        quantite: parseFloat(form.quantite),
        prix_unitaire: parseFloat(form.prix_unitaire),
        remise: parseFloat(form.remise || 0),
        type_paiement: form.type_paiement,
        reference_paiement: form.reference_paiement || '',
        est_paye: form.est_paye,
        notes: form.notes || '',
      };

      const res = await AxiosInstance.post('/ventes-carburant/', payload, {
        headers: { Authorization: `Token ${token}` }
      });

      showNotification(
        `✅ Vente ${res.data.numero_vente} enregistrée (${formatCurrency(res.data.montant_net)})`,
        'success'
      );
      setTimeout(() => navigate('/ventes-carburant'), 1500);
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
      pompe: '', client: '', type_vente: 'client',
      quantite: '', prix_unitaire: '', remise: 0,
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
            onClick={() => navigate('/ventes-carburant')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 bg-success/10 rounded-xl">
            <Fuel className="w-6 h-6 text-success" />
          </div>
          <div>
            <h1 className="text-xl font-black text-primary leading-tight">
              Nouvelle vente de carburant
            </h1>
            <p className="text-sm text-gray-500 leading-tight">
              Enregistrez une vente sur une pompe
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
            onClick={() => navigate('/ventes-carburant')}
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
        {/* ============ COLONNE 1 : Type + Client + Pompe ============ */}
        <div className="flex flex-col gap-4 overflow-y-auto">

          {/* Type de vente + Client */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-bold">Type de vente</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => handleChange('type_vente', 'client')}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  form.type_vente === 'client'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-gray-200 hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">Client</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleChange('type_vente', 'interne')}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  form.type_vente === 'interne'
                    ? 'border-warning bg-warning/5 shadow-sm'
                    : 'border-gray-200 hover:border-warning/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-warning" />
                  <span className="font-semibold text-sm">Interne</span>
                </div>
              </button>
            </div>

            {/* Client */}
            {form.type_vente === 'client' && (
              <>
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
              </>
            )}
          </div>

          {/* Pompe */}
          <div className="bg-white rounded-xl shadow-md p-4 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-5 h-5 text-primary" />
              <h2 className="font-bold">Sélectionner une pompe</h2>
              <span className="badge badge-primary badge-sm ml-auto">{pompes.length}</span>
            </div>

            {pompes.length === 0 ? (
              <div className="text-center py-6">
                <Server className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm mb-3">Aucune pompe disponible</p>
                <button
                  type="button"
                  onClick={() => navigate('/pompes/nouveau')}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Plus className="w-4 h-4" /> Créer une pompe
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1">
                {pompes.map(p => {
                  const isSelected = String(form.pompe) === String(p.id);
                  const cuveNiveau = p.cuve_details?.niveau_actuel || 0;
                  const enAlerte = p.cuve_details?.est_en_alerte;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        handleChange('pompe', String(p.id));
                        handleChange('prix_unitaire', String(p.prix_litre || ''));
                      }}
                      className={`text-left p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            enAlerte ? 'bg-error/10' : 'bg-success/10'
                          }`}>
                            <Server className={`w-4 h-4 ${enAlerte ? 'text-error' : 'text-success'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{p.nom}</p>
                            <p className="text-xs text-gray-500">{p.code}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />}
                      </div>

                      <div className="flex items-center gap-1 text-xs mb-1">
                        <Fuel className="w-3 h-3 text-primary" />
                        <span className="font-semibold text-primary">
                          {formatNumber(p.prix_litre)} FCFA/L
                        </span>
                      </div>

                      {p.cuve_details && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Droplet className="w-3 h-3" />
                          <span className="truncate">
                            {formatNumber(cuveNiveau)} L
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============ COLONNE 2 : Quantité + Paiement ============ */}
        <div className="flex flex-col gap-4 overflow-y-auto">

          {/* Quantité et prix */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-primary" />
              <h2 className="font-bold">Quantité et prix</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold">
                    Quantité (L) <span className="text-error">*</span>
                  </label>
                  {quantiteDisponible !== null && (
                    <span className="text-xs text-gray-500">
                      Disponible : {formatNumber(quantiteDisponible)} L
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className={`input input-bordered input-lg w-full text-lg font-bold ${
                    stockInsuffisant ? 'input-error' : ''
                  }`}
                  value={form.quantite}
                  onChange={(e) => handleChange('quantite', e.target.value)}
                  placeholder="0"
                  required
                />
                {stockInsuffisant && (
                  <span className="text-error text-xs flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3" /> Quantité supérieure au stock
                  </span>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {[5, 10, 20, 30, 50, 100].map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleChange('quantite', String(q))}
                      className="btn btn-sm btn-outline"
                    >
                      {q}L
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold block mb-2">
                    Prix/L (FCFA) <span className="text-error">*</span>
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
                { value: 'carte_carburant', label: 'Carburant', icon: CreditCard, color: 'text-primary' },
                { value: 'wallet', label: 'Wallet', icon: Wallet, color: 'text-secondary' },
                { value: 'credit', label: 'Crédit', icon: FileText, color: 'text-error' },
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

            {form.type_paiement !== 'cash' && form.type_paiement !== 'credit' && (
              <div className="mb-3">
                <label className="text-sm font-semibold block mb-2">
                  Référence paiement
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={form.reference_paiement}
                  onChange={(e) => handleChange('reference_paiement', e.target.value)}
                  placeholder="N° transaction, N° chèque, etc."
                />
              </div>
            )}

            <label className="label cursor-pointer justify-start gap-3 p-0">
              <input
                type="checkbox"
                className="toggle toggle-success"
                checked={form.est_paye}
                onChange={(e) => handleChange('est_paye', e.target.checked)}
              />
              <span className="text-sm font-semibold">
                Vente payée immédiatement
              </span>
            </label>
          </div>

          {/* Notes compactes — bouton toggle */}
          <div className="bg-white rounded-xl shadow-md p-3">
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="w-full flex items-center justify-between gap-2 text-left"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Notes</span>
                {form.notes && (
                  <span className="badge badge-primary badge-xs">1</span>
                )}
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
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="badge badge-primary badge-sm">
                  {form.type_vente === 'client' ? 'Client' : 'Interne'}
                </span>
              </div>

              {selectedClient && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 flex-shrink-0">Client</span>
                  <span className="font-medium text-right truncate">
                    {selectedClient.name}
                  </span>
                </div>
              )}

              {selectedPompe && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 flex-shrink-0">Pompe</span>
                  <span className="font-medium text-right truncate">
                    {selectedPompe.nom}
                  </span>
                </div>
              )}

              {selectedPompe?.cuve_details && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 flex-shrink-0">Cuve</span>
                  <span className="font-medium text-right truncate text-xs">
                    {selectedPompe.cuve_details.nom}
                  </span>
                </div>
              )}

              <div className="divider my-1"></div>

              <div className="flex justify-between">
                <span className="text-gray-500">Quantité</span>
                <span className="font-bold text-info">
                  {formatNumber(form.quantite)} L
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Prix unitaire</span>
                <span className="font-medium">
                  {formatNumber(form.prix_unitaire)} FCFA/L
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
              disabled={submitting || stockInsuffisant || !form.pompe || !form.quantite}
              className="btn btn-success w-full gap-2 mt-5"
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Save className="w-4 h-4" />
              )}
              Enregistrer la vente
            </button>
          </div>

          {/* Alerte cuve */}
          {selectedPompe?.cuve_details && (
            <div className={`rounded-xl p-4 ${
              selectedPompe.cuve_details.est_en_alerte
                ? 'bg-error/10 border-l-4 border-error'
                : 'bg-info/10 border-l-4 border-info'
            }`}>
              <div className="flex items-start gap-2">
                {selectedPompe.cuve_details.est_en_alerte
                  ? <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                  : <Droplet className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${
                    selectedPompe.cuve_details.est_en_alerte ? 'text-error' : 'text-info'
                  }`}>
                    {selectedPompe.cuve_details.est_en_alerte ? 'Cuve en alerte' : 'État de la cuve'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    <strong>{formatNumber(selectedPompe.cuve_details.niveau_actuel)} L</strong>
                    {' / '}
                    {formatNumber(selectedPompe.cuve_details.capacite_max)} L
                    {' · '}
                    {selectedPompe.cuve_details.taux_remplissage?.toFixed(0)}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        selectedPompe.cuve_details.est_en_alerte ? 'bg-error' :
                        selectedPompe.cuve_details.taux_remplissage < 50 ? 'bg-warning' : 'bg-success'
                      }`}
                      style={{ width: `${Math.min(selectedPompe.cuve_details.taux_remplissage || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default VenteCarburantForm;