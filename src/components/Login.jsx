import React, { useState } from 'react'
import logo from '../assets/logo.svg'
import { 
  Shield, 
  AlertTriangle, 
  Phone, 
  MessageCircle, 
  Clock, 
  Building2,
  Handshake,
  FileWarning,
  CalendarX,
  UserCheck,
  Briefcase
} from 'lucide-react'

const Login = () => {
  const [currentYear] = useState(new Date().getFullYear())

  const contacts = [
    { number: '+221 78 309 45 33', label: 'Sénégal', href: 'https://wa.me/221783094533' },
    { number: '+212 620 988347', label: 'Maroc', href: 'https://wa.me/212620988347' }
  ]

  const engagements = [
    { icon: Briefcase, text: 'Adopter un comportement professionnel irréprochable' },
    { icon: Handshake, text: 'Respecter sa parole et ses engagements' },
    { icon: UserCheck, text: 'Honorer le paiement de ses dettes' }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-base-200 py-10">
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-error/10 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-warning/5 rounded-full filter blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-4xl">
        <div className="rounded-2xl overflow-hidden shadow-2xl bg-base-100 border border-base-300/30">
          
          {/* En-tête branding */}
          <div className="bg-gradient-to-r from-primary to-primary/90 p-6 text-primary-content">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-content/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-primary-content/10">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">SODEPSI</h1>
                <p className="text-xs text-primary-content/70">Solutions Digitales & Performance</p>
              </div>
            </div>
          </div>

          {/* Corps du message */}
          <div className="p-8 md:p-10 space-y-8">

            {/* Logo + titre */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                <img src={logo} alt="SODEPSI" className="w-12 h-12 object-contain" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-base-content">
                  Message important aux utilisateurs
                </h2>
                <p className="text-sm text-base-content/60 mt-2">
                  Accès suspendu — action requise
                </p>
              </div>
            </div>

            {/* Alerte principale */}
            <div className="alert alert-warning border-l-4 border-l-warning shadow-md">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-base">Exigences professionnelles obligatoires</h3>
                <p className="text-sm">
                  L'utilisation de ce logiciel exige un comportement professionnel dans le travail
                  et le strict respect de votre parole.
                </p>
              </div>
            </div>

            {/* Engagements attendus */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base-content flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Vous devez vous engager à :
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {engagements.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-3 p-4 rounded-xl bg-base-200 border border-base-300"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm text-base-content/80">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conséquence */}
            <div className="alert alert-error border-l-4 border-l-error shadow-lg">
              <FileWarning className="w-6 h-6 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-base">Conséquences en cas de non-respect</h3>
                <p className="text-sm">
                  Si vous ne respectez pas votre parole et ne payez pas votre dette,
                  <span className="font-bold"> le logiciel sera complètement supprimé en ligne</span>,
                  avec toutes vos données, dans un délai de <span className="font-bold">4 jours</span>.
                </p>
              </div>
            </div>

            {/* Délai */}
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-error/10 border border-error/30">
              <CalendarX className="w-6 h-6 text-error" />
              <div className="text-center">
                <p className="text-sm font-bold text-error">Délai restant : 4 jours</p>
                <p className="text-xs text-base-content/60">
                  Passé ce délai, aucune récupération de données ne sera possible.
                </p>
              </div>
              <Clock className="w-6 h-6 text-error animate-pulse" />
            </div>

            {/* Contact WhatsApp */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base-content flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-success" />
                Veuillez nous contacter par WhatsApp :
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contacts.map((contact, idx) => (
                  <a
                    key={idx}
                    href={contact.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-success text-success-content w-full shadow-lg shadow-success/20 hover:shadow-success/30 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-xs opacity-80">{contact.label}</span>
                      <span className="font-bold">{contact.number}</span>
                    </div>
                  </a>
                ))}
              </div>
              <p className="text-xs text-center text-base-content/50 flex items-center justify-center gap-1.5 pt-1">
                <Phone className="w-3 h-3" />
                Contacts joignables uniquement via WhatsApp
              </p>
            </div>

            {/* Pied de page */}
            <div className="text-center pt-4 border-t border-base-300">
              <p className="text-xs text-base-content/40">
                © {currentYear} SODEPSI. Tous droits réservés. — Accès restreint
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login