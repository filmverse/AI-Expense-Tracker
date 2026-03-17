import { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

interface Props {
  onSubmit: (text: string) => Promise<void>;
  loading: boolean;
}

export default function ExpenseInput({ onSubmit, loading }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = async () => {
    if (!text.trim() || loading) return;
    await onSubmit(text.trim());
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="e.g., Spent 500 on groceries at BigBazaar"
        placeholderTextColor="#999"
        value={text}
        onChangeText={setText}
        editable={!loading}
        returnKeyType="send"
        onSubmitEditing={handleSubmit}
      />
      <TouchableOpacity
        style={[
          styles.button,
          (!text.trim() || loading) && styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!text.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Add</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
