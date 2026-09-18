import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async () => {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync('boutique.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS produits (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      type TEXT NOT NULL,
      poidsSac REAL
    );

CREATE TABLE IF NOT EXISTS lots (
  id TEXT PRIMARY KEY,
  produitId TEXT NOT NULL,
  dateEntree TEXT NOT NULL,
  quantiteInitiale REAL NOT NULL,
  quantiteRestante REAL NOT NULL,
  kgDetaches REAL NOT NULL DEFAULT 0,
  prixAchatUnitaire REAL NOT NULL,
  FOREIGN KEY (produitId) REFERENCES produits(id)
);

    CREATE TABLE IF NOT EXISTS ventes (
      id TEXT PRIMARY KEY,
      lotId TEXT NOT NULL,
      dateVente TEXT NOT NULL,
      quantite REAL NOT NULL,
      prixVenteUnitaire REAL NOT NULL,
      montantTotal REAL NOT NULL,
      margeCalculee REAL NOT NULL,
      FOREIGN KEY (lotId) REFERENCES lots(id)
    );

    CREATE TABLE IF NOT EXISTS ventesBois (
      id TEXT PRIMARY KEY,
      dateVente TEXT NOT NULL,
      montant REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS machines (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      coutAchatInitial REAL NOT NULL,
      dureeVieMois INTEGER NOT NULL,
      dateAcquisition TEXT NOT NULL,
      estActive INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS prestations (
      id TEXT PRIMARY KEY,
      machineId TEXT NOT NULL,
      datePrestation TEXT NOT NULL,
      montant REAL NOT NULL,
      FOREIGN KEY (machineId) REFERENCES machines(id)
    );

    CREATE TABLE IF NOT EXISTS charges (
      id TEXT PRIMARY KEY,
      dateCharge TEXT NOT NULL,
      libelle TEXT NOT NULL,
      montant REAL NOT NULL,
      typeCible TEXT NOT NULL,
      machineId TEXT,
      estSimulable INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (machineId) REFERENCES machines(id)
    );

    CREATE TABLE IF NOT EXISTS ajustements (
      id TEXT PRIMARY KEY,
      lotId TEXT NOT NULL,
      dateAjustement TEXT NOT NULL,
      quantiteRetiree REAL NOT NULL,
      motif TEXT NOT NULL,
      FOREIGN KEY (lotId) REFERENCES lots(id)
    );
  `);

  dbInstance = db;
  return dbInstance;
};