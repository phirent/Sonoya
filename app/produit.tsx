import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getDatabase } from "../src/database";
import { theme } from "../src/theme";

export default function ProduitScreen() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [type, setType] = useState<"kg" | "sac_kg">("kg");
  const [poidsSac, setPoidsSac] = useState("");

  const enregistrer = async () => {
    if (!nom.trim()) {
      Alert.alert("Champ manquant", "Donne un nom au produit.");
      return;
    }
    if (type === "sac_kg" && !poidsSac) {
      Alert.alert("Champ manquant", "Indique le poids d'un sac.");
      return;
    }

    const db = await getDatabase();
    const id = `prod_${Date.now()}`;

    await db.runAsync(
      `INSERT INTO produits (id, nom, type, poidsSac) VALUES (?, ?, ?, ?)`,
      [id, nom.trim(), type, type === "sac_kg" ? parseFloat(poidsSac) : null],
    );

    Alert.alert("Enregistré", `Produit "${nom}" créé.`);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.label}>Nom du produit</Text>
      <TextInput
        style={styles.input}
        value={nom}
        onChangeText={setNom}
        placeholder="Ex: Soja"
      />

      <Text style={styles.label}>Comment se vend-il ?</Text>
      <View style={styles.rangeeTuiles}>
        <TouchableOpacity
          style={[styles.tuile, type === "kg" && styles.tuileActive]}
          onPress={() => setType("kg")}
        >
          <Text
            style={type === "kg" ? styles.texteTuileActive : styles.texteTuile}
          >
            Toujours au kg
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tuile, type === "sac_kg" && styles.tuileActive]}
          onPress={() => setType("sac_kg")}
        >
          <Text
            style={
              type === "sac_kg" ? styles.texteTuileActive : styles.texteTuile
            }
          >
            Sac ou kg
          </Text>
        </TouchableOpacity>
      </View>

      {type === "sac_kg" && (
        <>
          <Text style={styles.label}>Poids d'un sac (kg)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={poidsSac}
            onChangeText={setPoidsSac}
            placeholder="Ex: 40"
          />
        </>
      )}

      <TouchableOpacity style={styles.boutonValider} onPress={enregistrer}>
        <Text style={styles.texteBouton}>Créer le produit</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.paddingHorizontal,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.borderRadiusInput,
    padding: 14,
    fontSize: 16,
  },
  rangeeTuiles: { flexDirection: "row", gap: 10 },
  tuile: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.borderRadiusInput,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tuileActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  texteTuile: { color: theme.colors.textMain },
  texteTuileActive: { color: "#FFFFFF", fontWeight: "600" },
  boutonValider: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.borderRadiusInput,
    padding: 16,
    alignItems: "center",
    marginTop: 30,
  },
  texteBouton: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
});
