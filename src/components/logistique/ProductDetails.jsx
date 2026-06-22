// src/components/stock/ProductDetails.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Package, Edit, Trash2, CheckCircle, XCircle,
  Calendar, User, Code, Tag, DollarSign, Boxes, Clock,
  AlertTriangle, RefreshCw, Layers, Building2, Ruler
} from 'lucide-react';

const ProductDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/products/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setProduct(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        showNotification('Produit non trouvé', 'error');
        setTimeout(() => navigate('/produits'), 1500);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const handleDelete = async () => {
    try {
      const token = getToken();
      await AxiosInstance.delete(`/products/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Produit supprimé avec succès', 'success');
      setTimeout(() => navigate('/produits'), 1500);
    } catch (error) {
      console.error('Erreur suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
    setShowDeleteModal(false);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="badge badge-success gap-1"><CheckCircle className="w-3 h-3" /> Actif</span>;
      case 'inactive': return <span className="badge badge-error gap-1"><XCircle className="w-3 h-3" /> Inactif</span>;
      case 'out_of_stock': return <span className="badge badge-warning gap-1"><AlertTriangle className="w-3 h-3" /> Rupture</span>;
      default: return <span className="badge badge-ghost">{status}</span>;
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'standard': return 'Standard';
      case 'consignable': return 'Consignable';
      case 'expirable': return 'À durée limitée';
      case 'service': return 'Service';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification({ ...notification, show: false })}>
              ✕
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
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce produit ?</p>
              <p className="font-semibold text-error mt-2">{product.name}</p>
              {(product.current_stock || 0) > 0 && (
                <p className="text-warning text-sm mt-2">⚠️ Stock actuel: {product.current_stock} unités</p>
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
          <button onClick={() => navigate('/produits')} className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <p className="text-sm text-gray-500">Code: {product.code}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/produits/${id}/modifier`)} className="btn btn-primary btn-sm gap-2">
            <Edit className="w-4 h-4" /> Modifier
          </button>
          <button onClick={() => setShowDeleteModal(true)} className="btn btn-error btn-sm gap-2">
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
          <button onClick={fetchProductDetails} className="btn btn-ghost btn-sm btn-circle">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Stock actuel</p>
              <p className="text-2xl font-bold text-primary">{product.current_stock || 0}</p>
            </div>
            <Boxes className="w-8 h-8 text-primary/20" />
          </div>
          {product.min_stock > 0 && (
            <p className="text-xs text-gray-400 mt-1">Min: {product.min_stock}</p>
          )}
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Prix de vente</p>
              <p className="text-2xl font-bold text-success">{product.selling_price?.toLocaleString()} F</p>
            </div>
            <DollarSign className="w-8 h-8 text-success/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Prix d'achat</p>
              <p className="text-2xl font-bold text-info">{product.purchase_price?.toLocaleString()} F</p>
            </div>
            <Tag className="w-8 h-8 text-info/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Statut</p>
              <div className="mt-1">{getStatusBadge(product.status)}</div>
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
              <Package className="w-4 h-4 text-primary" /> Informations générales
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Nom</p>
                <p className="font-medium">{product.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Code</p>
                <p className="font-mono text-sm">{product.code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Code-barres</p>
                <p className="font-mono text-sm">{product.barcode || 'Non défini'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-sm">{getTypeLabel(product.type)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Catégorie</p>
                <p className="text-sm">{product.category_name || 'Non catégorisé'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unité</p>
                <p className="text-sm">{product.unit_symbol || 'Non défini'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date de création</p>
                <p className="text-sm">{new Date(product.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Dernière modification</p>
                <p className="text-sm">{new Date(product.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            {product.description && (
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-600">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Prix et stocks */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Prix et stocks
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Prix d'achat</p>
                <p className="font-semibold text-info">{product.purchase_price?.toLocaleString()} F</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Prix de vente</p>
                <p className="font-semibold text-success">{product.selling_price?.toLocaleString()} F</p>
              </div>
              {product.wholesale_price && (
                <div>
                  <p className="text-xs text-gray-500">Prix de gros</p>
                  <p className="text-sm">{product.wholesale_price?.toLocaleString()} F</p>
                </div>
              )}
              {product.promo_price && (
                <div>
                  <p className="text-xs text-gray-500">Prix promo</p>
                  <p className="text-sm text-warning">{product.promo_price?.toLocaleString()} F</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">TVA</p>
                <p className="text-sm">{product.tax_rate}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Marge</p>
                <p className="text-sm text-success">
                  {(((product.selling_price - product.purchase_price) / product.purchase_price) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 mb-2">Seuils de stock</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Stock minimum</p>
                  <p className="font-medium">{product.min_stock || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Stock maximum</p>
                  <p className="font-medium">{product.max_stock || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Point de commande</p>
                  <p className="font-medium">{product.reorder_point || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Quantité de réappro</p>
                  <p className="font-medium">{product.reorder_quantity || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gestion d'expiration */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Date d'expiration
            </h3>
          </div>
          <div className="p-6">
            {product.has_expiry ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-4 h-4" />
                  <span>Ce produit a une date d'expiration</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-500">Durée de conservation</p>
                    <p className="font-medium">{product.shelf_life_days} jours</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Alerte avant expiration</p>
                    <p className="font-medium">{product.alert_days} jours</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-500">
                <XCircle className="w-4 h-4" />
                <span>Ce produit n'a pas de date d'expiration</span>
              </div>
            )}
          </div>
        </div>

        {/* Lots associés */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Lots associés
            </h3>
          </div>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">Total: {product.total_lots || 0} lots</p>
              {product.expired_lots_count > 0 && (
                <span className="badge badge-error">Expirés: {product.expired_lots_count}</span>
              )}
              {product.expiring_lots_count > 0 && (
                <span className="badge badge-warning">Expirant: {product.expiring_lots_count}</span>
              )}
            </div>
            <button 
              onClick={() => navigate(`/produits/${id}/lots`)} 
              className="btn btn-outline btn-sm w-full gap-2"
            >
              <Layers className="w-4 h-4" /> Voir tous les lots
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;