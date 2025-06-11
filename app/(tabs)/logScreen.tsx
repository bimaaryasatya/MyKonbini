// screens/LogScreen.tsx
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
	Alert,
	Dimensions,
	FlatList,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { getLogEntries, LogEntry } from "../database"; // Import getLogEntries and LogEntry interface

const { width } = Dimensions.get("window");

export default function LogScreen() {
	const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchLogs = async () => {
			try {
				const logs = await getLogEntries();
				setLogEntries(logs);
			} catch (error) {
				Alert.alert("Error", "Gagal memuat log.");
				console.error("Error fetching log entries:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchLogs();
	}, []);

	const generateLogHtml = (logs: LogEntry[]) => {
		let logRowsHtml = logs
			.map(
				(log) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px 0; text-align: left; font-size: 13px;">${log.nama_barang}</td>
        <td style="padding: 8px 0; text-align: center; font-size: 13px;">${log.jumlah_ditambah}</td>
        <td style="padding: 8px 0; text-align: center; font-size: 13px;">${log.sku}</td>
        <td style="padding: 8px 0; text-align: right; font-size: 13px;">${new Date(log.timestamp).toLocaleString()}</td>
      </tr>
    `,
			)
			.join("");

		return `
      <h1 style="text-align: center; color: #333; margin-bottom: 5px;">CashierPro Log</h1>
      <p style="text-align: center; color: #666; font-size: 12px; margin-bottom: 20px;">Riwayat Penambahan/Pengurangan Stok</p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 10px 0; text-align: left; font-size: 14px;">Nama Barang</th>
            <th style="padding: 10px 0; text-align: center; font-size: 14px;">Jumlah</th>
            <th style="padding: 10px 0; text-align: center; font-size: 14px;">SKU</th>
            <th style="padding: 10px 0; text-align: right; font-size: 14px;">Tanggal & Waktu</th>
          </tr>
        </thead>
        <tbody>
          ${logRowsHtml}
        </tbody>
      </table>

      <p style="text-align: center; margin-top: 40px; color: #666; font-size: 12px;">Dibuat pada: ${new Date().toLocaleString()}</p>
    `;
	};

	const exportLogsToPdf = async () => {
		try {
			const html = generateLogHtml(logEntries);
			const { uri } = await Print.printToFileAsync({ html });

			if (uri) {
				await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
			}
		} catch (error) {
			console.error("Error exporting logs to PDF:", error);
			Alert.alert("Error", "Gagal mengekspor log sebagai PDF.");
		}
	};

	const TableHeader = () => (
		<View style={styles.tableHeader}>
			<Text style={[styles.headerText, { flex: 3 }]}>Nama Barang</Text>
			<Text style={[styles.headerText, { flex: 1.5 }]}>Jumlah</Text>
			<Text style={[styles.headerText, { flex: 2 }]}>SKU</Text>
			<Text style={[styles.headerText, { flex: 3 }]}>Tanggal & Waktu</Text>
		</View>
	);

	const TableRow = ({ item }: { item: LogEntry }) => (
		<View style={styles.tableRow}>
			<View style={[styles.cellContainer, { flex: 3 }]}>
				<Text style={styles.cellText} numberOfLines={2}>
					{item.nama_barang}
				</Text>
			</View>
			<View style={[styles.cellContainer, { flex: 1.5 }]}>
				<Text style={styles.cellText} numberOfLines={1}>
					{item.jumlah_ditambah > 0 ? "+" : ""}
					{item.jumlah_ditambah}
				</Text>
			</View>
			<View style={[styles.cellContainer, { flex: 2 }]}>
				<Text style={styles.cellText} numberOfLines={1}>
					{item.sku}
				</Text>
			</View>
			<View style={[styles.cellContainer, { flex: 3 }]}>
				<Text style={styles.cellText} numberOfLines={2}>
					{new Date(item.timestamp).toLocaleString()}
				</Text>
			</View>
		</View>
	);

	if (loading) {
		return (
			<View style={styles.center}>
				<Text style={styles.loadingText}>Memuat Log...</Text>
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#0f1419" />
			<View style={styles.header}>
				<Text style={styles.title}>Log Penambahan Barang</Text>
				<Text style={styles.subtitle}>Catatan aktivitas penambahan stok</Text>
			</View>

			<View style={styles.tableContainer}>
				<Text style={styles.listTitle}>
					Daftar Log ({logEntries.length} entri)
				</Text>

				<View style={styles.table}>
					<TableHeader />
					<FlatList
						data={logEntries}
						keyExtractor={(item) => item.id.toString()}
						renderItem={({ item }) => <TableRow item={item} />}
						ListEmptyComponent={
							<View style={styles.emptyContainer}>
								<Text style={styles.emptyText}>Tidak ada entri log.</Text>
							</View>
						}
						showsVerticalScrollIndicator={false}
						ItemSeparatorComponent={() => <View style={styles.separator} />}
					/>
				</View>
			</View>
			<TouchableOpacity style={styles.exportButton} onPress={exportLogsToPdf}>
				<Text style={styles.exportButtonText}>Ekspor Log ke PDF</Text>
			</TouchableOpacity>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginTop: StatusBar.currentHeight || 0, // Adjust for status bar height
		marginBottom: 15 + (StatusBar.currentHeight || 0), // Add some space at the bottom
		backgroundColor: "#0f1419", // Dark background
	},
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#0f1419",
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
	tableContainer: {
		flex: 1,
		paddingHorizontal: 16,
		paddingBottom: 20,
		marginTop: 16,
	},
	listTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "white",
		marginBottom: 12,
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
	},
	separator: {
		height: 1,
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		marginHorizontal: 12,
	},
	cellContainer: {
		justifyContent: "center",
		paddingHorizontal: 4,
	},
	cellText: {
		fontSize: 13,
		color: "white",
		textAlign: "center",
	},
	emptyContainer: {
		alignItems: "center",
		paddingVertical: 40,
	},
	emptyText: {
		color: "#b0b3b8",
		fontSize: 16,
		fontStyle: "italic",
	},
	exportButton: {
		backgroundColor: "#00d4ff",
		paddingVertical: 15,
		marginHorizontal: 20,
		borderRadius: 10,
		alignItems: "center",
		marginBottom: 20,
		marginTop: 10,
	},
	exportButtonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
	},
});