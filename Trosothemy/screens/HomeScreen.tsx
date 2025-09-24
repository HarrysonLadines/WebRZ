import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Alert, 
  StyleSheet, 
  TouchableOpacity, 
  Animated 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import { Reminder } from '../utils/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Cargo los recordatorios desde AsyncStorage
  const loadReminders = useCallback(async () => {
    try {
      const storedReminders = await AsyncStorage.getItem('reminders');
      const list = storedReminders ? JSON.parse(storedReminders) : [];
      setReminders(list);
      fadeIn(); // para que aparezcan con efecto
    } catch (error) {
      Alert.alert('Oops!', 'No pudimos cargar tus recordatorios. Intenta de nuevo.');
    }
  }, [fadeAnim]);

  // Animación para hacer aparecer los recordatorios suavemente
  const fadeIn = useCallback(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    // Al entrar a la pantalla, recargamos los recordatorios
    const unsubscribe = navigation.addListener('focus', () => {
      loadReminders();
    });

    // También cargamos apenas se monta la pantalla
    loadReminders();

    return unsubscribe; // limpieza para evitar leaks
  }, [navigation, loadReminders]);

  // Pregunto antes de eliminar un recordatorio
  const confirmDelete = (timestamp: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Seguro quieres eliminar este recordatorio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteReminder(timestamp) }
      ]
    );
  };

  // Elimino el recordatorio de AsyncStorage y del estado
  const deleteReminder = async (timestamp: number) => {
    try {
      const filtered = reminders.filter(r => r.timestamp !== timestamp);
      await AsyncStorage.setItem('reminders', JSON.stringify(filtered));
      setReminders(filtered);
      fadeIn();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el recordatorio. Intenta de nuevo.');
    }
  };

  // Render de cada recordatorio en la lista
  const renderItem = ({ item }: { item: Reminder }) => (
    <View style={styles.reminderItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.note}>{item.note}</Text>
        <Text style={styles.coords}>
          Lat: {item.location.latitude.toFixed(4)}, Lon: {item.location.longitude.toFixed(4)}
        </Text>
      </View>
      {/* Botón para editar */}
      <TouchableOpacity
        onPress={() => navigation.navigate('AddReminder', { reminderToEdit: item })}
        style={styles.iconButton}
      >
        <MaterialIcons name="edit" size={24} color="#007AFF" />
      </TouchableOpacity>
      {/* Botón para eliminar */}
      <TouchableOpacity onPress={() => confirmDelete(item.timestamp)} style={styles.iconButton}>
        <MaterialIcons name="delete" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📌 Tus Recordatorios por Ubicación</Text>

      {/* Lista animada */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          data={reminders}
          keyExtractor={(item) => item.timestamp.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No hay recordatorios aún.</Text>}
        />
      </Animated.View>

      {/* Botón flotante para agregar recordatorios */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddReminder')}
      >
        <MaterialIcons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    marginBottom: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#222',
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  note: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  coords: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
  iconButton: {
    marginLeft: 15,
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
    fontSize: 16,
  },
  addButton: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
});
