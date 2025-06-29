// screens/CartScreen.tsx
import {
	useFocusEffect,
	useNavigation,
	useRoute,
	type NavigationProp,
	type RouteProp,
} from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
	Alert,
	FlatList,
	KeyboardAvoidingView,
	Modal, // Import Modal
	Platform,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
// Perbarui import:
import {
	addTransactionLog, // <-- Tambahkan ini
	Barang, // <-- Tambahkan ini
	getAllStock, // Masih digunakan untuk update stok
	getItemBySku, // <-- Tambahkan ini
	TransactionDetails,
	updateStock,
} from "../database";
import { RootStackParamList } from "./StockStack";
import { CartItem } from "./TransactionScreen"; // Import CartItem dari sini

// Define the types for the navigation and route props in this screen
type CartScreenRouteProp = RouteProp<RootStackParamList, "CartScreen">;
type CartScreenNavigationProp = NavigationProp<
	RootStackParamList,
	"CartScreen"
>;

export default function CartScreen() {
	const navigation = useNavigation<CartScreenNavigationProp>(); // Type the navigation hook
	const route = useRoute<CartScreenRouteProp>(); // Type the route hook
	const [cartItems, setCartItems] = useState<CartItem[]>([]);
	const [cashReceived, setCashReceived] = useState("");
	const [change, setChange] = useState(0);
	const [showAddItemModal, setShowAddItemModal] = useState(false); // State untuk modal
	const [availableStock, setAvailableStock] = useState<Barang[]>([]); // State untuk stok yang tersedia
	const [searchStockText, setSearchStockText] = useState(""); // State untuk pencarian di modal

	const handleCashReceivedChange = (text: string) => {
		setCashReceived(text);
		const totalPrice = calculateTotalPrice();
		const received = parseFloat(text);
		if (!isNaN(received)) {
			const calculatedChange = received - totalPrice;
			setChange(calculatedChange >= 0 ? calculatedChange : 0);
		} else {
			setChange(0);
		}
	};

	const fetchAvailableStock = useCallback(async () => {
		try {
			const stock = await getAllStock();
			setAvailableStock(stock);
		} catch (error) {
			console.error("Error fetching available stock:", error);
			Alert.alert("Error", "Gagal memuat daftar barang.");
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			if (route.params?.cartItems) {
				setCartItems(route.params.cartItems);
			}
			fetchAvailableStock(); // Fetch stock when screen is focused
			return () => {
				// Cleanup jika diperlukan
			};
		}, [route.params?.cartItems, fetchAvailableStock])
	);

	const calculateTotalPrice = () => {
		return cartItems.reduce((sum, item) => sum + item.harga * item.quantity, 0);
	};

	const handleQuantityChange = (id: number, newQuantity: string) => {
		const quantity = parseInt(newQuantity);
		if (!isNaN(quantity) && quantity >= 1) {
			setCartItems((prevItems) =>
				prevItems.map((item) =>
					item.id === id ? { ...item, quantity: quantity } : item
				)
			);
		} else if (newQuantity === "") {
			setCartItems((prevItems) =>
				prevItems.map((item) =>
					item.id === id ? { ...item, quantity: 0 } : item
				)
			);
		}
	};

	const handleRemoveItem = (id: number) => {
		setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
	};

	const handleAddItemToCart = (item: Barang) => {
		setCartItems((prevItems) => {
			const existingItemIndex = prevItems.findIndex(
				(cartItem) => cartItem.id === item.id
			);

			if (existingItemIndex > -1) {
				// If item exists, increment quantity
				const updatedItems = [...prevItems];
				const updatedQuantity = updatedItems[existingItemIndex].quantity + 1;
				if (updatedQuantity > item.stok) {
					Alert.alert(
						"Stok Tidak Cukup",
						`Stok ${item.nama_barang} hanya ${item.stok}.`
					);
					return prevItems; // Don't update if quantity exceeds stock
				}
				updatedItems[existingItemIndex] = {
					...updatedItems[existingItemIndex],
					quantity: updatedQuantity,
				};
				return updatedItems;
			} else {
				// If item is new, add it to cart with quantity 1
				if (item.stok === 0) {
					Alert.alert(
						"Stok Habis",
						`${item.nama_barang} sedang tidak tersedia.`
					);
					return prevItems;
				}
				const newItem: CartItem = {
					...item,
					quantity: 1,
				};
				return [...prevItems, newItem];
			}
		});
		setShowAddItemModal(false); // Close modal after adding
		setSearchStockText(""); // Clear search text
	};

	const handleProcessTransaction = async () => {
		const totalPrice = calculateTotalPrice();
		const received = parseFloat(cashReceived);

		if (isNaN(received) || received < totalPrice) {
			Alert.alert(
				"Pembayaran Kurang",
				`Uang yang diterima kurang dari total harga (Rp${totalPrice}).`
			);
			return;
		}

		const calculatedChange = received - totalPrice;
		setChange(calculatedChange);

		Alert.alert(
			"Konfirmasi Transaksi",
			`Total: Rp${totalPrice}\nBayar: Rp${received}\nKembalian: Rp${calculatedChange}`,
			[
				{
					text: "Batal",
					style: "cancel",
				},
				{
					text: "Bayar",
					onPress: async () => {
						try {
							// Check stock availability for all items before proceeding
							for (const item of cartItems) {
								const currentStockItem = await getItemBySku(item.sku);
								if (
									!currentStockItem ||
									currentStockItem.stok < item.quantity
								) {
									Alert.alert(
										"Stok Tidak Cukup",
										`Stok ${item.nama_barang} tidak cukup. Tersisa: ${
											currentStockItem?.stok || 0
										}`
									);
									return; // Stop transaction if stock is insufficient
								}
							}

							// 1. Update stock and add individual mutation logs
							for (const item of cartItems) {
								const currentStock = (await getItemBySku(item.sku))?.stok || 0;
								const newStock = currentStock - item.quantity;

								// Stock check already done above, but good to have here too as a safeguard
								if (newStock < 0) {
									Alert.alert(
										"Stok Tidak Cukup",
										`Stok ${item.nama_barang} tidak cukup.`
									);
									return;
								}
								await updateStock(
									item.id,
									item.nama_barang,
									item.sku,
									item.harga,
									newStock
								);

								// addLogEntry already called in updateStock, so no need to call again here
								// if updateStock already handles mutation logs (negative jumlah_mutasi)
							}

							// 2. Add full transaction log entry
							const transactionDetails: TransactionDetails = {
								date: new Date().toISOString(),
								items: cartItems,
								totalPrice: totalPrice,
								cashReceived: received,
								change: calculatedChange,
							};
							await addTransactionLog(transactionDetails); // <-- Panggil fungsi baru ini

							Alert.alert("Sukses", "Transaksi berhasil!");
							setCartItems([]);
							setCashReceived("");
							setChange(0);
							// Emit event to refresh logs after successful transaction
							navigation.navigate("ReceiptScreen", { transactionDetails }); // <-- Navigasi ke ReceiptScreen
							// Emit event to refresh logs
							// navigation.emit({ type: "refreshLogs" }); // Removed because emit is not available on navigation prop
						} catch (error) {
							Alert.alert("Error", "Gagal memproses transaksi.");
							console.error("Error processing transaction:", error);
						}
					},
				},
			]
		);
	};

	const renderCartItem = ({ item }: { item: CartItem }) => (
		<View style={styles.itemContainer}>
			<Text style={styles.itemName}>
				{item.nama_barang} ({item.sku})
			</Text>
			<View style={styles.itemDetails}>
				<TextInput
					style={styles.itemQuantityInput}
					keyboardType="numeric"
					value={String(item.quantity)}
					onChangeText={(text) => handleQuantityChange(item.id, text)}
				/>
				<Text style={styles.itemPrice}>
					Rp{(item.harga * item.quantity).toLocaleString("id-ID")}
				</Text>
				<TouchableOpacity
					onPress={() => handleRemoveItem(item.id)}
					style={styles.removeButton}
				>
					<Text style={styles.removeButtonText}>Hapus</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	const filteredAvailableStock = availableStock.filter(
		(item) =>
			item.nama_barang.toLowerCase().includes(searchStockText.toLowerCase()) ||
			item.sku.toLowerCase().includes(searchStockText.toLowerCase())
	);

	const renderStockItem = ({ item }: { item: Barang }) => (
		<TouchableOpacity
			style={styles.stockItem}
			onPress={() => handleAddItemToCart(item)}
		>
			<View>
				<Text style={styles.stockItemName}>
					{item.nama_barang} ({item.sku})
				</Text>
				<Text style={styles.stockItemDetails}>
					Harga: Rp{item.harga.toLocaleString("id-ID")} | Stok: {item.stok}
				</Text>
			</View>
			<Text style={styles.stockAddItemButtonText}>Add</Text>
		</TouchableOpacity>
	);

	const totalPrice = calculateTotalPrice();

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<View style={styles.header}>
					<Text style={styles.title}>Keranjang Belanja</Text>
					<Text style={styles.subtitle}>
						Total {cartItems.length} item di keranjang
					</Text>
				</View>

				<TouchableOpacity
					style={styles.addItemManuallyButton}
					onPress={() => setShowAddItemModal(true)}
				>
					<Text style={styles.addItemManuallyButtonText}>
						Tambah Barang dari Stok
					</Text>
				</TouchableOpacity>

				{cartItems.length === 0 ? (
					<View style={styles.emptyCart}>
						<Text style={styles.emptyCartText}>Keranjang Anda kosong.</Text>
					</View>
				) : (
					<FlatList
						data={cartItems}
						renderItem={renderCartItem}
						keyExtractor={(item) => String(item.id)}
						contentContainerStyle={styles.listContentContainer}
					/>
				)}

				<View style={styles.summaryContainer}>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Total Harga:</Text>
						<Text style={styles.summaryValue}>
							Rp{totalPrice.toLocaleString("id-ID")}
						</Text>
					</View>

					<View style={styles.paymentContainer}>
						<Text style={styles.summaryLabel}>Uang Diterima:</Text>
						<TextInput
							style={styles.paymentInput}
							keyboardType="numeric"
							value={cashReceived}
							onChangeText={handleCashReceivedChange}
							placeholder="Masukkan jumlah uang"
							placeholderTextColor="#b0b3b8"
						/>
					</View>

					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Kembalian:</Text>
						<Text style={styles.summaryValue}>
							Rp{change.toLocaleString("id-ID")}
						</Text>
					</View>

					<TouchableOpacity
						style={styles.processButton}
						onPress={handleProcessTransaction}
						disabled={cartItems.length === 0}
					>
						<Text style={styles.processButtonText}>Proses Transaksi</Text>
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>

			{/* Modal untuk menambah barang dari stok */}
			<Modal
				animationType="slide"
				transparent={false}
				visible={showAddItemModal}
				onRequestClose={() => {
					setShowAddItemModal(false);
					setSearchStockText(""); // Clear search when closing
				}}
			>
				<SafeAreaView style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>Pilih Barang dari Stok</Text>
						<TouchableOpacity
							onPress={() => {
								setShowAddItemModal(false);
								setSearchStockText("");
							}}
							style={styles.modalCloseButton}
						>
							<Text style={styles.modalCloseButtonText}>X</Text>
						</TouchableOpacity>
					</View>
					<TextInput
						style={styles.modalSearchInput}
						placeholder="Cari barang (Nama/SKU)"
						placeholderTextColor="#b0b3b8"
						value={searchStockText}
						onChangeText={setSearchStockText}
					/>
					<FlatList
						data={filteredAvailableStock}
						renderItem={renderStockItem}
						keyExtractor={(item) => String(item.id)}
						contentContainerStyle={styles.stockListContainer}
						ListEmptyComponent={
							<Text style={styles.emptyStockText}>
								Tidak ada barang tersedia.
							</Text>
						}
					/>
				</SafeAreaView>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a1a2e",
		paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
		paddingBottom: 45,
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
	listContentContainer: {
		paddingHorizontal: 16,
		paddingVertical: 20,
		paddingBottom: 20, // Add some space at the bottom
	},
	itemContainer: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 10,
		padding: 15,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.2)",
	},
	itemName: {
		fontSize: 16,
		fontWeight: "bold",
		color: "white",
		marginBottom: 8,
	},
	itemDetails: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	itemQuantityInput: {
		color: "white",
		fontSize: 15,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.5)",
		borderRadius: 5,
		paddingVertical: 5,
		paddingHorizontal: 10,
		width: 60,
		textAlign: "center",
		marginRight: 10,
	},
	itemPrice: {
		fontSize: 15,
		color: "#00d4ff",
		fontWeight: "bold",
		flex: 1, // Take remaining space
	},
	removeButton: {
		backgroundColor: "#dc3545",
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 5,
	},
	removeButtonText: {
		color: "white",
		fontWeight: "bold",
	},
	emptyCart: {
		alignItems: "center",
		paddingVertical: 40,
	},
	emptyCartText: {
		color: "#b0b3b8",
		fontSize: 16,
		fontStyle: "italic",
	},
	summaryContainer: {
		backgroundColor: "rgba(255, 255, 255, 0.08)",
		borderRadius: 12,
		marginHorizontal: 16,
		marginBottom: 10,
		padding: 20,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.3)",
	},
	summaryRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 10,
	},
	summaryLabel: {
		fontSize: 16,
		color: "#b0b3b8",
	},
	summaryValue: {
		fontSize: 16,
		fontWeight: "bold",
		color: "white",
	},
	paymentContainer: {
		marginTop: 15,
		borderTopWidth: 1,
		borderTopColor: "rgba(0, 212, 255, 0.2)",
		paddingTop: 15,
		marginBottom: 15,
	},
	paymentInput: {
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		color: "white",
		fontSize: 16,
		padding: 10,
		borderRadius: 8,
		marginTop: 10,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.4)",
	},
	processButton: {
		backgroundColor: "#00d4ff",
		paddingVertical: 15,
		borderRadius: 10,
		alignItems: "center",
		marginTop: 20,
	},
	processButtonText: {
		color: "#1a1a2e",
		fontSize: 18,
		fontWeight: "bold",
	},
	addItemManuallyButton: {
		backgroundColor: "#007bff",
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		alignSelf: "center",
		marginTop: 10,
		marginBottom: 20,
	},
	addItemManuallyButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	modalContainer: {
		flex: 1,
		backgroundColor: "#1a1a2e",
		paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
	},
	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0, 212, 255, 0.3)",
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "white",
	},
	modalCloseButton: {
		padding: 10,
	},
	modalCloseButtonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
	},
	modalSearchInput: {
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		color: "white",
		fontSize: 16,
		padding: 10,
		borderRadius: 8,
		marginHorizontal: 16,
		marginTop: 10,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.4)",
	},
	stockListContainer: {
		paddingHorizontal: 16,
		paddingBottom: 20,
	},
	stockItem: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 10,
		padding: 15,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.2)",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	stockItemName: {
		fontSize: 16,
		fontWeight: "bold",
		color: "white",
	},
	stockItemDetails: {
		fontSize: 14,
		color: "#b0b3b8",
		marginTop: 4,
	},
	stockAddItemButtonText: {
		color: "#00d4ff",
		fontWeight: "bold",
		fontSize: 16,
	},
	emptyStockText: {
		color: "#b0b3b8",
		fontSize: 16,
		fontStyle: "italic",
		textAlign: "center",
		marginTop: 20,
	},
});
