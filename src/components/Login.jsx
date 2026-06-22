import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import AxiosInstance from './AxiosInstance'
import logo from '../assets/logo.svg'
import backgroundImage from '../assets/background-login.jpg'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Shield,
  Building2,
  LayoutDashboard,
  Users,
  TrendingUp,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  Store,
  BarChart3,
  Settings,
  Headphones,
  Star,
  Zap
} from 'lucide-react'

const Login = () => {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const [showMessage, setShowMessage] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [messageType, setMessageType] = useState('error')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [currentYear] = useState(new Date().getFullYear())

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) {
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async (data) => {
    setLoading(true)
    setShowMessage(false)

    try {
      const response = await AxiosInstance.post('login/', {
        email: data.email,
        password: data.password,
      })
      
      localStorage.setItem('Token', response.data.token)
      localStorage.setItem('User', JSON.stringify(response.data.user))
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', data.email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }
      
      setMessageText('Connexion réussie ! Redirection en cours...')
      setMessageType('success')
      setShowMessage(true)
      
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
      
    } catch (error) {
      let errorMessage = 'Échec de connexion. Veuillez réessayer.'
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Email ou mot de passe incorrect'
        } else if (error.response.status === 403) {
          errorMessage = 'Compte désactivé. Contactez l\'administrateur.'
        } else if (error.response.status === 429) {
          errorMessage = 'Trop de tentatives. Veuillez patienter 5 minutes.'
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error
        }
      } else if (error.request) {
        errorMessage = 'Serveur inaccessible. Vérifiez votre connexion internet.'
      }
      
      setMessageText(errorMessage)
      setMessageType('error')
      setShowMessage(true)
      
      setTimeout(() => {
        setShowMessage(false)
      }, 5000)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: Store, text: 'Gestion commerciale' },
    { icon: BarChart3, text: 'Tableaux de bord' },
    { icon: Users, text: 'Gestion des utilisateurs' },
    { icon: Settings, text: 'Paramètres avancés' }
  ]

  const testimonials = [
    { 
      icon: Star, 
      text: 'Solution fiable et performante',
      author: 'Client satisfait'
    },
    { 
      icon: Headphones, 
      text: 'Support réactif 24/7',
      author: 'Équipe SODEPSI'
    }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-base-200">
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full filter blur-3xl"></div>
        
        {/* Floating dots with DaisyUI colors */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              backgroundColor: ['primary', 'secondary', 'accent', 'info', 'success'][Math.floor(Math.random() * 5)],
              opacity: 0.1 + Math.random() * 0.2,
              animation: `float ${6 + Math.random() * 8}s infinite ease-in-out ${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {showMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md animate-slideDown">
          <div className={`alert shadow-lg border-l-4 ${
            messageType === 'error' 
              ? 'alert-error border-l-error' 
              : 'alert-success border-l-success'
          }`}>
            <div className="flex items-center gap-3">
              {messageType === 'error' ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{messageText}</span>
            </div>
            <button onClick={() => setShowMessage(false)} className="btn btn-sm btn-ghost btn-circle">✕</button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 relative z-10 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl bg-base-100 border border-base-300/30">
          
          {/* Colonne gauche - Branding avec couleurs DaisyUI */}
          <div className="hidden lg:flex relative bg-gradient-to-br from-primary to-primary/90 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-content/10 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-content/5 rounded-full filter blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-content/5 rounded-full filter blur-3xl"></div>
            
            <div className="relative z-10 p-8 text-primary-content flex flex-col justify-between h-full">
              
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-primary-content/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-primary-content/10">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">SODEPSI</h1>
                    <p className="text-sm text-primary-content/70">Solutions Digitales & Performance</p>
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold mb-4 leading-tight">
                  Gérez votre entreprise
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
                    avec intelligence
                  </span>
                </h2>
                
                <p className="text-sm text-primary-content/80 leading-relaxed mb-8">
                  Plateforme tout-en-one pour la gestion moderne de votre activité.
                </p>
              </div>
              
              <div className="space-y-4 mb-8">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-primary-content/10 flex items-center justify-center group-hover:bg-primary-content/20 transition backdrop-blur-sm border border-primary-content/10">
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
              
              {/* Testimonials */}
              <div className="space-y-3 pt-4 border-t border-primary-content/10">
                {testimonials.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <item.icon className="w-4 h-4 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm text-primary-content/90 italic">"{item.text}"</p>
                      <p className="text-xs text-primary-content/50">- {item.author}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-primary-content/10 flex items-center gap-3">
                <Zap className="w-4 h-4 text-accent" />
                <p className="text-xs text-primary-content/60">Version 2.0 - Nouvelle expérience</p>
              </div>
            </div>
          </div>

          {/* Colonne droite - Formulaire avec couleurs DaisyUI */}
          <div className="flex items-center justify-center p-8 md:p-10 bg-base-100">
            <div className="w-full max-w-md">
              
              <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
                
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                    <img src={logo} alt="SODEPSI" className="w-12 h-12 object-contain" />
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-base-content">Bienvenue</h2>
                    <p className="text-sm text-base-content/60">Connectez-vous à votre espace</p>
                  </div>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text text-sm">Email professionnel</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <Mail className="h-4 w-4 text-base-content/40" />
                    </div>
                    <input
                      type="email"
                      placeholder="contact@sodepsi.com"
                      className={`input input-bordered w-full pl-9 py-2.5 text-sm ${
                        errors.email ? 'input-error' : ''
                      }`}
                      {...register('email', {
                        required: "Email requis",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Email invalide"
                        }
                      })}
                    />
                  </div>
                  {errors.email && (
                    <label className="label">
                      <span className="label-text-alt text-error text-xs">{errors.email.message}</span>
                    </label>
                  )}
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text text-sm">Mot de passe</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <Lock className="h-4 w-4 text-base-content/40" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`input input-bordered w-full pl-9 pr-9 py-2.5 text-sm ${
                        errors.password ? 'input-error' : ''
                      }`}
                      {...register('password', {
                        required: "Mot de passe requis",
                        minLength: { value: 6, message: "Minimum 6 caractères" }
                      })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/40 hover:text-base-content transition"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <label className="label">
                      <span className="label-text-alt text-error text-xs">{errors.password.message}</span>
                    </label>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="text-xs text-base-content/60">Se souvenir</span>
                  </label>
                  
                  <Link to="/request/password_reset" className="text-xs text-primary hover:text-primary/80 transition">
                    Mot de passe oublié ?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition"
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      <span>Se connecter</span>
                    </div>
                  )}
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-base-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-base-100 text-base-content/40">Nouveau sur SODEPSI ?</span>
                  </div>
                </div>

                <div className="text-center">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-primary text-primary text-sm hover:bg-primary hover:text-primary-content transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    Créer un compte
                  </Link>
                </div>

                <div className="flex items-center justify-center gap-4 pt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
                    <span className="text-xs text-base-content/40">Connexion sécurisée</span>
                  </div>
                  <span className="text-base-content/20">•</span>
                  <span className="text-xs text-base-content/40">SSL 256-bit</span>
                </div>

                <div className="text-center pt-2">
                  <p className="text-xs text-base-content/30">
                    © {currentYear} SODEPSI. Tous droits réservés.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.1); }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}

export default Login