// screens/logScreen.tsx
import {
	NavigationProp,
	useIsFocused,
	useNavigation,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
	Alert,
	Dimensions,
	FlatList,
	Modal,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import {
	CombinedLogEntry,
	getLogEntries,
	getTransactionDetailsById,
	LogEntry,
	TransactionDetails,
	TransactionLogEntry,
} from "../database";
import { RootStackParamList } from "./StockStack";

const { width } = Dimensions.get("window");

type LogScreenNavigationProp = NavigationProp<RootStackParamList, "LogScreen">;

// Define a new type for grouped mutation entries
interface GroupedMutationEntry {
	type: "groupedMutation";
	timestamp: string;
	entries: LogEntry[];
	id: string; // Add an ID for keyExtractor
}

type DisplayLogEntry = CombinedLogEntry | GroupedMutationEntry;

export default function LogScreen() {
	const [logEntries, setLogEntries] = useState<DisplayLogEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [isMutationDetailModalVisible, setMutationDetailModalVisible] =
		useState(false);
	const [selectedMutationGroupDetails, setSelectedMutationGroupDetails] =
		useState<GroupedMutationEntry | null>(null);

	const [filterType, setFilterType] = useState<
		"all" | "mutation_in" | "mutation_out" | "transaction"
	>("all");
	const navigation = useNavigation<LogScreenNavigationProp>();
	const isFocused = useIsFocused();

	const groupAndSortLogs = (logs: CombinedLogEntry[]) => {
		const groupedLogs: { [key: string]: DisplayLogEntry } = {};
		const transactionTimestamps = new Set<string>();

		// First pass: Identify transaction timestamps (with 1-second precision)
		logs.forEach((log) => {
			if (log.type === "transaction") {
				// Use floor to ensure consistent grouping for timestamps, e.g., 2024-01-01T10:30:00.123 and 2024-01-01T10:30:00.456 are treated as same second
				const transactionTimeKey = Math.floor(new Date(log.timestamp).getTime() / 1000) * 1000;
				transactionTimestamps.add(transactionTimeKey.toString());
				groupedLogs[transactionTimeKey.toString()] = log; // Add transaction directly
			}
		});

		// Second pass: Group mutations, skipping those that match a transaction timestamp
		logs.forEach((log) => {
			if (log.type === "mutation") {
				const mutationTimeKey = Math.floor(new Date(log.timestamp).getTime() / 1000) * 1000;

				// Only process if this mutation's timestamp does NOT match a transaction timestamp
				// AND it's an 'outgoing' mutation (jumlah_mutasi < 0)
				// If it's an 'incoming' mutation, it should always be displayed as it's not directly related to a sale.
				if (transactionTimestamps.has(mutationTimeKey.toString()) && log.jumlah_mutasi < 0) {
					// This is an outgoing mutation directly related to a transaction, hide it.
					return;
				}

				// If it's not linked to a transaction or it's an incoming mutation, group it normally.
				const timestampKey = new Date(log.timestamp).toISOString().split('.')[0]; // Group by second for display consistency
				if (!groupedLogs[timestampKey] || groupedLogs[timestampKey].type !== "groupedMutation") {
					groupedLogs[timestampKey] = {
						type: "groupedMutation",
						timestamp: log.timestamp,
						entries: [],
						id: `grouped-${timestampKey}-${Math.random().toString(36).substr(2, 9)}`,
					};
				}
				(groupedLogs[timestampKey] as GroupedMutationEntry).entries.push(log);
			}
		});

		const result: DisplayLogEntry[] = Object.values(groupedLogs).sort((a, b) => {
			const dateA = new Date(a.timestamp).getTime();
			const dateB = new Date(b.timestamp).getTime();
			return dateB - dateA;
		});

		return result;
	};


	const fetchLogs = useCallback(async () => {
		try {
			setLoading(true);
			const logs = await getLogEntries();
			const processedLogs = groupAndSortLogs(logs);
			setLogEntries(processedLogs);
		} catch (error) {
			Alert.alert("Error", "Gagal memuat log.");
			console.error("Error fetching log entries:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchLogs();
	}, []);

	useEffect(() => {
		if (isFocused) fetchLogs();
	}, [isFocused]);

	const handleSortByDate = () => {
		const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
		setSortOrder(newSortOrder);
		const sorted = [...logEntries].sort((a, b) => {
			const dateA = new Date(a.timestamp).getTime();
			const dateB = new Date(b.timestamp).getTime();
			return newSortOrder === "asc" ? dateA - dateB : dateB - dateA;
		});
		setLogEntries(sorted);
	};

	const handleFilterType = (type: "all" | "mutation_in" | "mutation_out" | "transaction") => {
		setFilterType(type);
	};

	const filteredLogEntries = logEntries.filter((log) => {
		if (filterType === "all") {
			return true;
		}
		if (log.type === "transaction") {
			return filterType === "transaction";
		}
		if (log.type === "groupedMutation") {
			const groupedMutations = log as GroupedMutationEntry;
			if (filterType === "mutation_in") {
				return groupedMutations.entries.some(entry => entry.jumlah_mutasi > 0);
			}
			if (filterType === "mutation_out") {
				return groupedMutations.entries.some(entry => entry.jumlah_mutasi < 0);
			}
		}
		return false;
	});

	const handleLogPress = async (log: DisplayLogEntry) => {
		if (log.type === "transaction") {
			try {
				const transactionDetails = await getTransactionDetailsById(log.id);
				if (transactionDetails) {
					navigation.navigate("ReceiptScreen", {
						transactionDetails,
						fromLogScreen: true,
					});
				} else {
					Alert.alert("Error", "Detail transaksi tidak ditemukan.");
				}
			} catch (error) {
				console.error("Error:", error);
				Alert.alert("Error", "Gagal memuat detail transaksi.");
			}
		} else if (log.type === "groupedMutation") {
			setSelectedMutationGroupDetails(log);
			setMutationDetailModalVisible(true);
		}
	};

	const renderLogItem = ({ item }: { item: DisplayLogEntry }) => {
		const formattedDate = new Date(item.timestamp).toLocaleString("id-ID", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
		let descriptionContent;
		let typeColor = "#b0b3b8";
		let typeText = "";

		if (item.type === "groupedMutation") {
			const log = item as GroupedMutationEntry;
			typeText = "Mutasi";

			const hasIncoming = log.entries.some(entry => entry.jumlah_mutasi > 0);
			const hasOutgoing = log.entries.some(entry => entry.jumlah_mutasi < 0);

			if (hasIncoming && !hasOutgoing) {
				typeColor = "#4CAF50";
			} else if (!hasIncoming && hasOutgoing) {
				typeColor = "#FF5722";
			} else if (hasIncoming && hasOutgoing) {
				typeColor = "#FFA500";
			}

			descriptionContent = (
				<View>
					<Text style={[styles.rowData, { fontWeight: 'bold', color: typeColor }]}>
						Mutasi Barang {hasIncoming && hasOutgoing ? "Masuk/Keluar" : hasIncoming ? "Masuk" : "Keluar"}:
					</Text>
					{log.entries.map((entry, index) => (
						<Text
							key={`${entry.id}-${index}`}
							style={[
								styles.rowData,
								{
									color: entry.jumlah_mutasi > 0 ? "#4CAF50" : "#FF5722",
									marginLeft: 10,
								},
							]}
						>
							- {entry.nama_barang} x {Math.abs(entry.jumlah_mutasi)} ({entry.sku})
						</Text>
					))}
				</View>
			);
		} else { // item.type === "transaction"
			const log = item as TransactionLogEntry;
			const details: TransactionDetails = JSON.parse(
				log.transaction_details_json
			);
			typeColor = "#00d4ff";
			typeText = "Transaksi";

			descriptionContent = (
				<View>
					<Text style={[styles.rowData, { fontWeight: 'bold', color: typeColor }]}>
						Transaksi Penjualan:
					</Text>
					{details.items.map((itemSold, index) => (
						<Text
							key={`${log.id}-item-${index}`}
							style={[styles.rowData, { marginLeft: 10 }]}
						>
							- {itemSold.nama_barang} x {itemSold.quantity} ({itemSold.sku})
						</Text>
					))}
					<Text style={[styles.rowData, { marginTop: 5, fontWeight: 'bold' }]}>
						(Total: Rp{details.totalPrice.toLocaleString("id-ID")})
					</Text>
				</View>
			);
		}

		return (
			<TouchableOpacity
				style={styles.tableRow}
				onPress={() => handleLogPress(item)}
			>
				<Text style={[styles.rowData, styles.dateColumn]}>{formattedDate}</Text>
				<View style={styles.descriptionColumn}>
					{descriptionContent}
				</View>
				<Text style={[styles.rowData, styles.typeColumn, { color: typeColor }]}>
					{typeText}
				</Text>
			</TouchableOpacity>
		);
	};

	const createAndSharePdf = async () => {
		Alert.alert(
			"Fitur belum aktif",
			"Fitur cetak log PDF akan tersedia pada rilis berikutnya."
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
			<LinearGradient
				colors={["#f8fafc", "#e2e8f0", "#cbd5e1"]}
				style={styles.gradient}
			>
				<View style={styles.floatingElement1} />
				<View style={styles.floatingElement2} />
				<View style={styles.floatingElement3} />
				<View style={styles.scrollViewContent}>
					<View style={[styles.header, styles.liquidGlass]}>
						<Text style={styles.title}>Log Barang & Transaksi</Text>
						<Text style={styles.subtitle}>Riwayat mutasi dan penjualan</Text>
						<TouchableOpacity
							onPress={createAndSharePdf}
							style={styles.printButton}
						>
							<Text style={styles.printButtonText}>Cetak Log (PDF)</Text>
						</TouchableOpacity>
					</View>

					<View style={[styles.listContainer, styles.liquidGlass]}>
						<View style={styles.tableHeader}>
							<TouchableOpacity
								onPress={handleSortByDate}
								style={styles.headerColumn}
							>
								<Text style={styles.headerText}>
									Tanggal {sortOrder === "asc" ? "▲" : "▼"}
								</Text>
							</TouchableOpacity>
							<View style={styles.headerColumn}>
								<Text style={styles.headerText}>Deskripsi</Text>
							</View>
							<TouchableOpacity
								onPress={() => {
									if (filterType === "all") {
										handleFilterType("mutation_in");
									} else if (filterType === "mutation_in") {
										handleFilterType("mutation_out");
									} else if (filterType === "mutation_out") {
										handleFilterType("transaction");
									} else {
										handleFilterType("all");
									}
								}}
								style={styles.headerColumn}
							>
								<Text style={styles.headerText}>
									Tipe{" "}
									{filterType === "all"
										? "(Semua)"
										: filterType === "mutation_in"
										? "(Mutasi Masuk)"
										: filterType === "mutation_out"
										? "(Mutasi Keluar)"
										: "(Transaksi)"}
								</Text>
							</TouchableOpacity>
						</View>
						<FlatList
							contentContainerStyle={{ paddingBottom: 80 }}
							data={filteredLogEntries}
							renderItem={renderLogItem}
							keyExtractor={(item) =>
								item.type === "groupedMutation" ? item.id : `${item.type}-${item.id}-${item.timestamp}`
							}
							ListEmptyComponent={
								<Text style={{ textAlign: "center", marginVertical: 20 }}>
									Tidak ada log.
								</Text>
							}
						/>
					</View>
				</View>
			</LinearGradient>

			<Modal
				animationType="slide"
				transparent
				visible={isMutationDetailModalVisible}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.mutationDetailModalContainer}>
						<Text style={styles.mutationDetailModalTitle}>Detail Mutasi Grup</Text>
						{selectedMutationGroupDetails && (
							<>
								<Text style={styles.mutationDetailText}>
									Tanggal:{" "}
									{new Date(selectedMutationGroupDetails.timestamp).toLocaleString(
										"id-ID"
									)}
								</Text>
								{selectedMutationGroupDetails.entries.map((entry, index) => (
									<View key={`${entry.id}-${index}-modal`} style={styles.mutationEntryModalItem}>
										<Text style={styles.mutationDetailText}>
											Nama Barang: {entry.nama_barang}
										</Text>
										<Text style={styles.mutationDetailText}>
											SKU: {entry.sku}
										</Text>
										<Text style={styles.mutationDetailText}>
											Jumlah Mutasi:{" "}
											<Text
												style={{
													color:
														entry.jumlah_mutasi > 0
															? "#4CAF50"
															: "#FF5722",
												}}
											>
												{entry.jumlah_mutasi > 0 ? "+" : ""}
												{entry.jumlah_mutasi}
											</Text>
										</Text>
									</View>
								))}
							</>
						)}
						<TouchableOpacity
							onPress={() => setMutationDetailModalVisible(false)}
							style={styles.closeModalButton}
						>
							<Text style={styles.closeModalButtonText}>Tutup</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#f8fafc" },
	gradient: { flex: 1 },
	floatingElement1: {
		position: "absolute",
		top: 100,
		right: -50,
		width: 200,
		height: 200,
		borderRadius: 100,
		backgroundColor: "rgba(59, 130, 246, 0.05)",
		zIndex: 0,
	},
	floatingElement2: {
		position: "absolute",
		top: 300,
		left: -80,
		width: 160,
		height: 160,
		borderRadius: 80,
		backgroundColor: "rgba(168, 85, 247, 0.05)",
		zIndex: 0,
	},
	floatingElement3: {
		position: "absolute",
		bottom: 200,
		right: -40,
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: "rgba(34, 197, 94, 0.05)",
		zIndex: 0,
	},
	scrollViewContent: {
		flexGrow: 1,
		paddingHorizontal: 20,
		paddingTop: (StatusBar.currentHeight || 0) + 20,
		paddingBottom: 40,
		zIndex: 1,
	},
	liquidGlass: {
		backgroundColor: "rgba(255, 255, 255, 0.25)",
		borderWidth: 1.5,
		borderColor: "rgba(255, 255, 255, 0.4)",
		shadowColor: "rgba(0, 0, 0, 0.1)",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.3,
		shadowRadius: 32,
		elevation: 8,
	},
	header: {
		backgroundColor: "rgba(255, 255, 255, 0.3)",
		borderRadius: 20,
		padding: 24,
		alignItems: "center",
		marginBottom: 24,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.5)",
	},
	title: { fontSize: 20, fontWeight: "700", color: "#1e293b" },
	subtitle: { fontSize: 14, color: "#64748b", marginBottom: 12 },
	printButton: {
		backgroundColor: "#3b82f6",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 12,
	},
	printButtonText: {
		color: "white",
		fontWeight: "700",
		fontSize: 14,
	},
	listContainer: { padding: 16, borderRadius: 16 },
	tableHeader: {
		flexDirection: "row",
		marginBottom: 10,
	},
	headerColumn: { flex: 1 },
	headerText: {
		fontWeight: "700",
		fontSize: 14,
		color: "#1e293b",
	},
	tableRow: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderColor: "#e2e8f0",
		paddingVertical: 8,
	},
	rowData: { fontSize: 13, paddingHorizontal: 4 },
	dateColumn: { flex: 1 },
	descriptionColumn: { flex: 2 },
	typeColumn: { flex: 1, textAlign: "center" },
	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.4)",
	},
	mutationDetailModalContainer: {
		backgroundColor: "white",
		padding: 20,
		borderRadius: 16,
		width: "80%",
		maxHeight: "80%",
		elevation: 10,
	},
	mutationDetailModalTitle: {
		fontSize: 18,
		fontWeight: "700",
		marginBottom: 12,
	},
	mutationDetailText: {
		fontSize: 14,
		marginBottom: 4,
	},
	mutationEntryModalItem: {
		borderBottomWidth: 1,
		borderColor: "#eee",
		paddingBottom: 8,
		marginBottom: 8,
	},
	closeModalButton: {
		marginTop: 12,
		backgroundColor: "#3b82f6",
		paddingVertical: 8,
		borderRadius: 8,
	},
	closeModalButtonText: {
		color: "white",
		textAlign: "center",
		fontWeight: "700",
	},
});