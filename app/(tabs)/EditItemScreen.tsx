// screens/EditItemScreen.tsx
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";
import {
	Alert,
	Dimensions,
	Modal,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { updateStock } from "../database";

const { width } = Dimensions.get("window");

type EditItemRouteParams = {
	item: {
		id: number;
		nama_barang: string;
		sku: string;
		harga: number;
		stok: number;
	};
};

export default function EditItemScreen() {
	const route =
		useRoute<RouteProp<Record<string, EditItemRouteParams>, "EditItem">>();
	const { item } = route.params;

	const [nama, setNama] = useState(item.nama_barang);
	const [sku, setSku] = useState(item.sku);
	const [harga, setHarga] = useState(String(item.harga));
	const [stok, setStok] = useState(String(item.stok));

	const [scanned, setScanned] = useState(false);
	const [showScanner, setShowScanner] = useState(false);

	const navigation = useNavigation();
	const [permission, requestPermission] = useCameraPermissions();

	const handleBarCodeScanned = ({ data }: { data: string }) => {
		setScanned(true);
		setSku(data); // Set the scanned SKU
		setShowScanner(false);
		Alert.alert("SKU Scanned", `SKU: ${data}`);
	};

	const handleUpdate = async () => {
		if (!nama || !sku || !harga || !stok) {
			Alert.alert("Error", "Semua kolom harus diisi.");
			return;
		}

		const parsedHarga = parseFloat(harga);
		const parsedStok = parseInt(stok);

		if (isNaN(parsedHarga) || parsedHarga <= 0) {
			Alert.alert("Error", "Harga harus angka positif.");
			return;
		}

		if (isNaN(parsedStok) || parsedStok < 0) {
			Alert.alert("Error", "Stok harus angka non-negatif.");
			return;
		}

		try {
			await updateStock(item.id, nama, sku, parsedHarga, parsedStok);
			Alert.alert("Sukses", "Barang berhasil diperbarui!");
			navigation.goBack();
		} catch (error) {
			Alert.alert("Error", "Gagal memperbarui barang.");
			console.error("Error updating item:", error);
		}
	};

	if (!permission) {
		return (
			<View style={styles.permissionContainer}>
				<Text style={styles.permissionText}>
					Membutuhkan izin kamera untuk menggunakan pemindai.
				</Text>
				<TouchableOpacity
					onPress={requestPermission}
					style={styles.requestPermissionButton}
				>
					<Text style={styles.requestPermissionButtonText}>
						Berikan Izin Kamera
					</Text>
				</TouchableOpacity>
			</View>
		);
	}

	if (!permission.granted) {
		return (
			<View style={styles.permissionContainer}>
				<Text style={styles.permissionText}>Tidak ada akses ke kamera</Text>
				<TouchableOpacity
					onPress={requestPermission}
					style={styles.requestPermissionButton}
				>
					<Text style={styles.requestPermissionButtonText}>
						Berikan Izin Kamera
					</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#0f1419" />
			<View style={styles.content}>
				<Text style={styles.title}>Edit Barang</Text>

				<TextInput
					style={styles.input}
					placeholder="Nama Barang"
					placeholderTextColor="#999"
					value={nama}
					onChangeText={setNama}
				/>
				<View style={styles.skuInputContainer}>
					<TextInput
						style={[styles.input, { flex: 1, marginBottom: 0 }]}
						placeholder="SKU Barang"
						placeholderTextColor="#999"
						value={sku}
						onChangeText={setSku}
						autoCapitalize="none"
					/>
					<TouchableOpacity
						style={styles.scanButton}
						onPress={() => {
							setScanned(false); // Reset scanned state
							setShowScanner(true);
						}}
					>
						<Text style={styles.scanButtonText}>Scan</Text>
					</TouchableOpacity>
				</View>
				<TextInput
					style={styles.input}
					placeholder="Harga"
					placeholderTextColor="#999"
					keyboardType="numeric"
					value={harga}
					onChangeText={setHarga}
				/>
				<TextInput
					style={styles.input}
					placeholder="Stok"
					placeholderTextColor="#999"
					keyboardType="numeric"
					value={stok}
					onChangeText={setStok}
				/>

				<TouchableOpacity style={styles.button} onPress={handleUpdate}>
					<Text style={styles.buttonText}>Simpan Perubahan</Text>
				</TouchableOpacity>

				<Modal
					visible={showScanner}
					onRequestClose={() => setShowScanner(false)}
					animationType="slide"
				>
					<View style={styles.scannerContainer}>
						<CameraView
							onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
							barcodeScannerSettings={{
								barcodeTypes: ["qr", "ean13", "code128"],
							}}
							style={StyleSheet.absoluteFillObject}
						/>
						<View style={styles.overlay}>
							<View style={styles.topOverlay} />
							<View style={styles.middleOverlay}>
								<View style={styles.leftOverlay} />
								<View style={styles.scanArea} />
								<View style={styles.rightOverlay} />
							</View>
							<View style={styles.bottomOverlay} />
						</View>
						<TouchableOpacity
							style={styles.closeScannerButton}
							onPress={() => setShowScanner(false)}
						>
							<Text style={styles.closeScannerButtonText}>Tutup Pemindai</Text>
						</TouchableOpacity>
					</View>
				</Modal>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#0f1419",
	},
	content: {
		flex: 1,
		padding: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "white",
		marginBottom: 30,
	},
	input: {
		width: "100%",
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		borderRadius: 8,
		paddingHorizontal: 15,
		paddingVertical: 12,
		fontSize: 16,
		color: "white",
		marginBottom: 15,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.3)",
	},
	button: {
		backgroundColor: "#00d4ff",
		paddingVertical: 12,
		paddingHorizontal: 25,
		borderRadius: 8,
		marginTop: 20,
		width: "100%",
		alignItems: "center",
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	skuInputContainer: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
		marginBottom: 15,
	},
	scanButton: {
		backgroundColor: "#00d4ff",
		paddingVertical: 12,
		paddingHorizontal: 15,
		borderRadius: 8,
		marginLeft: 10,
	},
	scanButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	permissionContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#0f1419",
		padding: 20,
	},
	permissionText: {
		color: "white",
		fontSize: 18,
		textAlign: "center",
		marginBottom: 20,
	},
	requestPermissionButton: {
		backgroundColor: "#007bff",
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
	},
	requestPermissionButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	scannerContainer: {
		flex: 1,
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "black",
	},
	closeScannerButton: {
		position: "absolute",
		bottom: 40,
		backgroundColor: "#dc3545",
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		zIndex: 1,
	},
	closeScannerButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		alignItems: "center",
		justifyContent: "center",
	},
	topOverlay: {
		flex: 1,
		width: "100%",
		backgroundColor: "rgba(0,0,0,0.6)",
	},
	middleOverlay: {
		flexDirection: "row",
		width: "100%",
		height: width * 0.6, // Adjust as needed
	},
	leftOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.6)",
	},
	scanArea: {
		width: width * 0.6, // Adjust as needed
		height: width * 0.6,
		borderWidth: 2,
		borderColor: "#00d4ff",
		borderRadius: 10,
	},
	rightOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.6)",
	},
	bottomOverlay: {
		flex: 1,
		width: "100%",
		backgroundColor: "rgba(0,0,0,0.6)",
	},
});
