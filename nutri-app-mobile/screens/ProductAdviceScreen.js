import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Pressable, ScrollView, StyleSheet, Dimensions, ActivityIndicator, Animated, Alert } from 'react-native';
import { Camera, CameraType } from 'expo-camera/legacy';
import * as FileSystem from 'expo-file-system';
import Icon from 'react-native-vector-icons/Ionicons';
import { getFirestore, doc, getDoc } from '@firebase/firestore';
import { getAuth } from '@firebase/auth';
import { AuthContext } from './AuthContext';

export default function ProductAdviceScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(CameraType.back);
  const [photos, setPhotos] = useState([]);
  const [photoCount, setPhotoCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState([]);
  const [personalData, setPersonalData] = useState(null);
  const [showAdvice, setShowAdvice] = useState(false);

  const { user } = useContext(AuthContext);
  const cameraRef = useRef(null);

  const adviceButtonScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;

  const auth = getAuth();
  const db = getFirestore();

  const photoPrompts = ['Ingredients', 'Nutritional Table'];

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
      friction: 3,
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

  const takePicture = async () => {
    if (cameraRef.current && photoCount < 2) {
      const photo = await cameraRef.current.takePictureAsync();
      const cacheDir = FileSystem.cacheDirectory + `photo_${photoCount + 1}.jpg`;

      await FileSystem.moveAsync({
        from: photo.uri,
        to: cacheDir,
      });

      setPhotos([...photos, cacheDir]);
      setPhotoCount(photoCount + 1);
    }
  };

  const uploadPhotos = async () => {
    if (photos.length === 2 && personalData) {
      setIsProcessing(true);
      const formData = new FormData();

      photos.forEach((photo, index) => {
        formData.append(`file${index + 1}`, {
          uri: photo,
          type: 'image/jpeg',
          name: `photo_${index + 1}.jpg`,
        });
      });

      formData.append('personal_data', JSON.stringify(personalData));

      try {
        const response = await axios.post('http://192.168.1.7:5000/product-advice/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const { advice } = response.data;
        setExtractedText([{ sender: 'App', text: `${advice}`, type: 'Advice' }]);

        photos.forEach(async (photo) => {
          await FileSystem.deleteAsync(photo, { idempotent: true });
        });

        setPhotos([]);
        setPhotoCount(0);
        setIsProcessing(false);
        setShowAdvice(true);
      } catch (error) {
        console.error('Error uploading photos:', error);
      }
    } else {
      Alert.alert('Photo Requirement', 'Please take 2 photos and ensure personal data is loaded.');
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
        <Camera style={styles.camera} type={type} ref={cameraRef}>
          <View style={styles.cameraOverlay}>
            {photoCount < 2 && (
              <>
                <Text style={styles.photoPrompt}>{photoPrompts[photoCount]}</Text>
                <Pressable onPress={takePicture} style={styles.iconButton}>
                  <View style={styles.animatedButton}>
                    <Icon name="camera-outline" size={40} color="white" />
                  </View>
                </Pressable>
              </>
            )}
            {photoCount === 2 && (
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
      ) : (
        <ScrollView style={styles.chatContainer}>
          {extractedText.map((msg, index) => (
            <View key={index} style={styles.chatBubble}>
              <Text style={styles.chatSender}>{msg.type}</Text>
              <Text style={styles.chatMessage}>{msg.text}</Text>
            </View>
          ))}
          <Pressable
            onPressIn={() => handlePressIn(backButtonScale)}
            onPressOut={() => handlePressOut(backButtonScale)}
            onPress={() => {
              setShowAdvice(false);
              setPhotoCount(0);
              setPhotos([]);
            }}
          >
            <Animated.View style={[styles.backButton, { transform: [{ scale: backButtonScale }] }]}>
              <Icon name="arrow-back" size={30} color="blue" />
            </Animated.View>
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
  animatedButton: {
    backgroundColor: 'gray',
    padding: 20,
    borderRadius: 50,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    alignItems: 'center',
    marginBottom: 20,
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
  photoPrompt: {
    fontSize: 15,
    color: '#cce6ff',
    marginBottom: 10,
  },
  chatContainer: {
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
