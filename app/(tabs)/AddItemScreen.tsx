// screens/AddItemScreen.tsx
import { useNavigation } from "@react-navigation/native";
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
import { addStock } from "../database";

const { width } = Dimensions.get("window");

export default function AddItemScreen() {
	const [nama, setNama] = useState("");
	const [sku, setSku] = useState("");
	const [harga, setHarga] = useState("");
	const [stok, setStok] = useState("");

	const [scanned, setScanned] = useState(false);
	const [showScanner, setShowScanner] = useState(false);

	const [cameraPermission, requestPermission] = useCameraPermissions();

	const navigation = useNavigation();

	const handleBarCodeScanned = ({
		type,
		data,
	}: {
		type: string;
		data: string;
	}) => {
		setScanned(true);
		setSku(data);
		setShowScanner(false);
		Alert.alert(
			"Barcode Ditemukan",
			`Tipe: ${type}\nData: ${data}\nSKU telah diisi.`
		);
	};

	const handleAdd = async () => {
		if (!nama || !sku || !harga || !stok) {
			Alert.alert("Validasi", "Semua field harus diisi");
			return;
		}
		try {
			await addStock(nama, sku, Number(harga), Number(stok));
			Alert.alert("Sukses", "Barang berhasil ditambahkan");
			navigation.goBack();
		} catch (error) {
			Alert.alert("Error", "Gagal menambahkan data");
			console.error("Error adding item:", error);
		}
	};

	if (!cameraPermission) {
		return (
			<View style={styles.permissionContainer}>
				<Text style={styles.permissionText}>Memuat status izin kamera...</Text>
			</View>
		);
	}

	if (!cameraPermission.granted) {
		return (
			<View style={styles.permissionContainer}>
				<Text style={styles.permissionText}>
					Kami memerlukan izin Anda untuk mengakses kamera untuk pemindaian
					barcode.
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

	return (
		// Gunakan SafeAreaView di sini
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#0f1419" />
			<View style={styles.header}>
				<Text style={styles.title}>Tambah Barang Baru</Text>
				<Text style={styles.subtitle}>
					Isi detail barang baru dan scan barcode jika diperlukan.
				</Text>
			</View>

			<TouchableOpacity
				style={styles.scanButton}
				onPress={() => {
					setScanned(false);
					setShowScanner(true);
				}}
			>
				<Text style={styles.scanButtonText}>Scan Barcode SKU</Text>
			</TouchableOpacity>

			<TextInput
				style={styles.input}
				placeholder="Nama Barang"
				placeholderTextColor="#b0b3b8"
				value={nama}
				onChangeText={setNama}
			/>
			<TextInput
				style={styles.input}
				placeholder="SKU"
				placeholderTextColor="#b0b3b8"
				value={sku}
				onChangeText={setSku}
			/>
			<TextInput
				style={styles.input}
				placeholder="Harga"
				placeholderTextColor="#b0b3b8"
				value={harga}
				onChangeText={setHarga}
				keyboardType="numeric"
			/>
			<TextInput
				style={styles.input}
				placeholder="Stok"
				placeholderTextColor="#b0b3b8"
				value={stok}
				onChangeText={setStok}
				keyboardType="numeric"
			/>
			<TouchableOpacity style={styles.button} onPress={handleAdd}>
				<Text style={styles.buttonText}>Simpan</Text>
			</TouchableOpacity>

			<Modal
				animationType="slide"
				transparent={false}
				visible={showScanner}
				onRequestClose={() => {
					setShowScanner(false);
					setScanned(false);
				}}
			>
				<View style={styles.scannerContainer}>
					<CameraView
						onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
						barcodeScannerSettings={{
							barcodeTypes: [
								"ean13",
								"upc_a",
								"code128",
								"code39",
								"qr",
								"pdf417",
							],
						}}
						facing="back"
						style={StyleSheet.absoluteFillObject}
					/>
					<View style={styles.overlay}>
						<View style={styles.topOverlay} />
						<View style={styles.middleOverlay}>
							<View style={styles.leftOverlay} />
							<View style={styles.scanBox} />
							<View style={styles.rightOverlay} />
						</View>
						<View style={styles.bottomOverlay} />
					</View>
					<TouchableOpacity
						style={styles.closeScannerButton}
						onPress={() => {
							setShowScanner(false);
							setScanned(false);
						}}
					>
						<Text style={styles.closeScannerButtonText}>Tutup Scanner</Text>
					</TouchableOpacity>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#0f1419", // Dark background
		paddingHorizontal: 20,
		// paddingTop: StatusBar.currentHeight || 20, // Ini dipindahkan ke SafeAreaView
	},
	header: {
		alignItems: "center",
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0, 212, 255, 0.3)",
		marginBottom: 20,
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
		textAlign: "center",
	},
	input: {
		backgroundColor: "rgba(255,255,255,0.05)",
		color: "white",
		padding: 12,
		borderRadius: 8,
		marginBottom: 15,
		fontSize: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
	},
	button: {
		backgroundColor: "#007bff",
		padding: 15,
		borderRadius: 8,
		alignItems: "center",
		marginTop: 10,
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	scanButton: {
		backgroundColor: "#28a745",
		padding: 15,
		borderRadius: 8,
		alignItems: "center",
		marginBottom: 20,
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
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	middleOverlay: {
		flexDirection: "row",
		width: "100%",
		height: width * 0.7,
	},
	leftOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	scanBox: {
		width: width * 0.7,
		height: width * 0.7,
		borderColor: "#00d4ff",
		borderWidth: 2,
		borderRadius: 10,
	},
	rightOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	bottomOverlay: {
		flex: 1,
		width: "100%",
		backgroundColor: "rgba(0,0,0,0.5)",
	},
});
