// src/components/Navbar.jsx - Version Adaptée pour les rôles (Admin & Vendeur) avec ACHATS
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
  Handshake,
  Store,
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
  Briefcase,
  Clock,
  Calendar,
  MapPin,
  UserPlus,
  TrendingUp,
  CreditCard,
  UsersRound,
  Boxes,
  AlertTriangle,
  CheckCircle,
  Search,
  HelpCircle,
  History,
  ClipboardList,
  Truck,
  ArrowLeftRight,
  DollarSign,
  Grid3x3,
  Ruler,
  Award,
  ClipboardCheck,
  LineChart,
  MoveHorizontal,
  GraduationCap,
  BarChart3,
  RefreshCw,
  Plus,
  Calculator,
  PackageCheck,
  Send,
  QrCode,
  Layers
} from 'lucide-react';

import logo from '../assets/logo.svg';
import AxiosInstance from './AxiosInstance';

// Configuration des rôles (Admin & Vendeur)
const ROLE_CONFIG = {
  admin: { 
    label: 'Administrateur', 
    color: 'error', 
    icon: Shield, 
    description: 'Accès total', 
    level: 100 
  },
  vendeur: { 
    label: 'Vendeur', 
    color: 'success', 
    icon: Store, 
    description: 'Gestion des ventes', 
    level: 60 
  }
};

