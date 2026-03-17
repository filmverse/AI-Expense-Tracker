import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Expense } from '@/types';
import * as api from '@/services/api';
import ExpenseInput from '@/components/ExpenseInput';
import SuccessCard from '@/components/SuccessCard';
import ExpenseItem from '@/components/ExpenseItem';

export default function ExpenseTrackerScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastAdded, setLastAdded] = useState<Expense | null>(null);

  const fetchExpenses = async () => {
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch expenses');
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (text: string) => {
    setLoading(true);
    try {
      const expense = await api.addExpense(text);
      setLastAdded(expense);
      await fetchExpenses();
      setTimeout(() => setLastAdded(null), 3000);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await api.deleteExpense(id);
      await fetchExpenses();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete expense');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Expense Tracker</Text>
        <Text style={styles.subtitle}>Add expenses in plain English</Text>
      </View>

      <ExpenseInput onSubmit={handleAddExpense} loading={loading} />

      {lastAdded && <SuccessCard expense={lastAdded} />}

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ExpenseItem expense={item} onDelete={handleDeleteExpense} />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={expenses.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No expenses yet.</Text>
            <Text style={styles.emptySubtext}>Add your first one!</Text>
          </View>
        }
        style={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
