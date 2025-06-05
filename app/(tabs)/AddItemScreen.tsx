// screens/AddItemScreen.tsx
import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";
import {
	Alert,
	Dimensions,
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
import { addStock, Barang, getItemBySku, updateStock } from "../database"; // Import fungsi yang diperlukan

const { width } = Dimensions.get("window");

// Interface untuk item yang akan dimutasi (sementara)
interface BarangMutasi {
	tempId: number; // ID sementara untuk pengelolaan di UI
	id?: number; // ID dari DB jika sudah ada
	nama_barang: string;
	sku: string;
	harga: number;
	stok_sekarang: number; // Stok yang ada di DB (0 jika baru)
	jumlah_mutasi: number; // Jumlah yang akan ditambahkan/dikurangi
	is_new: boolean; // True jika barang baru, false jika update
}

export default function AddItemScreen() {
	const [currentSkuInput, setCurrentSkuInput] = useState("");
	const [mutationAmount, setMutationAmount] = useState("");
	const [namaBarangInput, setNamaBarangInput] = useState(""); // Untuk nama barang baru
	const [hargaInput, setHargaInput] = useState(""); // Untuk harga barang baru

	const [scanned, setScanned] = useState(false);
	const [showScanner, setShowScanner] = useState(false);
	const [showSkuInputModal, setShowSkuInputModal] = useState(false);
	const [showMutationDetailModal, setShowMutationDetailModal] = useState(false);
	const [showBatchConfirmationModal, setShowBatchConfirmationModal] =
		useState(false);

	const [cameraPermission, requestPermission] = useCameraPermissions();

	const navigation = useNavigation();

	// State untuk menyimpan daftar barang yang akan dimutasi
	const [itemsToMutate, setItemsToMutate] = useState<BarangMutasi[]>([]);
	// State untuk item yang sedang diproses di modal mutasi
	const [selectedItemForMutation, setSelectedItemForMutation] =
		useState<Barang | null>(null);
	const [isNewItem, setIsNewItem] = useState(false);
	// Counter untuk ID sementara agar unik di UI sebelum disimpan ke DB
	const [tempIdCounter, setTempIdCounter] = useState(0);

	const handleBarCodeScanned = ({
		type,
		data,
	}: {
		type: string;
		data: string;
	}) => {
		setScanned(true);
		setCurrentSkuInput(data);
		setShowScanner(false);
		Alert.alert(
			"Barcode Ditemukan",
			`Tipe: ${type}\nData: ${data}\nSKU telah diisi.`
		);
		// Langsung proses SKU setelah discan
		setTimeout(() => handleSkuEntered(data), 500); // Beri sedikit delay untuk Alert
	};

	const handleSkuEntered = async (sku: string) => {
		setShowSkuInputModal(false); // Tutup modal input SKU
		setCurrentSkuInput(sku); // Set SKU yang aktif

		try {
			const item = await getItemBySku(sku);
			if (item) {
				setSelectedItemForMutation(item);
				setIsNewItem(false); // Item sudah ada
				setNamaBarangInput(item.nama_barang); // Isi field dengan data yang ada
				setHargaInput(item.harga.toString());
			} else {
				setSelectedItemForMutation(null); // Tidak ada item yang dipilih
				setIsNewItem(true); // Ini barang baru
				setNamaBarangInput(""); // Kosongkan untuk input baru
				setHargaInput("");
			}
			setMutationAmount(""); // Kosongkan jumlah mutasi
			setShowMutationDetailModal(true); // Tampilkan modal detail mutasi
		} catch (error) {
			Alert.alert("Error", "Gagal mencari barang.");
			console.error("Error fetching item by SKU:", error);
		}
	};

	const handleAddMutationToList = () => {
		if (
			!mutationAmount ||
			isNaN(Number(mutationAmount)) ||
			Number(mutationAmount) === 0
		) {
			Alert.alert(
				"Validasi",
				"Jumlah mutasi harus diisi angka dan tidak boleh 0."
			);
			return;
		}
		if (
			isNewItem &&
			(!namaBarangInput || !hargaInput || isNaN(Number(hargaInput)))
		) {
			Alert.alert(
				"Validasi",
				"Nama Barang dan Harga harus diisi dengan benar untuk barang baru."
			);
			return;
		}

		const currentStok = selectedItemForMutation
			? selectedItemForMutation.stok
			: 0;
		const newMutatedItem: BarangMutasi = {
			tempId: tempIdCounter,
			id: selectedItemForMutation?.id, // Akan kosong jika isNewItem
			nama_barang: isNewItem
				? namaBarangInput
				: selectedItemForMutation!.nama_barang,
			sku: currentSkuInput,
			harga: isNewItem ? Number(hargaInput) : selectedItemForMutation!.harga,
			stok_sekarang: currentStok,
			jumlah_mutasi: Number(mutationAmount),
			is_new: isNewItem,
		};

		setItemsToMutate((prevItems) => [...prevItems, newMutatedItem]);
		setTempIdCounter((prev) => prev + 1); // Increment counter

		Alert.alert(
			"Berhasil",
			`${newMutatedItem.nama_barang} (${
				newMutatedItem.jumlah_mutasi > 0 ? "+" : ""
			}${newMutatedItem.jumlah_mutasi}) ditambahkan ke daftar.`
		);
		setShowMutationDetailModal(false); // Tutup modal detail

		// Reset input fields
		setCurrentSkuInput("");
		setMutationAmount("");
		setNamaBarangInput("");
		setHargaInput("");
	};

	const handleEditMutationItem = (itemToEdit: BarangMutasi) => {
		// Set state untuk memuat ulang data ke modal mutasi
		setCurrentSkuInput(itemToEdit.sku);
		setMutationAmount(itemToEdit.jumlah_mutasi.toString());
		setNamaBarangInput(itemToEdit.nama_barang);
		setHargaInput(itemToEdit.harga.toString());

		if (itemToEdit.is_new) {
			setIsNewItem(true);
			setSelectedItemForMutation(null); // Ini item baru, tidak ada di DB
		} else {
			setIsNewItem(false);
			// Penting: Buat objek Barang sementara yang merepresentasikan item yang sudah ada
			// agar modal bisa menampilkan "Stok Sekarang" dengan benar.
			const existingItem: Barang = {
				id: itemToEdit.id!,
				nama_barang: itemToEdit.nama_barang,
				sku: itemToEdit.sku,
				harga: itemToEdit.harga,
				stok: itemToEdit.stok_sekarang,
			};
			setSelectedItemForMutation(existingItem);
		}
		// Hapus dari daftar itemsToMutate sementara agar bisa ditambahkan kembali setelah diedit
		setItemsToMutate((prevItems) =>
			prevItems.filter((item) => item.tempId !== itemToEdit.tempId)
		);
		setShowMutationDetailModal(true); // Buka modal detail mutasi
	};

	const handleRemoveMutationItem = (tempId: number) => {
		Alert.alert(
			"Hapus Barang",
			"Apakah Anda yakin ingin menghapus barang ini dari daftar mutasi?",
			[
				{ text: "Batal", style: "cancel" },
				{
					text: "Hapus",
					onPress: () => {
						setItemsToMutate((prevItems) =>
							prevItems.filter((item) => item.tempId !== tempId)
						);
					},
					style: "destructive",
				},
			]
		);
	};

	const handleConfirmAllAndSave = async () => {
		if (itemsToMutate.length === 0) {
			Alert.alert("Informasi", "Tidak ada barang untuk disimpan.");
			setShowBatchConfirmationModal(false);
			return;
		}

		try {
			for (const item of itemsToMutate) {
				if (item.is_new) {
					// Tambah barang baru
					await addStock(
						item.nama_barang,
						item.sku,
						item.harga,
						item.jumlah_mutasi
					);
				} else {
					// Update stok barang yang sudah ada
					const newStok = item.stok_sekarang + item.jumlah_mutasi;
					await updateStock(
						item.id!,
						item.nama_barang,
						item.sku,
						item.harga,
						newStok
					);
				}
			}
			Alert.alert(
				"Berhasil",
				`${itemsToMutate.length} barang berhasil dimutasi ke stok!`
			);
			setItemsToMutate([]); // Clear the list after successful saving
			setShowBatchConfirmationModal(false);
			navigation.goBack(); // Go back to StockManagement after confirming all
		} catch (error) {
			Alert.alert(
				"Error",
				"Gagal menyimpan beberapa atau semua mutasi barang."
			);
			console.error("Error saving mutations:", error);
		}
	};

	const handleCancelAllMutations = () => {
		setItemsToMutate([]); // Kosongkan semua item yang belum disimpan
		setShowBatchConfirmationModal(false);
		navigation.goBack(); // Kembali ke StockManagement
	};

	const handleCancelBatchConfirmationModal = () => {
		setShowBatchConfirmationModal(false); // Cukup tutup modal, list tetap ada
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
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#0f1419" />
			<View style={styles.header}>
				<Text style={styles.title}>Mutasi Stok Barang</Text>
				<Text style={styles.subtitle}>
					Tambahkan atau kurangi stok barang yang sudah ada, atau tambahkan
					barang baru.
				</Text>
			</View>

			<TouchableOpacity
				style={styles.mainActionButton}
				onPress={() => setShowSkuInputModal(true)}
			>
				<Text style={styles.mainActionButtonText}>
					Mulai Mutasi / Tambah Barang
				</Text>
			</TouchableOpacity>

			{itemsToMutate.length > 0 && (
				<>
					<View style={styles.itemsListHeader}>
						<Text style={styles.itemsListTitle}>Daftar Mutasi Sementara:</Text>
						<Text style={styles.itemsListCount}>
							({itemsToMutate.length} item)
						</Text>
					</View>
					<ScrollView style={styles.itemsToMutateList}>
						{itemsToMutate.map((item) => (
							<View key={item.tempId} style={styles.mutatedItemRow}>
								<View style={styles.mutatedItemInfo}>
									<Text style={styles.mutatedItemName}>
										{item.nama_barang} ({item.is_new ? "Baru" : "Update"})
									</Text>
									<Text style={styles.mutatedItemSku}>SKU: {item.sku}</Text>
									<Text style={styles.mutatedItemStok}>
										Mutasi: {item.jumlah_mutasi > 0 ? "+" : ""}
										{item.jumlah_mutasi} (Stok Saat Ini: {item.stok_sekarang})
									</Text>
									<Text style={styles.mutatedItemHarga}>
										Harga: Rp {item.harga}
									</Text>
								</View>
								<View style={styles.mutatedItemActions}>
									<TouchableOpacity
										onPress={() => handleEditMutationItem(item)}
										style={[styles.actionButton, styles.editButton]}
									>
										<Text style={styles.actionButtonText}>Edit</Text>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => handleRemoveMutationItem(item.tempId)}
										style={[styles.actionButton, styles.removeButton]}
									>
										<Text style={styles.actionButtonText}>Hapus</Text>
									</TouchableOpacity>
								</View>
							</View>
						))}
					</ScrollView>
					<TouchableOpacity
						style={styles.saveAllButton}
						onPress={() => setShowBatchConfirmationModal(true)}
					>
						<Text style={styles.saveAllButtonText}>
							Simpan {itemsToMutate.length} Mutasi
						</Text>
					</TouchableOpacity>
				</>
			)}

			{/* Modal Input/Scan SKU */}
			<Modal
				animationType="fade"
				transparent={true}
				visible={showSkuInputModal}
				onRequestClose={() => setShowSkuInputModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<Text style={styles.modalTitle}>Masukkan SKU Barang</Text>
						<TextInput
							style={styles.input}
							placeholder="SKU Barang"
							placeholderTextColor="#b0b3b8"
							value={currentSkuInput}
							onChangeText={setCurrentSkuInput}
						/>
						<View style={styles.modalButtonsContainer}>
							<TouchableOpacity
								style={[styles.modalButton, styles.modalButtonConfirm]}
								onPress={() => handleSkuEntered(currentSkuInput)}
							>
								<Text style={styles.modalButtonText}>Lanjutkan</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.modalButton, styles.modalButtonScan]}
								onPress={() => {
									setShowSkuInputModal(false);
									setScanned(false);
									setShowScanner(true);
								}}
							>
								<Text style={styles.modalButtonText}>Scan Barcode</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.modalButton, styles.modalButtonCancel]}
								onPress={() => {
									setShowSkuInputModal(false);
									setCurrentSkuInput("");
								}}
							>
								<Text style={styles.modalButtonText}>Batal</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Modal Detail Barang dan Mutasi Stok */}
			<Modal
				animationType="fade"
				transparent={true}
				visible={showMutationDetailModal}
				onRequestClose={() => setShowMutationDetailModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<Text style={styles.modalTitle}>
							{isNewItem ? "Tambah Barang Baru" : "Mutasi Stok Barang"}
						</Text>

						<Text style={styles.detailText}>SKU: {currentSkuInput}</Text>

						{isNewItem ? (
							<>
								<TextInput
									style={styles.input}
									placeholder="Nama Barang (Baru)"
									placeholderTextColor="#b0b3b8"
									value={namaBarangInput}
									onChangeText={setNamaBarangInput}
								/>
								<TextInput
									style={styles.input}
									placeholder="Harga (Baru)"
									placeholderTextColor="#b0b3b8"
									value={hargaInput}
									onChangeText={setHargaInput}
									keyboardType="numeric"
								/>
							</>
						) : (
							<>
								<Text style={styles.detailText}>
									Nama: {selectedItemForMutation?.nama_barang}
								</Text>
								<Text style={styles.detailText}>
									Harga: Rp {selectedItemForMutation?.harga}
								</Text>
								<Text style={styles.detailText}>
									Stok Saat Ini: {selectedItemForMutation?.stok}
								</Text>
							</>
						)}

						<TextInput
							style={styles.input}
							placeholder="Jumlah Mutasi Stok (+/-)"
							placeholderTextColor="#b0b3b8"
							value={mutationAmount}
							onChangeText={setMutationAmount}
							keyboardType="numeric"
						/>
						<Text style={styles.mutationHint}>
							(Gunakan angka positif untuk penambahan, negatif untuk
							pengurangan, cth: "5" atau "-3")
						</Text>

						<View style={styles.modalButtonsContainer}>
							<TouchableOpacity
								style={[styles.modalButton, styles.modalButtonConfirm]}
								onPress={handleAddMutationToList}
							>
								<Text style={styles.modalButtonText}>
									Tambah ke Daftar Mutasi
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.modalButton, styles.modalButtonCancel]}
								onPress={() => setShowMutationDetailModal(false)}
							>
								<Text style={styles.modalButtonText}>Batal</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Barcode Scanner Modal (existing) */}
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

			{/* Confirmation Modal (for saving all batch items) */}
			<Modal
				animationType="fade"
				transparent={true}
				visible={showBatchConfirmationModal}
				onRequestClose={handleCancelBatchConfirmationModal}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.confirmationModalContainer}>
						<Text style={styles.confirmationModalTitle}>
							Konfirmasi Simpan Mutasi
						</Text>
						<Text style={styles.confirmationModalQuestion}>
							Anda akan memutasi {itemsToMutate.length} item. Yakin ingin
							menyimpan?
						</Text>
						<ScrollView style={styles.addedItemsList}>
							{itemsToMutate.map((item, index) => (
								<View key={item.tempId} style={styles.addedItemRow}>
									<View style={styles.addedItemInfo}>
										<Text style={styles.addedItemTextBold}>
											{item.nama_barang}
										</Text>
										<Text style={styles.addedItemText}>SKU: {item.sku}</Text>
										<Text style={styles.addedItemText}>
											Tipe: {item.is_new ? "Baru" : "Update"}
										</Text>
										<Text style={styles.addedItemText}>
											Mutasi: {item.jumlah_mutasi > 0 ? "+" : ""}
											{item.jumlah_mutasi}
										</Text>
										{!item.is_new && (
											<Text style={styles.addedItemText}>
												Stok Saat Ini: {item.stok_sekarang}
											</Text>
										)}
										<Text style={styles.addedItemText}>
											Harga: Rp {item.harga}
										</Text>
									</View>
								</View>
							))}
						</ScrollView>
						<View style={styles.modalButtonsContainer}>
							<TouchableOpacity
								style={[styles.modalButton, styles.modalButtonConfirm]}
								onPress={handleConfirmAllAndSave}
							>
								<Text style={styles.modalButtonText}>Simpan Semua</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.modalButton, styles.modalButtonCancel]}
								onPress={handleCancelAllMutations}
							>
								<Text style={styles.modalButtonText}>
									Batal Semua & Kembali
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.modalButton, styles.modalButtonDiscard]}
								onPress={handleCancelBatchConfirmationModal}
							>
								<Text style={styles.modalButtonText}>Kembali Edit</Text>
							</TouchableOpacity>
						</View>
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
		padding: 20,
		paddingTop: StatusBar.currentHeight,
	},
	header: {
		marginBottom: 20,
		alignItems: "center",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#00d4ff",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: "#b0b3b8",
		textAlign: "center",
	},
	input: {
		width: "100%",
		height: 50,
		backgroundColor: "#1e2a38",
		borderRadius: 10,
		paddingHorizontal: 15,
		color: "white",
		marginBottom: 15,
		fontSize: 16,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.3)",
	},
	mainActionButton: {
		backgroundColor: "#00d4ff", // Warna mencolok untuk aksi utama
		paddingVertical: 18,
		borderRadius: 12,
		alignItems: "center",
		marginBottom: 25,
		shadowColor: "#00d4ff",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 8,
	},
	mainActionButtonText: {
		color: "#0f1419",
		fontSize: 20,
		fontWeight: "bold",
	},
	itemsListHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-end",
		marginBottom: 10,
		paddingHorizontal: 5,
	},
	itemsListTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "white",
	},
	itemsListCount: {
		fontSize: 16,
		color: "#b0b3b8",
	},
	itemsToMutateList: {
		flex: 1,
		width: "100%",
		marginTop: StatusBar.currentHeight || 0, // Adjust for status bar height
		marginBottom: 16 + (StatusBar.currentHeight || 0), // Adjust for status bar height
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 10,
		padding: 10,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.1)",
	},
	mutatedItemRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#1e2a38",
		borderRadius: 8,
		padding: 12,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.2)",
	},
	mutatedItemInfo: {
		flex: 3,
	},
	mutatedItemName: {
		color: "#00d4ff",
		fontSize: 17,
		fontWeight: "bold",
		marginBottom: 2,
	},
	mutatedItemSku: {
		color: "white",
		fontSize: 14,
	},
	mutatedItemStok: {
		color: "#b0b3b8",
		fontSize: 14,
	},
	mutatedItemHarga: {
		color: "#b0b3b8",
		fontSize: 14,
	},
	mutatedItemActions: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: 8,
	},
	actionButton: {
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 5,
	},
	editButton: {
		backgroundColor: "#ffc107", // Yellow
	},
	removeButton: {
		backgroundColor: "#dc3545", // Red
	},
	actionButtonText: {
		color: "white",
		fontSize: 14,
		fontWeight: "bold",
	},
	saveAllButton: {
		backgroundColor: "#28a745", // Green for "Save All"
		paddingVertical: 15,
		borderRadius: 10,
		alignItems: "center",
		marginTop: -25,
		marginBottom: 15 + (StatusBar.currentHeight || 0), // Adjust for status bar height
	},
	saveAllButtonText: {
		color: "white",
		fontSize: 18,
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
		height: width * 0.6,
	},
	leftOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	scanBox: {
		width: width * 0.6,
		height: width * 0.6,
		borderWidth: 2,
		borderColor: "white",
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
	// Styles for Modals (general purpose)
	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.7)",
	},
	modalContainer: {
		backgroundColor: "#1e2a38",
		borderRadius: 15,
		padding: 25,
		width: "85%",
		height: "40%", // Allow height to adjust based on content
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.3)",
	},
	modalTitle: {
		// Ini adalah style untuk modalTitle
		fontSize: 22,
		fontWeight: "bold",
		color: "#00d4ff",
		marginBottom: 15,
		textAlign: "center",
	},
	modalButtonsContainer: {
		flexDirection: "column",
		justifyContent: "space-around",
		width: "100%",
		gap: 15,
		marginTop: 15,
	},
	modalButton: {
		paddingVertical: 12,
		paddingHorizontal: 15,
		borderRadius: 8,
		alignItems: "center",
	},
	modalButtonConfirm: {
		backgroundColor: "#28a745",
	},
	modalButtonScan: {
		backgroundColor: "#007bff",
	},
	modalButtonCancel: {
		backgroundColor: "#dc3545",
	},
	modalButtonDiscard: {
		// New style for "Kembali Edit" in batch confirmation
		backgroundColor: "#ffc107",
	},
	modalButtonText: {
		color: "white",
		fontSize: 15,
		fontWeight: "bold",
		textAlign: "center",
		margin: -5,
		alignContent: "center",
		alignItems: "center",
		width: "100%",
		textAlignVertical: "center",
		alignSelf: "center",
	},
	detailText: {
		color: "white",
		fontSize: 16,
		marginBottom: 8,
		width: "100%",
		textAlign: "left",
	},
	mutationHint: {
		fontSize: 12,
		color: "#b0b3b8",
		marginBottom: 15,
		textAlign: "center",
	},
	// Styles for Batch Confirmation Modal
	confirmationModalContainer: {
		backgroundColor: "#1e2a38",
		borderRadius: 15,
		padding: 25,
		width: "90%",
		maxHeight: "85%", // Lebih tinggi untuk daftar
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.3)",
	},
	confirmationModalTitle: {
		// Ini adalah style untuk confirmationModalTitle
		fontSize: 22,
		fontWeight: "bold",
		color: "#00d4ff",
		marginBottom: 15,
		textAlign: "center",
	},
	confirmationModalQuestion: {
		fontSize: 16,
		color: "#b0b3b8",
		textAlign: "center",
		marginBottom: 15,
	},
	addedItemsList: {
		width: "100%",
		maxHeight: Dimensions.get("window").height * 0.45, // Batasi tinggi daftar
		marginBottom: 20,
	},
	addedItemRow: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 8,
		padding: 10,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
	},
	addedItemInfo: {
		// Just flex for this context, as action buttons are not here
	},
	addedItemTextBold: {
		color: "white",
		fontSize: 17,
		fontWeight: "bold",
		marginBottom: 2,
	},
	addedItemText: {
		color: "#b0b3b8",
		fontSize: 14,
	},
});
