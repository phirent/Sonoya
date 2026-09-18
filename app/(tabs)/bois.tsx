import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDatabase } from "../../src/database";
import { theme } from "../../src/theme";

const formaterNombre = (valeur: string) => {
  const chiffresSeuls = valeur.replace(/\D/g, "");
  if (!chiffresSeuls) return "";
  return parseInt(chiffresSeuls, 10).toLocaleString("fr-FR");
};

export default function BoisScreen() {
  const [montant, setMontant] = useState("");

  const enregistrer = async () => {
    const montantNombre = parseFloat(montant);

    if (!montantNombre) {
      Alert.alert("Champ manquant", "Renseigne le montant de la vente.");
      return;
    }

    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO ventesBois (id, dateVente, montant) VALUES (?, ?, ?)`,
      [`ventebois_${Date.now()}`, new Date().toISOString(), montantNombre],
    );

    Alert.alert(
      "Enregistré",
      `${montantNombre.toLocaleString("fr-FR")} FCFA de bois vendus.`,
    );
    setMontant("");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.titre}>Bois</Text>

      <View style={styles.formulaire}>
        <Text style={styles.label}>Montant de la vente (FCFA)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formaterNombre(montant)}
          onChangeText={(t) => setMontant(t.replace(/\D/g, ""))}
          placeholder="0"
          autoFocus
        />

        <TouchableOpacity style={styles.boutonValider} onPress={enregistrer}>
          <Text style={styles.texteBouton}>Enregistrer la vente</Text>
        </TouchableOpacity>
      </View>
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
  titre: {
    fontSize: theme.typography.screenTitleSize,
    fontWeight: "bold",
    color: theme.colors.textMain,
    marginBottom: 30,
  },
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
