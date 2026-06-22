// src/components/inventaire/Stocks.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AxiosInstance from '../AxiosInstance'
import { 
  Package, Plus, RefreshCw, Warehouse, TrendingUp, 
  TrendingDown, AlertTriangle, CheckCircle, XCircle,
  Search, Filter, Edit, ChevronLeft, ChevronRight
} from 'lucide-react'

const Stocks = () => {
  const navigate = useNavigate()
  const [warehouseStocks, setWarehouseStocks] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [stocksRes, warehousesRes, productsRes] = await Promise.all([
        AxiosInstance.get('/warehouse-stocks/'),
        AxiosInstance.get('/warehouses/'),
        AxiosInstance.get('/products/')
      ])
      
      setWarehouseStocks(stocksRes.data || [])
      setWarehouses(warehousesRes.data || [])
      setProducts(productsRes.data || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId)
    return product?.name || 'Produit inconnu'
  }

  const getProductRef = (productId) => {
    const product = products.find(p => p.id === productId)
    return product?.reference || '-'
  }

  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId)
    return warehouse?.name || 'Entrepôt inconnu'
  }

  const getAgenceName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId)
    return warehouse?.agence_nom || '-'
  }

  const getStockStatus = (quantity, minStock) => {
    if (quantity === 0) return { label: 'Rupture', color: 'text-error', bg: 'bg-error/10', icon: <XCircle className="w-4 h-4" /> }
    if (quantity <= (minStock || 5)) return { label: 'Stock faible', color: 'text-warning', bg: 'bg-warning/10', icon: <AlertTriangle className="w-4 h-4" /> }
    return { label: 'Normal', color: 'text-success', bg: 'bg-success/10', icon: <CheckCircle className="w-4 h-4" /> }
  }

  // Filtrage
  const filteredStocks = warehouseStocks.filter(stock => {
    const productName = getProductName(stock.product).toLowerCase()
    const productRef = getProductRef(stock.product).toLowerCase()
    const warehouseName = getWarehouseName(stock.warehouse).toLowerCase()
    const matchesSearch = productName.includes(searchTerm.toLowerCase()) || productRef.includes(searchTerm.toLowerCase())
    const matchesWarehouse = !selectedWarehouse || stock.warehouse === parseInt(selectedWarehouse)
    return matchesSearch && matchesWarehouse
  })

  // Pagination
  const totalPages = Math.ceil(filteredStocks.length / itemsPerPage)
  const paginatedStocks = filteredStocks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Statistiques
  const totalQuantity = warehouseStocks.reduce((sum, s) => sum + (s.quantity || 0), 0)
  const lowStockCount = warehouseStocks.filter(s => s.quantity > 0 && s.quantity <= (s.minimum_stock || 5)).length
  const outStockCount = warehouseStocks.filter(s => s.quantity === 0).length

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num || 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/60">Chargement des stocks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-100">
      <div className="p-6 lg:p-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Gestion des stocks
              </h1>
              <p className="text-base-content/60 mt-1">
                Vue d'ensemble des stocks par entrepôt
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={fetchData}
                className="btn btn-outline gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
              <button 
                onClick={() => navigate('/stocks/ajouter')}
                className="btn btn-primary gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter du stock
              </button>
            </div>
          </div>
        </div>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
            <div className="card-body p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Stock total</p>
                  <p className="text-2xl font-bold">{formatNumber(totalQuantity)}</p>
                  <p className="text-xs text-base-content/50 mt-1">unités</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
            <div className="card-body p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Stock faible</p>
                  <p className="text-2xl font-bold text-warning">{lowStockCount}</p>
                  <p className="text-xs text-base-content/50 mt-1">produits</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
            <div className="card-body p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Rupture</p>
                  <p className="text-2xl font-bold text-error">{outStockCount}</p>
                  <p className="text-xs text-base-content/50 mt-1">produits</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-error" />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
            <div className="card-body p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base-content/60 text-sm">Entrepôts</p>
                  <p className="text-2xl font-bold">{warehouses.length}</p>
                  <p className="text-xs text-base-content/50 mt-1">actifs</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Warehouse className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body p-5">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  className="input input-bordered w-full pl-9"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>
              <select 
                className="select select-bordered w-full lg:w-64"
                value={selectedWarehouse}
                onChange={(e) => {
                  setSelectedWarehouse(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">Tous les entrepôts</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tableau */}
        {paginatedStocks.length === 0 ? (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body p-12 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-base-200 flex items-center justify-center mb-4">
                <Package className="w-10 h-10 text-base-content/30" />
              </div>
              <h3 className="text-lg font-medium text-base-content/60">Aucun stock trouvé</h3>
              <p className="text-base-content/50 text-sm mt-1">
                Commencez par ajouter du stock dans un entrepôt
              </p>
              <button 
                onClick={() => navigate('/stocks/ajouter')}
                className="btn btn-primary btn-sm mt-4 mx-auto"
              >
                <Plus className="w-3 h-3 mr-2" />
                Ajouter du stock
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="card bg-base-100 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr className="bg-base-200">
                      <th className="py-4">Produit</th>
                      <th>Référence</th>
                      <th>Entrepôt</th>
                      <th>Agence</th>
                      <th className="text-center">Stock</th>
                      <th>Statut</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStocks.map((stock, idx) => {
                      const status = getStockStatus(stock.quantity, stock.minimum_stock)
                      return (
                        <tr key={idx} className="hover:bg-base-200/50 transition-colors">
                          <td className="font-medium">{getProductName(stock.product)}</td>
                          <td className="font-mono text-sm">{getProductRef(stock.product)}</td>
                          <td>{getWarehouseName(stock.warehouse)}</td>
                          <td>{getAgenceName(stock.warehouse)}</td>
                          <td className="text-center">
                            <span className="text-lg font-bold">{formatNumber(stock.quantity)}</span>
                          </td>
                          <td>
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${status.bg} ${status.color}`}>
                              {status.icon}
                              <span className="text-sm font-medium">{status.label}</span>
                            </div>
                          </td>
                          <td className="text-right">
                            <button className="btn btn-ghost btn-sm gap-2">
                              <Edit className="w-4 h-4" />
                              Ajuster
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </button>
                <span className="flex items-center px-4 text-sm">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Stocks