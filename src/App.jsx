// App.jsx
import './App.css';
import Register from './components/Register';
import Login from './components/Login';
import Home from './components/Home';
import Navbar from './components/Navbar';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoutes';
import PasswordResetRequest from './components/PasswordResetRequest';
import PasswordReset from './components/PasswordReset';

// Modules Logistique/Catégories
import Categories from './components/logistique/Categories';
import CategoryForm from './components/logistique/CategoryForm';
import CategoryDetails from './components/logistique/CategoryDetails';

// Modules Produits
import ProductsList from './components/logistique/ProductsList';
import ProductForm from './components/logistique/ProductForm';
import ProductDetails from './components/logistique/ProductDetails';
import UnitesMesure from './components/logistique/UnitesMesure';
import UniteMesureForm from './components/logistique/UniteMesureForm';

// Modules Stocks
import StocksList from './components/logistique/StocksList';
import LotsList from './components/logistique/LotsList';
import EntrepotForm from './components/logistique/EntrepotForm';
import Entrepots from './components/logistique/Entrepots';
import EntrepotDetails from './components/logistique/EntrepotDetails';
import MouvementsStock from './components/logistique/MouvementsStock';
import Transferts from './components/logistique/Transferts';
import TransfertForm from './components/logistique/TransfertForm';
import TransfertDetails from './components/logistique/TransfertDetails';
// Modules Entrepôts

import FournisseursList from './components/achatsfournisseurs/FournisseursList';
import FournisseursForm from './components/achatsfournisseurs/FournisseursForm'; 
import FournisseursDetails from './components/achatsfournisseurs/FournisseursDetails';

// Modules Commandes 
import CommandesList from './components/achatsfournisseurs/CommandesList';
import CommandeForm from './components/achatsfournisseurs/CommandeForm';
import CommandeDetails from './components/achatsfournisseurs/CommandeDetails';
import CommandePdf from './components/achatsfournisseurs/CommandePdf';
import ReceptionsList from './components/achatsfournisseurs/ReceptionsList';
import ReceptionForm from './components/achatsfournisseurs/ReceptionForm';
import ReceptionDetails from './components/achatsfournisseurs/ReceptionDetails';
import ReceptionPdf from './components/achatsfournisseurs/ReceptionPdf';
import PurchaseReturnsList from './components/achatsfournisseurs/PurchaseReturnsList';
import PurchaseReturnForm from './components/achatsfournisseurs/PurchaseReturnForm';
import PurchaseReturnDetails from './components/achatsfournisseurs/PurchaseReturnDetails';
import PurchaseReturnPdf from './components/achatsfournisseurs/PurchaseReturnPdf';
import PurchaseAlerts from './components/achatsfournisseurs/PurchaseAlerts';
import InventaireList from './components/inventaire/InventaireList';
import InventaireForm from './components/inventaire/InventaireForm';
import AlertsDashboard from './pages/AlertsDashboard';
import InventaireDetails from './components/inventaire/InventaireDetails';

import ClientsList from './components/ventesclients/ClientsList';
import ClientForm from './components/ventesclients/ClientForm';
import ClientDetail from './components/ventesclients/ClientDetail';
import VentesList from './components/ventesclients/VentesList';
import VenteForm from './components/ventesclients/VenteForm';
import VenteDetail from './components/ventesclients/VenteDetail';
import VentePdf from './components/ventesclients/VentePdf';
import FacturesList from './components/ventesclients/FacturesList';
import FactureForm from './components/ventesclients/FactureForm';
import FactureDetail from './components/ventesclients/FactureDetail';
import FacturePdf from './components/ventesclients/FacturePdf';
import PaiementsList from './components/ventesclients/PaiementsList';
import PaiementForm from './components/ventesclients/PaiementForm';
import PaiementDetail from './components/ventesclients/PaiementDetail';
import PaiementPdf from './components/ventesclients/PaiementPdf';
import CompteListe from './components/finances/CompteListe';
import CompteForm from './components/finances/CompteForm';
import CompteDetail from './components/finances/CompteDetail';
import EcritureListe from './components/finances/EcritureListe';
import EcritureDetail from './components/finances/EcritureDetail';
import EcritureForm from './components/finances/EcritureForm';
import TresorerieListe from './components/finances/TresorerieListe';
import TresorerieForm from './components/finances/TresorerieForm';
import TresorerieDetail from './components/finances/TresorerieDetail';
import MouvementTresorerieListe from './components/finances/MouvementTresorerieListe';
import MouvementTresorerieForm from './components/finances/MouvementTresorerieForm';
import DepenseListe from './components/finances/DepenseListe';
import DepenseForm from './components/finances/DepenseForm';
import DepenseDetail from './components/finances/DepenseDetail';
import ConfigurationFinanciere from './components/finances/ConfigurationFinanciere';
import BudgetCategorieListe from './components/finances/BudgetCategorieListe';
import BudgetCategorieForm from './components/finances/BudgetCategorieForm';
import BudgetListe from './components/finances/BudgetListe';
import BudgetForm from './components/finances/BudgetForm';
import RapportFinancierListe from './components/finances/RapportFinancierListe';
import RapportFinancierForm from './components/finances/RapportFinancierForm';
import RapportFinancierDetail from './components/finances/RapportFinancierDetail';
import RapportPdf from './components/finances/RapportPdf';

