import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import {
  parseQRCodeData,
  verifyTicket,
  formatScannedTicketInfo,
} from "../utils/qrCodeUtils";
import { getActiveTickets, getHistoryTickets } from "../storage/ticketStorage";
import {
  calculateDuration,
  formatDuration,
  formatTime,
} from "../utils/calculatePrice";

/**
 * OBJECTIF QR : Écran de scan du QR Code
 *
 * Ce composant permet de :
 * - Scanner un QR code de ticket
 * - Vérifier l'authenticité du ticket scanné
 * - Afficher les détails du ticket
 * - Confirmer le statut (actif/clôturé)
 */
const QRScannerScreen = ({ navigation }) => {
  // États pour le scanner
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(true);

  // États pour le résultat du scan
  const [scannedTicket, setScannedTicket] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Demande la permission d'accès à la caméra
   */
  useEffect(() => {
    const requestPermission = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    };

    requestPermission();
  }, []);

  /**
   * Traite le QR code scanné
   * Parse les données et vérifie l'authenticité du ticket
   */
  const handleBarCodeScanned = async ({ data }) => {
    if (!scanning) return; // Éviter les scans multiples

    setScanning(false);
    setLoading(true);

    try {
      // Parser les données du QR code
      const qrData = parseQRCodeData(data);

      if (!qrData) {
        Alert.alert(
          "QR Code invalide",
          "Ce QR code ne contient pas de données valides de ticket"
        );
        setScanning(true);
        setLoading(false);
        return;
      }

      // Récupérer tous les tickets (actifs + historique)
      const activeTickets = await getActiveTickets();
      const historyTickets = await getHistoryTickets();
      const allTickets = [...activeTickets, ...historyTickets];

      // Vérifier l'authenticité du ticket
      const verification = verifyTicket(allTickets, qrData.id);

      if (!verification.isValid) {
        // Ticket non trouvé
        setScannedTicket(qrData);
        setVerificationResult({
          ...verification,
          foundInBase: false,
        });
      } else {
        // Ticket trouvé et vérifié
        const ticketInfo = formatScannedTicketInfo(qrData, verification.ticket);
        setScannedTicket(ticketInfo);
        setVerificationResult({
          ...verification,
          foundInBase: true,
        });
      }
    } catch (error) {
      console.error("Erreur lors du scan:", error);
      Alert.alert("Erreur", "Une erreur s'est produite lors du scan");
      setScanning(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Réinitialise pour un nouveau scan
   */
  const handleReset = () => {
    setScannedTicket(null);
    setVerificationResult(null);
    setScanning(true);
  };

  /**
   * Navigue vers l'écran de détails du ticket
   */
  const handleViewDetails = () => {
    if (verificationResult?.foundInBase && scannedTicket?.id) {
      navigation.navigate("TicketDetail", { ticketId: scannedTicket.id });
    }
  };

  // Pas de permission
  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.permissionText}>Demande de permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanner</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.permissionErrorContainer}>
          <Text style={styles.permissionErrorIcon}>📷</Text>
          <Text style={styles.permissionErrorTitle}>Permission refusée</Text>
          <Text style={styles.permissionErrorText}>
            Nous avons besoin d'accéder à votre caméra pour scanner les QR
            codes.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => BarCodeScanner.requestPermissionsAsync()}
          >
            <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Écran de scan actif
  if (scanning && !scannedTicket) {
    return (
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanning ? handleBarCodeScanned : undefined}
          style={styles.camera}
        >
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerTitle}>Scanner un QR Code</Text>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerInstruction}>
              Pointez le QR code vers la caméra
            </Text>
          </View>
        </BarCodeScanner>

        <View style={styles.scannerFooter}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Écran de résultat
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
        <Text style={styles.headerTitle}>Résultat du scan</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Statut de vérification */}
        <View
          style={[
            styles.verificationCard,
            verificationResult?.foundInBase
              ? styles.verificationCardSuccess
              : styles.verificationCardError,
          ]}
        >
          <Text
            style={[
              styles.verificationIcon,
              verificationResult?.foundInBase
                ? styles.verificationIconSuccess
                : styles.verificationIconError,
            ]}
          >
            {verificationResult?.foundInBase ? "✅" : "❌"}
          </Text>
          <Text style={styles.verificationStatus}>
            {verificationResult?.foundInBase
              ? "Ticket vérifié"
              : "Ticket introuvable"}
          </Text>
          <Text
            style={[
              styles.verificationMessage,
              verificationResult?.foundInBase
                ? styles.verificationMessageSuccess
                : styles.verificationMessageError,
            ]}
          >
            {verificationResult?.message}
          </Text>
        </View>

        {/* Détails du ticket scanné */}
        {scannedTicket && (
          <View style={styles.ticketDetailsCard}>
            <Text style={styles.ticketDetailsTitle}>
              Informations du ticket
            </Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID Ticket</Text>
              <Text style={styles.detailValue}>{scannedTicket.id}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Parking</Text>
              <Text style={styles.detailValue}>
                {scannedTicket.parkingName}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Entrée</Text>
              <Text style={styles.detailValue}>
                {formatTime(scannedTicket.entryTime)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tarif/h</Text>
              <Text style={styles.detailValue}>
                {scannedTicket.pricePerHour} FCFA
              </Text>
            </View>

            {scannedTicket.exitTime && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sortie</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(scannedTicket.exitTime)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Montant</Text>
                  <Text style={[styles.detailValue, styles.detailValueGreen]}>
                    {scannedTicket.totalAmount} FCFA
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Statut du ticket */}
        {verificationResult?.foundInBase && (
          <View
            style={[
              styles.statusCard,
              verificationResult?.status === "active"
                ? styles.statusCardActive
                : styles.statusCardClosed,
            ]}
          >
            <Text style={styles.statusLabel}>Statut du ticket</Text>
            <Text style={styles.statusValue}>
              {verificationResult?.status === "active"
                ? "🟢 Actif"
                : "🔴 Clôturé"}
            </Text>
            <Text style={styles.statusMessage}>
              {verificationResult?.status === "active"
                ? "Ce ticket est actuellement actif"
                : "Ce ticket a été clôturé"}
            </Text>
          </View>
        )}

        {/* Information de sécurité */}
        <View style={styles.securityCard}>
          <Text style={styles.securityTitle}>🔒 Sécurité</Text>
          <Text style={styles.securityText}>
            Chaque ticket possède un identifiant unique (UUID) généré au moment
            de sa création. Ce QR code permet de vérifier l'authenticité du
            ticket.
          </Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Boutons d'action */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>🔄 Nouveau scan</Text>
        </TouchableOpacity>

        {verificationResult?.foundInBase && (
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={handleViewDetails}
          >
            <Text style={styles.detailsButtonText}>Voir détails</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  permissionText: {
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
  permissionErrorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  permissionErrorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  permissionErrorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 8,
  },
  permissionErrorText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: "#1976D2",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 24,
    textAlign: "center",
  },
  scannerFrame: {
    width: 280,
    height: 280,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  scannerInstruction: {
    marginTop: 32,
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  scannerFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  closeButton: {
    backgroundColor: "#D32F2F",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  verificationCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  verificationCardSuccess: {
    backgroundColor: "#E8F5E9",
  },
  verificationCardError: {
    backgroundColor: "#FFEBEE",
  },
  verificationIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  verificationIconSuccess: {
    color: "#2E7D32",
  },
  verificationIconError: {
    color: "#D32F2F",
  },
  verificationStatus: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  verificationMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  verificationMessageSuccess: {
    color: "#2E7D32",
  },
  verificationMessageError: {
    color: "#D32F2F",
  },
  ticketDetailsCard: {
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
  ticketDetailsTitle: {
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
    maxWidth: "60%",
    textAlign: "right",
  },
  detailValueGreen: {
    color: "#2E7D32",
  },
  statusCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusCardActive: {
    backgroundColor: "#E8F5E9",
  },
  statusCardClosed: {
    backgroundColor: "#F5F5F5",
  },
  statusLabel: {
    fontSize: 13,
    color: "#757575",
    marginBottom: 8,
    fontWeight: "500",
  },
  statusValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 13,
    color: "#757575",
    textAlign: "center",
  },
  securityCard: {
    backgroundColor: "#E3F2FD",
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#1976D2",
  },
  securityTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1565C0",
    marginBottom: 8,
  },
  securityText: {
    fontSize: 13,
    color: "#1565C0",
    lineHeight: 18,
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
  resetButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#757575",
  },
  detailsButton: {
    flex: 1,
    backgroundColor: "#1976D2",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  detailsButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default QRScannerScreen;