const Navbar = ({ content, mode, toggleColorMode }) => {
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();

  // États
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openSections, setOpenSections] = useState({
    'TABLEAU DE BORD': true,
    'VENTES': true,
    'STOCK': false,
    'ACHATS': false,
    'FINANCES': false,
    'ADMINISTRATION': false,
    'MON ESPACE': false
  });
  
  const [userInitial, setUserInitial] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userRole, setUserRole] = useState('vendeur');
  const [userData, setUserData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  
  // Compteurs pour les badges
  const [ventesImpayees, setVentesImpayees] = useState(0);
  const [stocksFaibles, setStocksFaibles] = useState(0);
  const [commandesALivrer, setCommandesALivrer] = useState(0);
  const [alertesCount, setAlertesCount] = useState(0);

  // Récupérer l'utilisateur depuis localStorage
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

  // Charger les données utilisateur et compteurs
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Récupérer les détails complets de l'utilisateur
        if (user?.id) {
          const userRes = await AxiosInstance.get(`/users/${user.id}/`);
          setUserData(userRes.data);
          setUserRole(userRes.data.role || role);
        } else {
          setUserRole(role);
        }
        
        // Charger les compteurs selon le rôle
        const isAdmin = role === 'admin';
        
        if (isAdmin) {
          const [ventesRes, stocksRes, achatsRes, alertsRes] = await Promise.all([
            AxiosInstance.get('/sales/?payment_status=pending').catch(() => ({ data: [] })),
            AxiosInstance.get('/stocks/low-stock/').catch(() => ({ data: [] })),
            AxiosInstance.get('/purchase-orders/?status=pending').catch(() => ({ data: [] })),
            AxiosInstance.get('/alerts/').catch(() => ({ data: [] }))
          ]);
          setVentesImpayees(ventesRes.data?.length || 0);
          setStocksFaibles(stocksRes.data?.length || 0);
          setCommandesALivrer(achatsRes.data?.length || 0);
          setAlertesCount(alertsRes.data?.length || 0);
          
          // Construire les notifications
          const notifs = [];
          if (stocksFaibles > 0) {
            notifs.push({ 
              id: 'stock', 
              title: 'Stock faible', 
              message: `${stocksFaibles} produit(s) en rupture`, 
              link: '/stocks', 
              type: 'warning' 
            });
          }
          if (ventesImpayees > 0) {
            notifs.push({ 
              id: 'ventes', 
              title: 'Paiements en attente', 
              message: `${ventesImpayees} vente(s) impayée(s)`, 
              link: '/ventes', 
              type: 'error' 
            });
          }
          if (commandesALivrer > 0) {
            notifs.push({ 
              id: 'achats', 
              title: 'Commandes à recevoir', 
              message: `${commandesALivrer} commande(s) en attente`, 
              link: '/commandes-fournisseurs', 
              type: 'info' 
            });
          }
          setNotifications(notifs);
          setNotificationCount(notifs.length);
        }
        
      } catch (error) {
        console.error('Erreur chargement:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [role, stocksFaibles, ventesImpayees, commandesALivrer]);

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
  
  // Permissions basées sur les rôles
  const isAdmin = role === 'admin';
  const isVendeur = role === 'vendeur';
  
  // Méthodes de permission
  const canViewDashboard = () => true;
  const canViewSales = () => isAdmin || isVendeur;
  const canViewPOS = () => isAdmin || isVendeur;
  const canViewStock = () => isAdmin;
  const canViewPurchases = () => isAdmin;
  const canViewFinances = () => isAdmin;
  const canViewUsers = () => isAdmin;
  const canViewReports = () => isAdmin;

  const handleSectionToggle = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const logoutUser = () => {
    setIsUserMenuOpen(false);
    localStorage.removeItem('Token');
    localStorage.removeItem('User');
    navigate('/');
  };

  // Menu sections adaptées aux rôles
  const menuSections = [
    {
      name: 'TABLEAU DE BORD',
      icon: LayoutDashboard,
      items: [
        { id: 'dashboard', text: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', permission: canViewDashboard() },
        { id: 'statistiques', text: 'Statistiques', icon: TrendingUp, path: '/statistiques', permission: isAdmin },
        { id: 'analyses', text: 'Analyses', icon: BarChart3, path: '/analyses', permission: isAdmin }
      ]
    },
    {
      name: 'VENTES',
      icon: ShoppingCart,
      permission: canViewSales(),
      items: [
        { id: 'pos', text: 'Point de Vente', icon: ShoppingBag, path: '/point-de-vente', permission: canViewPOS() },
        { id: 'ventes', text: 'Ventes', icon: ShoppingCart, path: '/ventes', permission: canViewSales(), badge: ventesImpayees > 0 ? ventesImpayees : 0 },
        { id: 'clients', text: 'Clients', icon: Users, path: '/clients', permission: canViewSales() },
        { id: 'factures', text: 'Factures', icon: Receipt, path: '/factures', permission: canViewSales() },
        { id: 'paiements', text: 'Paiements', icon: CreditCard, path: '/paiements', permission: isAdmin }
      ]
    },
    ...(isAdmin ? [{
      name: 'STOCK',
      icon: Package,
      permission: canViewStock(),
      items: [
        { id: 'categories', text: 'Catégories', icon: Tags, path: '/categories', permission: canViewStock() },
        { id: 'produits', text: 'Produits', icon: Package, path: '/produits', permission: canViewStock() },
        { id: 'stocks', text: 'Stocks', icon: Boxes, path: '/stocks', permission: canViewStock(), badge: stocksFaibles },
        { id: 'entrepots', text: 'Entrepôts', icon: Warehouse, path: '/entrepots', permission: canViewStock() },
        { id: 'mouvements', text: 'Mouvements', icon: TrendingUp, path: '/mouvements-stock', permission: canViewStock() },
        { id: 'lots', text: 'Lots', icon: Layers, path: '/lots', permission: canViewStock() },
        { id: 'alertes-expiration', text: 'Alertes expiration', icon: AlertTriangle, path: '/alertes-expiration', permission: canViewStock(), badge: alertesCount },
        { id: 'inventaire', text: 'Inventaire', icon: ClipboardCheck, path: '/inventaire', permission: canViewStock() },
        { id: 'transferts', text: 'Transferts', icon: MoveHorizontal, path: '/transferts', permission: canViewStock() }
      ]
    }] : []),
    ...(isAdmin ? [{
      name: 'ACHATS',
      icon: ShoppingBag,
      permission: canViewPurchases(),
      items: [
        { id: 'fournisseurs', text: 'Fournisseurs', icon: Building2, path: '/fournisseurs', permission: canViewPurchases() },
        { id: 'commandes', text: 'Commandes', icon: FileText, path: '/commandes-fournisseurs', permission: canViewPurchases(), badge: commandesALivrer },
        { id: 'receptions', text: 'Réceptions', icon: PackageCheck, path: '/receptions', permission: canViewPurchases() },
        { id: 'alertes-achats', text: 'Alertes', icon: AlertTriangle, path: '/purchase-alerts', permission: canViewPurchases(), badge: alertesCount }
      ]
    }] : []),
    ...(isAdmin ? [{
      name: 'FINANCES',
      icon: DollarSign,
      permission: canViewFinances(),
      items: [
        { id: 'tresorerie', text: 'Trésorerie', icon: CreditCard, path: '/tresorerie', permission: canViewFinances() },
        { id: 'depenses', text: 'Dépenses', icon: FileText, path: '/depenses', permission: canViewFinances() },
        { id: 'rapports', text: 'Rapports', icon: LineChart, path: '/rapports-financiers', permission: canViewFinances() },
        { id: 'comptabilite', text: 'Comptabilité', icon: Calculator, path: '/comptabilite', permission: isAdmin }
      ]
    }] : []),
    ...(isAdmin ? [{
      name: 'ADMINISTRATION',
      icon: Settings,
      permission: canViewUsers(),
      items: [
        { id: 'utilisateurs', text: 'Utilisateurs', icon: Users, path: '/utilisateurs', permission: canViewUsers() },
        { id: 'roles', text: 'Rôles & Permissions', icon: Shield, path: '/roles', permission: canViewUsers() },
        { id: 'audit', text: 'Journal d\'audit', icon: History, path: '/audit', permission: canViewUsers() },
        { id: 'parametres', text: 'Paramètres', icon: Settings, path: '/parametres', permission: canViewUsers() }
      ]
    }] : []),
    {
      name: 'MON ESPACE',
      icon: UserCircle,
      items: [
        { id: 'profile', text: 'Mon Profil', icon: UserCircle, path: '/profile', permission: true },
        { id: 'settings', text: 'Paramètres', icon: Settings, path: '/settings', permission: true },
        { id: 'support', text: 'Support', icon: HelpCircle, path: '/support', permission: true }
      ]
    }
  ];

  // Filtrer les sections vides
  const visibleSections = menuSections.filter(section => {
    if (section.permission === false) return false;
    const visibleItems = section.items.filter(item => item.permission);
    return visibleItems.length > 0;
  });

  // Raccourci clavier recherche
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
        item.permission &&
        (item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.name.toLowerCase().includes(searchQuery.toLowerCase()))
      ).map(item => ({ ...item, section: section.name }))
    ) : [];

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
                    <img src={logo} alt="Logo" className="w-7 h-7 object-contain" />
                  </div>
                </div>
                <div>
                  <h1 className="text-primary-content font-bold text-lg tracking-wide">SODEPSI</h1>
                  <p className="text-primary-content/60 text-[10px] font-medium">ERP Management</p>
                </div>
              </Link>

              {/* Logo mobile */}
              <div className="lg:hidden flex items-center gap-2">
                <div className="w-8 h-8 bg-base-100 rounded-lg flex items-center justify-center border-2 border-accent">
                  <img src={logo} alt="Logo" className="w-6 h-6 object-contain" />
                </div>
                <span className="text-primary-content font-bold text-sm">SODEPSI</span>
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

              {/* Notifications - uniquement pour admin */}
              {isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative p-2 rounded-lg text-primary-content hover:bg-primary-content/10 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-accent text-accent-content text-xs rounded-full flex items-center justify-center font-bold px-1">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </button>
                  
                  {isNotificationsOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                      <div className="absolute right-0 mt-2 w-80 bg-base-100 rounded-xl shadow-xl z-50 border border-primary/20 overflow-hidden">
                        <div className="p-3 bg-gradient-to-r from-primary to-primary/80 text-primary-content">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm">Notifications</p>
                            {notificationCount > 0 && (
                              <span className="text-xs bg-primary-content/20 px-2 py-0.5 rounded-full">{notificationCount} nouvelle(s)</span>
                            )}
                          </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto divide-y divide-base-200">
                          {notifications.map((notif) => (
                            <button
                              key={notif.id}
                              onClick={() => {
                                setIsNotificationsOpen(false);
                                navigate(notif.link);
                              }}
                              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-primary/5 transition-colors text-left"
                            >
                              <div className={`p-2 rounded-lg ${
                                notif.type === 'warning' ? 'bg-warning/20' : 
                                notif.type === 'error' ? 'bg-error/20' : 'bg-info/20'
                              }`}>
                                {notif.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-warning" /> : 
                                 notif.type === 'error' ? <AlertTriangle className="w-4 h-4 text-error" /> :
                                 <ShoppingBag className="w-4 h-4 text-info" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-base-content">{notif.title}</p>
                                <p className="text-xs text-base-content/40">{notif.message}</p>
                              </div>
                            </button>
                          ))}
                          {notifications.length === 0 && (
                            <div className="px-4 py-8 text-center">
                              <CheckCircle className="w-10 h-10 text-success mx-auto mb-2" />
                              <p className="text-sm text-base-content/50">Tout est bon !</p>
                              <p className="text-xs text-base-content/40">Aucune notification</p>
                            </div>
                          )}
                        </div>
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
                          to="/settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors"
                        >
                          <Settings className="w-5 h-5 text-base-content/40" />
                          <span className="text-sm text-base-content">Paramètres</span>
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
                <img src={logo} alt="Logo" className="w-7 h-7 object-contain" />
              </div>
              {sidebarOpen && (
                <div>
                  <h2 className="font-bold text-base-content text-sm">SODEPSI</h2>
                  <p className="text-xs text-base-content/50">ERP Management</p>
                </div>
              )}
            </div>
          </div>

          {/* Profil utilisateur */}
          <div className={`p-4 border-b border-primary/20 ${!sidebarOpen && 'text-center'} ${roleConfig.color === 'error' ? 'bg-error/5' : 'bg-success/5'}`}>
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
                  <div className={`badge badge-${roleConfig.color} badge-sm mt-1`}>
                    <RoleIcon className="w-3 h-3 mr-1" />
                    {roleConfig.label}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Menu de navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {visibleSections.map((section, idx) => {
              const visibleItems = section.items.filter(item => item.permission);
              if (visibleItems.length === 0) return null;
              const SectionIcon = section.icon;
              const isOpen = openSections[section.name];
              
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
                    <SectionIcon className={`w-5 h-5 ${isOpen ? 'text-primary' : ''}`} />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left text-xs font-semibold tracking-wide uppercase">
                          {section.name}
                        </span>
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </>
                    )}
                  </button>
                  
                  {sidebarOpen && isOpen && (
                    <div className="ml-6 mt-2 space-y-1 border-l-2 border-primary pl-4">
                      {visibleItems.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = path === item.path;
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
                            `}
                          >
                            <ItemIcon className={`w-4 h-4 ${isActive ? 'text-primary-content' : ''}`} />
                            <span className="flex-1">{item.text}</span>
                            {item.badge > 0 && (
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
                  <span className="text-xs text-base-content/50">v1.0.0</span>
                </div>
                <span className="badge badge-primary badge-sm">ERP 2025</span>
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
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : (
            content
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
                    <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-primary-content font-bold text-lg">SODEPSI</h2>
                    <p className="text-primary-content/70 text-xs">{roleConfig.label}</p>
                  </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-primary-content p-2 rounded-lg hover:bg-primary-content/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="py-4 px-3 space-y-1">
              {visibleSections.map((section, idx) => {
                const visibleItems = section.items.filter(item => item.permission);
                if (visibleItems.length === 0) return null;
                const SectionIcon = section.icon;
                const isOpen = openSections[section.name];
                
                return (
                  <div key={idx} className="mb-2">
                    <button
                      onClick={() => handleSectionToggle(section.name)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <SectionIcon className="w-5 h-5 text-primary" />
                        <span className="text-xs font-bold uppercase">{section.name}</span>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    {isOpen && (
                      <div className="ml-6 mt-2 space-y-1 border-l-2 border-primary pl-4">
                        {visibleItems.map((item) => {
                          const ItemIcon = item.icon;
                          const isActive = path === item.path;
                          return (
                            <Link
                              key={item.id}
                              to={item.path}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`
                                flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                                ${isActive ? 'bg-primary text-primary-content' : 'hover:bg-primary/10'}
                              `}
                            >
                              <ItemIcon className="w-4 h-4" />
                              <span>{item.text}</span>
                              {item.badge > 0 && (
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