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
	SafeAreaView, // Pastikan SafeAreaView sudah diimpor
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { Barang, deleteStock, getAllStock } from "../database";

const { width } = Dimensions.get("window");

type StockStackParamList = {
	StockManagement: undefined;
	AddItem: undefined;
	EditItem: { item: Barang };
};

export default function StockManagement() {
	const navigation = useNavigation<NavigationProp<StockStackParamList>>();

	const [items, setItems] = useState<Barang[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

	const [searchText, setSearchText] = useState("");
	const [sortOption, setSortOption] = useState("nama_barang");
	const [isFocus, setIsFocus] = useState(false);

	const [scanned, setScanned] = useState(false);
	const [showScanner, setShowScanner] = useState(false);
	const [cameraPermission, requestPermission] = useCameraPermissions();

	const sortOptions = [
		{ label: "Nama Barang", value: "nama_barang" },
		{ label: "SKU", value: "sku" },
		{ label: "Harga", value: "harga" },
		{ label: "Stok", value: "stok" },
	];

	const fetchItems = async () => {
		try {
			const fetchedItems = await getAllStock();
			setItems(fetchedItems);
		} catch (error) {
			Alert.alert("Error", "Gagal memuat data barang.");
			console.error("Error fetching items:", error);
		} finally {
			setLoading(false);
		}
	};

	useFocusEffect(
		useCallback(() => {
			setLoading(true);
			fetchItems();
			setActiveDropdown(null);
			setSearchText("");
		}, [])
	);

	const handleDelete = async (id: number) => {
		Alert.alert(
			"Konfirmasi Hapus",
			"Apakah Anda yakin ingin menghapus barang ini?",
			[
				{ text: "Batal", style: "cancel" },
				{
					text: "Hapus",
					onPress: async () => {
						try {
							await deleteStock(id);
							Alert.alert("Sukses", "Barang berhasil dihapus.");
							fetchItems();
						} catch (error) {
							Alert.alert("Error", "Gagal menghapus barang.");
							console.error("Error deleting item:", error);
						}
					},
				},
			]
		);
	};

	const handleEdit = (item: Barang) => {
		navigation.navigate("EditItem", { item });
	};

	const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
		setScanned(true);
		setSearchText(data);
		setShowScanner(false);
	};

	const filteredAndSortedItems = [...items]
		.filter(
			(item) =>
				item.nama_barang.toLowerCase().includes(searchText.toLowerCase()) ||
				item.sku.toLowerCase().includes(searchText.toLowerCase())
		)
		.sort((a, b) => {
			if (sortOption === "nama_barang") {
				return a.nama_barang.localeCompare(b.nama_barang);
			} else if (sortOption === "sku") {
				return a.sku.localeCompare(b.sku);
			} else if (sortOption === "harga") {
				return a.harga - b.harga;
			} else if (sortOption === "stok") {
				return a.stok - b.stok;
			}
			return 0;
		});

	const TableHeader = () => (
		<View style={styles.tableHeader}>
			<Text style={[styles.headerText, { flex: 2 }]}>Nama Barang</Text>
			<Text style={[styles.headerText, { flex: 2 }]}>SKU</Text>
			<Text style={[styles.headerText, { flex: 2.2 }]}>Harga</Text>
			<Text style={[styles.headerText, { flex: 1.5 }]}>Stok</Text>
			<Text style={[styles.headerText, { flex: 1.5 }]}>Aksi</Text>
		</View>
	);

	const renderItem = ({ item }: { item: Barang }) => (
		<View style={styles.tableRow}>
			<View style={[styles.cellContainer, { flex: 2 }]}>
				<Text style={styles.cellText} numberOfLines={2}>
					{item.nama_barang}
				</Text>
			</View>
			<View style={[styles.cellContainer, { flex: 2 }]}>
				<Text style={styles.cellText} numberOfLines={1}>
					{item.sku}
				</Text>
			</View>
			<View style={[styles.cellContainer, { flex: 2.2 }]}>
				<Text style={styles.cellText} numberOfLines={1}>
					Rp {item.harga}
				</Text>
			</View>
			<View style={[styles.cellContainer, { flex: 1.5 }]}>
				<Text style={styles.cellText} numberOfLines={1}>
					{item.stok}
				</Text>
			</View>
			<View
				style={[
					styles.cellContainer,
					{ flex: 1.5, alignItems: "center", justifyContent: "center" },
				]}
			>
				<TouchableOpacity
					style={styles.actionButton}
					onPress={() =>
						setActiveDropdown(activeDropdown === item.id ? null : item.id)
					}
				>
					<Text style={styles.actionButtonText}>Aksi</Text>
				</TouchableOpacity>
				{activeDropdown === item.id && (
					<View style={styles.dropdownMenu}>
						<TouchableOpacity
							style={styles.dropdownOption}
							onPress={() => {
								handleEdit(item);
								setActiveDropdown(null);
							}}
						>
							<Text style={styles.dropdownOptionText}>Edit</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.dropdownOptionDelete}
							onPress={() => {
								handleDelete(item.id);
								setActiveDropdown(null);
							}}
						>
							<Text style={styles.dropdownOptionText}>Hapus</Text>
						</TouchableOpacity>
					</View>
				)}
			</View>
		</View>
	);

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<Text style={styles.loadingText}>Memuat Data...</Text>
			</View>
		);
	}

	return (
		// Gunakan SafeAreaView di sini
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#0f1419" />
			<View style={styles.header}>
				<Text style={styles.title}>Manajemen Stok</Text>
				<Text style={styles.subtitle}>
					Kelola inventaris barang Anda dengan mudah.
				</Text>
			</View>

			<View style={styles.searchAndSortContainer}>
				<TextInput
					style={styles.searchInput}
					placeholder="Cari Nama atau SKU Barang"
					placeholderTextColor="#b0b3b8"
					onChangeText={setSearchText}
					value={searchText}
				/>
				<Dropdown
					style={[styles.dropdown, isFocus && { borderColor: "#007bff" }]}
					placeholderStyle={styles.placeholderStyle}
					selectedTextStyle={styles.selectedTextStyle}
					iconStyle={styles.iconStyle}
					data={sortOptions}
					search={false}
					maxHeight={300}
					labelField="label"
					valueField="value"
					placeholder={!isFocus ? "Urutkan Berdasarkan" : "..."}
					value={sortOption}
					onFocus={() => setIsFocus(true)}
					onBlur={() => setIsFocus(false)}
					onChange={(item) => {
						setSortOption(item.value);
						setIsFocus(false);
					}}
					renderRightIcon={() => (
						<AntDesign
							style={styles.icon}
							color={isFocus ? "#007bff" : "white"}
							name="downcircleo"
							size={20}
						/>
					)}
				/>
			</View>

			{/* New button container */}
			<View style={styles.actionButtonsContainer}>
				<TouchableOpacity
					style={styles.scanSearchButton} // Reusing previous scan button style
					onPress={() => {
						setScanned(false);
						setShowScanner(true);
					}}
				>
					<Text style={styles.scanSearchButtonText}>Scan Barcode</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.addButton}
					onPress={() => navigation.navigate("AddItem")}
				>
					<Text style={styles.addButtonText}>Tambah Barang</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.tableContainer}>
				<Text style={styles.listTitle}>
					Daftar Barang ({filteredAndSortedItems.length} entri)
				</Text>
				<View style={styles.table}>
					<FlatList
						data={filteredAndSortedItems}
						ListHeaderComponent={TableHeader}
						renderItem={renderItem}
						keyExtractor={(item) => item.id.toString()}
						stickyHeaderIndices={[0]} // This makes the header sticky
						ListEmptyComponent={
							<View style={styles.emptyContainer}>
								<Text style={styles.emptyText}>Tidak ada barang.</Text>
							</View>
						}
						ItemSeparatorComponent={() => <View style={styles.separator} />}
					/>
				</View>
			</View>

			{/* Scanner Modal */}
			<Modal
				animationType="slide"
				transparent={false}
				visible={showScanner}
				onRequestClose={() => {
					setShowScanner(false);
					setScanned(false);
				}}
			>
				{/* Permission check for camera */}
				{!cameraPermission || !cameraPermission.granted ? (
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
				) : (
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
				)}
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginTop: StatusBar.currentHeight || 0, // Adjust for status bar height
		marginBottom: 15 + (StatusBar.currentHeight || 0), // Add some bottom margin for better spacing, helps avoid bottom nav bar
		backgroundColor: "#0f1419", // Dark background
	},
	loadingContainer: {
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
		textAlign: "center",
	},
	searchAndSortContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		marginTop: 10,
		marginBottom: 10,
	},
	searchInput: {
		flex: 1,
		height: 40,
		backgroundColor: "rgba(255,255,255,0.05)",
		color: "white",
		paddingHorizontal: 12,
		borderRadius: 8,
		marginRight: 10,
		fontSize: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
	},
	dropdown: {
		height: 40,
		width: Dimensions.get("window").width * 0.35,
		borderColor: "rgba(255,255,255,0.2)",
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 8,
		backgroundColor: "rgba(255,255,255,0.05)",
	},
	placeholderStyle: {
		fontSize: 14,
		color: "#b0b3b8",
	},
	selectedTextStyle: {
		fontSize: 14,
		color: "white",
	},
	iconStyle: {
		width: 20,
		height: 20,
	},
	icon: {
		marginRight: 5,
	},
	actionButtonsContainer: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 10,
		marginBottom: 20,
		paddingHorizontal: 16,
		gap: 10,
	},
	addButton: {
		backgroundColor: "#007bff",
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		flex: 1,
		alignItems: "center",
	},
	addButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	scanSearchButton: {
		backgroundColor: "#28a745",
		paddingVertical: 12,
		paddingHorizontal: 15,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
	},
	scanSearchButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	tableContainer: {
		flex: 1,
		paddingHorizontal: 16,
		paddingBottom: 20,
		marginTop: 0,
	},
	listTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "white",
		marginBottom: 12,
	},
	table: {
		flex: 1,
		backgroundColor: "rgba(255, 255, 255, 0.03)", // Latar belakang tabel keseluruhan (bisa tetap semi-transparan)
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
		overflow: "hidden",
	},
	tableHeader: {
		flexDirection: "row",
		backgroundColor: "#1A2533", // Warna baru yang solid dan gelap, sesuaikan dengan tema Anda
		paddingVertical: 12,
		paddingHorizontal: 12,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0, 212, 255, 0.2)", // Garis bawah bisa tetap ada
	},
	headerText: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#00d4ff", // Warna teks header
		textAlign: "center",
	},
	tableRow: {
		flexDirection: "row",
		paddingVertical: 12,
		paddingHorizontal: 12,
		alignItems: "center",
		minHeight: 50,
		// Tidak perlu background di sini jika ingin menggunakan background dari styles.table
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
	actionButton: {
		backgroundColor: "#ffc107",
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 6,
		minWidth: 50,
	},
	actionButtonText: {
		fontSize: 12,
		color: "#333",
		textAlign: "center",
		fontWeight: "bold",
	},
	dropdownMenu: {
		position: "absolute",
		top: "100%",
		right: 0,
		backgroundColor: "#2c3e50",
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
		zIndex: 1000,
		minWidth: 100,
		overflow: "hidden",
	},
	dropdownOption: {
		paddingVertical: 10,
		paddingHorizontal: 15,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255, 255, 255, 0.05)",
	},
	dropdownOptionDelete: {
		paddingVertical: 10,
		paddingHorizontal: 15,
		backgroundColor: "#dc3545",
	},
	dropdownOptionText: {
		color: "white",
		fontSize: 14,
		textAlign: "left",
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
