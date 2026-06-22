// src/components/logistique/ProductPricingManager.jsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AxiosInstance from '../AxiosInstance'

const ProductPricingManager = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [prices, setPrices] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [notification, setNotification] = useState(null)
  const [formData, setFormData] = useState({
    warehouse_id: '',
    purchase_price: '',
    sale_price: '',
    wholesale_price: '',
    tax_rate: 20
  })

  const showMessage = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [productRes, pricesRes, warehousesRes] = await Promise.all([
        AxiosInstance.get(`/products/${id}/`),
        AxiosInstance.get(`/products/${id}/prices/`),
        AxiosInstance.get('/warehouses/')
      ])
      setProduct(productRes.data)
      setPrices(pricesRes.data || [])
      setWarehouses(warehousesRes.data || [])
    } catch (err) {
      console.error(err)
      showMessage('Erreur de chargement', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleSave = async () => {
    if (!formData.warehouse_id || !formData.purchase_price || !formData.sale_price) {
      showMessage('Veuillez remplir tous les champs obligatoires', 'error')
      return
    }

    try {
      await AxiosInstance.post('/product-prices/set_price/', {
        product_id: id,
        warehouse_id: formData.warehouse_id,
        purchase_price: formData.purchase_price,
        sale_price: formData.sale_price,
        wholesale_price: formData.wholesale_price || null,
        tax_rate: formData.tax_rate || 20
      })
      showMessage('Prix enregistré avec succès')
      setShowForm(false)
      setEditingId(null)
      setFormData({ warehouse_id: '', purchase_price: '', sale_price: '', wholesale_price: '', tax_rate: 20 })
      fetchData()
    } catch (err) {
      console.error(err)
      showMessage(err.response?.data?.error || 'Erreur lors de l\'enregistrement', 'error')
    }
  }

  const handleEdit = (price) => {
    setEditingId(price.id)
    setFormData({
      warehouse_id: price.warehouse,
      purchase_price: price.purchase_price,
      sale_price: price.sale_price,
      wholesale_price: price.wholesale_price || '',
      tax_rate: price.tax_rate || 20
    })
    setShowForm(true)
  }

  const formatNumber = (num) => {
    if (!num) return '0'
    return new Intl.NumberFormat('fr-FR').format(num)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Produit non trouvé</p>
          <button onClick={() => navigate('/produits')} className="btn btn-primary btn-sm mt-4">Retour</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100 p-6">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/produits/${id}`)} className="btn btn-ghost btn-sm">
          ← Retour
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Gestion des prix</h1>
          <p className="text-sm text-base-content/60">{product.name} ({product.reference})</p>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`alert ${notification.type === 'error' ? 'alert-error' : 'alert-success'} mb-4 shadow-lg max-w-2xl`}>
          {notification.type === 'error' ? '❌' : '✅'} {notification.msg}
        </div>
      )}

      {/* Bouton ajouter */}
      <button
        onClick={() => {
          setShowForm(!showForm)
          setEditingId(null)
          setFormData({ warehouse_id: '', purchase_price: '', sale_price: '', wholesale_price: '', tax_rate: 20 })
        }}
        className="btn btn-primary btn-sm mb-4 gap-2"
      >
        + Définir un prix
      </button>

      {/* Formulaire */}
      {showForm && (
        <div className="card bg-base-200 shadow-xl mb-6 max-w-2xl">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4">{editingId ? 'Modifier' : 'Nouveau'} prix</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Entrepôt *</label>
                <select
                  className="select select-bordered w-full"
                  value={formData.warehouse_id}
                  onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                >
                  <option value="">Sélectionner</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.agence_nom})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix d'achat (FCFA) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix de vente (FCFA) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix de gros (FCFA)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full"
                  value={formData.wholesale_price}
                  onChange={(e) => setFormData({ ...formData, wholesale_price: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">TVA (%)</label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des prix */}
      {prices.length === 0 ? (
        <div className="card bg-base-200 shadow-xl max-w-2xl">
          <div className="card-body text-center py-12">
            <p className="text-base-content/50">Aucun prix défini pour ce produit</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 max-w-2xl">
          {prices.map((price) => (
            <div key={price.id} className="card bg-base-200 shadow-xl">
              <div className="card-body p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{price.warehouse_name}</h3>
                    <p className="text-xs text-base-content/50">{price.warehouse_code}</p>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(price)}>
                    ✏️ Modifier
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-base-100 rounded p-2 text-center">
                    <p className="text-xs">Achat</p>
                    <p className="font-bold">{formatNumber(price.purchase_price)} FCFA</p>
                  </div>
                  <div className="bg-primary/10 rounded p-2 text-center">
                    <p className="text-xs">Vente</p>
                    <p className="font-bold text-primary">{formatNumber(price.sale_price)} FCFA</p>
                  </div>
                  {price.wholesale_price && (
                    <div className="bg-base-100 rounded p-2 text-center">
                      <p className="text-xs">Gros</p>
                      <p className="font-bold">{formatNumber(price.wholesale_price)} FCFA</p>
                    </div>
                  )}
                  <div className="bg-base-100 rounded p-2 text-center">
                    <p className="text-xs">TVA</p>
                    <p className="font-bold">{price.tax_rate}%</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t text-sm">
                  Marge: {formatNumber(price.margin)} FCFA ({price.margin_percentage?.toFixed(2)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductPricingManager