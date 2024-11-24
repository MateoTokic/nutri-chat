import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Pressable, ScrollView, StyleSheet, Dimensions, Alert, Animated, ActivityIndicator } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { Camera, CameraType } from 'expo-camera/legacy';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { getFirestore, doc, getDoc } from '@firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';



axios.interceptors.response.use(
  response => response,
  error => {
    console.log('Axios error details:', error.toJSON());
    return Promise.reject(error);
  }
);


export default function MealAdviceScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(CameraType.back);
  const [photos, setPhotos] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState([]);
  const [personalData, setPersonalData] = useState(null);
  const [showAdvice, setShowAdvice] = useState(false);
  const [numProducts, setNumProducts] = useState(0);
  const [currentProduct, setCurrentProduct] = useState(1);
  const [photoType, setPhotoType] = useState('ingredients');

  const adviceButtonScale = useRef(new Animated.Value(1)).current;
  const startButtonScale = useRef(new Animated.Value(1)).current;

  const photoPrompts = ["Ingredients", "Nutritional Table"];


  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    fetchPersonalData();
  }, []);

  const handlePressIn = (buttonScale) => {
    Animated.spring(buttonScale, {
      toValue: 0.8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (buttonScale) => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 1,
      useNativeDriver: true,
    }).start();
  };

  const fetchPersonalData = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPersonalData(docSnap.data());
        } else {
          console.log('No such document!');
          Alert.alert('Error', 'No personal data found for this user.');
        }
      } catch (error) {
        console.error('Error fetching personal data:', error);
      }
    }
  };
    

  const startMealCapture = () => {
    if (!numProducts) {
      Alert.alert('Please select the number of products.');
      return;
    }
    setCurrentProduct(1);
    setPhotoType('ingredients');
  };

  const takePicture = async () => {
    if (camera && photos.length < numProducts * 2) {
      let photo = await camera.takePictureAsync();
      const photoTypeName = photoType === 'ingredients' ? `ingredients_image_${currentProduct - 1}` : `nutrition_image_${currentProduct - 1}`;
      const cacheDir = `${FileSystem.cacheDirectory}${photoTypeName}.jpg`;

      await FileSystem.moveAsync({ from: photo.uri, to: cacheDir });

      setPhotos([...photos, { type: photoType, uri: cacheDir }]);

      if (photoType === 'ingredients') {
        setPhotoType('nutrition');
      } else {
        if (currentProduct < numProducts) {
          setCurrentProduct(currentProduct + 1);
          setPhotoType('ingredients');
        }
      }
    }
  };


  const uploadPhotos = async () => {
    if (photos.length === numProducts * 2 && personalData) { 
      setIsProcessing(true);
      const formData = new FormData();
  
      photos.forEach((photo, index) => {
        const photoKey = photo.type === 'ingredients' 
          ? `ingredients_image_${Math.floor(index / 2)}` 
          : `nutrition_image_${Math.floor(index / 2)}`;
        
        formData.append(photoKey, {
          uri: photo.uri,
          type: 'image/jpeg',
          name: `${photoKey}.jpg`,
        });
      });
  
      formData.append('personal_data', JSON.stringify(personalData));
  
      try {
        const response = await axios.post('http://192.168.1.7:5000/meal-advice', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
  
        const { advice } = response.data;
        setExtractedText([{ sender: "App", text: `${advice}`, type: "Advice" }]);
  
        photos.forEach(async (photo) => {
          await FileSystem.deleteAsync(photo.uri, { idempotent: true });
        });

        setPhotos([]);
        setIsProcessing(false);
        setShowAdvice(true);
      } catch (error) {
        console.error('Error uploading photos:', error);
      }
    } else {
      Alert.alert('Please capture all required photos and ensure user data is loaded');
    }
  };

  

  if (hasPermission === null) return <View />;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  return (
    <View style={{ flex: 1 }}>
      {isProcessing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#3333cc" />
          <Text style={styles.overlayText}>Processing your request...</Text>
        </View>
      )}

      {!showAdvice ? (
        <View style={{ flex: 1 }}>
          {numProducts === 0 ? (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select number of products:</Text>
              <RNPickerSelect
                onValueChange={(value) => setNumProducts(value)}
                items={[...Array(10).keys()].map((i) => ({ label: `${i + 1}`, value: i + 1 }))}
                style={{
                  inputIOS: styles.pickerInput,
                  inputAndroid: styles.pickerInput,
                  iconContainer: styles.pickerIconContainer,
                }}
                placeholder={{ label: "Select...", value: 0 }}
              />
              <Pressable
                onPressIn={() => handlePressIn(startButtonScale)}
                onPressOut={() => handlePressOut(startButtonScale)}
                onPress={startMealCapture}
              >
                <Animated.View style={[styles.startButton, { transform: [{ scale: startButtonScale }] }]}>
                  <Text style={styles.startButtonText}>Start Camera</Text>
                </Animated.View>
              </Pressable>
            </View>
          ) : (
            <Camera style={styles.camera} type={type} ref={cameraRef}>
              <View style={styles.cameraOverlay}>
                <Text style={styles.photoPrompt}>
                  {photoPrompts[photoType === 'ingredients' ? 0 : 1]} for Product {currentProduct}
                </Text>
                <Pressable onPress={takePicture}>
                  <View style={styles.animatedButton}>
                    <Icon name="camera-outline" size={40} color="white" />
                  </View>
                </Pressable>
                {photos.length === numProducts * 2 && (
                  <Pressable
                    onPressIn={() => handlePressIn(adviceButtonScale)}
                    onPressOut={() => handlePressOut(adviceButtonScale)}
                    onPress={uploadPhotos}
                  >
                    <Animated.View style={[styles.getAdviceButton, { transform: [{ scale: adviceButtonScale }] }]}>
                      <Text style={styles.getAdviceButtonText}>Get Advice</Text>
                    </Animated.View>
                  </Pressable>
                )}
              </View>
            </Camera>
          )}
        </View>
      ) : (
        <ScrollView style={styles.chatContainer}>
          {extractedText.map((msg, index) => (
            <View key={index} style={styles.chatBubble}>
              <Text style={styles.chatSender}>{msg.type}</Text>
              <Text style={styles.chatMessage}>{msg.text}</Text>
            </View>
          ))}
          <Pressable
            onPress={() => {
              setShowAdvice(false);
              setNumProducts(0);
              setPhotoType("ingredients");
              setCurrentProduct(1);
              setPhotos([]);
            }}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={30} color="blue" />
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayText: {
    color: '#3333cc',
    fontSize: 16,
    marginTop: 10,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerInput: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#3333cc',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    color: '#3333cc',
    fontSize: 16,
  },
  startButton: {
    backgroundColor: '#ffffff',
    borderColor: '#3333cc',
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#3333cc',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    width,
    height,
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  photoPrompt: {
    fontSize: 15,
    color: '#cce6ff',
    marginBottom: 10,
  },
  animatedButton: {
    backgroundColor: 'gray',
    padding: 20,
    borderRadius: 50,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getAdviceButton: {
    backgroundColor: '#ffffff',
    borderColor: '#3333cc',
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  getAdviceButtonText: {
    color: '#3333cc',
    fontSize: 18,
    fontWeight: '600',
  },
  chatContainer: {
    fontSize: 15,
    color: '#cce6ff',
    marginBottom: 10,
    flex: 1,
    backgroundColor: '#f4f4f4',
    padding: 10,
    marginTop: 60,
  },
  chatBubble: {
    backgroundColor: '#cce6ff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  chatSender: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  chatMessage: {
    fontSize: 16,
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 20,
  },
});
