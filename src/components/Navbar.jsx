// src/components/Navbar.jsx - Version SODEPCI avec Finances et Trésorerie séparées

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
  MapPin,
  TrendingUp,
  CreditCard,
  UsersRound,
  Boxes,
  AlertTriangle,
  Search,
  HelpCircle,
  History,
  Truck,
  ArrowLeftRight,
  DollarSign,
  Grid3x3,
  Ruler,
  ClipboardCheck,
  LineChart,
  MoveHorizontal,
  Calculator,
  PackageCheck,
  Layers,
  ArrowLeftRight as ReturnIcon,
  AlertOctagon,
  Wallet,
  BookOpen,
  PiggyBank,
  ChartPie,
  Cog,
  Database,
  Mail,
  BellRing,
  Printer,
  Globe,
  Lock,
  Key,
  UserCog,
  CalendarClock,
  RefreshCw,
  Activity,
  Award,
  BarChart3,
  Edit,
  Eye,
  // ========== ICÔNES POUR FINANCES & TRÉSORERIE ==========
  Landmark,        
  Coins,           
  ReceiptText,     
  CalendarDays,    
  CheckCircle,     
  ClipboardList,   
  Gauge,           
  AlertCircle,     
  Banknote,        
  ArrowDownUp,     
  TrendingDown,    
  Briefcase,       
  HandCoins,       
  ScrollText,      
  Scale,           
  Target,          
  PieChart,        
  FileSpreadsheet,
} from 'lucide-react';

import logo from '../assets/logo.svg';

// Import conditionnel
let AxiosInstance = null;
let GlobalAlerts = null;

try {
  AxiosInstance = require('./AxiosInstance').default;
  GlobalAlerts = require('./common/GlobalAlerts').default;
} catch (error) {
  console.warn('Modules optionnels non trouvés:', error.message);
}

