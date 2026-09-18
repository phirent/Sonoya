import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getDatabase } from "../src/database";
import { theme } from "../src/theme";

type Periode = "jour" | "semaine" | "mois" | "personnalise";

interface LigneVente {
  id: string;
  quantite: number;
  prixVenteUnitaire: number;
  montantTotal: number;
  dateVente: string;
  produitNom: string;
}

interface LignePrestation {
  id: string;
  montant: number;
  datePrestation: string;
  machineNom: string;
}

interface LigneBois {
  id: string;
  montant: number;
  dateVente: string;
}

const calculerBornes = (
  periode: Periode,
  dateDebutPerso: Date,
  dateFinPerso: Date,
) => {
  if (periode === "personnalise") {
    const debut = new Date(dateDebutPerso);
    debut.setHours(0, 0, 0, 0);
    const fin = new Date(dateFinPerso);
    fin.setHours(23, 59, 59, 999);
    return { debutISO: debut.toISOString(), finISO: fin.toISOString() };
  }

  const fin = new Date();
  const debut = new Date();

  if (periode === "jour") {
    debut.setHours(0, 0, 0, 0);
  } else if (periode === "semaine") {
    debut.setDate(debut.getDate() - 7);
  } else {
    debut.setDate(debut.getDate() - 30);
  }

  return { debutISO: debut.toISOString(), finISO: fin.toISOString() };
};

const formaterHeure = (dateISO: string) =>
  new Date(dateISO).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
const formaterFCFA = (n: number) =>
  `${Math.round(n).toLocaleString("fr-FR")} FCFA`;

