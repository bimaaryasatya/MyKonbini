// screens/ReceiptScreen.tsx
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

interface TransactionDetails {
	date: string;
	items: {
		id: number;
		nama_barang: string;
		sku: string;
		harga: number;
		stok: number; // This 'stok' is the original stock, not the purchased quantity
		quantity: number; // This is the purchased quantity
	}[];
	totalPrice: number;
	cashReceived: number;
	change: number;
}

export default function ReceiptScreen() {
	const navigation = useNavigation();
	const route = useRoute();
	const { transactionDetails } = route.params as {
		transactionDetails: TransactionDetails;
	};

	const generateReceiptHtml = (details: TransactionDetails) => {
		const formattedDate = new Date(details.date).toLocaleString("id-ID", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});

		let itemsHtml = details.items
			.map(
				(item) => `
      <tr style="border-bottom: 1px dashed #ddd;">
        <td style="padding: 8px 0; text-align: left; font-size: 14px;">${item.nama_barang}</td>
        <td style="padding: 8px 0; text-align: center; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 8px 0; text-align: right; font-size: 14px;">Rp ${item.harga.toLocaleString("id-ID")}</td>
        <td style="padding: 8px 0; text-align: right; font-size: 14px;">Rp ${(item.harga * item.quantity).toLocaleString("id-ID")}</td>
      </tr>
    `,
			)
			.join("");

		return `
      <h1 style="text-align: center; color: #333; margin-bottom: 5px;">CashierPro</h1>
      <p style="text-align: center; color: #666; font-size: 12px; margin-bottom: 20px;">Struk Pembelian</p>

      <div style="border-top: 1px dashed #ddd; border-bottom: 1px dashed #ddd; padding: 10px 0; margin-bottom: 20px;">
        <p style="font-size: 14px; margin: 5px 0;"><strong>Tanggal:</strong> ${formattedDate}</p>
        <p style="font-size: 14px; margin: 5px 0;"><strong>Total Item:</strong> ${details.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 10px 0; text-align: left; font-size: 14px;">Barang</th>
            <th style="padding: 10px 0; text-align: center; font-size: 14px;">Qty</th>
            <th style="padding: 10px 0; text-align: right; font-size: 14px;">Harga</th>
            <th style="padding: 10px 0; text-align: right; font-size: 14px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="text-align: right; margin-top: 20px;">
        <p style="font-size: 16px; margin: 5px 0;"><strong>Total Harga:</strong> Rp ${details.totalPrice.toLocaleString("id-ID")}</p>
        <p style="font-size: 16px; margin: 5px 0;"><strong>Uang Diberikan:</strong> Rp ${details.cashReceived.toLocaleString("id-ID")}</p>
        <p style="font-size: 16px; margin: 5px 0;"><strong>Kembalian:</strong> Rp ${details.change.toLocaleString("id-ID")}</p>
      </div>

      <p style="text-align: center; margin-top: 40px; color: #666; font-size: 12px;">Terima kasih telah berbelanja!</p>
    `;
	};

	const printReceipt = async () => {
		try {
			const html = generateReceiptHtml(transactionDetails);
			await Print.printAsync({ html });
		} catch (error) {
			console.error("Error printing receipt:", error);
			Alert.alert("Error", "Gagal mencetak struk.");
		}
	};

	const sharePdfReceipt = async () => {
		try {
			const html = generateReceiptHtml(transactionDetails);
			const { uri } = await Print.printToFileAsync({ html });

			if (uri) {
				await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
			}
		} catch (error) {
			console.error("Error sharing PDF:", error);
			Alert.alert("Error", "Gagal membagikan struk sebagai PDF.");
		}
	};

	const savePdfReceipt = async () => {
		try {
			const html = generateReceiptHtml(transactionDetails);
			const { uri } = await Print.printToFileAsync({ html });

			if (uri) {
				Alert.alert("PDF Tersimpan", `Struk berhasil disimpan di: ${uri}`, [
					{
						text: "OK",
						onPress: () => {
							// Optionally navigate back or do something else
						},
					},
				]);
			}
		} catch (error) {
			console.error("Error saving PDF:", error);
			Alert.alert("Error", "Gagal menyimpan struk sebagai PDF.");
		}
	};

	const handleDeleteReceipt = () => {
		Alert.alert(
			"Hapus Struk",
			"Apakah Anda yakin ingin menghapus struk ini? (Tindakan ini tidak akan membatalkan transaksi)",
			[
				{ text: "Batal", style: "cancel" },
				{
					text: "Hapus",
					onPress: () => {
						// In a real application, you might have a backend or more complex state management
						// to truly "delete" a receipt. For this demo, it just navigates back.
						Alert.alert("Struk Dihapus", "Struk telah dihapus.");
						navigation.goBack(); // Go back to the CartScreen or Home
					},
				},
			],
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#0f1419" />
			<ScrollView contentContainerStyle={styles.scrollViewContent}>
				<View style={styles.receiptCard}>
					<Text style={styles.appName}>CashierPro</Text>
					<Text style={styles.receiptTitle}>Struk Pembelian</Text>
					<View style={styles.divider} />

					<View style={styles.detailRow}>
						<Text style={styles.detailLabel}>Tanggal & Waktu:</Text>
						<Text style={styles.detailValue}>
							{new Date(transactionDetails.date).toLocaleString("id-ID", {
								year: "numeric",
								month: "long",
								day: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</Text>
					</View>

					<View style={styles.divider} />

					<Text style={styles.sectionTitle}>Daftar Barang:</Text>
					{transactionDetails.items.map((item, index) => (
						<View key={index} style={styles.itemRow}>
							<Text style={styles.itemText}>
								{item.nama_barang} (x{item.quantity})
							</Text>
							<Text style={styles.itemPrice}>
								Rp {(item.harga * item.quantity).toLocaleString("id-ID")}
							</Text>
						</View>
					))}

					<View style={styles.divider} />

					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Total Harga:</Text>
						<Text style={styles.summaryValue}>
							Rp {transactionDetails.totalPrice.toLocaleString("id-ID")}
						</Text>
					</View>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Uang Diberikan:</Text>
						<Text style={styles.summaryValue}>
							Rp {transactionDetails.cashReceived.toLocaleString("id-ID")}
						</Text>
					</View>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Kembalian:</Text>
						<Text style={styles.summaryValue}>
							Rp {transactionDetails.change.toLocaleString("id-ID")}
						</Text>
					</View>

					<Text style={styles.thankYou}>Terima kasih telah berbelanja!</Text>
				</View>

				<View style={styles.buttonContainer}>
					<TouchableOpacity style={styles.actionButton} onPress={printReceipt}>
						<Text style={styles.actionButtonText}>Cetak Struk</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.actionButton}
						onPress={sharePdfReceipt}
					>
						<Text style={styles.actionButtonText}>Bagikan PDF</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.actionButton} onPress={savePdfReceipt}>
						<Text style={styles.actionButtonText}>Simpan PDF</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.deleteButton}
						onPress={handleDeleteReceipt}
					>
						<Text style={styles.deleteButtonText}>Hapus Struk</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginTop: StatusBar.currentHeight || 0,
		backgroundColor: "#0f1419",
	},
	scrollViewContent: {
		flexGrow: 1,
		padding: 20,
	},
	receiptCard: {
		backgroundColor: "white",
		borderRadius: 10,
		padding: 20,
		marginBottom: 20,
		elevation: 5,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	appName: {
		fontSize: 24,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 5,
		color: "#333",
	},
	receiptTitle: {
		fontSize: 18,
		textAlign: "center",
		color: "#666",
		marginBottom: 15,
	},
	divider: {
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
		marginVertical: 10,
	},
	detailRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 5,
	},
	detailLabel: {
		fontSize: 14,
		color: "#333",
		fontWeight: "bold",
	},
	detailValue: {
		fontSize: 14,
		color: "#666",
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: "bold",
		marginTop: 15,
		marginBottom: 10,
		color: "#333",
	},
	itemRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 5,
		paddingVertical: 3,
		borderBottomWidth: 1,
		borderBottomColor: "#f2f2f2",
	},
	itemText: {
		fontSize: 14,
		color: "#333",
		flex: 1,
	},
	itemPrice: {
		fontSize: 14,
		color: "#333",
		fontWeight: "bold",
		marginLeft: 10,
	},
	summaryRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 10,
	},
	summaryLabel: {
		fontSize: 16,
		color: "#333",
		fontWeight: "bold",
	},
	summaryValue: {
		fontSize: 16,
		color: "#000",
		fontWeight: "bold",
	},
	thankYou: {
		fontSize: 14,
		textAlign: "center",
		marginTop: 30,
		color: "#666",
		fontStyle: "italic",
	},
	buttonContainer: {
		marginTop: 20,
		alignItems: "center",
	},
	actionButton: {
		backgroundColor: "#00d4ff",
		paddingVertical: 12,
		paddingHorizontal: 25,
		borderRadius: 8,
		marginBottom: 10,
		width: "80%",
		alignItems: "center",
	},
	actionButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	deleteButton: {
		backgroundColor: "#e74c3c",
		paddingVertical: 12,
		paddingHorizontal: 25,
		borderRadius: 8,
		marginTop: 10,
		width: "80%",
		alignItems: "center",
	},
	deleteButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
});