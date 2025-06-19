// StockStack.tsx
import {
	createStackNavigator,
	StackNavigationProp,
} from "@react-navigation/stack";
import React from "react";
import AddItemScreen from "./AddItemScreen";
import CartScreen from "./CartScreen";
import EditItemScreen from "./EditItemScreen";
import LogScreen from "./logScreen";
import ReceiptScreen from "./ReceiptScreen";
import StockManagement from "./stockmanagement";
import TransactionScreen from "./TransactionScreen";
// Pastikan CartItem diimpor untuk typing dari database.tsx atau TransactionScreen.tsx
import { CartItem, TransactionDetails } from "../database"; // <-- Perbarui import ini

// Define the parameter list for your stack navigator
export type RootStackParamList = {
	StockManagement: undefined; // No parameters for StockManagement screen
	AddItem: undefined; // No parameters for AddItem screen
	EditItem: { itemId: number; itemSku: string }; // Example: EditItem expects an itemId and itemSku
	LogScreen: undefined; // No parameters for LogScreen
	TransactionScreen: undefined; // No parameters passed directly on initial navigation
	CartScreen: { cartItems: CartItem[] }; // CartScreen expects an array of CartItem
	ReceiptScreen: {
		transactionDetails: TransactionDetails; // <-- Gunakan TransactionDetails dari database
		fromLogScreen?: boolean;
	}; // ReceiptScreen expects transactionDetails
};

// You can also export a type for the navigation prop if needed elsewhere
export type StockStackNavigationProp = StackNavigationProp<RootStackParamList>;

const Stack = createStackNavigator<RootStackParamList>(); // Use RootStackParamList here

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
				name="TransactionScreen"
				component={TransactionScreen}
				options={{ title: "Mulai Transaksi" }}
			/>
			<Stack.Screen
				name="CartScreen"
				component={CartScreen}
				options={{ title: "Keranjang" }}
			/>
			<Stack.Screen
				name="ReceiptScreen"
				component={ReceiptScreen}
				options={{ title: "Struk Transaksi" }}
			/>
		</Stack.Navigator>
	);
}
