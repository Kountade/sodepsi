// src/components/stocks/InventaireDetails.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, ClipboardList, Warehouse, Calendar, Clock,
  CheckCircle, XCircle, RefreshCw, Edit, Trash2,
  PlayCircle, CheckSquare, Download, Printer,
  AlertCircle, Loader2, Search, Filter,
  ChevronLeft, ChevronRight, FileText, User,
  DollarSign, TrendingUp, AlertTriangle, Package
} from 'lucide-react';

const InventaireDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [inventory, setInventory] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [notification, setNotification] = useState(null);
  const [editingLine, setEditingLine] = useState(null);
  const [editValue, setEditValue] = useState('');

  const getToken = () => localStorage.getItem('Token');

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/inventories/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setInventory(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLines = async () => {
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/inventories/${id}/lines/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setLines(response.data || []);
    } catch (error) {
      console.error('Erreur chargement lignes:', error);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchLines();
  }, [id]);

  const handleStart = async () => {
    try {
      const token = getToken();
      await AxiosInstance.post(`/inventories/${id}/start/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Inventaire démarré avec succès', 'success');
      fetchInventory();
      fetchLines();
    } catch (error) {
      showNotification('Erreur lors du démarrage', 'error');
    }
  };

  const handleComplete = async () => {
    try {
      const token = getToken();
      await AxiosInstance.post(`/inventories/${id}/complete/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Inventaire terminé avec succès', 'success');
      fetchInventory();
      fetchLines();
    } catch (error) {
      showNotification('Erreur lors de la finalisation', 'error');
    }
  };

  const handleUpdateLine = async (lineId, actualQuantity) => {
    setUpdating(true);
    try {
      const token = getToken();
      await AxiosInstance.put(`/inventories/${id}/update_line/`, {
        line_id: lineId,
        actual_quantity: actualQuantity
      }, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Ligne mise à jour', 'success');
      fetchLines();
      setEditingLine(null);
      setEditValue('');
    } catch (error) {
      showNotification('Erreur lors de la mise à jour', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleApplyAdjustments = async () => {
    try {
      const token = getToken();
      await AxiosInstance.post(`/inventories/${id}/apply_adjustments/`, {}, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Ajustements appliqués avec succès', 'success');
      fetchInventory();
      fetchLines();
    } catch (error) {
      showNotification('Erreur lors de l\'application des ajustements', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      planned: { label: 'Planifié', className: 'badge-info', icon: Calendar },
      in_progress: { label: 'En cours', className: 'badge-warning', icon: Clock },
      completed: { label: 'Terminé', className: 'badge-success', icon: CheckCircle },
      cancelled: { label: 'Annulé', className: 'badge-error', icon: XCircle },
      verified: { label: 'Vérifié', className: 'badge-primary', icon: CheckSquare }
    };
    const config = configs[status] || { label: status, className: 'badge-ghost', icon: Package };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.className} gap-1`}>
        <Icon className="w-3 h-3" /> {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 FCFA';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const filteredLines = lines.filter(line => {
    const search = searchTerm.toLowerCase();
    return (line.product_name?.toLowerCase() || '').includes(search) ||
           (line.product_code?.toLowerCase() || '').includes(search) ||
           (line.lot_number?.toLowerCase() || '').includes(search);
  });

  const totalPages = Math.ceil(filteredLines.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLines = filteredLines.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
          <p className="text-base font-medium text-gray-500">Chargement de l'inventaire...</p>
        </div>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-20 h-20 text-error mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Inventaire non trouvé</h2>
          <button onClick={() => navigate('/inventaire')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(null)}>
              <XCircle className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/inventaire')} className="btn btn-ghost btn-sm gap-2">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/15 rounded-xl">
                  <ClipboardList className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{inventory.name}</h1>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Warehouse className="w-4 h-4" /> {inventory.warehouse_name}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Actions selon le statut */}
              {inventory.status === 'planned' && (
                <>
                  <button
                    onClick={() => navigate(`/inventaire/${id}/modifier`)}
                    className="btn btn-sm btn-outline gap-2"
                  >
                    <Edit className="w-4 h-4" /> Modifier
                  </button>
                  <button
                    onClick={handleStart}
                    className="btn btn-sm btn-success gap-2"
                  >
                    <PlayCircle className="w-4 h-4" /> Démarrer
                  </button>
                </>
              )}
              
              {inventory.status === 'in_progress' && (
                <>
                  <button
                    onClick={handleApplyAdjustments}
                    className="btn btn-sm btn-warning gap-2"
                  >
                    <CheckSquare className="w-4 h-4" /> Appliquer ajustements
                  </button>
                  <button
                    onClick={handleComplete}
                    className="btn btn-sm btn-success gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Terminer
                  </button>
                </>
              )}
              
              {(inventory.status === 'completed' || inventory.status === 'verified') && (
                <button
                  className="btn btn-sm btn-primary gap-2"
                >
                  <Download className="w-4 h-4" /> Rapport PDF
                </button>
              )}
              
              <button onClick={fetchInventory} className="btn btn-ghost btn-sm btn-square">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Cartes d'information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Statut</p>
                {getStatusBadge(inventory.status)}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <Calendar className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Date début</p>
                <p className="font-semibold text-sm">{formatDate(inventory.start_date)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Date fin</p>
                <p className="font-semibold text-sm">{inventory.end_date ? formatDate(inventory.end_date) : '—'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Écart</p>
                <p className={`font-semibold text-sm ${inventory.total_difference > 0 ? 'text-success' : inventory.total_difference < 0 ? 'text-error' : 'text-gray-600'}`}>
                  {inventory.total_difference > 0 ? '+' : ''}{formatCurrency(inventory.total_difference)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques détaillées */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Valeur théorique</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(inventory.total_expected_value)}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Valeur réelle</p>
                <p className="text-xl font-bold text-success">{formatCurrency(inventory.total_actual_value)}</p>
              </div>
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Nombre de produits</p>
                <p className="text-xl font-bold text-info">{lines.length}</p>
              </div>
              <div className="p-2 bg-info/10 rounded-lg">
                <Package className="w-5 h-5 text-info" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Lignes d'inventaire
            </h3>
          </div>
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  className="input input-bordered w-full pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                className="btn btn-outline gap-2"
                onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
              >
                <RefreshCw className="w-4 h-4" /> Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Tableau des lignes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Produit</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 hidden md:table-cell">Lot</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Théorique</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Réel</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Écart</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Valeur</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Statut</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLines.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-500">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                      Aucune ligne d'inventaire
                    </td>
                  </tr>
                ) : (
                  paginatedLines.map((line) => {
                    const diff = line.difference || 0;
                    const isEditing = editingLine === line.id;
                    
                    return (
                      <tr key={line.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{line.product_name}</p>
                          <p className="text-xs text-gray-400">{line.product_code}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm font-mono">{line.lot_number || '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-medium">{line.expected_quantity}</td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center gap-2 justify-center">
                              <input
                                type="number"
                                className="input input-bordered input-sm w-24"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                              />
                              <button
                                className="btn btn-success btn-xs"
                                onClick={() => handleUpdateLine(line.id, parseInt(editValue))}
                                disabled={updating}
                              >
                                {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'OK'}
                              </button>
                              <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => { setEditingLine(null); setEditValue(''); }}
                              >
                                <XCircle className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className={`font-semibold ${line.actual_quantity !== null ? 'text-gray-800' : 'text-gray-400'}`}>
                              {line.actual_quantity !== null ? line.actual_quantity : '—'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {line.actual_quantity !== null && (
                            <span className={`font-semibold ${diff === 0 ? 'text-gray-600' : diff > 0 ? 'text-success' : 'text-error'}`}>
                              {diff > 0 ? '+' : ''}{diff}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium">
                            {formatCurrency(line.expected_value)}
                          </span>
                          {line.value_difference !== 0 && (
                            <span className={`text-xs ml-2 ${line.value_difference > 0 ? 'text-success' : 'text-error'}`}>
                              ({line.value_difference > 0 ? '+' : ''}{formatCurrency(line.value_difference)})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {line.is_verified ? (
                            <span className="badge badge-success gap-1">
                              <CheckCircle className="w-3 h-3" /> Vérifié
                            </span>
                          ) : line.actual_quantity !== null ? (
                            <span className="badge badge-warning gap-1">
                              <AlertTriangle className="w-3 h-3" /> En attente
                            </span>
                          ) : (
                            <span className="badge badge-ghost gap-1">
                              <Clock className="w-3 h-3" /> À saisir
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredLines.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
              <div className="text-sm text-gray-500">
                Affichage de {startIndex + 1} à {Math.min(currentPage * itemsPerPage, filteredLines.length)} sur {filteredLines.length}
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="select select-bordered select-sm"
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                >
                  <option value="10">10 lignes</option>
                  <option value="20">20 lignes</option>
                  <option value="50">50 lignes</option>
                  <option value="100">100 lignes</option>
                </select>
                <div className="join">
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                    disabled={currentPage === 1 || totalPages === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="join-item btn btn-sm btn-disabled">
                    {totalPages > 0 ? `Page ${currentPage} / ${totalPages}` : 'Page 0'}
                  </span>
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventaireDetails;