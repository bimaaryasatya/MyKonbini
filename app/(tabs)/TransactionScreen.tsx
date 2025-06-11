// screens/TransactionScreen.tsx
import { CameraView, useCameraPermissions } from "expo-camera"; // Changed from expo-barcode-scanner
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Barang, getItemBySku } from "../database"; // Assuming database.tsx is in the parent directory

    const navigation = useNavigation();
    const router = useRouter(); // Add this line
    const { width } = Dimensions.get("window");

export interface CartItem extends Barang {
	quantity: number;
}

export default function TransactionScreen() {
	const [facing] = useState("back"); // For camera facing (front/back)
	const [permission, requestPermission] = useCameraPermissions(); // Use useCameraPermissions
	const [scanned, setScanned] = useState(false);
	const [cart, setCart] = useState<CartItem[]>([]); // Local state for the cart
	const navigation = useNavigation();
	const scannerRef = useRef(null);

	useEffect(() => {
		if (!permission?.granted) {
			requestPermission(); // Request permission on component mount if not granted
		}
	}, [permission]);

	useFocusEffect(
		useCallback(() => {
			setScanned(false); // Reset scanned state when screen is focused
		}, []),
	);

	const handleBarCodeScanned = async ({ data: sku }: { data: string }) => {
		if (scanned) return; // Prevent multiple scans
		setScanned(true);

		try {
			const item = await getItemBySku(sku);
			if (item) {
				Alert.alert(
					"Konfirmasi Penambahan",
					`Tambahkan ${item.nama_barang} (SKU: ${item.sku}) ke keranjang?`,
					[
						{
							text: "Batal",
							onPress: () => setScanned(false), // Allow rescanning
							style: "cancel",
						},
						{
							text: "Ya",
							onPress: () => {
								const existingItemIndex = cart.findIndex(
									(cartItem) => cartItem.sku === item.sku,
								);
								if (existingItemIndex > -1) {
									const updatedCart = [...cart];
									updatedCart[existingItemIndex].quantity += 1;
									setCart(updatedCart);
								} else {
									setCart([...cart, { ...item, quantity: 1 }]);
								}
								Alert.alert("Berhasil", `${item.nama_barang} ditambahkan.`);
								setScanned(false); // Allow rescanning after confirmation
							},
						},
					],
				);
			} else {
				Alert.alert(
					"Barang Tidak Ditemukan",
					`SKU "${sku}" tidak ada dalam database.`,
					[
						{
							text: "OK",
							onPress: () => setScanned(false), // Allow rescanning
						},
					],
				);
			}
		} catch (error) {
			console.error("Error scanning barcode:", error);
			Alert.alert("Error", "Terjadi kesalahan saat memindai barang.");
			setScanned(false); // Allow rescanning
		}
	};

	if (!permission) {
		// Camera permissions are still loading
		return (
			<View style={styles.center}>
				<Text style={styles.text}>Meminta izin kamera...</Text>
			</View>
		);
	}

	if (!permission.granted) {
		// Camera permissions are not granted yet
		return (
			<View style={styles.center}>
				<Text style={styles.text}>
					Kami memerlukan izin Anda untuk mengakses kamera
				</Text>
				<TouchableOpacity onPress={requestPermission} style={styles.button}>
					<Text style={styles.buttonText}>Berikan Izin</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#0f1419" />
			<View style={styles.header}>
				<Text style={styles.title}>Pemindai Barcode/QR</Text>
				<Text style={styles.subtitle}>Pindai barang untuk menambah ke keranjang</Text>
			</View>
			<View style={styles.scannerContainer}>
				<CameraView
					onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
					barcodeScannerSettings={{
						barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code39", "code93", "code128"],
					}}
					style={StyleSheet.absoluteFillObject}
					facing={facing} // Use facing state
					ref={scannerRef}
				/>
				<View style={styles.overlay}>
					<View style={styles.square} />
					<Text style={styles.scanText}>Arahkan kamera ke barcode</Text>
				</View>
			</View>

      <TouchableOpacity
                style={styles.cartButton}
                onPress={() => router.push({ pathname: "./CartScreen", params: { cartItems: cart } })}>
                <Text style={styles.cartButtonText}>
                    Lihat Keranjang ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                </Text>
            </TouchableOpacity>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginTop: StatusBar.currentHeight || 0,
		backgroundColor: "#0f1419",
	},
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#0f1419",
	},
	text: {
		color: "white",
		fontSize: 18,
		textAlign: "center",
		marginBottom: 10,
	},
	button: {
		backgroundColor: "#00d4ff",
		paddingVertical: 12,
		paddingHorizontal: 25,
		borderRadius: 8,
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
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
	scannerContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "black",
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		alignItems: "center",
	},
	square: {
		width: width * 0.7,
		height: width * 0.5,
		borderWidth: 2,
		borderColor: "#00d4ff",
		borderRadius: 10,
	},
	scanText: {
		color: "white",
		marginTop: 20,
		fontSize: 16,
	},
	cartButton: {
		backgroundColor: "#00d4ff",
		paddingVertical: 15,
		marginHorizontal: 20,
		borderRadius: 10,
		alignItems: "center",
		marginBottom: 20,
		marginTop: 10,
	},
	cartButtonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
	},
});