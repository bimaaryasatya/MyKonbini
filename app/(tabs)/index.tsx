// app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
	Dimensions,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import "react-native-gesture-handler";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
	const handleManageStock = () => {
		// Navigate ke halaman manajemen stok
		router.push("/StockStack");
	};

	const handleStartTransaction = () => {
		// Navigate ke halaman transaksi
		router.push("/");
	};

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

			<LinearGradient
				colors={["#1a1a2e", "#16213e", "#0f3460"]}
				style={styles.gradient}
			>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.greeting}>Selamat Datang</Text>
					<Text style={styles.appName}>CashierPro</Text>
				</View>

				{/* Logo Section */}
				<View style={styles.logoContainer}>
					<View style={styles.logoBackground}>
						<Ionicons name="storefront" size={80} color="#00d4ff" />
					</View>
					<Text style={styles.logoText}>Kasir Digital</Text>
					<Text style={styles.logoSubtext}>
						Solusi Modern untuk Bisnis Anda
					</Text>
				</View>

				{/* Main Actions */}
				<View style={styles.actionsContainer}>
					{/* Transaction Button */}
					<TouchableOpacity
						style={styles.primaryButton}
						onPress={handleStartTransaction}
						activeOpacity={0.8}
					>
						<LinearGradient
							colors={["#00d4ff", "#0099cc"]}
							style={styles.buttonGradient}
						>
							<Ionicons name="card" size={32} color="white" />
							<Text style={styles.primaryButtonText}>Mulai Transaksi</Text>
							<Text style={styles.buttonSubtext}>Proses penjualan baru</Text>
						</LinearGradient>
					</TouchableOpacity>

					{/* Stock Management Button */}
					<TouchableOpacity
						style={styles.secondaryButton}
						onPress={handleManageStock}
						activeOpacity={0.8}
					>
						<View style={styles.secondaryButtonContent}>
							<View style={styles.iconContainer}>
								<Ionicons name="cube" size={28} color="#00d4ff" />
							</View>
							<View style={styles.buttonTextContainer}>
								<Text style={styles.secondaryButtonText}>Manajemen Stok</Text>
								<Text style={styles.secondaryButtonSubtext}>
									Kelola inventori barang
								</Text>
							</View>
							<Ionicons name="chevron-forward" size={24} color="#00d4ff" />
						</View>
					</TouchableOpacity>
				</View>

				{/* Quick Stats */}
				<View style={styles.statsContainer}>
					<View style={styles.statsRow}>
						<View style={styles.statItem}>
							<Ionicons name="trending-up" size={24} color="#4CAF50" />
							<Text style={styles.statNumber}>142</Text>
							<Text style={styles.statLabel}>Transaksi Hari Ini</Text>
						</View>
						<View style={styles.statDivider} />
						<View style={styles.statItem}>
							<Ionicons name="wallet" size={24} color="#FF9800" />
							<Text style={styles.statNumber}>Rp 2.5M</Text>
							<Text style={styles.statLabel}>Total Penjualan</Text>
						</View>
					</View>
				</View>

				{/* Footer */}
				<View style={styles.footer}>
					<Text style={styles.footerText}>
						© 2024 CashierPro - Powered by Expo Router
					</Text>
				</View>
			</LinearGradient>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a1a2e",
	},
	gradient: {
		flex: 1,
		paddingHorizontal: 20,
	},
	header: {
		alignItems: "center",
		marginTop: 20,
		marginBottom: 30,
	},
	greeting: {
		fontSize: 18,
		color: "#b0b3b8",
		fontWeight: "300",
	},
	appName: {
		fontSize: 28,
		color: "#ffffff",
		fontWeight: "bold",
		marginTop: 5,
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
	logoSubtext: {
		fontSize: 14,
		color: "#b0b3b8",
		textAlign: "center",
	},
	actionsContainer: {
		flex: 1,
		justifyContent: "center",
		paddingVertical: 20,
	},
	primaryButton: {
		marginBottom: 20,
		borderRadius: 16,
		elevation: 8,
		shadowColor: "#00d4ff",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
	},
	buttonGradient: {
		paddingVertical: 24,
		paddingHorizontal: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	primaryButtonText: {
		fontSize: 20,
		color: "white",
		fontWeight: "bold",
		marginTop: 8,
	},
	buttonSubtext: {
		fontSize: 14,
		color: "rgba(255, 255, 255, 0.8)",
		marginTop: 4,
	},
	secondaryButton: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "rgba(0, 212, 255, 0.3)",
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
	statsContainer: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 16,
		padding: 20,
		marginVertical: 20,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
	},
	statsRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	statItem: {
		flex: 1,
		alignItems: "center",
	},
	statDivider: {
		width: 1,
		height: 40,
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		marginHorizontal: 20,
	},
	statNumber: {
		fontSize: 20,
		color: "#ffffff",
		fontWeight: "bold",
		marginTop: 8,
	},
	statLabel: {
		fontSize: 12,
		color: "#b0b3b8",
		textAlign: "center",
		marginTop: 4,
	},
	footer: {
		alignItems: "center",
		paddingBottom: 20,
		paddingTop: 10,
	},
	footerText: {
		fontSize: 12,
		color: "#7a7a7a",
	},
});
