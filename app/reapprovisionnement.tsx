
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDatabase } from '../src/database';
import { theme } from '../src/theme';
import type { Produit } from '../src/database/types';

const BLEU_GOOGLE = '#1A73E8';

const formaterNombre = (valeur: string) => {
  const chiffresSeuls = valeur.replace(/\D/g, '');
  if (!chiffresSeuls) return '';
  return parseInt(chiffresSeuls, 10).toLocaleString('fr-FR');
};

export default function ReapprovisionnementScreen() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [produitId, setProduitId] = useState<string | null>(null);
  const [quantiteAchetee, setQuantiteAchetee] = useState('');
  const [prixAchatTotal, setPrixAchatTotal] = useState('');
  const [menuOuvert, setMenuOuvert] = useState(false);

  const chargerProduits = async () => {
    const db = await getDatabase();
    const resultats = await db.getAllAsync<Produit>(
      'SELECT * FROM produits'
    );

    setProduits(resultats);

    if (resultats.length > 0 && !produitId) {
      setProduitId(resultats[0].id);
    }
  };

  useEffect(() => {
    chargerProduits();
  }, []);

  const produit = produits.find((p) => p.id === produitId);

  const quantite = parseFloat(quantiteAchetee);
  const prixTotal = parseFloat(prixAchatTotal);

  const prixUnitaire =
    quantite > 0 && prixTotal > 0
      ? prixTotal / quantite
      : 0;

  const enregistrer = async () => {
    if (!produit) return;

    if (
      !quantiteAchetee ||
      !prixAchatTotal ||
      quantite <= 0 ||
      prixTotal <= 0
    ) {
      Alert.alert(
        'Champs invalides',
        'Renseigne une quantité et un prix valides.'
      );
      return;
    }

    const db = await getDatabase();
    const id = `lot_${Date.now()}`;

    await db.runAsync(
      `INSERT INTO lots (
        id,
        produitId,
        dateEntree,
        quantiteInitiale,
        quantiteRestante,
        prixAchatUnitaire
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        produit.id,
        new Date().toISOString(),
        quantite,
        quantite,
        prixUnitaire,
      ]
    );

    const unite =
      produit.type === 'sac_kg' ? 'sac(s)' : 'kg';

    Alert.alert(
      'Lot enregistré',
      `${quantite} ${unite} ajouté(s) au stock.`
    );

    setQuantiteAchetee('');
    setPrixAchatTotal('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          {produits.length === 0 ? (
            <View style={styles.etatVide}>
              <Text style={styles.texteVide}>
                Aucun produit encore créé.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Produit</Text>

              <TouchableOpacity
                style={styles.selecteur}
                onPress={() => setMenuOuvert(true)}
                activeOpacity={0.7}
              >
                <View style={styles.selecteurGauche}>
                  <View style={styles.iconeProduit}>
                    <Text style={styles.iconeTexte}>P</Text>
                  </View>

                  <View style={styles.selecteurTextes}>
                    <Text style={styles.nomProduit}>
                      {produit?.nom || 'Choisir un produit'}
                    </Text>
                    <Text style={styles.aideSelecteur}>
                      Produit sélectionné
                    </Text>
                  </View>
                </View>

                <Text style={styles.chevron}>⌄</Text>
              </TouchableOpacity>

              <Modal
                visible={menuOuvert}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuOuvert(false)}
              >
                <Pressable
                  style={styles.overlay}
                  onPress={() => setMenuOuvert(false)}
                >
                  <Pressable
                    style={styles.menu}
                    onPress={(event) => event.stopPropagation()}
                  >
                    <Text style={styles.menuTitre}>
                      Choisir un produit
                    </Text>

                    <ScrollView
                      style={styles.listeProduits}
                      keyboardShouldPersistTaps="handled"
                    >
                      {produits.map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          style={[
                            styles.optionProduit,
                            produitId === p.id &&
                              styles.optionActive,
                          ]}
                          onPress={() => {
                            setProduitId(p.id);
                            setMenuOuvert(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.optionTexte,
                              produitId === p.id &&
                                styles.optionTexteActive,
                            ]}
                          >
                            {p.nom}
                          </Text>

                          {produitId === p.id && (
                            <Text style={styles.coche}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </Pressable>
                </Pressable>
              </Modal>

              {produit && (
                <>
                  <View style={styles.section}>
                    <Text style={styles.label}>
                      {produit.type === 'sac_kg'
                        ? `Nombre de sacs achetés (${produit.poidsSac} kg/sac)`
                        : 'Quantité achetée (kg)'}
                    </Text>

                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={quantiteAchetee}
                      onChangeText={setQuantiteAchetee}
                      placeholder="0"
                      placeholderTextColor="#9AA0A6"
                    />
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>
                      Prix total payé (FCFA)
                    </Text>

                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={formaterNombre(prixAchatTotal)}
                      onChangeText={(texte) =>
                        setPrixAchatTotal(
                          texte.replace(/\D/g, '')
                        )
                      }
                      placeholder="0"
                      placeholderTextColor="#9AA0A6"
                    />
                  </View>

                  {prixUnitaire > 0 && (
                    <View style={styles.resume}>
                      <Text style={styles.resumeLabel}>
                        Prix d'achat unitaire
                      </Text>

                      <Text style={styles.resumePrix}>
                        {prixUnitaire.toLocaleString('fr-FR', {
                          maximumFractionDigits: 2,
                        })}{' '}
                        FCFA
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.boutonValider}
                    onPress={enregistrer}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.texteBouton}>
                      Enregistrer le lot
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
  },

  flex: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 24,
    paddingBottom: 40,
  },

  entete: {
    marginBottom: 32,
  },

  titre: {
    fontSize: 28,
    fontWeight: '700',
    color: '#202124',
    letterSpacing: -0.6,
  },

  sousTitre: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 6,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5F6368',
    marginBottom: 10,
  },

  selecteur: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  selecteurGauche: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconeProduit: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  iconeTexte: {
    color: BLEU_GOOGLE,
    fontSize: 18,
    fontWeight: '700',
  },

  selecteurTextes: {
    flex: 1,
  },

  nomProduit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
  },

  aideSelecteur: {
    fontSize: 12,
    color: '#9AA0A6',
    marginTop: 3,
  },

  chevron: {
    fontSize: 24,
    color: '#5F6368',
    marginLeft: 10,
  },

  section: {
    marginBottom: 24,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 22,
    fontWeight: '600',
    color: '#202124',
    textAlign: 'right',
  },

  resume: {
    backgroundColor: '#E8F0FE',
    borderRadius: 16,
    padding: 18,
    marginTop: 4,
    marginBottom: 28,
  },

  resumeLabel: {
    fontSize: 13,
    color: '#5F6368',
    marginBottom: 6,
  },

  resumePrix: {
    fontSize: 23,
    fontWeight: '700',
    color: '#1A73E8',
  },

  boutonValider: {
    backgroundColor: BLEU_GOOGLE,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 4,
  },

  texteBouton: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  etatVide: {
    paddingVertical: 20,
  },

  texteVide: {
    color: '#6B7280',
    fontStyle: 'italic',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },

  menu: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
  },

  menuTitre: {
    fontSize: 20,
    fontWeight: '700',
    color: '#202124',
    marginBottom: 18,
  },

  listeProduits: {
    marginBottom: 8,
  },

  optionProduit: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  optionActive: {
    backgroundColor: '#E8F0FE',
  },

  optionTexte: {
    fontSize: 16,
    color: '#202124',
  },

  optionTexteActive: {
    color: BLEU_GOOGLE,
    fontWeight: '600',
  },

  coche: {
    color: BLEU_GOOGLE,
    fontSize: 20,
    fontWeight: '700',
  },
});