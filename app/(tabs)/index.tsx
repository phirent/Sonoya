import { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";
import { getDatabase } from "../../src/database";

export default function AccueilScreen() {
  const router = useRouter();
  const [margeVente, setMargeVente] = useState(0);
  const [caEcrasage, setCaEcrasage] = useState(0);
  const [caBois, setCaBois] = useState(0);
  const [chargement, setChargement] = useState(true);

  const chargerChiffresDuJour = useCallback(async () => {
    const db = await getDatabase();
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);
    const debutISO = debutJour.toISOString();
    const finISO = new Date().toISOString();

    const vente = await db.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(margeCalculee) as total FROM ventes WHERE dateVente BETWEEN ? AND ?`,
      [debutISO, finISO],
    );
    const ecrasage = await db.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(montant) as total FROM prestations WHERE datePrestation BETWEEN ? AND ?`,
      [debutISO, finISO],
    );
    const bois = await db.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(montant) as total FROM ventesBois WHERE dateVente BETWEEN ? AND ?`,
      [debutISO, finISO],
    );

    setMargeVente(vente?.total ?? 0);
    setCaEcrasage(ecrasage?.total ?? 0);
    setCaBois(bois?.total ?? 0);
    setChargement(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      chargerChiffresDuJour();
    }, [chargerChiffresDuJour]),
  );

  const dateAujourdhui = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const activites = [
    {
      label: "Marge brute — Vente",
      valeur: margeVente,
      icone: "cart" as const,
      fond: "#E8F2FF",
      couleurIcone: theme.colors.primary,
    },
    {
      label: "CA — Écrasage",
      valeur: caEcrasage,
      icone: "cog" as const,
      fond: "#FFF1E6",
      couleurIcone: theme.colors.amberAlert,
    },
    {
      label: "CA — Bois",
      valeur: caBois,
      icone: "leaf" as const,
      fond: "#EAF7EC",
      couleurIcone: "#34C759",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.date}>{dateAujourdhui}</Text>
          <Text style={styles.titre}>Ma boutique</Text>
        </View>
        <TouchableOpacity
          style={styles.boutonParametres}
          onPress={() => router.push("/parametres")}
        >
          <Ionicons
            name="settings-outline"
            size={20}
            color={theme.colors.textMain}
          />
        </TouchableOpacity>
      </View>

      <View style={{ gap: 12 }}>
        {activites.map((a) => (
          <View key={a.label} style={styles.carte}>
            <View style={[styles.badgeIcone, { backgroundColor: a.fond }]}>
              <Ionicons name={a.icone} size={20} color={a.couleurIcone} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.labelCarte}>{a.label}</Text>
              <Text style={styles.montant}>
                {chargement
                  ? "..."
                  : `${Math.round(a.valeur).toLocaleString("fr-FR")} F`}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.encartInfo}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={theme.colors.primary}
          style={{ marginTop: 1 }}
        />
        <Text style={styles.texteInfo}>
          Le bénéfice net réel, charges et amortissements déduits, est
          disponible dans Rapports.
        </Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  date: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textTransform: "capitalize",
  },
  titre: {
    fontSize: theme.typography.screenTitleSize,
    fontWeight: "bold",
    color: theme.colors.textMain,
  },
  boutonParametres: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  carte: {
    backgroundColor: theme.colors.card,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  badgeIcone: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  labelCarte: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: theme.colors.textMuted,
    textTransform: "uppercase",
  },
  montant: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.textMain,
    marginTop: 2,
  },
  encartInfo: {
    marginTop: 20,
    backgroundColor: "#EAF2FE",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  texteInfo: { fontSize: 12, color: "#3A5A85", flex: 1, lineHeight: 17 },
});
