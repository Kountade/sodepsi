// src/components/drh/EmployeeForm.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AxiosInstance from '../AxiosInstance'
import {
  Save,
  X,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  MapPin,
  AlertCircle,
  CheckCircle,
  Users,
  FileText,
  PhoneCall,
  Heart,
  Home
} from 'lucide-react'

const EmployeeForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEditMode)
  const [departments, setDepartments] = useState([])
  const [positions, setPositions] = useState([])
  const [managers, setManagers] = useState([])
  const [errors, setErrors] = useState({})
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    department: '', position: '', manager: '',
    hire_date: '', contract_type: 'cdi', work_status: 'active',
    base_salary: '', address: '', city: '', country: 'Sénégal',
    emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: ''
  })

  const contractTypes = [
    { value: 'cdi', label: 'CDI' }, { value: 'cdd', label: 'CDD' },
    { value: 'internship', label: 'Stage' }, { value: 'freelance', label: 'Freelance' },
    { value: 'temporary', label: 'Intérim' }, { value: 'apprentice', label: 'Alternant' }
  ]

  const workStatuses = [
    { value: 'active', label: 'Actif', icon: CheckCircle }, { value: 'inactive', label: 'Inactif', icon: X },
    { value: 'on_leave', label: 'En congé', icon: Calendar }, { value: 'sick', label: 'Maladie', icon: AlertCircle },
    { value: 'remote', label: 'Télétravail', icon: Home }, { value: 'suspended', label: 'Suspendu', icon: AlertCircle },
    { value: 'terminated', label: 'Licencié', icon: X }
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [depts, pos, emps] = await Promise.all([
          AxiosInstance.get('/departments/'),
          AxiosInstance.get('/positions/'),
          AxiosInstance.get('/employees/')
        ])
        setDepartments(depts.data || [])
        setPositions(pos.data || [])
        setManagers(emps.data || [])
      } catch (error) { console.error(error) }
    }
    fetchData()

    if (isEditMode) {
      AxiosInstance.get(`/employees/${id}/`).then(res => {
        const emp = res.data
        setFormData({
          first_name: emp.user?.first_name || '', last_name: emp.user?.last_name || '',
          email: emp.user?.email || '', phone: emp.user?.phone || '',
          department: emp.department?.id?.toString() || '', position: emp.position?.id?.toString() || '',
          manager: emp.manager?.id?.toString() || '', hire_date: emp.hire_date || '',
          contract_type: emp.contract_type || 'cdi', work_status: emp.work_status || 'active',
          base_salary: emp.base_salary || '', address: emp.address || '', city: emp.city || '',
          country: emp.country || 'Sénégal',
          emergency_contact_name: emp.emergency_contact_name || '',
          emergency_contact_phone: emp.emergency_contact_phone || '',
          emergency_contact_relation: emp.emergency_contact_relation || ''
        })
      }).catch(console.error).finally(() => setInitialLoading(false))
    } else {
      setInitialLoading(false)
    }
  }, [id, isEditMode])

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.first_name?.trim()) newErrors.first_name = 'Prénom requis'
    if (!formData.last_name?.trim()) newErrors.last_name = 'Nom requis'
    if (!formData.email?.trim()) newErrors.email = 'Email requis'
    if (!formData.hire_date) newErrors.hire_date = "Date d'embauche requise"
    if (!formData.base_salary) newErrors.base_salary = 'Salaire requis'
    if (!formData.emergency_contact_name?.trim()) newErrors.emergency_contact_name = 'Contact urgence requis'
    if (!formData.emergency_contact_phone?.trim()) newErrors.emergency_contact_phone = 'Téléphone urgence requis'
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email invalide'
    if (formData.base_salary && parseFloat(formData.base_salary) <= 0) newErrors.base_salary = 'Salaire > 0'
    return newErrors
  }

  const handleSubmit = async () => {
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      showNotification('Champs obligatoires manquants', 'error')
      return
    }

    setLoading(true)
    const dataToSend = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      phone: formData.phone || '',
      department: formData.department ? parseInt(formData.department) : null,
      position: formData.position ? parseInt(formData.position) : null,
      manager: formData.manager ? parseInt(formData.manager) : null,
      hire_date: formData.hire_date,
      contract_type: formData.contract_type,
      work_status: formData.work_status,
      base_salary: parseFloat(formData.base_salary),
      address: formData.address || '',
      city: formData.city || '',
      country: formData.country,
      emergency_contact_name: formData.emergency_contact_name.trim(),
      emergency_contact_phone: formData.emergency_contact_phone.trim(),
      emergency_contact_relation: formData.emergency_contact_relation || ''
    }

    try {
      if (isEditMode) await AxiosInstance.put(`/employees/${id}/`, dataToSend)
      else await AxiosInstance.post('/employees/', dataToSend)
      showNotification(`Employé ${isEditMode ? 'modifié' : 'créé'} avec succès`, 'success')
      setTimeout(() => navigate('/employees'), 2000)
    } catch (error) {
      console.error(error.response?.data)
      if (error.response?.data) setErrors(error.response.data)
      showNotification('Erreur lors de l\'enregistrement', 'error')
    } finally { setLoading(false) }
  }

  const getStatusIcon = (status) => {
    const statusConfig = workStatuses.find(s => s.value === status)
    if (statusConfig && statusConfig.icon) {
      const Icon = statusConfig.icon
      return <Icon className="w-4 h-4" />
    }
    return <CheckCircle className="w-4 h-4" />
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="loading loading-spinner loading-lg text-primary w-12 h-12 sm:w-16 sm:h-16"></div>
          <p className="text-base sm:text-xl font-semibold text-base-content/70 animate-pulse">
            Chargement...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-16 right-3 sm:right-6 z-50 animate-slideDown">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg text-sm sm:text-base`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            <span className="font-semibold">{notification.message}</span>
            <button 
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => setNotification({ ...notification, show: false })}
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/employees')}
          className="inline-flex items-center gap-2 text-primary hover:text-primary/70 transition-colors mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Retour à la liste
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary">
              {isEditMode ? 'Modifier l\'employé' : 'Nouvel employé'}
            </h1>
            <p className="text-xs sm:text-sm text-base-content/60 mt-1">
              {isEditMode ? 'Modifiez les informations de l\'employé' : 'Créez un nouveau profil employé'}
            </p>
          </div>
          
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/employees')}
              className="btn btn-outline gap-2"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-primary gap-2 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-base-100 rounded-xl shadow-xl border border-base-200 overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Section Identité */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-base-content">Identité</h2>
            </div>
            <div className="divider mt-0 mb-4"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Prénom <span className="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`input input-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary ${errors.first_name ? 'input-error' : ''}`}
                  placeholder="Jean"
                />
                {errors.first_name && <span className="text-error text-xs mt-1">{errors.first_name}</span>}
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Nom <span className="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`input input-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary ${errors.last_name ? 'input-error' : ''}`}
                  placeholder="Dupont"
                />
                {errors.last_name && <span className="text-error text-xs mt-1">{errors.last_name}</span>}
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Email <span className="text-error">*</span></span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-base-content/40" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input input-bordered w-full pl-9 focus:border-primary focus:ring-1 focus:ring-primary ${errors.email ? 'input-error' : ''}`}
                    placeholder="jean.dupont@entreprise.com"
                  />
                </div>
                {errors.email && <span className="text-error text-xs mt-1">{errors.email}</span>}
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Téléphone</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4 text-base-content/40" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input input-bordered w-full pl-9 focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="+221 77 123 45 67"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section Professionnel */}
          <div className="mb-6 mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-base-content">Professionnel</h2>
            </div>
            <div className="divider mt-0 mb-4"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Département</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="w-4 h-4 text-base-content/40" />
                  </div>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="select select-bordered w-full pl-9 focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Sélectionner un département</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id.toString()}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Poste</span>
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="select select-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">Sélectionner un poste</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.id.toString()}>{p.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Manager</span>
                </label>
                <select
                  name="manager"
                  value={formData.manager}
                  onChange={handleChange}
                  className="select select-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">Aucun manager</option>
                  {managers.filter(m => m.id !== parseInt(id)).map(m => (
                    <option key={m.id} value={m.id.toString()}>{m.full_name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Date d'embauche <span className="text-error">*</span></span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-base-content/40" />
                  </div>
                  <input
                    type="date"
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleChange}
                    className={`input input-bordered w-full pl-9 focus:border-primary focus:ring-1 focus:ring-primary ${errors.hire_date ? 'input-error' : ''}`}
                  />
                </div>
                {errors.hire_date && <span className="text-error text-xs mt-1">{errors.hire_date}</span>}
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Type de contrat</span>
                </label>
                <select
                  name="contract_type"
                  value={formData.contract_type}
                  onChange={handleChange}
                  className="select select-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {contractTypes.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Statut</span>
                </label>
                <select
                  name="work_status"
                  value={formData.work_status}
                  onChange={handleChange}
                  className="select select-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {workStatuses.map(w => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Salaire de base <span className="text-error">*</span></span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-4 h-4 text-base-content/40" />
                  </div>
                  <input
                    type="number"
                    name="base_salary"
                    value={formData.base_salary}
                    onChange={handleChange}
                    className={`input input-bordered w-full pl-9 focus:border-primary focus:ring-1 focus:ring-primary ${errors.base_salary ? 'input-error' : ''}`}
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-base-content/40">€</span>
                  </div>
                </div>
                {errors.base_salary && <span className="text-error text-xs mt-1">{errors.base_salary}</span>}
              </div>
            </div>
          </div>

          {/* Section Adresse */}
          <div className="mb-6 mt-8">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-base-content">Adresse</h2>
            </div>
            <div className="divider mt-0 mb-4"></div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Adresse</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary"
                  rows="2"
                  placeholder="Numéro et nom de rue"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold">Ville</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input input-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Dakar"
                  />
                </div>
                
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold">Pays</span>
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="input input-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Sénégal"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section Contact Urgence */}
          <div className="mb-6 mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-base-content">Contact d'urgence <span className="text-error">*</span></h2>
            </div>
            <div className="divider mt-0 mb-4"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Nom complet <span className="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  className={`input input-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary ${errors.emergency_contact_name ? 'input-error' : ''}`}
                  placeholder="Marie Dupont"
                />
                {errors.emergency_contact_name && <span className="text-error text-xs mt-1">{errors.emergency_contact_name}</span>}
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Téléphone <span className="text-error">*</span></span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4 text-base-content/40" />
                  </div>
                  <input
                    type="tel"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    className={`input input-bordered w-full pl-9 focus:border-primary focus:ring-1 focus:ring-primary ${errors.emergency_contact_phone ? 'input-error' : ''}`}
                    placeholder="+221 77 123 45 67"
                  />
                </div>
                {errors.emergency_contact_phone && <span className="text-error text-xs mt-1">{errors.emergency_contact_phone}</span>}
              </div>
              
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Relation</span>
                </label>
                <input
                  type="text"
                  name="emergency_contact_relation"
                  value={formData.emergency_contact_relation}
                  onChange={handleChange}
                  className="input input-bordered w-full focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Ex: Conjoint, Parent, Frère/Soeur"
                />
              </div>
            </div>
          </div>

          {/* Message d'information */}
          <div className="alert alert-info shadow-lg mt-6">
            <AlertCircle className="w-4 h-4" />
            <div>
              <span className="font-semibold">Champs obligatoires :</span> Prénom, Nom, Email, Date d'embauche, Salaire, Contact urgence
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeForm