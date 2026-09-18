import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getDatabase } from "../src/database";
import { theme } from "../src/theme";
import { VENTILATION_CHARGES_COMMUNES } from "../src/constantes";

type Periode = "jour" | "semaine" | "mois" | "personnalise";

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

const formaterFCFA = (n: number) =>
  `${Math.round(n).toLocaleString("fr-FR")} FCFA`;

export default function RapportsScreen() {
  const router = useRouter();
  const [periode, setPeriode] = useState<Periode>("jour");
  const [dateDebutPerso, setDateDebutPerso] = useState(new Date());
  const [dateFinPerso, setDateFinPerso] = useState(new Date());
  const [pickerOuvert, setPickerOuvert] = useState<"debut" | "fin" | null>(
    null,
  );
  const [inclureSimulable, setInclureSimulable] = useState(true);

  const [margeVente, setMargeVente] = useState(0);
  const [caEcrasage, setCaEcrasage] = useState(0);
  const [caBois, setCaBois] = useState(0);
  const [chargesCommunesTotal, setChargesCommunesTotal] = useState(0);
  const [chargesSpecifiquesTotal, setChargesSpecifiquesTotal] = useState(0);
  const [amortissementTotal, setAmortissementTotal] = useState(0);
  const [chargement, setChargement] = useState(true);

  const calculer = useCallback(async () => {
    setChargement(true);
    const db = await getDatabase();
    const { debutISO, finISO } = calculerBornes(
      periode,
      dateDebutPerso,
      dateFinPerso,
    );

    const nombreJours = Math.max(
      1,
      Math.round(
        (new Date(finISO).getTime() - new Date(debutISO).getTime()) / 86400000,
      ),
    );

    const filtreSimulable = inclureSimulable ? "" : "AND estSimulable = 0";

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

    const chargesCommunes = await db.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(montant) as total FROM charges WHERE typeCible = 'COMMUNE' AND dateCharge BETWEEN ? AND ? ${filtreSimulable}`,
      [debutISO, finISO],
    );

    const chargesSpecifiques = await db.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(montant) as total FROM charges WHERE typeCible = 'SPECIFIQUE' AND dateCharge BETWEEN ? AND ? ${filtreSimulable}`,
      [debutISO, finISO],
    );

    const amortissementMensuel = await db.getFirstAsync<{
      total: number | null;
    }>(
      `SELECT SUM(coutAchatInitial * 1.0 / dureeVieMois) as total FROM machines WHERE estActive = 1`,
    );

    setMargeVente(vente?.total ?? 0);
    setCaEcrasage(ecrasage?.total ?? 0);
    setCaBois(bois?.total ?? 0);
    setChargesCommunesTotal(chargesCommunes?.total ?? 0);
    setChargesSpecifiquesTotal(chargesSpecifiques?.total ?? 0);
    setAmortissementTotal(
      ((amortissementMensuel?.total ?? 0) / 30) * nombreJours,
    );
    setChargement(false);
  }, [periode, dateDebutPerso, dateFinPerso, inclureSimulable]);

  useFocusEffect(
    useCallback(() => {
      calculer();
    }, [calculer]),
  );

  const quotePartBoutique =
    chargesCommunesTotal *
    (VENTILATION_CHARGES_COMMUNES.pourcentageBoutique / 100);
  const quotePartEcrasage =
    chargesCommunesTotal *
    (VENTILATION_CHARGES_COMMUNES.pourcentageEcrasage / 100);

  const beneficeBoutique = margeVente - quotePartBoutique;
  const beneficeEcrasage =
    caEcrasage -
    quotePartEcrasage -
    chargesSpecifiquesTotal -
    amortissementTotal;
  const beneficeNetTotal = beneficeBoutique + beneficeEcrasage;

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

      <TouchableOpacity onPress={() => router.push("/activite")}>
        <Text style={styles.lienActivite}>Voir le détail des activités →</Text>
      </TouchableOpacity>

      <ScrollView style={{ marginTop: 12 }}>
        <Text style={styles.titreSection}>BOUTIQUE</Text>
        <View style={styles.bloc}>
          <View style={styles.ligne}>
            <Text style={styles.libelleLigne}>Marge brute Vente</Text>
            <Text style={styles.valeurLigne}>{formaterFCFA(margeVente)}</Text>
          </View>
          <View style={styles.ligne}>
            <Text style={styles.libelleLigne}>
              Quote-part charges communes (
              {VENTILATION_CHARGES_COMMUNES.pourcentageBoutique}%)
            </Text>
            <Text style={styles.valeurNegative}>
              -{formaterFCFA(quotePartBoutique)}
            </Text>
          </View>
          <View style={styles.ligneTotal}>
            <Text style={styles.libelleTotal}>Bénéfice Boutique</Text>
            <Text style={styles.valeurTotal}>
              {formaterFCFA(beneficeBoutique)}
            </Text>
          </View>
        </View>

        <Text style={styles.titreSection}>ÉCRASAGE</Text>
        <View style={styles.bloc}>
          <View style={styles.ligne}>
            <Text style={styles.libelleLigne}>
              Chiffre d'affaires prestations
            </Text>
            <Text style={styles.valeurLigne}>{formaterFCFA(caEcrasage)}</Text>
          </View>
          <View style={styles.ligne}>
            <Text style={styles.libelleLigne}>
              Quote-part charges communes (
              {VENTILATION_CHARGES_COMMUNES.pourcentageEcrasage}%)
            </Text>
            <Text style={styles.valeurNegative}>
              -{formaterFCFA(quotePartEcrasage)}
            </Text>
          </View>
          <View style={styles.ligne}>
            <Text style={styles.libelleLigne}>
              Charges spécifiques machines
            </Text>
            <Text style={styles.valeurNegative}>
              -{formaterFCFA(chargesSpecifiquesTotal)}
            </Text>
          </View>
          <View style={styles.ligne}>
            <Text style={styles.libelleLigne}>Amortissement machines</Text>
            <Text style={styles.valeurNegative}>
              -{formaterFCFA(amortissementTotal)}
            </Text>
          </View>
          <View style={styles.ligneTotal}>
            <Text style={styles.libelleTotal}>Bénéfice Écrasage</Text>
            <Text style={styles.valeurTotal}>
              {formaterFCFA(beneficeEcrasage)}
            </Text>
          </View>
        </View>

        <Text style={styles.titreSection}>BOIS (hors bénéfice net)</Text>
        <View style={styles.bloc}>
          <View style={styles.ligne}>
            <Text style={styles.libelleLigne}>Chiffre d'affaires vendu</Text>
            <Text style={styles.valeurLigne}>{formaterFCFA(caBois)}</Text>
          </View>
        </View>

        <View style={styles.rangeeSwitch}>
          <Text style={styles.labelSwitch}>
            Inclure le salaire simulé du gérant
          </Text>
          <Switch
            value={inclureSimulable}
            onValueChange={setInclureSimulable}
            trackColor={{ true: theme.colors.primary }}
          />
        </View>

        <View style={styles.carteResultatFinal}>
          <Text style={styles.labelResultatFinal}>
            BÉNÉFICE NET RÉEL (Boutique + Écrasage)
          </Text>
          <Text style={styles.montantResultatFinal}>
            {chargement ? "..." : formaterFCFA(beneficeNetTotal)}
          </Text>
        </View>
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
  lienActivite: {
    color: theme.colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },
  titreSection: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
  },
  bloc: { gap: 6 },
  ligne: { flexDirection: "row", justifyContent: "space-between" },
  libelleLigne: { fontSize: 14, color: theme.colors.textMain, flex: 1 },
  valeurLigne: {
    fontSize: 14,
    color: theme.colors.textMain,
    fontWeight: "600",
  },
  valeurNegative: {
    fontSize: 14,
    color: theme.colors.redDanger,
    fontWeight: "600",
  },
  ligneTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  libelleTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textMain,
  },
  valeurTotal: { fontSize: 14, fontWeight: "700", color: theme.colors.primary },
  rangeeSwitch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  labelSwitch: { flex: 1, fontSize: 14, color: theme.colors.textMain },
  carteResultatFinal: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.borderRadiusCard,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  labelResultatFinal: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  montantResultatFinal: {
    fontSize: theme.typography.heroSize,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginTop: 8,
  },
});
