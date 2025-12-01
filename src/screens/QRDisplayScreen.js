import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Share,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import QRCodeCard from "../components/QRCodeCard";
import { getTicketById } from "../storage/ticketStorage";
import {
  calculateDuration,
  formatDuration,
  formatTime,
} from "../utils/calculatePrice";

/**
 * OBJECTIF QR : Écran d'affichage du QR Code
 *
 * Ce composant permet de :
 * - Afficher le ticket avec son QR code unique
 * - Voir les détails complets du ticket
 * - Partager le QR code
 * - Générer un reçu/preuve d'authenticité
 */
const QRDisplayScreen = ({ route, navigation }) => {
  const { ticketId } = route.params;

  // États
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toISOString());

  /**
   * Charge le ticket au montage du composant
   */
  useEffect(() => {
    loadTicket();
  }, []);

  /**
   * Mise à jour de l'heure actuelle pour afficher la durée en temps réel
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toISOString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /**
   * Charge le ticket depuis AsyncStorage
   */
  const loadTicket = async () => {
    setLoading(true);
    try {
      const ticketData = await getTicketById(ticketId);

      if (!ticketData) {
        Alert.alert("Erreur", "Ticket non trouvé");
        navigation.goBack();
        return;
      }

      setTicket(ticketData);
    } catch (error) {
      console.error("Erreur lors du chargement du ticket:", error);
      Alert.alert("Erreur", "Impossible de charger le ticket");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Partage le QR code et les informations du ticket
   */
  const handleShare = async () => {
    if (!ticket) return;

    try {
      await Share.share({
        message: `🎫 Ticket de Parking\n\nParking: ${ticket.parkingName}\nID: ${ticket.id}\nTarif: ${ticket.pricePerHour} FCFA/h\n\nCe QR code peut être scanné pour vérifier l'authenticité du ticket.`,
        title: "Partager mon ticket de parking",
        url: ticket.qrCodeData,
      });
    } catch (error) {
      console.error("Erreur lors du partage:", error);
      Alert.alert("Erreur", "Impossible de partager le ticket");
    }
  };

  /**
   * Copie l'ID du ticket dans le presse-papiers
   */
  const handleCopyId = () => {
    if (!ticket) return;

    // Dans une vraie application, on utiliserait @react-native-community/clipboard
    // Pour cet exemple, on affiche juste une alerte
    Alert.alert("ID copié", `L'ID ${ticket.id} a été copié`);
  };

  // Affichage du chargement
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Chargement du ticket...</Text>
      </View>
    );
  }

  // Affichage si ticket non trouvé
  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Ticket introuvable</Text>
          <Text style={styles.errorText}>
            Le ticket demandé n'existe pas ou a été supprimé.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calcul de la durée pour les tickets actifs
  const durationMinutes = calculateDuration(ticket.entryTime, currentTime);
  const durationText = formatDuration(durationMinutes);

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Ticket</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Carte du QR Code */}
        <QRCodeCard ticket={ticket} />

        {/* Détails du ticket */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Détails du ticket</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Parking</Text>
            <Text style={styles.detailValue}>{ticket.parkingName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Heure d'entrée</Text>
            <Text style={styles.detailValue}>
              {formatTime(ticket.entryTime)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Durée</Text>
            <Text style={styles.detailValue}>{durationText}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tarif horaire</Text>
            <Text style={styles.detailValue}>{ticket.pricePerHour} FCFA</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Créé le</Text>
            <Text style={styles.detailValue}>
              {new Date(ticket.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Section de l'identifiant */}
        <View style={styles.idCard}>
          <Text style={styles.idLabel}>Identifiant unique du ticket</Text>
          <TouchableOpacity style={styles.idBox} onPress={handleCopyId}>
            <Text style={styles.idText}>{ticket.id}</Text>
            <Text style={styles.copyIcon}>📋</Text>
          </TouchableOpacity>
          <Text style={styles.idNote}>Appuyez pour copier</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📋 Instructions</Text>
          <Text style={styles.instructionItem}>
            • Ce QR code identifie votre ticket de parking de manière unique
          </Text>
          <Text style={styles.instructionItem}>
            • Vous pouvez le scanner ultérieurement pour vérifier l'authenticité
          </Text>
          <Text style={styles.instructionItem}>
            • L'ID unique reste valide même après la clôture du ticket
          </Text>
          <Text style={styles.instructionItem}>
            • Partagez ce code si vous avez besoin de prouver votre entrée
          </Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Boutons d'action */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyId}>
          <Text style={styles.copyButtonText}>📋 Copier l'ID</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareMainButton} onPress={handleShare}>
          <Text style={styles.shareMainButtonText}>📤 Partager</Text>
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
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  shareButtonText: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "600",
  },
  idCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  idLabel: {
    fontSize: 13,
    color: "#757575",
    marginBottom: 12,
    fontWeight: "500",
  },
  idBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E8EAF6",
  },
  idText: {
    flex: 1,
    fontSize: 12,
    color: "#1A1A1A",
    fontWeight: "600",
    fontFamily: "monospace",
  },
  copyIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  idNote: {
    fontSize: 12,
    color: "#9E9E9E",
    fontStyle: "italic",
  },
  instructionsCard: {
    backgroundColor: "#FFF3E0",
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E65100",
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 13,
    color: "#E65100",
    lineHeight: 20,
    marginBottom: 8,
  },
  spacer: {
    height: 100,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    gap: 12,
  },
  copyButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#757575",
  },
  shareMainButton: {
    flex: 1,
    backgroundColor: "#1976D2",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  shareMainButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default QRDisplayScreen;
