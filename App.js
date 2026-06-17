import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { initDB } from './database/db';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDB().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return <AppNavigator />;
}