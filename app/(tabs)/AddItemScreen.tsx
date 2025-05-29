// screens/AddItemScreen.tsx
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addStock } from "../database"; // Ensure your addStock function in database.ts is updated to accept SKU

export default function AddItemScreen() {
  const [nama, setNama] = useState("");
  const [sku, // screens/AddItemScreen.tsx
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addStock } from "../database"; // Ensure your addStock function in database.ts is updated to accept SKU

export default function AddItemScreen() {
  const [form, setForm] = useState({
    nama: "",
    sku: "",
    harga: "",
    stok: "",
  });

  const navigation = useNavigation();

  const handleAdd = async () => {
    // Validate all required fields
    if (!form.nama || !form.sku || !form.harga || !form.stok) {
      Alert.alert("Validasi", "Semua field harus diisi");
      return;
    }
    try {
      // Call addStock with SKU instead of kategori
      await addStock(form.nama, form.sku, Number(form.harga), Number(form.stok));
      Alert.alert("Sukses", "Barang berhasil ditambahkan");
      navigation.goBack(); // Navigate back after successful addition
    } catch (error) {
      Alert.alert("Error", "Gagal menambahkan data");
      console.error("Error adding item:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tambah Barang</Text>
      <TextInput
        style={styles.input}
        placeholder="Nama Barang"
        placeholderTextColor="#b0b3b8"
        value={form.nama}
        onChangeText={(text) => handleInputChange("nama", text)}
      />
      <TextInput
        style={styles.input}
        placeholder="SKU"
        placeholderTextColor="#b0b3b8"
        value={form.sku}
        onChangeText={(text) => handleInputChange("sku", text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Harga"
        placeholderTextColor="#b0b3b8"
        value={form.harga}
        onChangeText={(text) => handleInputChange("harga", text)}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Stok"
        placeholderTextColor="#b0b3b8"
        value={form.stok}
        onChangeText={(text) => handleInputChange("stok", text)}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.button} onPress={handleAdd}>
        <Text style={styles.buttonText}>Simpan</Text>
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
    backgroundColor: "#00d4ff",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 8,
    shadowColor: "#00d4ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: { color: "white", fontWeight: "bold" },
});setSku] = useState(""); // New state for SKU
  const [harga, setHarga] = useState("");
  const [stok, setStok] = useState("");

  const navigation = useNavigation();

  const handleAdd = async () => {
    // Validate all required fields, now including SKU
    if (!nama || !sku || !harga || !stok) {
      Alert.alert("Validasi", "Semua field harus diisi");
      return;
    }
    try {
      // Call addStock with SKU instead of kategori
      await addStock(nama, sku, Number(harga), Number(stok));
      Alert.alert("Sukses", "Barang berhasil ditambahkan");
      navigation.goBack(); // Navigate back after successful addition
    } catch (error) {
      Alert.alert("Error", "Gagal menambahkan data");
      console.error("Error adding item:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tambah Barang</Text>
      <TextInput
        style={styles.input}
        placeholder="Nama Barang"
        placeholderTextColor="#b0b3b8" // Added placeholder text color for better visibility
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
      <TouchableOpacity style={styles.button} onPress={handleAdd}>
        <Text style={styles.buttonText}>Simpan</Text>
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
    backgroundColor: "#00d4ff",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 8,
    shadowColor: "#00d4ff", // Shadow for button
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: { color: "white", fontWeight: "bold" },
});
