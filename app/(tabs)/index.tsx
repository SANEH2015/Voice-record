import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, TextInput, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons'; // Importing Ionicons for icons

const { width, height } = Dimensions.get('window'); // Get the screen width and height

export default function App() {
  const [recording, setRecording] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recordingName, setRecordingName] = useState('');
  const [playingSound, setPlayingSound] = useState<any>(null); // Track the playing sound
  const [editingRecording, setEditingRecording] = useState<any>(null); // Track which recording is being edited
  const [isRecordingCompleted, setIsRecordingCompleted] = useState(false); // Track if recording is completed

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status === 'granted') {
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
        setIsRecording(true);
        setIsRecordingCompleted(false); // Reset recording completed flag
        setRecordingName(''); // Clear previous recording name
      } else {
        alert('Permission to access microphone is required!');
      }
    } catch (error) {
      console.error('Error starting recording', error);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const timestamp = new Date().toLocaleString();
      setRecordings((prevRecordings) => [
        ...prevRecordings,
        { uri, timestamp, name: recordingName || 'Untitled' },
      ]);
      setIsRecording(false);
      setIsRecordingCompleted(true); // Mark recording as completed
    } catch (error) {
      console.error('Error stopping recording', error);
    }
  };

  const playRecording = async (uri: string) => {
    if (playingSound) {
      await playingSound.stopAsync(); // Stop any sound that's already playing
    }
    const { sound } = await Audio.Sound.createAsync({ uri });
    setPlayingSound(sound);
    await sound.playAsync();
  };

  const stopPlaying = async () => {
    if (playingSound) {
      await playingSound.stopAsync();
      setPlayingSound(null);
    }
  };

  const deleteRecording = (uri: string) => {
    setRecordings((prevRecordings) =>
      prevRecordings.filter((recording) => recording.uri !== uri)
    );
  };

  const editRecording = (uri: string) => {
    const updatedRecording = recordings.find((recording) => recording.uri === uri);
    if (updatedRecording) {
      setRecordingName(updatedRecording.name); // Set the current name to the input field
      setEditingRecording(updatedRecording); // Set the recording to be edited
    }
  };

  const saveEditedRecording = () => {
    if (editingRecording) {
      setRecordings((prevRecordings) =>
        prevRecordings.map((recording) =>
          recording.uri === editingRecording.uri
            ? { ...recording, name: recordingName }
            : recording
        )
      );
      setEditingRecording(null); // Clear the editing state
      setRecordingName(''); // Clear the input field
    }
  };

  // Filter recordings based on both name and timestamp
  const filteredRecordings = recordings.filter((recording) =>
    recording.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recording.timestamp.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.recordingItem}>
      <Text style={styles.name}>{item.name}</Text>
      
      {/* Recording */}
      <View style={styles.recordingContainer}>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => playRecording(item.uri)}
        >
          <Ionicons name="play-circle-outline" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => editRecording(item.uri)} // Edit button
        >
          <Ionicons name="pencil-outline" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => deleteRecording(item.uri)}
        >
          <Ionicons name="trash-outline" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Recorder</Text>
      
      {/* Search bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search recordings by name or timestamp"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      
      {/* Recording name input (only visible after recording is completed) */}
      {isRecordingCompleted && (
        <TextInput
          style={styles.recordingNameInput}
          placeholder="Enter recording name"
          value={recordingName}
          onChangeText={setRecordingName}
          onSubmitEditing={() => {
            // Automatically save the recording name when the user submits
            setRecordings((prevRecordings) => {
              const updatedRecordings = prevRecordings.map((recording) =>
                recording.uri === recording.uri
                  ? { ...recording, name: recordingName }
                  : recording
              );
              return updatedRecordings;
            });
            setIsRecordingCompleted(false); // Reset recording completed flag
          }}
        />
      )}
      
      {/* Start/Stop recording button */}
      <TouchableOpacity
        style={styles.button}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Text>
      </TouchableOpacity>
      
      {/* Save Edited Recording */}
      {editingRecording && (
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={saveEditedRecording}
        >
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      )}
      
      {/* List of recordings */}
      <FlatList
        data={filteredRecordings}
        renderItem={renderItem}
        keyExtractor={(item) => item.uri}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: width > 400 ? 20 : 15, // Adjust padding based on screen width
  },
  title: {
    fontSize: width > 400 ? 30 : 24, // Adjust font size for smaller screens
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 20,
  },
  searchBar: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
    paddingLeft: 15,
    fontSize: width > 400 ? 16 : 14, // Adjust font size for smaller screens
    backgroundColor: '#fff',
  },
  recordingNameInput: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
    paddingLeft: 15,
    fontSize: width > 400 ? 16 : 14, // Adjust font size for smaller screens
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: width > 400 ? 18 : 16, // Adjust font size for smaller screens
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  list: {
    width: '100%',
    marginTop: 20,
  },
  recordingItem: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5, // for Android shadow
    width: '100%',
  },
  timestamp: {
    fontSize: width > 400 ? 14 : 12, // Adjust font size for smaller screens
    color: '#777',
  },
  name: {
    fontSize: width > 400 ? 18 : 16, // Adjust font size for smaller screens
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  recordingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 50,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
});
