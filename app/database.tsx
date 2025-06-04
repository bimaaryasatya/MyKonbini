// database.tsx
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inventory.db");

// Tipe barang
export interface Barang {
  id: number;
  nama_barang: string;
  sku: string; // Mengganti 'kategori' dengan 'sku'
  harga: number;
  stok: number;
}

// Tipe entri log untuk penambahan barang
export interface LogEntry {
  id: number;
  nama_barang: string;
  sku: string;
  jumlah_ditambah: number;
  timestamp: string; // ISO 8601 string for datetime
}

// Inisialisasi tabel
export const initDB = async (): Promise<void> => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS barang (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_barang TEXT NOT NULL,
        sku TEXT NOT NULL, -- Mengganti 'kategori' dengan 'sku'
        harga INTEGER NOT NULL,
        stok INTEGER NOT NULL
      );
    `);
    // Tabel baru untuk log penambahan barang
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_barang TEXT NOT NULL,
        sku TEXT NOT NULL,
        jumlah_ditambah INTEGER NOT NULL,
        timestamp TEXT NOT NULL
      );
    `);
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
};

// Tambah barang
export const addStock = async (
  nama_barang: string,
  sku: string, // Mengganti 'kategori' dengan 'sku'
  harga: number,
  stok: number
): Promise<void> => {
  try {
    await db.runAsync(
      "INSERT INTO barang (nama_barang, sku, harga, stok) VALUES (?, ?, ?, ?);", // Mengganti 'kategori' dengan 'sku' di query
      [nama_barang, sku, harga, stok]
    );
    // Log the initial addition of stock
    await addLogEntry(nama_barang, sku, stok, new Date().toISOString());
  } catch (error) {
    console.error("Error insert:", error);
    throw error;
  }
};

// Tambah entri log
export const addLogEntry = async (
  nama_barang: string,
  sku: string,
  jumlah_ditambah: number,
  timestamp: string
): Promise<void> => {
  try {
    await db.runAsync(
      "INSERT INTO log (nama_barang, sku, jumlah_ditambah, timestamp) VALUES (?, ?, ?, ?);",
      [nama_barang, sku, jumlah_ditambah, timestamp]
    );
  } catch (error) {
    console.error("Error inserting log entry:", error);
    throw error;
  }
};

// Ambil semua barang
export const getAllStock = async (): Promise<Barang[]> => {
  try {
    const result = await db.getAllAsync<Barang>("SELECT * FROM barang;");
    return result;
  } catch (error) {
    console.error("Error fetch:", error);
    throw error;
  }
};

// Ambil semua entri log
export const getLogEntries = async (): Promise<LogEntry[]> => {
  try {
    // Mengambil log dan mengurutkannya berdasarkan timestamp terbaru
    const result = await db.getAllAsync<LogEntry>(
      "SELECT * FROM log ORDER BY timestamp DESC;"
    );
    return result;
  } catch (error) {
    console.error("Error fetching log entries:", error);
    throw error;
  }
};

// Update barang
export const updateStock = async (
  id: number,
  nama_barang: string,
  sku: string, // Mengganti 'kategori' dengan 'sku'
  harga: number,
  newStok: number // Renamed to newStok to avoid conflict
): Promise<void> => {
  try {
    // Get the current stock value to calculate the difference
    const currentItem = await db.getFirstAsync<Barang>(
      "SELECT stok FROM barang WHERE id = ?;",
      [id]
    );
    const oldStok = currentItem ? currentItem.stok : 0;
    const stockDifference = newStok - oldStok;

    await db.runAsync(
      "UPDATE barang SET nama_barang = ?, sku = ?, harga = ?, stok = ? WHERE id = ?;", // Mengganti 'kategori' dengan 'sku' di query
      [nama_barang, sku, harga, newStok, id]
    );

    // Log the stock change if there's a difference
    if (stockDifference !== 0) {
      await addLogEntry(
        nama_barang,
        sku,
        stockDifference,
        new Date().toISOString()
      );
    }
  } catch (error) {
    console.error("Error update:", error);
    throw error;
  }
};

// Hapus barang
export const deleteStock = async (id: number): Promise<void> => {
  try {
    await db.runAsync("DELETE FROM barang WHERE id = ?;", [id]);
  } catch (error) {
    console.error("Error delete:", error);
    throw error;
  }
};

export const getItemBySku = async (sku: string): Promise<Barang | null> => {
  try {
    const result = await db.getFirstAsync<Barang>(
      "SELECT * FROM barang WHERE sku = ?;",
      [sku]
    );
    return result || null;
  } catch (error) {
    console.error("Error fetching item by SKU:", error);
    throw error;
  }
};
