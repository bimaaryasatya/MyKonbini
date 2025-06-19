// app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react"; // Pastikan useEffect dan useCallback ada
import {
	SafeAreaView,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import "react-native-gesture-handler";
import {
	getExpenditureSummary,
	getFinancialSummary,
	initDB,
} from "../database"; // Import getFinancialSummary dan initDB

import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect

export default function HomeScreen() {
	const [weeklyIncome, setWeeklyIncome] = useState<number | null>(null);
	const [monthlyIncome, setMonthlyIncome] = useState<number | null>(null);
	const [weeklyExpenditure, setWeeklyExpenditure] = useState<number | null>(
		null
	);
	const [monthlyExpenditure, setMonthlyExpenditure] = useState<number | null>(
		null
	);

	// Panggil initDB saat komponen pertama kali dimuat
	useEffect(() => {
		const initializeDatabase = async () => {
			try {
				await initDB();
				console.log("Database initialized successfully.");
			} catch (error) {
				console.error("Failed to initialize database:", error);
				// Anda bisa menambahkan Alert.alert di sini untuk memberi tahu pengguna jika ada masalah serius
			}
		};

		initializeDatabase();
	}, []); // Array dependensi kosong memastikan ini hanya berjalan sekali saat mount

	const fetchFinancialData = useCallback(async () => {
		try {
			const weekly = await getFinancialSummary("weekly");
			const monthly = await getFinancialSummary("monthly");
			const weeklyExpenditure = await getExpenditureSummary("weekly");
			const monthlyExpenditure = await getExpenditureSummary("monthly");
			setWeeklyIncome(weekly);
			setMonthlyIncome(monthly);
			setWeeklyExpenditure(weeklyExpenditure);
			setMonthlyExpenditure(monthlyExpenditure);
		} catch (error) {
			console.error("Error fetching financial data:", error);
			setWeeklyIncome(0); // Set to 0 if there's an error
			setMonthlyIncome(0); // Set to 0 if there's an error
			setWeeklyExpenditure(0);
			setMonthlyExpenditure(0);
		}
	}, []);

	// Use useFocusEffect to refresh data when screen comes into focus
	useFocusEffect(
		useCallback(() => {
			fetchFinancialData();
		}, [fetchFinancialData])
	);

	const handleManageStock = () => {
		// Navigate ke halaman manajemen stok
		router.push("./StockStack");
	};

	const handleStartTransaction = () => {
		// Navigate ke halaman transaksi
		router.push("./TransactionScreen"); // Updated navigation
	};

	const handleViewLogs = () => {
		// Navigate ke halaman log
		router.push("./logScreen"); // Navigate to LogScreen within StockStack
	};

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

			<LinearGradient
				colors={["#1a1a2e", "#16213e", "#0f3460"]}
				style={styles.gradient}
			>
				<ScrollView contentContainerStyle={styles.scrollViewContent}>
					{/* Header */}
					<View style={styles.header}>
						<Text style={styles.greeting}>Selamat Datang!</Text>
						<Text style={styles.appName}>Toko Annaya Tegal</Text>
					</View>

					<View style={styles.logoContainer}>
						<View style={styles.logoBackground}>
							<Ionicons name="storefront" size={80} color="#00d4ff" />
						</View>
						<Text style={styles.logoText}>Kasir Digital Toko Annaya</Text>
					</View>

					{/* Primary Action Buttons */}
					<View style={styles.primaryButtonsContainer}>
						<TouchableOpacity
							style={styles.primaryButton}
							onPress={handleStartTransaction}
						>
							<Ionicons name="cart-outline" size={30} color="#00d4ff" />
							<Text style={styles.primaryButtonText}>Mulai Transaksi</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.primaryButton}
							onPress={handleManageStock}
						>
							<Ionicons name="cube-outline" size={30} color="#00d4ff" />
							<Text style={styles.primaryButtonText}>Kelola Stok</Text>
						</TouchableOpacity>
					</View>

					{/* Secondary Action Buttons */}
					<View style={styles.secondaryButtonsContainer}>
						<TouchableOpacity
							style={styles.secondaryButton}
							onPress={handleViewLogs}
						>
							<View style={styles.secondaryButtonContent}>
								<View style={styles.iconContainer}>
									<Ionicons name="receipt-outline" size={24} color="#00d4ff" />
								</View>
								<View style={styles.buttonTextContainer}>
									<Text style={styles.secondaryButtonText}>Lihat Log</Text>
									<Text style={styles.secondaryButtonSubtext}>
										Lihat riwayat penambahan stok dan transaksi
									</Text>
								</View>
							</View>
						</TouchableOpacity>
						{/* Tombol Laporan Keuangan telah dihapus dari sini */}
					</View>

					{/* Financial Report Section (Tetap ada) */}
					<View style={styles.statsContainer}>
						<Text style={styles.statsTitle}>Ringkasan Pemasukan</Text>
						<View style={styles.statRow}>
							<Text style={styles.statLabel}>Minggu Ini:</Text>
							<Text style={styles.statValue}>
								Rp{" "}
								{weeklyIncome !== null
									? weeklyIncome.toLocaleString("id-ID")
									: "..."}
							</Text>
						</View>
						<View style={styles.statRow}>
							<Text style={styles.statLabel}>Bulan Ini:</Text>
							<Text style={styles.statValue}>
								Rp{" "}
								{monthlyIncome !== null
									? monthlyIncome.toLocaleString("id-ID")
									: "..."}
							</Text>
						</View>
						<View style={styles.statRow}>
							<Text style={styles.statLabel}>Pengeluaran Minggu Ini:</Text>
							<Text style={styles.statValue}>
								Rp{" "}
								{weeklyExpenditure !== null
									? weeklyExpenditure.toLocaleString("id-ID")
									: "..."}
							</Text>
						</View>
						<View style={styles.statRow}>
							<Text style={styles.statLabel}>Pengeluaran Bulan Ini:</Text>
							<Text style={styles.statValue}>
								Rp{" "}
								{monthlyExpenditure !== null
									? monthlyExpenditure.toLocaleString("id-ID")
									: "..."}
							</Text>
						</View>
					</View>
				</ScrollView>
			</LinearGradient>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a1a2e",
		marginBottom: 15 + (StatusBar.currentHeight || 0), // Add some space at the bottom
	},
	gradient: {
		flex: 1,
	},
	scrollViewContent: {
		flexGrow: 1,
		paddingVertical: StatusBar.currentHeight || 0,
		paddingHorizontal: 20,
	},
	header: {
		alignItems: "center",
		marginBottom: 40,
		marginTop: 20,
	},
	greeting: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#ffffff",
	},
	appName: {
		fontSize: 16,
		color: "#00d4ff",
		marginTop: 4,
	},
	primaryButtonsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 30,
	},
	primaryButton: {
		backgroundColor: "#16213e", // Warna latar belakang yang lebih gelap
		paddingVertical: 25,
		paddingHorizontal: 15,
		borderRadius: 15,
		alignItems: "center",
		width: "48%", // Sesuaikan lebar agar pas 2 kolom
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.3)", // Border warna terang
		shadowColor: "#00d4ff", // Efek shadow
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 8,
	},
	primaryButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
		marginTop: 10,
	},
	secondaryButtonsContainer: {
		marginBottom: 30,
	},
	secondaryButton: {
		backgroundColor: "rgba(255, 255, 255, 0.08)",
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.3)",
		marginBottom: 10, // Added margin for spacing between secondary buttons
	},
	secondaryButtonContent: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 20,
		paddingHorizontal: 24,
	},
	iconContainer: {
		width: 50,
		height: 50,
		backgroundColor: "rgba(0, 212, 255, 0.1)",
		borderRadius: 25,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 16,
	},
	buttonTextContainer: {
		flex: 1,
	},
	secondaryButtonText: {
		fontSize: 18,
		color: "#ffffff",
		fontWeight: "600",
	},
	secondaryButtonSubtext: {
		fontSize: 14,
		color: "#b0b3b8",
		marginTop: 2,
	},
	// Styles for Financial Report Section (Tetap ada)
	statsContainer: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 16,
		padding: 20,
		marginVertical: 20,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.3)",
	},
	statsTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#00d4ff",
		marginBottom: 15,
		textAlign: "center",
	},
	statRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 10,
	},
	statLabel: {
		fontSize: 16,
		color: "#b0b3b8",
	},
	statValue: {
		fontSize: 16,
		fontWeight: "bold",
		color: "white",
	},
	logoContainer: {
		alignItems: "center",
		marginBottom: 40,
	},
	logoBackground: {
		width: 140,
		height: 140,
		backgroundColor: "rgba(0, 212, 255, 0.1)",
		borderRadius: 70,
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 2,
		borderColor: "rgba(0, 212, 255, 0.3)",
		marginBottom: 20,
	},
	logoText: {
		fontSize: 24,
		color: "#ffffff",
		fontWeight: "bold",
		marginBottom: 5,
	},
});
