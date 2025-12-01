import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import {
  getActiveTickets,
  getHistoryTickets,
  deleteHistoryTicket,
} from "../storage/ticketStorage";
import TicketItem from "../components/TicketItem";

/**
 * ÉCRAN D'ACCUEIL - Tous les objectifs réunis
 *
 * Affiche :
 * - Les tickets actifs (OBJECTIF 1, 3)
 * - L'historique récent (OBJECTIF 5)
 * - Bouton pour créer un nouveau ticket (OBJECTIF 1)
 */
const HomeScreen = ({ navigation }) => {
  const [activeTickets, setActiveTickets] = useState([]);
  const [historyTickets, setHistoryTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Charge les données au montage du composant
   */
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Recharge les données quand on revient sur l'écran
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  /**
   * Charge les tickets actifs et l'historique
   */
  const loadData = async () => {
    setLoading(true);
    try {
      const [active, history] = await Promise.all([
        getActiveTickets(),
        getHistoryTickets(),
      ]);

      setActiveTickets(active || []);

      // Tri de l'historique par date décroissante
      const sortedHistory = (history || []).sort(
        (a, b) => new Date(b.exitTime) - new Date(a.exitTime)
      );
      setHistoryTickets(sortedHistory);
    } catch (error) {
      console.error("Erreur chargement données:", error);
      Alert.alert("Erreur", "Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Rafraîchissement pull-to-refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  /**
   * Supprime un ticket de l'historique
   */
  const handleDeleteHistoryTicket = (ticketId, parkingName) => {
    Alert.alert(
      "Supprimer le ticket",
      `Voulez-vous vraiment supprimer le ticket de ${parkingName} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const success = await deleteHistoryTicket(ticketId);
            if (success) {
              loadData();
              Alert.alert("Succès", "Ticket supprimé");
            } else {
              Alert.alert("Erreur", "Impossible de supprimer le ticket");
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

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Ticket Parking</Text>
          <Text style={styles.headerSubtitle}>
            {activeTickets.length} ticket{activeTickets.length > 1 ? "s" : ""}{" "}
            actif{activeTickets.length > 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate("History")}
        >
          <Text style={styles.historyButtonText}>📋</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={[{ type: "content" }]}
        keyExtractor={(item) => item.type}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1976D2"]}
            tintColor="#1976D2"
          />
        }
        contentContainerStyle={styles.scrollContent}
        renderItem={() => (
          <View>
            {/* OBJECTIF 1 & 3 : Section Tickets Actifs */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tickets en cours</Text>
                {activeTickets.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {activeTickets.length}
                    </Text>
                  </View>
                )}
              </View>

              {activeTickets.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🅿️</Text>
                  <Text style={styles.emptyTitle}>Aucun ticket actif</Text>
                  <Text style={styles.emptyText}>
                    Créez un nouveau ticket pour commencer
                  </Text>
                </View>
              ) : (
                <View>
                  {activeTickets.map((ticket) => (
                    <TicketItem
                      key={ticket.id}
                      ticket={ticket}
                      onPress={() =>
                        navigation.navigate("TicketDetail", {
                          ticketId: ticket.id,
                        })
                      }
                    />
                  ))}
                </View>
              )}
            </View>

            {/* OBJECTIF 5 : Section Historique Récent */}
            {historyTickets.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Historique récent</Text>
                  {historyTickets.length > 5 && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate("History")}
                      style={styles.seeAllButton}
                    >
                      <Text style={styles.seeAllText}>Voir tout</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {historyTickets.slice(0, 5).map((ticket) => (
                  <TicketItem
                    key={ticket.id}
                    ticket={ticket}
                    isHistory={true}
                    onPress={() =>
                      navigation.navigate("QRDisplay", { ticketId: ticket.id })
                    }
                    onLongPress={() =>
                      handleDeleteHistoryTicket(ticket.id, ticket.parkingName)
                    }
                  />
                ))}

                {historyTickets.length > 5 && (
                  <TouchableOpacity
                    style={styles.viewMoreButton}
                    onPress={() => navigation.navigate("History")}
                  >
                    <Text style={styles.viewMoreText}>
                      Voir {historyTickets.length - 5} ticket
                      {historyTickets.length - 5 > 1 ? "s" : ""} de plus
                    </Text>
                    <Text style={styles.viewMoreArrow}>→</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Info de suppression */}
            {historyTickets.length > 0 && (
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>💡</Text>
                <Text style={styles.infoText}>
                  Maintenez appuyé sur un ticket de l'historique pour le
                  supprimer
                </Text>
              </View>
            )}
          </View>
        )}
      />

      {/* OBJECTIF 1 : Bouton flottant pour créer un nouveau ticket */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("NewTicket")}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonIcon}>+</Text>
        <Text style={styles.addButtonText}>Nouveau Ticket</Text>
      </TouchableOpacity>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
    fontWeight: "500",
  },
  historyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  historyButtonText: {
    fontSize: 24,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  countBadge: {
    backgroundColor: "#1976D2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: "center",
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  seeAllText: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "600",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    lineHeight: 20,
  },
  viewMoreButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  viewMoreText: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "600",
  },
  viewMoreArrow: {
    fontSize: 18,
    color: "#1976D2",
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    marginHorizontal: 16,
    marginTop: 16,
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
    color: "#1565C0",
    lineHeight: 18,
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1976D2",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    shadowColor: "#1976D2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonIcon: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "600",
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default HomeScreen;
