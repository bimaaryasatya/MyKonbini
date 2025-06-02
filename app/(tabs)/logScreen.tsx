// screens/LogScreen.tsx
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getLogEntries, LogEntry } from "../database"; // Import getLogEntries and LogEntry interface

const { width } = Dimensions.get("window");

export default function LogScreen() {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logs = await getLogEntries();
        setLogEntries(logs);
      } catch (error) {
        Alert.alert("Error", "Gagal memuat log.");
        console.error("Error fetching log entries:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerText, { flex: 3 }]}>Nama Barang</Text>
      <Text style={[styles.headerText, { flex: 1.5 }]}>Jumlah</Text>
      <Text style={[styles.headerText, { flex: 2 }]}>SKU</Text>
      <Text style={[styles.headerText, { flex: 3 }]}>Tanggal & Waktu</Text>
    </View>
  );

  const TableRow = ({ item }: { item: LogEntry }) => (
    <View style={styles.tableRow}>
      <View style={[styles.cellContainer, { flex: 3 }]}>
        <Text style={styles.cellText} numberOfLines={2}>
          {item.nama_barang}
        </Text>
      </View>
      <View style={[styles.cellContainer, { flex: 1.5 }]}>
        <Text style={styles.cellText} numberOfLines={1}>
          {item.jumlah_ditambah}
        </Text>
      </View>
      <View style={[styles.cellContainer, { flex: 2 }]}>
        <Text style={styles.cellText} numberOfLines={1}>
          {item.sku}
        </Text>
      </View>
      <View style={[styles.cellContainer, { flex: 3 }]}>
        <Text style={styles.cellText} numberOfLines={2}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Memuat Log...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1419" />
      <View style={styles.header}>
        <Text style={styles.title}>Log Penambahan Barang</Text>
        <Text style={styles.subtitle}>Catatan aktivitas penambahan stok</Text>
      </View>

      <View style={styles.tableContainer}>
        <Text style={styles.listTitle}>
          Daftar Log ({logEntries.length} entri)
        </Text>

        <View style={styles.table}>
          <TableHeader />
          <FlatList
            data={logEntries}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <TableRow item={item} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Tidak ada entri log.</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1419", // Dark background
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f1419",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 212, 255, 0.3)",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#b0b3b8",
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
    marginTop: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 12,
  },
  table: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 212, 255, 0.1)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 212, 255, 0.2)",
  },
  headerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#00d4ff",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    minHeight: 50,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginHorizontal: 12,
  },
  cellContainer: {
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cellText: {
    fontSize: 13,
    color: "white",
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#b0b3b8",
    fontSize: 16,
    fontStyle: "italic",
  },
});
