import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Alert } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../services/config'; 


const HomeScreen = ({ navigation }) => {
  const [personalData, setPersonalData] = useState(null);
  const [username, setUsername] = useState('');


  const auth = getAuth(app);
  const db = getFirestore(app);

  
  const scaleValue = new Animated.Value(1);


  const fetchPersonalData = async () => {
    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPersonalData(data);
        setUsername(data.username);
      } else {
        console.log('No such document!');
      }
    }
  };

   

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.replace('Auth');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
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
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>Your personal data:</Text>

      {personalData ? (
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Age</Text>
            <Text style={styles.tableValue}>{personalData.age}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Gender</Text>
            <Text style={styles.tableValue}>{personalData.gender}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Activity Level</Text>
            <Text style={styles.tableValue}>{personalData.activity_level}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Height</Text>
            <Text style={styles.tableValue}>{personalData.height} cm</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Weight</Text>
            <Text style={styles.tableValue}>{personalData.weight} kg</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Target Weight</Text>
            <Text style={styles.tableValue}>{personalData.target_weight} kg</Text>
          </View>
        </View>
      ) : (
        <Text>No personal data found.</Text>
      )}

      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleSignOut}
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  table: {
    width: '85%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f4f4f4',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  tableValue: {
    fontSize: 16,
    color: '#3333cc',
  },
  logoutButton: {
    borderColor: 'red',
    borderWidth: 2,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonPressed: {
    backgroundColor: '#ffe6e6',
  },
  logoutButtonText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
