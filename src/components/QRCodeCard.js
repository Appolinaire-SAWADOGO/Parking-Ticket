import React from "react";
import { View, Text, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";

/**
 * COMPOSANT RÉUTILISABLE - QRCodeCard
 * Affiche un QR code avec les détails du ticket
 *
 * Affiche :
 * - QR code généré depuis les données du ticket
 * - Identifiant du ticket
 * - Date de création
 * - Bouton pour enregistrer/partager
 */
const QRCodeCard = ({ ticket, onPress = null }) => {
  return (
    <View style={styles.container}>
      {/* Header avec titre */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Authentification</Text>
        <Text style={styles.headerSubtitle}>
          Numéro: {ticket.id.slice(0, 8)}...
        </Text>
      </View>

      {/* Conteneur du QR Code */}
      <View style={styles.qrContainer}>
        <View style={styles.qrBackground}>
          {/* Générer le QR code à partir des données du ticket */}
          <QRCode
            value={ticket.qrCodeData || JSON.stringify(ticket)}
            size={250}
            color="#1A1A1A"
            backgroundColor="#FFFFFF"
            logoSize={30}
            logoBorderRadius={5}
            logoBgColor="#ffffff"
          />
        </View>
      </View>

      {/* Informations du QR code */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Informations du ticket</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Parking</Text>
          <Text style={styles.infoValue}>{ticket.parkingName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ID Ticket</Text>
          <Text style={styles.infoValue}>{ticket.id}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Entrée</Text>
          <Text style={styles.infoValue}>
            {new Date(ticket.entryTime).toLocaleString()}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tarif/h</Text>
          <Text style={styles.infoValue}>{ticket.pricePerHour} FCFA</Text>
        </View>
      </View>

      {/* Note de sécurité */}
      <View style={styles.securityNote}>
        <Text style={styles.securityIcon}>🔒</Text>
        <Text style={styles.securityText}>
          Conservez ce QR code pour une vérification ultérieure. Chaque ticket
          dispose d'un identifiant unique.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#757575",
    fontWeight: "500",
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginBottom: 20,
  },
  qrBackground: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E8EAF6",
  },
  infoSection: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EAF6",
  },
  infoLabel: {
    fontSize: 13,
    color: "#757575",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    color: "#1A1A1A",
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
  securityNote: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 12,
    alignItems: "flex-start",
  },
  securityIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: "#1565C0",
    lineHeight: 16,
    fontWeight: "500",
  },
});

export default QRCodeCard;
