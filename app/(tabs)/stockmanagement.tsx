import AntDesign from "@expo/vector-icons/AntDesign";
import {
	NavigationProp,
	useFocusEffect,
	useNavigation,
} from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useCallback, useState } from "react";
import {
	Alert,
	Dimensions,
	FlatList,
	Modal,
	SafeAreaView,
	ScrollView, // Pastikan SafeAreaView sudah diimpor
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { Barang, deleteStock, getAllStock } from "../database";
import { RootStackParamList } from "./StockStack"; // Import RootStackParamList

const { width } = Dimensions.get("window");

// Perbarui tipe untuk navigation prop
type StockManagementNavigationProp = NavigationProp<
	RootStackParamList,
	"StockManagement"
>;

type SortKey = "nama_barang" | "sku" | "harga" | "stok";
type SortOrder = "asc" | "desc";

export default function StockManagement() {
	const navigation = useNavigation<StockManagementNavigationProp>();

	const [items, setItems] = useState<Barang[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

	const [searchText, setSearchText] = useState("");
	// Menghapus sortOption dan isFocus karena akan diganti dengan sortColumn dan sortOrder
	// const [sortOption, setSortOption] = useState<SortKey>("nama_barang");
	// const [isFocus, setIsFocus] = useState(false);

	const [permission, requestPermission] = useCameraPermissions();
	const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
	const [showScanner, setShowScanner] = useState(false);

	const [sortColumn, setSortColumn] = useState<SortKey | null>(null);
	const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

	const fetchItems = useCallback(async () => {
		setLoading(true);
		try {
			const allItems = await getAllStock();
			let filteredItems = allItems.filter(
				(item) =>
					item.nama_barang.toLowerCase().includes(searchText.toLowerCase()) ||
					item.sku.toLowerCase().includes(searchText.toLowerCase())
			);

			let sortedItems = [...filteredItems]; // Buat salinan untuk diurutkan

			if (sortColumn) {
				sortedItems.sort((a, b) => {
					let valA: any = a[sortColumn];
					let valB: any = b[sortColumn];

					// Penanganan khusus untuk string vs. number
					if (typeof valA === "string" && typeof valB === "string") {
						return sortOrder === "asc"
							? valA.localeCompare(valB)
							: valB.localeCompare(valA);
					} else {
						// Asumsi harga dan stok adalah number
						return sortOrder === "asc" ? valA - valB : valB - valA;
					}
				});
			}

			setItems(sortedItems);
		} catch (error) {
			Alert.alert("Error", "Gagal memuat daftar barang.");
			console.error("Error fetching items:", error);
		} finally {
			setLoading(false);
		}
	}, [searchText, sortColumn, sortOrder]); // Tambahkan dependensi sortColumn dan sortOrder

	useFocusEffect(
		useCallback(() => {
			fetchItems();
		}, [fetchItems])
	);

	const handleDelete = async (id: number) => {
		Alert.alert(
			"Konfirmasi Hapus",
			"Apakah Anda yakin ingin menghapus barang ini?",
			[
				{
					text: "Batal",
					style: "cancel",
				},
				{
					text: "Hapus",
					onPress: async () => {
						try {
							await deleteStock(id);
							Alert.alert("Berhasil", "Barang berhasil dihapus.");
							fetchItems(); // Refresh daftar setelah penghapusan
						} catch (error) {
							Alert.alert("Error", "Gagal menghapus barang.");
							console.error("Error deleting item:", error);
						}
					},
				},
			],
			{ cancelable: false }
		);
	};

	const handleBarcodeScanned = ({ data }: { data: string }) => {
		setScannedBarcode(data);
		setShowScanner(false);
		setSearchText(data); // Otomatis mencari SKU yang di-scan
	};

	if (showScanner) {
		if (!permission) {
			return <View style={styles.permissionContainer} />;
		}

		if (!permission.granted) {
			return (
				<View style={styles.permissionContainer}>
					<Text style={styles.permissionText}>
						Kami memerlukan izin kamera untuk memindai barcode.
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
			<Modal
				animationType="slide"
				transparent={false}
				visible={showScanner}
				onRequestClose={() => setShowScanner(false)}
			>
				<SafeAreaView style={styles.scannerContainer}>
					<StatusBar barStyle="light-content" backgroundColor="black" />
					<CameraView
						onBarcodeScanned={scannedBarcode ? undefined : handleBarcodeScanned}
						barcodeScannerSettings={{
							barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr"],
						}}
						style={StyleSheet.absoluteFillObject}
					/>
					{scannedBarcode && (
						<View style={styles.scanResultOverlay}>
							<Text style={styles.scanResultText}>
								Barcode Terdeteksi: {scannedBarcode}
							</Text>
							<TouchableOpacity
								style={styles.scanAgainButton}
								onPress={() => setScannedBarcode(null)}
							>
								<Text style={styles.scanAgainButtonText}>Pindai Lagi</Text>
							</TouchableOpacity>
						</View>
					)}
					<View style={styles.overlay}>
						<View style={styles.topOverlay} />
						<View style={styles.middleOverlay}>
							<View style={styles.overlaySide} />
							<View style={styles.barcodeFrame} />
							<View style={styles.overlaySide} />
						</View>
						<View style={styles.bottomOverlay} />
					</View>
					<TouchableOpacity
						style={styles.closeScannerButton}
						onPress={() => setShowScanner(false)}
					>
						<Text style={styles.closeScannerButtonText}>Tutup Pemindai</Text>
					</TouchableOpacity>
				</SafeAreaView>
			</Modal>
		);
	}

	const handleSort = (column: SortKey) => {
		if (sortColumn === column) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortColumn(column);
			setSortOrder("asc");
		}
	};

	const getSortIcon = (column: SortKey) => {
		if (sortColumn === column) {
			return sortOrder === "asc" ? (
				<AntDesign
					name="caretup"
					size={12}
					color="#00d4ff"
					style={styles.sortIcon}
				/>
			) : (
				<AntDesign
					name="caretdown"
					size={12}
					color="#00d4ff"
					style={styles.sortIcon}
				/>
			);
		}
		return null;
	};

	const renderItem = ({ item }: { item: Barang }) => (
		<View style={styles.tableRow}>
			<Text style={[styles.tableCell, { width: width * 0.25 }]}>
				{item.nama_barang}
			</Text>
			<Text style={[styles.tableCell, { width: width * 0.2 }]}>{item.sku}</Text>
			<Text
				style={[styles.tableCell, { width: width * 0.2, textAlign: "right" }]}
			>
				Rp {item.harga.toLocaleString("id-ID")}
			</Text>
			<Text
				style={[styles.tableCell, { width: width * 0.15, textAlign: "center" }]}
			>
				{item.stok}
			</Text>
			<View style={[styles.actionCell, { width: width * 0.2 }]}>
				<TouchableOpacity
					onPress={() =>
						setActiveDropdown(activeDropdown === item.id ? null : item.id)
					}
					style={styles.actionButton}
				>
					<AntDesign name="ellipsis1" size={24} color="#00d4ff" />
				</TouchableOpacity>
				{activeDropdown === item.id && (
					<View style={styles.dropdownMenu}>
						<TouchableOpacity
							style={styles.dropdownItem}
							onPress={() => {
								navigation.navigate("EditItem", {
									item: item,
								});
								setActiveDropdown(null);
							}}
						>
							<Text style={styles.dropdownItemText}>Edit</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.dropdownItem}
							onPress={() => {
								handleDelete(item.id);
								setActiveDropdown(null);
							}}
						>
							<Text style={styles.dropdownItemText}>Hapus</Text>
						</TouchableOpacity>
					</View>
				)}
			</View>
		</View>
	);

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
			<View style={styles.header}>
				<Text style={styles.title}>Manajemen Stok</Text>
				<Text style={styles.subtitle}>Kelola daftar barang Anda</Text>
			</View>

			<View style={styles.searchContainer}>
				<TextInput
					style={styles.searchInput}
					placeholder="Cari barang (nama/sku)..."
					placeholderTextColor="#b0b3b8"
					value={searchText}
					onChangeText={setSearchText}
				/>
				<TouchableOpacity
					style={styles.scanButton}
					onPress={() => setShowScanner(true)}
				>
					<AntDesign name="barcode" size={24} color="white" />
				</TouchableOpacity>
			</View>

			{/* Dropdown sortOption akan dihapus, pengurutan akan dilakukan dengan mengklik header */}
			{/*
			<Dropdown
				style={[styles.dropdown, isFocus && { borderColor: "blue" }]}
				placeholderStyle={styles.placeholderStyle}
				selectedTextStyle={styles.selectedTextStyle}
				inputSearchStyle={styles.inputSearchStyle}
				iconStyle={styles.iconStyle}
				data={[
					{ label: "Nama Barang", value: "nama_barang" },
					{ label: "Stok", value: "stok" },
					{ label: "Harga", value: "harga" },
				]}
				maxHeight={300}
				labelField="label"
				valueField="value"
				placeholder={!isFocus ? "Urutkan berdasarkan..." : "..."}
				value={sortOption}
				onFocus={() => setIsFocus(true)}
				onBlur={() => setIsFocus(false)}
				onChange={(item) => {
					setSortOption(item.value as SortKey);
					setIsFocus(false);
				}}
			/>
			*/}

			<ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
				<View style={styles.table}>
					<View style={styles.tableHeader}>
						<TouchableOpacity
							style={[styles.headerCell, { width: width * 0.25 }]}
							onPress={() => handleSort("nama_barang")}
						>
							<Text style={styles.headerText}>Nama Barang</Text>
							{getSortIcon("nama_barang")}
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.headerCell, { width: width * 0.2 }]}
							onPress={() => handleSort("sku")}
						>
							<Text style={styles.headerText}>SKU</Text>
							{getSortIcon("sku")}
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.headerCell, { width: width * 0.2 }]}
							onPress={() => handleSort("harga")}
						>
							<Text style={styles.headerText}>Harga</Text>
							{getSortIcon("harga")}
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.headerCell, { width: width * 0.15 }]}
							onPress={() => handleSort("stok")}
						>
							<Text style={styles.headerText}>Stok</Text>
							{getSortIcon("stok")}
						</TouchableOpacity>
						<View style={[styles.headerCell, { width: width * 0.2 }]}>
							<Text style={styles.headerText}>Aksi</Text>
						</View>
					</View>
					{loading ? (
						<Text style={styles.loadingText}>Memuat data...</Text>
					) : items.length === 0 ? (
						<Text style={styles.emptyText}>Tidak ada barang tersedia.</Text>
					) : (
						<FlatList
							data={items}
							renderItem={renderItem}
							keyExtractor={(item) => item.id.toString()}
							contentContainerStyle={styles.tableContent}
						/>
					)}
				</View>
			</ScrollView>

			<TouchableOpacity
				style={styles.addButton}
				onPress={() => navigation.navigate("AddItem")}
			>
				<AntDesign name="pluscircle" size={24} color="white" />
				<Text style={styles.addButtonText}>Tambah Barang Baru</Text>
			</TouchableOpacity>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#0f1419",
		paddingTop: StatusBar.currentHeight || 0, // Tambahkan ruang di bagian atas
		marginBottom: 15 + (StatusBar.currentHeight || 0), // Tambahkan ruang di bagian bawah
	},
	header: {
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0, 212, 255, 0.3)",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "white",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 16,
		color: "#b0b3b8",
	},
	searchContainer: {
		flexDirection: "row",
		paddingHorizontal: 16,
		marginTop: 16,
		marginBottom: 10,
		alignItems: "center",
	},
	searchInput: {
		flex: 1,
		height: 50,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		borderRadius: 10,
		paddingHorizontal: 15,
		fontSize: 16,
		color: "white",
		marginRight: 10,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.3)",
	},
	scanButton: {
		backgroundColor: "#00d4ff",
		borderRadius: 10,
		padding: 13,
		justifyContent: "center",
		alignItems: "center",
	},
	// Dropdown styles (tetap ada meskipun dropdown untuk sorting dihapus, mungkin digunakan di tempat lain)
	dropdown: {
		height: 50,
		borderColor: "gray",
		borderWidth: 0.5,
		borderRadius: 8,
		paddingHorizontal: 8,
		marginHorizontal: 16,
		marginTop: 10,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
	},
	icon: {
		marginRight: 5,
	},
	placeholderStyle: {
		fontSize: 16,
		color: "#b0b3b8",
	},
	selectedTextStyle: {
		fontSize: 16,
		color: "white",
	},
	iconStyle: {
		width: 20,
		height: 20,
	},
	inputSearchStyle: {
		height: 40,
		fontSize: 16,
	},
	table: {
		flex: 1,
		backgroundColor: "rgba(255, 255, 255, 0.03)",
		borderRadius: 12,
		marginHorizontal: 16,
		marginTop: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
	},
	tableHeader: {
		flexDirection: "row",
		backgroundColor: "rgba(0, 212, 255, 0.1)",
		paddingVertical: 12,
		paddingHorizontal: 12,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0, 212, 255, 0.2)",
	},
	headerCell: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 4,
	},
	headerText: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#00d4ff",
		textAlign: "center",
	},
	sortIcon: {
		marginLeft: 5,
	},
	tableRow: {
		flexDirection: "row",
		paddingVertical: 12,
		paddingHorizontal: 12,
		alignItems: "center",
		minHeight: 50,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255, 255, 255, 0.05)",
	},
	tableCell: {
		fontSize: 13,
		color: "white",
		paddingHorizontal: 4,
		// textAlign: "center", // Hapus atau timpa ini jika ingin rata kiri/kanan spesifik
	},
	actionCell: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		position: "relative",
	},
	actionButton: {
		padding: 5,
	},
	dropdownMenu: {
		position: "absolute",
		right: 0,
		top: "100%", // Tampilkan di bawah tombol
		backgroundColor: "#1e2a38",
		borderRadius: 8,
		elevation: 5,
		zIndex: 10,
		width: 100, // Lebar dropdown menu
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.3)",
	},
	dropdownItem: {
		padding: 10,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255, 255, 255, 0.05)",
	},
	dropdownItemText: {
		color: "white",
		textAlign: "center",
		fontSize: 14,
	},
	tableContent: {
		paddingBottom: 20, // Untuk memberikan ruang di bagian bawah FlatList
	},
	loadingText: {
		color: "#b0b3b8",
		textAlign: "center",
		paddingVertical: 20,
		fontSize: 16,
	},
	emptyText: {
		color: "#b0b3b8",
		textAlign: "center",
		paddingVertical: 20,
		fontSize: 16,
	},
	addButton: {
		flexDirection: "row",
		backgroundColor: "#28a745",
		paddingVertical: 15,
		paddingHorizontal: 20,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
		margin: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	addButtonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
		marginLeft: 10,
	},
	// Scanner styles - tidak ada perubahan, tetap seperti semula
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
		height: width * 0.6, // Ukuran frame barcode
	},
	overlaySide: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.6)",
	},
	barcodeFrame: {
		width: width * 0.7, // Lebar frame barcode
		borderColor: "#00d4ff",
		borderWidth: 2,
		borderRadius: 10,
	},
	bottomOverlay: {
		flex: 1,
		width: "100%",
		backgroundColor: "rgba(0,0,0,0.6)",
	},
	scanResultOverlay: {
		position: "absolute",
		bottom: 100,
		backgroundColor: "rgba(0,0,0,0.7)",
		padding: 15,
		borderRadius: 10,
		alignItems: "center",
		zIndex: 1,
	},
	scanResultText: {
		color: "white",
		fontSize: 16,
		marginBottom: 10,
	},
	scanAgainButton: {
		backgroundColor: "#007bff",
		paddingVertical: 10,
		paddingHorizontal: 15,
		borderRadius: 8,
	},
	scanAgainButtonText: {
		color: "white",
		fontSize: 14,
		fontWeight: "bold",
	},
});
