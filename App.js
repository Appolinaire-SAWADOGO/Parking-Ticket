import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

// On importe tous les écrans que l'on veut rendre accessibles
import HomeScreen from "./src/screens/HomeScreen";
import NewTicketScreen from "./src/screens/NewTicketScreen";
import TicketDetailScreen from "./src/screens/TicketDetailScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import QRDisplayScreen from "./src/screens/QRDisplayScreen";
import QRScannerScreen from "./src/screens/QRScannerScreen";

// On crée un navigateur de type "Stack" (pile)
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    // Le conteneur de navigation qui englobe tout
    <NavigationContainer>
      {/* On configure la barre de statut pour avoir du texte clair (icônes de batterie, heure...) */}
      <StatusBar style="light" />

      {/* Le navigateur qui va gérer la pile d'écrans */}
      <Stack.Navigator
        initialRouteName="Home" // Le premier écran affiché
        screenOptions={{ headerShown: false }} // On cache la barre de titre par défaut
      >
        {/* On déclare chaque écran avec un nom unique et le composant à afficher */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="NewTicket" component={NewTicketScreen} />
        <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="QRDisplay" component={QRDisplayScreen} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
