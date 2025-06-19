// app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
	Dimensions,
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
} from "../database";

import { useFocusEffect } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
	const [weeklyIncome, setWeeklyIncome] = useState<number | null>(null);
	const [monthlyIncome, setMonthlyIncome] = useState<number | null>(null);
	const [weeklyExpenditure, setWeeklyExpenditure] = useState<number | null>(
		null
	);
	const [monthlyExpenditure, setMonthlyExpenditure] = useState<number | null>(
		null
	);

	useEffect(() => {
		const initializeDatabase = async () => {
			try {
				await initDB();
				console.log("Database initialized successfully.");
			} catch (error) {
				console.error("Failed to initialize database:", error);
			}
		};

		initializeDatabase();
	}, []);

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
			setWeeklyIncome(0);
			setMonthlyIncome(0);
			setWeeklyExpenditure(0);
			setMonthlyExpenditure(0);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			fetchFinancialData();
		}, [fetchFinancialData])
	);

	const handleManageStock = () => {
		router.push("./StockStack");
	};

	const handleStartTransaction = () => {
		router.push("./TransactionScreen");
	};

	const handleViewLogs = () => {
		router.push("./logScreen");
	};

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
					{/* Header with Liquid Glass Effect */}
					<View style={styles.headerContainer}>
						<View style={styles.header}>
							<Text style={styles.greeting}>Selamat Datang! 👋</Text>
							<Text style={styles.appName}>Toko Annaya Tegal</Text>
						</View>
					</View>

					{/* Logo Section with Enhanced Glass Effect */}
					<View style={styles.logoContainer}>
						<View style={styles.logoBackground}>
							<LinearGradient
								colors={["rgba(59, 130, 246, 0.8)", "rgba(99, 102, 241, 0.8)"]}
								style={styles.logoGradient}
							>
								<Ionicons name="storefront" size={60} color="white" />
							</LinearGradient>
						</View>
						<Text style={styles.logoText}>Kasir Digital Toko Annaya</Text>
					</View>

					{/* Primary Action Buttons with Liquid Glass */}
					<View style={styles.primaryButtonsContainer}>
						<TouchableOpacity
							style={[styles.primaryButton, styles.liquidGlass]}
							onPress={handleStartTransaction}
							activeOpacity={0.8}
						>
							<LinearGradient
								colors={["rgba(34, 197, 94, 0.1)", "rgba(34, 197, 94, 0.05)"]}
								style={styles.buttonGradient}
							>
								<View style={styles.iconBackground}>
									<Ionicons name="cart-outline" size={28} color="#059669" />
								</View>
								<Text style={styles.primaryButtonText}>Mulai Transaksi</Text>
								<Text style={styles.primaryButtonSubtext}>
									Buat transaksi baru
								</Text>
							</LinearGradient>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.primaryButton, styles.liquidGlass]}
							onPress={handleManageStock}
							activeOpacity={0.8}
						>
							<LinearGradient
								colors={["rgba(168, 85, 247, 0.1)", "rgba(168, 85, 247, 0.05)"]}
								style={styles.buttonGradient}
							>
								<View style={styles.iconBackground}>
									<Ionicons name="cube-outline" size={28} color="#7c3aed" />
								</View>
								<Text style={styles.primaryButtonText}>Kelola Stok</Text>
								<Text style={styles.primaryButtonSubtext}>Atur inventori</Text>
							</LinearGradient>
						</TouchableOpacity>
					</View>

					{/* Secondary Action Button */}
					<TouchableOpacity
						style={[styles.secondaryButton, styles.liquidGlass]}
						onPress={handleViewLogs}
						activeOpacity={0.8}
					>
						<LinearGradient
							colors={["rgba(251, 191, 36, 0.1)", "rgba(251, 191, 36, 0.05)"]}
							style={styles.secondaryButtonGradient}
						>
							<View style={styles.secondaryIconContainer}>
								<Ionicons name="receipt-outline" size={24} color="#d97706" />
							</View>
							<View style={styles.buttonTextContainer}>
								<Text style={styles.secondaryButtonText}>
									Lihat Log Aktivitas
								</Text>
								<Text style={styles.secondaryButtonSubtext}>
									Riwayat transaksi dan perubahan stok
								</Text>
							</View>
							<View style={styles.arrowContainer}>
								<Ionicons name="chevron-forward" size={20} color="#64748b" />
							</View>
						</LinearGradient>
					</TouchableOpacity>

					{/* Financial Summary with Enhanced Glass Effect */}
					<View style={[styles.statsContainer, styles.liquidGlass]}>
						<LinearGradient
							colors={["rgba(59, 130, 246, 0.08)", "rgba(99, 102, 241, 0.08)"]}
							style={styles.statsGradient}
						>
							<View style={styles.statsHeader}>
								<Ionicons name="analytics-outline" size={24} color="#3b82f6" />
								<Text style={styles.statsTitle}>Ringkasan Keuangan</Text>
							</View>

							<View style={styles.statsGrid}>
								<View style={styles.statCard}>
									<Text style={styles.statLabel}>Pemasukan Minggu</Text>
									<Text style={styles.statValue}>
										Rp{" "}
										{weeklyIncome !== null
											? weeklyIncome.toLocaleString("id-ID")
											: "0"}
									</Text>
								</View>

								<View style={styles.statCard}>
									<Text style={styles.statLabel}>Pemasukan Bulan</Text>
									<Text style={styles.statValue}>
										Rp{" "}
										{monthlyIncome !== null
											? monthlyIncome.toLocaleString("id-ID")
											: "0"}
									</Text>
								</View>

								<View style={styles.statCard}>
									<Text style={styles.statLabel}>Pengeluaran Minggu</Text>
									<Text style={styles.statValueNegative}>
										Rp{" "}
										{weeklyExpenditure !== null
											? weeklyExpenditure.toLocaleString("id-ID")
											: "0"}
									</Text>
								</View>

								<View style={styles.statCard}>
									<Text style={styles.statLabel}>Pengeluaran Bulan</Text>
									<Text style={styles.statValueNegative}>
										Rp{" "}
										{monthlyExpenditure !== null
											? monthlyExpenditure.toLocaleString("id-ID")
											: "0"}
									</Text>
								</View>
							</View>
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
	headerContainer: {
		marginBottom: 32,
	},
	header: {
		backgroundColor: "rgba(255, 255, 255, 0.3)",
		borderRadius: 20,
		padding: 24,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.5)",
	},
	greeting: {
		fontSize: 28,
		fontWeight: "800",
		color: "#1e293b",
		marginBottom: 4,
		textAlign: "center",
	},
	appName: {
		fontSize: 16,
		color: "#3b82f6",
		fontWeight: "600",
	},
	logoContainer: {
		alignItems: "center",
		marginBottom: 40,
	},
	logoBackground: {
		width: 120,
		height: 120,
		borderRadius: 30,
		marginBottom: 16,
		overflow: "hidden",
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.3)",
	},
	logoGradient: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	logoText: {
		fontSize: 20,
		color: "#1e293b",
		fontWeight: "700",
		textAlign: "center",
	},
	primaryButtonsContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 24,
		gap: 16,
	},
	primaryButton: {
		flex: 1,
		borderRadius: 20,
		overflow: "hidden",
		minHeight: 140,
	},
	buttonGradient: {
		flex: 1,
		padding: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	iconBackground: {
		width: 56,
		height: 56,
		borderRadius: 16,
		backgroundColor: "rgba(255, 255, 255, 0.8)",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 12,
	},
	primaryButtonText: {
		color: "#1e293b",
		fontSize: 16,
		fontWeight: "700",
		textAlign: "center",
		marginBottom: 4,
	},
	primaryButtonSubtext: {
		color: "#64748b",
		fontSize: 12,
		fontWeight: "500",
		textAlign: "center",
	},
	secondaryButton: {
		borderRadius: 20,
		marginBottom: 24,
		overflow: "hidden",
	},
	secondaryButtonGradient: {
		flexDirection: "row",
		alignItems: "center",
		padding: 20,
	},
	secondaryIconContainer: {
		width: 48,
		height: 48,
		backgroundColor: "rgba(255, 255, 255, 0.8)",
		borderRadius: 14,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 16,
	},
	buttonTextContainer: {
		flex: 1,
	},
	secondaryButtonText: {
		fontSize: 18,
		color: "#1e293b",
		fontWeight: "700",
		marginBottom: 2,
	},
	secondaryButtonSubtext: {
		fontSize: 14,
		color: "#64748b",
		fontWeight: "500",
	},
	arrowContainer: {
		marginLeft: 12,
	},
	statsContainer: {
		borderRadius: 24,
		overflow: "hidden",
	},
	statsGradient: {
		padding: 24,
	},
	statsHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 20,
	},
	statsTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: "#1e293b",
		marginLeft: 12,
	},
	statsGrid: {
		gap: 16,
	},
	statCard: {
		backgroundColor: "rgba(255, 255, 255, 0.6)",
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.8)",
	},
	statLabel: {
		fontSize: 14,
		color: "#64748b",
		fontWeight: "600",
		marginBottom: 8,
	},
	statValue: {
		fontSize: 18,
		fontWeight: "800",
		color: "#059669",
	},
	statValueNegative: {
		fontSize: 18,
		fontWeight: "800",
		color: "#dc2626",
	},
});
