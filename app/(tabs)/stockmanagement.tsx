import { NavigationProp, useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
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
} from "../database"; // Adjust this path if your database file is in a different location

// Define the navigation stack parameters
type StockStackParamList = {
	StockManagement: undefined;
	AddItem: undefined;
	EditItem: { item: Barang };
};

export default function StockManagement() {
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
				item.sku, // Use item.sku instead of item.kategori
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
							<Text style={styles.dropdownOptionText}>✏ Edit</Text>
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
							<Text style={styles.dropdownOptionText}>� Hapus</Text>
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
}

// Stylesheet for the component
const styles = StyleSheet.create({
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
});
