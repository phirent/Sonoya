import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getDatabase } from "../../src/database";
import { theme } from "../../src/theme";
import type { Machine } from "../../src/database/types";

const formaterNombre = (valeur: string) => {
  const chiffresSeuls = valeur.replace(/\D/g, "");
  if (!chiffresSeuls) return "";
  return parseInt(chiffresSeuls, 10).toLocaleString("fr-FR");
};

export default function EcrasageScreen() {
  const router = useRouter();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineId, setMachineId] = useState<string | null>(null);
  const [montant, setMontant] = useState("");

  const chargerMachines = async () => {
    const db = await getDatabase();
    const resultats = await db.getAllAsync<Machine>(
      "SELECT * FROM machines WHERE estActive = 1",
    );
    setMachines(resultats);
    if (resultats.length > 0 && !machineId) {
      setMachineId(resultats[0].id);
    }
  };

  useEffect(() => {
    chargerMachines();
  }, []);

  const enregistrer = async () => {
    if (!machineId) return;
    const montantNombre = parseFloat(montant);

    if (!montantNombre) {
      Alert.alert("Champ manquant", "Renseigne le montant encaissé.");
      return;
    }

    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO prestations (id, machineId, datePrestation, montant) VALUES (?, ?, ?, ?)`,
      [
        `prestation_${Date.now()}`,
        machineId,
        new Date().toISOString(),
        montantNombre,
      ],
    );

    Alert.alert(
      "Enregistré",
      `${montantNombre.toLocaleString("fr-FR")} FCFA encaissés.`,
    );
    setMontant("");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.rangeeEntete}>
        <Text style={styles.titre}>Écrasage</Text>
        <TouchableOpacity onPress={() => router.push("/machines")}>
          <Text style={styles.lienAjouter}>+ Nouvelle machine</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {machines.length === 0 ? (
          <Text style={styles.texteVide}>Aucune machine créée.</Text>
        ) : (
          machines.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.carte, machineId === m.id && styles.carteActive]}
              onPress={() => setMachineId(m.id)}
            >
              <Text style={styles.nomMachine}>{m.nom}</Text>
            </TouchableOpacity>
          ))
        )}

        {machineId && (
          <View style={styles.formulaire}>
            <Text style={styles.label}>Montant encaissé (FCFA)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={formaterNombre(montant)}
              onChangeText={(t) => setMontant(t.replace(/\D/g, ""))}
              placeholder="0"
              autoFocus
            />

            <TouchableOpacity
              style={styles.boutonValider}
              onPress={enregistrer}
            >
              <Text style={styles.texteBouton}>Enregistrer la prestation</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.paddingHorizontal,
    paddingTop: 12,
  },
  rangeeEntete: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  titre: {
    fontSize: theme.typography.screenTitleSize,
    fontWeight: "bold",
    color: theme.colors.textMain,
  },
  lienAjouter: { fontSize: 13, fontWeight: "600", color: theme.colors.primary },
  texteVide: { color: theme.colors.textMuted, fontStyle: "italic" },
  carte: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.borderRadiusCard,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  carteActive: { borderColor: theme.colors.primary },
  nomMachine: { fontSize: 16, fontWeight: "600", color: theme.colors.textMain },
  formulaire: { marginTop: 8 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.borderRadiusInput,
    padding: 14,
    fontSize: 24,
    textAlign: "right",
  },
  boutonValider: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.borderRadiusInput,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  texteBouton: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
});
