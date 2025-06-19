// screens/logScreen.tsx
import {
	NavigationProp,
	useIsFocused,
	useNavigation,
} from "@react-navigation/native"; // Import NavigationProp
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useState } from "react";
import {
	Alert,
	Dimensions,
	FlatList,
	Modal, // Untuk modal detail mutasi
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import {
	CombinedLogEntry,
	getLogEntries, // Import TransactionDetails
	getTransactionDetailsById,
	LogEntry, // Import CombinedLogEntry
	TransactionDetails,
	TransactionLogEntry,
} from "../database"; // Import getLogEntries dan LogEntry interface
import { RootStackParamList } from "./StockStack"; // Import RootStackParamList
const { width } = Dimensions.get("window");

// Tipe untuk navigation prop
type LogScreenNavigationProp = NavigationProp<RootStackParamList, "LogScreen">;

export default function LogScreen() {
	const [logEntries, setLogEntries] = useState<CombinedLogEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // 'asc' for ascending, 'desc' for descending
	const navigation = useNavigation<LogScreenNavigationProp>(); // Type the navigation hook

	// State untuk modal detail mutasi
	const [isMutationDetailModalVisible, setMutationDetailModalVisible] =
		useState(false);
	const [selectedMutationDetails, setSelectedMutationDetails] =
		useState<LogEntry | null>(null);

	const fetchLogs = useCallback(async () => {
		try {
			setLoading(true);
			const logs = await getLogEntries();
			// Terapkan pengurutan awal berdasarkan timestamp (descending)
			const sortedLogs = [...logs].sort((a, b) => {
				const dateA = new Date(a.timestamp);
				const dateB = new Date(b.timestamp);
				return dateB.getTime() - dateA.getTime();
			});
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
	}, [fetchLogs]);

	const isFocused = useIsFocused();

	useEffect(() => {
		if (isFocused) {
			fetchLogs();
		}
	}, [isFocused]);

	const handleSortByDate = () => {
		const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
		setSortOrder(newSortOrder);
		const sortedLogs = [...logEntries].sort((a, b) => {
			const dateA = new Date(a.timestamp);
			const dateB = new Date(b.timestamp);
			if (newSortOrder === "asc") {
				return dateA.getTime() - dateB.getTime();
			} else {
				return dateB.getTime() - dateA.getTime();
			}
		});
		setLogEntries(sortedLogs);
	};

	const handleLogPress = async (log: CombinedLogEntry) => {
		if (log.type === "transaction") {
			// Jika log adalah transaksi, ambil detail lengkapnya dan navigasi ke ReceiptScreen
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
				console.error("Error navigating to receipt:", error);
				Alert.alert("Error", "Gagal memuat detail transaksi.");
			}
		} else {
			// Jika log adalah mutasi, tampilkan modal dengan detail mutasi
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
		let typeColor = "#b0b3b8"; // Default color

		if (item.type === "mutation") {
			const log = item as LogEntry;
			if (log.jumlah_mutasi > 0) {
				description = `Penambahan ${log.jumlah_mutasi} ${log.nama_barang} (${log.sku})`;
				typeColor = "#4CAF50"; // Green for addition
			} else {
				description = `Pengurangan ${Math.abs(log.jumlah_mutasi)} ${
					log.nama_barang
				} (${log.sku})`;
				typeColor = "#FF5722"; // Orange for deduction
			}
		} else if (item.type === "transaction") {
			const log = item as TransactionLogEntry;
			const details: TransactionDetails = JSON.parse(
				log.transaction_details_json
			);
			description = `Transaksi Penjualan (Total: Rp${details.totalPrice.toLocaleString(
				"id-ID"
			)})`;
			typeColor = "#00d4ff"; // Blue for transaction
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

	const generateLogHtml = (logs: CombinedLogEntry[]) => {
		let logRowsHtml = logs
			.map((log) => {
				const formattedDate = new Date(log.timestamp).toLocaleString("id-ID", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
					hour: "2-digit",
					minute: "2-digit",
				});

				let description = "";
				let type = "";
				let amount = "";

				if (log.type === "mutation") {
					const mutationLog = log as LogEntry;
					description = `${mutationLog.nama_barang} (${mutationLog.sku})`;
					type = mutationLog.jumlah_mutasi > 0 ? "Penambahan" : "Pengurangan";
					amount = String(mutationLog.jumlah_mutasi);
				} else if (log.type === "transaction") {
					const transactionLog = log as TransactionLogEntry;
					const details: TransactionDetails = JSON.parse(
						transactionLog.transaction_details_json
					);
					description = `Penjualan ${details.items.length} item`;
					type = "Transaksi";
					amount = `Rp${details.totalPrice.toLocaleString("id-ID")}`;
				}

				return `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px 0; text-align: left; font-size: 14px;">${formattedDate}</td>
            <td style="padding: 8px 0; text-align: left; font-size: 14px;">${description}</td>
            <td style="padding: 8px 0; text-align: center; font-size: 14px;">${type}</td>
            <td style="padding: 8px 0; text-align: right; font-size: 14px;">${amount}</td>
          </tr>
        `;
			})
			.join("");

		return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Log Barang</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f8f8; color: #333; }
          .container { width: 100%; max-width: 800px; margin: 0 auto; background-color: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
          h1 { text-align: center; color: #333; font-size: 24px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { text-align: left; padding: 10px; border: 1px solid #ddd; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .footer { text-align: center; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Log Barang dan Transaksi</h1>
          <table>
            <thead>
              <tr>
                <th style="width: 25%;">Tanggal</th>
                <th style="width: 40%;">Deskripsi</th>
                <th style="width: 15%; text-align: center;">Tipe</th>
                <th style="width: 20%; text-align: right;">Jumlah/Total</th>
              </tr>
            </thead>
            <tbody>
              ${logRowsHtml}
            </tbody>
          </table>
          <p class="footer">Laporan dibuat pada: ${new Date().toLocaleString(
						"id-ID"
					)}</p>
        </div>
      </body>
      </html>
    `;
	};

	const createAndSharePdf = async () => {
		try {
			const html = generateLogHtml(logEntries);
			const { uri } = await Print.printToFileAsync({ html });
			if (uri) {
				await Sharing.shareAsync(uri);
			}
		} catch (error) {
			Alert.alert("Error", "Gagal membuat atau membagikan PDF.");
			console.error("Error creating or sharing PDF:", error);
		}
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.loadingContainer}>
				<Text style={styles.loadingText}>Memuat Log...</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
			<View style={styles.header}>
				<Text style={styles.title}>Log Barang & Transaksi</Text>
				<Text style={styles.subtitle}>Riwayat mutasi dan penjualan</Text>
				<TouchableOpacity
					onPress={createAndSharePdf}
					style={styles.printButton}
				>
					<Text style={styles.printButtonText}>Cetak Log (PDF)</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.listContainer}>
				<View style={styles.table}>
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
						data={logEntries}
						renderItem={renderLogItem}
						keyExtractor={(item) => `${item.type}-${item.id}-${item.timestamp}`}
						ListEmptyComponent={
							<View style={styles.emptyListContainer}>
								<Text style={styles.emptyListText}>Tidak ada log.</Text>
							</View>
						}
					/>
				</View>
			</View>

			{/* Modal for Mutation Details */}
			<Modal
				animationType="slide"
				transparent={true}
				visible={isMutationDetailModalVisible}
				onRequestClose={() => setMutationDetailModalVisible(false)}
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
								<Text style={styles.mutationDetailText}>
									Tipe:{" "}
									{selectedMutationDetails.type === "mutation"
										? "Mutasi Stok"
										: ""}
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
	container: {
		flex: 1,
		backgroundColor: "#1a1a2e",
		paddingTop: StatusBar.currentHeight || 0,
		paddingBottom: 15 + (StatusBar.currentHeight || 0), // Add some space at the bottom
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#1a1a2e",
	},
	loadingText: {
		color: "white",
		fontSize: 18,
	},
	header: {
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0, 212, 255, 0.3)",
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
		color: "white",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		color: "#b0b3b8",
	},
	printButton: {
		backgroundColor: "#007bff",
		paddingVertical: 8,
		paddingHorizontal: 15,
		borderRadius: 5,
		marginTop: 15,
	},
	printButtonText: {
		color: "white",
		fontWeight: "bold",
	},
	listContainer: {
		flex: 1,
		paddingHorizontal: 16,
		paddingBottom: 20,
		marginTop: 16,
	},
	table: {
		flex: 1,
		backgroundColor: "rgba(255, 255, 255, 0.03)",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
		overflow: "hidden",
	},
	tableHeader: {
		flexDirection: "row",
		backgroundColor: "rgba(0, 212, 255, 0.1)",
		paddingVertical: 12,
		paddingHorizontal: 12,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0, 212, 255, 0.2)",
	},
	headerColumn: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 4,
	},
	headerText: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#00d4ff",
		textAlign: "center",
	},
	tableRow: {
		flexDirection: "row",
		paddingVertical: 12,
		paddingHorizontal: 12,
		alignItems: "center",
		minHeight: 50,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255, 255, 255, 0.08)",
	},
	rowData: {
		fontSize: 13,
		color: "white",
		textAlign: "center",
	},
	dateColumn: {
		flex: 1.2,
		textAlign: "left",
	},
	descriptionColumn: {
		flex: 2.5,
		textAlign: "left",
	},
	typeColumn: {
		flex: 0.8,
		textAlign: "center",
		fontWeight: "bold",
	},
	emptyListContainer: {
		padding: 20,
		alignItems: "center",
	},
	emptyListText: {
		color: "#b0b3b8",
		fontSize: 16,
		fontStyle: "italic",
	},
	// Styles for Mutation Detail Modal
	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.6)",
	},
	mutationDetailModalContainer: {
		backgroundColor: "#1e2a38",
		borderRadius: 15,
		padding: 25,
		width: "85%",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.3)",
	},
	mutationDetailModalTitle: {
		fontSize: 22,
		fontWeight: "bold",
		color: "#00d4ff",
		marginBottom: 15,
		textAlign: "center",
	},
	mutationDetailText: {
		fontSize: 16,
		color: "#b0b3b8",
		marginBottom: 8,
		textAlign: "center",
	},
	closeModalButton: {
		backgroundColor: "#007bff",
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		marginTop: 20,
	},
	closeModalButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
});
