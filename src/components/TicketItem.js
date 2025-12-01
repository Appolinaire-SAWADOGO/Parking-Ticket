import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";
import {
  formatTime,
  formatDuration,
  calculateDuration,
  formatDate,
} from "../utils/calculatePrice";

/**
 * COMPOSANT RÉUTILISABLE - TicketItem
 * Utilisé dans HomeScreen et HistoryScreen
 *
 * Affiche :
 * - Nom du parking
 * - Heure d'entrée/sortie
 * - Durée (calculée en temps réel pour actifs)
 * - Montant total (pour historique)
 * - Badge "En cours" (pour tickets actifs)
 * - QR code du ticket
 * - ID unique du ticket
 */
const TicketItem = ({ ticket, onPress, onLongPress, isHistory = false }) => {
  /**
   * Calcul de la durée selon le type de ticket
   * - Ticket actif : durée depuis maintenant
   * - Ticket historique : durée entre entrée et sortie
   */
  let durationText = "";

  if (!isHistory) {
    // Ticket actif : calculer depuis maintenant
    const now = new Date().toISOString();
    const durationMinutes = calculateDuration(ticket.entryTime, now);
    durationText = formatDuration(durationMinutes);
  } else {
    // Ticket historique : durée fixe
    const durationMinutes = calculateDuration(
      ticket.entryTime,
      ticket.exitTime
    );
    durationText = formatDuration(durationMinutes);
  }

  return (
    <TouchableOpacity
      style={[styles.container, isHistory && styles.historyContainer]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Header avec nom du parking et montant (si historique) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.parkingName} numberOfLines={1}>
            {ticket.parkingName}
          </Text>
          <Text style={styles.ticketId}>ID: {ticket.id.slice(0, 8)}...</Text>
        </View>
        {isHistory && (
          <Text style={styles.amount}>{ticket.totalAmount} FCFA</Text>
        )}
      </View>

      {/* Conteneur principal avec QR code à gauche et infos à droite */}
      <View style={styles.mainContent}>
        {/* QR Code à gauche */}
        <View style={styles.qrContainer}>
          {ticket.qrCodeData ? (
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={ticket.qrCodeData}
                size={100}
                color="#1A1A1A"
                backgroundColor="#FFFFFF"
              />
            </View>
          ) : null}
        </View>

        {/* Informations à droite */}
        <View style={styles.infoContainer}>
          {/* Informations de temps */}
          <View style={styles.infoRow}>
            {/* Heure d'entrée */}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Entrée</Text>
              <Text style={styles.infoValue}>
                {formatTime(ticket.entryTime)}
              </Text>
            </View>

            {/* Heure de sortie (uniquement pour historique) */}
            {isHistory && ticket.exitTime && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Sortie</Text>
                <Text style={styles.infoValue}>
                  {formatTime(ticket.exitTime)}
                </Text>
              </View>
            )}

            {/* Durée */}
            {!isHistory && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Durée</Text>
                <Text style={styles.infoValue}>
                  {formatDuration(
                    calculateDuration(
                      ticket.entryTime,
                      new Date().toISOString()
                    )
                  )}
                </Text>
              </View>
            )}
          </View>

          {/* Aperçu des données du QR code (tronquées) */}
          {ticket.qrCodeData ? (
            <View style={styles.qrDataPreview}>
              <Text style={styles.qrDataLabel}>QR Data</Text>
              <Text style={styles.qrDataValue} numberOfLines={2}>
                {typeof ticket.qrCodeData === "string"
                  ? ticket.qrCodeData
                  : JSON.stringify(ticket.qrCodeData)}
              </Text>
            </View>
          ) : null}

          {/* Tarif horaire */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              Tarif: {ticket.pricePerHour} FCFA/h
            </Text>
            {isHistory && ticket.exitTime && (
              <Text style={styles.durationHistory}>
                {formatDuration(
                  calculateDuration(ticket.entryTime, ticket.exitTime)
                )}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Badge "En cours" pour tickets actifs seulement */}
      {!isHistory && (
        <View style={styles.footer}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>En cours</Text>
          </View>
        </View>
      )}

      {/* Badge "Clôturé" pour tickets historique */}
      {isHistory && (
        <View style={styles.footer}>
          <View style={styles.statusBadgeHistory}>
            <Text style={styles.statusTextHistory}>✓ Clôturé</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  historyContainer: {
    opacity: 0.9,
    borderColor: "#E0E0E0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  headerLeft: {
    flex: 1,
  },
  parkingName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  ticketId: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E7D32",
  },
  mainContent: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 12,
  },
  qrContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 120,
  },
  qrCodeWrapper: {
    padding: 6,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E8EAF6",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  infoRow: {
    flexDirection: "column",
    gap: 6,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 11,
    color: "#757575",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    color: "#424242",
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  priceLabel: {
    fontSize: 12,
    color: "#757575",
    fontWeight: "500",
  },
  durationHistory: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "600",
  },
  footer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "600",
  },
  statusBadgeHistory: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusTextHistory: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  qrDataPreview: {
    marginTop: 8,
    backgroundColor: "#F5F5F5",
    padding: 8,
    borderRadius: 8,
  },
  qrDataLabel: {
    fontSize: 11,
    color: "#757575",
    fontWeight: "600",
    marginBottom: 4,
  },
  qrDataValue: {
    fontSize: 12,
    color: "#1A1A1A",
    fontWeight: "500",
  },
});

export default TicketItem;