export default function ActiviteScreen() {
  const [periode, setPeriode] = useState<Periode>("jour");
  const [dateDebutPerso, setDateDebutPerso] = useState(new Date());
  const [dateFinPerso, setDateFinPerso] = useState(new Date());
  const [pickerOuvert, setPickerOuvert] = useState<"debut" | "fin" | null>(
    null,
  );

  const [ventes, setVentes] = useState<LigneVente[]>([]);
  const [prestations, setPrestations] = useState<LignePrestation[]>([]);
  const [bois, setBois] = useState<LigneBois[]>([]);

  const charger = useCallback(async () => {
    const db = await getDatabase();
    const { debutISO, finISO } = calculerBornes(
      periode,
      dateDebutPerso,
      dateFinPerso,
    );

    const listeVentes = await db.getAllAsync<LigneVente>(
      `SELECT v.id, v.quantite, v.prixVenteUnitaire, v.montantTotal, v.dateVente, p.nom as produitNom
       FROM ventes v
       JOIN lots l ON v.lotId = l.id
       JOIN produits p ON l.produitId = p.id
       WHERE v.dateVente BETWEEN ? AND ?
       ORDER BY v.dateVente DESC`,
      [debutISO, finISO],
    );

    const listePrestations = await db.getAllAsync<LignePrestation>(
      `SELECT pr.id, pr.montant, pr.datePrestation, m.nom as machineNom
       FROM prestations pr
       JOIN machines m ON pr.machineId = m.id
       WHERE pr.datePrestation BETWEEN ? AND ?
       ORDER BY pr.datePrestation DESC`,
      [debutISO, finISO],
    );

    const listeBois = await db.getAllAsync<LigneBois>(
      `SELECT id, montant, dateVente FROM ventesBois WHERE dateVente BETWEEN ? AND ? ORDER BY dateVente DESC`,
      [debutISO, finISO],
    );

    setVentes(listeVentes);
    setPrestations(listePrestations);
    setBois(listeBois);
  }, [periode, dateDebutPerso, dateFinPerso]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.segmentedControl}>
        {(["jour", "semaine", "mois", "personnalise"] as Periode[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.segment, periode === p && styles.segmentActif]}
            onPress={() => setPeriode(p)}
          >
            <Text
              style={[
                styles.texteSegment,
                periode === p && styles.texteSegmentActif,
              ]}
            >
              {p === "personnalise"
                ? "Perso"
                : p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {periode === "personnalise" && (
        <View style={styles.rangeeDates}>
          <TouchableOpacity
            style={styles.boutonDate}
            onPress={() => setPickerOuvert("debut")}
          >
            <Text style={styles.texteBoutonDate}>
              Du {dateDebutPerso.toLocaleDateString("fr-FR")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.boutonDate}
            onPress={() => setPickerOuvert("fin")}
          >
            <Text style={styles.texteBoutonDate}>
              Au {dateFinPerso.toLocaleDateString("fr-FR")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {pickerOuvert && (
        <DateTimePicker
          value={pickerOuvert === "debut" ? dateDebutPerso : dateFinPerso}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(_, dateChoisie) => {
            setPickerOuvert(null);
            if (dateChoisie) {
              if (pickerOuvert === "debut") setDateDebutPerso(dateChoisie);
              else setDateFinPerso(dateChoisie);
            }
          }}
        />
      )}

      <ScrollView style={{ marginTop: 12 }}>
        <Text style={styles.titreSection}>VENTES ({ventes.length})</Text>
        {ventes.length === 0 ? (
          <Text style={styles.texteVide}>Aucune vente sur cette période.</Text>
        ) : (
          ventes.map((v) => (
            <View key={v.id} style={styles.carte}>
              <View style={styles.rangeeCarte}>
                <Text style={styles.nomLigne}>{v.produitNom}</Text>
                <Text style={styles.montantLigne}>
                  {formaterFCFA(v.montantTotal)}
                </Text>
              </View>
              <Text style={styles.detailLigne}>
                {v.quantite} × {formaterFCFA(v.prixVenteUnitaire)} —{" "}
                {formaterHeure(v.dateVente)}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.titreSection}>ÉCRASAGE ({prestations.length})</Text>
        {prestations.length === 0 ? (
          <Text style={styles.texteVide}>
            Aucune prestation sur cette période.
          </Text>
        ) : (
          prestations.map((p) => (
            <View key={p.id} style={styles.carte}>
              <View style={styles.rangeeCarte}>
                <Text style={styles.nomLigne}>{p.machineNom}</Text>
                <Text style={styles.montantLigne}>
                  {formaterFCFA(p.montant)}
                </Text>
              </View>
              <Text style={styles.detailLigne}>
                {formaterHeure(p.datePrestation)}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.titreSection}>BOIS ({bois.length})</Text>
        {bois.length === 0 ? (
          <Text style={styles.texteVide}>
            Aucune vente de bois sur cette période.
          </Text>
        ) : (
          bois.map((b) => (
            <View key={b.id} style={styles.carte}>
              <View style={styles.rangeeCarte}>
                <Text style={styles.nomLigne}>Vente de bois</Text>
                <Text style={styles.montantLigne}>
                  {formaterFCFA(b.montant)}
                </Text>
              </View>
              <Text style={styles.detailLigne}>
                {formaterHeure(b.dateVente)}
              </Text>
            </View>
          ))
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
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: theme.colors.border,
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentActif: { backgroundColor: theme.colors.card },
  texteSegment: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: "600",
  },
  texteSegmentActif: { color: theme.colors.primary },
  rangeeDates: { flexDirection: "row", gap: 10, marginBottom: 12 },
  boutonDate: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.borderRadiusInput,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  texteBoutonDate: {
    color: theme.colors.textMain,
    fontWeight: "600",
    fontSize: 13,
  },
  titreSection: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  texteVide: {
    color: theme.colors.textMuted,
    fontStyle: "italic",
    fontSize: 13,
  },
  carte: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.borderRadiusCard,
    padding: 14,
    marginBottom: 8,
  },
  rangeeCarte: { flexDirection: "row", justifyContent: "space-between" },
  nomLigne: { fontSize: 15, fontWeight: "600", color: theme.colors.textMain },
  montantLigne: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  detailLigne: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4 },
});
