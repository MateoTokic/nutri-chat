import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, Alert, Animated } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';


const UpdatePersonalData = ({ navigation }) => {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');


  const auth = getAuth(app);
  const db = getFirestore(app);

  
  const scaleValue = new Animated.Value(1);

  const handleUpdate = async () => {
    const currentUser = auth.currentUser;

    if (currentUser) {
      if (!gender || !activityLevel) {
        Alert.alert('Error', 'Please fill all the required fields (Gender, Activity Level)');
        return;
      }  
      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          age,
          gender,
          activity_level: activityLevel,
          height,
          weight,
          target_weight: targetWeight,
        });

        Alert.alert('Success', 'Personal data updated successfully');
        navigation.replace('HomeTabs');
      } catch (error) {
        Alert.alert('Error', 'Error updating personal data: ' + error.message);
      }
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
      <Text style={styles.title}>Update Personal Data</Text>

      <TextInput
        style={[pickerSelectStyles.input, styles.textInput]}
        placeholder="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      <RNPickerSelect
        onValueChange={(value) => setGender(value)}
        items={[
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
        ]}
        placeholder={{ label: 'Select Gender', value: '' }}
        style={pickerSelectStyles}
      />

      <RNPickerSelect
        onValueChange={(value) => setActivityLevel(value)}
        items={[
          { label: '1 - Sedentary', value: '1' },
          { label: '2 - Light Activity', value: '2' },
          { label: '3 - Moderate Activity', value: '3' },
          { label: '4 - Active', value: '4' },
          { label: '5 - Very Active', value: '5' },
        ]}
        placeholder={{ label: 'Select Activity Level', value: '' }}
        style={pickerSelectStyles}
      />

      <TextInput
        style={[pickerSelectStyles.input, styles.textInput]}
        placeholder="Height (in cm)"
        value={height}
        onChangeText={setHeight}
        keyboardType="numeric"
      />

      <TextInput
        style={[pickerSelectStyles.input, styles.textInput]}
        placeholder="Weight (in kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
      />

      <TextInput
        style={[pickerSelectStyles.input, styles.textInput]}
        placeholder="Target Weight (in kg)"
        value={targetWeight}
        onChangeText={setTargetWeight}
        keyboardType="numeric"
      />

      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleUpdate}
        style={({ pressed }) => [
          styles.updateButton,
          pressed && styles.buttonPressed,
        ]}>
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <Text style={styles.updateButtonText}>Update Data</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
};

export default UpdatePersonalData;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  updateButton: {
    borderColor: '#3333cc',
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
    backgroundColor: '#e6e6ff',
  },
  updateButtonText: {
    color: '#3333cc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    color: '#3333cc',
    backgroundColor: 'white',
    borderColor: '#3333cc',
    borderWidth: 1,
    borderRadius: 4,
    width: '100%',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#3333cc',
    borderRadius: 4,
    color: '#3333cc',
    paddingRight: 30,
    backgroundColor: 'white',
    marginBottom: 16,
    width: '100%',
  },
});
