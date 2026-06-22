// src/components/users/UtilisateurForm.jsx - Version corrigée
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import AxiosInstance from '../AxiosInstance'
import { 
  UserPlus, Mail, Lock, User, Calendar, 
  CheckCircle, XCircle, Building2, Store, 
  Briefcase, Users, Shield, ChevronRight, 
  ArrowLeft, Save, Phone, MapPin, Globe,
  CreditCard, Award, Sparkles, Trophy, 
  AlertCircle, UserCheck, HardDrive, Clock,
  FileText, IdCard, Home, Eye, EyeOff,
  X, Edit, Trash2
} from 'lucide-react'

// Configuration des rôles globaux
const ROLES_GLOBAUX = [
  { value: 'pdg', label: 'PDG', description: 'Accès total à toutes les agences', icon: Shield, color: 'error' },
  { value: 'drh', label: 'DRH', description: 'Gestion RH toutes agences', icon: Users, color: 'secondary' },
  { value: 'autre', label: 'Utilisateur standard', description: 'Rôle spécifique par agence', icon: User, color: 'neutral' }
]

// Configuration des rôles par agence (fallback si API échoue)
const ROLES_AGENCE_FALLBACK = [
  { value: 'chef_agence', label: "Chef d'agence", description: "Gestion complète de l'agence", icon: Store },
  { value: 'gestionnaire_stock', label: 'Gestionnaire de stock', description: 'Gestion des stocks et logistique', icon: HardDrive },
  { value: 'commercial', label: 'Commercial', description: 'Force de vente', icon: Users }
]

const UtilisateurForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    employee_id: '',
    hire_date: '',
    contract_type: '',
    salary: '',
    role_global: 'autre',
    agence_id: '',
    role_agence: ''
  })
  
  const [showMessage, setShowMessage] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [messageType, setMessageType] = useState('error')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRoleGlobal, setSelectedRoleGlobal] = useState('autre')
  const [agences, setAgences] = useState([])
  const [rolesAgenceDisponibles, setRolesAgenceDisponibles] = useState([])
  const [loadingAgences, setLoadingAgences] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(false)

  // Charger la liste des agences
  const fetchAgences = async () => {
    try {
      const response = await AxiosInstance.get('/agences/')
      setAgences(response.data || [])
      setApiError(false)
    } catch (error) {
      console.error('Erreur chargement agences:', error)
      setAgences([])
      setApiError(true)
      setMessageText('Erreur de chargement des agences')
      setMessageType('error')
      setShowMessage(true)
    }
  }

  // Charger les données de l'utilisateur en mode édition
  const fetchUserData = async () => {
    if (!isEditMode) return
    setIsLoading(true)
    try {
      const response = await AxiosInstance.get(`/users/${id}/`)
      const user = response.data
      setSelectedRoleGlobal(user.role_global || 'autre')
      
      setFormData({
        email: user.email || '',
        password: '',
        password2: '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        employee_id: user.employee_id || '',
        hire_date: user.hire_date || '',
        contract_type: user.contract_type || '',
        salary: user.salary || '',
        role_global: user.role_global || 'autre',
        agence_id: user.roles_agence?.[0]?.agence_id || '',
        role_agence: user.roles_agence?.[0]?.role || ''
      })
      
      if (user.roles_agence?.[0]?.agence_id) {
        await updateRolesDisponibles(user.roles_agence[0].agence_id)
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error)
      setMessageText('Erreur lors du chargement des données')
      setMessageType('error')
      setShowMessage(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Mettre à jour les rôles disponibles quand l'agence change
  const updateRolesDisponibles = async (agenceId) => {
    if (!agenceId) {
      setRolesAgenceDisponibles([])
      return
    }
    
    setLoadingAgences(true)
    try {
      const response = await AxiosInstance.get(`/agences/${agenceId}/roles_disponibles/`)
      const rolesData = response.data?.roles || []
      
      if (rolesData.length > 0) {
        const rolesFiltres = rolesData.map(role => {
          const fallbackRole = ROLES_AGENCE_FALLBACK.find(r => r.value === role.value)
          return {
            value: role.value,
            label: role.label,
            description: fallbackRole?.description || '',
            icon: fallbackRole?.icon || Briefcase
          }
        })
        setRolesAgenceDisponibles(rolesFiltres)
      } else {
        setRolesAgenceDisponibles(ROLES_AGENCE_FALLBACK)
      }
    } catch (error) {
      console.error('Erreur chargement rôles:', error)
      setRolesAgenceDisponibles(ROLES_AGENCE_FALLBACK)
    } finally {
      setLoadingAgences(false)
    }
  }

  useEffect(() => {
    fetchAgences()
    if (isEditMode) {
      fetchUserData()
    }
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'role_global') {
      setSelectedRoleGlobal(value)
      if (value !== 'autre') {
        setFormData(prev => ({ ...prev, agence_id: '', role_agence: '' }))
        setRolesAgenceDisponibles([])
      }
    }
    
    if (name === 'agence_id') {
      setFormData(prev => ({ ...prev, role_agence: '' }))
      if (value) {
        updateRolesDisponibles(value)
      } else {
        setRolesAgenceDisponibles([])
      }
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'L\'email est requis'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }
    
    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = 'Le mot de passe est requis'
      } else if (formData.password.length < 8) {
        newErrors.password = '8 caractères minimum'
      }
      
      if (formData.password !== formData.password2) {
        newErrors.password2 = 'Les mots de passe ne correspondent pas'
      }
    }
    
    if (formData.role_global === 'autre') {
      if (!formData.agence_id) {
        newErrors.agence_id = 'L\'agence est obligatoire'
      }
      if (!formData.role_agence) {
        newErrors.role_agence = 'Le rôle est obligatoire'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setIsLoading(true)
    setShowMessage(false)

    // Construction des données pour l'API
    const submitData = {
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone || null,  // ← Envoyer null si vide
      address: formData.address || null,
      city: formData.city || null,
      employee_id: formData.employee_id || null,  // ← Envoyer null si vide (évite l'erreur UNIQUE)
      role_global: formData.role_global
    }
    
    // Ajouter l'agence et le rôle seulement si c'est un utilisateur standard
    if (formData.role_global === 'autre') {
      if (formData.agence_id) {
        submitData.agence_id = parseInt(formData.agence_id)
      }
      if (formData.role_agence) {
        submitData.role_agence = formData.role_agence
      }
    }
    
    // Supprimer les champs vides pour éviter les erreurs de validation
    Object.keys(submitData).forEach(key => {
      if (submitData[key] === '' || submitData[key] === undefined) {
        delete submitData[key]
      }
    })
    
    // Supprimer le mot de passe s'il est vide (mode édition)
    if (isEditMode && !submitData.password) {
      delete submitData.password
    }

    console.log('📤 Données envoyées:', submitData)

    try {
      if (isEditMode) {
        await AxiosInstance.patch(`/users/${id}/`, submitData)
        setMessageText('✅ Utilisateur modifié avec succès !')
      } else {
        await AxiosInstance.post('/register/', submitData)
        setMessageText('✅ Utilisateur créé avec succès !')
      }
      
      setMessageType('success')
      setShowMessage(true)
      
      setTimeout(() => {
        navigate('/utilisateurs')
      }, 2000)
    } catch (error) {
      console.error('❌ Erreur complète:', error)
      console.error('❌ Response:', error.response?.data)
      
      let errorMessage = isEditMode ? 'Échec de la modification' : 'Échec de la création'
      
      if (error.response?.data?.email) {
        errorMessage = `Email: ${error.response.data.email[0]}`
      } else if (error.response?.data?.employee_id) {
        errorMessage = `Matricule: ${error.response.data.employee_id[0]}`
      } else if (error.response?.data?.agence_id) {
        errorMessage = `Agence: ${error.response.data.agence_id[0]}`
      } else if (error.response?.data?.role_agence) {
        errorMessage = `Rôle: ${error.response.data.role_agence[0]}`
      } else if (error.response?.data?.non_field_errors) {
        errorMessage = error.response.data.non_field_errors[0]
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.request) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez que le backend est démarré.'
      }
      
      setMessageText(errorMessage)
      setMessageType('error')
      setShowMessage(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (apiError && agences.length === 0 && !isEditMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-error mx-auto mb-4" />
          <h2 className="text-xl font-bold text-base-content mb-2">Erreur de connexion</h2>
          <p className="text-base-content/60 mb-4">Impossible de charger les agences. Vérifiez votre connexion.</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-200 py-6 px-4">
      <div className="w-full max-w-4xl mx-auto">
        
        {/* Bouton retour */}
        <div className="mb-4">
          <Link
            to="/utilisateurs"
            className="btn btn-ghost btn-sm gap-2 text-base-content/70 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </Link>
        </div>

        {/* Message de notification */}
        {showMessage && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className={`alert shadow-xl ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
              <div className="flex items-center gap-2">
                {messageType === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                <span>{messageText}</span>
              </div>
              <button onClick={() => setShowMessage(false)} className="btn btn-sm btn-ghost">✕</button>
            </div>
          </div>
        )}

        <div className="card bg-base-100 shadow-xl border border-primary/20">
          <div className="card-body p-6">
            
            {/* En-tête */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-3">
                {isEditMode ? (
                  <UserCheck className="h-8 w-8 text-primary" />
                ) : (
                  <UserPlus className="h-8 w-8 text-primary" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-base-content">
                {isEditMode ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}
              </h2>
              <p className="text-base-content/60 text-sm mt-1">
                {isEditMode ? 'Modifiez les informations de l\'utilisateur' : 'Remplissez les informations pour créer un nouvel utilisateur'}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Informations de connexion */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Informations de connexion
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        Email <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`input input-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary ${errors.email ? 'input-error' : ''}`}
                      placeholder="utilisateur@email.com"
                      disabled={isLoading}
                    />
                    {errors.email && <span className="text-error text-xs mt-1">{errors.email}</span>}
                  </div>
                  
                  {!isEditMode && (
                    <>
                      <div className="form-control w-full">
                        <label className="label">
                          <span className="label-text font-medium flex items-center gap-2">
                            <Lock className="h-4 w-4 text-primary" />
                            Mot de passe <span className="text-error">*</span>
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`input input-bordered w-full pr-10 ${errors.password ? 'input-error' : ''}`}
                            placeholder="••••••••"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.password && <span className="text-error text-xs mt-1">{errors.password}</span>}
                      </div>
                      
                      <div className="form-control w-full">
                        <label className="label">
                          <span className="label-text font-medium flex items-center gap-2">
                            <Lock className="h-4 w-4 text-primary" />
                            Confirmation <span className="text-error">*</span>
                          </span>
                        </label>
                        <input
                          type="password"
                          name="password2"
                          value={formData.password2}
                          onChange={handleChange}
                          className={`input input-bordered w-full ${errors.password2 ? 'input-error' : ''}`}
                          placeholder="••••••••"
                          disabled={isLoading}
                        />
                        {errors.password2 && <span className="text-error text-xs mt-1">{errors.password2}</span>}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Informations personnelles */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informations personnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Prénom</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="input input-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Prénom"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Nom</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="input input-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Nom"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        Téléphone
                      </span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input input-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="+221 XX XXX XX XX"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium flex items-center gap-2">
                        <IdCard className="h-4 w-4 text-primary" />
                        Matricule
                      </span>
                    </label>
                    <input
                      type="text"
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleChange}
                      className="input input-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="EMP-001 (optionnel)"
                      disabled={isLoading}
                    />
                    <span className="text-xs text-base-content/40 mt-1">Optionnel - Laissez vide si non disponible</span>
                  </div>
                </div>
              </div>

              <div className="divider text-base-content/40 text-xs">RÔLES & PERMISSIONS</div>

              {/* Rôle global */}
              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Rôle global <span className="text-error">*</span>
                  </span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {ROLES_GLOBAUX.map((role) => {
                    const Icon = role.icon
                    const isSelected = selectedRoleGlobal === role.value
                    return (
                      <label
                        key={role.value}
                        className={`
                          cursor-pointer p-3 rounded-xl border-2 transition-all duration-200
                          ${isSelected 
                            ? `border-${role.color} bg-${role.color}/10 shadow-md` 
                            : 'border-base-200 hover:border-base-300'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="role_global"
                          value={role.value}
                          checked={isSelected}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isSelected ? `bg-${role.color}/10` : 'bg-base-200'}`}>
                            <Icon className={`h-5 w-5 ${isSelected ? `text-${role.color}` : 'text-base-content/50'}`} />
                          </div>
                          <div className="flex-1">
                            <p className={`font-semibold text-sm ${isSelected ? `text-${role.color}` : 'text-base-content'}`}>
                              {role.label}
                            </p>
                            <p className="text-xs text-base-content/50">{role.description}</p>
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Champs spécifiques pour les utilisateurs d'agence */}
              {selectedRoleGlobal === 'autre' && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/30">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium flex items-center gap-2">
                        <Store className="h-4 w-4 text-primary" />
                        Agence <span className="text-error">*</span>
                      </span>
                    </label>
                    <select
                      name="agence_id"
                      value={formData.agence_id}
                      onChange={handleChange}
                      disabled={isLoading || agences.length === 0}
                      className={`select select-bordered w-full focus:border-primary ${errors.agence_id ? 'select-error' : ''}`}
                    >
                      <option value="">-- Sélectionner une agence --</option>
                      {agences.map((agence) => (
                        <option key={agence.id} value={agence.id}>
                          🏢 {agence.nom} ({agence.type_display})
                        </option>
                      ))}
                    </select>
                    {errors.agence_id && <span className="text-error text-xs mt-1">{errors.agence_id}</span>}
                  </div>

                  {formData.agence_id && (
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-medium flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary" />
                          Rôle dans l'agence <span className="text-error">*</span>
                        </span>
                      </label>
                      <select
                        name="role_agence"
                        value={formData.role_agence}
                        onChange={handleChange}
                        disabled={isLoading || loadingAgences}
                        className={`select select-bordered w-full focus:border-primary ${errors.role_agence ? 'select-error' : ''}`}
                      >
                        <option value="">-- Sélectionner un rôle --</option>
                        {rolesAgenceDisponibles.map((role) => (
                          <option key={role.value} value={role.value}>
                            📌 {role.label}
                          </option>
                        ))}
                      </select>
                      {loadingAgences && (
                        <span className="text-info text-xs mt-1 flex items-center gap-1">
                          <span className="loading loading-spinner loading-xs"></span>
                          Chargement des rôles...
                        </span>
                      )}
                      {errors.role_agence && <span className="text-error text-xs mt-1">{errors.role_agence}</span>}
                    </div>
                  )}
                </div>
              )}

              {/* Info pour PDG/DRH */}
              {(selectedRoleGlobal === 'pdg' || selectedRoleGlobal === 'drh') && (
                <div className="alert alert-info shadow-lg mt-4">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">
                    {selectedRoleGlobal === 'pdg' 
                      ? '👑 Le PDG aura accès à toutes les agences et toutes les fonctionnalités.'
                      : '👥 Le DRH pourra gérer les ressources humaines de toutes les agences.'}
                  </span>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary flex-1"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      {isEditMode ? 'Modification en cours...' : 'Création en cours...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      {isEditMode ? 'Modifier l\'utilisateur' : 'Créer l\'utilisateur'}
                    </>
                  )}
                </button>
                <Link 
                  to="/utilisateurs" 
                  className="btn btn-outline"
                >
                  Annuler
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default UtilisateurForm