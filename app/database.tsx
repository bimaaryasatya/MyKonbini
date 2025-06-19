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

// Tipe entri log untuk penambahan/pengurangan barang (mutasi individual)
export interface LogEntry {
	id: number;
	nama_barang: string;
	sku: string;
	jumlah_mutasi: number; // Bisa positif (penambahan) atau negatif (pengurangan/penjualan dari stok)
	timestamp: string; // ISO 8601 string for datetime
	type: "mutation"; // Untuk membedakan di UI
}

// Tipe item dalam keranjang (untuk disimpan di log transaksi)
export interface CartItem extends Barang {
	quantity: number;
}

// Tipe detail transaksi (untuk disimpan di log transaksi)
export interface TransactionDetails {
	date: string;
	items: CartItem[];
	totalPrice: number;
	cashReceived: number;
	change: number;
}

// Tipe entri log untuk transaksi lengkap
export interface TransactionLogEntry {
	id: number;
	transaction_details_json: string; // Menyimpan JSON string dari TransactionDetails
	timestamp: string; // ISO 8601 string for datetime
	type: "transaction"; // Untuk membedakan di UI
}

// Tipe gabungan untuk menampilkan semua log
export type CombinedLogEntry = LogEntry | TransactionLogEntry;

// Inisialisasi tabel
export const initDB = async (): Promise<void> => {
	try {
		await db.execAsync(
			`
    CREATE TABLE IF NOT EXISTS barang (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_barang TEXT NOT NULL,
    sku TEXT NOT NULL,
    harga INTEGER NOT NULL,
    stok INTEGER NOT NULL
    );
  `.trim()
		); // Menambahkan .trim()

		// Tabel baru untuk log penambahan/pengurangan barang (mutasi individual)
		await db.execAsync(
			`
    CREATE TABLE IF NOT EXISTS log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_barang TEXT NOT NULL,
    sku TEXT NOT NULL,
    jumlah_mutasi INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    type TEXT NOT NULL
    );
  `.trim()
		); // Menambahkan .trim()

		// Tabel baru untuk log transaksi lengkap
		await db.execAsync(
			`
    CREATE TABLE IF NOT EXISTS transactions_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_details_json TEXT NOT NULL,
    timestamp TEXT NOT NULL
    );
  `.trim()
		); // Menambahkan .trim()
		console.log("All tables created or already exist."); // Pesan konfirmasi
	} catch (error) {
		console.error("Failed to initialize database:", error);
		throw error; // Penting untuk melempar error agar ditangani oleh pemanggil
	}
};

// Tambah barang baru atau update stok yang ada
export const addStock = async (
	nama_barang: string,
	sku: string,
	harga: number,
	stok: number
): Promise<void> => {
	try {
		const existingItem = await getItemBySku(sku);

		if (existingItem) {
			// Jika barang sudah ada, update stok dan log mutasi
			const newStok = existingItem.stok + stok;
			await db.runAsync(
				"UPDATE barang SET nama_barang = ?, harga = ?, stok = ? WHERE id = ?;",
				[nama_barang, harga, newStok, existingItem.id]
			);
			await addLogEntry(
				nama_barang,
				sku,
				stok, // jumlah_mutasi adalah jumlah penambahan
				new Date().toISOString(),
				"mutation"
			);
		} else {
			// Jika barang baru, masukkan sebagai item baru
			await db.runAsync(
				"INSERT INTO barang (nama_barang, sku, harga, stok) VALUES (?, ?, ?, ?);",
				[nama_barang, sku, harga, stok]
			);
			await addLogEntry(
				nama_barang,
				sku,
				stok, // jumlah_mutasi adalah jumlah penambahan
				new Date().toISOString(),
				"mutation"
			);
		}
	} catch (error) {
		console.error("Error adding/updating stock:", error);
		throw error;
	}
};

// Dapatkan semua barang
export const getAllStock = async (): Promise<Barang[]> => {
	try {
		const allRows = await db.getAllAsync<Barang>(
			"SELECT * FROM barang ORDER BY nama_barang ASC;"
		);
		return allRows;
	} catch (error) {
		console.error("Error fetching all stock:", error);
		throw error;
	}
};

