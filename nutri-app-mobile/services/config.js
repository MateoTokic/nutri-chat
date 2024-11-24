import { initializeApp } from '@firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';



const firebaseConfig = {
  apiKey: "AIzaSyBlZxa-HQrZu-fLlG9nuPkF6wh0YurpVeY",
  authDomain: "nutri-app-mobile.firebaseapp.com",
  projectId: "nutri-app-mobile",
  storageBucket: "nutri-app-mobile.appspot.com",
  messagingSenderId: "157008882352",
  appId: "1:157008882352:web:e5014002d538e8fbde6975",
  measurementId: "G-E656FGJCV1",
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export default { app, auth };
