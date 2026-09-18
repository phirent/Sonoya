import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDatabase } from "../src/database";
import { theme } from "../src/theme";
import type { Lot } from "../src/database/types";

type ProduitAvecStock = {
  id: string;
  nom: string;
  type: "kg" | "sac_kg";
  poidsSac: number | null;
  stockTotal: number;
  derniereEntree: string | null;
};

const formaterDate = (iso: string | null) => {
  if (!iso) return "Jamais réapprovisionné";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ProduitsScreen() {
  const [produits, setProduits] = useState<ProduitAvecStock[]>([]);
  const [rafraichissement, setRafraichissement] = useState(false);

  const charger = async () => {
    const db = await getDatabase();
    const resultats = await db.getAllAsync<ProduitAvecStock>(`
      SELECT
        p.id, p.nom, p.type, p.poidsSac,
        COALESCE(SUM(l.quantiteRestante), 0) AS stockTotal,
        MAX(l.dateEntree) AS derniereEntree
      FROM produits p
      LEFT JOIN lots l ON l.produitId = p.id
      GROUP BY p.id
      ORDER BY p.nom ASC
    `);
    setProduits(resultats);
  };

  useEffect(() => {
    charger();
  }, []);

  const rafraichir = async () => {
    setRafraichissement(true);
    await charger();
    setRafraichissement(false);
  };

  const detacherSac = async (produit: ProduitAvecStock) => {
    const db = await getDatabase();

    const lot = await db.getFirstAsync<Lot>(
      `SELECT * FROM lots WHERE produitId = ? AND quantiteRestante > 0 ORDER BY dateEntree ASC LIMIT 1`,
      [produit.id],
    );

    if (!lot) {
      Alert.alert("Stock épuisé", "Aucun sac disponible pour ce produit.");
      return;
    }

    const poidsSac = produit.poidsSac ?? 1;
    const nouveauPrixKg = lot.prixAchatUnitaire / poidsSac;
    const nouvelId = `lot_${Date.now()}`;

    await db.runAsync(
      `UPDATE lots SET quantiteRestante = quantiteRestante - 1 WHERE id = ?`,
      [lot.id],
    );

    await db.runAsync(
      `INSERT INTO lots (id, produitId, dateEntree, quantiteInitiale, quantiteRestante, prixAchatUnitaire)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nouvelId,
        produit.id,
        new Date().toISOString(),
        poidsSac,
        poidsSac,
        nouveauPrixKg,
      ],
    );

    Alert.alert(
      "Sac détaché",
      `${poidsSac}kg disponibles au détail pour ${produit.nom}.`,
    );
    charger();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={rafraichissement}
            onRefresh={rafraichir}
          />
        }
      >
        {produits.length === 0 ? (
          <Text style={styles.texteVide}>Aucun produit créé.</Text>
        ) : (
          produits.map((p) => (
            <View key={p.id} style={styles.carte}>
              <View style={styles.enteteCarte}>
                <Text style={styles.nomProduit}>{p.nom}</Text>
                <View style={styles.badge}>
                  <Text style={styles.texteBadge}>
                    {p.type === "sac_kg" ? `Sac (${p.poidsSac}kg)` : "Au kg"}
                  </Text>
                </View>
              </View>
              <View style={styles.ligneInfo}>
                <Text style={styles.labelInfo}>Stock actuel</Text>
                <Text style={styles.valeurStock}>
                  {p.stockTotal} {p.type === "sac_kg" ? "sac(s)" : "kg"}
                </Text>
              </View>
              <View style={styles.ligneInfo}>
                <Text style={styles.labelInfo}>Dernier réappro</Text>
                <Text style={styles.valeurDate}>
                  {formaterDate(p.derniereEntree)}
                </Text>
              </View>

              {p.type === "sac_kg" && p.stockTotal > 0 && (
                <TouchableOpacity
                  style={styles.boutonDetacher}
                  onPress={() => detacherSac(p)}
                >
                  <Text style={styles.texteBoutonDetacher}>
                    Détacher un sac
                  </Text>
                </TouchableOpacity>
              )}
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
  texteVide: {
    color: theme.colors.textMuted,
    fontStyle: "italic",
    marginTop: 20,
    textAlign: "center",
  },
  carte: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.borderRadiusCard,
    padding: 16,
    marginBottom: 14,
  },
  enteteCarte: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  nomProduit: { fontSize: 17, fontWeight: "700", color: theme.colors.textMain },
  badge: {
    backgroundColor: theme.colors.amberBg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  texteBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.amberAlert,
  },
  ligneInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  labelInfo: { fontSize: 13, color: theme.colors.textMuted },
  valeurStock: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMain,
  },
  valeurDate: { fontSize: 13, color: theme.colors.textMain },
  boutonDetacher: {
    marginTop: 12,
    backgroundColor: theme.colors.amberBg,
    borderRadius: theme.spacing.borderRadiusInput,
    paddingVertical: 10,
    alignItems: "center",
  },
  texteBoutonDetacher: {
    color: theme.colors.amberAlert,
    fontWeight: "600",
    fontSize: 13,
  },
});
