import AntDesign from "@expo/vector-icons/AntDesign";
import {
	NavigationProp,
	useFocusEffect,
	useNavigation,
} from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useCallback, useState } from "react";
import {
<<<<<<< HEAD
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Barang, // Assuming this interface/type is defined elsewhere and now includes 'sku' and excludes 'kategori'
  deleteStock, // Assuming this is defined elsewhere
  getAllStock, // Assuming this is defined elsewhere
  initDB, // Assuming this is defined elsewhere
  updateStock, // Assuming this is defined elsewhere and now accepts 'sku' instead of 'kategori'
} from "../database";
=======
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
>>>>>>> a84df660859e6fb7690df806cadeb0166a91c5cf

type StockStackParamList = {
  StockManagement: undefined;
  AddItem: undefined;
  EditItem: { item: Barang };
};

export default function StockManagement() {
<<<<<<< HEAD
  // State variables for form inputs (nama, harga, stok are still relevant for potential AddItem/EditItem screens)
  const [nama, setNama] = useState("");
  // Removed 'kategori' state as it's no longer used
  const [harga, setHarga] = useState("");
  const [stok, setStok] = useState("");

  // State to hold the list of items
  const [items, setItems] = useState<Barang[]>([]);
  // State to manage loading status
  const [loading, setLoading] = useState(true);
  // State to track which item's dropdown is currently open
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Hook for navigation
  const navigation = useNavigation<NavigationProp<StockStackParamList>>();

  // Effect hook to initialize the database and load data when the component mounts
  useEffect(() => {
    const prepare = async () => {
      try {
        // Initialize the database
        await initDB();
        // Fetch all stock data
        const data = await getAllStock();
        // Set the fetched data to the items state
        setItems(data);
      } catch (error) {
        // Show an alert if database initialization fails
        Alert.alert("Error", "Gagal inisialisasi database");
        console.error("Database initialization error:", error);
      } finally {
        // Set loading to false regardless of success or failure
        setLoading(false);
      }
    };
    prepare();
  }, []); // Empty dependency array means this effect runs only once on mount

  // Function to handle adding a new item (not directly used in this component's UI,
  // but kept for completeness based on original code, adjusted for SKU)
  const handleAdd = async () => {
    // Assuming 'sku' would be passed here if this function were used for adding
    // For now, removing 'kategori' validation as it's no longer a field
    if (!nama || !harga || !stok) {
      Alert.alert("Validasi", "Semua field harus diisi");
      return;
    }
    try {
      // Assuming addStock now takes SKU instead of kategori, or SKU is handled differently
      // This part might need adjustment based on your actual `database.ts` implementation
      // For demonstration, we'll assume a placeholder for SKU if this function were to be used
      // await addStock(nama, "placeholder_sku", Number(harga), Number(stok));
      // const data = await getAllStock();
      // setItems(data);
      // setNama("");
      // setHarga("");
      // setStok("");
      console.warn(
        "handleAdd is not fully implemented for SKU in this component."
      );
    } catch (error) {
      Alert.alert("Error", "Gagal menambahkan data");
      console.error("Add item error:", error);
    }
  };

  // Function to handle deleting an item
  const handleDelete = async (id: number) => {
    try {
      // Delete the stock item by ID
      await deleteStock(id);
      // Refresh the item list after deletion
      const data = await getAllStock();
      setItems(data);
      // Close any open dropdown after deletion
      setOpenDropdownId(null);
    } catch (error) {
      Alert.alert("Error", "Gagal menghapus data");
      console.error("Delete item error:", error);
    }
  };

  // Function to handle adding +1 to an item's stock
  const handleAddStock = async (item: Barang) => {
    try {
      // Update the stock by incrementing by 1
      // Assuming updateStock now takes SKU instead of kategori
      await updateStock(
        item.id,
        item.nama_barang,
        item.sku,
        item.harga,
        item.stok + 1
      );
      // Refresh the item list after update
      const data = await getAllStock();
      setItems(data);
    } catch (error) {
      Alert.alert("Error", "Gagal mengupdate stok");
      console.error("Update stock error:", error);
    }
  };

  // Component for the table header row
  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerText, { flex: 3 }]}>Nama Barang</Text>
      <Text style={[styles.headerText, { flex: 2 }]}>SKU</Text>{" "}
      {/* Changed from Kategori to SKU */}
      <Text style={[styles.headerText, { flex: 1.5 }]}>Harga</Text>
      <Text style={[styles.headerText, { flex: 1 }]}>Stok</Text>
      <Text style={[styles.headerText, { flex: 2 }]}>Aksi</Text>
    </View>
  );

  // Component for each table row
  const TableRow = ({ item }: { item: Barang }) => (
    <View style={styles.tableRow}>
      {/* Item Name */}
      <View style={[styles.cellContainer, { flex: 3 }]}>
        <Text style={styles.cellText} numberOfLines={2}>
          {item.nama_barang}
        </Text>
      </View>
      {/* SKU */}
      <View style={[styles.cellContainer, { flex: 2 }]}>
        {" "}
        {/* New SKU column */}
        <Text style={styles.cellText} numberOfLines={1}>
          {item.sku}
        </Text>
      </View>
      {/* Price */}
      <View style={[styles.cellContainer, { flex: 1.5 }]}>
        <Text style={styles.priceText} numberOfLines={1}>
          {item.harga.toLocaleString()}
        </Text>
      </View>
      {/* Stock */}
      <View style={[styles.cellContainer, { flex: 1 }]}>
        <View style={styles.stockBadge}>
          <Text style={styles.stockText}>{item.stok}</Text>
        </View>
      </View>
      {/* Actions */}
      <View style={[styles.cellContainer, styles.actionCell, { flex: 2 }]}>
        {/* Action Dropdown Button */}
        <TouchableOpacity
          style={styles.actionDropdownButton}
          onPress={() =>
            setOpenDropdownId(openDropdownId === item.id ? null : item.id)
          }
        >
          <Text style={styles.actionDropdownText}>Aksi ▼</Text>
        </TouchableOpacity>

        {/* Dropdown Menu */}
        {openDropdownId === item.id && (
          <View style={styles.dropdownMenu}>
            {/* Edit Option */}
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => {
                navigation.navigate("EditItem", { item });
                setOpenDropdownId(null); // Close dropdown after action
              }}
            >
              <Text style={styles.dropdownOptionText}>✏️ Edit</Text>
            </TouchableOpacity>
            {/* Delete Option */}
            <TouchableOpacity
              style={[styles.dropdownOption, styles.dropdownOptionDelete]}
              onPress={() => {
                Alert.alert("Konfirmasi", `Hapus barang ${item.nama_barang}?`, [
                  { text: "Batal", style: "cancel" },
                  {
                    text: "Hapus",
                    style: "destructive",
                    onPress: () => handleDelete(item.id),
                  },
                ]);
                setOpenDropdownId(null); // Close dropdown after action
              }}
            >
              <Text style={styles.dropdownOptionText}>🗑️ Hapus</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  // Render loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Main component render
  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Manajemen Stok Barang</Text>
        <Text style={styles.subtitle}>Kelola inventori dengan mudah</Text>
      </View>

      {/* Add Item Button */}
      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={() => navigation.navigate("AddItem")}
      >
        <Text style={styles.buttonText}>+ Tambah Barang</Text>
      </TouchableOpacity>

      {/* Table Container */}
      <View style={styles.tableContainer}>
        <Text style={styles.listTitle}>
          Daftar Barang ({items.length} item)
        </Text>

        <View style={styles.table}>
          {/* Table Header */}
          <TableHeader />
          {/* FlatList for rendering table rows */}
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <TableRow item={item} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Tidak ada data barang.</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </View>
  );
=======
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
						stickyHeaderIndices={[0]}
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
>>>>>>> a84df660859e6fb7690df806cadeb0166a91c5cf
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: {
    flex: 1,
    backgroundColor: "#0f1419", // Dark background
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 212, 255, 0.3)", // Light blue border
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#b0b3b8", // Greyish text
  },
  buttonContainer: {
    backgroundColor: "#00d4ff", // Bright blue button
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: "#00d4ff", // Shadow for button
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 12,
  },
  table: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)", // Slightly transparent white background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)", // Light border
    overflow: "hidden", // Ensures children respect border radius
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 212, 255, 0.1)", // Transparent blue header background
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 212, 255, 0.2)", // Darker blue border
  },
  headerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#00d4ff", // Bright blue text
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    minHeight: 50,
    position: "relative", // Needed for absolute positioning of dropdown
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)", // Light separator line
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
  priceText: {
    fontSize: 13,
    color: "#4CAF50", // Green text for price
    fontWeight: "600",
    textAlign: "center",
  },
  stockBadge: {
    backgroundColor: "rgba(0, 212, 255, 0.2)", // Transparent blue badge background
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "center",
    minWidth: 30,
  },
  stockText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#00d4ff", // Bright blue text
    textAlign: "center",
  },
  actionCell: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8, // Increased gap for better spacing
  },
  addStockButton: {
    backgroundColor: "rgba(0, 212, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 28,
  },
  addStockText: {
    fontSize: 11,
    color: "#00d4ff",
    fontWeight: "bold",
    textAlign: "center",
  },
  actionDropdownButton: {
    backgroundColor: "rgba(255, 193, 7, 0.2)", // Yellowish background for action button
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 50,
  },
  actionDropdownText: {
    fontSize: 12,
    color: "#ffc107", // Yellow text
    textAlign: "center",
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%", // Position below the action button
    right: 0, // Align to the right of the action cell
    backgroundColor: "#2c3e50", // Dark background for dropdown
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000, // Ensure dropdown appears on top
    minWidth: 100,
    overflow: "hidden", // Ensure rounded corners
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  dropdownOptionDelete: {
    borderBottomWidth: 0, // No border for the last option
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f1419",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
  },
=======
	container: {
		flex: 1,
		backgroundColor: "#0f1419", // Dark background
		// paddingTop: StatusBar.currentHeight || 0, // Dihapus karena sudah ditangani oleh SafeAreaView
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
		marginTop: 16,
	},
	listTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "white",
		marginBottom: 12,
	},
	table: {
		flex: 1,
		backgroundColor: "rgba(255, 255, 255, 0.03)",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
		overflow: "hidden",
	},
	tableHeader: {
		flexDirection: "row",
		backgroundColor: "rgba(0, 212, 255, 0.1)",
		paddingVertical: 12,
		paddingHorizontal: 12,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0, 212, 255, 0.2)",
	},
	headerText: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#00d4ff",
		textAlign: "center",
	},
	tableRow: {
		flexDirection: "row",
		paddingVertical: 12,
		paddingHorizontal: 12,
		alignItems: "center",
		minHeight: 50,
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
>>>>>>> a84df660859e6fb7690df806cadeb0166a91c5cf
});
