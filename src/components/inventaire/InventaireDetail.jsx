// src/pages/inventaires/InventaireDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ClipboardList, Warehouse, Calendar, PlayCircle,
  CheckCircle, AlertCircle, Package, TrendingUp, TrendingDown,
  Save, Search, RefreshCw, ShieldCheck, Lock,
} from 'lucide-react';
import AxiosInstance from '../AxiosInstance';

// ============================================================
// UTILITAIRES
// ============================================================
const formatMoney = (v) => {
  const n = Number(v) || 0;
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
};

const getStatusBadge = (status) => {
  const config = {
    planned: { label: 'Planifié', className: 'badge-info' },
    in_progress: { label: 'En cours', className: 'badge-warning' },
    completed: { label: 'Terminé', className: 'badge-success' },
    cancelled: { label: 'Annulé', className: 'badge-error' },
    verified: { label: 'Vérifié', className: 'badge-primary' },
  };
  const c = config[status] || config.planned;
  return (
    <span className={`badge ${c.className} badge-md font-medium gap-2`}>
      {c.label}
    </span>
  );
};

// ============================================================
// COMPOSANT
// ============================================================
const InventaireDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('Token');
  const authHeaders = { Authorization: `Token ${token}` };

  const [inventaire, setInventaire] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [edits, setEdits] = useState({});
  const [savingId, setSavingId] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const isEditable =
    inventaire && inventaire.status === 'in_progress';

  // ============================================================
  // CHARGEMENT
  // ============================================================
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, linesRes] = await Promise.all([
        AxiosInstance.get(`/inventories/${id}/`, {
          headers: authHeaders,
        }),
        AxiosInstance.get(`/inventories/${id}/lines/`, {
          headers: authHeaders,
        }),
      ]);
      setInventaire(invRes.data);
      setLignes(linesRes.data || []);
      setFiltered(linesRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger cet inventaire.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // ============================================================
  // FILTRES
  // ============================================================
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFiltered(lignes);
      return;
    }
    const q = searchTerm.toLowerCase();
    setFiltered(
      lignes.filter(
        (l) =>
          l.product_name?.toLowerCase().includes(q) ||
          l.product_code?.toLowerCase().includes(q) ||
          l.lot_number?.toLowerCase().includes(q)
      )
    );
  }, [searchTerm, lignes]);

  // ============================================================
  // SAISIE QUANTITÉ RÉELLE
  // ============================================================
  const handleQuantityChange = (lineId, value) => {
    setEdits((prev) => ({ ...prev, [lineId]: value }));
  };

  const handleSaveLine = async (line) => {
    const raw = edits[line.id];
    if (raw === undefined || raw === '') return;

    const actual = parseInt(raw, 10);
    if (isNaN(actual) || actual < 0) {
      showNotification('Quantité invalide', 'error');
      return;
    }

    setSavingId(line.id);
    try {
      const res = await AxiosInstance.patch(
        `/inventory-lines/${line.id}/`,
        { actual_quantity: actual },
        { headers: authHeaders }
      );

      // Mettre à jour la ligne localement
      setLignes((prev) =>
        prev.map((l) => (l.id === line.id ? res.data : l))
      );
      setFiltered((prev) =>
        prev.map((l) => (l.id === line.id ? res.data : l))
      );
      setEdits((prev) => {
        const n = { ...prev };
        delete n[line.id];
        return n;
      });

      showNotification(`Quantité enregistrée pour ${line.product_name}`);
    } catch (err) {
      console.error(err);
      showNotification("Erreur lors de l'enregistrement", 'error');
    } finally {
      setSavingId(null);
    }
  };

  // ============================================================
  // AJUSTEMENT INDIVIDUEL
  // ============================================================
  const handleApplyAdjustment = async (line) => {
    if (line.difference === 0) {
      showNotification('Aucun écart à ajuster', 'error');
      return;
    }
    if (
      !window.confirm(
        `Appliquer l'ajustement de ${line.difference} unités pour ${line.product_name} ?`
      )
    )
      return;

    try {
      await AxiosInstance.post(
        `/inventory-lines/${line.id}/apply-adjustment/`,
        {},
        { headers: authHeaders }
      );
      showNotification('Ajustement appliqué');
      fetchData();
    } catch (err) {
      console.error(err);
      showNotification("Erreur lors de l'ajustement", 'error');
    }
  };

  // ============================================================
  // DÉMARRER / TERMINER
  // ============================================================
  const handleStart = async () => {
    if (!window.confirm('Démarrer cet inventaire ?')) return;
    try {
      await AxiosInstance.post(
        `/inventories/${id}/start/`,
        {},
        { headers: authHeaders }
      );
      showNotification('Inventaire démarré');
      fetchData();
    } catch (err) {
      console.error(err);
      showNotification('Erreur lors du démarrage', 'error');
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Terminer cet inventaire ?')) return;
    try {
      await AxiosInstance.post(
        `/inventories/${id}/complete/`,
        {},
        { headers: authHeaders }
      );
      showNotification('Inventaire terminé');
      fetchData();
    } catch (err) {
      console.error(err);
      showNotification('Erreur lors de la clôture', 'error');
    }
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (error || !inventaire) {
    return (
      <div className="p-6">
        <div className="alert alert-error">
          <AlertCircle className="w-5 h-5" />
          <span>{error || 'Inventaire introuvable'}</span>
        </div>
        <Link to="/inventaires" className="btn btn-outline btn-sm mt-4">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50">
          <div
            className={`alert ${
              notification.type === 'error' ? 'alert-error' : 'alert-success'
            } shadow-lg max-w-md`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'error' ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="mb-6">
        <Link
          to="/inventaires"
          className="text-sm text-base-content/60 hover:text-primary inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux inventaires
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="w-7 h-7 text-primary" />
              {inventaire.name}
            </h1>
            <p className="text-sm text-base-content/60 mt-1 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Warehouse className="w-4 h-4" />
                {inventaire.warehouse_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {inventaire.start_date
                  ? new Date(inventaire.start_date).toLocaleString('fr-FR')
                  : '—'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(inventaire.status)}

            {inventaire.status === 'planned' && (
              <button
                onClick={handleStart}
                className="btn btn-warning btn-sm gap-1"
              >
                <PlayCircle className="w-4 h-4" /> Démarrer
              </button>
            )}

            {inventaire.status === 'in_progress' && (
              <button
                onClick={handleComplete}
                className="btn btn-success btn-sm gap-1"
              >
                <CheckCircle className="w-4 h-4" /> Terminer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-4">
            <p className="text-xs text-base-content/60 flex items-center gap-1">
              <Package className="w-3 h-3" /> Lignes
            </p>
            <p className="text-2xl font-bold">{lignes.length}</p>
          </div>
        </div>

        <div className="card bg-info/10 shadow-sm border border-info/20">
          <div className="card-body p-4">
            <p className="text-xs text-info">Valeur théorique</p>
            <p className="text-xl font-bold text-info">
              {formatMoney(inventaire.total_expected_value)} F
            </p>
          </div>
        </div>

        <div className="card bg-primary/10 shadow-sm border border-primary/20">
          <div className="card-body p-4">
            <p className="text-xs text-primary">Valeur réelle</p>
            <p className="text-xl font-bold text-primary">
              {formatMoney(inventaire.total_actual_value)} F
            </p>
          </div>
        </div>

        <div
          className={`card shadow-sm border ${
            Number(inventaire.total_difference) >= 0
              ? 'bg-success/10 border-success/20'
              : 'bg-error/10 border-error/20'
          }`}
        >
          <div className="card-body p-4">
            <p
              className={`text-xs flex items-center gap-1 ${
                Number(inventaire.total_difference) >= 0
                  ? 'text-success'
                  : 'text-error'
              }`}
            >
              {Number(inventaire.total_difference) >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              Écart
            </p>
            <p
              className={`text-xl font-bold ${
                Number(inventaire.total_difference) >= 0
                  ? 'text-success'
                  : 'text-error'
              }`}
            >
              {Number(inventaire.total_difference) > 0 ? '+' : ''}
              {formatMoney(inventaire.total_difference)} F
            </p>
          </div>
        </div>
      </div>

      {/* Bandeau statut */}
      {!isEditable && (
        <div
          className={`alert mb-6 ${
            inventaire.status === 'completed'
              ? 'alert-success'
              : 'alert-info'
          }`}
        >
          {inventaire.status === 'planned' && (
            <>
              <AlertCircle className="w-5 h-5" />
              <span>
                Cliquez sur <b>Démarrer</b> pour générer les lignes et
                commencer la saisie.
              </span>
            </>
          )}
          {inventaire.status === 'completed' && (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Cet inventaire est terminé. La saisie est désactivée.</span>
            </>
          )}
          {inventaire.status === 'cancelled' && (
            <>
              <AlertCircle className="w-5 h-5" />
              <span>Cet inventaire a été annulé.</span>
            </>
          )}
        </div>
      )}

      {/* Recherche */}
      <div className="card bg-base-100 shadow-md mb-4">
        <div className="card-body p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
              <input
                type="text"
                placeholder="Rechercher un produit, code, lot..."
                className="input input-bordered w-full pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={fetchData}
              className="btn btn-outline btn-sm gap-1"
            >
              <RefreshCw className="w-4 h-4" /> Rafraîchir
            </button>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="card bg-base-100 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead className="bg-base-200">
              <tr>
                <th>Produit</th>
                <th>Code</th>
                <th>Lot</th>
                <th className="text-right">Qté théorique</th>
                <th className="text-right">Qté réelle</th>
                <th className="text-right">Écart</th>
                <th className="text-right">Valeur écart</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-base-content/20 mb-2" />
                    <p className="text-base-content/60">
                      {searchTerm
                        ? 'Aucun produit ne correspond'
                        : 'Aucune ligne dans cet inventaire'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((l) => {
                  const diff = Number(l.difference) || 0;
                  const isPositive = diff > 0;
                  const isNeutral = diff === 0;
                  const editValue =
                    edits[l.id] !== undefined
                      ? edits[l.id]
                      : l.actual_quantity ?? '';

                  return (
                    <tr key={l.id} className="hover">
                      <td className="font-medium">{l.product_name}</td>
                      <td className="font-mono text-xs">{l.product_code}</td>
                      <td className="text-xs">
                        {l.lot_number || '—'}
                      </td>
                      <td className="text-right font-mono">
                        {l.expected_quantity}
                      </td>
                      <td className="text-right">
                        {isEditable ? (
                          <input
                            type="number"
                            min="0"
                            className="input input-bordered input-sm w-24 text-right font-mono"
                            value={editValue}
                            onChange={(e) =>
                              handleQuantityChange(l.id, e.target.value)
                            }
                            onBlur={() => handleSaveLine(l)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveLine(l);
                              }
                            }}
                          />
                        ) : (
                          <span className="font-mono">
                            {l.actual_quantity ?? '—'}
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        {l.actual_quantity === null ? (
                          <span className="text-base-content/40">—</span>
                        ) : (
                          <span
                            className={`font-bold ${
                              isNeutral
                                ? 'text-base-content/60'
                                : isPositive
                                ? 'text-success'
                                : 'text-error'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {diff}
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        {l.actual_quantity === null ? (
                          <span className="text-base-content/40">—</span>
                        ) : (
                          <span
                            className={`font-medium ${
                              isNeutral
                                ? 'text-base-content/60'
                                : isPositive
                                ? 'text-success'
                                : 'text-error'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {formatMoney(l.value_difference)} F
                          </span>
                        )}
                      </td>
                      <td>
                        {l.is_verified ? (
                          <span className="badge badge-primary badge-sm gap-1">
                            <ShieldCheck className="w-3 h-3" /> Ajusté
                          </span>
                        ) : l.actual_quantity !== null ? (
                          <span className="badge badge-warning badge-sm">
                            Saisi
                          </span>
                        ) : (
                          <span className="badge badge-ghost badge-sm">
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        {!l.is_verified &&
                          l.actual_quantity !== null &&
                          diff !== 0 &&
                          isEditable && (
                            <button
                              onClick={() => handleApplyAdjustment(l)}
                              className="btn btn-xs btn-warning gap-1"
                              title="Appliquer l'ajustement de stock"
                            >
                              <ShieldCheck className="w-3 h-3" /> Ajuster
                            </button>
                          )}
                        {l.is_verified && (
                          <Lock className="w-4 h-4 text-base-content/30 ml-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pied de page */}
      {inventaire.notes && (
        <div className="card bg-base-100 shadow-sm mt-4">
          <div className="card-body p-4">
            <p className="text-xs text-base-content/60 font-medium mb-1">
              Notes
            </p>
            <p className="text-sm whitespace-pre-wrap">{inventaire.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventaireDetail;