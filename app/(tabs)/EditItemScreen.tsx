// screens/EditItemScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
	Alert,
	Dimensions,
	SafeAreaView,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { deleteStock, getItemBySku, updateStock } from "../database";
import { RootStackParamList } from "./StockStack";

const { width } = Dimensions.get("window");

// Tipe rute untuk EditItemScreen
type EditItemScreenRouteProp = RouteProp<RootStackParamList, "EditItem">;

export default function EditItemScreen() {
	const navigation = useNavigation();
	const route = useRoute<EditItemScreenRouteProp>();
	const { itemId, itemSku } = route.params; // Menerima itemId dan itemSku dari navigasi

	const [namaBarang, setNamaBarang] = useState("");
	const [harga, setHarga] = useState("");
	const [stok, setStok] = useState("");
	const [sku, setSku] = useState(""); // Menambahkan state untuk SKU
	const [loading, setLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		const fetchItemDetails = async () => {
			setLoading(true);
			try {
				const item = await getItemBySku(itemSku); // Menggunakan getItemBySku karena Anda mengirim itemSku
				if (item && item.id === itemId) {
					// Verifikasi ID juga
					setNamaBarang(item.nama_barang);
					setHarga(item.harga.toString());
					setStok(item.stok.toString());
					setSku(item.sku); // Set SKU dari data yang diambil
				} else {
					Alert.alert("Error", "Barang tidak ditemukan atau SKU tidak cocok.");
					navigation.goBack();
				}
			} catch (error) {
				Alert.alert("Error", "Gagal memuat detail barang.");
				console.error("Error fetching item details:", error);
				navigation.goBack();
			} finally {
				setLoading(false);
			}
		};

		fetchItemDetails();
	}, [itemId, itemSku]); // Bergantung pada itemId dan itemSku

	const handleSaveChanges = async () => {
		if (!namaBarang || !harga || !stok || !sku) {
			Alert.alert("Validasi", "Semua bidang harus diisi.");
			return;
		}

		const parsedHarga = parseFloat(harga);
		const parsedStok = parseInt(stok);

		if (isNaN(parsedHarga) || isNaN(parsedStok)) {
			Alert.alert("Validasi", "Harga dan Stok harus berupa angka.");
			return;
		}
		if (parsedStok < 0) {
			Alert.alert("Validasi", "Stok tidak boleh kurang dari 0.");
			return;
		}

		setIsSaving(true);
		try {
			// Perbarui item menggunakan ID, nama_barang, SKU, harga, dan stok yang baru
			await updateStock(itemId, namaBarang, sku, parsedHarga, parsedStok);
			Alert.alert("Berhasil", "Barang berhasil diperbarui!");
			navigation.goBack(); // Kembali ke layar sebelumnya
		} catch (error) {
			Alert.alert("Error", "Gagal memperbarui barang.");
			console.error("Error updating item:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteItem = () => {
		Alert.alert(
			"Konfirmasi Hapus",
			`Apakah Anda yakin ingin menghapus barang "${namaBarang}"?`,
			[
				{ text: "Batal", style: "cancel" },
				{
					text: "Hapus",
					onPress: async () => {
						setIsDeleting(true);
						try {
							await deleteStock(itemId);
							Alert.alert("Berhasil", "Barang berhasil dihapus!");
							navigation.goBack(); // Kembali ke layar sebelumnya setelah dihapus
						} catch (error) {
							Alert.alert("Error", "Gagal menghapus barang.");
							console.error("Error deleting item:", error);
						} finally {
							setIsDeleting(false);
						}
					},
					style: "destructive",
				},
			]
		);
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<Text style={styles.loadingText}>Memuat detail barang...</Text>
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
					<View style={[styles.headerContainer, styles.liquidGlass]}>
						<LinearGradient
							colors={["rgba(59, 130, 246, 0.1)", "rgba(99, 102, 241, 0.05)"]}
							style={styles.headerGradient}
						>
							<Text style={styles.title}>Edit Barang</Text>
							<Text style={styles.subtitle}>
								Perbarui detail atau stok barang.
							</Text>
						</LinearGradient>
					</View>

					<View style={[styles.formContainer, styles.liquidGlass]}>
						<LinearGradient
							colors={["rgba(255, 255, 255, 0.6)", "rgba(255, 255, 255, 0.3)"]}
							style={styles.formGradient}
						>
							<View style={styles.inputGroup}>
								<Text style={styles.inputLabel}>Nama Barang</Text>
								<TextInput
									style={styles.input}
									value={namaBarang}
									onChangeText={setNamaBarang}
									placeholder="Nama Barang"
									placeholderTextColor="#64748b"
								/>
							</View>

							<View style={styles.inputGroup}>
								<Text style={styles.inputLabel}>SKU</Text>
								<TextInput
									style={styles.input}
									value={sku}
									onChangeText={setSku}
									placeholder="SKU"
									placeholderTextColor="#64748b"
								/>
							</View>

							<View style={styles.inputGroup}>
								<Text style={styles.inputLabel}>Harga (Rp)</Text>
								<TextInput
									style={styles.input}
									value={harga}
									onChangeText={setHarga}
									keyboardType="numeric"
									placeholder="Contoh: 15000"
									placeholderTextColor="#64748b"
								/>
							</View>

							<View style={styles.inputGroup}>
								<Text style={styles.inputLabel}>Stok</Text>
								<TextInput
									style={styles.input}
									value={stok}
									onChangeText={setStok}
									keyboardType="numeric"
									placeholder="Jumlah Stok"
									placeholderTextColor="#64748b"
								/>
							</View>

							<TouchableOpacity
								style={[styles.saveButton, styles.liquidGlass]}
								onPress={handleSaveChanges}
								disabled={isSaving}
							>
								<LinearGradient
									colors={["rgba(34, 197, 94, 0.1)", "rgba(34, 197, 94, 0.05)"]}
									style={styles.buttonGradient}
								>
									<Ionicons name="save-outline" size={24} color="#059669" />
									<Text style={styles.buttonText}>
										{isSaving ? "Menyimpan..." : "Simpan Perubahan"}
									</Text>
								</LinearGradient>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.deleteButton, styles.liquidGlass]}
								onPress={handleDeleteItem}
								disabled={isDeleting}
							>
								<LinearGradient
									colors={["rgba(239, 68, 68, 0.1)", "rgba(239, 68, 68, 0.05)"]}
									style={styles.buttonGradient}
								>
									<Ionicons name="trash-outline" size={24} color="#ef4444" />
									<Text style={styles.buttonText}>
										{isDeleting ? "Menghapus..." : "Hapus Barang"}
									</Text>
								</LinearGradient>
							</TouchableOpacity>
						</LinearGradient>
					</View>
				</ScrollView>
			</LinearGradient>
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
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f8fafc",
	},
	loadingText: {
		fontSize: 18,
		color: "#1e293b",
		fontWeight: "600",
	},
	headerContainer: {
		borderRadius: 20,
		marginBottom: 32,
		overflow: "hidden",
	},
	headerGradient: {
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
	formContainer: {
		borderRadius: 20,
		overflow: "hidden",
	},
	formGradient: {
		padding: 20,
	},
	inputGroup: {
		marginBottom: 15,
	},
	inputLabel: {
		fontSize: 16,
		color: "#1e293b",
		marginBottom: 8,
		fontWeight: "600",
	},
	input: {
		width: "100%",
		height: 50,
		backgroundColor: "rgba(255, 255, 255, 0.7)",
		borderRadius: 10,
		paddingHorizontal: 15,
		color: "#1e293b",
		fontSize: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.8)",
	},
	saveButton: {
		borderRadius: 15,
		marginTop: 20,
		overflow: "hidden",
	},
	deleteButton: {
		borderRadius: 15,
		marginTop: 15,
		overflow: "hidden",
	},
	buttonGradient: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 15,
		gap: 10,
	},
	buttonText: {
		color: "#1e293b",
		fontSize: 18,
		fontWeight: "bold",
	},
});