// Update barang
export const updateStock = async (
	id: number,
	nama_barang: string,
	sku: string,
	harga: number,
	newStok: number // Parameter baru untuk stok yang sudah dihitung
): Promise<void> => {
	try {
		// Get the current stock value to calculate the difference for logging
		const currentItem = await db.getFirstAsync<Barang>(
			"SELECT stok FROM barang WHERE id = ?;",
			[id]
		);
		const oldStok = currentItem ? currentItem.stok : 0;
		const stockDifference = newStok - oldStok;

		await db.runAsync(
			"UPDATE barang SET nama_barang = ?, sku = ?, harga = ?, stok = ? WHERE id = ?;",
			[nama_barang, sku, harga, newStok, id]
		);

		// Log the stock change if there's a difference
		if (stockDifference !== 0) {
			await addLogEntry(
				nama_barang,
				sku,
				stockDifference,
				new Date().toISOString(),
				"mutation"
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
		const item = await db.getFirstAsync<Barang>(
			"SELECT * FROM barang WHERE sku = ?;",
			[sku]
		);
		return item || null;
	} catch (error) {
		console.error("Error fetching item by SKU:", error);
		throw error;
	}
};

// Log Mutasi (Penambahan/Pengurangan Stok Individual)
export const addLogEntry = async (
	nama_barang: string,
	sku: string,
	jumlah_mutasi: number,
	timestamp: string,
	type: "mutation" | "transaction" // Explicitly define type
): Promise<void> => {
	try {
		await db.runAsync(
			"INSERT INTO log (nama_barang, sku, jumlah_mutasi, timestamp, type) VALUES (?, ?, ?, ?, ?);",
			[nama_barang, sku, jumlah_mutasi, timestamp, type]
		);
	} catch (error) {
		console.error("Error adding log entry:", error);
		throw error;
	}
};

// Log Transaksi Lengkap
export const addTransactionLog = async (
	transactionDetails: TransactionDetails
): Promise<void> => {
	try {
		const transactionDetailsJson = JSON.stringify(transactionDetails);
		await db.runAsync(
			"INSERT INTO transactions_log (transaction_details_json, timestamp) VALUES (?, ?);",
			[transactionDetailsJson, new Date().toISOString()]
		);
	} catch (error) {
		console.error("Error adding transaction log:", error);
		throw error;
	}
};

// Mendapatkan semua entri log (mutasi dan transaksi)
export const getLogEntries = async (): Promise<CombinedLogEntry[]> => {
	try {
		const mutationLogs = await db.getAllAsync<LogEntry>(
			`SELECT id, nama_barang, sku, jumlah_mutasi, timestamp, 'mutation' AS type FROM log;`
		);
		const transactionLogs = await db.getAllAsync<TransactionLogEntry>(
			`SELECT id, transaction_details_json, timestamp, 'transaction' AS type FROM transactions_log;`
		);

		const combinedLogs: CombinedLogEntry[] = [
			...mutationLogs,
			...transactionLogs,
		];

		// Sort by timestamp in descending order (most recent first)
		combinedLogs.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
		);

		return combinedLogs;
	} catch (error) {
		console.error("Error fetching all log entries:", error);
		throw error;
	}
};

// Fungsi untuk mendapatkan data keuangan berdasarkan periode
export const getFinancialSummary = async (
	period: "weekly" | "monthly"
): Promise<number> => {
	try {
		const now = new Date();
		let startDate: Date;

		if (period === "weekly") {
			startDate = new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate() - now.getDay()
			); // Start of current week (Sunday)
		} else {
			startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month
		}

		const startDateISO = startDate.toISOString();

		const result = await db.getFirstAsync<{ total_income: number }>(
			`SELECT SUM(CAST(JSON_EXTRACT(transaction_details_json, '$.totalPrice') AS REAL)) AS total_income FROM transactions_log WHERE timestamp >= ?;`,
			[startDateISO]
		);

		return result?.total_income || 0;
	} catch (error) {
		console.error("Error fetching financial summary:", error);
		throw error;
	}
};

// Fungsi untuk mendapatkan total pengeluaran berdasarkan periode
export const getExpenditureSummary = async (
	period: "weekly" | "monthly"
): Promise<number> => {
	try {
		const now = new Date();
		let startDate: Date;

		if (period === "weekly") {
			startDate = new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate() - now.getDay()
			); // Start of current week (Sunday)
		} else {
			startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month
		}

		const startDateISO = startDate.toISOString();

		// Calculate total expenditure as sum of harga * jumlah_mutasi for positive mutations
		const result = await db.getFirstAsync<{ total_expenditure: number }>(
			`SELECT SUM(b.harga * l.jumlah_mutasi) AS total_expenditure
			FROM log l
			JOIN barang b ON l.sku = b.sku
			WHERE l.timestamp >= ? AND l.jumlah_mutasi > 0 AND l.type = 'mutation';`,
			[startDateISO]
		);

		return result?.total_expenditure || 0;
	} catch (error) {
		console.error("Error fetching expenditure summary:", error);
		throw error;
	}
};

// Fungsi untuk mendapatkan detail transaksi berdasarkan ID
export const getTransactionDetailsById = async (
	id: number
): Promise<TransactionDetails | null> => {
	try {
		const row = await db.getFirstAsync<{ transaction_details_json: string }>(
			"SELECT transaction_details_json FROM transactions_log WHERE id = ?;",
			[id]
		);
		if (row?.transaction_details_json) {
			return JSON.parse(row.transaction_details_json) as TransactionDetails;
		}
		return null;
	} catch (error) {
		console.error(`Error fetching transaction details for ID ${id}:`, error);
		throw error;
	}
};
