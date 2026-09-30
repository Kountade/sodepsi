// src/components/station/VenteServiceDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from '../AxiosInstance';
import {
  ArrowLeft, Wrench, Droplet, Sparkles, Zap, Activity,
  User, FileText, CreditCard, Banknote, Smartphone, Wallet,
  CheckCircle, AlertCircle, X, Printer, Download, Trash2,
  RefreshCw, TrendingUp, Award, Clock, Phone, MapPin, Hash
} from 'lucide-react';

const VenteServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vente, setVente] = useState(null);
  const [service, setService] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '';

  const TYPE_ICONS = {
    lavage_manuel: Droplet,
    lavage_auto: Sparkles,
    gonflage: Zap,
    vidange: Droplet,
    graissage: Wrench,
    autre: Activity,
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await AxiosInstance.get(`/ventes-services/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setVente(res.data);

      const promises = [];
      if (res.data.service) {
        promises.push(
          AxiosInstance.get(`/services/${res.data.service}/`, {
            headers: { Authorization: `Token ${token}` }
          }).then(r => setService(r.data)).catch(() => {})
        );
      }
      if (res.data.client) {
        promises.push(
          AxiosInstance.get(`/clients/${res.data.client}/`, {
            headers: { Authorization: `Token ${token}` }
          }).then(r => setClient(r.data)).catch(() => {})
        );
      }
      await Promise.all(promises);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        showNotification('Vente introuvable', 'error');
        setTimeout(() => navigate('/ventes-services'), 2000);
      } else {
        showNotification('Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    try {
      const token = getToken();
      await AxiosInstance.delete(`/ventes-services/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Vente supprimée avec succès', 'success');
      setTimeout(() => navigate('/ventes-services'), 1200);
    } catch (err) {
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleMarkPaid = async () => {
    try {
      const token = getToken();
      await AxiosInstance.patch(`/ventes-services/${id}/`, {
        est_paye: true,
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      showNotification('Vente marquée comme payée', 'success');
      fetchData();
    } catch (err) {
      showNotification('Erreur lors de la mise à jour', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getPaiementBadge = (type) => {
    const configs = {
      cash: { label: 'Espèces', cls: 'badge-success', icon: Banknote, color: 'text-success' },
      carte: { label: 'Carte bancaire', cls: 'badge-info', icon: CreditCard, color: 'text-info' },
      mobile_money: { label: 'Mobile Money', cls: 'badge-warning', icon: Smartphone, color: 'text-warning' },
      carte_carburant: { label: 'Carte carburant', cls: 'badge-primary', icon: CreditCard, color: 'text-primary' },
      wallet: { label: 'Porte-monnaie', cls: 'badge-secondary', icon: Wallet, color: 'text-secondary' },
      credit: { label: 'Crédit', cls: 'badge-error', icon: FileText, color: 'text-error' },
    };
    const c = configs[type] || { label: type, cls: 'badge-ghost', icon: CreditCard, color: 'text-gray-500' };
    const Icon = c.icon;
    return { ...c, Icon };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12"></div>
          <p className="text-base font-semibold text-gray-500">Chargement de la vente...</p>
        </div>
      </div>
    );
  }

  if (!vente) {
    return (
      <div className="p-6 text-center">
        <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 mb-3">Vente introuvable</p>
        <button onClick={() => navigate('/ventes-services')} className="btn btn-primary btn-sm">
          Retour à la liste
        </button>
      </div>
    );
  }

  const paiement = getPaiementBadge(vente.type_paiement);
  const PaiementIcon = paiement.Icon;
  const remise = parseFloat(vente.remise || 0);
  const ServiceIcon = TYPE_ICONS[service?.type_service] || Wrench;

  return (
    <div className="space-y-4 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 print:hidden">
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
      {showDeleteModal && (
        <div className="modal modal-open print:hidden">
          <div className="modal-box max-w-md p-0 overflow-hidden">
            <div className="bg-error/10 p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-bold text-error">Confirmer la suppression</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600">Voulez-vous vraiment supprimer cette vente ?</p>
              <p className="font-semibold text-error mt-2">{vente.numero_vente}</p>
              <p className="text-sm text-gray-500 mt-1">
                Montant : {formatCurrency(vente.montant_net)}
              </p>
              <p className="text-xs text-warning mt-3">
                ⚠️ Cette action est irréversible.
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/ventes-services')}
            className="btn btn-ghost btn-circle"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2 bg-primary/10 rounded-xl">
            <ServiceIcon className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary">
              {vente.numero_vente}
            </h1>
            <p className="text-sm text-gray-500">
              Vente de service · {formatDate(vente.date_vente)}
            </p>
          </div>
          <span className={`badge badge-lg ${vente.est_paye ? 'badge-success' : 'badge-warning'} gap-2`}>
            {vente.est_paye ? (
              <><CheckCircle className="w-4 h-4" /> Payé</>
            ) : (
              <><Clock className="w-4 h-4" /> En attente</>
            )}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={fetchData} className="btn btn-outline btn-sm gap-2">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          {!vente.est_paye && (
            <button onClick={handleMarkPaid} className="btn btn-success btn-sm gap-2">
              <CheckCircle className="w-4 h-4" /> Marquer payé
            </button>
          )}
          <button onClick={handlePrint} className="btn btn-primary btn-sm gap-2">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
          <button
            onClick={() => { setShowDeleteModal(true); }}
            className="btn btn-error btn-sm gap-2"
          >
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-4">

          {/* Reçu imprimable */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none print:rounded-none">
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-5 print:bg-white print:text-black print:border-b-2 print:border-black">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black">REÇU DE SERVICE</h2>
                  <p className="text-sm opacity-80 print:opacity-100">
                    Prestation de service
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">{vente.numero_vente}</p>
                  <p className="text-xs opacity-80 print:opacity-100">
                    {formatDate(vente.date_vente)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">

              {/* Service */}
              {service && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Service rendu</p>
                  <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <ServiceIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg">{service.nom}</p>
                      <p className="text-xs text-gray-500">
                        Code : {service.code} · {service.type_service_display}
                      </p>
                      {service.description && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          {service.description}
                        </p>
                      )}
                      {service.duree_estimee && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          Durée estimée : {service.duree_estimee} min
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="divider my-1"></div>

              {/* Client */}
              {client ? (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Client</p>
                  <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{client.name}</p>
                      <p className="text-xs text-gray-500">Code : {client.code}</p>
                      {client.phone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" /> {client.phone}
                        </p>
                      )}
                      {client.address && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {client.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <User className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                  <p className="text-sm text-gray-500">Client anonyme</p>
                </div>
              )}

              <div className="divider my-1"></div>

              {/* Détails */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Hash className="w-4 h-4 text-info" />
                    <span className="text-sm">Quantité</span>
                  </div>
                  <span className="font-bold text-info text-lg">
                    x {vente.quantite}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-600">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm">Prix unitaire</span>
                  </div>
                  <span className="font-semibold">
                    {formatNumber(vente.prix_unitaire)} FCFA
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Montant brut</span>
                  <span className="font-semibold">{formatCurrency(vente.montant)}</span>
                </div>

                {remise > 0 && (
                  <div className="flex justify-between items-center text-error">
                    <span className="text-sm">Remise</span>
                    <span className="font-semibold">- {formatCurrency(remise)}</span>
                  </div>
                )}

                <div className="divider my-1"></div>

                <div className="flex justify-between items-center bg-success/10 p-3 rounded-lg">
                  <span className="font-bold text-lg">TOTAL À PAYER</span>
                  <span className="text-2xl font-black text-success">
                    {formatCurrency(vente.montant_net)}
                  </span>
                </div>
              </div>

              <div className="divider my-1"></div>

              {/* Paiement */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Paiement</p>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${paiement.cls.replace('badge-', 'bg-')}/20 flex items-center justify-center`}>
                      <PaiementIcon className={`w-5 h-5 ${paiement.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold">{paiement.label}</p>
                      {vente.reference_paiement && (
                        <p className="text-xs text-gray-500">
                          Réf. {vente.reference_paiement}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`badge ${vente.est_paye ? 'badge-success' : 'badge-warning'} badge-lg gap-1`}>
                    {vente.est_paye ? (
                      <><CheckCircle className="w-3 h-3" /> Payé</>
                    ) : (
                      <><Clock className="w-3 h-3" /> En attente</>
                    )}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {vente.notes && (
                <>
                  <div className="divider my-1"></div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Notes</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg italic">
                      "{vente.notes}"
                    </p>
                  </div>
                </>
              )}

              {/* Pied */}
              <div className="border-t-2 border-dashed pt-4 mt-6 text-center">
                <p className="text-xs text-gray-500">
                  Merci de votre confiance
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Reçu généré automatiquement par SODEPCI ERP
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-4 print:hidden">

          {/* Actions rapides */}
          <div className="bg-white rounded-xl shadow-md p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Actions rapides
            </h3>
            <div className="space-y-2">
              <button onClick={handlePrint} className="btn btn-outline w-full gap-2 justify-start">
                <Printer className="w-4 h-4" /> Imprimer le reçu
              </button>
              <button className="btn btn-outline w-full gap-2 justify-start">
                <Download className="w-4 h-4" /> Télécharger PDF
              </button>
              {!vente.est_paye && (
                <button onClick={handleMarkPaid} className="btn btn-success w-full gap-2 justify-start">
                  <CheckCircle className="w-4 h-4" /> Marquer comme payé
                </button>
              )}
              <button
                onClick={() => navigate('/ventes-services/nouveau')}
                className="btn btn-primary w-full gap-2 justify-start"
              >
                <Wrench className="w-4 h-4" /> Nouvelle vente
              </button>
            </div>
          </div>

          {/* Info service */}
          {service && (
            <div className="bg-white rounded-xl shadow-md p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                Informations service
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-semibold">{service.nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Code</span>
                  <span className="font-mono text-xs">{service.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="badge badge-info badge-sm">
                    {service.type_service_display}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Prix actuel</span>
                  <span className="font-semibold text-primary">
                    {formatNumber(service.prix)} FCFA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Durée</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {service.duree_estimee} min
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/services/${service.id}`)}
                className="btn btn-ghost btn-sm w-full mt-3 gap-2"
              >
                Voir le service →
              </button>
            </div>
          )}

          {/* Résumé financier */}
          <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-xl shadow-md p-5 border-t-4 border-success">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Résumé
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Montant brut</span>
                <span className="font-semibold">{formatCurrency(vente.montant)}</span>
              </div>
              {remise > 0 && (
                <div className="flex justify-between text-error">
                  <span>Remise</span>
                  <span>- {formatCurrency(remise)}</span>
                </div>
              )}
              <div className="divider my-1"></div>
              <div className="flex justify-between items-center">
                <span className="font-bold">Net à payer</span>
                <span className="text-2xl font-black text-success">
                  {formatCurrency(vente.montant_net)}
                </span>
              </div>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="bg-white rounded-xl shadow-md p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary" />
              Métadonnées
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">ID</span>
                <span className="font-mono">#{vente.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Créé le</span>
                <span>{formatDate(vente.date_vente)}</span>
              </div>
              {vente.updated_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Modifié le</span>
                  <span>{formatDate(vente.updated_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Styles d'impression */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:text-black { color: black !important; }
          .print\\:border-black { border-color: black !important; }
          .print\\:border-b-2 { border-bottom-width: 2px !important; }
          .print\\:opacity-100 { opacity: 1 !important; }
        }
      `}</style>
    </div>
  );
};

export default VenteServiceDetail;