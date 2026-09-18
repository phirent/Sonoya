import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getDatabase } from '../src/database';
import { theme } from '../src/theme';

export default function MachineScreen() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [coutAchat, setCoutAchat] = useState('');
  const [dureeVie, setDureeVie] = useState('');

  const enregistrer = async () => {
    if (!nom.trim() || !coutAchat || !dureeVie) {
      Alert.alert('Champs manquants', 'Remplis tous les champs.');
      return;
    }

    const db = await getDatabase();
    const id = `machine_${Date.now()}`;

    await db.runAsync(
      `INSERT INTO machines (id, nom, coutAchatInitial, dureeVieMois, dateAcquisition, estActive)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [id, nom.trim(), parseFloat(coutAchat), parseInt(dureeVie, 10), new Date().toISOString()]
    );

    Alert.alert('Enregistrée', `Machine "${nom}" créée.`);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.label}>Nom de la machine</Text>
      <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Ex: Machine à écraser n°1" />

      <Text style={styles.label}>Coût d'achat (FCFA)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={coutAchat} onChangeText={setCoutAchat} placeholder="0" />

      <Text style={styles.label}>Durée de vie estimée (mois)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={dureeVie} onChangeText={setDureeVie} placeholder="Ex: 60" />

      <TouchableOpacity style={styles.boutonValider} onPress={enregistrer}>
        <Text style={styles.texteBouton}>Créer la machine</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.paddingHorizontal },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted, marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: theme.colors.card, borderRadius: theme.spacing.borderRadiusInput, padding: 14, fontSize: 16 },
  boutonValider: { backgroundColor: theme.colors.primary, borderRadius: theme.spacing.borderRadiusInput, padding: 16, alignItems: 'center', marginTop: 30 },
  texteBouton: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
});