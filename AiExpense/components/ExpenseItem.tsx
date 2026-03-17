import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Expense } from '@/types';
import { CATEGORY_EMOJIS } from '@/constants/categories';

// SQLite datetime('now') stores UTC without Z suffix — append Z to parse correctly
function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString + 'Z');
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

interface Props {
  expense: Expense;
  onDelete: (id: number) => void;
}

export default function ExpenseItem({ expense, onDelete }: Props) {
  const emoji = CATEGORY_EMOJIS[expense.category] || '📦';

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(expense.id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.category}>
            {emoji} {expense.category}
          </Text>
          <Text style={styles.description}>{expense.description}</Text>
          <Text style={styles.time}>{timeAgo(expense.created_at)}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>
            {expense.currency === 'INR' ? '₹' : expense.currency}
            {expense.amount.toFixed(2)}
          </Text>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  category: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  deleteButton: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  deleteText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
});
