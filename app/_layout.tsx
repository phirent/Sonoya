import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { getDatabase } from '../src/database/index';
import { View, Text } from 'react-native';

export default function RootLayout() {
  const [pret, setPret] = useState(false);

  useEffect(() => {
    getDatabase().then(() => {
      setPret(true);
    });
  }, []);

  if (!pret) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="rapports" options={{ headerShown: true, title: 'Rapports' }} />
      <Stack.Screen name="charge" options={{ headerShown: true, title: 'Déclarer une charge' }} />
      <Stack.Screen name="machines" options={{ headerShown: true, title: 'Machines' }} />
      <Stack.Screen name="reapprovisionnement" options={{ headerShown: true, title: 'Réapprovisionnement' }} />
      <Stack.Screen name="produit" options={{ headerShown: true, title: 'Nouveau produit' }} />
      <Stack.Screen name="parametres" options={{ headerShown: true, title: 'Paramètres' }} />
      <Stack.Screen name="produits" options={{ headerShown: true, title: 'Produits' }} />
      <Stack.Screen name="activite" options={{ headerShown: true, title: 'Activité' }} />
    </Stack>
  );
}