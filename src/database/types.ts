export interface Produit {
  id: string;
  nom: string;              // Ex: "Soja", "Son"
  type: 'kg' | 'sac_kg';    // 'kg' = toujours détaillé, 'sac_kg' = vendable en sac ou au kg
  poidsSac?: number;        // Ex: 40, uniquement rempli si type = 'sac_kg'
}

export interface Lot {
  id: string;
  produitId: string;
  dateEntree: string;
  quantiteInitiale: number;      // en sacs si sac_kg, en kg si kg
  quantiteRestante: number;      // sacs entiers restants
  kgDetaches: number;            // kg détachés de ce lot, pas encore vendus (0 par défaut)
  prixAchatUnitaire: number;     // prix par sac si sac_kg, par kg si kg
}

export interface Vente {
  id: string;
  lotId: string;
  dateVente: string;
  quantite: number;
  prixVenteUnitaire: number;    // Toujours saisi par le gérant, jamais pré-rempli
  montantTotal: number;         // quantite * prixVenteUnitaire
  margeCalculee: number;        // (prixVenteUnitaire - prixAchatUnitaire du lot) * quantite
}

export interface VenteBois {
  id: string;
  dateVente: string;
  montant: number;              // Aucune notion de quantité ni de coût d'achat
}

export interface Machine {
  id: string;
  nom: string;
  coutAchatInitial: number;
  dureeVieMois: number;
  dateAcquisition: string;
  estActive: boolean;
}

export interface Prestation {
  id: string;
  machineId: string;
  datePrestation: string;
  montant: number;
}

export interface Charge {
  id: string;
  dateCharge: string;
  libelle: string;
  montant: number;
  typeCible: 'COMMUNE' | 'SPECIFIQUE';
  machineId?: string;           // Rempli uniquement si typeCible = 'SPECIFIQUE'
  estSimulable: boolean;
}

export interface Ajustement {
  id: string;
  lotId: string;
  dateAjustement: string;
  quantiteRetiree: number;
  motif: string;
}