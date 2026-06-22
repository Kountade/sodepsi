// src/components/achats/FournisseursDetails.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Truck, Edit, Trash2, Phone, Mail, MapPin,
  Building2, User, Star, Globe, Calendar, Package,
  DollarSign, Clock, CheckCircle, XCircle, RefreshCw,
  FileText, TrendingUp, AlertCircle
} from 'lucide-react';

const FournisseursDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  const fetchSupplierDetails = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/suppliers/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setSupplier(response.data);
      
      const [contactsRes, productsRes, ordersRes] = await Promise.all([
        AxiosInstance.get(`/suppliers/${id}/contacts/`, { headers: { 'Authorization': `Token ${token}` } }),
        AxiosInstance.get(`/suppliers/${id}/products/`, { headers: { 'Authorization': `Token ${token}` } }),
        AxiosInstance.get(`/suppliers/${id}/purchase_orders/`, { headers: { 'Authorization': `Token ${token}` } })
      ]);
      
      setContacts(contactsRes.data);
      setProducts(productsRes.data);
      setPurchaseOrders(ordersRes.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        showNotification('Session expirée', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 404) {
        showNotification('Fournisseur non trouvé', 'error');
        setTimeout(() => navigate('/fournisseurs'), 1500);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierDetails();
  }, [id]);

  const handleDelete = async () => {
    try {
      const token = getToken();
      await AxiosInstance.delete(`/suppliers/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Fournisseur supprimé avec succès', 'success');
      setTimeout(() => navigate('/fournisseurs'), 1500);
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
    setShowDeleteModal(false);
  };

  const getTypeLabel = (type) => {
    const types = {
      local: 'Local', international: 'International', importateur: 'Importateur',
      distributeur: 'Distributeur', fabricant: 'Fabricant'
    };
    return types[type] || type;
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'international': return <Globe className="w-5 h-5" />;
      case 'distributeur': return <Truck className="w-5 h-5" />;
      case 'fabricant': return <Building2 className="w-5 h-5" />;
      default: return <Building2 className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'draft': return <span className="badge badge-info">Brouillon</span>;
      case 'confirmed': return <span className="badge badge-primary">Confirmée</span>;
      case 'partial': return <span className="badge badge-warning">Partielle</span>;
      case 'received': return <span className="badge badge-success">Reçue</span>;
      case 'cancelled': return <span className="badge badge-error">Annulée</span>;
      default: return <span className="badge badge-ghost">{status}</span>;
    }
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 text-warning fill-warning" />);
    }
    for (let i = fullStars; i < 5; i++) {
      stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
      </div>
    );
  }

  if (!supplier) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl rounded-xl`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setNotification(prev => ({ ...prev, show: false }))}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

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
              <p className="text-gray-600">Voulez-vous vraiment supprimer ce fournisseur ?</p>
              <p className="font-semibold text-error mt-2">{supplier.name}</p>
              {supplier.total_purchases > 0 && (
                <p className="text-warning text-sm mt-2">⚠️ Total achats: {supplier.total_purchases.toLocaleString()} FCFA</p>
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
          <button onClick={() => navigate('/fournisseurs')} className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              {getTypeIcon(supplier.type)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{supplier.name}</h1>
              <p className="text-sm text-gray-500">{supplier.code}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/fournisseurs/${id}/modifier`)} className="btn btn-primary btn-sm gap-2">
            <Edit className="w-4 h-4" /> Modifier
          </button>
          <button onClick={() => setShowDeleteModal(true)} className="btn btn-error btn-sm gap-2">
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
          <button onClick={fetchSupplierDetails} className="btn btn-ghost btn-sm btn-circle">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Type</p><p className="text-lg font-semibold">{getTypeLabel(supplier.type)}</p></div>
            {getTypeIcon(supplier.type)}
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Note</p><div className="flex gap-0.5">{getRatingStars(supplier.rating)}</div></div>
            <Star className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total achats</p><p className="text-lg font-bold text-primary">{supplier.total_purchases?.toLocaleString()} F</p></div>
            <DollarSign className="w-8 h-8 text-primary/20" />
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Statut</p>{supplier.is_active ? <span className="badge badge-success">Actif</span> : <span className="badge badge-error">Inactif</span>}</div>
            {supplier.is_preferred && <Star className="w-5 h-5 text-warning fill-warning" />}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-white p-1 rounded-xl shadow-sm">
        <button className={`tab ${activeTab === 'info' ? 'tab-active' : ''}`} onClick={() => setActiveTab('info')}>
          Informations
        </button>
        <button className={`tab ${activeTab === 'contacts' ? 'tab-active' : ''}`} onClick={() => setActiveTab('contacts')}>
          Contacts ({contacts.length})
        </button>
        <button className={`tab ${activeTab === 'products' ? 'tab-active' : ''}`} onClick={() => setActiveTab('products')}>
          Produits ({products.length})
        </button>
        <button className={`tab ${activeTab === 'orders' ? 'tab-active' : ''}`} onClick={() => setActiveTab('orders')}>
          Commandes ({purchaseOrders.length})
        </button>
      </div>

      {/* Contenu des tabs */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Informations générales</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Nom</p><p className="font-medium">{supplier.name}</p></div>
                <div><p className="text-xs text-gray-500">Code</p><p className="font-mono text-sm">{supplier.code}</p></div>
                <div><p className="text-xs text-gray-500">Nom commercial</p><p className="text-sm">{supplier.commercial_name || '-'}</p></div>
                <div><p className="text-xs text-gray-500">Personne de contact</p><p className="text-sm">{supplier.contact_person || '-'}</p></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> Contact</h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-gray-400" /><span>{supplier.phone || '-'}</span></div>
              <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-gray-400" /><span>{supplier.email || '-'}</span></div>
              {supplier.website && <div className="flex items-center gap-3"><Globe className="w-4 h-4 text-gray-400" /><a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{supplier.website}</a></div>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Adresse</h3>
            </div>
            <div className="p-6">
              <p>{supplier.address}</p>
              <p>{supplier.city}, {supplier.country}</p>
              {supplier.postal_code && <p>Code postal: {supplier.postal_code}</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2"><Star className="w-4 h-4 text-primary" /> Conditions commerciales</h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between"><span className="text-gray-500">Délai de paiement</span><span className="font-medium">{supplier.payment_terms === 'cash' ? 'Comptant' : `${supplier.payment_terms} jours`}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Délai de livraison</span><span className="font-medium">{supplier.delivery_lead_time} jours</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Commande minimum</span><span className="font-medium">{supplier.minimum_order} unités</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Fournisseur privilégié</span>{supplier.is_preferred ? <CheckCircle className="w-5 h-5 text-success" /> : <XCircle className="w-5 h-5 text-gray-300" />}</div>
            </div>
          </div>

          {supplier.notes && (
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b"><h3 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Notes</h3></div>
              <div className="p-6"><p className="text-sm text-gray-600">{supplier.notes}</p></div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50"><tr><th>Nom</th><th>Poste</th><th>Téléphone</th><th>Email</th><th>Principal</th></tr></thead>
              <tbody>{contacts.length === 0 ? <tr><td colSpan="5" className="text-center py-8">Aucun contact</td></tr> : contacts.map(contact => (<tr key={contact.id}><td>{contact.name}</td><td>{contact.position || '-'}</td><td>{contact.phone}</td><td>{contact.email}</td><td className="text-center">{contact.is_primary && <CheckCircle className="w-5 h-5 text-success mx-auto" />}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50"><tr><th>Produit</th><th>Réf. fournisseur</th><th className="text-center">Prix achat</th><th className="text-center">Délai (j)</th><th className="text-center">Min</th><th>Statut</th></tr></thead>
              <tbody>{products.length === 0 ? <tr><td colSpan="6" className="text-center py-8">Aucun produit</td></tr> : products.map(product => (<tr key={product.id}><td>{product.product_name}</td><td>{product.supplier_sku || '-'}</td><td className="text-center font-semibold">{product.purchase_price?.toLocaleString()} F</td><td className="text-center">{product.lead_time}</td><td className="text-center">{product.minimum_order}</td><td>{product.is_active ? <span className="badge badge-success">Actif</span> : <span className="badge badge-error">Inactif</span>}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-50"><tr><th>N° Commande</th><th>Date</th><th>Date livraison</th><th className="text-right">Total</th><th>Statut</th></tr></thead>
              <tbody>{purchaseOrders.length === 0 ? <tr><td colSpan="5" className="text-center py-8">Aucune commande</td></tr> : purchaseOrders.map(order => (<tr key={order.id}><td className="font-mono">{order.po_number}</td><td>{new Date(order.order_date).toLocaleDateString()}</td><td>{order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : '-'}</td><td className="text-right font-semibold">{order.total?.toLocaleString()} F</td><td>{getStatusBadge(order.status)}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FournisseursDetails;