import DevisList from './components/ventesclients/DevisList';
import DevisForm from './components/ventesclients/DevisForm';
import DevisDetail from './components/ventesclients/DevisDetail';
import DevisPdf from './components/ventesclients/DevisPdf';
import PosForm from './components/ventesclients/PosForm';

import CaissesForm from './components/tresorerie/CaissesForm';
import CaissesList from './components/tresorerie/CaissesList';
import CaissesDetail from './components/tresorerie/CaissesDetail';

import ComptesBancairesList from './components/tresorerie/ComptesBancairesList';
import CompteBancaireForm from './components/tresorerie/ComptesBancairesForm';
import CompteBancaireDetail from './components/tresorerie/CompteBancaireDetail';

import MouvementsTresorerieList from './components/tresorerie/MouvementsTresorerieList';

import PrevisionsList from './components/tresorerie/PrevisionsList';
import PrevisionsForm from './components/tresorerie/PrevisionsForm';
import PrevisionsDetail from './components/tresorerie/PrevisionsDetail';


import FraisList from './components/tresorerie/FraisList';
import FraisDetail from './components/tresorerie/FraisDetail';
import FraisForm from './components/tresorerie/FraisForm';

import Dashboard from './components/dashboard/Dashboard';
import Statistiques from './components/dashboard/Statistiques';
import Analyses from './components/dashboard/Analyses';

