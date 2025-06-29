// screens/ReceiptScreen.tsx
import {
	useNavigation,
	useRoute,
	type RouteProp,
} from "@react-navigation/native";
import * as Print from "expo-print";
import { router } from "expo-router";
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
	View,
} from "react-native";
import { RootStackParamList } from "./StockStack"; // Import RootStackParamList
// Import tipe TransactionDetails dan CartItem dari database
import { TransactionDetails } from "../database";

// Define the type for the route prop in this screen
type ReceiptScreenRouteProp = RouteProp<RootStackParamList, "ReceiptScreen">;

// Interface TransactionDetails tidak perlu didefinisikan lagi di sini
// Karena sudah diimpor dari database.tsx

export default function ReceiptScreen() {
	const navigation = useNavigation(); // Tidak perlu tipe eksplisit di sini jika tidak ada navigasi keluar
	const route = useRoute<ReceiptScreenRouteProp>(); // Type the route hook
	// Pastikan transactionDetails ada dan tipenya benar
	const { transactionDetails, fromLogScreen } = route.params; // Sekarang TypeScript tahu transactionDetails exists dan its type

	const handleBack = () => {
		if (fromLogScreen) {
			router.push("/logScreen");
		} else {
			navigation.goBack();
		}
	};

	const generateReceiptHtml = (details: TransactionDetails) => {
		const formattedDate = new Date(details.date).toLocaleString("id-ID", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		});

		const itemsHtml = details.items
			.map(
				(item) => `
      <tr style="border-bottom: 1px dashed #ddd;">
        <td style="padding: 5px 0;">${item.nama_barang} (${item.sku})</td>
        <td style="padding: 5px 0; text-align: center;">${item.quantity}</td>
        <td style="padding: 5px 0; text-align: right;">Rp${item.harga.toLocaleString(
					"id-ID"
				)}</td>
        <td style="padding: 5px 0; text-align: right;">Rp${(
					item.harga * item.quantity
				).toLocaleString("id-ID")}</td>
      </tr>
    `
			)
			.join("");

		return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk Belanja</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f8f8; color: #333; }
          .container { width: 100%; max-width: 400px; margin: 0 auto; background-color: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
          h1 { text-align: center; color: #333; font-size: 24px; margin-bottom: 10px; }
          .shop-info { text-align: center; margin-bottom: 20px; font-size: 14px; color: #555; }
          .section-title { font-weight: bold; margin-top: 15px; margin-bottom: 8px; color: #333; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th, td { text-align: left; padding: 8px 0; font-size: 14px; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .summary-row { display: flex; justify-content: space-between; padding: 5px 0; border-top: 1px dashed #eee; margin-top: 5px; }
          .summary-label { font-weight: bold; font-size: 15px; }
          .summary-value { font-weight: bold; font-size: 15px; color: #000; }
          .total-row { border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
          .thank-you { text-align: center; margin-top: 25px; font-size: 14px; color: #555; }
          .contact { text-align: center; font-size: 12px; color: #777; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Struk Belanja</h1>
          <div class="shop-info">
            <p>Toko Annaya Tegal</p>
            <p>Jl. Merpati No.120, Randugunting, Kec. Tegal Sel., Kota Tegal, Jawa Tengah 52131</p>
            <p>Telp: 085879525641</p>
            <p>Tanggal: ${formattedDate}</p>
          </div>

          <div class="section-title">Detail Barang</div>
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Barang</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Harga Satuan</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary-row total-row">
            <span class="summary-label">Total Harga:</span>
            <span class="summary-value">Rp${details.totalPrice.toLocaleString(
							"id-ID"
						)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Tunai Diterima:</span>
            <span class="summary-value">Rp${details.cashReceived.toLocaleString(
							"id-ID"
						)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Kembalian:</span>
            <span class="summary-value">Rp${details.change.toLocaleString(
							"id-ID"
						)}</span>
          </div>

          <p class="thank-you">Terima kasih telah berbelanja!</p>
          <p class="contact">Kunjungi kami lagi!</p>
        </div>
      </body>
      </html>
    `;
	};

	const createAndSharePdf = async () => {
		try {
			const html = generateReceiptHtml(transactionDetails);
			const { uri } = await Print.printToFileAsync({ html });
			if (uri) {
				await Sharing.shareAsync(uri);
			}
		} catch (error) {
			Alert.alert("Error", "Gagal membuat atau membagikan PDF.");
			console.error("Error creating or sharing PDF:", error);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
			<ScrollView contentContainerStyle={styles.scrollViewContent}>
				<TouchableOpacity onPress={handleBack} style={styles.backButton}>
					<Text style={styles.backButtonText}>{"< Kembali"}</Text>
				</TouchableOpacity>
				<View style={styles.receiptContainer}>
					<Text style={styles.headerTitle}>Struk Belanja</Text>
					<View style={styles.shopInfo}>
						<Text style={styles.shopName}>Toko Contoh Jaya</Text>
						<Text style={styles.shopAddress}>Jl. Maju Mundur No. 123</Text>
						<Text style={styles.shopContact}>Telp: 0812-3456-7890</Text>
						<Text style={styles.transactionDate}>
							Tanggal:{" "}
							{new Date(transactionDetails.date).toLocaleString("id-ID", {
								year: "numeric",
								month: "long",
								day: "numeric",
								hour: "2-digit",
								minute: "2-digit",
								second: "2-digit",
								hour12: false,
							})}
						</Text>
					</View>

					<Text style={styles.sectionTitle}>Detail Barang</Text>
					{transactionDetails.items.map((item, index) => (
						<View key={index} style={styles.itemRow}>
							<Text style={styles.itemText}>
								{item.nama_barang} ({item.sku}) x {item.quantity}
							</Text>
							<Text style={styles.itemPrice}>
								Rp{(item.harga * item.quantity).toLocaleString("id-ID")}
							</Text>
						</View>
					))}

					<View style={styles.summaryContainer}>
						<View style={styles.summaryRow}>
							<Text style={styles.summaryLabel}>Total Harga:</Text>
							<Text style={styles.summaryValue}>
								Rp{transactionDetails.totalPrice.toLocaleString("id-ID")}
							</Text>
						</View>
						<View style={styles.summaryRow}>
							<Text style={styles.summaryLabel}>Tunai Diterima:</Text>
							<Text style={styles.summaryValue}>
								Rp{transactionDetails.cashReceived.toLocaleString("id-ID")}
							</Text>
						</View>
						<View style={styles.summaryRow}>
							<Text style={styles.summaryLabel}>Kembalian:</Text>
							<Text style={styles.summaryValue}>
								Rp{transactionDetails.change.toLocaleString("id-ID")}
							</Text>
						</View>
					</View>

					<Text style={styles.thankYou}>Terima kasih telah berbelanja!</Text>
					<Text style={styles.contact}>Kunjungi kami lagi!</Text>

					<TouchableOpacity
						style={styles.printButton}
						onPress={createAndSharePdf}
					>
						<Text style={styles.printButtonText}>Cetak / Bagikan Struk</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f8f8f8",
		paddingTop: StatusBar.currentHeight || 0,
		paddingBottom: 15 + (StatusBar.currentHeight || 0), // Add some space at the bottom
	},
	scrollViewContent: {
		padding: 20,
		alignItems: "center",
	},
	receiptContainer: {
		backgroundColor: "#fff",
		borderRadius: 10,
		padding: 20,
		width: "100%",
		maxWidth: 400,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 5,
		elevation: 5,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 10,
		color: "#333",
	},
	shopInfo: {
		alignItems: "center",
		marginBottom: 20,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
		paddingBottom: 15,
	},
	shopName: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
	},
	shopAddress: {
		fontSize: 14,
		color: "#666",
		marginTop: 2,
	},
	shopContact: {
		fontSize: 14,
		color: "#666",
		marginTop: 2,
	},
	transactionDate: {
		fontSize: 14,
		color: "#666",
		marginTop: 5,
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
	summaryContainer: {
		marginTop: 20,
		borderTopWidth: 1,
		borderTopColor: "#eee",
		paddingTop: 15,
	},
	summaryRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 10,
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
		color: "#555",
	},
	contact: {
		fontSize: 12,
		textAlign: "center",
		marginTop: 5,
		color: "#777",
	},
	printButton: {
		backgroundColor: "#007bff",
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: "center",
		marginTop: 25,
	},
	printButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	backButton: {
		marginBottom: 10,
		paddingHorizontal: 10,
		paddingVertical: 5,
		backgroundColor: "#007bff",
		borderRadius: 5,
		alignSelf: "flex-start",
	},
	backButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
});
