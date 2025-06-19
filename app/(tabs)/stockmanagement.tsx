import { Ionicons } from "@expo/vector-icons";
import {
	NavigationProp,
	useFocusEffect,
	useNavigation,
} from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
	Alert,
	Dimensions,
	FlatList,
	Modal,
	SafeAreaView,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { Barang, deleteStock, getAllStock } from "../database";
import { RootStackParamList } from "./StockStack";

const { width } = Dimensions.get("window");

// --- Definisikan lebar kolom sebagai konstanta untuk konsistensi ---
const COL_WIDTH_NAMA = 180; // Lebar untuk Nama Barang
const COL_WIDTH_SKU = 120; // Lebar untuk SKU
const COL_WIDTH_HARGA = 110; // Lebar untuk Harga
const COL_WIDTH_STOK = 80; // Lebar untuk Stok
const COL_WIDTH_AKSI = 80; // Lebar untuk Kolom Aksi

// Hitung total lebar tabel
const TOTAL_TABLE_WIDTH =
	COL_WIDTH_NAMA +
	COL_WIDTH_SKU +
	COL_WIDTH_HARGA +
	COL_WIDTH_STOK +
	COL_WIDTH_AKSI;
// --- End Definisi Lebar Kolom ---

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
	const [permission, requestPermission] = useCameraPermissions();
	const [scanned, setScanned] = useState(false);
	const [showScanner, setShowScanner] = useState(false);
	const [sortKey, setSortKey] = useState<SortKey>("nama_barang");
	const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

	const fetchItems = useCallback(async () => {
		setLoading(true);
		try {
			const allItems = await getAllStock();
			setItems(allItems);
		} catch (error) {
			Alert.alert("Error", "Gagal memuat data stok.");
			console.error("Error fetching stock:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			fetchItems();
		}, [fetchItems])
	);

	const handleDeleteItem = async (id: number, nama_barang: string) => {
		Alert.alert(
			"Konfirmasi Hapus",
			`Apakah Anda yakin ingin menghapus "${nama_barang}"?`,
			[
				{ text: "Batal", style: "cancel" },
				{
					text: "Hapus",
					onPress: async () => {
						try {
							await deleteStock(id);
							Alert.alert("Berhasil", `${nama_barang} berhasil dihapus.`);
							fetchItems(); // Refresh daftar setelah penghapusan
						} catch (error) {
							Alert.alert("Error", `Gagal menghapus ${nama_barang}.`);
							console.error("Error deleting item:", error);
						}
					},
					style: "destructive",
				},
			]
		);
	};

	const filteredItems = items
		.filter(
			(item) =>
				item.nama_barang.toLowerCase().includes(searchText.toLowerCase()) ||
				item.sku.toLowerCase().includes(searchText.toLowerCase())
		)
		.sort((a, b) => {
			let valA: any = a[sortKey];
			let valB: any = b[sortKey];

			if (typeof valA === "string" && typeof valB === "string") {
				valA = valA.toLowerCase();
				valB = valB.toLowerCase();
			}

			if (sortOrder === "asc") {
				return valA > valB ? 1 : valA < valB ? -1 : 0;
			} else {
				return valA < valB ? 1 : valA > valB ? -1 : 0;
			}
		});

	const handleSort = (key: SortKey) => {
		if (sortKey === key) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortKey(key);
			setSortOrder("asc");
		}
	};

	const getSortIcon = (key: SortKey) => {
		if (sortKey === key) {
			return sortOrder === "asc" ? "arrow-up-outline" : "arrow-down-outline";
		}
		return "swap-vertical-outline"; // Default icon
	};

	const renderItem = ({ item }: { item: Barang }) => (
		// itemRow kini memiliki padding horizontal total
		<View style={[styles.itemRow, styles.liquidGlass]}>
			<Text style={[styles.columnText, styles.columnNamaData]}>
				{item.nama_barang}
			</Text>
			<Text style={[styles.columnText, styles.columnSkuData]}>{item.sku}</Text>
			<Text style={[styles.columnText, styles.columnHargaData]}>
				Rp {item.harga.toLocaleString("id-ID")}
			</Text>
			<Text style={[styles.columnText, styles.columnStokData]}>
				{item.stok}
			</Text>

			<View style={styles.actionColumnData}>
				<TouchableOpacity
					style={styles.dropdownButton}
					onPress={() =>
						setActiveDropdown(activeDropdown === item.id ? null : item.id)
					}
				>
					<Ionicons name="ellipsis-vertical" size={24} color="#64748b" />
				</TouchableOpacity>

				{activeDropdown === item.id && (
					<View style={[styles.dropdownContainer, styles.liquidGlass]}>
						<TouchableOpacity
							style={styles.dropdownOption}
							onPress={() => {
								setActiveDropdown(null); // Tutup dropdown
								navigation.navigate("EditItem", {
									itemId: item.id,
									itemSku: item.sku,
								});
							}}
						>
							<Ionicons name="create-outline" size={20} color="#3b82f6" />
							<Text style={styles.dropdownOptionText}>Edit</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.dropdownOption}
							onPress={() => {
								setActiveDropdown(null); // Tutup dropdown
								handleDeleteItem(item.id, item.nama_barang);
							}}
						>
							<Ionicons name="trash-outline" size={20} color="#ef4444" />
							<Text style={styles.dropdownOptionText}>Hapus</Text>
						</TouchableOpacity>
					</View>
				)}
			</View>
		</View>
	);

	const handleBarCodeScanned = ({
		type,
		data,
	}: {
		type: string;
		data: string;
	}) => {
		setScanned(true);
		setSearchText(data); // Mengisi search text dengan hasil scan
		setShowScanner(false);
		Alert.alert(
			"Barcode Ditemukan",
			`Tipe: ${type}\nData: ${data}\nSKU telah diisi ke pencarian.`
		);
	};

	if (!permission) {
		return (
			<View style={styles.permissionContainer}>
				<Text style={styles.permissionText}>Memuat status izin kamera...</Text>
			</View>
		);
	}

	if (!permission.granted) {
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
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
			<LinearGradient
				colors={["#f8fafc", "#e2e8f0", "#cbd5e1"]}
				style={styles.gradient}
			>
				<View style={styles.floatingElement1} />
				<View style={styles.floatingElement2} />
				<View style={styles.floatingElement3} />

				<ScrollView
					contentContainerStyle={styles.scrollViewContent}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.headerContainer}>
						<View style={[styles.header, styles.liquidGlass]}>
							<Text style={styles.title}>Manajemen Stok</Text>
							<Text style={styles.subtitle}>
								Kelola inventaris barang Anda dengan mudah.
							</Text>
						</View>
					</View>

					<View style={[styles.searchContainer, styles.liquidGlass]}>
						<Ionicons
							name="search"
							size={20}
							color="#64748b"
							style={styles.searchIcon}
						/>
						<TextInput
							style={styles.searchInput}
							placeholder="Cari Barang (Nama/SKU)"
							placeholderTextColor="#64748b"
							value={searchText}
							onChangeText={setSearchText}
						/>
						<TouchableOpacity
							onPress={() => setShowScanner(true)}
							style={styles.scanButton}
						>
							<Ionicons name="scan-outline" size={24} color="#3b82f6" />
						</TouchableOpacity>
					</View>

					<TouchableOpacity
						style={[styles.mainActionButton, styles.liquidGlass]}
						onPress={() => navigation.navigate("AddItem")}
					>
						<LinearGradient
							colors={["rgba(34, 197, 94, 0.1)", "rgba(34, 197, 94, 0.05)"]}
							style={styles.mainActionButtonGradient}
						>
							<Ionicons name="add-circle-outline" size={32} color="#059669" />
							<Text style={styles.mainActionButtonText}>
								Tambah Barang Baru
							</Text>
						</LinearGradient>
					</TouchableOpacity>

					<View style={[styles.listContainer, styles.liquidGlass]}>
						<ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
							<View style={styles.tableContentContainer}>
								<View style={styles.tableHeader}>
									<TouchableOpacity
										onPress={() => handleSort("nama_barang")}
										style={styles.columnNamaHeader}
									>
										<Text style={styles.sortButtonText}>Nama</Text>
										<Ionicons
											name={getSortIcon("nama_barang")}
											size={16}
											color="#475569"
										/>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => handleSort("sku")}
										style={styles.columnSkuHeader}
									>
										<Text style={styles.sortButtonText}>SKU</Text>
										<Ionicons
											name={getSortIcon("sku")}
											size={16}
											color="#475569"
										/>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => handleSort("harga")}
										style={styles.columnHargaHeader}
									>
										<Text style={styles.sortButtonText}>Harga</Text>
										<Ionicons
											name={getSortIcon("harga")}
											size={16}
											color="#475569"
										/>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => handleSort("stok")}
										style={styles.columnStokHeader}
									>
										<Text style={styles.sortButtonText}>Stok</Text>
										<Ionicons
											name={getSortIcon("stok")}
											size={16}
											color="#475569"
										/>
									</TouchableOpacity>
									<View style={styles.actionHeader}>
										<Text style={styles.sortButtonText}>Aksi</Text>
									</View>
								</View>
								{loading ? (
									<Text style={styles.loadingText}>Memuat barang...</Text>
								) : filteredItems.length === 0 ? (
									<Text style={styles.noItemsText}>
										Tidak ada barang ditemukan.
									</Text>
								) : (
									<FlatList
										data={filteredItems}
										renderItem={renderItem}
										keyExtractor={(item) => item.id.toString()}
										contentContainerStyle={styles.flatListContent}
										scrollEnabled={false}
									/>
								)}
							</View>
						</ScrollView>
					</View>
				</ScrollView>
			</LinearGradient>

			{/* Barcode Scanner Modal */}
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
							<View style={styles.overlaySide} />
							<View style={styles.barcodeFrame} />
							<View style={styles.overlaySide} />
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
		backgroundColor: "#f8fafc",
	},
	gradient: {
		flex: 1,
	},
	floatingElement1: {
		position: "absolute",
		top: 100,
		right: -50,
		width: 200,
		height: 200,
		borderRadius: 100,
		backgroundColor: "rgba(59, 130, 246, 0.05)",
		zIndex: 0,
	},
	floatingElement2: {
		position: "absolute",
		top: 300,
		left: -80,
		width: 160,
		height: 160,
		borderRadius: 80,
		backgroundColor: "rgba(168, 85, 247, 0.05)",
		zIndex: 0,
	},
	floatingElement3: {
		position: "absolute",
		bottom: 200,
		right: -40,
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: "rgba(34, 197, 94, 0.05)",
		zIndex: 0,
	},
	scrollViewContent: {
		flexGrow: 1,
		paddingHorizontal: 20,
		paddingTop: (StatusBar.currentHeight || 0) + 20,
		paddingBottom: 40,
		zIndex: 1,
	},
	liquidGlass: {
		backgroundColor: "rgba(255, 255, 255, 0.25)",
		borderWidth: 1.5,
		borderColor: "rgba(255, 255, 255, 0.4)",
		shadowColor: "rgba(0, 0, 0, 0.1)",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.3,
		shadowRadius: 32,
		elevation: 8,
	},
	headerContainer: {
		marginBottom: 32,
	},
	header: {
		borderRadius: 20,
		padding: 24,
		alignItems: "center",
	},
	title: {
		fontSize: 28,
		fontWeight: "800",
		color: "#1e293b",
		marginBottom: 4,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		color: "#3b82f6",
		fontWeight: "600",
		textAlign: "center",
	},
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		borderRadius: 15,
		paddingHorizontal: 15,
		marginBottom: 20,
		height: 55,
	},
	searchIcon: {
		marginRight: 10,
	},
	searchInput: {
		flex: 1,
		height: "100%",
		color: "#1e293b",
		fontSize: 16,
	},
	scanButton: {
		marginLeft: 10,
		padding: 5,
	},
	mainActionButton: {
		borderRadius: 20,
		marginBottom: 25,
		overflow: "hidden",
	},
	mainActionButtonGradient: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 18,
		paddingHorizontal: 20,
		gap: 10,
	},
	mainActionButtonText: {
		color: "#1e293b",
		fontSize: 20,
		fontWeight: "bold",
	},
	listContainer: {
		borderRadius: 20,
		marginBottom: 20,
		overflow: "hidden", // Tetap hidden untuk container utama, tapi konten di dalamnya akan scroll
	},
	tableContentContainer: {
		minWidth: TOTAL_TABLE_WIDTH, // Menggunakan total lebar dari konstanta
	},
	tableHeader: {
		flexDirection: "row",
		// justifyContent: "space-around", // Dihapus karena width sudah fix
		alignItems: "center", // Pusatkan vertikal
		backgroundColor: "rgba(255, 255, 255, 0.5)",
		paddingVertical: 10,
		paddingHorizontal: 15, // Padding horizontal untuk kontainer header
		borderBottomWidth: 1.5,
		borderBottomColor: "rgba(255, 255, 255, 0.7)",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		overflow: "hidden",
	},
	// Column headers (for sort buttons)
	columnNamaHeader: {
		width: COL_WIDTH_NAMA,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 5,
		// paddingHorizontal: 5, // Dihapus, padding dari tableHeader
	},
	columnSkuHeader: {
		width: COL_WIDTH_SKU,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 5,
		// paddingHorizontal: 5,
	},
	columnHargaHeader: {
		width: COL_WIDTH_HARGA,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 5,
		// paddingHorizontal: 5,
	},
	columnStokHeader: {
		width: COL_WIDTH_STOK,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 5,
		// paddingHorizontal: 5,
	},
	actionHeader: {
		width: COL_WIDTH_AKSI,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 5,
		// paddingHorizontal: 5,
	},
	sortButtonText: {
		color: "#1e293b",
		fontWeight: "bold",
		fontSize: 14,
	},
	flatListContent: {
		paddingBottom: 10,
	},
	itemRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 15, // Padding horizontal untuk kontainer baris data
		borderRadius: 16,
		marginBottom: 10,
		overflow: "visible",
		zIndex: 1, // ZIndex default untuk setiap baris
		// justifyContent: "flex-start", // Dihapus, width sudah fix
	},
	columnText: {
		color: "#1e293b",
		fontSize: 14,
		textAlign: "left", // Default teks rata kiri di dalam kolom
	},
	// Styles untuk setiap kolom data item - Menggunakan lebar dari konstanta
	columnNamaData: {
		width: COL_WIDTH_NAMA,
		// paddingLeft dan paddingRight dihapus karena paddingHorizontal ada di itemRow
		fontWeight: "600",
		textAlign: "center", // Pusatkan teks di kolom Nama
	},
	columnSkuData: {
		width: COL_WIDTH_SKU,
	},
	columnHargaData: {
		width: COL_WIDTH_HARGA,
		textAlign: "center", // Pusatkan teks di kolom Harga
	},
	columnStokData: {
		width: COL_WIDTH_STOK,
		textAlign: "center", // Pusatkan teks di kolom Stok
	},
	actionColumnData: {
		width: COL_WIDTH_AKSI,
		position: "relative",
		zIndex: 2,
		alignItems: "center", // Pusatkan tombol ellipsis
		justifyContent: "center",
		// paddingRight dihapus
	},
	dropdownButton: {
		padding: 5,
	},
	dropdownContainer: {
		position: "absolute",
		top: 40,
		right: 0, // Rata kanan relatif terhadap kolom aksi
		backgroundColor: "#f8fafc",
		borderRadius: 12,
		paddingVertical: 8,
		paddingHorizontal: 5,
		shadowColor: "rgba(0, 0, 0, 0.2)",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 10,
		elevation: 10,
		zIndex: 1000,
		minWidth: 120,
	},
	dropdownOption: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 10,
		paddingHorizontal: 10,
		borderRadius: 8,
	},
	dropdownOptionText: {
		marginLeft: 8,
		fontSize: 16,
		color: "#1e293b",
		fontWeight: "600",
	},
	loadingText: {
		textAlign: "center",
		marginTop: 20,
		fontSize: 16,
		color: "#475569",
	},
	noItemsText: {
		textAlign: "center",
		marginTop: 20,
		fontSize: 16,
		color: "#475569",
	},
	permissionContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f8fafc",
		padding: 20,
	},
	permissionText: {
		color: "#1e293b",
		fontSize: 18,
		textAlign: "center",
		marginBottom: 20,
	},
	requestPermissionButton: {
		backgroundColor: "#3b82f6",
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
		backgroundColor: "#dc2626",
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 12,
		zIndex: 1,
	},
	closeScannerButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "700",
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
		height: width * 0.6,
	},
	overlaySide: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.6)",
	},
	barcodeFrame: {
		width: width * 0.7,
		borderColor: "#3b82f6",
		borderWidth: 3,
		borderRadius: 16,
	},
	bottomOverlay: {
		flex: 1,
		width: "100%",
		backgroundColor: "rgba(0,0,0,0.6)",
	},
});
