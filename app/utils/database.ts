import AsyncStorage from "@react-native-async-storage/async-storage";
import SQLiteModule from "expo-sqlite";
import { Platform } from "react-native";

interface StockItem {
	id?: number;
	name: string;
	category: string;
	price: number;
	stock: number;
	lowStock: boolean;
}

let db: any = null;

if (Platform.OS === "web") {
	// Fallback implementation for web using AsyncStorage
	db = {
		transaction: (callback: any) => {
			const tx = {
				executeSql: async (
					sql: string,
					params: any[],
					success: (tx: any, result: any) => void,
					error: (tx: any, err: any) => boolean
				) => {
					try {
						// Simple mock for SELECT * FROM stock_items
						if (sql.startsWith("SELECT")) {
							const data = await AsyncStorage.getItem("stock_items");
							const items = data ? JSON.parse(data) : [];
							success(tx, { rows: { _array: items } });
						} else if (sql.startsWith("CREATE")) {
							// No-op for create table
							success(tx, {});
						} else if (sql.startsWith("INSERT")) {
							const data = await AsyncStorage.getItem("stock_items");
							const items = data ? JSON.parse(data) : [];
							const newItem = {
								id: Date.now(),
								name: params[0],
								category: params[1],
								price: params[2],
								stock: params[3],
								lowStock: params[4] === 1,
							};
							items.push(newItem);
							await AsyncStorage.setItem("stock_items", JSON.stringify(items));
							success(tx, { insertId: newItem.id });
						} else if (sql.startsWith("UPDATE")) {
							const data = await AsyncStorage.getItem("stock_items");
							let items = data ? JSON.parse(data) : [];
							const id = params[5];
							items = items.map((item: any) =>
								item.id === id
									? {
											...item,
											name: params[0],
											category: params[1],
											price: params[2],
											stock: params[3],
											lowStock: params[4] === 1,
									  }
									: item
							);
							await AsyncStorage.setItem("stock_items", JSON.stringify(items));
							success(tx, {});
						} else if (sql.startsWith("DELETE")) {
							const data = await AsyncStorage.getItem("stock_items");
							let items = data ? JSON.parse(data) : [];
							const id = params[0];
							items = items.filter((item: any) => item.id !== id);
							await AsyncStorage.setItem("stock_items", JSON.stringify(items));
							success(tx, {});
						} else {
							success(tx, {});
						}
					} catch (err) {
						error(tx, err);
					}
				},
			};
			callback(tx);
		},
	};
} else {
	const SQLite = SQLiteModule as any;
	db = SQLite.openDatabase("MainDB.db");
}

export const initDB = (): Promise<void> => {
	return new Promise((resolve, reject) => {
		db.transaction((tx: any) => {
			tx.executeSql(
				`CREATE TABLE IF NOT EXISTS stock_items (
          id INTEGER PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          price INTEGER NOT NULL,
          stock INTEGER NOT NULL,
          lowStock INTEGER NOT NULL
        );`,
				[],
				() => resolve(),
				(_: any, err: any): boolean => {
					reject(err);
					return false;
				}
			);
		});
	});
};

export const getStockItems = (): Promise<StockItem[]> => {
	return new Promise((resolve, reject) => {
		db.transaction((tx: any) => {
			tx.executeSql(
				"SELECT * FROM stock_items;",
				[],
				(_: any, result: any) => {
					resolve(result.rows._array);
				},
				(_: any, err: any): boolean => {
					reject(err);
					return false;
				}
			);
		});
	});
};

export const insertStockItem = (item: StockItem): Promise<any> => {
	const { name, category, price, stock, lowStock } = item;
	return new Promise((resolve, reject) => {
		db.transaction((tx: any) => {
			tx.executeSql(
				`INSERT INTO stock_items (name, category, price, stock, lowStock) VALUES (?, ?, ?, ?, ?);`,
				[name, category, price, stock, lowStock ? 1 : 0],
				(_: any, result: any) => resolve(result),
				(_: any, err: any): boolean => {
					reject(err);
					return false;
				}
			);
		});
	});
};

export const updateStockItem = (item: StockItem): Promise<any> => {
	const { id, name, category, price, stock, lowStock } = item;
	return new Promise((resolve, reject) => {
		db.transaction((tx: any) => {
			tx.executeSql(
				`UPDATE stock_items SET name = ?, category = ?, price = ?, stock = ?, lowStock = ? WHERE id = ?;`,
				[name, category, price, stock, lowStock ? 1 : 0, id],
				(_: any, result: any) => resolve(result),
				(_: any, err: any): boolean => {
					reject(err);
					return false;
				}
			);
		});
	});
};

export const deleteStockItem = (id: number): Promise<any> => {
	return new Promise((resolve, reject) => {
		db.transaction((tx: any) => {
			tx.executeSql(
				`DELETE FROM stock_items WHERE id = ?;`,
				[id],
				(_: any, result: any) => resolve(result),
				(_: any, err: any): boolean => {
					reject(err);
					return false;
				}
			);
		});
	});
};
