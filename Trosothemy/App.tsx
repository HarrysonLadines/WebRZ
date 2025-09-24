import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Reminder } from './utils/types';

import HomeScreen from './screens/HomeScreen';
import AddReminderScreen from './screens/AddReminderScreen';

// Definimos las pantallas que tiene nuestra app
export type RootStackParamList = {
  Home: undefined;
  AddReminder: { reminderToEdit?: Reminder } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const LOCATION_TASK_NAME = 'background-location-task';

/**
 * Función para calcular distancia entre dos coordenadas usando fórmula Haversine
 * Devuelve distancia en kilómetros
 */
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // radio de la Tierra
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Verifica si el usuario está a menos de 500m de un recordatorio
 */
const isNearReminder = (
  userLat: number,
  userLon: number,
  reminderLat: number,
  reminderLon: number
) => {
  const distance = getDistance(userLat, userLon, reminderLat, reminderLon);
  return distance <= 0.5;
};

/**
 * Envía una notificación local con el texto del recordatorio
 */
const sendNotification = async (note: string) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📍 ¡Recordatorio de Ubicación!',
      body: `Estás cerca de un lugar con un recordatorio: ${note}`,
    },
    trigger: {
      seconds: 1,
      repeats: false,
    } as Notifications.TimeIntervalTriggerInput,
  });
};

/**
 * Tarea de background que se ejecuta cuando cambia la ubicación del usuario
 * Esta parte corre incluso si la app está cerrada
 */
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Error en background task:', error);
    return;
  }

  const { locations } = data as {
    locations: Array<{ coords: { latitude: number; longitude: number } }>;
  };

  if (!locations || locations.length === 0) return;

  const { latitude, longitude } = locations[0].coords;
  console.log('Ubicación en segundo plano:', latitude, longitude);

  // Cargo recordatorios guardados en AsyncStorage
  const reminders = await AsyncStorage.getItem('reminders');
  const remindersList: Reminder[] = reminders ? JSON.parse(reminders) : [];

  // Recorro todos los recordatorios y notifico si estoy cerca
  for (const reminder of remindersList) {
    if (
      isNearReminder(
        latitude,
        longitude,
        reminder.location.latitude,
        reminder.location.longitude
      )
    ) {
      await sendNotification(reminder.note);
      break; // notificamos solo el primero para no saturar
    }
  }
});

const App = () => {
  useEffect(() => {
    const requestPermissions = async () => {
      // Pedimos permiso de notificaciones
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('⚠️ Permiso de notificación no concedido');
        return;
      }

      // Configuración de cómo se muestran las notificaciones
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowList: true,
        }),
      });

      // Pedimos permiso de ubicación
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      if (locationStatus.status !== 'granted') {
        console.log('⚠️ Permiso de ubicación no concedido');
        return;
      }

      // Iniciamos tracking de ubicación en segundo plano
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // cada 10 segundos
        distanceInterval: 10, // o cada 10 metros
        foregroundService: {
          notificationTitle: '📡 App corriendo en segundo plano',
          notificationBody: 'Tu ubicación está siendo rastreada',
        },
      });
    };

    requestPermissions();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Recordatorios' }}
        />
        <Stack.Screen 
          name="AddReminder" 
          component={AddReminderScreen} 
          options={{ title: 'Nuevo Recordatorio' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
