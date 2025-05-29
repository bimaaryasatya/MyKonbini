import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("inventory.db");

// Tipe barang
export interface Barang {
	id: number;
	nama_barang: string;
	kategori: string;
	harga: number;
	stok: number;
}

// Inisialisasi tabel
export const initDB = async (): Promise<void> => {
	try {
		await db.execAsync(`
      CREATE TABLE IF NOT EXISTS barang (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_barang TEXT NOT NULL,
        kategori TEXT NOT NULL,
        harga INTEGER NOT NULL,
        stok INTEGER NOT NULL
      );
    `);
	} catch (error) {
		console.error("Error creating table:", error);
		throw error;
	}
};

// Tambah barang
export const addStock = async (
	nama_barang: string,
	kategori: string,
	harga: number,
	stok: number
): Promise<void> => {
	try {
		await db.runAsync(
			"INSERT INTO barang (nama_barang, kategori, harga, stok) VALUES (?, ?, ?, ?);",
			[nama_barang, kategori, harga, stok]
		);
	} catch (error) {
		console.error("Error insert:", error);
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

// Update barang
export const updateStock = async (
	id: number,
	nama_barang: string,
	kategori: string,
	harga: number,
	stok: number
): Promise<void> => {
	try {
		await db.runAsync(
			"UPDATE barang SET nama_barang = ?, kategori = ?, harga = ?, stok = ? WHERE id = ?;",
			[nama_barang, kategori, harga, stok, id]
		);
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
