import { View, Text, StyleSheet } from 'react-native';
import { Expense } from '@/types';
import { CATEGORY_EMOJIS } from '@/constants/categories';

interface Props {
  expense: Expense;
}

export default function SuccessCard({ expense }: Props) {
  const emoji = CATEGORY_EMOJIS[expense.category] || '📦';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Added Successfully!</Text>
      <Text style={styles.detail}>
        Amount: {expense.currency === 'INR' ? '₹' : expense.currency}
        {expense.amount.toFixed(2)}
      </Text>
      <Text style={styles.detail}>
        Category: {emoji} {expense.category}
      </Text>
      <Text style={styles.detail}>Description: {expense.description}</Text>
      {expense.merchant && (
        <Text style={styles.detail}>Merchant: {expense.merchant}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    color: '#047857',
    marginBottom: 4,
  },
});
