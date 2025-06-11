// StockStack.tsx
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import AddItemScreen from "./AddItemScreen";
import CartScreen from "./CartScreen"; // New Import
import EditItemScreen from "./EditItemScreen";
import LogScreen from "./logScreen";
import ReceiptScreen from "./ReceiptScreen"; // New Import
import StockManagement from "./stockmanagement";
import TransactionScreen from "./TransactionScreen"; // New Import

const Stack = createStackNavigator();

export default function StockStack() {
	return (
		<Stack.Navigator initialRouteName="StockManagement">
			<Stack.Screen
				name="StockManagement"
				component={StockManagement}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="AddItem"
				component={AddItemScreen}
				options={{ title: "Tambah Barang Baru" }}
			/>
			<Stack.Screen
				name="EditItem"
				component={EditItemScreen}
				options={{ title: "Edit Barang" }}
			/>
			<Stack.Screen
				name="LogScreen"
				component={LogScreen}
				options={{ title: "Log Barang" }}
			/>
			<Stack.Screen
				name="TransactionScreen" // New Screen
				component={TransactionScreen}
				options={{ title: "Mulai Transaksi" }}
			/>
			<Stack.Screen
				name="CartScreen" // New Screen
				component={CartScreen}
				options={{ title: "Keranjang Belanja" }}
			/>
			<Stack.Screen
				name="ReceiptScreen" // New Screen
				component={ReceiptScreen}
				options={{ title: "Struk Pembelian" }}
			/>
		</Stack.Navigator>
	);
}