import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { getTicketById, closeTicket } from "../storage/ticketStorage";
import {
  formatTime,
  formatDuration,
  calculateDuration,
  calculatePrice,
  getCurrentDateTime,
} from "../utils/calculatePrice";
import QRCodeCard from "../components/QRCodeCard";
import { parseQRCodeData } from "../utils/qrCodeUtils";

/**
 * OBJECTIF 3 : Calculer automatiquement le montant à payer selon la durée
 * OBJECTIF 4 : Clôturer le ticket lors de la sortie
 *
 * Ce composant affiche :
 * - Les détails d'un ticket actif
 * - Le calcul en temps réel de la durée et du montant
 * - Un bouton pour clôturer le ticket
 */
const TicketDetailScreen = ({ route, navigation }) => {
  const { ticketId } = route.params;

  // États
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(getCurrentDateTime());

  /**
   * Charge les données du ticket au montage du composant
   */
  useEffect(() => {
    loadTicket();
  }, []);

  /**
   * OBJECTIF 3 : Mise à jour automatique du temps et du montant
   * Actualise l'heure actuelle chaque seconde pour un calcul en temps réel
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentDateTime());
    }, 1000); // Mise à jour chaque seconde

    // Nettoyage de l'intervalle à la destruction du composant
    return () => clearInterval(interval);
  }, []);

  /**
   * Charge le ticket depuis AsyncStorage
   */
  const loadTicket = async () => {
    try {
      const loadedTicket = await getTicketById(ticketId);

      if (loadedTicket) {
        setTicket(loadedTicket);
      } else {
        Alert.alert("Erreur", "Ticket introuvable", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du ticket:", error);
      Alert.alert("Erreur", "Impossible de charger le ticket");
    } finally {
      setLoading(false);
    }
  };

  /**
   * OBJECTIF 4 : Clôturer le ticket lors de la sortie
   * Calcule le montant final et déplace le ticket vers l'historique
   */
  const handleCloseTicket = () => {
    if (!ticket) return;

    const exitTime = getCurrentDateTime();
    const totalAmount = calculatePrice(
      ticket.entryTime,
      exitTime,
      ticket.pricePerHour
    );

    Alert.alert(
      "Clôturer le ticket",
      `Montant à payer : ${totalAmount} FCFA\n\nConfirmer la clôture du ticket ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Clôturer",
          style: "default",
          onPress: async () => {
            const success = await closeTicket(ticketId, exitTime, totalAmount);

            if (success) {
              Alert.alert(
                "Ticket clôturé",
                `Montant total : ${totalAmount} FCFA`,
                [
                  {
                    text: "OK",
                    onPress: () => navigation.navigate("Home"),
                  },
                ]
              );
            } else {
              Alert.alert("Erreur", "Impossible de clôturer le ticket");
            }
          },
        },
      ]
    );
  };

  // Affichage du chargement
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // Affichage si ticket non trouvé
  if (!ticket) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Ticket introuvable</Text>
      </View>
    );
  }

  // OBJECTIF 3 : Calcul automatique en temps réel
  const durationMinutes = calculateDuration(ticket.entryTime, currentTime);
  const currentAmount = calculatePrice(
    ticket.entryTime,
    currentTime,
    ticket.pricePerHour
  );

  // Parse du contenu QR si présent
  const parsedQr = ticket.qrCodeData ? parseQRCodeData(ticket.qrCodeData) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails du ticket</Text>
          <View style={styles.backButton} />
        </View>

        {/* Carte du parking */}
        <View style={styles.parkingCard}>
          <Text style={styles.parkingLabel}>Parking</Text>
          <Text style={styles.parkingName}>{ticket.parkingName}</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>En cours</Text>
          </View>
        </View>

        {/* QR Code et données associées */}
        <QRCodeCard ticket={ticket} />

        {parsedQr && (
          <View style={styles.qrParsedCard}>
            <Text style={styles.detailsTitle}>Données QR</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID</Text>
              <Text style={styles.detailValue}>{parsedQr.id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Parking</Text>
              <Text style={styles.detailValue}>{parsedQr.parkingName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Entrée</Text>
              <Text style={styles.detailValue}>{formatTime(parsedQr.entryTime)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tarif/h</Text>
              <Text style={styles.detailValue}>{parsedQr.pricePerHour} FCFA</Text>
            </View>
          </View>
        )}

        {/* OBJECTIF 3 : Affichage de la durée calculée en temps réel */}
        <View style={styles.durationCard}>
          <Text style={styles.durationLabel}>Durée de stationnement</Text>
          <Text style={styles.durationValue}>
            {formatDuration(durationMinutes)}
          </Text>
        </View>

        {/* OBJECTIF 3 : Affichage du montant calculé en temps réel */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Montant actuel</Text>
          <Text style={styles.amountValue}>{currentAmount} FCFA</Text>
          <Text style={styles.amountNote}>
            Tarif : {ticket.pricePerHour} FCFA/h
          </Text>
        </View>

        {/* Informations détaillées */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Informations</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Heure d'entrée</Text>
            <Text style={styles.detailValue}>
              {formatTime(ticket.entryTime)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Heure actuelle</Text>
            <Text style={styles.detailValue}>{formatTime(currentTime)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tarif horaire</Text>
            <Text style={styles.detailValue}>{ticket.pricePerHour} FCFA</Text>
          </View>
        </View>

        {/* Information sur le calcul */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Le montant est calculé en temps réel. Toute heure commencée est due.
          </Text>
        </View>
      </ScrollView>

      {/* OBJECTIF 4 : Bouton de clôture fixe en bas */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleCloseTicket}
        >
          <Text style={styles.closeButtonText}>Clôturer le ticket</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#757575",
  },
  errorText: {
    fontSize: 16,
    color: "#D32F2F",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 28,
    color: "#1976D2",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  parkingCard: {
    backgroundColor: "#1976D2",
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  parkingLabel: {
    fontSize: 13,
    color: "#BBDEFB",
    marginBottom: 8,
    fontWeight: "500",
  },
  parkingName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
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
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  durationCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  durationLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 12,
    fontWeight: "500",
  },
  durationValue: {
    fontSize: 48,
    fontWeight: "700",
    color: "#1976D2",
  },
  amountCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  amountLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 8,
    fontWeight: "500",
  },
  amountValue: {
    fontSize: 36,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 8,
  },
  amountNote: {
    fontSize: 13,
    color: "#9E9E9E",
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  qrParsedCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  detailLabel: {
    fontSize: 14,
    color: "#757575",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 15,
    color: "#1A1A1A",
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#FFF3E0",
    marginHorizontal: 16,
    marginBottom: 100,
    padding: 16,
    borderRadius: 12,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#E65100",
    lineHeight: 18,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  closeButton: {
    backgroundColor: "#D32F2F",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default TicketDetailScreen;
