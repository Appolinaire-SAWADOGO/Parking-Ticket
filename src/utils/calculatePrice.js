/**
 * OBJECTIF 3 : Calculer automatiquement le montant à payer selon la durée
 *
 * Ce fichier contient toutes les fonctions utilitaires pour :
 * - Calculer la durée entre deux dates
 * - Calculer le montant à payer (règle: toute heure commencée est due)
 * - Formater les dates et durées pour l'affichage
 */

/**
 * Calcule la durée en minutes entre deux dates
 * OBJECTIF 3 : Base du calcul de prix
 *
 * @param {string} entryTime - Date/heure d'entrée (ISO string)
 * @param {string} exitTime - Date/heure de sortie (ISO string)
 * @returns {number} Durée en minutes (minimum 0)
 */
export const calculateDuration = (entryTime, exitTime) => {
  try {
    const entry = new Date(entryTime);
    const exit = new Date(exitTime);

    // Vérification de validité des dates
    if (isNaN(entry.getTime()) || isNaN(exit.getTime())) {
      console.error("Dates invalides:", { entryTime, exitTime });
      return 0;
    }

    // Calcul de la durée en millisecondes puis conversion en minutes
    const durationMs = exit - entry;
    const durationMinutes = Math.floor(durationMs / 60000);

    // Retourner 0 si la durée est négative
    return Math.max(0, durationMinutes);
  } catch (error) {
    console.error("Erreur lors du calcul de la durée:", error);
    return 0;
  }
};

/**
 * Calcule le montant à payer selon la règle "toute heure commencée est due"
 * OBJECTIF 3 : Calculer automatiquement le montant à payer selon la durée
 *
 * Règle de facturation :
 * - 1 minute = 1 heure facturée
 * - 59 minutes = 1 heure facturée
 * - 61 minutes = 2 heures facturées
 *
 * @param {string} entryTime - Date/heure d'entrée
 * @param {string} exitTime - Date/heure de sortie
 * @param {number} pricePerHour - Tarif horaire en FCFA
 * @returns {number} Montant total à payer en FCFA
 */
export const calculatePrice = (entryTime, exitTime, pricePerHour) => {
  try {
    // Calculer la durée en minutes
    const durationMinutes = calculateDuration(entryTime, exitTime);

    // Si durée = 0, pas de charge
    if (durationMinutes === 0) {
      return 0;
    }

    // Toute heure commencée est due : arrondi au supérieur
    // Math.ceil pour arrondir vers le haut
    // Exemple : 61 minutes / 60 = 1.0166... => Math.ceil = 2 heures
    const hoursToCharge = Math.ceil(durationMinutes / 60);

    // Calcul du montant total
    return hoursToCharge * pricePerHour;
  } catch (error) {
    console.error("Erreur lors du calcul du prix:", error);
    return 0;
  }
};

/**
 * Formate une durée en minutes en chaîne lisible
 *
 * @param {number} minutes - Durée en minutes
 * @returns {string} Format "2h 30min" ou "45min" ou "2h"
 *
 * Exemples :
 * - 30 minutes => "30min"
 * - 120 minutes => "2h"
 * - 150 minutes => "2h 30min"
 */
export const formatDuration = (minutes) => {
  if (minutes < 0 || isNaN(minutes)) {
    return "0min";
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}min`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}min`;
  }
};

/**
 * Formate une date en heure lisible
 *
 * @param {string} dateString - Date ISO string
 * @returns {string} Format "14h20"
 */
export const formatTime = (dateString) => {
  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "--h--";
    }

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${hours}h${minutes}`;
  } catch (error) {
    console.error("Erreur lors du formatage de l'heure:", error);
    return "--h--";
  }
};

/**
 * Formate une date en format lisible complet
 *
 * @param {string} dateString - Date ISO string
 * @returns {string} Format "20/01/2025 14h20"
 */
export const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "--/--/---- --h--";
    }

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}h${minutes}`;
  } catch (error) {
    console.error("Erreur lors du formatage de la date:", error);
    return "--/--/---- --h--";
  }
};

/**
 * Retourne la date/heure actuelle en format ISO
 *
 * @returns {string} Date ISO string (ex: "2025-01-20T14:30:00.000Z")
 */
export const getCurrentDateTime = () => {
  return new Date().toISOString();
};

/**
 * Formate une date pour un input datetime-local HTML
 *
 * @param {string} dateString - Date ISO string
 * @returns {string} Format "YYYY-MM-DDTHH:mm" pour input HTML
 */
export const formatForInput = (dateString) => {
  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error("Erreur lors du formatage pour input:", error);
    return "";
  }
};
