import { v4 as uuidv4 } from "uuid";

/**
 * UTILITAIRES POUR LA GÉNÉRATION ET VÉRIFICATION DE QR CODE
 * Utilisés pour :
 * - Générer un UUID unique pour chaque ticket
 * - Créer les données du QR code
 * - Vérifier l'authenticité des tickets scannés
 */

/**
 * Génère un UUID unique pour un nouveau ticket
 * @returns {string} UUID v4 unique
 */
export const generateTicketId = () => {
  return uuidv4();
};

/**
 * Crée les données à encoder dans le QR code
 * Format JSON contenant toutes les informations critiques du ticket
 *
 * @param {Object} ticket - Objet ticket
 * @returns {string} JSON stringifié avec les données du ticket
 */
export const createQRCodeData = (ticket) => {
  const qrData = {
    id: ticket.id,
    parkingName: ticket.parkingName,
    entryTime: ticket.entryTime,
    pricePerHour: ticket.pricePerHour,
    timestamp: new Date().toISOString(),
  };

  return JSON.stringify(qrData);
};

/**
 * Parse les données scannées du QR code
 * @param {string} scannedData - Données brutes du QR code scanné
 * @returns {Object|null} Objet parsé ou null si invalide
 */
export const parseQRCodeData = (scannedData) => {
  try {
    const parsed = JSON.parse(scannedData);

    // Vérifier que les champs obligatoires sont présents
    if (
      !parsed.id ||
      !parsed.parkingName ||
      !parsed.entryTime ||
      parsed.pricePerHour === undefined
    ) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("Erreur lors du parsing du QR code:", error);
    return null;
  }
};

/**
 * Vérifie l'authenticité d'un ticket scanné en le cherchant dans la base locale
 * @param {Array} allTickets - Liste de tous les tickets (actifs + historique)
 * @param {string} ticketId - ID du ticket à vérifier
 * @returns {Object} Résultat de la vérification { isValid, ticket, status }
 */
export const verifyTicket = (allTickets, ticketId) => {
  const ticket = allTickets.find((t) => t.id === ticketId);

  if (!ticket) {
    return {
      isValid: false,
      ticket: null,
      status: "not_found",
      message: "Ticket non trouvé dans la base locale",
    };
  }

  // Ticket trouvé - vérifier son statut
  const isActive = ticket.status === "active" || !ticket.exitTime;
  const status = isActive ? "active" : "closed";

  return {
    isValid: true,
    ticket,
    status,
    message: isActive
      ? "Ticket valide et actif"
      : "Ticket clôturé (historique)",
  };
};

/**
 * Formate les données du ticket pour l'affichage après scan
 * @param {Object} ticketData - Données du QR code parsées
 * @param {Object} fullTicket - Ticket complet de la base locale
 * @returns {Object} Données formatées pour l'affichage
 */
export const formatScannedTicketInfo = (ticketData, fullTicket = null) => {
  return {
    id: ticketData.id,
    parkingName: ticketData.parkingName,
    entryTime: ticketData.entryTime,
    pricePerHour: ticketData.pricePerHour,
    generatedAt: ticketData.timestamp,
    // Informations supplémentaires si le ticket complet est fourni
    ...(fullTicket && {
      exitTime: fullTicket.exitTime,
      totalAmount: fullTicket.totalAmount,
      status: fullTicket.status || (fullTicket.exitTime ? "closed" : "active"),
    }),
  };
};
