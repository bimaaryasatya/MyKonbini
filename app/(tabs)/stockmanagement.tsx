// app/stock-management.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
<<<<<<< HEAD
import React, { useEffect, useState } from "react";
import {
	Alert,
	FlatList,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getStockItems, initDB } from "../utils/database";

export default function StockManagementScreen() {
	const [searchQuery, setSearchQuery] = useState("");
	const [modalVisible, setModalVisible] = useState(false);
	const [selectedItem, setSelectedItem] = useState(null);
	const [isAddMode, setIsAddMode] = useState(false);

	// Form states
	const [itemName, setItemName] = useState("");
	const [itemPrice, setItemPrice] = useState("");
	const [itemStock, setItemStock] = useState("");
	const [itemCategory, setItemCategory] = useState("");

	const [stockData, setStockData] = useState([]);

	useEffect(() => {
		const initialize = async () => {
			try {
				await initDB();
				await loadStockItems();
			} catch (error) {
				console.error("DB initialization error:", error);
			}
		};
		initialize();
	}, []);

	const loadStockItems = async () => {
		try {
			const items = await getStockItems();
			// Convert lowStock from integer to boolean
			const formattedItems = items.map((item) => ({
				...item,
				lowStock: item.lowStock === 1,
			}));
			setStockData(formattedItems);
		} catch (error) {
			console.error("Failed to load stock items:", error);
		}
	};

	// Sample data - dalam aplikasi nyata, ini akan dari database

	const filteredData = stockData.filter(
		(item) =>
			item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.category.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const handleAddItem = () => {
		setIsAddMode(true);
		setSelectedItem(null);
		clearForm();
		setModalVisible(true);
	};

	const handleEditItem = (item) => {
		setIsAddMode(false);
		setSelectedItem(item);
		setItemName(item.name);
		setItemPrice(item.price.toString());
		setItemStock(item.stock.toString());
		setItemCategory(item.category);
		setModalVisible(true);
	};

	const handleDeleteItem = (item) => {
		console.log("Delete button pressed for item:", item);
		Alert.alert(
			"Hapus Item",
			`Apakah Anda yakin ingin menghapus ${item.name}?`,
			[
				{ text: "Batal", style: "cancel" },
				{
					text: "Hapus",
					style: "destructive",
					onPress: () => {
						setStockData(stockData.filter((i) => i.id !== item.id));
					},
				},
			]
		);
	};

	const handleSaveItem = () => {
		if (!itemName || !itemPrice || !itemStock || !itemCategory) {
			Alert.alert("Error", "Semua field harus diisi");
			return;
		}

		const newItem = {
			id: isAddMode ? Date.now() : selectedItem.id,
			name: itemName,
			category: itemCategory,
			price: parseInt(itemPrice),
			stock: parseInt(itemStock),
			lowStock: parseInt(itemStock) <= 10,
		};

		if (isAddMode) {
			setStockData([...stockData, newItem]);
		} else {
			setStockData(
				stockData.map((item) => (item.id === selectedItem.id ? newItem : item))
			);
		}

		setModalVisible(false);
		clearForm();
	};

	const clearForm = () => {
		setItemName("");
		setItemPrice("");
		setItemStock("");
		setItemCategory("");
	};

	const formatCurrency = (amount) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const renderStockItem = ({ item }) => (
		<View style={styles.stockItem}>
			<View style={styles.itemHeader}>
				<View style={styles.itemInfo}>
					<Text style={styles.itemName}>{item.name}</Text>
					<Text style={styles.itemCategory}>{item.category}</Text>
				</View>
				<View style={styles.stockBadge}>
					<Text
						style={[styles.stockText, item.lowStock && styles.lowStockText]}
					>
						{item.stock} pcs
					</Text>
				</View>
			</View>

			<View style={styles.itemDetails}>
				<Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
				{item.lowStock && (
					<View style={styles.lowStockWarning}>
						<Ionicons name="warning" size={16} color="#FF6B6B" />
						<Text style={styles.lowStockWarningText}>Stok Menipis</Text>
					</View>
				)}
			</View>

			<View style={styles.itemActions}>
				<TouchableOpacity
					style={styles.editButton}
					onPress={() => handleEditItem(item)}
				>
					<Ionicons name="pencil" size={18} color="#00d4ff" />
					<Text style={styles.editButtonText}>Edit</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.deleteButton}
					onPress={() => handleDeleteItem(item)}
				>
					<Ionicons name="trash" size={18} color="#FF6B6B" />
					<Text style={styles.deleteButtonText}>Hapus</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	return (
		<SafeAreaView style={styles.container}>
			{/* Header */}
			<LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.header}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<Ionicons name="arrow-back" size={24} color="white" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Manajemen Stok</Text>
				<TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
					<Ionicons name="add" size={24} color="white" />
				</TouchableOpacity>
			</LinearGradient>

			{/* Search Bar */}
			<View style={styles.searchContainer}>
				<View style={styles.searchBar}>
					<Ionicons name="search" size={20} color="#b0b3b8" />
					<TextInput
						style={styles.searchInput}
						placeholder="Cari barang atau kategori..."
						placeholderTextColor="#b0b3b8"
						value={searchQuery}
						onChangeText={setSearchQuery}
					/>
				</View>
			</View>

			{/* Stats */}
			<View style={styles.statsContainer}>
				<View style={styles.statCard}>
					<Ionicons name="cube" size={24} color="#00d4ff" />
					<Text style={styles.statNumber}>{stockData.length}</Text>
					<Text style={styles.statLabel}>Total Item</Text>
				</View>
				<View style={styles.statCard}>
					<Ionicons name="warning" size={24} color="#FF6B6B" />
					<Text style={styles.statNumber}>
						{stockData.filter((item) => item.lowStock).length}
					</Text>
					<Text style={styles.statLabel}>Stok Menipis</Text>
				</View>
				<View style={styles.statCard}>
					<Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
					<Text style={styles.statNumber}>
						{stockData.filter((item) => !item.lowStock).length}
					</Text>
					<Text style={styles.statLabel}>Stok Aman</Text>
				</View>
			</View>

			{/* Stock List */}
			<FlatList
				data={filteredData}
				renderItem={renderStockItem}
				keyExtractor={(item) => item.id.toString()}
				contentContainerStyle={styles.listContainer}
				showsVerticalScrollIndicator={false}
			/>

			{/* Add/Edit Modal */}
			<Modal
				animationType="slide"
				transparent={true}
				visible={modalVisible}
				onRequestClose={() => setModalVisible(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>
								{isAddMode ? "Tambah Item Baru" : "Edit Item"}
							</Text>
							<TouchableOpacity onPress={() => setModalVisible(false)}>
								<Ionicons name="close" size={24} color="white" />
							</TouchableOpacity>
						</View>

						<ScrollView style={styles.modalForm}>
							<View style={styles.formGroup}>
								<Text style={styles.formLabel}>Nama Item</Text>
								<TextInput
									style={styles.formInput}
									value={itemName}
									onChangeText={setItemName}
									placeholder="Masukkan nama item"
									placeholderTextColor="#b0b3b8"
								/>
							</View>

							<View style={styles.formGroup}>
								<Text style={styles.formLabel}>Kategori</Text>
								<TextInput
									style={styles.formInput}
									value={itemCategory}
									onChangeText={setItemCategory}
									placeholder="Masukkan kategori"
									placeholderTextColor="#b0b3b8"
								/>
							</View>

							<View style={styles.formGroup}>
								<Text style={styles.formLabel}>Harga (Rp)</Text>
								<TextInput
									style={styles.formInput}
									value={itemPrice}
									onChangeText={setItemPrice}
									placeholder="Masukkan harga"
									placeholderTextColor="#b0b3b8"
									keyboardType="numeric"
								/>
							</View>

							<View style={styles.formGroup}>
								<Text style={styles.formLabel}>Stok</Text>
								<TextInput
									style={styles.formInput}
									value={itemStock}
									onChangeText={setItemStock}
									placeholder="Masukkan jumlah stok"
									placeholderTextColor="#b0b3b8"
									keyboardType="numeric"
								/>
							</View>

							<TouchableOpacity
								style={styles.saveButton}
								onPress={handleSaveItem}
							>
								<Text style={styles.saveButtonText}>
									{isAddMode ? "Tambah Item" : "Simpan Perubahan"}
								</Text>
							</TouchableOpacity>
						</ScrollView>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#0f1419",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0, 212, 255, 0.3)",
	},
	backButton: {
		padding: 8,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "white",
	},
	addButton: {
		padding: 8,
	},
	searchContainer: {
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	searchBar: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.3)",
	},
	searchInput: {
		flex: 1,
		marginLeft: 12,
		fontSize: 16,
		color: "white",
	},
	statsContainer: {
		flexDirection: "row",
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	statCard: {
		flex: 1,
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 12,
		padding: 16,
		alignItems: "center",
		marginHorizontal: 4,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
	},
	statNumber: {
		fontSize: 20,
		fontWeight: "bold",
		color: "white",
		marginTop: 8,
	},
	statLabel: {
		fontSize: 12,
		color: "#b0b3b8",
		marginTop: 4,
		textAlign: "center",
	},
	listContainer: {
		paddingHorizontal: 20,
		paddingBottom: 20,
	},
	stockItem: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
	},
	itemHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 12,
	},
	itemInfo: {
		flex: 1,
	},
	itemName: {
		fontSize: 18,
		fontWeight: "bold",
		color: "white",
		marginBottom: 4,
	},
	itemCategory: {
		fontSize: 14,
		color: "#b0b3b8",
	},
	stockBadge: {
		backgroundColor: "rgba(0, 212, 255, 0.2)",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
	},
	stockText: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#00d4ff",
	},
	lowStockText: {
		color: "#FF6B6B",
	},
	itemDetails: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	itemPrice: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#4CAF50",
	},
	lowStockWarning: {
		flexDirection: "row",
		alignItems: "center",
	},
	lowStockWarningText: {
		fontSize: 12,
		color: "#FF6B6B",
		marginLeft: 4,
	},
	itemActions: {
		flexDirection: "row",
		justifyContent: "flex-end",
	},
	editButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(0, 212, 255, 0.1)",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		marginRight: 8,
	},
	editButtonText: {
		fontSize: 14,
		color: "#00d4ff",
		marginLeft: 4,
	},
	deleteButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255, 107, 107, 0.1)",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
	},
	deleteButtonText: {
		fontSize: 14,
		color: "#FF6B6B",
		marginLeft: 4,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.8)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContent: {
		backgroundColor: "#1a1a2e",
		borderRadius: 16,
		padding: 0,
		width: "90%",
		maxHeight: "80%",
	},
	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255, 255, 255, 0.1)",
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "white",
	},
	modalForm: {
		padding: 20,
	},
	formGroup: {
		marginBottom: 20,
	},
	formLabel: {
		fontSize: 16,
		color: "white",
		marginBottom: 8,
		fontWeight: "600",
	},
	formInput: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.3)",
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
		color: "white",
	},
	saveButton: {
		backgroundColor: "#00d4ff",
		borderRadius: 8,
		paddingVertical: 14,
		alignItems: "center",
		marginTop: 10,
	},
	saveButtonText: {
		fontSize: 16,
		fontWeight: "bold",
		color: "white",
	},
