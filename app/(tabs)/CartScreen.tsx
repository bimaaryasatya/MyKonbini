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
	Platform,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { addLogEntry, getItemBySku, updateStock } from "../database";
import { RootStackParamList } from "./StockStack"; // Import RootStackParamList
import { CartItem } from "./TransactionScreen";

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

	useFocusEffect(
		useCallback(() => {
			if (route.params?.cartItems) {
				// Now TypeScript knows route.params has cartItems
				setCartItems(route.params.cartItems); // No need for 'as CartItem[]'
			}
		}, [route.params?.cartItems])
	);

	const calculateTotalPrice = () => {
		return cartItems.reduce(
			(total, item) => total + item.harga * item.quantity,
			0
		);
	};

	const calculateTotalItems = () => {
		return cartItems.reduce((total, item) => total + item.quantity, 0);
	};

	const handleQuantityChange = async (index: number, newQuantity: string) => {
		const updatedCart = [...cartItems];
		const quantity = parseInt(newQuantity);

		if (isNaN(quantity) || quantity < 0) {
			return;
		}

		if (quantity === 0) {
			handleRemoveItem(index);
			return;
		}

		const item = updatedCart[index];
		const dbItem = await getItemBySku(item.sku);

		if (dbItem && quantity > dbItem.stok) {
			Alert.alert(
				"Jumlah Barang Melebihi Stok",
				"Jumlah yang dimasukkan melebihi stok yang tersedia. Apakah Anda yakin ingin melanjutkan? (Stok akan menjadi minus)",
				[
					{ text: "Batal", style: "cancel" },
					{
						text: "Lanjut",
						onPress: () => {
							updatedCart[index].quantity = quantity;
							setCartItems(updatedCart);
						},
					},
				]
			);
		} else {
			updatedCart[index].quantity = quantity;
			setCartItems(updatedCart);
		}
	};

	const handleRemoveItem = (index: number) => {
		Alert.alert(
			"Hapus Barang",
			"Apakah Anda yakin ingin menghapus barang ini dari keranjang?",
			[
				{ text: "Batal", style: "cancel" },
				{
					text: "Hapus",
					onPress: () => {
						const updatedCart = [...cartItems];
						updatedCart.splice(index, 1);
						setCartItems(updatedCart);
					},
				},
			]
		);
	};

	const handleCashInput = (text: string) => {
		setCashReceived(text);
		const total = calculateTotalPrice();
		const cash = parseFloat(text);
		if (!isNaN(cash)) {
			setChange(cash - total);
		} else {
			setChange(0);
		}
	};

	const handleCheckout = async () => {
		const total = calculateTotalPrice();
		const cash = parseFloat(cashReceived);

		if (isNaN(cash) || cash < total) {
			Alert.alert("Uang Kurang", "Jumlah uang yang diberikan tidak cukup.");
			return;
		}

		try {
			for (const item of cartItems) {
				const currentItem = await getItemBySku(item.sku);
				if (currentItem) {
					const newStok = currentItem.stok - item.quantity;
					await updateStock(
						currentItem.id,
						currentItem.nama_barang,
						currentItem.sku,
						currentItem.harga,
						newStok
					);
					await addLogEntry(
						item.nama_barang,
						item.sku,
						-item.quantity,
						new Date().toISOString()
					);
				}
			}

			Alert.alert("Berhasil!", "Transaksi berhasil diselesaikan.");
			navigation.navigate("ReceiptScreen", {
				// This line is now correctly typed
				transactionDetails: {
					date: new Date().toISOString(),
					items: cartItems,
					totalPrice: total,
					cashReceived: cash,
					change: cash - total,
				},
			});

			setCartItems([]);
			setCashReceived("");
			setChange(0);
		} catch (error) {
			console.error("Error during checkout:", error);
			Alert.alert("Error", "Terjadi kesalahan saat menyelesaikan transaksi.");
		}
	};

	const renderItem = ({ item, index }: { item: CartItem; index: number }) => (
		<View style={styles.cartItem}>
			<View style={styles.itemDetails}>
				<Text style={styles.itemName} numberOfLines={2}>
					{item.nama_barang}
				</Text>
				<Text style={styles.itemPrice}>
					Harga: Rp {item.harga.toLocaleString("id-ID")}
				</Text>
				<Text style={styles.itemSku}>SKU: {item.sku}</Text>
			</View>
			<View style={styles.quantityControl}>
				<TextInput
					style={styles.quantityInput}
					keyboardType="numeric"
					value={item.quantity.toString()}
					onChangeText={(text) => handleQuantityChange(index, text)}
				/>
				<TouchableOpacity
					style={styles.removeButton}
					onPress={() => handleRemoveItem(index)}
				>
					<Text style={styles.removeButtonText}>Hapus</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#0f1419" />
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.keyboardAvoidingContainer}
				keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -200}
			>
				<FlatList
					data={cartItems}
					keyExtractor={(item, index) => `${item.sku}-${index}`}
					renderItem={renderItem}
					ListEmptyComponent={
						<View style={styles.emptyCart}>
							<Text style={styles.emptyCartText}>Keranjang kosong.</Text>
						</View>
					}
					contentContainerStyle={styles.flatListContent}
					showsVerticalScrollIndicator={false}
				/>

				<View style={styles.summaryContainer}>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Total Barang:</Text>
						<Text style={styles.summaryValue}>
							{calculateTotalItems()} item
						</Text>
					</View>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Total Harga:</Text>
						<Text style={styles.summaryValue}>
							Rp {calculateTotalPrice().toLocaleString("id-ID")}
						</Text>
					</View>

					<View style={styles.paymentContainer}>
						<Text style={styles.paymentLabel}>Uang Diberikan:</Text>
						<TextInput
							style={styles.cashInput}
							keyboardType="numeric"
							placeholder="Masukkan jumlah uang"
							placeholderTextColor="#b0b3b8"
							value={cashReceived}
							onChangeText={handleCashInput}
						/>
						<Text style={styles.changeText}>
							Kembalian: Rp {change.toLocaleString("id-ID")}
						</Text>
					</View>

					<TouchableOpacity
						style={styles.checkoutButton}
						onPress={handleCheckout}
					>
						<Text style={styles.checkoutButtonText}>Bayar / Checkout</Text>
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginTop: StatusBar.currentHeight || 0,
		marginBottom: 16 + (StatusBar.currentHeight ?? 0), // Adjust for status bar height
		backgroundColor: "#0f1419",
	},
	keyboardAvoidingContainer: {
		flex: 1,
	},
	flatListContent: {
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 10,
	},
	cartItem: {
		flexDirection: "row",
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 10,
		padding: 15,
		marginBottom: 10,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.2)",
	},
	itemDetails: {
		flex: 1,
		marginRight: 10,
	},
	itemName: {
		fontSize: 16,
		fontWeight: "bold",
		color: "white",
		marginBottom: 5,
	},
	itemPrice: {
		fontSize: 14,
		color: "#b0b3b8",
	},
	itemSku: {
		fontSize: 12,
		color: "#7a7a7a",
		marginTop: 2,
	},
	quantityControl: {
		flexDirection: "row",
		alignItems: "center",
	},
	quantityInput: {
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		color: "white",
		paddingVertical: 8,
		paddingHorizontal: 10,
		borderRadius: 5,
		minWidth: 60,
		textAlign: "center",
		fontSize: 16,
		marginRight: 10,
	},
	removeButton: {
		backgroundColor: "#e74c3c",
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
		borderTopColor: "rgba(255, 255, 255, 0.1)",
		paddingTop: 15,
	},
	paymentLabel: {
		fontSize: 16,
		color: "#b0b3b8",
		marginBottom: 8,
	},
	cashInput: {
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		color: "white",
		padding: 12,
		borderRadius: 8,
		fontSize: 16,
		marginBottom: 10,
	},
	changeText: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#00d4ff",
		textAlign: "right",
	},
	checkoutButton: {
		backgroundColor: "#00d4ff",
		paddingVertical: 15,
		borderRadius: 10,
		alignItems: "center",
		marginTop: 20,
		elevation: 5,
	},
	checkoutButtonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
	},
});
