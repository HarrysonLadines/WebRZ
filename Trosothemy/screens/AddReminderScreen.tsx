import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Text,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Reminder } from '../utils/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddReminder'>;

export default function AddReminderScreen({ route, navigation }: Props) {
  // Si venimos a editar, recibimos el recordatorio a modificar
  const reminderToEdit = route.params?.reminderToEdit;

  // Estado para la nota y ubicación
  const [note, setNote] = useState(reminderToEdit ? reminderToEdit.note : '');
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  // Animación de fade-in al cargar pantalla
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Pedir permisos y obtener la ubicación actual del usuario
  const getLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso denegado',
        'Para usar esta función, por favor permite el acceso a la ubicación en la configuración.'
      );
      setLoadingLocation(false);
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    } catch {
      Alert.alert('Error', 'No pudimos obtener tu ubicación. Intenta nuevamente.');
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  // Ejecutamos la función al montar el componente
  useEffect(() => {
    getLocation();
  }, [getLocation]);

  // Guardar o actualizar recordatorio en AsyncStorage
  const handleSave = async () => {
    if (!note.trim()) {
      Alert.alert('Error', 'Por favor ingresa una nota válida.');
      return;
    }
    if (!location) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación. Intenta de nuevo más tarde.');
      return;
    }

    try {
      const existing = await AsyncStorage.getItem('reminders');
      const reminders: Reminder[] = existing ? JSON.parse(existing) : [];

      if (reminderToEdit) {
        // Si estamos editando, reemplazamos el recordatorio por el nuevo
        const updated = reminders.map(r =>
          r.timestamp === reminderToEdit.timestamp
            ? {
                ...r,
                note: note.trim(),
                location: { latitude: location.latitude, longitude: location.longitude },
                timestamp: r.timestamp,
              }
            : r
        );
        await AsyncStorage.setItem('reminders', JSON.stringify(updated));
      } else {
        // Si es uno nuevo, lo agregamos a la lista
        const newReminder: Reminder = {
          note: note.trim(),
          location: { latitude: location.latitude, longitude: location.longitude },
          timestamp: Date.now(),
        };
        reminders.push(newReminder);
        await AsyncStorage.setItem('reminders', JSON.stringify(reminders));
      }

      Alert.alert('Guardado', 'Recordatorio guardado con éxito.');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el recordatorio. Intenta de nuevo.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.label}>Nota para esta ubicación:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Comprar pan"
            value={note}
            onChangeText={setNote}
            multiline
          />

          <Text style={styles.label}>Ubicación actual:</Text>
          {loadingLocation ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : location ? (
            <Text style={styles.locationText}>
              Latitud: {location.latitude.toFixed(6)}{"\n"}
              Longitud: {location.longitude.toFixed(6)}
            </Text>
          ) : (
            <Text style={styles.errorText}>No se pudo obtener la ubicación</Text>
          )}

          {/* Botón personalizado en lugar de <Button/> */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (loadingLocation || !note.trim()) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={loadingLocation || !note.trim()}
          >
            <Text style={styles.saveButtonText}>
              {reminderToEdit ? 'Guardar Cambios' : 'Guardar Recordatorio'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
    backgroundColor: '#fdfdfd',
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 16,
    color: '#222',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#aaa',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
