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

export default function LogScreen() {
	const [logEntries, setLogEntries] = useState<CombinedLogEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [isMutationDetailModalVisible, setMutationDetailModalVisible] =
		useState(false);
	const [selectedMutationDetails, setSelectedMutationDetails] =
		useState<LogEntry | null>(null);
	const navigation = useNavigation<LogScreenNavigationProp>();
	const isFocused = useIsFocused();

	const fetchLogs = useCallback(async () => {
		try {
			setLoading(true);
			const logs = await getLogEntries();
			const sortedLogs = [...logs].sort(
				(a, b) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
			);
			setLogEntries(sortedLogs);
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

	const handleLogPress = async (log: CombinedLogEntry) => {
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
		} else {
			setSelectedMutationDetails(log);
			setMutationDetailModalVisible(true);
		}
	};

	const renderLogItem = ({ item }: { item: CombinedLogEntry }) => {
		const formattedDate = new Date(item.timestamp).toLocaleString("id-ID", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
		let description = "";
		let typeColor = "#b0b3b8";

		if (item.type === "mutation") {
			const log = item as LogEntry;
			if (log.jumlah_mutasi > 0) {
				description = `Penambahan ${log.jumlah_mutasi} ${log.nama_barang} (${log.sku})`;
				typeColor = "#4CAF50";
			} else {
				description = `Pengurangan ${Math.abs(log.jumlah_mutasi)} ${
					log.nama_barang
				} (${log.sku})`;
				typeColor = "#FF5722";
			}
		} else {
			const log = item as TransactionLogEntry;
			const details: TransactionDetails = JSON.parse(
				log.transaction_details_json
			);
			description = `Transaksi Penjualan (Total: Rp${details.totalPrice.toLocaleString(
				"id-ID"
			)})`;
			typeColor = "#00d4ff";
		}

		return (
			<TouchableOpacity
				style={styles.tableRow}
				onPress={() => handleLogPress(item)}
			>
				<Text style={[styles.rowData, styles.dateColumn]}>{formattedDate}</Text>
				<Text
					style={[
						styles.rowData,
						styles.descriptionColumn,
						{ color: typeColor },
					]}
				>
					{description}
				</Text>
				<Text style={[styles.rowData, styles.typeColumn, { color: typeColor }]}>
					{item.type === "mutation" ? "Mutasi" : "Transaksi"}
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
							<View style={styles.headerColumn}>
								<Text style={styles.headerText}>Tipe</Text>
							</View>
						</View>
						<FlatList
							contentContainerStyle={{ paddingBottom: 80 }} // agar ada space bawah
							data={logEntries}
							renderItem={renderLogItem}
							keyExtractor={(item) =>
								`${item.type}-${item.id}-${item.timestamp}`
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

			{/* Modal Mutasi */}
			<Modal
				animationType="slide"
				transparent
				visible={isMutationDetailModalVisible}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.mutationDetailModalContainer}>
						<Text style={styles.mutationDetailModalTitle}>Detail Mutasi</Text>
						{selectedMutationDetails && (
							<>
								<Text style={styles.mutationDetailText}>
									Tanggal:{" "}
									{new Date(selectedMutationDetails.timestamp).toLocaleString(
										"id-ID"
									)}
								</Text>
								<Text style={styles.mutationDetailText}>
									Nama Barang: {selectedMutationDetails.nama_barang}
								</Text>
								<Text style={styles.mutationDetailText}>
									SKU: {selectedMutationDetails.sku}
								</Text>
								<Text style={styles.mutationDetailText}>
									Jumlah Mutasi:{" "}
									<Text
										style={{
											color:
												selectedMutationDetails.jumlah_mutasi > 0
													? "#4CAF50"
													: "#FF5722",
										}}
									>
										{selectedMutationDetails.jumlah_mutasi > 0 ? "+" : ""}
										{selectedMutationDetails.jumlah_mutasi}
									</Text>
								</Text>
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
		elevation: 10,
	},
	mutationDetailModalTitle: {
		fontSize: 18,
		fontWeight: "700",
		marginBottom: 12,
	},
	mutationDetailText: {
		fontSize: 14,
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
