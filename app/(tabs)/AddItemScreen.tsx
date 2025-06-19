// screens/AddItemScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
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
			<StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

			{/* Background Gradient */}
			<LinearGradient
				colors={["#f8fafc", "#e2e8f0", "#cbd5e1"]}
				style={styles.gradient}
			>
				{/* Floating Background Elements */}
				<View style={styles.floatingElement1} />
				<View style={styles.floatingElement2} />
				<View style={styles.floatingElement3} />

				<ScrollView
					contentContainerStyle={styles.scrollViewContent}
					showsVerticalScrollIndicator={false}
				>
					{/* Header */}
					<View style={styles.headerContainer}>
						<View style={[styles.header, styles.liquidGlass]}>
							<Text style={styles.title}>Mutasi Stok Barang</Text>
							<Text style={styles.subtitle}>
								Tambahkan atau kurangi stok barang yang sudah ada, atau
								tambahkan barang baru.
							</Text>
						</View>
					</View>

					<TouchableOpacity
						style={[styles.mainActionButton, styles.liquidGlass]}
						onPress={() => setShowSkuInputModal(true)}
					>
						<LinearGradient
							colors={["rgba(59, 130, 246, 0.1)", "rgba(99, 102, 241, 0.05)"]}
							style={styles.mainActionButtonGradient}
						>
							<Ionicons name="add-circle-outline" size={32} color="#3b82f6" />
							<Text style={styles.mainActionButtonText}>
								Mulai Mutasi / Tambah Barang
							</Text>
						</LinearGradient>
					</TouchableOpacity>

					{itemsToMutate.length > 0 && (
						<>
							<View style={[styles.itemsListHeader, styles.liquidGlass]}>
								<LinearGradient
									colors={[
										"rgba(251, 191, 36, 0.08)",
										"rgba(251, 191, 36, 0.04)",
									]}
									style={styles.itemsListHeaderGradient}
								>
									<Ionicons
										name="list-outline"
										size={24}
										color="#d97706"
										style={{ marginRight: 8 }}
									/>
									<Text style={styles.itemsListTitle}>
										Daftar Mutasi Sementara:
									</Text>
									<Text style={styles.itemsListCount}>
										({itemsToMutate.length} item)
									</Text>
								</LinearGradient>
							</View>
							<View
								style={[styles.itemsToMutateListContainer, styles.liquidGlass]}
							>
								<ScrollView style={styles.itemsToMutateList}>
									{itemsToMutate.map((item) => (
										<View
											key={item.tempId}
											style={[styles.mutatedItemRow, styles.liquidGlass]}
										>
											<LinearGradient
												colors={[
													"rgba(255, 255, 255, 0.6)",
													"rgba(255, 255, 255, 0.3)",
												]}
												style={styles.mutatedItemGradient}
											>
												<View style={styles.mutatedItemInfo}>
													<Text style={styles.mutatedItemName}>
														{item.nama_barang} (
														{item.is_new ? "Baru" : "Update"})
													</Text>
													<Text style={styles.mutatedItemSku}>
														SKU: {item.sku}
													</Text>
													<Text style={styles.mutatedItemStok}>
														Mutasi: {item.jumlah_mutasi > 0 ? "+" : ""}
														{item.jumlah_mutasi} (Stok Saat Ini:{" "}
														{item.stok_sekarang})
													</Text>
													<Text style={styles.mutatedItemHarga}>
														Harga: Rp {item.harga.toLocaleString("id-ID")}
													</Text>
												</View>
												<View style={styles.mutatedItemActions}>
													<TouchableOpacity
														onPress={() => handleEditMutationItem(item)}
														style={[styles.actionButton, styles.liquidGlass]}
													>
														<LinearGradient
															colors={[
																"rgba(251, 191, 36, 0.2)",
																"rgba(251, 191, 36, 0.1)",
															]}
															style={styles.actionButtonGradient}
														>
															<Ionicons
																name="create-outline"
																size={20}
																color="#d97706"
															/>
															<Text style={styles.actionButtonText}>Edit</Text>
														</LinearGradient>
													</TouchableOpacity>
													<TouchableOpacity
														onPress={() =>
															handleRemoveMutationItem(item.tempId)
														}
														style={[styles.actionButton, styles.liquidGlass]}
													>
														<LinearGradient
															colors={[
																"rgba(239, 68, 68, 0.2)",
																"rgba(239, 68, 68, 0.1)",
															]}
															style={styles.actionButtonGradient}
														>
															<Ionicons
																name="trash-outline"
																size={20}
																color="#ef4444"
															/>
															<Text style={styles.actionButtonText}>Hapus</Text>
														</LinearGradient>
													</TouchableOpacity>
												</View>
											</LinearGradient>
										</View>
									))}
								</ScrollView>
							</View>
							<TouchableOpacity
								style={[styles.saveAllButton, styles.liquidGlass]}
								onPress={() => setShowBatchConfirmationModal(true)}
							>
								<LinearGradient
									colors={["rgba(34, 197, 94, 0.1)", "rgba(34, 197, 94, 0.05)"]}
									style={styles.saveAllButtonGradient}
								>
									<Ionicons
										name="checkmark-done-outline"
										size={24}
										color="#059669"
									/>
									<Text style={styles.saveAllButtonText}>
										Simpan {itemsToMutate.length} Mutasi
									</Text>
								</LinearGradient>
							</TouchableOpacity>
						</>
					)}
				</ScrollView>
			</LinearGradient>

			{/* Modal Input/Scan SKU */}
			<Modal
				animationType="fade"
				transparent={true}
				visible={showSkuInputModal}
				onRequestClose={() => setShowSkuInputModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={[styles.modalContainer, styles.liquidGlass]}>
						<LinearGradient
							colors={["#f8fafc", "#e2e8f0", "#cbd5e1"]}
							style={styles.modalInnerContainer}
						>
							<Text style={styles.modalTitle}>Masukkan SKU Barang</Text>
							<TextInput
								style={styles.input}
								placeholder="SKU Barang"
								placeholderTextColor="#64748b"
								value={currentSkuInput}
								onChangeText={setCurrentSkuInput}
							/>
							<View style={styles.modalButtonsContainer}>
								<TouchableOpacity
									style={[styles.modalButton, styles.liquidGlass]}
									onPress={() => handleSkuEntered(currentSkuInput)}
								>
									<LinearGradient
										colors={[
											"rgba(34, 197, 94, 0.1)",
											"rgba(34, 197, 94, 0.05)",
										]}
										style={styles.modalButtonGradient}
									>
										<Text style={styles.modalButtonText}>Lanjutkan</Text>
									</LinearGradient>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.modalButton, styles.liquidGlass]}
									onPress={() => {
										setShowSkuInputModal(false);
										setScanned(false);
										setShowScanner(true);
									}}
								>
									<LinearGradient
										colors={[
											"rgba(59, 130, 246, 0.1)",
											"rgba(99, 102, 241, 0.05)",
										]}
										style={styles.modalButtonGradient}
									>
										<Text style={styles.modalButtonText}>Scan Barcode</Text>
									</LinearGradient>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.modalButton, styles.liquidGlass]}
									onPress={() => {
										setShowSkuInputModal(false);
										setCurrentSkuInput("");
									}}
								>
									<LinearGradient
										colors={[
											"rgba(239, 68, 68, 0.1)",
											"rgba(239, 68, 68, 0.05)",
										]}
										style={styles.modalButtonGradient}
									>
										<Text style={styles.modalButtonText}>Batal</Text>
									</LinearGradient>
								</TouchableOpacity>
							</View>
						</LinearGradient>
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
					<View style={[styles.modalContainer, styles.liquidGlass]}>
						<LinearGradient
							colors={["#f8fafc", "#e2e8f0", "#cbd5e1"]}
							style={styles.modalInnerContainer}
						>
							<Text style={styles.modalTitle}>
								{isNewItem ? "Tambah Barang Baru" : "Mutasi Stok Barang"}
							</Text>

							<Text style={styles.detailText}>SKU: {currentSkuInput}</Text>

							{isNewItem ? (
								<>
									<TextInput
										style={styles.input}
										placeholder="Nama Barang (Baru)"
										placeholderTextColor="#64748b"
										value={namaBarangInput}
										onChangeText={setNamaBarangInput}
									/>
									<TextInput
										style={styles.input}
										placeholder="Harga (Baru)"
										placeholderTextColor="#64748b"
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
										Harga: Rp{" "}
										{selectedItemForMutation?.harga.toLocaleString("id-ID")}
									</Text>
									<Text style={styles.detailText}>
										Stok Saat Ini: {selectedItemForMutation?.stok}
									</Text>
								</>
							)}

							<TextInput
								style={styles.input}
								placeholder="Jumlah Mutasi Stok (+/-)"
								placeholderTextColor="#64748b"
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
									style={[styles.modalButton, styles.liquidGlass]}
									onPress={handleAddMutationToList}
								>
									<LinearGradient
										colors={[
											"rgba(34, 197, 94, 0.1)",
											"rgba(34, 197, 94, 0.05)",
										]}
										style={styles.modalButtonGradient}
									>
										<Text style={styles.modalButtonText}>
											Tambah ke Daftar Mutasi
										</Text>
									</LinearGradient>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.modalButton, styles.liquidGlass]}
									onPress={() => setShowMutationDetailModal(false)}
								>
									<LinearGradient
										colors={[
											"rgba(239, 68, 68, 0.1)",
											"rgba(239, 68, 68, 0.05)",
										]}
										style={styles.modalButtonGradient}
									>
										<Text style={styles.modalButtonText}>Batal</Text>
									</LinearGradient>
								</TouchableOpacity>
							</View>
						</LinearGradient>
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
					<View style={[styles.confirmationModalContainer, styles.liquidGlass]}>
						<LinearGradient
							colors={["#f8fafc", "#e2e8f0", "#cbd5e1"]}
							style={styles.modalInnerContainer}
						>
							<Text style={styles.confirmationModalTitle}>
								Konfirmasi Simpan Mutasi
							</Text>
							<Text style={styles.confirmationModalQuestion}>
								Anda akan memutasi {itemsToMutate.length} item. Yakin ingin
								menyimpan?
							</Text>
							<ScrollView style={styles.addedItemsList}>
								{itemsToMutate.map((item, index) => (
									<View
										key={item.tempId}
										style={[styles.addedItemRow, styles.liquidGlass]}
									>
										<LinearGradient
											colors={[
												"rgba(255, 255, 255, 0.6)",
												"rgba(255, 255, 255, 0.3)",
											]}
											style={styles.addedItemGradient}
										>
											<View style={styles.addedItemInfo}>
												<Text style={styles.addedItemTextBold}>
													{item.nama_barang}
												</Text>
												<Text style={styles.addedItemText}>
													SKU: {item.sku}
												</Text>
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
													Harga: Rp {item.harga.toLocaleString("id-ID")}
												</Text>
											</View>
										</LinearGradient>
									</View>
								))}
							</ScrollView>
							<View style={styles.modalButtonsContainer}>
								<TouchableOpacity
									style={[styles.modalButton, styles.liquidGlass]}
									onPress={handleConfirmAllAndSave}
								>
									<LinearGradient
										colors={[
											"rgba(34, 197, 94, 0.1)",
											"rgba(34, 197, 94, 0.05)",
										]}
										style={styles.modalButtonGradient}
									>
										<Text style={styles.modalButtonText}>Simpan Semua</Text>
									</LinearGradient>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.modalButton, styles.liquidGlass]}
									onPress={handleCancelAllMutations}
								>
									<LinearGradient
										colors={[
											"rgba(239, 68, 68, 0.1)",
											"rgba(239, 68, 68, 0.05)",
										]}
										style={styles.modalButtonGradient}
									>
										<Text style={styles.modalButtonText}>
											Batal Semua & Kembali
										</Text>
									</LinearGradient>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.modalButton, styles.liquidGlass]}
									onPress={handleCancelBatchConfirmationModal}
								>
									<LinearGradient
										colors={[
											"rgba(251, 191, 36, 0.1)",
											"rgba(251, 191, 36, 0.05)",
										]}
										style={styles.modalButtonGradient}
									>
										<Text style={styles.modalButtonText}>Kembali Edit</Text>
									</LinearGradient>
								</TouchableOpacity>
							</View>
						</LinearGradient>
					</View>
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
	input: {
		width: "100%",
		height: 50,
		backgroundColor: "rgba(255, 255, 255, 0.7)",
		borderRadius: 10,
		paddingHorizontal: 15,
		color: "#1e293b",
		marginBottom: 15,
		fontSize: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.8)",
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
	itemsListHeader: {
		borderRadius: 16,
		marginBottom: 16,
		overflow: "hidden",
	},
	itemsListHeaderGradient: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
	},
	itemsListTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#1e293b",
	},
	itemsListCount: {
		fontSize: 16,
		color: "#64748b",
		marginLeft: "auto",
	},
	itemsToMutateListContainer: {
		borderRadius: 16,
		marginBottom: 24,
		overflow: "hidden",
	},
	itemsToMutateList: {
		maxHeight: Dimensions.get("window").height * 0.4,
		padding: 10,
	},
	mutatedItemRow: {
		borderRadius: 16,
		marginBottom: 10,
		overflow: "hidden",
	},
	mutatedItemGradient: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 16,
	},
	mutatedItemInfo: {
		flex: 3,
	},
	mutatedItemName: {
		color: "#1e293b",
		fontSize: 17,
		fontWeight: "bold",
		marginBottom: 2,
	},
	mutatedItemSku: {
		color: "#475569",
		fontSize: 14,
	},
	mutatedItemStok: {
		color: "#475569",
		fontSize: 14,
	},
	mutatedItemHarga: {
		color: "#475569",
		fontSize: 14,
	},
	mutatedItemActions: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: 8,
	},
	actionButton: {
		borderRadius: 12,
		overflow: "hidden",
	},
	actionButtonGradient: {
		paddingVertical: 8,
		paddingHorizontal: 10,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 4,
	},
	actionButtonText: {
		color: "#1e293b",
		fontSize: 12,
		fontWeight: "600",
	},
	saveAllButton: {
		borderRadius: 20,
		overflow: "hidden",
		marginTop: 8,
	},
	saveAllButtonGradient: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 15,
		gap: 10,
	},
	saveAllButtonText: {
		color: "#1e293b",
		fontSize: 18,
		fontWeight: "bold",
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
		backgroundColor: "#ef4444",
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
	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.4)",
	},
	modalContainer: {
		borderRadius: 20,
		width: "85%",
		maxHeight: "80%", // Adjusted for better fit
		overflow: "hidden",
	},
	modalInnerContainer: {
		padding: 25,
		alignItems: "center",
		width: "100%",
		height: "100%",
	},
	modalTitle: {
		fontSize: 22,
		fontWeight: "800",
		color: "#1e293b",
		marginBottom: 15,
		textAlign: "center",
	},
	modalButtonsContainer: {
		flexDirection: "column",
		width: "100%",
		gap: 15,
		marginTop: 15,
	},
	modalButton: {
		borderRadius: 12,
		overflow: "hidden",
	},
	modalButtonGradient: {
		paddingVertical: 12,
		paddingHorizontal: 15,
		alignItems: "center",
		justifyContent: "center",
	},
	modalButtonText: {
		color: "#1e293b",
		fontSize: 16,
		fontWeight: "700",
		textAlign: "center",
	},
	detailText: {
		color: "#1e293b",
		fontSize: 16,
		marginBottom: 8,
		width: "100%",
		textAlign: "left",
		fontWeight: "500",
	},
	mutationHint: {
		fontSize: 12,
		color: "#64748b",
		marginBottom: 15,
		textAlign: "center",
		fontStyle: "italic",
	},
	confirmationModalContainer: {
		borderRadius: 20,
		width: "90%",
		maxHeight: "85%",
		overflow: "hidden",
	},
	confirmationModalTitle: {
		fontSize: 22,
		fontWeight: "800",
		color: "#1e293b",
		marginBottom: 15,
		textAlign: "center",
	},
	confirmationModalQuestion: {
		fontSize: 16,
		color: "#475569",
		textAlign: "center",
		marginBottom: 15,
		fontWeight: "500",
	},
	addedItemsList: {
		width: "100%",
		maxHeight: Dimensions.get("window").height * 0.35, // Adjusted height
		marginBottom: 20,
	},
	addedItemRow: {
		borderRadius: 16,
		marginBottom: 10,
		overflow: "hidden",
	},
	addedItemGradient: {
		padding: 16,
	},
	addedItemInfo: {},
	addedItemTextBold: {
		color: "#1e293b",
		fontSize: 17,
		fontWeight: "bold",
		marginBottom: 2,
	},
	addedItemText: {
		color: "#475569",
		fontSize: 14,
		fontWeight: "500",
	},
});
