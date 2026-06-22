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





// Modules Audit


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
                <Route path="/home" element={<Home />} />
                <Route path="/dashboard" element={<Home />} />

                {/* ==================== CATÉGORIES ==================== */}
                <Route path="/categories" element={<Categories />} />
                <Route path="/categories/nouveau" element={<CategoryForm />} />
                <Route path="/categories/:id/modifier" element={<CategoryForm />} />
                <Route path="/categories/:id" element={<CategoryDetails />} />

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

                {/* ==================== VENTES ==================== 
                <Route path="/ventes" element={<SalesList />} />
                <Route path="/ventes/nouveau" element={<SaleForm />} />
                <Route path="/ventes/:id" element={<SaleDetails />} />
                <Route path="/point-de-vente" element={<PointOfSale />} />*/}

                {/* ==================== CLIENTS ==================== 
                <Route path="/clients" element={<ClientsList />} />
                <Route path="/clients/nouveau" element={<ClientForm />} />
                <Route path="/clients/:id/modifier" element={<ClientForm />} />
                <Route path="/clients/:id" element={<ClientDetails />} />*/}

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

                {/* ==================== FINANCES ==================== 
                <Route path="/depenses" element={<ExpensesList />} />
                <Route path="/tresorerie" element={<CashFlowList />} />*/}

                {/* ==================== LIVRAISONS ==================== 
                <Route path="/livraisons" element={<DeliveriesList />} />
                <Route path="/livraisons/:id" element={<DeliveryDetails />} />
*/}
                {/* ==================== AUDIT ====================
                <Route path="/audit" element={<AuditLog />} />
 */}
                {/* ==================== PARAMÈTRES ==================== 
                <Route path="/parametres" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />*/}
              </Route>
            </Routes>
          }
        />
      )}
    </>
  );
}

export default App;