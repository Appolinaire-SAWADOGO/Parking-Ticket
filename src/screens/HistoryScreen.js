import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import {
  getHistoryTickets,
  deleteHistoryTicket,
} from "../storage/ticketStorage";
import TicketItem from "../components/TicketItem";

/**
 * OBJECTIF 5 : Consulter un historique des tickets clôturés
 *
 * Ce composant permet de :
 * - Afficher tous les tickets clôturés
 * - Trier par date (plus récent en premier)
 * - Voir des statistiques (total, moyenne, nombre)
 * - Supprimer un ticket de l'historique
 */
const HistoryScreen = ({ navigation }) => {
  const [historyTickets, setHistoryTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Charge l'historique au montage du composant
   */
  useEffect(() => {
    loadHistory();

    // Recharger quand on revient sur l'écran
    const unsubscribe = navigation.addListener("focus", () => {
      loadHistory();
    });

    return unsubscribe;
  }, [navigation]);

  /**
   * OBJECTIF 5 : Récupère et trie l'historique des tickets
   * Tri par date décroissante (plus récent en premier)
   */
  const loadHistory = async () => {
    setLoading(true);
    try {
      const tickets = await getHistoryTickets();

      // Tri par date de sortie (plus récent en premier)
      const sortedTickets = tickets.sort(
        (a, b) => new Date(b.exitTime) - new Date(a.exitTime)
      );

      setHistoryTickets(sortedTickets);
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error);
      Alert.alert("Erreur", "Impossible de charger l'historique");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Supprime un ticket de l'historique après confirmation
   * @param {string} ticketId - ID du ticket à supprimer
   * @param {string} parkingName - Nom du parking (pour l'affichage)
   */
  const handleDelete = (ticketId, parkingName) => {
    Alert.alert(
      "Supprimer le ticket",
      `Voulez-vous vraiment supprimer le ticket de ${parkingName} ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const success = await deleteHistoryTicket(ticketId);

            if (success) {
              loadHistory(); // Recharger la liste
              Alert.alert("Succès", "Ticket supprimé");
            } else {
              Alert.alert("Erreur", "Impossible de supprimer le ticket");
            }
          },
        },
      ]
    );
  };

  /**
   * OBJECTIF 5 : Calcule des statistiques sur l'historique
   * @returns {Object} { totalAmount, count, avgAmount }
   */
  const getStats = () => {
    const totalAmount = historyTickets.reduce(
      (sum, ticket) => sum + (ticket.totalAmount || 0),
      0
    );
    const count = historyTickets.length;
    const avgAmount = count > 0 ? Math.round(totalAmount / count) : 0;

    return { totalAmount, count, avgAmount };
  };

  const stats = getStats();

  // Affichage du chargement
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Historique</Text>
        <View style={styles.backButton} />
      </View>

      {/* OBJECTIF 5 : Section des statistiques */}
      {historyTickets.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.count}</Text>
            <Text style={styles.statLabel}>Tickets</Text>
          </View>

          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Text style={styles.statValueHighlight}>{stats.totalAmount}</Text>
            <Text style={styles.statLabelHighlight}>Total FCFA</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.avgAmount}</Text>
            <Text style={styles.statLabel}>Moyenne</Text>
          </View>
        </View>
      )}

      {/* OBJECTIF 5 : Liste des tickets clôturés */}
      {historyTickets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>Aucun historique</Text>
          <Text style={styles.emptyText}>
            Les tickets clôturés apparaîtront ici
          </Text>
        </View>
      ) : (
        <FlatList
          data={historyTickets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TicketItem
              ticket={item}
              isHistory={true}
              onPress={() => navigation.navigate("QRDisplay", { ticketId: item.id })}
              onLongPress={() => handleDelete(item.id, item.parkingName)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardHighlight: {
    backgroundColor: "#1976D2",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  statValueHighlight: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    fontWeight: "500",
  },
  statLabelHighlight: {
    fontSize: 12,
    color: "#E3F2FD",
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
  },
});

export default HistoryScreen;