=======
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StockManagementScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);

  // Form states
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemStock, setItemStock] = useState("");
  const [itemCategory, setItemCategory] = useState("");

  // Sample data - dalam aplikasi nyata, ini akan dari database
  const [stockData, setStockData] = useState([
    {
      id: 1,
      name: "Kopi Arabica",
      category: "Minuman",
      price: 25000,
      stock: 50,
      lowStock: false,
    },
    {
      id: 2,
      name: "Nasi Goreng",
      category: "Makanan",
      price: 35000,
      stock: 25,
      lowStock: false,
    },
    {
      id: 3,
      name: "Es Teh Manis",
      category: "Minuman",
      price: 8000,
      stock: 5,
      lowStock: true,
    },
    {
      id: 4,
      name: "Ayam Bakar",
      category: "Makanan",
      price: 45000,
      stock: 15,
      lowStock: false,
    },
    {
      id: 5,
      name: "Jus Jeruk",
      category: "Minuman",
      price: 15000,
      stock: 3,
      lowStock: true,
    },
  ]);

  const filteredData = stockData.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddItem = () => {
    setIsAddMode(true);
    setSelectedItem(null);
    clearForm();
    setModalVisible(true);
  };

  const handleEditItem = (item) => {
    setIsAddMode(false);
    setSelectedItem(item);
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemStock(item.stock.toString());
    setItemCategory(item.category);
    setModalVisible(true);
  };

  const handleDeleteItem = (item) => {
    Alert.alert(
      "Hapus Item",
      `Apakah Anda yakin ingin menghapus ${item.name}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            setStockData(stockData.filter((i) => i.id !== item.id));
          },
        },
      ]
    );
  };

  const handleSaveItem = () => {
    if (!itemName || !itemPrice || !itemStock || !itemCategory) {
      Alert.alert("Error", "Semua field harus diisi");
      return;
    }

    const newItem = {
      id: isAddMode ? Date.now() : selectedItem.id,
      name: itemName,
      category: itemCategory,
      price: parseInt(itemPrice),
      stock: parseInt(itemStock),
      lowStock: parseInt(itemStock) <= 10,
    };

    if (isAddMode) {
      setStockData([...stockData, newItem]);
    } else {
      setStockData(
        stockData.map((item) => (item.id === selectedItem.id ? newItem : item))
      );
    }

    setModalVisible(false);
    clearForm();
  };

  const clearForm = () => {
    setItemName("");
    setItemPrice("");
    setItemStock("");
    setItemCategory("");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderStockItem = ({ item }) => (
    <View style={styles.stockItem}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
        </View>
        <View style={styles.stockBadge}>
          <Text
            style={[styles.stockText, item.lowStock && styles.lowStockText]}
          >
            {item.stock} pcs
          </Text>
        </View>
      </View>

      <View style={styles.itemDetails}>
        <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
        {item.lowStock && (
          <View style={styles.lowStockWarning}>
            <Ionicons name="warning" size={16} color="#FF6B6B" />
            <Text style={styles.lowStockWarningText}>Stok Menipis</Text>
          </View>
        )}
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditItem(item)}
        >
          <Ionicons name="pencil" size={18} color="#00d4ff" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item)}
        >
          <Ionicons name="trash" size={18} color="#FF6B6B" />
          <Text style={styles.deleteButtonText}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manajemen Stok</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#b0b3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari barang atau kategori..."
            placeholderTextColor="#b0b3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="cube" size={24} color="#00d4ff" />
          <Text style={styles.statNumber}>{stockData.length}</Text>
          <Text style={styles.statLabel}>Total Item</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="warning" size={24} color="#FF6B6B" />
          <Text style={styles.statNumber}>
            {stockData.filter((item) => item.lowStock).length}
          </Text>
          <Text style={styles.statLabel}>Stok Menipis</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>
            {stockData.filter((item) => !item.lowStock).length}
          </Text>
          <Text style={styles.statLabel}>Stok Aman</Text>
        </View>
      </View>

      {/* Stock List */}
      <FlatList
        data={filteredData}
        renderItem={renderStockItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isAddMode ? "Tambah Item Baru" : "Edit Item"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nama Item</Text>
                <TextInput
                  style={styles.formInput}
                  value={itemName}
                  onChangeText={setItemName}
                  placeholder="Masukkan nama item"
                  placeholderTextColor="#b0b3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Kategori</Text>
                <TextInput
                  style={styles.formInput}
                  value={itemCategory}
                  onChangeText={setItemCategory}
                  placeholder="Masukkan kategori"
                  placeholderTextColor="#b0b3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Harga (Rp)</Text>
                <TextInput
                  style={styles.formInput}
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  placeholder="Masukkan harga"
                  placeholderTextColor="#b0b3b8"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Stok</Text>
                <TextInput
                  style={styles.formInput}
                  value={itemStock}
                  onChangeText={setItemStock}
                  placeholder="Masukkan jumlah stok"
                  placeholderTextColor="#b0b3b8"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveItem}
              >
                <Text style={styles.saveButtonText}>
                  {isAddMode ? "Tambah Item" : "Simpan Perubahan"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1419",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 212, 255, 0.3)",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.3)",
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "white",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#b0b3b8",
    marginTop: 4,
    textAlign: "center",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stockItem: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: "#b0b3b8",
  },
  stockBadge: {
    backgroundColor: "rgba(0, 212, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stockText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#00d4ff",
  },
  lowStockText: {
    color: "#FF6B6B",
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  lowStockWarning: {
    flexDirection: "row",
    alignItems: "center",
  },
  lowStockWarningText: {
    fontSize: 12,
    color: "#FF6B6B",
    marginLeft: 4,
  },
  itemActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 212, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 14,
    color: "#00d4ff",
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    color: "#FF6B6B",
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 0,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  modalForm: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    color: "white",
    marginBottom: 8,
    fontWeight: "600",
  },
  formInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.3)",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "white",
  },
  saveButton: {
    backgroundColor: "#00d4ff",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
>>>>>>> 770254f (Stock Management Panel)
});
