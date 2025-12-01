import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { addTicket } from "../storage/ticketStorage";
import { getCurrentDateTime } from "../utils/calculatePrice";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

/**
 * OBJECTIF 1 : Créer et enregistrer un ticket de parking
 * OBJECTIF 2 : Renseigner l'heure d'entrée (automatique ou via QR Code)
 *
 * Ce composant permet de :
 * - Créer un nouveau ticket avec nom du parking et tarif
 * - Scanner un QR Code pour pré-remplir les informations
 * - Choisir entre heure actuelle ou personnalisée
 * - Sauvegarder le ticket dans AsyncStorage
 */
const NewTicketScreen = ({ navigation }) => {
  // États pour le formulaire
  const [parkingName, setParkingName] = useState("");
  const [pricePerHour, setPricePerHour] = useState("50");
  const [entryTime, setEntryTime] = useState(getCurrentDateTime());
  const [useCurrentTime, setUseCurrentTime] = useState(true);

  // États pour le QR Code Scanner
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  /**
   * Demande la permission d'accès à la caméra pour scanner un QR Code
   */
  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === "granted");

    if (status === "granted") {
      setScanning(true);
    } else {
      Alert.alert(
        "Permission refusée",
        "L'accès à la caméra est nécessaire pour scanner un QR Code"
      );
    }
  };

  /**
   * Traite le QR Code scanné
   * Format attendu du QR :
   * {
   *   "parkingName": "Marché de Dassasgo",
   *   "pricePerHour": 50,
   *   "entryTime": "2025-01-20T14:30:00Z" // Optionnel
   * }
   */
  const handleBarCodeScanned = ({ data }) => {
    setScanning(false);

    try {
      const parsed = JSON.parse(data);

      // Vérifier que le QR contient les données nécessaires
      if (parsed.parkingName && parsed.pricePerHour) {
        setParkingName(parsed.parkingName);
        setPricePerHour(parsed.pricePerHour.toString());

        // Si le QR contient une heure d'entrée, l'utiliser
        if (parsed.entryTime) {
          setEntryTime(parsed.entryTime);
          setUseCurrentTime(false);
        }

        Alert.alert(
          "QR Code scanné avec succès",
          `Parking : ${parsed.parkingName}\nTarif : ${parsed.pricePerHour} FCFA/h`
        );
      } else {
        Alert.alert(
          "QR Code invalide",
          "Le QR Code ne contient pas les informations nécessaires"
        );
      }
    } catch (error) {
      Alert.alert(
        "Erreur de lecture",
        "Impossible de lire le QR Code. Veuillez réessayer."
      );
    }
  };

  /**
   * Valide et sauvegarde le nouveau ticket
   */
  const handleSave = async () => {
    // Validation du nom du parking
    if (!parkingName.trim()) {
      Alert.alert("Erreur", "Veuillez entrer le nom du parking");
      return;
    }

    // Validation du tarif
    const price = parseInt(pricePerHour);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Erreur", "Veuillez entrer un tarif valide (supérieur à 0)");
      return;
    }

    // Validation de l'heure d'entrée personnalisée
    if (!useCurrentTime && !entryTime) {
      Alert.alert("Erreur", "Veuillez entrer une heure d'entrée");
      return;
    }

    // Création du ticket (sans UUID ici, c'est addTicket qui le génère)
    const newTicket = {
      parkingName: parkingName.trim(),
      entryTime: useCurrentTime ? getCurrentDateTime() : entryTime,
      pricePerHour: price,
    };

    // Sauvegarde dans AsyncStorage avec génération automatique de UUID et QR code
    try {
      const savedTicket = await addTicket(newTicket);

      if (savedTicket && savedTicket.id) {
        // Afficher un message de succès avec alerte
        Alert.alert(
          "Ticket créé avec succès! 🎫",
          `Parking: ${parkingName.trim()}\nID: ${savedTicket.id.slice(
            0,
            8
          )}...`,
          [
            {
              text: "Voir le QR Code",
              onPress: () => {
                // Naviguer vers l'écran d'affichage du QR code
                navigation.replace("QRDisplay", { ticketId: savedTicket.id });
              },
            },
            {
              text: "Retour",
              onPress: () => navigation.goBack(),
              style: "cancel",
            },
          ]
        );
      } else {
        Alert.alert("Erreur", "Impossible de créer le ticket");
      }
    } catch (error) {
      console.error("Erreur lors de la création du ticket:", error);
      Alert.alert(
        "Erreur",
        "Une erreur s'est produite lors de la création du ticket"
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* En-tête */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nouveau Ticket</Text>
            <View style={styles.backButton} />
          </View>

          {/* Formulaire */}
          <View style={styles.form}>
            {/* Bouton Scanner QR Code - OBJECTIF 2 */}
            <TouchableOpacity
              style={styles.scanButton}
              onPress={requestCameraPermission}
            >
              <Text style={styles.scanButtonIcon}>📷</Text>
              <Text style={styles.scanButtonText}>Scanner un QR Code</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou saisir manuellement</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Nom du parking - OBJECTIF 1 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom du parking *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Marché de Dassasgo"
                placeholderTextColor="#B0B0B0"
                value={parkingName}
                onChangeText={setParkingName}
                autoCapitalize="words"
              />
            </View>

            {/* Tarif horaire - OBJECTIF 1 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tarif horaire (FCFA) *</Text>
              <TextInput
                style={styles.input}
                placeholder="50"
                placeholderTextColor="#B0B0B0"
                value={pricePerHour}
                onChangeText={setPricePerHour}
                keyboardType="numeric"
              />
            </View>

            {/* Heure d'entrée - OBJECTIF 2 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Heure d'entrée</Text>

              <TouchableOpacity
                style={styles.timeOption}
                onPress={() => setUseCurrentTime(true)}
              >
                <View style={styles.radio}>
                  {useCurrentTime && <View style={styles.radioSelected} />}
                </View>
                <Text style={styles.timeOptionText}>
                  Utiliser l'heure actuelle
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timeOption}
                onPress={() => setUseCurrentTime(false)}
              >
                <View style={styles.radio}>
                  {!useCurrentTime && <View style={styles.radioSelected} />}
                </View>
                <Text style={styles.timeOptionText}>
                  Entrer une heure personnalisée
                </Text>
              </TouchableOpacity>

              {!useCurrentTime && (
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  placeholder="2025-01-20T14:30:00"
                  placeholderTextColor="#B0B0B0"
                  value={entryTime}
                  onChangeText={setEntryTime}
                />
              )}
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                Le tarif est calculé par heure commencée. 1 minute = 1 heure
                facturée.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Boutons d'action */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Créer le ticket</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modal Scanner QR Code - OBJECTIF 2 */}
      <Modal
        visible={scanning}
        animationType="slide"
        onRequestClose={() => setScanning(false)}
      >
        <SafeAreaView style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setScanning(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scanner QR Code</Text>
            <View style={styles.closeButton} />
          </View>

          <BarCodeScanner
            onBarCodeScanned={handleBarCodeScanned}
            style={styles.scanner}
          />

          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerInstruction}>
              Positionnez le QR Code dans le cadre
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  form: {
    padding: 16,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1976D2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  scanButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: "#757575",
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inputDisabled: {
    marginTop: 12,
    backgroundColor: "#F5F5F5",
  },
  timeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#1976D2",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1976D2",
  },
  timeOptionText: {
    fontSize: 15,
    color: "#424242",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1565C0",
    lineHeight: 18,
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
  cancelButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#757575",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#1976D2",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Styles pour le scanner QR Code
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 28,
    color: "#FFFFFF",
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 12,
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
});

export default NewTicketScreen;