function App() {
  const location = useLocation();
  
  // Routes sans Navbar (pages d'authentification)
  const noNavBar = location.pathname === "/" || 
                   location.pathname === "/register" || 
                   location.pathname.includes("password") ||
                   location.pathname === "/login";

  return (
    <>
      {noNavBar ? (
        // Routes SANS Navbar (authentification)
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/request/password_reset" element={<PasswordResetRequest />} />
          <Route path="/password-reset/:token" element={<PasswordReset />} />
        </Routes>
      ) : (
        // Routes AVEC Navbar
        <Navbar
          content={
            <Routes>
              {/* Route protégée */}
              <Route element={<ProtectedRoute />}>
               
           
               <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/statistiques" element={<Statistiques />} />
        <Route path="/analyses" element={<Analyses />} />

                {/* ==================== CATÉGORIES ==================== */}
                <Route path="/categories" element={<Categories />} />
                <Route path="/categories/nouveau" element={<CategoryForm />} />
                <Route path="/categories/:id/modifier" element={<CategoryForm />} />
                <Route path="/categories/:id" element={<CategoryDetails />} />

                <Route path="/caisses" element={<CaissesList/>}/>
                 <Route path="/caisses/nouveau" element={<CaissesForm/>}/>
                  <Route path="/caisses/:id/modifier" element={<CaissesForm/>}/>
                   <Route path="/caisses/:id" element={<CaissesDetail />} />

                <Route path="/comptes-bancaires" element={<ComptesBancairesList />} />
<Route path="/comptes-bancaires/nouveau" element={<CompteBancaireForm />} />
<Route path="/comptes-bancaires/:id" element={<CompteBancaireDetail />} />
<Route path="/comptes-bancaires/modifier/:id" element={<CompteBancaireForm />} />


<Route path="/mouvements-tresorerie" element={<MouvementsTresorerieList />} />

<Route path="/previsions" element={<PrevisionsList />} />
<Route path="/previsions/nouveau" element={<PrevisionsForm />} />
<Route path="/previsions/:id" element={<PrevisionsDetail />} /> {/* à créer */}
<Route path="/previsions/modifier/:id" element={<PrevisionsForm />} />


 <Route path="/frais" element={<FraisList />} />
        <Route path="/frais/nouveau" element={<FraisForm />} />
        <Route path="/frais/:id" element={<FraisDetail />} />
        <Route path="/frais/modifier/:id" element={<FraisForm />} />


                {/* ==================== PRODUITS ==================== */}
                <Route path="/produits" element={<ProductsList />} />
                <Route path="/produits/nouveau" element={<ProductForm />} />
                <Route path="/produits/:id/modifier" element={<ProductForm />} />
                <Route path="/produits/:id" element={<ProductDetails />} />

 <Route path="/stocks" element={<StocksList />} />
   <Route path="/lots" element={<LotsList />} />

   <Route path="/unites-mesure" element={<UnitesMesure />} />
<Route path="/unites-mesure/nouveau" element={<UniteMesureForm />} />
<Route path="/unites-mesure/:id/modifier" element={<UniteMesureForm />} />
                {/* ==================== STOCKS ==================== 
               
                <Route path="/stocks/:productId" element={<StockDetails />} />
              
                <Route path="/lots/:id" element={<LotDetails />} />
                <Route path="/mouvements-stock" element={<MovementsList />} />*/}
                <Route path="/inventaire" element={<InventaireList />} />
                <Route path="/inventaire/nouveau" element={<InventaireForm />} />
                <Route path="/inventaire/:id" element={<InventaireDetails />} />


<Route path="/mouvements-stock" element={<MouvementsStock />} />
              <Route path="/entrepots" element={<Entrepots />} />
<Route path="/entrepots/nouveau" element={<EntrepotForm />} />
<Route path="/entrepots/:id/modifier" element={<EntrepotForm />} />
<Route path="/entrepots/:id" element={<EntrepotDetails />} />


<Route path="/transferts" element={<Transferts />} />
<Route path="/transferts/nouveau" element={<TransfertForm />} />
<Route path="/transferts/:id" element={<TransfertDetails />} />

                {/* ==================== ALERTES EXPIRATION ==================== 
                <Route path="/alertes-expiration" element={<ExpiryAlertsList />} />*/}

                {/* ==================== VENTES ====================    */}
                  <Route path="/ventes" element={<VentesList />} />
                  <Route path="/ventes/nouveau" element={<VenteForm />} />
                  <Route path="/ventes/:id" element={<VenteDetail />} />
                  <Route path="/ventes/:id/modifier" element={<VenteForm />} />
                  <Route path="/ventes/:id/pdf" element={<VentePdf />} />
                  {/* POS - Point de Vente (Interface tactile) */}
            <Route path="point-de-vente" element={<PosForm />} />
                
           <Route path="/devis" element={<DevisList />} />
            <Route path="/devis/nouveau" element={<DevisForm />} />
            <Route path="/devis/:id" element={<DevisDetail />} />
            <Route path="/devis/:id/modifier" element={<DevisForm />} />
            <Route path="/devis/:id/pdf" element={<DevisPdf />} />
                
                <Route path="/factures" element={<FacturesList />} />
                <Route path="/factures/nouvelle" element={<FactureForm />} />
                 <Route path="/factures/:id" element={<FactureDetail />} />
                    <Route path="/factures/:id/modifier" element={<FactureForm />} />
                   <Route path="/factures/:id/pdf" element={<FacturePdf />} />
             

               
                <Route path="/clients" element={<ClientsList />} />
                <Route path="/clients/nouveau" element={<ClientForm />} />
                <Route path="/clients/:id/modifier" element={<ClientForm />} />
                <Route path="/clients/:id" element={<ClientDetail />} />

                              <Route path="/paiements" element={<PaiementsList />} />
<Route path="/paiements/nouveau" element={<PaiementForm />} />
<Route path="/paiements/:id" element={<PaiementDetail />} />
<Route path="/paiements/:id/modifier" element={<PaiementForm />} />
<Route path="/paiements/:id/pdf" element={<PaiementPdf />} />

                {/* ==================== FOURNISSEURS & ACHATS ==================== 
              
                {/* ==================== ACHATS & FOURNISSEURS ==================== */}
                {/* Fournisseurs */}
                <Route path="/fournisseurs" element={<FournisseursList />} />
                <Route path="/fournisseurs/nouveau" element={<FournisseursForm />} />
                <Route path="/fournisseurs/:id/modifier" element={<FournisseursForm />} />
                <Route path="/fournisseurs/:id" element={<FournisseursDetails />} />

                

 {/* Commandes fournisseurs */}
                <Route path="/commandes-fournisseurs" element={<CommandesList />} />
                <Route path="/commandes-fournisseurs/nouveau" element={<CommandeForm />} />
                <Route path="/commandes-fournisseurs/:id/modifier" element={<CommandeForm />} />
                <Route path="/commandes-fournisseurs/:id" element={<CommandeDetails />} />
                <Route path="/commandes-fournisseurs/:id/pdf" element={<CommandePdf />} />


                <Route path="/receptions" element={<ReceptionsList />} />
                <Route path="/receptions/nouveau" element={<ReceptionForm />} />
                <Route path="/receptions/:id" element={<ReceptionDetails />} />
                <Route path="/receptions/:id/pdf" element={<ReceptionPdf />} />


                <Route path="/purchase-returns" element={<PurchaseReturnsList />} />
                <Route path="/purchase-returns/nouveau" element={<PurchaseReturnForm />} />
                <Route path="/purchase-returns/:id" element={<PurchaseReturnDetails />} />
                <Route path="/purchase-returns/:id/pdf" element={<PurchaseReturnPdf />} />
                <Route path="/purchase-alerts" element={<PurchaseAlerts />} />
               
                <Route path="/comptes" element={<CompteListe />} />
                <Route path="/comptes/nouveau" element={<CompteForm />} />
                <Route path="/comptes/:id" element={<CompteDetail />} />
                <Route path="/comptes/:id/modifier" element={<CompteForm />} />

        
        {/* Route pour le centre d'alertes global */}
               <Route path="/dashboard/alerts" element={<AlertsDashboard />} />
              
<Route path="/ecritures" element={<EcritureListe />} />
<Route path="/ecritures/nouveau" element={<EcritureForm />} />
<Route path="/ecritures/:id" element={<EcritureDetail />} />
<Route path="/ecritures/:id/modifier" element={<EcritureForm />} />



<Route path="/tresorerie" element={<TresorerieListe />} />
<Route path="/tresorerie/nouveau" element={<TresorerieForm />} />
<Route path="/tresorerie/:id" element={<TresorerieDetail />} />
<Route path="/tresorerie/:id/modifier" element={<TresorerieForm />} />


<Route path="/mouvements-tresorerie" element={<MouvementTresorerieListe />} />
<Route path="/mouvements-tresorerie/nouveau" element={<MouvementTresorerieForm />} />



<Route path="/depenses" element={<DepenseListe />} />
<Route path="/depenses/nouveau" element={<DepenseForm />} />
<Route path="/depenses/:id" element={<DepenseDetail />} />
<Route path="/depenses/:id/modifier" element={<DepenseForm />} />




<Route path="/configuration-financiere" element={<ConfigurationFinanciere />} />

 
<Route path="/budget-categories" element={<BudgetCategorieListe />} />
<Route path="/budget-categories/nouveau" element={<BudgetCategorieForm />} />



<Route path="/budgets" element={<BudgetListe />} />
<Route path="/budgets/nouveau" element={<BudgetForm />} />
<Route path="/budgets/:id/modifier" element={<BudgetForm />} />

<Route path="/rapports-financiers" element={<RapportFinancierListe />} />
<Route path="/rapports-financiers/nouveau" element={<RapportFinancierForm />} />
<Route path="/rapports-financiers/:id" element={<RapportFinancierDetail />} />
<Route path="/rapports-financiers/:id/modifier" element={<RapportFinancierForm />} />
<Route path="/rapports-financiers/:id/pdf" element={<RapportPdf />} />
{/* ==================== FINANCES ==================== 

<Route path="/finances-dashboard" element={<FinancesDashboard />} />


                */}

                {/* ==================== LIVRAISONS ==================== 
                <Route path="/livraisons" element={<DeliveriesList />} />
                <Route path="/livraisons/:id" element={<DeliveryDetails />} />
*/}
                {/* ==================== AUDIT ====================
                <Route path="/audit" element={<AuditLog />} />
 */}
                {/* ==================== PARAMÈTRES ==================== */}

                  {/* ==================== COMPANY CONFIG ==================== */}
               
              </Route>
            </Routes>
          }
        />
      )}
    </>
  );
}

export default App;