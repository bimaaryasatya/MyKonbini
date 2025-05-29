// screens/EditItemScreen.tsx
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useState } from "react";
import {
	Alert,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { updateStock } from "../database"; // Ensure your updateStock function is updated to accept SKU

export default function EditItemScreen() {
	const route = useRoute<any>();
	const { item } = route.params; // 'item' should now contain 'sku' instead of 'kategori'

	const [nama, setNama] = useState(item.nama_barang);
	const [sku, setSku] = useState(item.sku); // Changed from kategori to sku
	const [harga, setHarga] = useState(item.harga.toString());
	const [stok, setStok] = useState(item.stok.toString());

	const navigation = useNavigation();

	const handleUpdate = async () => {
		// Basic validation
		if (!nama || !sku || !harga || !stok) {
			Alert.alert("Validasi", "Semua field harus diisi");
			return;
		}
		try {
			// Call updateStock with SKU instead of kategori
			await updateStock(item.id, nama, sku, Number(harga), Number(stok));
			Alert.alert("Sukses", "Barang berhasil diubah");
			navigation.goBack();
		} catch (error) {
			Alert.alert("Error", "Gagal mengupdate data");
			console.error("Error updating item:", error);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Edit Barang</Text>
			<TextInput
				style={styles.input}
				placeholder="Nama Barang"
				placeholderTextColor="#b0b3b8"
				value={nama}
				onChangeText={setNama}
			/>
			<TextInput
				style={styles.input}
				placeholder="SKU" // Changed placeholder to SKU
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
			<TouchableOpacity style={styles.button} onPress={handleUpdate}>
				<Text style={styles.buttonText}>Simpan Perubahan</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 20, backgroundColor: "#0f1419" },
	title: { fontSize: 20, fontWeight: "bold", color: "white", marginBottom: 20 },
	input: {
		backgroundColor: "rgba(255,255,255,0.05)",
		color: "white",
		padding: 12,
		marginBottom: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "rgba(0,212,255,0.3)",
	},
	button: {
		backgroundColor: "#ffc107",
		paddingVertical: 14,
		alignItems: "center",
		borderRadius: 8,
		shadowColor: "#ffc107", // Shadow for button
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 5,
	},
	buttonText: { color: "#0f1419", fontWeight: "bold" },
});
