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
import { getDatabase } from "../../src/database";
import { theme } from "../../src/theme";
import type { Produit, Lot } from "../../src/database/types";

interface ProduitAvecStock extends Produit {
  totalRestante: number;
  totalKgDetaches: number;
}

const formaterNombre = (valeur: string) => {
  const chiffresSeuls = valeur.replace(/\D/g, "");
  if (!chiffresSeuls) return "";
  return parseInt(chiffresSeuls, 10).toLocaleString("fr-FR");
};

export default function VenteScreen() {
  const [produits, setProduits] = useState<ProduitAvecStock[]>([]);
  const [produitSelectionneId, setProduitSelectionneId] = useState<
    string | null
  >(null);
  const [formatVente, setFormatVente] = useState<"sac" | "kg">("kg");
  const [quantite, setQuantite] = useState("");
  const [prixUnitaire, setPrixUnitaire] = useState("");

  const chargerProduits = async () => {
    const db = await getDatabase();
    const listeProduits = await db.getAllAsync<Produit>(
      "SELECT * FROM produits",
    );
    const stocks = await db.getAllAsync<{
      produitId: string;
      totalRestante: number;
      totalKgDetaches: number;
    }>(
      `SELECT produitId, SUM(quantiteRestante) as totalRestante, SUM(kgDetaches) as totalKgDetaches
       FROM lots GROUP BY produitId`,
    );
    const produitsAvecStock: ProduitAvecStock[] = listeProduits.map((p) => {
      const stock = stocks.find((s) => s.produitId === p.id);
      return {
        ...p,
        totalRestante: stock?.totalRestante ?? 0,
        totalKgDetaches: stock?.totalKgDetaches ?? 0,
      };
    });
    setProduits(produitsAvecStock);
  };

  useEffect(() => {
    chargerProduits();
  }, []);

  const produitSelectionne = produits.find(
    (p) => p.id === produitSelectionneId,
  );

  const selectionner = (p: ProduitAvecStock) => {
    setProduitSelectionneId(p.id);
    setFormatVente(p.type === "kg" ? "kg" : "sac");
    setQuantite("");
    setPrixUnitaire("");
  };

  const montantTotal =
    (parseFloat(quantite) || 0) *
    (parseFloat(prixUnitaire.replace(/\D/g, "")) || 0);

  const kgDisponibles = produitSelectionne?.totalKgDetaches ?? 0;
  const detachementNecessaire =
    produitSelectionne?.type === "sac_kg" &&
    formatVente === "kg" &&
    parseFloat(quantite) > kgDisponibles &&
    (produitSelectionne?.totalRestante ?? 0) > 0;

  const detacherSac = async () => {
    if (!produitSelectionne || produitSelectionne.type !== "sac_kg") return;

    const db = await getDatabase();

    const lot = await db.getFirstAsync<Lot>(
      `SELECT * FROM lots WHERE produitId = ? AND quantiteRestante > 0 ORDER BY dateEntree ASC`,
      [produitSelectionne.id],
    );

    if (!lot) {
      Alert.alert(
        "Aucun sac disponible",
        "Il n'y a plus de sac entier à détacher pour ce produit.",
      );
      return;
    }

    const poidsSac = produitSelectionne.poidsSac ?? 1;

    await db.runAsync(
      `UPDATE lots SET quantiteRestante = quantiteRestante - 1, kgDetaches = kgDetaches + ? WHERE id = ?`,
      [poidsSac, lot.id],
    );

    Alert.alert("Sac détaché", `1 sac transformé en ${poidsSac} kg de détail.`);
    chargerProduits();
  };

  const enregistrerVente = async () => {
    if (!produitSelectionne) return;

    const quantiteDemandee = parseFloat(quantite);
    const prix = parseFloat(prixUnitaire.replace(/\D/g, ""));

    if (!quantiteDemandee || !prix) {
      Alert.alert("Champs manquants", "Renseigne la quantité et le prix.");
      return;
    }

    const champASoustraire =
      formatVente === "sac"
        ? "quantiteRestante"
        : produitSelectionne.type === "sac_kg"
          ? "kgDetaches"
          : "quantiteRestante";

    const db = await getDatabase();
    const lots = await db.getAllAsync<Lot>(
      `SELECT * FROM lots WHERE produitId = ? AND ${champASoustraire} > 0 ORDER BY dateEntree ASC`,
      [produitSelectionne.id],
    );

    const stockDisponible = lots.reduce(
      (total, lot) => total + (lot[champASoustraire] as number),
      0,
    );
    if (stockDisponible < quantiteDemandee) {
      Alert.alert(
        "Stock insuffisant",
        `Seulement ${stockDisponible} disponible.`,
      );
      return;
    }

    let quantiteRestanteAVendre = quantiteDemandee;

    for (const lot of lots) {
      if (quantiteRestanteAVendre <= 0) break;

      const disponibleDansCeLot = lot[champASoustraire] as number;
      const quantitePriseDansCeLot = Math.min(
        disponibleDansCeLot,
        quantiteRestanteAVendre,
      );

      const coutUnitaireReel =
        formatVente === "kg" && produitSelectionne.type === "sac_kg"
          ? lot.prixAchatUnitaire / (produitSelectionne.poidsSac ?? 1)
          : lot.prixAchatUnitaire;

      const margeCalculee = (prix - coutUnitaireReel) * quantitePriseDansCeLot;
      const montantLigne = prix * quantitePriseDansCeLot;

      await db.runAsync(
        `INSERT INTO ventes (id, lotId, dateVente, quantite, prixVenteUnitaire, montantTotal, margeCalculee)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          `vente_${Date.now()}_${lot.id}`,
          lot.id,
          new Date().toISOString(),
          quantitePriseDansCeLot,
          prix,
          montantLigne,
          margeCalculee,
        ],
      );

      await db.runAsync(
        `UPDATE lots SET ${champASoustraire} = ? WHERE id = ?`,
        [disponibleDansCeLot - quantitePriseDansCeLot, lot.id],
      );

      quantiteRestanteAVendre -= quantitePriseDansCeLot;
    }

    Alert.alert(
      "Vente enregistrée",
      `${quantiteDemandee} ${formatVente === "sac" ? "sac(s)" : "kg"} vendus pour ${montantTotal.toLocaleString("fr-FR")} FCFA`,
    );
    setQuantite("");
    setPrixUnitaire("");
    chargerProduits();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.titre}>Vente</Text>
      <ScrollView>
        {produits.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.carte,
              produitSelectionneId === p.id && styles.carteActive,
            ]}
            onPress={() => selectionner(p)}
          >
            <Text style={styles.nomProduit}>{p.nom}</Text>
            <Text style={styles.stock}>
              {p.type === "kg"
                ? `${p.totalRestante} kg en stock`
                : `${p.totalRestante} sac(s) + ${p.totalKgDetaches} kg détail`}
            </Text>
          </TouchableOpacity>
        ))}

        {produitSelectionne && (
          <View style={styles.formulaire}>
            {produitSelectionne.type === "sac_kg" && (
              <>
                <Text style={styles.label}>Format de vente</Text>
                <View style={styles.rangeeTuiles}>
                  <TouchableOpacity
                    style={[
                      styles.tuile,
                      formatVente === "sac" && styles.tuileActive,
                    ]}
                    onPress={() => setFormatVente("sac")}
                  >
                    <Text
                      style={
                        formatVente === "sac"
                          ? styles.texteTuileActive
                          : styles.texteTuile
                      }
                    >
                      Sac entier
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tuile,
                      formatVente === "kg" && styles.tuileActive,
                    ]}
                    onPress={() => setFormatVente("kg")}
                  >
                    <Text
                      style={
                        formatVente === "kg"
                          ? styles.texteTuileActive
                          : styles.texteTuile
                      }
                    >
                      Au détail (kg)
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <Text style={styles.label}>
              {formatVente === "sac" ? "Nombre de sacs" : "Quantité (kg)"}
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={quantite}
              onChangeText={setQuantite}
              placeholder="0"
            />

            <Text style={styles.label}>
              Prix {formatVente === "sac" ? "par sac" : "par kg"} (FCFA)
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={formaterNombre(prixUnitaire)}
              onChangeText={(t) => setPrixUnitaire(t.replace(/\D/g, ""))}
              placeholder="0"
            />

            <View style={styles.carteTotal}>
              <Text style={styles.labelTotal}>MONTANT TOTAL</Text>
              <Text style={styles.montantTotal}>
                {montantTotal.toLocaleString("fr-FR")} FCFA
              </Text>
            </View>

            {detachementNecessaire && (
              <TouchableOpacity
                style={styles.boutonDetacher}
                onPress={detacherSac}
              >
                <Text style={styles.texteBoutonDetacher}>
                  ✂️ Stock détail insuffisant — détacher 1 sac (
                  {produitSelectionne.totalRestante} disponible(s))
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.boutonValider}
              onPress={enregistrerVente}
            >
              <Text style={styles.texteBouton}>Enregistrer la vente</Text>
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
  titre: {
    fontSize: theme.typography.screenTitleSize,
    fontWeight: "bold",
    color: theme.colors.textMain,
    marginBottom: 20,
  },
  carte: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.borderRadiusCard,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  carteActive: { borderColor: theme.colors.primary },
  nomProduit: { fontSize: 16, fontWeight: "600", color: theme.colors.textMain },
  stock: { fontSize: 14, color: theme.colors.textMuted, marginTop: 4 },
  formulaire: { marginTop: 8, marginBottom: 30 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginTop: 16,
    marginBottom: 8,
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
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.borderRadiusInput,
    padding: 14,
    fontSize: 20,
    textAlign: "right",
  },
  carteTotal: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.borderRadiusCard,
    padding: 20,
    alignItems: "center",
    marginTop: 20,
  },
  labelTotal: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  montantTotal: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginTop: 4,
  },
  boutonDetacher: {
    backgroundColor: theme.colors.amberBg,
    borderRadius: theme.spacing.borderRadiusInput,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.amberAlert,
  },
  texteBoutonDetacher: {
    color: theme.colors.amberAlert,
    fontWeight: "600",
    textAlign: "center",
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