// Configuration des rôles
const ROLE_CONFIG = {
  admin: { label: 'Administrateur', color: 'error', icon: Shield, description: 'Accès total', level: 100 },
  gestionnaire: { label: 'Gestionnaire', color: 'secondary', icon: UsersRound, description: 'Gestion complète', level: 90 },
  comptable: { label: 'Comptable', color: 'primary', icon: Calculator, description: 'Gestion financière', level: 80 },
  magasinier: { label: 'Magasinier', color: 'info', icon: Boxes, description: 'Gestion des stocks', level: 70 },
  caissier: { label: 'Caissier', color: 'warning', icon: CreditCard, description: 'Point de vente', level: 60 },
  livreur: { label: 'Livreur', color: 'neutral', icon: Truck, description: 'Livraisons', level: 50 },
  tresorier: { label: 'Trésorier', color: 'primary', icon: Wallet, description: 'Gestion de trésorerie', level: 85 }
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
    'PRODUITS & STOCKS': false,
    'ACHATS & FOURNISSEURS': false,
    'FINANCES': false,
    'TRÉSORERIE': false,
    'LIVRAISONS': false,
    'PARAMÈTRES': false,
    'MON ESPACE': false
  });
  
  const [userInitial, setUserInitial] = useState('U');
  const [userFullName, setUserFullName] = useState('Utilisateur');
  const [userRole, setUserRole] = useState('caissier');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // États des compteurs
  const [commandesALivrer, setCommandesALivrer] = useState(0);
  const [stocksFaibles, setStocksFaibles] = useState(0);
  const [ventesImpayees, setVentesImpayees] = useState(0);
  const [retoursCount, setRetoursCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [alertesStockCount, setAlertesStockCount] = useState(0);
  const [facturesEcheance, setFacturesEcheance] = useState(0);
  
  // États pour la Trésorerie
  const [alertesTresorerieCount, setAlertesTresorerieCount] = useState(0);
  const [mouvementsEnAttente, setMouvementsEnAttente] = useState(0);
  const [fraisEnAttente, setFraisEnAttente] = useState(0);
  const [caissesSousSeuil, setCaissesSousSeuil] = useState(0);
  
  // États des alertes globales
  const [showGlobalAlerts, setShowGlobalAlerts] = useState(false);
  const [globalAlertCount, setGlobalAlertCount] = useState(0);
  const [alertStats, setAlertStats] = useState({ total: 0, error: 0, warning: 0, info: 0 });

  // Récupérer l'utilisateur
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('User');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  };

  const user = getUserData();
  const role = user?.role || 'caissier';
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
  const isGestionnaire = role === 'gestionnaire';
  const isComptable = role === 'comptable';
  const isMagasinier = role === 'magasinier';
  const isCaissier = role === 'caissier';
  const isLivreur = role === 'livreur';
  const isTresorier = role === 'tresorier' || isAdmin || isGestionnaire || isComptable;
  
  // Fonctions de permission
  const canViewSales = () => isAdmin || isGestionnaire || isCaissier || isComptable;
  const canViewPOS = () => isAdmin || isCaissier;
  const canViewStock = () => isAdmin || isGestionnaire || isMagasinier;
  const canViewPurchases = () => isAdmin || isGestionnaire;
  const canViewFinances = () => isAdmin || isGestionnaire || isComptable;
  const canViewTresorerie = () => isAdmin || isGestionnaire || isComptable || isTresorier;
  const canViewUsers = () => isAdmin;
  const canViewDeliveries = () => isAdmin || isGestionnaire || isLivreur;
  const canViewParameters = () => isAdmin || isGestionnaire;
  const canViewBackups = () => isAdmin;
  const canViewAudit = () => isAdmin;

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

  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.caissier;
  const RoleIcon = roleConfig.icon;

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('Token');
        if (!token || !AxiosInstance) return;

        if (isAdmin || isGestionnaire) {
          const ordersRes = await AxiosInstance.get('/purchase-orders/?status=pending', {
            headers: { Authorization: `Token ${token}` }
          }).catch(() => ({ data: [] }));
          setCommandesALivrer(ordersRes.data?.length || 0);

          const retoursRes = await AxiosInstance.get('/purchase-returns/?status=requested', {
            headers: { Authorization: `Token ${token}` }
          }).catch(() => ({ data: [] }));
          setRetoursCount(retoursRes.data?.length || 0);

          const notifRes = await AxiosInstance.get('/notifications/unread-count/', {
            headers: { Authorization: `Token ${token}` }
          }).catch(() => ({ data: { unread_count: 0 } }));
          setNotificationsCount(notifRes.data?.unread_count || 0);
        }

        if (isAdmin || isMagasinier) {
          const stocksRes = await AxiosInstance.get('/stocks/low-stock/', {
            headers: { Authorization: `Token ${token}` }
          }).catch(() => ({ data: [] }));
          setStocksFaibles(stocksRes.data?.length || 0);

          const alertesRes = await AxiosInstance.get('/stocks/alerts/', {
            headers: { Authorization: `Token ${token}` }
          }).catch(() => ({ data: [] }));
          setAlertesStockCount(alertesRes.data?.length || 0);
        }

        if (isAdmin || isComptable || isCaissier) {
          const ventesRes = await AxiosInstance.get('/sales/?payment_status=pending', {
            headers: { Authorization: `Token ${token}` }
          }).catch(() => ({ data: [] }));
          setVentesImpayees(ventesRes.data?.length || 0);

          const facturesRes = await AxiosInstance.get('/invoices/?status=due', {
            headers: { Authorization: `Token ${token}` }
          }).catch(() => ({ data: [] }));
          setFacturesEcheance(facturesRes.data?.length || 0);
        }

        // Chargement des données Trésorerie
        if (canViewTresorerie()) {
          const alertesRes = await AxiosInstance.get('/tresorerie/alertes/list/', {
            headers: { Authorization: `Token ${token}` }
          }).catch(() => ({ data: { alertes: [] } }));
          setAlertesTresorerieCount(alertesRes.data?.alertes?.length || 0);

          const mouvementsRes = await AxiosInstance.get('/tresorerie/mouvements/?status=en_attente', {
            headers: { Authorization: `Token ${token}` }
          }).catch(() => ({ data: [] }));
          setMouvementsEnAttente(mouvementsRes.data?.length || 0);

          const fraisRes = await AxiosInstance.get('/tresorerie/frais/?status=en_attente', {
            headers: { Authorization: `Token ${token}` }
          }).catch(() => ({ data: [] }));
          setFraisEnAttente(fraisRes.data?.length || 0);

          const caissesRes = await AxiosInstance.get('/tresorerie/caisses/?sous_seuil=true', {
            headers: { Authorization: `Token ${token}` }
          }).catch(() => ({ data: [] }));
          setCaissesSousSeuil(caissesRes.data?.length || 0);
        }

      } catch (error) {
        console.error('Erreur chargement données:', error);
      }
    };

    loadData();
  }, [role, isAdmin, isGestionnaire, isMagasinier, isComptable, isCaissier]);

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

  // Menu sections
  const menuSections = [
    {
      name: 'TABLEAU DE BORD',
      icon: LayoutDashboard,
      items: [
        { id: 'dashboard', text: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', permission: true },
        { id: 'statistiques', text: 'Statistiques', icon: TrendingUp, path: '/statistiques', permission: isAdmin || isGestionnaire },
        { id: 'analyses', text: 'Analyses', icon: BarChart3, path: '/analyses', permission: isAdmin || isGestionnaire }
      ]
    },
    {
      name: 'VENTES',
      icon: ShoppingCart,
      items: [
        { id: 'pos', text: 'Point de Vente', icon: ShoppingBag, path: '/point-de-vente', permission: isAdmin || isCaissier },
        { id: 'ventes', text: 'Ventes', icon: ShoppingCart, path: '/ventes', permission: isAdmin || isGestionnaire || isCaissier || isComptable, badge: ventesImpayees > 0 ? ventesImpayees : 0 },
        { id: 'clients', text: 'Clients', icon: Users, path: '/clients', permission: isAdmin || isGestionnaire || isCaissier || isComptable },
        { id: 'factures', text: 'Factures', icon: Receipt, path: '/factures', permission: isAdmin || isGestionnaire || isCaissier || isComptable, badge: facturesEcheance > 0 ? facturesEcheance : 0 },
        { id: 'paiements', text: 'Paiements', icon: CreditCard, path: '/paiements', permission: isAdmin || isGestionnaire || isComptable },
        { id: 'devis', text: 'Devis', icon: FileText, path: '/devis', permission: isAdmin || isGestionnaire || isCaissier }
      ]
    },
    {
      name: 'PRODUITS & STOCKS',
      icon: Package,
      items: [
        { id: 'categories', text: 'Catégories', icon: Tags, path: '/categories', permission: isAdmin || isGestionnaire || isMagasinier },
        { id: 'produits', text: 'Produits', icon: Package, path: '/produits', permission: isAdmin || isGestionnaire || isMagasinier },
        { id: 'stocks', text: 'Stocks', icon: Boxes, path: '/stocks', permission: isAdmin || isGestionnaire || isMagasinier, badge: stocksFaibles > 0 ? stocksFaibles : 0 },
        { id: 'entrepots', text: 'Entrepôts', icon: Warehouse, path: '/entrepots', permission: isAdmin || isGestionnaire },
        { id: 'mouvements', text: 'Mouvements', icon: TrendingUp, path: '/mouvements-stock', permission: isAdmin || isGestionnaire || isMagasinier },
        { id: 'inventaire', text: 'Inventaire', icon: ClipboardCheck, path: '/inventaire', permission: isAdmin || isGestionnaire },
        { id: 'alertes-stock', text: 'Alertes Stock', icon: AlertOctagon, path: '/alertes-stock', permission: isAdmin || isGestionnaire || isMagasinier, badge: alertesStockCount > 0 ? alertesStockCount : 0 }
      ]
    },
    {
      name: 'ACHATS & FOURNISSEURS',
      icon: ShoppingBag,
      items: [
        { id: 'fournisseurs', text: 'Fournisseurs', icon: Building2, path: '/fournisseurs', permission: isAdmin || isGestionnaire },
        { id: 'commandes', text: 'Commandes', icon: FileText, path: '/commandes-fournisseurs', permission: isAdmin || isGestionnaire, badge: commandesALivrer > 0 ? commandesALivrer : 0 },
        { id: 'receptions', text: 'Réceptions', icon: PackageCheck, path: '/receptions', permission: isAdmin || isGestionnaire },
        { id: 'retours', text: 'Retours fournisseurs', icon: ReturnIcon, path: '/retours-fournisseurs', permission: isAdmin || isGestionnaire, badge: retoursCount > 0 ? retoursCount : 0 }
      ]
    },
    {
      name: 'FINANCES',
      icon: DollarSign,
      items: [
        // ========== COMPTABILITÉ ==========
        { id: 'comptes', text: 'Plan Comptable', icon: Grid3x3, path: '/comptes-comptables', permission: isAdmin || isGestionnaire || isComptable },
        { id: 'ecritures', text: 'Écritures Comptables', icon: BookOpen, path: '/ecritures-comptables', permission: isAdmin || isGestionnaire || isComptable },
        { id: 'journal', text: 'Journal Comptable', icon: ScrollText, path: '/journal-comptable', permission: isAdmin || isGestionnaire || isComptable },
        { id: 'grand-livre', text: 'Grand Livre', icon: Scale, path: '/grand-livre', permission: isAdmin || isGestionnaire || isComptable },
        { id: 'balance', text: 'Balance Générale', icon: Scale, path: '/balance-generale', permission: isAdmin || isGestionnaire || isComptable },
        
        // ========== BUDGETS ==========
        { id: 'budgets', text: 'Budgets', icon: PiggyBank, path: '/budgets', permission: isAdmin || isGestionnaire || isComptable },
        { id: 'depenses', text: 'Dépenses', icon: TrendingDown, path: '/depenses', permission: isAdmin || isGestionnaire || isComptable },
        
        // ========== RAPPORTS ==========
        { id: 'rapports-financiers', text: 'Rapports Financiers', icon: FileSpreadsheet, path: '/rapports-financiers', permission: isAdmin || isGestionnaire || isComptable },
        { id: 'sessions-caisse', text: 'Sessions Caisse', icon: Clock, path: '/sessions-caisse', permission: isAdmin || isGestionnaire || isCaissier }
      ]
    },
    {
      name: 'TRÉSORERIE',
      icon: Wallet,
      items: [
        // ========== TABLEAU DE BORD ==========
        { 
          id: 'tresorerie-dashboard', 
          text: 'Tableau de Bord', 
          icon: Gauge, 
          path: '/dashboard-tresorerie', 
          permission: canViewTresorerie(),
          badge: alertesTresorerieCount > 0 ? alertesTresorerieCount : 0
        },
        
        // ========== CAISSES ET COMPTES ==========
        { 
          id: 'caisses', 
          text: 'Caisses', 
          icon: Banknote, 
          path: '/caisses', 
          permission: canViewTresorerie(),
          badge: caissesSousSeuil > 0 ? caissesSousSeuil : 0
        },
        { 
          id: 'comptes-bancaires', 
          text: 'Comptes Bancaires', 
          icon: Landmark, 
          path: '/comptes-bancaires', 
          permission: canViewTresorerie() 
        },
        
        // ========== MOUVEMENTS ==========
        { 
          id: 'mouvements-tresorerie', 
          text: 'Mouvements', 
          icon: Coins, 
          path: '/mouvements-tresorerie', 
          permission: canViewTresorerie(),
          badge: mouvementsEnAttente > 0 ? mouvementsEnAttente : 0
        },
        { 
          id: 'frais', 
          text: 'Frais & Dépenses', 
          icon: ReceiptText, 
          path: '/frais', 
          permission: canViewTresorerie(),
          badge: fraisEnAttente > 0 ? fraisEnAttente : 0
        },
        
        // ========== PRÉVISIONS ==========
        { 
          id: 'previsions', 
          text: 'Prévisions', 
          icon: CalendarDays, 
          path: '/previsions', 
          permission: canViewTresorerie() 
        },
        
        // ========== RAPPROCHEMENT ==========
        { 
          id: 'rapprochement', 
          text: 'Rapprochement Bancaire', 
          icon: CheckCircle, 
          path: '/rapprochement-bancaire', 
          permission: canViewTresorerie() 
        },
        
        // ========== SUIVI JOURNALIER ==========
        { 
          id: 'tresorerie-journaliere', 
          text: 'Trésorerie Journalière', 
          icon: ClipboardList, 
          path: '/tresorerie-journaliere', 
          permission: canViewTresorerie() 
        },
        
        // ========== ALERTES ==========
        { 
          id: 'alertes-tresorerie', 
          text: 'Alertes Trésorerie', 
          icon: AlertCircle, 
          path: '/alertes-tresorerie', 
          permission: canViewTresorerie(),
          badge: alertesTresorerieCount > 0 ? alertesTresorerieCount : 0
        }
      ]
    },
    {
      name: 'LIVRAISONS',
      icon: Truck,
      items: [
        { id: 'livraisons', text: 'Livraisons', icon: Truck, path: '/livraisons', permission: isAdmin || isGestionnaire || isLivreur },
        { id: 'tournees', text: 'Tournées', icon: MapPin, path: '/tournees', permission: isAdmin || isGestionnaire },
        { id: 'livreurs', text: 'Livreurs', icon: Users, path: '/livreurs', permission: isAdmin || isGestionnaire },
        { id: 'suivi', text: 'Suivi', icon: MapPin, path: '/suivi-livraisons', permission: isAdmin || isGestionnaire || isLivreur }
      ]
    },
    {
      name: 'PARAMÈTRES',
      icon: Settings,
      items: [
        { 
          id: 'company-config', 
          text: 'Configuration SODEPCI', 
          icon: Building2, 
          path: '/company-config', 
          permission: isAdmin || isGestionnaire 
        },
        { 
          id: 'company-config-edit', 
          text: 'Modifier SODEPCI', 
          icon: Edit, 
          path: '/company-config/edit', 
          permission: isAdmin || isGestionnaire 
        },
        { 
          id: 'notifications', 
          text: 'Notifications', 
          icon: Bell, 
          path: '/notifications', 
          permission: isAdmin || isGestionnaire, 
          badge: notificationsCount > 0 ? notificationsCount : 0 
        },
        { 
          id: 'system-settings', 
          text: 'Paramètres Système', 
          icon: Cog, 
          path: '/system-settings', 
          permission: isAdmin 
        },
        { 
          id: 'document-templates', 
          text: 'Modèles Documents', 
          icon: Printer, 
          path: '/document-templates', 
          permission: isAdmin || isGestionnaire 
        },
        { 
          id: 'backups', 
          text: 'Sauvegardes', 
          icon: Database, 
          path: '/backups', 
          permission: isAdmin 
        },
        { 
          id: 'audit', 
          text: "Journal d'audit", 
          icon: History, 
          path: '/audit', 
          permission: isAdmin 
        },
        { 
          id: 'utilisateurs', 
          text: 'Utilisateurs', 
          icon: Users, 
          path: '/utilisateurs', 
          permission: isAdmin 
        },
        { 
          id: 'roles', 
          text: 'Rôles & Permissions', 
          icon: Shield, 
          path: '/roles', 
          permission: isAdmin 
        }
      ]
    },
    {
      name: 'MON ESPACE',
      icon: UserCircle,
      items: [
        { id: 'profile', text: 'Mon Profil', icon: UserCircle, path: '/profile', permission: true },
        { id: 'my-preferences', text: 'Mes Préférences', icon: Settings, path: '/my-preferences', permission: true },
        { id: 'my-notifications', text: 'Mes Notifications', icon: BellRing, path: '/my-notifications', permission: true, badge: notificationsCount > 0 ? notificationsCount : 0 },
        { id: 'support', text: 'Support', icon: HelpCircle, path: '/support', permission: true }
      ]
    }
  ];

  // Filtrer les sections
  const visibleSections = menuSections
    .map(section => {
      const visibleItems = section.items.filter(item => item.permission === true);
      return {
        ...section,
        items: visibleItems
      };
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

  // Rendu
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

              {/* Logo */}
              <Link to="/dashboard" className="hidden lg:flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-content/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <div className="relative w-10 h-10 bg-base-100 rounded-xl flex items-center justify-center shadow-lg border-2 border-accent">
                    <img src={logo} alt="Logo" className="w-7 h-7 object-contain" onError={(e) => { e.target.style.display = 'none' }} />
                  </div>
                </div>
                <div>
                  <h1 className="text-primary-content font-bold text-lg tracking-wide">SODEPCI</h1>
                  <p className="text-primary-content/60 text-[10px] font-medium">ERP Management</p>
                </div>
              </Link>

              {/* Logo mobile */}
              <div className="lg:hidden flex items-center gap-2">
                <div className="w-8 h-8 bg-base-100 rounded-lg flex items-center justify-center border-2 border-accent">
                  <img src={logo} alt="Logo" className="w-6 h-6 object-contain" onError={(e) => { e.target.style.display = 'none' }} />
                </div>
                <span className="text-primary-content font-bold text-sm">SODEPCI</span>
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
              
              {/* Recherche */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg text-primary-content hover:bg-primary-content/10 transition-colors"
                title="Rechercher (Ctrl+K)"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Badge rôle */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-content/10">
                <RoleIcon className="w-4 h-4 text-primary-content" />
                <span className="text-primary-content text-xs font-medium">{roleConfig.label}</span>
              </div>

              {/* Alertes globales */}
              {(isAdmin || isGestionnaire) && GlobalAlerts && (
                <div className="relative">
                  <button
                    onClick={() => setShowGlobalAlerts(!showGlobalAlerts)}
                    className="relative p-2 rounded-lg text-primary-content hover:bg-primary-content/10 transition-colors"
                    title="Toutes les alertes"
                  >
                    <Bell className="w-5 h-5" />
                    {globalAlertCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-accent text-accent-content text-xs rounded-full flex items-center justify-center font-bold px-1 animate-pulse">
                        {globalAlertCount > 99 ? '99+' : globalAlertCount}
                      </span>
                    )}
                  </button>
                  
                  {showGlobalAlerts && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowGlobalAlerts(false)}></div>
                      <div className="absolute right-0 mt-2 w-[480px] max-w-[90vw] z-50">
                        <GlobalAlerts
                          onClose={() => setShowGlobalAlerts(false)}
                          onAlertCount={setGlobalAlertCount}
                          onStatsChange={setAlertStats}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Mode thème */}
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
                              {isTresorier && !isAdmin && <span className="badge badge-primary badge-sm">Trésorier</span>}
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
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                <img src={logo} alt="Logo" className="w-7 h-7 object-contain" onError={(e) => { e.target.style.display = 'none' }} />
              </div>
              {sidebarOpen && (
                <div>
                  <h2 className="font-bold text-base-content text-sm">SODEPCI</h2>
                  <p className="text-xs text-base-content/50">ERP Management</p>
                </div>
              )}
            </div>
          </div>

          {/* Profil utilisateur */}
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
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`badge badge-${roleConfig.color} badge-sm`}>
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {roleConfig.label}
                    </span>
                    {isAdmin && <span className="badge badge-error badge-sm">Admin</span>}
                    {isTresorier && !isAdmin && <span className="badge badge-primary badge-sm">Trésorier</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Menu de navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {visibleSections.map((section, idx) => {
              const SectionIcon = section.icon;
              const isOpen = openSections[section.name] || false;
              const isTresorerieSection = section.name === 'TRÉSORERIE';
              const isFinancesSection = section.name === 'FINANCES';
              
              return (
                <div key={idx} className="mb-1">
                  <button
                    onClick={() => handleSectionToggle(section.name)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                      ${!sidebarOpen && 'justify-center'}
                      ${isOpen 
                        ? isTresorerieSection 
                          ? 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400' 
                          : isFinancesSection
                          ? 'bg-blue-500/20 text-blue-600 dark:bg-blue-500/30 dark:text-blue-400'
                          : 'bg-primary/10 text-primary'
                        : 'text-base-content/70 hover:bg-primary/5 hover:text-primary'
                      }
                    `}
                  >
                    <SectionIcon className={`w-5 h-5 ${isOpen ? 'text-inherit' : ''}`} />
                    {sidebarOpen && (
                      <>
                        <span className={`flex-1 text-left text-xs font-semibold tracking-wide uppercase ${
                          isTresorerieSection ? 'text-emerald-600 dark:text-emerald-400' : 
                          isFinancesSection ? 'text-blue-600 dark:text-blue-400' : ''
                        }`}>
                          {section.name}
                        </span>
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </>
                    )}
                  </button>
                  
                  {sidebarOpen && isOpen && (
                    <div className={`ml-6 mt-2 space-y-1 border-l-2 pl-4 ${
                      isTresorerieSection 
                        ? 'border-emerald-400 dark:border-emerald-500' 
                        : isFinancesSection
                        ? 'border-blue-400 dark:border-blue-500'
                        : 'border-primary'
                    }`}>
                      {section.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = path === item.path;
                        const isTresorerieItem = item.path?.startsWith('/') && 
                          ['/caisses', '/comptes-bancaires', '/mouvements-tresorerie', '/frais-tresorerie', '/previsions-tresorerie', '/rapprochement-bancaire', '/tresorerie-journaliere', '/alertes-tresorerie', '/dashboard-tresorerie'].includes(item.path);
                        
                        return (
                          <Link
                            key={item.id}
                            to={item.path}
                            className={`
                              flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200
                              ${isActive 
                                ? isTresorerieItem
                                  ? 'bg-emerald-500 text-white shadow-md'
                                  : 'bg-primary text-primary-content shadow-md'
                                : isTresorerieItem && !isActive
                                ? 'text-base-content/60 hover:bg-emerald-500/10 hover:text-emerald-500'
                                : 'text-base-content/60 hover:bg-primary/10 hover:text-primary'
                              }
                            `}
                          >
                            <ItemIcon className={`w-4 h-4 ${isActive ? 'text-inherit' : ''}`} />
                            <span className="flex-1">{item.text}</span>
                            {item.badge && item.badge > 0 && (
                              <span className={`badge badge-error badge-xs ${isActive ? 'badge-outline' : ''}`}>
                                {item.badge > 99 ? '99+' : item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer Sidebar */}
          <div className="p-4 border-t border-primary/20 bg-base-100">
            {sidebarOpen ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
                  <span className="text-xs text-base-content/50">v2.1.0</span>
                </div>
                <span className="badge badge-primary badge-sm">SODEPCI 2026</span>
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
                  <div className="w-10 h-10 bg-base-100 rounded-xl flex items-center justify-center p-2 shadow-lg">
                    <img src={logo} alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none' }} />
                  </div>
                  <div>
                    <h2 className="text-primary-content font-bold text-lg">SODEPCI</h2>
                    <p className="text-primary-content/70 text-xs">{roleConfig.label}</p>
                  </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-primary-content p-2 rounded-lg hover:bg-primary-content/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Profil mobile */}
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
                const isTresorerieSection = section.name === 'TRÉSORERIE';
                const isFinancesSection = section.name === 'FINANCES';
                
                return (
                  <div key={idx} className="mb-2">
                    <button
                      onClick={() => handleSectionToggle(section.name)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                        isTresorerieSection 
                          ? 'hover:bg-emerald-500/10' 
                          : isFinancesSection
                          ? 'hover:bg-blue-500/10'
                          : 'hover:bg-primary/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <SectionIcon className={`w-5 h-5 ${
                          isTresorerieSection ? 'text-emerald-500' : 
                          isFinancesSection ? 'text-blue-500' : 
                          'text-primary'
                        }`} />
                        <span className={`text-xs font-bold uppercase ${
                          isTresorerieSection ? 'text-emerald-600 dark:text-emerald-400' : 
                          isFinancesSection ? 'text-blue-600 dark:text-blue-400' : 
                          ''
                        }`}>
                          {section.name}
                        </span>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {isOpen && (
                      <div className={`ml-6 mt-2 space-y-1 border-l-2 pl-4 ${
                        isTresorerieSection 
                          ? 'border-emerald-400 dark:border-emerald-500' 
                          : isFinancesSection
                          ? 'border-blue-400 dark:border-blue-500'
                          : 'border-primary'
                      }`}>
                        {section.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isActive = path === item.path;
                          const isTresorerieItem = item.path?.startsWith('/') && 
                            ['/caisses', '/comptes-bancaires', '/mouvements-tresorerie', '/frais-tresorerie', '/previsions-tresorerie', '/rapprochement-bancaire', '/tresorerie-journaliere', '/alertes-tresorerie', '/dashboard-tresorerie'].includes(item.path);
                          
                          return (
                            <Link
                              key={item.id}
                              to={item.path}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`
                                flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                                ${isActive 
                                  ? isTresorerieItem
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-primary text-primary-content'
                                  : isTresorerieItem
                                  ? 'hover:bg-emerald-500/10 hover:text-emerald-500'
                                  : 'hover:bg-primary/10'
                                }
                              `}
                            >
                              <ItemIcon className="w-4 h-4" />
                              <span>{item.text}</span>
                              {item.badge && item.badge > 0 && (
                                <span className="badge badge-error badge-xs ml-auto">{item.badge > 99 ? '99+' : item.badge}</span>
                              )}
                            </Link>
                          );
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