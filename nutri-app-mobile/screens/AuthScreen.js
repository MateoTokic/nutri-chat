import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, Pressable, Animated } from 'react-native';
import { getAuth, setPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '../services/config';
import { getReactNativePersistence } from 'firebase/auth';





const AuthScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const auth = getAuth(app); 
  const db = getFirestore(app);

  const scaleValue = new Animated.Value(1);


  const handleAuthentication = async () => {
    try {
      await setPersistence(auth, getReactNativePersistence(ReactNativeAsyncStorage));
  
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        Alert.alert('Success', 'Logged in successfully!');
        navigation.replace('HomeTabs', { screen: 'HomeScreen', params: { userId: user.uid } });
      } else {

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
  
        await setDoc(doc(db, 'users', user.uid), {
          username: username,
          email: user.email,
          createdAt: new Date(),
        });

        navigation.replace('HomeTabs', {screen: 'HomeScreen', params: { userId: user.uid } });
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An error occurred during authentication.');
    }
  };
  


  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.appName}>Nutri Chat</Text>
      <View style={styles.authContainer}>
        <Text style={styles.title}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
        {!isLogin && (
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            autoCapitalize="none"
          />
        )}
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
        />
        <View style={styles.buttonContainer}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleAuthentication}
            style={({ pressed }) => [
              styles.authButton,
              pressed && styles.buttonPressed,
            ]}>
            <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
              <Text style={styles.authButtonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
            </Animated.View>
          </Pressable>
        </View>
        <Text style={styles.toggleText} onPress={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
        </Text>
      </View>
    </ScrollView>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: '#2c3e50',
  },
  authContainer: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 16,
    padding: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  authButton: {
    borderColor: '#3333cc',
    borderWidth: 2,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: '#e6e6ff',
  },
  authButtonText: {
    color: '#3333cc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleText: {
    color: '#3333cc',
    textAlign: 'center',
  },
});
