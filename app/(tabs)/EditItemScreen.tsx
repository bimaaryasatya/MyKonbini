// screens/EditItemScreen.tsx
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { updateStock } from "../database";

export default function EditItemScreen() {
	const route = useRoute<any>();
	const { item } = route.params;

	const [nama, setNama] = useState(item.nama_barang);
	const [kategori, setKategori] = useState(item.kategori);
	const [harga, setHarga] = useState(item.harga.toString());
	const [stok, setStok] = useState(item.stok.toString());

	const navigation = useNavigation();

	const handleUpdate = async () => {
		try {
			await updateStock(item.id, nama, kategori, Number(harga), Number(stok));
			Alert.alert("Sukses", "Barang berhasil diubah");
			navigation.goBack();
		} catch (error) {
			Alert.alert("Error", "Gagal mengupdate data");
			console.error(error);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Edit Barang</Text>
			<TextInput
				style={styles.input}
				placeholder="Nama Barang"
				value={nama}
				onChangeText={setNama}
			/>
			<TextInput
				style={styles.input}
				placeholder="Kategori"
				value={kategori}
				onChangeText={setKategori}
			/>
			<TextInput
				style={styles.input}
				placeholder="Harga"
				value={harga}
				onChangeText={setHarga}
				keyboardType="numeric"
			/>
			<TextInput
				style={styles.input}
				placeholder="Stok"
				value={stok}
				onChangeText={setStok}
				keyboardType="numeric"
			/>
			<View style={styles.button}>
				<Text style={styles.buttonText} onPress={handleUpdate}>
					Simpan Perubahan
				</Text>
			</View>
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
	},
	buttonText: { color: "#0f1419", fontWeight: "bold" },
});
