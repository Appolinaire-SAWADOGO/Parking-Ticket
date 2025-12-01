import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateTicketId, createQRCodeData } from "../utils/qrCodeUtils";

/**
 * OBJECTIF 1 : Créer et enregistrer un ticket de parking
 * OBJECTIF 4 : Clôturer le ticket lors de la sortie
 * OBJECTIF 5 : Consulter un historique des tickets clôturés
 * OBJECTIF QR : Générer un QR code unique pour chaque ticket
 *
 * Ce fichier gère toute la persistance des données avec AsyncStorage
 * Séparation en deux catégories : tickets actifs et historique
 */

// Clés de stockage
const ACTIVE_TICKETS_KEY = "@ticket_parking:active_tickets";
const HISTORY_TICKETS_KEY = "@ticket_parking:history_tickets";

/* ========================================
   📝 TICKETS ACTIFS (OBJECTIF 1)
======================================== */

/**
 * Récupère tous les tickets actifs
 * @returns {Promise<Array>} Liste des tickets actifs
 */
export const getActiveTickets = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(ACTIVE_TICKETS_KEY);
    return jsonValue ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error("Erreur lors de la récupération des tickets actifs:", error);
    return [];
  }
};

/**
 * Sauvegarde la liste des tickets actifs
 * @param {Array} tickets - Liste des tickets à sauvegarder
 * @returns {Promise<boolean>} Succès de l'opération
 */
export const saveActiveTickets = async (tickets) => {
  try {
    await AsyncStorage.setItem(ACTIVE_TICKETS_KEY, JSON.stringify(tickets));
    return true;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des tickets actifs:", error);
    return false;
  }
};

/**
 * Ajoute un nouveau ticket actif
 * OBJECTIF 1 : Créer et enregistrer un ticket de parking
 * OBJECTIF QR : Génère automatiquement UUID et QR code
 * @param {Object} ticket - Nouveau ticket à ajouter
 * @returns {Promise<Object|null>} Ticket créé avec UUID/QR code ou null
 */
export const addTicket = async (ticket) => {
  try {
    // Générer un ID unique (UUID) pour le ticket
    const ticketWithId = {
      ...ticket,
      id: generateTicketId(),
      status: "active",
      createdAt: new Date().toISOString(),
    };

    // Générer les données du QR code
    ticketWithId.qrCodeData = createQRCodeData(ticketWithId);

    // Sauvegarder le ticket
    const tickets = await getActiveTickets();
    tickets.push(ticketWithId);
    const saved = await saveActiveTickets(tickets);

    return saved ? ticketWithId : null;
  } catch (error) {
    console.error("Erreur lors de l'ajout du ticket:", error);
    return null;
  }
};

/**
 * Récupère un ticket par son ID (actif ou historique)
 * @param {string} ticketId - ID du ticket à récupérer
 * @returns {Promise<Object|null>} Ticket trouvé ou null
 */
export const getTicketById = async (ticketId) => {
  try {
    // Chercher dans les tickets actifs
    const activeTickets = await getActiveTickets();
    const activeTicket = activeTickets.find((t) => t.id === ticketId);
    
    if (activeTicket) {
      return activeTicket;
    }

    // Chercher dans l'historique
    const historyTickets = await getHistoryTickets();
    const historyTicket = historyTickets.find((t) => t.id === ticketId);
    
    return historyTicket || null;
  } catch (error) {
    console.error("Erreur lors de la récupération du ticket:", error);
    return null;
  }
};

/* ========================================
   📚 HISTORIQUE DES TICKETS (OBJECTIF 5)
======================================== */

/**
 * Récupère tous les tickets de l'historique
 * OBJECTIF 5 : Consulter un historique des tickets clôturés
 * @returns {Promise<Array>} Liste des tickets clôturés
 */
export const getHistoryTickets = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(HISTORY_TICKETS_KEY);
    return jsonValue ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    return [];
  }
};

/**
 * Sauvegarde la liste de l'historique
 * @param {Array} tickets - Liste des tickets de l'historique
 * @returns {Promise<boolean>} Succès de l'opération
 */
export const saveHistoryTickets = async (tickets) => {
  try {
    await AsyncStorage.setItem(HISTORY_TICKETS_KEY, JSON.stringify(tickets));
    return true;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de l'historique:", error);
    return false;
  }
};

/**
 * Supprime un ticket de l'historique
 * OBJECTIF 5 : Permet de nettoyer l'historique
 * @param {string} ticketId - ID du ticket à supprimer
 * @returns {Promise<boolean>} Succès de l'opération
 */
export const deleteHistoryTicket = async (ticketId) => {
  try {
    const historyTickets = await getHistoryTickets();
    const filteredTickets = historyTickets.filter((t) => t.id !== ticketId);
    return await saveHistoryTickets(filteredTickets);
  } catch (error) {
    console.error("Erreur lors de la suppression du ticket:", error);
    return false;
  }
};

/* ========================================
   🔄 CLÔTURE DE TICKET (OBJECTIF 4)
======================================== */

/**
 * Clôture un ticket actif et le déplace vers l'historique
 * OBJECTIF 4 : Clôturer le ticket lors de la sortie
 *
 * @param {string} ticketId - ID du ticket à clôturer
 * @param {string} exitTime - Date/heure de sortie (ISO string)
 * @param {number} totalAmount - Montant total à payer
 * @returns {Promise<boolean>} Succès de l'opération
 */
export const closeTicket = async (ticketId, exitTime, totalAmount) => {
  try {
    // Récupérer les tickets actifs
    const activeTickets = await getActiveTickets();
    const ticketIndex = activeTickets.findIndex((t) => t.id === ticketId);

    // Vérifier que le ticket existe
    if (ticketIndex === -1) {
      console.error("Ticket non trouvé:", ticketId);
      return false;
    }

    // Créer le ticket clôturé
    const closedTicket = {
      ...activeTickets[ticketIndex],
      exitTime,
      totalAmount,
      status: "closed",
    };

    // Retirer le ticket des actifs
    activeTickets.splice(ticketIndex, 1);
    await saveActiveTickets(activeTickets);

    // Ajouter le ticket à l'historique
    const historyTickets = await getHistoryTickets();
    historyTickets.push(closedTicket);
    await saveHistoryTickets(historyTickets);

    return true;
  } catch (error) {
    console.error("Erreur lors de la clôture du ticket:", error);
    return false;
  }
};
