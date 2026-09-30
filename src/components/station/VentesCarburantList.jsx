// src/components/station/VentesCarburantList.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  Plus, Search, RefreshCw, X, CheckCircle, AlertCircle,
  Eye, Filter, ChevronLeft, ChevronRight, Fuel, Server,
  Droplet, TrendingUp, CreditCard, Banknote, Smartphone,
  Wallet, FileText, Calendar, User, Award, BarChart3,
  Clock, Trash2, Edit
} from 'lucide-react';

const VentesCarburantList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // États principaux
  const [ventes, setVentes] = useState([]);
  const [pompes, setPompes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [pompeFilter, setPompeFilter] = useState(searchParams.get('pompe') || 'all');
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
    totalLitres: 0,
    totalMontant: 0,
    totalPayees: 0,
    totalImpayees: 0,
    montantImpaye: 0,
    ticketMoyen: 0,
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

  // Charger les pompes et clients pour filtres
  const fetchRefData = async () => {
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
      setPompes(pompesData);
      setClients(clientsData);
    } catch (e) {
      console.error(e);
    }
  };

  // Charger les ventes
  const fetchVentes = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();

      if (pompeFilter !== 'all') params.append('pompe', pompeFilter);
      if (paiementFilter !== 'all') params.append('type_paiement', paiementFilter);
      if (payeFilter === 'paye') params.append('est_paye', 'true');
      if (payeFilter === 'impaye') params.append('est_paye', 'false');
      if (dateFrom) params.append('date_debut', dateFrom);
      if (dateTo) params.append('date_fin', dateTo);

      let url = '/ventes-carburant/';
      if (params.toString()) url += `?${params.toString()}`;

      const res = await AxiosInstance.get(url, {
        headers: { Authorization: `Token ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setVentes(data);

      // Calculer les statistiques
      const totalLitres = data.reduce((s, v) => s + parseFloat(v.quantite || 0), 0);
      const totalMontant = data.reduce((s, v) => s + parseFloat(v.montant_net || 0), 0);
      const totalPayees = data.filter(v => v.est_paye).length;
      const totalImpayees = data.filter(v => !v.est_paye).length;
      const montantImpaye = data
        .filter(v => !v.est_paye)
        .reduce((s, v) => s + parseFloat(v.montant_net || 0), 0);

      setStats({
        total: data.length,
        totalLitres,
        totalMontant,
        totalPayees,
        totalImpayees,
        montantImpaye,
        ticketMoyen: data.length > 0 ? totalMontant / data.length : 0,
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
  }, [pompeFilter, paiementFilter, payeFilter, dateFrom, dateTo]);

  // Recherche locale
  const filteredVentes = useMemo(() => {
    if (!searchTerm) return ventes;
    const q = searchTerm.toLowerCase();
    return ventes.filter(v => {
      const pompe = pompes.find(p => p.id === v.pompe);
      const client = clients.find(c => c.id === v.client);
      return (
        (v.numero_vente || '').toLowerCase().includes(q) ||
        (v.reference_paiement || '').toLowerCase().includes(q) ||
        (pompe?.nom || '').toLowerCase().includes(q) ||
        (pompe?.code || '').toLowerCase().includes(q) ||
        (client?.name || '').toLowerCase().includes(q) ||
        (client?.code || '').toLowerCase().includes(q)
      );
    });
  }, [ventes, pompes, clients, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredVentes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVentes = filteredVentes.slice(startIndex, startIndex + itemsPerPage);

  // Helpers
  const getPompeInfo = (id) => pompes.find(p => p.id === id);
  const getClientInfo = (id) => clients.find(c => c.id === id);

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
      await AxiosInstance.delete(`/ventes-carburant/${venteToDelete.id}/`, {
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
    setPompeFilter('all');
    setPaiementFilter('all');
    setPayeFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm || pompeFilter !== 'all' || paiementFilter !== 'all' ||
    payeFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="space-y-4 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl max-w-md`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success'
                ? <CheckCircle className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium text-sm">{notification.message}</span>
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
              <button className="btn btn-ghost flex-1" onClick={() => setShowDeleteModal(false)}>
                Annuler
              </button>
              <button className="btn btn-error flex-1 gap-2" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-success/10 via-success/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-xl">
              <Fuel className="w-7 h-7 text-success" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                Ventes de carburant
              </h1>
              <p className="text-sm text-gray-500">
                Historique des ventes de carburant – {stats.total} vente(s)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchVentes} className="btn btn-sm sm:btn-md btn-outline gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button
              onClick={() => navigate('/ventes-carburant/nouveau')}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-success to-success/80 text-white border-none shadow-lg gap-2"
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
            <Fuel className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-3 border-l-4 border-info">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Litres vendus</p>
              <p className="text-xl font-bold text-info">
                {formatNumber(stats.totalLitres)} L
              </p>
            </div>
            <Droplet className="w-8 h-8 text-info/20" />
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

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par N° vente, pompe, client..."
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
              value={pompeFilter}
              onChange={(e) => setPompeFilter(e.target.value)}
            >
              <option value="all">Toutes les pompes</option>
              {pompes.map(p => (
                <option key={p.id} value={p.id}>{p.nom} ({p.code})</option>
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
              <option value="carte_carburant">Carte carburant</option>
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
            <Fuel className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-2">Aucune vente trouvée</p>
            {hasActiveFilters ? (
              <button onClick={resetFilters} className="btn btn-sm btn-outline gap-2">
                <RefreshCw className="w-4 h-4" /> Réinitialiser les filtres
              </button>
            ) : (
              <button
                onClick={() => navigate('/ventes-carburant/nouveau')}
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
                    <th>Pompe</th>
                    <th className="hidden md:table-cell">Client</th>
                    <th className="hidden lg:table-cell">Date</th>
                    <th className="text-right">Quantité</th>
                    <th className="text-right hidden lg:table-cell">Prix/L</th>
                    <th className="text-right">Montant</th>
                    <th className="text-center">Paiement</th>
                    <th className="text-center">Statut</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVentes.map(v => {
                    const pompe = getPompeInfo(v.pompe);
                    const client = getClientInfo(v.client);
                    return (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-success" />
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
                          <div className="flex items-center gap-1 text-sm">
                            <Server className="w-3 h-3 text-primary" />
                            <span className="font-medium">
                              {pompe?.nom || `Pompe #${v.pompe}`}
                            </span>
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
                        <td className="text-right font-semibold text-info">
                          {formatNumber(v.quantite)} L
                        </td>
                        <td className="text-right hidden lg:table-cell text-sm text-gray-600">
                          {formatNumber(v.prix_unitaire)} FCFA
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
                              onClick={() => navigate(`/ventes-carburant/${v.id}`)}
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

export default VentesCarburantList;