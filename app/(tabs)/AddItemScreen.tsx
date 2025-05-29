// screens/AddItemScreen.tsx
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { addStock } from "../database";

export default function AddItemScreen() {
	const [nama, setNama] = useState("");
	const [kategori, setKategori] = useState("");
	const [harga, setHarga] = useState("");
	const [stok, setStok] = useState("");

	const navigation = useNavigation();

	const handleAdd = async () => {
		if (!nama || !kategori || !harga || !stok) {
			Alert.alert("Validasi", "Semua field harus diisi");
			return;
		}
		try {
			await addStock(nama, kategori, Number(harga), Number(stok));
			Alert.alert("Sukses", "Barang berhasil ditambahkan");
			navigation.goBack();
		} catch (error) {
			Alert.alert("Error", "Gagal menambahkan data");
			console.error(error);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Tambah Barang</Text>
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
				<Text style={styles.buttonText} onPress={handleAdd}>
					Simpan
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
		backgroundColor: "#00d4ff",
		paddingVertical: 14,
		alignItems: "center",
		borderRadius: 8,
	},
	buttonText: { color: "white", fontWeight: "bold" },
});
