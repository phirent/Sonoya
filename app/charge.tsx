import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDatabase } from "../src/database";
import { theme } from "../src/theme";
import type { Machine } from "../src/database/types";

const formaterNombre = (valeur: string) => {
  const chiffresSeuls = valeur.replace(/\D/g, "");
  if (!chiffresSeuls) return "";
  return parseInt(chiffresSeuls, 10).toLocaleString("fr-FR");
};

export default function Charge() {
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState("");
  const [typeCible, setTypeCible] = useState<"COMMUNE" | "SPECIFIQUE">(
    "COMMUNE",
  );
  const [machineId, setMachineId] = useState<string | null>(null);
  const [estSimulable, setEstSimulable] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);

  useEffect(() => {
    const chargerMachines = async () => {
      const db = await getDatabase();
      const resultats = await db.getAllAsync<Machine>(
        "SELECT * FROM machines WHERE estActive = 1",
      );
      setMachines(resultats);
    };
    chargerMachines();
  }, []);

  const enregistrer = async () => {
    const montantNombre = parseFloat(montant);

    if (!libelle.trim() || !montantNombre) {
      Alert.alert("Champs manquants", "Renseigne le libellé et le montant.");
      return;
    }
    if (typeCible === "SPECIFIQUE" && !machineId) {
      Alert.alert("Machine manquante", "Sélectionne la machine concernée.");
      return;
    }

    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO charges (id, dateCharge, libelle, montant, typeCible, machineId, estSimulable)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `charge_${Date.now()}`,
        new Date().toISOString(),
        libelle.trim(),
        montantNombre,
        typeCible,
        typeCible === "SPECIFIQUE" ? machineId : null,
        estSimulable ? 1 : 0,
      ],
    );

    Alert.alert(
      "Enregistrée",
      `Charge "${libelle}" de ${montantNombre.toLocaleString("fr-FR")} FCFA ajoutée.`,
    );
    setLibelle("");
    setMontant("");
    setEstSimulable(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView>
        <Text style={styles.label}>Libellé de la dépense</Text>
        <TextInput
          style={styles.input}
          value={libelle}
          onChangeText={setLibelle}
          placeholder="Ex: Facture électricité"
        />

        <Text style={styles.label}>Montant (FCFA)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formaterNombre(montant)}
          onChangeText={(t) => setMontant(t.replace(/\D/g, ""))}
          placeholder="0"
        />

        <Text style={styles.label}>Type de charge</Text>
        <View style={styles.rangeeTuiles}>
          <TouchableOpacity
            style={[
              styles.tuile,
              typeCible === "COMMUNE" && styles.tuileActive,
            ]}
            onPress={() => setTypeCible("COMMUNE")}
          >
            <Text
              style={
                typeCible === "COMMUNE"
                  ? styles.texteTuileActive
                  : styles.texteTuile
              }
            >
              Commune
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tuile,
              typeCible === "SPECIFIQUE" && styles.tuileActive,
            ]}
            onPress={() => setTypeCible("SPECIFIQUE")}
          >
            <Text
              style={
                typeCible === "SPECIFIQUE"
                  ? styles.texteTuileActive
                  : styles.texteTuile
              }
            >
              Spécifique à une machine
            </Text>
          </TouchableOpacity>
        </View>

        {typeCible === "SPECIFIQUE" && (
          <>
            <Text style={styles.label}>Machine concernée</Text>
            {machines.length === 0 ? (
              <Text style={styles.texteVide}>Aucune machine créée.</Text>
            ) : (
              <View style={styles.rangeeTuiles}>
                {machines.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.tuile,
                      machineId === m.id && styles.tuileActive,
                    ]}
                    onPress={() => setMachineId(m.id)}
                  >
                    <Text
                      style={
                        machineId === m.id
                          ? styles.texteTuileActive
                          : styles.texteTuile
                      }
                    >
                      {m.nom}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.rangeeSwitch}>
          <Text style={styles.labelSwitch}>
            Marquer comme charge familiale simulable (ex: salaire)
          </Text>
          <Switch
            value={estSimulable}
            onValueChange={setEstSimulable}
            trackColor={{ true: theme.colors.primary }}
          />
        </View>

        <TouchableOpacity style={styles.boutonValider} onPress={enregistrer}>
          <Text style={styles.texteBouton}>Enregistrer la charge</Text>
        </TouchableOpacity>
      </ScrollView>
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
  rangeeTuiles: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tuile: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.borderRadiusInput,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tuileActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  texteTuile: { color: theme.colors.textMain },
  texteTuileActive: { color: "#FFFFFF", fontWeight: "600" },
  texteVide: { color: theme.colors.textMuted, fontStyle: "italic" },
  rangeeSwitch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  labelSwitch: { flex: 1, fontSize: 14, color: theme.colors.textMain },
  boutonValider: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.borderRadiusInput,
    padding: 16,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 30,
  },
  texteBouton: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
});
