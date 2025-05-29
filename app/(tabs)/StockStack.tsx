// StockStack.tsx
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import AddItemScreen from "./AddItemScreen";
import EditItemScreen from "./EditItemScreen";
import StockManagement from "./stockmanagement";

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
				options={{ title: "Tambah Barang" }}
			/>
			<Stack.Screen
				name="EditItem"
				component={EditItemScreen}
				options={{ title: "Edit Barang" }}
			/>
		</Stack.Navigator>
	);
}
