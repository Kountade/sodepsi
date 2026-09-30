// src/components/station/VentesServicesList.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Search, RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight, Wrench, Droplet,
  Sparkles, Zap, Activity, TrendingUp, CreditCard, Banknote,
  Smartphone, Wallet, FileText, User, Clock, Award,
  DollarSign, Trash2, Calendar, Hash
} from 'lucide-react';

const VentesServicesList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // États
  const [ventes, setVentes] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState(searchParams.get('service') || 'all');
  const [paiementFilter, setPaiementFilter] = useState('all');
  const [payeFilter, setPayeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [venteToDelete, setVenteToDelete] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    totalMontant: 0,
    totalPayees: 0,
    totalImpayees: 0,
    montantImpaye: 0,
    ticketMoyen: 0,
    topService: null,
  });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');
  const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(parseFloat(n || 0));
  const formatCurrency = (n) => new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XOF'
  }).format(parseFloat(n || 0)).replace('XOF', 'FCFA');
  const formatDate = (d) => d ? new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '';

  // Configuration des types de service
  const TYPE_ICONS = {
    lavage_manuel: Droplet,
    lavage_auto: Sparkles,
    gonflage: Zap,
    vidange: Droplet,
    graissage: Wrench,
    autre: Activity,
  };

  // Charger les données de référence
  const fetchRefData = async () => {
    try {
      const token = getToken();
      const [servicesRes, clientsRes] = await Promise.all([
        AxiosInstance.get('/services/', {
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
    } catch (e) { console.error(e); }
  };

  // Charger les ventes
  const fetchVentes = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();

      if (serviceFilter !== 'all') params.append('service', serviceFilter);
      if (paiementFilter !== 'all') params.append('type_paiement', paiementFilter);
      if (payeFilter === 'paye') params.append('est_paye', 'true');
      if (payeFilter === 'impaye') params.append('est_paye', 'false');
      if (dateFrom) params.append('date_debut', dateFrom);
      if (dateTo) params.append('date_fin', dateTo);

      let url = '/ventes-services/';
      if (params.toString()) url += `?${params.toString()}`;

      const res = await AxiosInstance.get(url, {
        headers: { Authorization: `Token ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setVentes(data);

      // Stats
      const totalMontant = data.reduce((s, v) => s + parseFloat(v.montant_net || 0), 0);
      const totalPayees = data.filter(v => v.est_paye).length;
      const totalImpayees = data.filter(v => !v.est_paye).length;
      const montantImpaye = data
        .filter(v => !v.est_paye)
        .reduce((s, v) => s + parseFloat(v.montant_net || 0), 0);

      // Trouver le top service
      const parService = {};
      data.forEach(v => {
        const sid = v.service;
        parService[sid] = (parService[sid] || 0) + parseFloat(v.montant_net || 0);
      });
      const topServiceId = Object.keys(parService).sort((a, b) => parService[b] - parService[a])[0];
      const topService = topServiceId
        ? {
            id: topServiceId,
            nom: services.find(s => String(s.id) === String(topServiceId))?.nom || '—',
            montant: parService[topServiceId],
          }
        : null;

      setStats({
        total: data.length,
        totalMontant,
        totalPayees,
        totalImpayees,
        montantImpaye,
        ticketMoyen: data.length > 0 ? totalMontant / data.length : 0,
        topService,
      });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefData();
  }, []);

  useEffect(() => {
    fetchVentes();
    setCurrentPage(1);
  }, [serviceFilter, paiementFilter, payeFilter, dateFrom, dateTo]);

  // Recherche locale
  const filteredVentes = useMemo(() => {
    if (!searchTerm) return ventes;
    const q = searchTerm.toLowerCase();
    return ventes.filter(v => {
      const service = services.find(s => s.id === v.service);
      const client = clients.find(c => c.id === v.client);
      return (
        (v.numero_vente || '').toLowerCase().includes(q) ||
        (service?.nom || '').toLowerCase().includes(q) ||
        (service?.code || '').toLowerCase().includes(q) ||
        (client?.name || '').toLowerCase().includes(q) ||
        (client?.code || '').toLowerCase().includes(q)
      );
    });
  }, [ventes, services, clients, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredVentes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVentes = filteredVentes.slice(startIndex, startIndex + itemsPerPage);

  // Helpers
  const getServiceInfo = (id) => services.find(s => s.id === id);
  const getClientInfo = (id) => clients.find(c => c.id === id);

  const getServiceIcon = (type) => TYPE_ICONS[type] || Wrench;

  const getPaiementBadge = (type) => {
    const configs = {
      cash: { label: 'Espèces', cls: 'badge-success', icon: Banknote },
      carte: { label: 'Carte', cls: 'badge-info', icon: CreditCard },
      mobile_money: { label: 'Mobile', cls: 'badge-warning', icon: Smartphone },
      carte_carburant: { label: 'Carte carb.', cls: 'badge-primary', icon: CreditCard },
      wallet: { label: 'Wallet', cls: 'badge-secondary', icon: Wallet },
      credit: { label: 'Crédit', cls: 'badge-error', icon: FileText },
    };
    const c = configs[type] || { label: type, cls: 'badge-ghost', icon: CreditCard };
    const Icon = c.icon;
    return <span className={`badge ${c.cls} badge-sm gap-1`}><Icon className="w-3 h-3" />{c.label}</span>;
  };

  const handleDelete = async () => {
    if (!venteToDelete) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/ventes-services/${venteToDelete.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Vente supprimée', 'success');
      setShowDeleteModal(false);
      setVenteToDelete(null);
      fetchVentes();
    } catch (err) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setServiceFilter('all');
    setPaiementFilter('all');
    setPayeFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm || serviceFilter !== 'all' || paiementFilter !== 'all' ||
    payeFilter !== 'all' || dateFrom || dateTo;

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

      {/* Modal Suppression */}
      {showDeleteModal && venteToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette vente ?</p>
              <p className="font-semibold text-error mt-2">{venteToDelete.numero_vente}</p>
              <p className="text-sm text-gray-500 mt-1">
                Montant : {formatCurrency(venteToDelete.montant_net)}
              </p>
            </div>
            <div className="flex gap-3 p-4 bg-gray-50">
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)}>Annuler</button>
              <button className="btn btn-error flex-1 gap-2" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Wrench className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Ventes de services
              </h1>
              <p className="text-sm text-gray-500">
                Historique des ventes de services – {stats.total} vente(s)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchVentes} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button
              onClick={() => navigate('/ventes-services/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
            >
              <Plus className="w-4 h-4" /> Nouvelle vente
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total ventes</p>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
            </div>
            <Wrench className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Chiffre d'affaires</p>
              <p className="text-lg font-bold text-success">
                {formatCurrency(stats.totalMontant)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-info">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Ticket moyen</p>
              <p className="text-lg font-bold text-info">
                {formatCurrency(stats.ticketMoyen)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Impayés</p>
              <p className="text-lg font-bold text-warning">
                {formatCurrency(stats.montantImpaye)}
              </p>
              <p className="text-[10px] text-gray-500">
                {stats.totalImpayees} vente(s)
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-warning/20" />
          </div>
        </div>
      </div>

      {/* Meilleur service */}
      {stats.topService && (
        <div className="bg-gradient-to-r from-warning/10 via-warning/5 to-transparent rounded-xl p-4 border-l-4 border-warning">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium">Service le plus vendu</p>
              <p className="text-lg font-bold text-warning">{stats.topService.nom}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">CA généré</p>
              <p className="text-xl font-black text-warning">
                {formatCurrency(stats.topService.montant)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par N° vente, service, client..."
                className="input input-bordered w-full pl-9"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'} gap-2 lg:hidden`}
            >
              <Filter className="w-4 h-4" />
              Filtres
              {hasActiveFilters && <span className="badge badge-error badge-xs">!</span>}
            </button>
          </div>

          <div className={`${showFilters ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3`}>
            <select
              className="select select-bordered w-full"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            >
              <option value="all">Tous les services</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.nom} ({s.code})</option>
              ))}
            </select>

            <select
              className="select select-bordered w-full"
              value={paiementFilter}
              onChange={(e) => setPaiementFilter(e.target.value)}
            >
              <option value="all">Tous les paiements</option>
              <option value="cash">Espèces</option>
              <option value="carte">Carte</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="wallet">Wallet</option>
              <option value="credit">Crédit</option>
            </select>

            <select
              className="select select-bordered w-full"
              value={payeFilter}
              onChange={(e) => setPayeFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="paye">Payées</option>
              <option value="impaye">Impayées</option>
            </select>

            <input
              type="date"
              className="input input-bordered w-full"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />

            <input
              type="date"
              className="input input-bordered w-full"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="btn btn-outline btn-sm gap-2 self-start"
            >
              <RefreshCw className="w-4 h-4" /> Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-gray-500 mt-4">Chargement des ventes...</p>
          </div>
        ) : paginatedVentes.length === 0 ? (
          <div className="py-16 text-center">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-2">Aucune vente trouvée</p>
            {hasActiveFilters ? (
              <button onClick={resetFilters} className="btn btn-sm btn-outline gap-2">
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
            ) : (
              <button
                onClick={() => navigate('/ventes-services/nouveau')}
                className="btn btn-primary btn-sm gap-2"
              >
                <Plus className="w-4 h-4" /> Nouvelle vente
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th>N° Vente</th>
                    <th>Service</th>
                    <th className="hidden md:table-cell">Client</th>
                    <th className="hidden lg:table-cell">Date</th>
                    <th className="text-center">Qté</th>
                    <th className="text-right">Montant</th>
                    <th className="text-center">Paiement</th>
                    <th className="text-center">Statut</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVentes.map(v => {
                    const service = getServiceInfo(v.service);
                    const client = getClientInfo(v.client);
                    const ServiceIcon = getServiceIcon(service?.type_service);
                    return (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{v.numero_vente}</p>
                              <p className="text-xs text-gray-500 hidden md:block">
                                {formatDate(v.date_vente)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                              <ServiceIcon className="w-4 h-4 text-info" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">
                                {service?.nom || `Service #${v.service}`}
                              </p>
                              <p className="text-xs text-gray-500">{service?.code || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell">
                          {client ? (
                            <div className="flex items-center gap-1 text-sm">
                              <User className="w-3 h-3 text-gray-400" />
                              <span>{client.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Client anonyme</span>
                          )}
                        </td>
                        <td className="hidden lg:table-cell text-sm text-gray-600">
                          {formatDate(v.date_vente)}
                        </td>
                        <td className="text-center font-semibold">
                          {v.quantite}
                        </td>
                        <td className="text-right font-bold text-success">
                          {formatCurrency(v.montant_net)}
                        </td>
                        <td className="text-center">
                          {getPaiementBadge(v.type_paiement)}
                        </td>
                        <td className="text-center">
                          <span className={`badge badge-sm ${
                            v.est_paye ? 'badge-success' : 'badge-warning'
                          }`}>
                            {v.est_paye ? 'Payé' : 'En attente'}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => navigate(`/ventes-services/${v.id}`)}
                              className="btn btn-ghost btn-sm btn-circle"
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setVenteToDelete(v); setShowDeleteModal(true); }}
                              className="btn btn-ghost btn-sm btn-circle text-error"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredVentes.length)}
                </span>{' '}
                sur <span className="font-medium">{filteredVentes.length}</span> vente(s)
              </div>

              <div className="flex items-center gap-3">
                <select
                  className="select select-bordered select-sm"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value="10">10 lignes</option>
                  <option value="20">20 lignes</option>
                  <option value="50">50 lignes</option>
                  <option value="100">100 lignes</option>
                </select>

                <div className="join">
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="join-item btn btn-sm no-animation">
                    {currentPage} / {totalPages || 1}
                  </button>
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VentesServicesList;