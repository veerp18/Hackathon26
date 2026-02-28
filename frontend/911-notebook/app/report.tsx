import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function ReportScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
