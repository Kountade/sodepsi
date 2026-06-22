// src/components/stock/EntrepotDetails.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Warehouse, Edit, Trash2, CheckCircle, XCircle,
  Calendar, User, Phone, Mail, MapPin, Building2,
  Package, Boxes, TrendingUp, AlertCircle, RefreshCw
} from 'lucide-react';

const EntrepotDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchWarehouseDetails = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/warehouses/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setWarehouse(response.data);
      
      // Récupérer les stocks de l'entrepôt
      const stocksResponse = await AxiosInstance.get(`/warehouses/${id}/stocks/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setStocks(stocksResponse.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        showNotification('Entrepôt non trouvé', 'error');
        setTimeout(() => navigate('/entrepots'), 1500);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouseDetails();
  }, [id]);

  const handleDelete = async () => {
    try {
      const token = getToken();
      await AxiosInstance.delete(`/warehouses/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Entrepôt supprimé avec succès', 'success');
      setTimeout(() => navigate('/entrepots'), 1500);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
    setShowDeleteModal(false);
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'main': return 'Principal';
      case 'secondary': return 'Secondaire';
      case 'store': return 'Magasin';
      default: return 'Entrepôt';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'main': return <Building2 className="w-5 h-5 text-primary" />;
      case 'secondary': return <Warehouse className="w-5 h-5 text-secondary" />;
      case 'store': return <Package className="w-5 h-5 text-info" />;
      default: return <Warehouse className="w-5 h-5 text-primary" />;
    }
  };

  const getOccupancyColor = (current, capacity) => {
    if (!capacity) return 'text-success';
    const rate = (current / capacity) * 100;
    if (rate >= 90) return 'text-error';
    if (rate >= 70) return 'text-warning';
    return 'text-success';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement de l'entrepôt...</p>
        </div>
      </div>
    );
  }

  if (!warehouse) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cet entrepôt ?</p>
              <p className="font-semibold text-error mt-2">{warehouse.name}</p>
              {warehouse.current_occupancy > 0 && (
                <p className="text-warning text-sm mt-2">⚠️ Stock actuel: {warehouse.current_occupancy} unités</p>
              )}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/entrepots')} className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              {getTypeIcon(warehouse.type)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{warehouse.name}</h1>
              <p className="text-sm text-gray-500">Code: {warehouse.code}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/entrepots/${id}/modifier`)} className="btn btn-primary btn-sm gap-2">
            <Edit className="w-4 h-4" /> Modifier
          </button>
          <button onClick={() => setShowDeleteModal(true)} className="btn btn-error btn-sm gap-2">
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
          <button onClick={fetchWarehouseDetails} className="btn btn-ghost btn-sm btn-circle">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Type</p>
              <p className="text-xl font-bold text-primary">{getTypeLabel(warehouse.type)}</p>
            </div>
            {getTypeIcon(warehouse.type)}
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Occupation</p>
              <p className={`text-xl font-bold ${getOccupancyColor(warehouse.current_occupancy || 0, warehouse.capacity)}`}>
                {warehouse.current_occupancy || 0}
              </p>
            </div>
            <Boxes className="w-8 h-8 text-primary/20" />
          </div>
          {warehouse.capacity && (
            <p className="text-xs text-gray-400 mt-1">Capacité: {warehouse.capacity}</p>
          )}
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Responsable</p>
              <p className="text-lg font-semibold truncate">{warehouse.manager || 'Non défini'}</p>
            </div>
            <User className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Statut</p>
              <div className="mt-1">
                {warehouse.is_active ? (
                  <span className="badge badge-success gap-1"><CheckCircle className="w-3 h-3" /> Actif</span>
                ) : (
                  <span className="badge badge-error gap-1"><XCircle className="w-3 h-3" /> Inactif</span>
                )}
              </div>
            </div>
            <CheckCircle className="w-8 h-8 text-gray-300" />
          </div>
        </div>
      </div>

      {/* Informations détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations générales */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Informations générales
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Nom</p>
                <p className="font-medium">{warehouse.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Code</p>
                <p className="font-mono text-sm">{warehouse.code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-sm">{getTypeLabel(warehouse.type)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date création</p>
                <p className="text-sm">{new Date(warehouse.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Responsable</p>
                <p className="text-sm">{warehouse.manager || 'Non défini'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> Contact
            </h3>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{warehouse.phone || 'Non défini'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{warehouse.email || 'Non défini'}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm">{warehouse.address}</p>
                <p className="text-sm text-gray-500">{warehouse.city}, {warehouse.country}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Capacité */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Capacité
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Occupation actuelle</span>
                <span className="font-semibold">{warehouse.current_occupancy || 0} unités</span>
              </div>
              {warehouse.capacity && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Capacité maximale</span>
                    <span className="font-semibold">{warehouse.capacity} unités</span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getOccupancyColor(warehouse.current_occupancy || 0, warehouse.capacity)}`}
                        style={{ width: `${((warehouse.current_occupancy || 0) / warehouse.capacity) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Taux d'occupation: {((warehouse.current_occupancy || 0) / warehouse.capacity * 100).toFixed(1)}%
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {warehouse.notes && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" /> Notes
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">{warehouse.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stocks dans l'entrepôt */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Stocks dans l'entrepôt
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Produit</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Quantité</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Stock min</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Statut</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stocks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-16">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucun stock dans cet entrepôt</p>
                  </td>
                </tr>
              ) : (
                stocks.map(stock => (
                  <tr key={stock.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{stock.product_name}</p>
                          <p className="text-xs text-gray-500">{stock.product_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center font-semibold">{stock.quantity}</td>
                    <td className="px-6 py-3 text-center">{stock.min_stock || 0}</td>
                    <td className="px-6 py-3 text-center">
                      {stock.is_low_stock ? (
                        <span className="badge badge-warning">Stock faible</span>
                      ) : (
                        <span className="badge badge-success">Normal</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button onClick={() => navigate(`/produits/${stock.product}`)} className="btn btn-sm btn-ghost">
                        Voir produit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EntrepotDetails;