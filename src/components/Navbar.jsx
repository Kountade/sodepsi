// src/components/Navbar.jsx - Version avec STATION SERVICES - IMPORTS CORRIGÉS

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Package, 
  Building2, 
  Tags, 
  LogOut, 
  UserCircle, 
  Settings, 
  Warehouse, 
  ShoppingCart,
  Receipt,
  FileText,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Bell,
  Moon,
  Sun,
  Shield,
  Clock,
  Calendar,
  TrendingUp,
  CreditCard,
  Boxes,
  AlertTriangle,
  Search,
  HelpCircle,
  History,
  Truck,
  ArrowLeftRight,
  DollarSign,
  Ruler,
  ClipboardCheck,
  MoveHorizontal,
  Calculator,
  PackageCheck,
  Layers,
  ArrowLeftRight as ReturnIcon,
  AlertOctagon,
  Wallet,
  BookOpen,
  PiggyBank,
  Cog,
  Database,
  BellRing,
  Printer,
  UserCog,
  CalendarClock,
  RefreshCw,
  Activity,
  Award,
  BarChart3,
  Edit,
  Eye,
  Landmark,
  Coins,
  ReceiptText,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Gauge,
  AlertCircle,
  Banknote,
  TrendingDown,
  ScrollText,
  Scale,
  FileSpreadsheet,
  Handshake,
  FileCheck,
  RotateCcw,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  BarChart,
  Clipboard,
  AlertCircle as AlertCircleIcon,
  Archive,
  PackageOpen,
  Truck as TruckIcon,
  Map,
  UserCheck,
  Route,
  PackagePlus,
  PlusCircle,
  BadgeDollarSign,
  Barcode,
  GraduationCap,
  UserPlus,
  FilePlus,
  CreditCard as CreditCardPlus,
  Plus,
  Grid3x3,
  TableProperties,
  // ============================================================
  // ✅ ICÔNES POUR STATION SERVICES (UNIQUEMENT CELLES NON DÉCLARÉES)
  // ============================================================
  Fuel,
  Droplet,
  Car,
  Wrench,
  Timer,
  Server,
  AlertCircle as AlertCircleIcon2,
  BarChart3 as StatsChart,
  Settings as SettingsGear,
  Fuel as GasPump,
  Droplet as OilDrop,
  Car as CarWash,
  Wrench as Tools,
  Timer as Hourglass,
  Server as Pump
} from 'lucide-react';

import axiosInstance from './AxiosInstance';

// Configuration des rôles
const ROLE_CONFIG = {
  admin: { 
    label: 'Administrateur', 
    color: 'error', 
    icon: Shield, 
    description: 'Accès total', 
    level: 100 
  },
  gestionnaire: { 
    label: 'Gestionnaire', 
    color: 'warning', 
    icon: UserCog, 
    description: 'Gestion complète', 
    level: 80 
  },
  vendeur: { 
    label: 'Vendeur', 
    color: 'primary', 
    icon: ShoppingBag, 
    description: 'Ventes uniquement', 
    level: 60 
  },
  magasinier: { 
    label: 'Magasinier', 
    color: 'success', 
    icon: Package, 
    description: 'Gestion de stock', 
    level: 70 
  },
  comptable: { 
    label: 'Comptable', 
    color: 'secondary', 
    icon: Calculator, 
    description: 'Gestion financière', 
    level: 90 
  }
};

