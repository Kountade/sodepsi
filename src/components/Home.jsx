// src/components/Home.jsx
import React, { useEffect, useState } from 'react'
import { Construction } from 'lucide-react'

const Home = () => {
    const [user, setUser] = useState(null)

    useEffect(() => {
        const userData = localStorage.getItem('User')
        if (userData) {
            setUser(JSON.parse(userData))
        }
    }, [])

    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* En-tête */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            Tableau de bord
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {user?.username || 'Utilisateur'} 
                            <span className="mx-2 text-gray-300">•</span>
                            <span className="text-emerald-600 font-medium">
                                {user?.role === 'gerant' ? 'Gérant' : user?.role === 'pharmacien' ? 'Pharmacien' : 'Préparateur'}
                            </span>
                        </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                        {new Date().toLocaleDateString('fr-FR')}
                    </div>
                </div>
            </div>

            {/* Message de maintenance */}
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <Construction className="h-24 w-24 text-amber-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Page en maintenance</h2>
                <p className="text-gray-500 text-center">
                    Notre équipe travaille actuellement sur l'amélioration de cette page.<br />
                    Merci de votre patience.
                </p>
            </div>
        </div>
    )
}

export default Home