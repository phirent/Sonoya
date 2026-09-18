import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme';

type Action = {
  icone: keyof typeof Ionicons.glyphMap;
  titre: string;
  route: string;
  couleur: string;
};

const ACTIONS: Action[] = [
  { icone: 'cube-outline', titre: 'Réapprovisionnement', route: '/reapprovisionnement', couleur: theme.colors.primary },
  { icone: 'add-circle-outline', titre: 'Nouveau produit', route: '/produit', couleur: '#34C759' },
  { icone: 'wallet-outline', titre: 'Déclarer une charge', route: '/charge', couleur: theme.colors.redDanger },
  { icone: 'construct-outline', titre: 'Machines', route: '/machines', couleur: theme.colors.amberAlert },
  { icone: 'bar-chart-outline', titre: 'Rapports', route: '/rapports', couleur: '#5856D6' },
  { icone: 'list-outline', titre: 'Produits', route: '/produits', couleur: '#5856D6' },
   { icone: 'time-outline', titre: 'activite', route: '/activite', couleur: '#5856D6' },
];

export default function ParametresScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.grille}>
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.route}
            style={styles.carte}
            onPress={() => router.push(action.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.cercleIcone, { backgroundColor: action.couleur + '1A' }]}>
              <Ionicons name={action.icone} size={30} color={action.couleur} />
            </View>
            <Text style={styles.carteTitre}>{action.titre}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.paddingHorizontal, paddingTop: 12 },
  grille: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  carte: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cercleIcone: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  carteTitre: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMain,
    textAlign: 'center',
  },
});