const Navbar = ({ content, mode, toggleColorMode }) => {
  const location = useLocation();
  const path = location.pathname || '/';
  const navigate = useNavigate();

  // États principaux
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState({
    'TABLEAU DE BORD': true,
    'VENTES': true,
    'PORTE-MONNAIE CLIENTS': false,
    'PRODUITS & STOCKS': true,
    'ACHATS & FOURNISSEURS': false,
    'FINANCES': true,
    'TRÉSORERIE': false,
    'LIVRAISONS': false,
    'STATION SERVICES': false,
    'PARAMÈTRES': false,
    'MON ESPACE': false
  });
  
  const [userInitial, setUserInitial] = useState('U');
  const [userFullName, setUserFullName] = useState('Utilisateur');
  const [currentTime, setCurrentTime] = useState(new Date());

  // État pour l'établissement
  const [etablissement, setEtablissement] = useState(null);
  const [loadingEtab, setLoadingEtab] = useState(true);
  const [logoUrl, setLogoUrl] = useState(null);

  // États des compteurs
  const [ventesImpayees, setVentesImpayees] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [commandesEnAttente, setCommandesEnAttente] = useState(0);
  const [stocksFaibles, setStocksFaibles] = useState(0);
  const [alertesStockCount, setAlertesStockCount] = useState(0);
  const [lotsExpirant, setLotsExpirant] = useState(0);
  const [inventairesEnCours, setInventairesEnCours] = useState(0);
  const [facturesImpayees, setFacturesImpayees] = useState(0);
  const [receptionsEnAttente, setReceptionsEnAttente] = useState(0);
  const [retoursEnAttente, setRetoursEnAttente] = useState(0);
  const [paiementsFournisseursEnAttente, setPaiementsFournisseursEnAttente] = useState(0);
  const [depensesEnAttente, setDepensesEnAttente] = useState(0);
  const [budgetsAlertes, setBudgetsAlertes] = useState(0);
  const [ecrituresBrouillon, setEcrituresBrouillon] = useState(0);
  const [tresorerieAlerte, setTresorerieAlerte] = useState(0);

  // États pour STATION SERVICES
  const [cuvesAlerte, setCuvesAlerte] = useState(0);
  const [pompesActives, setPompesActives] = useState(0);
  const [ventesCarburantJour, setVentesCarburantJour] = useState(0);
  const [servicesEnAttente, setServicesEnAttente] = useState(0);
  const [niveauCuveMoyen, setNiveauCuveMoyen] = useState(0);

  // Récupérer l'utilisateur connecté
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('User');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  };

  const user = getUserData();
  const role = user?.role || 'vendeur';
  const userEmail = user?.email || '';
  const firstName = user?.first_name || '';
  const lastName = user?.last_name || '';
  const userName = firstName || lastName || user?.username || userEmail?.split('@')[0] || 'Utilisateur';

  // Horloge
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Permissions
  const isAdmin = role === 'admin';
  const isGestionnaire = role === 'gestionnaire' || isAdmin;
  const isVendeur = role === 'vendeur';
  const isMagasinier = role === 'magasinier' || isGestionnaire;
  const isComptable = role === 'comptable' || isAdmin;

  // Initiale utilisateur
  useEffect(() => {
    if (firstName && lastName) {
      setUserInitial(`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase());
      setUserFullName(`${firstName} ${lastName}`);
    } else if (userName) {
      setUserInitial(userName.charAt(0).toUpperCase());
      setUserFullName(userName);
    }
  }, [firstName, lastName, userName]);

  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.vendeur;
  const RoleIcon = roleConfig.icon;

  // Fonction pour construire l'URL complète du logo
  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
      return logoPath;
    }
    if (logoPath.startsWith('/media/') || logoPath.startsWith('/static/')) {
      const baseURL = axiosInstance.defaults.baseURL || '';
      return `${baseURL}${logoPath}`;
    }
    const baseURL = axiosInstance.defaults.baseURL || '';
    return `${baseURL}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`;
  };

  // Chargement des données de l'établissement
  useEffect(() => {
    const fetchEtablissement = async () => {
      try {
        const response = await axiosInstance.get('/etablissements/unique/');
        if (response.data) {
          setEtablissement(response.data);
          if (response.data.logo) {
            const fullLogoUrl = getLogoUrl(response.data.logo);
            setLogoUrl(fullLogoUrl);
          }
        }
      } catch (error) {
        console.error('Erreur chargement établissement :', error);
      } finally {
        setLoadingEtab(false);
      }
    };
    fetchEtablissement();
  }, []);

  // Charger les autres données
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('Token');
        if (!token) return;

        if (isAdmin || isGestionnaire) {
          // ... (tous vos appels API existants)
          
          // Chargement des données STATION SERVICES
          try {
            const cuvesRes = await axiosInstance.get('/cuves/alert/', {
              headers: { Authorization: `Token ${token}` }
            }).catch(() => ({ data: [] }));
            setCuvesAlerte(cuvesRes.data?.length || 0);

            const pompesRes = await axiosInstance.get('/pompes/active/', {
              headers: { Authorization: `Token ${token}` }
            }).catch(() => ({ data: [] }));
            setPompesActives(pompesRes.data?.length || 0);

            const ventesCarburantRes = await axiosInstance.get('/ventes-carburant/today/', {
              headers: { Authorization: `Token ${token}` }
            }).catch(() => ({ data: { total: 0 } }));
            setVentesCarburantJour(ventesCarburantRes.data?.total || 0);

            const servicesRes = await axiosInstance.get('/ventes-services/pending/', {
              headers: { Authorization: `Token ${token}` }
            }).catch(() => ({ data: [] }));
            setServicesEnAttente(servicesRes.data?.length || 0);

            const niveauRes = await axiosInstance.get('/cuves/niveau-moyen/', {
              headers: { Authorization: `Token ${token}` }
            }).catch(() => ({ data: { niveau_moyen: 0 } }));
            setNiveauCuveMoyen(niveauRes.data?.niveau_moyen || 0);

          } catch (error) {
            console.error('Erreur chargement données station:', error);
          }
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
      }
    };

    loadData();
  }, [role, isAdmin, isGestionnaire]);

  // Gestion des sections
  const handleSectionToggle = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Déconnexion
  const logoutUser = () => {
    setIsUserMenuOpen(false);
    localStorage.removeItem('Token');
    localStorage.removeItem('User');
    navigate('/');
  };

  // ============================================================
  // MENU SECTIONS - TOUT EN FRANÇAIS
  // ============================================================
  
  const menuSections = [
    // 1. TABLEAU DE BORD
    {
      name: 'TABLEAU DE BORD',
      icon: LayoutDashboard,
      items: [
        { id: 'dashboard', text: 'Tableau de Bord', icon: LayoutDashboard, path: '/dashboard', permission: true },
        { id: 'statistiques', text: 'Statistiques', icon: TrendingUp, path: '/statistiques', permission: isAdmin || isGestionnaire },
        { id: 'analyses', text: 'Analyses', icon: BarChart3, path: '/analyses', permission: isAdmin || isGestionnaire }
      ]
    },

    // 2. VENTES
    {
      name: 'VENTES',
      icon: ShoppingCart,
      items: [
        { id: 'ventes', text: 'Ventes', icon: ShoppingCart, path: '/ventes', permission: isAdmin || isGestionnaire || isVendeur, badge: ventesImpayees > 0 ? ventesImpayees : 0 },
        { id: 'nouvelle-vente', text: 'Nouvelle Vente', icon: PlusCircle, path: '/ventes/nouveau', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'separator-ventes-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'clients', text: 'Clients', icon: Users, path: '/clients', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'nouveau-client', text: 'Nouveau Client', icon: UserPlus, path: '/clients/nouveau', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'separator-ventes-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'devis', text: 'Devis', icon: FileText, path: '/devis', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'nouveau-devis', text: 'Nouveau Devis', icon: FilePlus, path: '/devis/nouveau', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'separator-ventes-3', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'factures', text: 'Factures Clients', icon: Receipt, path: '/factures', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'paiements', text: 'Paiements Clients', icon: CreditCard, path: '/paiements', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'nouveau-paiement', text: 'Nouveau Paiement', icon: CreditCardPlus, path: '/paiements/nouveau', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'separator-ventes-4', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'pos', text: 'Point de Vente', icon: ShoppingBag, path: '/point-de-vente', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'pos-scan', text: 'Scan & Vente', icon: Barcode, path: '/pos-scan', permission: isAdmin || isGestionnaire || isVendeur },
        { id: 'retours-clients', text: 'Retours Clients', icon: ReturnIcon, path: '/retours-clients', permission: isAdmin || isGestionnaire }
      ]
    },

    // 3. PORTE-MONNAIE CLIENTS
    {
      name: 'PORTE-MONNAIE CLIENTS',
      icon: Wallet,
      items: [
        { id: 'wallets', text: 'Gestion des Porte-monnaie', icon: Wallet, path: '/wallets', permission: isAdmin || isGestionnaire },
        { id: 'wallet-deposit', text: 'Dépôt Client', icon: Plus, path: '/wallets/depot', permission: isAdmin || isGestionnaire },
        { id: 'wallet-transactions', text: 'Historique des Transactions', icon: History, path: '/wallets/transactions', permission: isAdmin || isGestionnaire },
        { id: 'wallet-pay', text: 'Paiement avec Porte-monnaie', icon: CreditCard, path: '/wallets/paiement', permission: isAdmin || isGestionnaire }
      ]
    },

    // 4. PRODUITS & STOCKS
    {
      name: 'PRODUITS & STOCKS',
      icon: Package,
      items: [
        { id: 'categories', text: 'Catégories', icon: Tags, path: '/categories', permission: isAdmin || isGestionnaire },
        { id: 'unites-mesure', text: 'Unités de Mesure', icon: Ruler, path: '/unites-mesure', permission: isAdmin },
        { id: 'produits', text: 'Produits', icon: Package, path: '/produits', permission: isAdmin || isGestionnaire || isMagasinier },
        { id: 'add-stock-manual', text: 'Ajout Manuel Stock', icon: PackagePlus, path: '/add-stock-manual', permission: isAdmin || isGestionnaire || isMagasinier },
        { id: 'stocks', text: 'Stocks', icon: Boxes, path: '/stocks', permission: isAdmin || isGestionnaire || isMagasinier, badge: stocksFaibles > 0 ? stocksFaibles : 0 },
        { id: 'entrepots', text: 'Entrepôts', icon: Warehouse, path: '/entrepots', permission: isAdmin || isGestionnaire },
        { id: 'lots', text: 'Lots', icon: Layers, path: '/lots', permission: isAdmin || isGestionnaire || isMagasinier, badge: lotsExpirant > 0 ? lotsExpirant : 0 },
        { id: 'mouvements-stock', text: 'Mouvements Stock', icon: MoveHorizontal, path: '/mouvements-stock', permission: isAdmin || isGestionnaire || isMagasinier },
        { id: 'alertes-stock', text: 'Alertes Stock', icon: AlertOctagon, path: '/alertes-stock', permission: isAdmin || isGestionnaire, badge: alertesStockCount > 0 ? alertesStockCount : 0 },
        { id: 'inventaires', text: 'Inventaires', icon: ClipboardCheck, path: '/inventaires', permission: isAdmin || isGestionnaire, badge: inventairesEnCours > 0 ? inventairesEnCours : 0 },
        { id: 'transferts', text: 'Transferts', icon: ArrowLeftRight, path: '/transferts', permission: isAdmin || isGestionnaire }
      ]
    }
  ];

  // Sections pour Admin et Gestionnaire
  if (isAdmin || isGestionnaire) {
    // 5. ACHATS & FOURNISSEURS
    menuSections.splice(4, 0, {
      name: 'ACHATS & FOURNISSEURS',
      icon: ShoppingBag,
      items: [
        { id: 'fournisseurs', text: 'Fournisseurs', icon: Building2, path: '/fournisseurs', permission: isAdmin || isGestionnaire },
        { id: 'commandes-fournisseurs', text: 'Commandes Fournisseurs', icon: FileText, path: '/commandes-fournisseurs', permission: isAdmin || isGestionnaire, badge: commandesEnAttente > 0 ? commandesEnAttente : 0 },
        { id: 'receptions', text: 'Réceptions', icon: PackageCheck, path: '/receptions', permission: isAdmin || isGestionnaire, badge: receptionsEnAttente > 0 ? receptionsEnAttente : 0 },
        { id: 'retours-fournisseurs', text: 'Retours Fournisseurs', icon: RotateCcw, path: '/retours-fournisseurs', permission: isAdmin || isGestionnaire, badge: retoursEnAttente > 0 ? retoursEnAttente : 0 },
        { id: 'factures-fournisseurs', text: 'Factures Fournisseurs', icon: ReceiptIcon, path: '/factures-fournisseurs', permission: isAdmin || isGestionnaire || isComptable, badge: facturesImpayees > 0 ? facturesImpayees : 0 },
        { id: 'paiements-fournisseurs', text: 'Paiements Fournisseurs', icon: CreditCardIcon, path: '/paiements-fournisseurs', permission: isAdmin || isGestionnaire || isComptable, badge: paiementsFournisseursEnAttente > 0 ? paiementsFournisseursEnAttente : 0 },
        { id: 'dashboard-achats', text: 'Dashboard Achats', icon: BarChart, path: '/dashboard-achats', permission: isAdmin || isGestionnaire }
      ]
    });

    // 6. FINANCES
    menuSections.splice(5, 0, {
      name: 'FINANCES',
      icon: DollarSign,
      items: [
        { id: 'dashboard-finances', text: 'Tableau de Bord Finances', icon: Gauge, path: '/dashboard-finances', permission: isAdmin || isComptable },
        { id: 'comptes-comptables', text: 'Plan Comptable', icon: Grid3x3, path: '/comptes-comptables', permission: isAdmin || isComptable },
        { id: 'ecritures-comptables', text: 'Écritures Comptables', icon: BookOpen, path: '/ecritures-comptables', permission: isAdmin || isComptable, badge: ecrituresBrouillon > 0 ? ecrituresBrouillon : 0 },
        { id: 'journal-comptable', text: 'Journal Comptable', icon: ScrollText, path: '/journal-comptable', permission: isAdmin || isComptable },
        { id: 'grand-livre', text: 'Grand Livre', icon: Scale, path: '/grand-livre', permission: isAdmin || isComptable },
        { id: 'balance-generale', text: 'Balance Générale', icon: TableProperties, path: '/balance-generale', permission: isAdmin || isComptable },
        { id: 'depenses', text: 'Dépenses', icon: TrendingDown, path: '/depenses', permission: isAdmin || isComptable, badge: depensesEnAttente > 0 ? depensesEnAttente : 0 },
        { id: 'budgets', text: 'Budgets', icon: PiggyBank, path: '/budgets', permission: isAdmin || isComptable, badge: budgetsAlertes > 0 ? budgetsAlertes : 0 },
        { id: 'rapports-financiers', text: 'Rapports Financiers', icon: FileSpreadsheet, path: '/rapports-financiers', permission: isAdmin || isComptable },
        { id: 'config-financiere', text: 'Configuration Financière', icon: Cog, path: '/config-financiere', permission: isAdmin },
        { id: 'separator-finances', text: '', icon: null, path: '#', permission: true, separator: true },
        { id: 'nouvelle-depense', text: 'Nouvelle Dépense', icon: PlusCircle, path: '/depenses/nouveau', permission: isAdmin || isComptable },
        { id: 'nouveau-budget', text: 'Nouveau Budget', icon: PlusCircle, path: '/budgets/nouveau', permission: isAdmin || isComptable },
        { id: 'nouvelle-ecriture', text: 'Nouvelle Écriture', icon: PlusCircle, path: '/ecritures-comptables/nouveau', permission: isAdmin || isComptable }
      ]
    });

    // 7. TRÉSORERIE
    menuSections.splice(6, 0, {
      name: 'TRÉSORERIE',
      icon: Wallet,
      items: [
        { id: 'dashboard-tresorerie', text: 'Tableau de Bord Trésorerie', icon: Gauge, path: '/dashboard-tresorerie', permission: isAdmin || isComptable, badge: tresorerieAlerte > 0 ? tresorerieAlerte : 0 },
        { id: 'caisses', text: 'Caisses', icon: Banknote, path: '/caisses', permission: isAdmin || isComptable },
        { id: 'comptes-bancaires', text: 'Comptes Bancaires', icon: Landmark, path: '/comptes-bancaires', permission: isAdmin || isComptable },
        { id: 'mouvements-tresorerie', text: 'Mouvements Trésorerie', icon: Coins, path: '/mouvements-tresorerie', permission: isAdmin || isComptable },
        { id: 'frais', text: 'Frais & Dépenses', icon: ReceiptText, path: '/frais', permission: isAdmin || isComptable },
        { id: 'previsions', text: 'Prévisions', icon: CalendarDays, path: '/previsions', permission: isAdmin || isComptable },
        { id: 'rapprochement-bancaire', text: 'Rapprochement Bancaire', icon: CheckCircle, path: '/rapprochement-bancaire', permission: isAdmin || isComptable },
        { id: 'tresorerie-journaliere', text: 'Trésorerie Journalière', icon: ClipboardList, path: '/tresorerie-journaliere', permission: isAdmin || isComptable },
        { id: 'alertes-tresorerie', text: 'Alertes Trésorerie', icon: AlertCircleIcon, path: '/alertes-tresorerie', permission: isAdmin || isComptable }
      ]
    });

    // 8. LIVRAISONS
    menuSections.splice(7, 0, {
      name: 'LIVRAISONS',
      icon: Truck,
      items: [
        { id: 'livraisons', text: 'Livraisons', icon: TruckIcon, path: '/livraisons', permission: isAdmin || isGestionnaire },
        { id: 'tournees', text: 'Tournées', icon: Route, path: '/tournees', permission: isAdmin || isGestionnaire },
        { id: 'livreurs', text: 'Livreurs', icon: UserCheck, path: '/livreurs', permission: isAdmin || isGestionnaire },
        { id: 'suivi-livraisons', text: 'Suivi Livraisons', icon: Map, path: '/suivi-livraisons', permission: isAdmin || isGestionnaire }
      ]
    });

    // ✅ 9. STATION SERVICES
    menuSections.splice(8, 0, {
      name: 'STATION SERVICES',
      icon: GasPump,
      items: [
        { 
          id: 'station-dashboard', 
          text: 'Tableau de Bord Station', 
          icon: StatsChart, 
          path: '/station/dashboard', 
          permission: isAdmin || isGestionnaire,
          badge: cuvesAlerte > 0 ? cuvesAlerte : 0
        },
        { id: 'separator-station-1', text: '', icon: null, path: '#', permission: true, separator: true },
        { 
          id: 'cuves', 
          text: 'Gestion des Cuves', 
          icon: OilDrop, 
          path: '/station/cuves', 
          permission: isAdmin || isGestionnaire || isMagasinier,
          badge: cuvesAlerte > 0 ? cuvesAlerte : 0
        },
        { 
          id: 'cuve-approvisionnement', 
          text: 'Approvisionnement Cuve', 
          icon: TruckIcon, 
          path: '/station/cuves/approvisionnement', 
          permission: isAdmin || isGestionnaire || isMagasinier 
        },
        { 
          id: 'cuve-mouvements', 
          text: 'Mouvements Cuves', 
          icon: MoveHorizontal, 
          path: '/station/cuves/mouvements', 
          permission: isAdmin || isGestionnaire || isMagasinier 
        },
        { id: 'separator-station-2', text: '', icon: null, path: '#', permission: true, separator: true },
        { 
          id: 'pompes', 
          text: 'Gestion des Pompes', 
          icon: Pump, 
          path: '/station/pompes', 
          permission: isAdmin || isGestionnaire || isMagasinier,
          badge: pompesActives > 0 ? pompesActives : 0
        },
        { 
          id: 'pompe-ventes', 
          text: 'Ventes par Pompe', 
          icon: BarChart3, 
          path: '/station/pompes/ventes', 
          permission: isAdmin || isGestionnaire || isVendeur 
        },
        { id: 'separator-station-3', text: '', icon: null, path: '#', permission: true, separator: true },
        { 
          id: 'ventes-carburant', 
          text: 'Ventes de Carburant', 
          icon: Fuel, 
          path: '/station/ventes-carburant', 
          permission: isAdmin || isGestionnaire || isVendeur,
          badge: ventesCarburantJour > 0 ? Math.round(ventesCarburantJour) : 0
        },
        { 
          id: 'nouvelle-vente-carburant', 
          text: 'Nouvelle Vente Carburant', 
          icon: PlusCircle, 
          path: '/station/ventes-carburant/nouveau', 
          permission: isAdmin || isGestionnaire || isVendeur 
        },
        { 
          id: 'prix-carburant', 
          text: 'Gestion des Prix', 
          icon: BadgeDollarSign, 
          path: '/station/prix-carburant', 
          permission: isAdmin || isGestionnaire 
        },
        { id: 'separator-station-4', text: '', icon: null, path: '#', permission: true, separator: true },
        { 
          id: 'services-station', 
          text: 'Services Station', 
          icon: Tools, 
          path: '/station/services', 
          permission: isAdmin || isGestionnaire || isVendeur,
          badge: servicesEnAttente > 0 ? servicesEnAttente : 0
        },
        { 
          id: 'ventes-services', 
          text: 'Ventes de Services', 
          icon: CarWash, 
          path: '/station/ventes-services', 
          permission: isAdmin || isGestionnaire || isVendeur 
        },
        { 
          id: 'nouveau-service', 
          text: 'Nouveau Service', 
          icon: PlusCircle, 
          path: '/station/services/nouveau', 
          permission: isAdmin || isGestionnaire 
        },
        { id: 'separator-station-5', text: '', icon: null, path: '#', permission: true, separator: true },
        { 
          id: 'station-statistiques', 
          text: 'Statistiques Station', 
          icon: StatsChart, 
          path: '/station/statistiques', 
          permission: isAdmin || isGestionnaire || isComptable 
        },
        { 
          id: 'station-rapports', 
          text: 'Rapports Station', 
          icon: FileSpreadsheet, 
          path: '/station/rapports', 
          permission: isAdmin || isGestionnaire || isComptable 
        },
        { 
          id: 'station-config', 
          text: 'Configuration Station', 
          icon: SettingsGear, 
          path: '/station/config', 
          permission: isAdmin 
        }
      ]
    });

    // 10. PARAMÈTRES
    menuSections.splice(9, 0, {
      name: 'PARAMÈTRES',
      icon: Settings,
      items: [
        { id: 'company-config', text: 'Configuration Établissement', icon: Building2, path: '/company-config', permission: isAdmin },
        { id: 'notifications', text: 'Notifications', icon: Bell, path: '/notifications', permission: isAdmin || isGestionnaire, badge: notificationsCount > 0 ? notificationsCount : 0 },
        { id: 'system-settings', text: 'Paramètres Système', icon: Cog, path: '/system-settings', permission: isAdmin },
        { id: 'document-templates', text: 'Modèles Documents', icon: Printer, path: '/document-templates', permission: isAdmin || isGestionnaire },
        { id: 'backups', text: 'Sauvegardes', icon: Database, path: '/backups', permission: isAdmin },
        { id: 'audit', text: "Journal d'audit", icon: History, path: '/audit', permission: isAdmin },
        { id: 'utilisateurs', text: 'Utilisateurs', icon: Users, path: '/utilisateurs', permission: isAdmin },
        { id: 'roles', text: 'Rôles & Permissions', icon: Shield, path: '/roles', permission: isAdmin }
      ]
    });
  }

  // 11. MON ESPACE
  menuSections.push({
    name: 'MON ESPACE',
    icon: UserCircle,
    items: [
      { id: 'profile', text: 'Mon Profil', icon: UserCircle, path: '/profile', permission: true },
      { id: 'my-notifications', text: 'Mes Notifications', icon: BellRing, path: '/my-notifications', permission: true, badge: notificationsCount > 0 ? notificationsCount : 0 },
      { id: 'my-preferences', text: 'Mes Préférences', icon: Settings, path: '/my-preferences', permission: true },
      { id: 'support', text: 'Support', icon: HelpCircle, path: '/support', permission: true }
    ]
  });

  // Filtrer les sections
  const visibleSections = menuSections
    .map(section => {
      const visibleItems = section.items.filter(item => item.permission === true);
      return {
        ...section,
        items: visibleItems      };
    })
    .filter(section => section.items.length > 0);

  // Recherche
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = searchQuery.length > 1 ? 
    visibleSections.flatMap(section => 
      section.items.filter(item => 
        item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(item => ({ ...item, section: section.name }))
    ) : [];

  // Fonction de rendu des items de menu
  const renderMenuItem = (item, sectionName, isActive) => {
    if (item.separator) {
      return (
        <div key={item.id} className="border-t border-primary/20 my-2 mx-1"></div>
      );
    }

    const ItemIcon = item.icon;
    const isNewItem = item.id && item.id.startsWith('nouveau-');
    
    return (
      <Link
        key={item.id}
        to={item.path}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200
          ${isActive 
            ? 'bg-primary text-primary-content shadow-md' 
            : 'text-base-content/60 hover:bg-primary/10 hover:text-primary'
          }
          ${isNewItem && !isActive ? 'border-l-2 border-primary pl-3' : ''}
        `}
      >
        {ItemIcon && <ItemIcon className={`w-4 h-4 ${isActive ? 'text-inherit' : ''}`} />}
        <span className="flex-1">{item.text}</span>
        {isNewItem && !isActive && (
          <span className="badge badge-success badge-xs">Nouveau</span>
        )}
        {item.badge && item.badge > 0 && (
          <span className={`badge badge-error badge-xs ${isActive ? 'badge-outline' : ''}`}>
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </Link>
    );
  };

  // ============================================================
  // RENDU
  // ============================================================
  
  return (
    <div className="min-h-screen bg-base-200">
      
      {/* Overlay recherche */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)}>
          <div className="flex items-start justify-center pt-20 px-4" onClick={e => e.stopPropagation()}>
            <div className="w-full max-w-2xl bg-base-100 rounded-2xl shadow-2xl overflow-hidden border border-primary/20">
              <div className="p-4 border-b border-base-200">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-primary" />
                  <input
                    type="text"
                    placeholder="Rechercher un menu... (Ctrl+K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-base-content placeholder:text-base-content/40"
                    autoFocus
                  />
                  <button onClick={() => setIsSearchOpen(false)} className="p-1 rounded-lg hover:bg-base-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto p-2">
                {searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <item.icon className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-base-content">{item.text}</p>
                        <p className="text-xs text-base-content/40">{item.section}</p>
                      </div>
                    </Link>
                  ))
                ) : searchQuery.length > 1 ? (
                  <div className="text-center py-8">
                    <p className="text-base-content/40">Aucun résultat pour "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-base-content/40">Tapez pour rechercher un menu</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barre de navigation supérieure */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-primary to-primary/90 shadow-lg border-b-2 border-accent">
        <div className="px-4 sm:px-6 lg:pl-72">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo et menu toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex p-2 rounded-lg text-primary-content hover:bg-primary-content/10 transition-colors"
                title={sidebarOpen ? "Réduire le menu" : "Agrandir le menu"}
              >
                {sidebarOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-primary-content hover:bg-primary-content/10 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Logo Desktop */}
              <Link to="/dashboard" className="hidden lg:flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-content/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <div className="relative w-10 h-10 bg-base-100 rounded-xl flex items-center justify-center shadow-lg border-2 border-accent overflow-hidden">
                    {!loadingEtab && logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={etablissement?.nom || 'Logo établissement'}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <GraduationCap className="w-6 h-6 text-primary" />
                    )}
                  </div>
                </div>
                <div>
                  <h1 className="text-primary-content font-bold text-lg tracking-wide">
                    {!loadingEtab ? (etablissement?.nom || 'SODEPCI ERP') : 'Chargement...'}
                  </h1>
                  <p className="text-primary-content/60 text-[10px] font-medium">
                    {!loadingEtab ? (etablissement?.sigle || 'ERP Management') : ''}
                  </p>
                </div>
              </Link>

              {/* Logo Mobile */}
              <div className="lg:hidden flex items-center gap-2">
                <div className="w-8 h-8 bg-base-100 rounded-lg flex items-center justify-center border-2 border-accent overflow-hidden">
                  {!loadingEtab && logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={etablissement?.nom || 'Logo'}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <GraduationCap className="w-5 h-5 text-primary" />
                  )}
                </div>
                <span className="text-primary-content font-bold text-sm">
                  {!loadingEtab ? (etablissement?.nom || 'SODEPCI ERP') : 'Chargement...'}
                </span>
              </div>
            </div>

            {/* Centre - Date/Heure */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-content/10 backdrop-blur-sm">
                <Calendar className="w-4 h-4 text-primary-content/80" />
                <span className="text-sm font-medium text-primary-content">{formattedDate}</span>
                <div className="w-px h-4 bg-primary-content/30 mx-1"></div>
                <Clock className="w-4 h-4 text-primary-content/80" />
                <span className="text-sm font-medium text-primary-content">{formattedTime}</span>
              </div>
            </div>

            {/* Actions droite */}
            <div className="flex items-center gap-2">
              
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg text-primary-content hover:bg-primary-content/10 transition-colors"
                title="Rechercher (Ctrl+K)"
              >
                <Search className="w-5 h-5" />
              </button>

              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-content/10">
                <RoleIcon className="w-4 h-4 text-primary-content" />
                <span className="text-primary-content text-xs font-medium">{roleConfig.label}</span>
                {isAdmin && (
                  <span className="badge badge-error badge-xs ml-1">Admin</span>
                )}
                {isGestionnaire && !isAdmin && (
                  <span className="badge badge-warning badge-xs ml-1">Gestion</span>
                )}
                {isComptable && !isAdmin && !isGestionnaire && (
                  <span className="badge badge-secondary badge-xs ml-1">Compta</span>
                )}
              </div>

              <button
                onClick={toggleColorMode}
                className="p-2 rounded-lg text-primary-content hover:bg-primary-content/10 transition-colors"
                title={mode === 'dark' ? "Mode clair" : "Mode sombre"}
              >
                {mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Menu utilisateur */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-primary-content/10 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-content font-bold border-2 border-primary-content shadow-md">
                    {userInitial || 'U'}
                  </div>
                  <ChevronDown className="w-4 h-4 text-primary-content hidden sm:block" />
                </button>
                
                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-base-100 rounded-xl shadow-xl z-50 border border-primary/20 overflow-hidden">
                      <div className="p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-content">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary-content/20 flex items-center justify-center text-xl font-bold">
                            {userInitial || 'U'}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{userFullName || userName}</p>
                            <p className="text-xs text-primary-content/70 truncate">{userEmail}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className={`badge badge-${roleConfig.color} badge-sm`}>
                                {roleConfig.label}
                              </span>
                              {isAdmin && <span className="badge badge-error badge-sm">Admin</span>}
                              {isGestionnaire && !isAdmin && <span className="badge badge-warning badge-sm">Gestion</span>}
                              {isComptable && !isAdmin && !isGestionnaire && <span className="badge badge-secondary badge-sm">Compta</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-2">
                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors"
                        >
                          <UserCircle className="w-5 h-5 text-base-content/40" />
                          <span className="text-sm text-base-content">Mon profil</span>
                        </Link>
                        <Link
                          to="/my-preferences"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors"
                        >
                          <Settings className="w-5 h-5 text-base-content/40" />
                          <span className="text-sm text-base-content">Mes préférences</span>
                        </Link>
                        <Link
                          to="/support"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors"
                        >
                          <HelpCircle className="w-5 h-5 text-base-content/40" />
                          <span className="text-sm text-base-content">Support</span>
                        </Link>
                        <div className="border-t border-base-200 my-1"></div>
                        <button
                          onClick={logoutUser}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-error/10 transition-colors text-error"
                        >
                          <LogOut className="w-5 h-5" />
                          <span className="text-sm">Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Desktop */}
      <aside className={`
        fixed left-0 top-16 bottom-0 z-30
        bg-base-100 shadow-xl border-r border-primary/20
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-72' : 'w-20'}
        hidden lg:block
      `}>
        <div className="h-full flex flex-col">
          
          {/* Logo dans la sidebar */}
          <div className={`p-4 border-b border-primary/20 ${!sidebarOpen && 'text-center'} bg-gradient-to-r from-primary/5 to-transparent`}>
            <div className={`flex items-center ${!sidebarOpen && 'justify-center'} gap-3`}>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                {!loadingEtab && logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={etablissement?.nom || 'Logo'}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <GraduationCap className="w-6 h-6 text-white" />
                )}
              </div>
              {sidebarOpen && (
                <div>
                  <h2 className="font-bold text-base-content text-sm">
                    {!loadingEtab ? (etablissement?.nom || 'SODEPCI ERP') : 'Chargement...'}
                  </h2>
                  <p className="text-xs text-base-content/50">
                    {!loadingEtab ? (etablissement?.sigle || 'ERP Management') : ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className={`p-4 border-b border-primary/20 ${!sidebarOpen && 'text-center'}`}>
            <div className={`flex items-center ${!sidebarOpen && 'flex-col'} gap-3`}>
              <div className="avatar placeholder">
                <div className={`bg-gradient-to-br from-primary to-primary/80 text-primary-content rounded-xl ${sidebarOpen ? 'w-12 h-12' : 'w-10 h-10'} shadow-lg ring-2 ring-primary/20`}>
                  <span className={`${sidebarOpen ? 'text-xl' : 'text-lg'} font-bold`}>{userInitial || 'U'}</span>
                </div>
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-base-content">{userFullName || userName}</p>
                  <p className="text-xs text-base-content/50 truncate">{userEmail}</p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className={`badge badge-${roleConfig.color} badge-sm`}>
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {roleConfig.label}
                    </span>
                    {isAdmin && <span className="badge badge-error badge-sm">Admin</span>}
                    {isGestionnaire && !isAdmin && <span className="badge badge-warning badge-sm">Gestion</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {visibleSections.map((section, idx) => {
              const SectionIcon = section.icon;
              const isOpen = openSections[section.name] || false;
              
              const sectionBadge = section.name === 'STATION SERVICES' && cuvesAlerte > 0 ? cuvesAlerte : 0;
              
              return (
                <div key={idx} className="mb-1">
                  <button
                    onClick={() => handleSectionToggle(section.name)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                      ${!sidebarOpen && 'justify-center'}
                      ${isOpen 
                        ? 'bg-primary/10 text-primary'
                        : 'text-base-content/70 hover:bg-primary/5 hover:text-primary'
                      }
                    `}
                  >
                    <SectionIcon className={`w-5 h-5 ${isOpen ? 'text-inherit' : ''}`} />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left text-xs font-semibold tracking-wide uppercase">
                          {section.name}
                        </span>
                        {sectionBadge > 0 && (
                          <span className="badge badge-error badge-xs animate-pulse">
                            {sectionBadge}
                          </span>
                        )}
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </>
                    )}
                  </button>
                  
                  {sidebarOpen && isOpen && (
                    <div className="ml-6 mt-2 space-y-1 border-l-2 border-primary pl-4">
                      {section.items.map((item) => {
                        const isActive = path === item.path;
                        return renderMenuItem(item, section.name, isActive);
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-primary/20 bg-base-100">
            {sidebarOpen ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
                  <span className="text-xs text-base-content/50">v2.1.0</span>
                </div>
                <span className="badge badge-primary badge-sm">
                  {!loadingEtab ? (etablissement?.sigle || 'SODEPCI') : 'SODEPCI'}
                </span>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse mx-auto"></div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className={`transition-all duration-300 pt-16 ${sidebarOpen ? 'lg:pl-72' : 'lg:pl-20'}`}>
        <div className="p-4 sm:p-6">
          {content || (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-base-content/50">Aucun contenu à afficher</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Menu mobile */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed top-0 left-0 bottom-0 w-80 bg-base-100 z-50 shadow-2xl lg:hidden overflow-y-auto">
            <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-base-100 rounded-xl flex items-center justify-center p-1 shadow-lg overflow-hidden">
                    {!loadingEtab && logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={etablissement?.nom || 'Logo'}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <GraduationCap className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-primary-content font-bold text-lg">
                      {!loadingEtab ? (etablissement?.nom || 'SODEPCI ERP') : 'Chargement...'}
                    </h2>
                    <p className="text-primary-content/70 text-xs">{roleConfig.label}</p>
                  </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-primary-content p-2 rounded-lg hover:bg-primary-content/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-primary-content/10 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary-content/20 flex items-center justify-center text-primary-content font-bold">
                  {userInitial || 'U'}
                </div>
                <div>
                  <p className="text-primary-content font-medium text-sm">{userFullName || userName}</p>
                  <p className="text-primary-content/60 text-xs">{userEmail}</p>
                </div>
              </div>
            </div>

            <div className="py-4 px-3 space-y-1">
              {visibleSections.map((section, idx) => {
                const SectionIcon = section.icon;
                const isOpen = openSections[section.name] || false;
                
                return (
                  <div key={idx} className="mb-2">
                    <button
                      onClick={() => handleSectionToggle(section.name)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <SectionIcon className="w-5 h-5 text-primary" />
                        <span className="text-xs font-bold uppercase">
                          {section.name}
                        </span>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {isOpen && (
                      <div className="ml-6 mt-2 space-y-1 border-l-2 border-primary pl-4">
                        {section.items.map((item) => {
                          const isActive = path === item.path;
                          return renderMenuItem(item, section.name, isActive);
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;