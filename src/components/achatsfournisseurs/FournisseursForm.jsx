// src/components/achats/FournisseursForm.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Save, X, Truck, Building2, User, Phone, Mail,
  MapPin, Globe, FileText, Star, CheckCircle, AlertCircle,
  Plus, Trash2, Edit, RefreshCw, Calendar, Package
} from 'lucide-react';

const FournisseursForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [activeTab, setActiveTab] = useState('general');
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingContact, setEditingContact] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Formulaire fournisseur
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    commercial_name: '',
    type: 'local',
    contact_person: '',
    phone: '',
    mobile: '',
    email: '',
    website: '',
    address: '',
    city: '',
    country: 'Sénégal',
    postal_code: '',
    tax_id: '',
    registration_number: '',
    payment_terms: '30',
    delivery_lead_time: 7,
    minimum_order: 0,
    rating: 0,
    is_active: true,
    is_preferred: false,
    notes: ''
  });

  // Formulaire contact
  const [contactForm, setContactForm] = useState({
    name: '',
    position: '',
    phone: '',
    mobile: '',
    email: '',
    is_primary: false,
    notes: ''
  });

  // Formulaire produit fournisseur
  const [productForm, setProductForm] = useState({
    product: '',
    supplier_sku: '',
    purchase_price: 0,
    lead_time: 7,
    minimum_order: 1,
    is_active: true,
    notes: ''
  });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const getToken = () => localStorage.getItem('Token');

  // Génération automatique du code
  const generateCode = () => {
    const prefix = 'FOURN';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${year}-${random}`;
  };

  // Chargement du fournisseur en mode édition
  const fetchSupplier = async () => {
    if (!isEditMode) return;
    setLoading(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get(`/suppliers/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = response.data;
      setFormData({
        code: data.code || '',
        name: data.name || '',
        commercial_name: data.commercial_name || '',
        type: data.type || 'local',
        contact_person: data.contact_person || '',
        phone: data.phone || '',
        mobile: data.mobile || '',
        email: data.email || '',
        website: data.website || '',
        address: data.address || '',
        city: data.city || '',
        country: data.country || 'Sénégal',
        postal_code: data.postal_code || '',
        tax_id: data.tax_id || '',
        registration_number: data.registration_number || '',
        payment_terms: data.payment_terms || '30',
        delivery_lead_time: data.delivery_lead_time || 7,
        minimum_order: data.minimum_order || 0,
        rating: data.rating || 0,
        is_active: data.is_active !== undefined ? data.is_active : true,
        is_preferred: data.is_preferred || false,
        notes: data.notes || ''
      });
      setContacts(data.contacts || []);
      setProducts(data.products || []);
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

  // Chargement des produits disponibles pour l'association
  const fetchAvailableProducts = async (search = '') => {
    setLoadingProducts(true);
    try {
      const token = getToken();
      const response = await AxiosInstance.get('/products/?is_active=true', {
        headers: { 'Authorization': `Token ${token}` }
      });
      let results = response.data.results || response.data || [];
      if (search) {
        results = results.filter(p =>
          p.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.code?.toLowerCase().includes(search.toLowerCase())
        );
      }
      // Exclure les produits déjà associés
      const existingProductIds = products.map(p => p.product);
      results = results.filter(p => !existingProductIds.includes(p.id));
      setProductOptions(results.slice(0, 20));
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      setProductOptions([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      fetchSupplier();
    } else {
      // Nouveau fournisseur : générer un code
      setFormData(prev => ({ ...prev, code: generateCode() }));
    }
  }, [id]);

  useEffect(() => {
    if (showProductModal) {
      fetchAvailableProducts(productSearch);
    }
  }, [showProductModal, productSearch]);

  // Gestion des changements du formulaire principal
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Gestion des changements du formulaire contact
  const handleContactChange = (e) => {
    const { name, value, type, checked } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Gestion des changements du formulaire produit
  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Soumission du formulaire principal - CORRIGÉ
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = getToken();
      const url = isEditMode ? `/suppliers/${id}/` : '/suppliers/';
      const method = isEditMode ? 'put' : 'post';

      // Nettoyer les données - Convertir null/undefined en chaînes vides
      const data = { ...formData };
      
      // Liste des champs qui peuvent être vides
      const optionalFields = ['commercial_name', 'contact_person', 'mobile', 'website', 
                              'postal_code', 'tax_id', 'registration_number', 'notes'];
      
      Object.keys(data).forEach(key => {
        // Si la valeur est null ou undefined, la convertir en chaîne vide
        if (data[key] === null || data[key] === undefined) {
          data[key] = '';
        }
        // Si c'est une chaîne et qu'elle est undefined, la convertir en chaîne vide
        if (typeof data[key] === 'string' && data[key] === 'undefined') {
          data[key] = '';
        }
      });

      // S'assurer que les champs obligatoires ne sont pas vides
      const requiredFields = ['code', 'name', 'phone', 'email', 'address', 'city', 'type'];
      for (const field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
          showNotification(`Le champ "${field}" est obligatoire`, 'error');
          setSaving(false);
          return;
        }
      }

      // Pour les champs numériques
      if (data.delivery_lead_time === null || data.delivery_lead_time === undefined || data.delivery_lead_time === '') {
        data.delivery_lead_time = 7;
      }
      if (data.minimum_order === null || data.minimum_order === undefined || data.minimum_order === '') {
        data.minimum_order = 0;
      }
      if (data.rating === null || data.rating === undefined || data.rating === '') {
        data.rating = 0;
      }

      const response = await AxiosInstance[method](url, data, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification(
        isEditMode ? 'Fournisseur modifié avec succès' : 'Fournisseur créé avec succès',
        'success'
      );

      if (!isEditMode) {
        setTimeout(() => navigate(`/fournisseurs/${response.data.id}`), 1000);
      } else {
        fetchSupplier();
      }
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.data) {
        const errors = error.response.data;
        const messages = Object.keys(errors).map(key => `${key}: ${errors[key]}`);
        showNotification(messages.join(' | '), 'error');
      } else {
        showNotification('Erreur lors de l\'enregistrement', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  // Gestion des contacts
  const handleAddContact = async () => {
    if (!contactForm.name || !contactForm.phone || !contactForm.email) {
      showNotification('Veuillez remplir les champs obligatoires (Nom, Téléphone, Email)', 'error');
      return;
    }

    try {
      const token = getToken();
      let url = '/supplier-contacts/';
      let method = 'post';
      let data = { ...contactForm };

      if (editingContact) {
        url = `/supplier-contacts/${editingContact.id}/`;
        method = 'put';
      } else {
        data.supplier = parseInt(id);
      }

      const response = await AxiosInstance[method](url, data, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification(
        editingContact ? 'Contact modifié avec succès' : 'Contact ajouté avec succès',
        'success'
      );

      await fetchSupplier();
      setShowContactModal(false);
      setEditingContact(null);
      setContactForm({ name: '', position: '', phone: '', mobile: '', email: '', is_primary: false, notes: '' });
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de l\'enregistrement du contact', 'error');
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce contact ?')) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/supplier-contacts/${contactId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Contact supprimé avec succès', 'success');
      fetchSupplier();
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name || '',
      position: contact.position || '',
      phone: contact.phone || '',
      mobile: contact.mobile || '',
      email: contact.email || '',
      is_primary: contact.is_primary || false,
      notes: contact.notes || ''
    });
    setShowContactModal(true);
  };

  // Gestion des produits fournisseurs
  const handleAddProduct = async () => {
    if (!productForm.product) {
      showNotification('Veuillez sélectionner un produit', 'error');
      return;
    }
    if (productForm.purchase_price <= 0) {
      showNotification('Le prix d\'achat doit être supérieur à 0', 'error');
      return;
    }

    try {
      const token = getToken();
      let url = '/supplier-products/';
      let method = 'post';
      let data = { ...productForm };

      if (editingProduct) {
        url = `/supplier-products/${editingProduct.id}/`;
        method = 'put';
      } else {
        data.supplier = parseInt(id);
      }

      const response = await AxiosInstance[method](url, data, {
        headers: { 'Authorization': `Token ${token}` }
      });

      showNotification(
        editingProduct ? 'Produit modifié avec succès' : 'Produit associé avec succès',
        'success'
      );

      await fetchSupplier();
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({ product: '', supplier_sku: '', purchase_price: 0, lead_time: 7, minimum_order: 1, is_active: true, notes: '' });
      setProductSearch('');
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('Erreur lors de l\'association du produit', 'error');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Voulez-vous vraiment dissocier ce produit ?')) return;
    try {
      const token = getToken();
      await AxiosInstance.delete(`/supplier-products/${productId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      showNotification('Produit dissocié avec succès', 'success');
      fetchSupplier();
    } catch (error) {
      showNotification('Erreur lors de la dissociation', 'error');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      product: product.product || '',
      supplier_sku: product.supplier_sku || '',
      purchase_price: product.purchase_price || 0,
      lead_time: product.lead_time || 7,
      minimum_order: product.minimum_order || 1,
      is_active: product.is_active !== undefined ? product.is_active : true,
      notes: product.notes || ''
    });
    setShowProductModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">
            {isEditMode ? 'Chargement du fournisseur...' : 'Préparation du formulaire...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
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

      {/* Modal Contact */}
      {showContactModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg mb-4">
              {editingContact ? 'Modifier le contact' : 'Ajouter un contact'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="label label-text">Nom complet *</label>
                <input name="name" value={contactForm.name} onChange={handleContactChange} className="input input-bordered w-full" />
              </div>
              <div>
                <label className="label label-text">Poste</label>
                <input name="position" value={contactForm.position} onChange={handleContactChange} className="input input-bordered w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label label-text">Téléphone *</label>
                  <input name="phone" value={contactForm.phone} onChange={handleContactChange} className="input input-bordered w-full" />
                </div>
                <div>
                  <label className="label label-text">Mobile</label>
                  <input name="mobile" value={contactForm.mobile} onChange={handleContactChange} className="input input-bordered w-full" />
                </div>
              </div>
              <div>
                <label className="label label-text">Email *</label>
                <input name="email" type="email" value={contactForm.email} onChange={handleContactChange} className="input input-bordered w-full" />
              </div>
              <div className="flex items-center gap-2">
                <input name="is_primary" type="checkbox" checked={contactForm.is_primary} onChange={handleContactChange} className="checkbox" />
                <label className="label-text">Contact principal</label>
              </div>
              <div>
                <label className="label label-text">Notes</label>
                <textarea name="notes" value={contactForm.notes} onChange={handleContactChange} className="textarea textarea-bordered w-full" rows="2"></textarea>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => { setShowContactModal(false); setEditingContact(null); setContactForm({ name: '', position: '', phone: '', mobile: '', email: '', is_primary: false, notes: '' }); }}>Annuler</button>
              <button className="btn btn-primary" onClick={handleAddContact} disabled={saving}>
                <Save className="w-4 h-4" /> {editingContact ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Produit */}
      {showProductModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg mb-4">
              {editingProduct ? 'Modifier le produit associé' : 'Associer un produit'}
            </h3>
            <div className="space-y-3">
              {!editingProduct && (
                <div>
                  <label className="label label-text">Produit *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Rechercher un produit..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="input input-bordered w-full"
                    />
                    {loadingProducts && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="loading loading-spinner loading-sm"></span>
                      </div>
                    )}
                  </div>
                  <select
                    name="product"
                    value={productForm.product}
                    onChange={handleProductChange}
                    className="select select-bordered w-full mt-2"
                    disabled={loadingProducts}
                  >
                    <option value="">Sélectionner un produit</option>
                    {productOptions.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="label label-text">Référence fournisseur</label>
                <input name="supplier_sku" value={productForm.supplier_sku} onChange={handleProductChange} className="input input-bordered w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label label-text">Prix d'achat *</label>
                  <input name="purchase_price" type="number" step="0.01" value={productForm.purchase_price} onChange={handleProductChange} className="input input-bordered w-full" />
                </div>
                <div>
                  <label className="label label-text">Délai livraison (jours)</label>
                  <input name="lead_time" type="number" value={productForm.lead_time} onChange={handleProductChange} className="input input-bordered w-full" />
                </div>
              </div>
              <div>
                <label className="label label-text">Quantité minimum</label>
                <input name="minimum_order" type="number" value={productForm.minimum_order} onChange={handleProductChange} className="input input-bordered w-full" />
              </div>
              <div className="flex items-center gap-2">
                <input name="is_active" type="checkbox" checked={productForm.is_active} onChange={handleProductChange} className="checkbox" />
                <label className="label-text">Actif</label>
              </div>
              <div>
                <label className="label label-text">Notes</label>
                <textarea name="notes" value={productForm.notes} onChange={handleProductChange} className="textarea textarea-bordered w-full" rows="2"></textarea>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => { setShowProductModal(false); setEditingProduct(null); setProductForm({ product: '', supplier_sku: '', purchase_price: 0, lead_time: 7, minimum_order: 1, is_active: true, notes: '' }); setProductSearch(''); }}>Annuler</button>
              <button className="btn btn-primary" onClick={handleAddProduct} disabled={saving}>
                <Save className="w-4 h-4" /> {editingProduct ? 'Modifier' : 'Associer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => navigate('/fournisseurs')} className="btn btn-ghost btn-sm btn-circle">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="p-2 bg-primary/10 rounded-xl">
                <Truck className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary">
                {isEditMode ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              {isEditMode ? `Modification de ${formData.name || '...'}` : 'Créez un nouveau fournisseur dans la base'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {isEditMode && (
              <button onClick={fetchSupplier} className="btn btn-sm btn-outline gap-2">
                <RefreshCw className="w-4 h-4" /> Actualiser
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-sm sm:btn-md bg-gradient-to-r from-primary to-primary/80 text-white border-none shadow-lg gap-2"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-white p-1 rounded-xl shadow-sm overflow-x-auto">
        <button className={`tab ${activeTab === 'general' ? 'tab-active' : ''}`} onClick={() => setActiveTab('general')}>
          Informations générales
        </button>
        <button className={`tab ${activeTab === 'contacts' ? 'tab-active' : ''}`} onClick={() => setActiveTab('contacts')}>
          Contacts ({contacts.length})
        </button>
        <button className={`tab ${activeTab === 'products' ? 'tab-active' : ''}`} onClick={() => setActiveTab('products')}>
          Produits ({products.length})
        </button>
        {isEditMode && (
          <button className={`tab ${activeTab === 'details' ? 'tab-active' : ''}`} onClick={() => setActiveTab('details')}>
            Détails & statistiques
          </button>
        )}
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Identification */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" /> Identification
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label label-text">Code *</label>
                    <input
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      className="input input-bordered w-full font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="label label-text">Type *</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="select select-bordered w-full" required>
                      <option value="local">Local</option>
                      <option value="international">International</option>
                      <option value="importateur">Importateur</option>
                      <option value="distributeur">Distributeur</option>
                      <option value="fabricant">Fabricant</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label label-text">Nom / Raison sociale *</label>
                  <input name="name" value={formData.name} onChange={handleChange} className="input input-bordered w-full" required />
                </div>
                <div>
                  <label className="label label-text">Nom commercial</label>
                  <input name="commercial_name" value={formData.commercial_name} onChange={handleChange} className="input input-bordered w-full" />
                </div>
                <div>
                  <label className="label label-text">Personne de contact</label>
                  <input name="contact_person" value={formData.contact_person} onChange={handleChange} className="input input-bordered w-full" />
                </div>
                <div className="flex flex-wrap gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input name="is_active" type="checkbox" checked={formData.is_active} onChange={handleChange} className="checkbox checkbox-success" />
                    <span className="label-text">Actif</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input name="is_preferred" type="checkbox" checked={formData.is_preferred} onChange={handleChange} className="checkbox checkbox-warning" />
                    <span className="label-text">Fournisseur privilégié</span>
                    <Star className="w-4 h-4 text-warning" />
                  </label>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" /> Coordonnées
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label label-text">Téléphone *</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className="input input-bordered w-full" required />
                  </div>
                  <div>
                    <label className="label label-text">Mobile</label>
                    <input name="mobile" value={formData.mobile} onChange={handleChange} className="input input-bordered w-full" />
                  </div>
                </div>
                <div>
                  <label className="label label-text">Email *</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} className="input input-bordered w-full" required />
                </div>
                <div>
                  <label className="label label-text">Site web</label>
                  <input name="website" value={formData.website} onChange={handleChange} className="input input-bordered w-full" placeholder="https://..." />
                </div>
                <div>
                  <label className="label label-text">Adresse *</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} className="textarea textarea-bordered w-full" rows="2" required></textarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label label-text">Ville *</label>
                    <input name="city" value={formData.city} onChange={handleChange} className="input input-bordered w-full" required />
                  </div>
                  <div>
                    <label className="label label-text">Pays</label>
                    <input name="country" value={formData.country} onChange={handleChange} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label label-text">Code postal</label>
                    <input name="postal_code" value={formData.postal_code} onChange={handleChange} className="input input-bordered w-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Informations fiscales */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Informations fiscales & légales
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="label label-text">N° Identification fiscale</label>
                  <input name="tax_id" value={formData.tax_id} onChange={handleChange} className="input input-bordered w-full" />
                </div>
                <div>
                  <label className="label label-text">N° Registre de commerce</label>
                  <input name="registration_number" value={formData.registration_number} onChange={handleChange} className="input input-bordered w-full" />
                </div>
              </div>
            </div>

            {/* Conditions commerciales */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" /> Conditions commerciales
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label label-text">Délai de paiement</label>
                    <select name="payment_terms" value={formData.payment_terms} onChange={handleChange} className="select select-bordered w-full">
                      <option value="cash">Comptant</option>
                      <option value="15">15 jours</option>
                      <option value="30">30 jours</option>
                      <option value="45">45 jours</option>
                      <option value="60">60 jours</option>
                      <option value="90">90 jours</option>
                    </select>
                  </div>
                  <div>
                    <label className="label label-text">Délai de livraison (jours)</label>
                    <input name="delivery_lead_time" type="number" value={formData.delivery_lead_time} onChange={handleChange} className="input input-bordered w-full" />
                  </div>
                </div>
                <div>
                  <label className="label label-text">Commande minimum</label>
                  <input name="minimum_order" type="number" value={formData.minimum_order} onChange={handleChange} className="input input-bordered w-full" />
                </div>
                <div>
                  <label className="label label-text">Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} className="textarea textarea-bordered w-full" rows="3"></textarea>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Contacts ({contacts.length})
              </h3>
              <button type="button" className="btn btn-primary btn-sm gap-2" onClick={() => { setEditingContact(null); setContactForm({ name: '', position: '', phone: '', mobile: '', email: '', is_primary: false, notes: '' }); setShowContactModal(true); }}>
                <Plus className="w-4 h-4" /> Ajouter un contact
              </button>
            </div>
            <div className="overflow-x-auto">
              {contacts.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun contact enregistré</p>
                  <button type="button" className="btn btn-primary btn-sm mt-3 gap-2" onClick={() => { setEditingContact(null); setContactForm({ name: '', position: '', phone: '', mobile: '', email: '', is_primary: false, notes: '' }); setShowContactModal(true); }}>
                    <Plus className="w-4 h-4" /> Ajouter un contact
                  </button>
                </div>
              ) : (
                <table className="table w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th>Nom</th>
                      <th>Poste</th>
                      <th>Téléphone</th>
                      <th>Email</th>
                      <th className="text-center">Principal</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map(contact => (
                      <tr key={contact.id}>
                        <td className="font-medium">{contact.name}</td>
                        <td>{contact.position || '-'}</td>
                        <td>{contact.phone}</td>
                        <td>{contact.email}</td>
                        <td className="text-center">
                          {contact.is_primary && <CheckCircle className="w-5 h-5 text-success mx-auto" />}
                        </td>
                        <td className="text-center">
                          <div className="flex justify-center gap-1">
                            <button type="button" className="btn btn-ghost btn-sm btn-circle" onClick={() => handleEditContact(contact)}>
                              <Edit className="w-4 h-4" />
                            </button>
                            <button type="button" className="btn btn-ghost btn-sm btn-circle text-error" onClick={() => handleDeleteContact(contact.id)}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Produits associés ({products.length})
              </h3>
              <button type="button" className="btn btn-primary btn-sm gap-2" onClick={() => { setEditingProduct(null); setProductForm({ product: '', supplier_sku: '', purchase_price: 0, lead_time: 7, minimum_order: 1, is_active: true, notes: '' }); setProductSearch(''); setShowProductModal(true); }}>
                <Plus className="w-4 h-4" /> Associer un produit
              </button>
            </div>
            <div className="overflow-x-auto">
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun produit associé</p>
                  <button type="button" className="btn btn-primary btn-sm mt-3 gap-2" onClick={() => { setEditingProduct(null); setProductForm({ product: '', supplier_sku: '', purchase_price: 0, lead_time: 7, minimum_order: 1, is_active: true, notes: '' }); setProductSearch(''); setShowProductModal(true); }}>
                    <Plus className="w-4 h-4" /> Associer un produit
                  </button>
                </div>
              ) : (
                <table className="table w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th>Produit</th>
                      <th>Réf. fournisseur</th>
                      <th className="text-right">Prix achat</th>
                      <th className="text-center">Délai (j)</th>
                      <th className="text-center">Min</th>
                      <th className="text-center">Statut</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td>
                          <div>
                            <p className="font-medium">{product.product_name}</p>
                            <p className="text-xs text-gray-500">{product.product_code}</p>
                          </div>
                        </td>
                        <td>{product.supplier_sku || '-'}</td>
                        <td className="text-right font-semibold">{product.purchase_price?.toLocaleString()} F</td>
                        <td className="text-center">{product.lead_time}</td>
                        <td className="text-center">{product.minimum_order}</td>
                        <td className="text-center">
                          {product.is_active ? (
                            <span className="badge badge-success">Actif</span>
                          ) : (
                            <span className="badge badge-error">Inactif</span>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="flex justify-center gap-1">
                            <button type="button" className="btn btn-ghost btn-sm btn-circle" onClick={() => handleEditProduct(product)}>
                              <Edit className="w-4 h-4" />
                            </button>
                            <button type="button" className="btn btn-ghost btn-sm btn-circle text-error" onClick={() => handleDeleteProduct(product.id)}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'details' && isEditMode && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Truck className="w-4 h-4 text-primary" /> Statistiques
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Total commandes</span>
                  <span className="font-semibold">{formData.total_orders || 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Total achats</span>
                  <span className="font-semibold text-primary">{(formData.total_purchases || 0).toLocaleString()} F</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Note</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(formData.rating || 0) ? 'text-warning fill-warning' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Taux livraison à temps</span>
                  <span className="font-semibold">{formData.on_time_delivery_rate || 0}%</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Dette totale</span>
                  <span className="font-semibold text-error">{(formData.total_debt || 0).toLocaleString()} F</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Dette en retard</span>
                  <span className="font-semibold text-error">{(formData.overdue_debt || 0).toLocaleString()} F</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-primary" /> Informations système
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Créé le</span>
                  <span className="text-sm">{formData.created_at ? new Date(formData.created_at).toLocaleString() : '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Créé par</span>
                  <span className="text-sm">{formData.created_by?.full_name || formData.created_by?.username || '-'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Dernière modification</span>
                  <span className="text-sm">{formData.updated_at ? new Date(formData.updated_at).toLocaleString() : '-'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default FournisseursForm;