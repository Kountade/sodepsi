// src/components/inventaire/AddStockToWarehouse.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AxiosInstance from '../AxiosInstance'
import {
  Plus, Package, Warehouse, Building2, Save, X, ArrowLeft,
  AlertCircle, CheckCircle, Loader2, Search, ChevronDown
} from 'lucide-react'

const AddStockToWarehouse = () => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: '',
    location_code: '',
    notes: ''
  })
  
  const [errors, setErrors] = useState({})

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [productsRes, warehousesRes] = await Promise.all([
        AxiosInstance.get('/products/'),
        AxiosInstance.get('/warehouses/')
      ])
      setProducts(productsRes.data || [])
      setFilteredProducts(productsRes.data || [])
      setWarehouses(warehousesRes.data || [])
    } catch (error) {
      console.error(error)
      showNotification('Erreur de chargement des données', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filtrage des produits
  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.reference.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [searchTerm, products])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.product_id) newErrors.product_id = 'Sélectionnez un produit'
    if (!formData.warehouse_id) newErrors.warehouse_id = 'Sélectionnez un entrepôt'
    if (!formData.quantity || parseInt(formData.quantity) <= 0) newErrors.quantity = 'Quantité invalide'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      showNotification('Veuillez corriger les erreurs', 'error')
      return
    }

    setSubmitting(true)
    try {
      // Appel à l'API pour initialiser/ajuster le stock
      const quantity = parseInt(formData.quantity)
      
      // Vérifier si le stock existe déjà pour ce produit dans cet entrepôt
      const stockRes = await AxiosInstance.get(`/warehouse-stocks/by_product/?product_id=${formData.product_id}`)
      const existingStock = stockRes.data.find(s => s.warehouse === parseInt(formData.warehouse_id))
      
      if (existingStock) {
        // Ajuster le stock existant
        const newQuantity = existingStock.quantity + quantity
        await AxiosInstance.post(`/warehouse-stocks/${existingStock.id}/adjust_stock/`, {
          quantity: newQuantity,
          reason: formData.notes || `Ajout de ${quantity} unités`
        })
      } else {
        // Initialiser le stock
        await AxiosInstance.post('/warehouse-stocks/initialize_stock/', {
          product_id: formData.product_id,
          warehouse_id: formData.warehouse_id,
          quantity: quantity
        })
      }
      
      showNotification('Stock ajouté avec succès', 'success')
      setTimeout(() => navigate('/stocks'), 1500)
    } catch (error) {
      console.error(error)
      showNotification(error.response?.data?.error || 'Erreur lors de l\'ajout', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const getProductName = (productId) => {
    const product = products.find(p => p.id === parseInt(productId))
    return product?.name || ''
  }

  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === parseInt(warehouseId))
    return warehouse?.name || ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base font-medium text-base-content/70">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 lg:p-6">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg`}>
            {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{notification.message}</span>
            <button className="btn btn-ghost btn-xs" onClick={() => setNotification({ ...notification, show: false })}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/stocks')} className="btn btn-ghost btn-sm btn-circle">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Plus className="w-6 h-6 text-primary" />
            Ajouter du stock
          </h1>
          <p className="text-sm text-base-content/60">
            Ajoutez des produits dans un entrepôt
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sélection du produit */}
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-hidden">
          <div className="p-5 border-b border-base-300 bg-base-200/50">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold">Produit</h2>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="form-control">
              <label className="label font-medium">
                Rechercher un produit <span className="text-error">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  type="text"
                  className="input input-bordered w-full pl-9"
                  placeholder="Nom ou référence du produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label font-medium">Sélectionner le produit</label>
              <select
                name="product_id"
                value={formData.product_id}
                onChange={handleChange}
                className={`select select-bordered w-full ${errors.product_id ? 'select-error' : ''}`}
              >
                <option value="">Choisir un produit</option>
                {filteredProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.reference} - {p.name}
                  </option>
                ))}
              </select>
              {errors.product_id && (
                <span className="text-error text-xs mt-1">{errors.product_id}</span>
              )}
            </div>

            {formData.product_id && (
              <div className="bg-base-200 rounded-lg p-3 text-sm">
                <span className="font-medium">Produit sélectionné :</span> {getProductName(formData.product_id)}
              </div>
            )}
          </div>
        </div>

        {/* Sélection de l'entrepôt */}
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-hidden">
          <div className="p-5 border-b border-base-300 bg-base-200/50">
            <div className="flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-secondary" />
              <h2 className="text-base font-bold">Entrepôt</h2>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="form-control">
              <label className="label font-medium">
                Entrepôt de destination <span className="text-error">*</span>
              </label>
              <select
                name="warehouse_id"
                value={formData.warehouse_id}
                onChange={handleChange}
                className={`select select-bordered w-full ${errors.warehouse_id ? 'select-error' : ''}`}
              >
                <option value="">Choisir un entrepôt</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.agence_nom})
                  </option>
                ))}
              </select>
              {errors.warehouse_id && (
                <span className="text-error text-xs mt-1">{errors.warehouse_id}</span>
              )}
            </div>

            {formData.warehouse_id && (
              <div className="bg-base-200 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium">Entrepôt sélectionné :</span>
                  {getWarehouseName(formData.warehouse_id)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quantité et détails */}
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-hidden">
          <div className="p-5 border-b border-base-300 bg-base-200/50">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-success" />
              <h2 className="text-base font-bold">Quantité et détails</h2>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="form-control">
              <label className="label font-medium">
                Quantité à ajouter <span className="text-error">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Ex: 100"
                className={`input input-bordered w-full ${errors.quantity ? 'input-error' : ''}`}
              />
              {errors.quantity && (
                <span className="text-error text-xs mt-1">{errors.quantity}</span>
              )}
            </div>

            <div className="form-control">
              <label className="label font-medium">Emplacement (optionnel)</label>
              <input
                type="text"
                name="location_code"
                value={formData.location_code}
                onChange={handleChange}
                placeholder="Ex: A-12, Rack 3, Étagère 2"
                className="input input-bordered w-full"
              />
            </div>

            <div className="form-control">
              <label className="label font-medium">Notes (optionnel)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Raison de l'ajout, bon de livraison, etc."
                className="textarea textarea-bordered h-24"
              />
            </div>
          </div>
        </div>

        {/* Résumé */}
        {formData.product_id && formData.warehouse_id && formData.quantity && (
          <div className="bg-primary/10 rounded-xl p-5 border border-primary/20">
            <h3 className="font-bold mb-3">Résumé de l'opération</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-base-content/60">Produit :</span>
                <span className="font-medium">{getProductName(formData.product_id)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">Entrepôt :</span>
                <span className="font-medium">{getWarehouseName(formData.warehouse_id)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">Quantité :</span>
                <span className="font-bold text-primary">{parseInt(formData.quantity)} unités</span>
              </div>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/stocks')}
            className="btn btn-outline flex-1"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary flex-1 gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Ajouter au stock
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddStockToWarehouse