// src/utils/permissions.js ou dans le composant de menu

// Calcul des commandes à livrer
const commandesALivrer = orders?.filter(o => 
  o.status === 'confirmed' || o.status === 'partial'
).length || 0;

// Calcul des retours en attente
const retoursCount = returns?.filter(r => 
  r.status === 'requested' || r.status === 'approved'
).length || 0;

// Calcul des alertes
const alertesCount = alerts?.length || 0;