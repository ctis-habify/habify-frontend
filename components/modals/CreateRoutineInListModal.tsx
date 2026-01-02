import { routineService } from "@/services/routine.service";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

import { Colors } from "@/constants/theme";
import { BACKGROUND_GRADIENT } from "../../app/theme";
import { FrequencyType } from "../../types/routine";
import { routineFormStyles } from "../routine-form-styles";

type Props = {
  visible: boolean;
  routineListId: number | null;
  onClose: () => void;
  onCreated?: () => void;
};

export default function CreateRoutineInListModal({ visible, routineListId, onClose, onCreated }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [endDate, setEndDate] = useState(new Date()); // Unused but let's keep it if it was there or just assume it wasn't. Wait, line 37 was setStartDate.
  // Actually, I'll just replace the block of state definitions.

  const [routineName, setRoutineName] = useState("");
  const [startTime, setStartTime] = useState(new Date(new Date().setHours(9, 0, 0)));
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(10, 0, 0)));
  const [startDate, setStartDate] = useState(new Date());
  const [frequency, setFrequency] = useState<FrequencyType>("DAILY");
  
  // New state for optional time
  const [hasSpecificTime, setHasSpecificTime] = useState(false);

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [freqOpen, setFreqOpen] = useState(false);
  
  // Removed repeatOpen state and handler
  const onFreqOpen = useCallback(() => {}, []);

  const frequencyItems = [
    { label: "Daily", value: "DAILY" as FrequencyType },
    { label: "Weekly", value: "WEEKLY" as FrequencyType },
  ];

  const formatTime = (d: Date) =>
    `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  const formatTimeForAPI = (d: Date) => `${formatTime(d)}:00`;
  const formatDate = (d: Date) =>
    `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  const formatDateForAPI = (d: Date) => d.toISOString().split("T")[0];

  const dropDownStyle = useMemo(
    () => ({
      backgroundColor: Colors.light.background,
      borderColor: Colors.light.border,
      borderRadius: 12,
      minHeight: 50,
    }),
    []
  );

  const validate = () => {
    // ... validation logic
    const errors: string[] = [];
    if (!routineListId) errors.push("Routine list id missing.");
    if (!routineName.trim()) errors.push("Please enter a routine name.");
    if (frequency === 'DAILY' && hasSpecificTime && startTime >= endTime) errors.push("Routine end time must be after start time.");
    if (!frequency) errors.push("Please select a frequency.");
    
    // Removed repeatAt check for WEEKLY

    if (errors.length) {
      Alert.alert("Warning", errors.join("\n"));
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
     if (!validate()) return;
    setIsSubmitting(true);
    try {
      let finalStartTime = "00:00:00";
      let finalEndTime = "23:59:00";

      if (frequency === "DAILY" && hasSpecificTime) {
        finalStartTime = formatTimeForAPI(startTime);
        finalEndTime = formatTimeForAPI(endTime);
      }
      
      // For WEEKLY or DAILY without specific time, we use defaults (already set)

      const body: any = {
        routineListId: Number(routineListId),
        routineName: routineName.trim(),
        frequencyType: frequency,
        // frequencyDetail removed/undefined
        startTime: finalStartTime,
        endTime: finalEndTime,
        isAiVerified: false,
        startDate: formatDateForAPI(startDate),
      };

      await routineService.createRoutine(body);

      Alert.alert("Success", "Routine created successfully!");
      setRoutineName("");
      onCreated?.();
      onClose();
    } catch (e: any) {
      console.log("CreateRoutineInList failed:", e?.response?.data || e);
      Alert.alert("Error", e?.response?.data?.message ?? "Failed to create routine");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <LinearGradient colors={BACKGROUND_GRADIENT} style={routineFormStyles.screen}>
        <View style={routineFormStyles.outerWrapper}>
          <View style={routineFormStyles.sheet}>
            <ScrollView contentContainerStyle={[routineFormStyles.content, { paddingBottom: 60 }]}>

              <View style={routineFormStyles.headerRow}>
                <Text style={routineFormStyles.title}>Create Routine</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={30} color={Colors.light.text} />
                </TouchableOpacity>
              </View>

              {/* ✅ Category YOK */}

              <Text style={[routineFormStyles.sectionLabel, { marginTop: 20 }]}>Routine Name</Text>
              <View style={[routineFormStyles.inputContainer]}>
                <TextInput
                  value={routineName}
                  onChangeText={setRoutineName}
                  placeholder="Enter your routine name"
                  placeholderTextColor={Colors.light.icon}
                  style={[routineFormStyles.textInput]}
                />
              </View>

              {/* Frequency */}
              <Text style={[routineFormStyles.sectionLabel, { marginTop: 20 }]}>Frequency</Text>
              <View style={{ zIndex: 2000 }}>
                <DropDownPicker
                  open={freqOpen}
                  value={frequency}
                  items={frequencyItems}
                  setOpen={setFreqOpen}
                  setValue={setFrequency}
                  onOpen={onFreqOpen}
                  placeholder="Select Frequency"
                  style={dropDownStyle}
                  textStyle={{ color: Colors.light.text, fontSize: 16 }}
                  dropDownContainerStyle={{ backgroundColor: Colors.light.background, borderColor: Colors.light.border }}
                  placeholderStyle={{ color: Colors.light.icon }}
                  listMode="SCROLLVIEW"
                />
              </View>

              {/* Time Selection Toggle (Only for DAILY) */}
              {frequency === 'DAILY' && (
                 <View style={[routineFormStyles.rowSpace, { marginTop: 20, alignItems: 'center' }]}>
                    <Text style={routineFormStyles.sectionLabel}>Set specific time</Text>
                    <Switch
                        value={hasSpecificTime}
                        onValueChange={setHasSpecificTime}
                        trackColor={{ false: "#767577", true: Colors.light.primary }}
                        thumbColor={hasSpecificTime ? "#fff" : "#f4f3f4"}
                    />
                 </View>
              )}


              {/* Times (Only show if DAILY + hasSpecificTime) */}
              {frequency === 'DAILY' && hasSpecificTime && (
                <View style={[routineFormStyles.rowSpace, { marginTop: 15 }]}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={routineFormStyles.smallLabel}>Routine Start Time</Text>
                    <TouchableOpacity
                      style={[routineFormStyles.timeBox]}
                      onPress={() => setShowStartTimePicker(true)}
                    >
                      <Text style={[routineFormStyles.timeText]}>{formatTime(startTime)}</Text>
                    </TouchableOpacity>

                    {/* Start Time Picker */}
                    {showStartTimePicker && (
                      Platform.OS === 'ios' ? (
                        <Modal visible={showStartTimePicker} transparent animationType="fade">
                          <View style={routineFormStyles.modalOverlay}>
                            <View style={routineFormStyles.iosPickerContainer}>
                              <View style={routineFormStyles.pickerHeader}>
                                <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                                  <Text style={routineFormStyles.doneButton}>Done</Text>
                                </TouchableOpacity>
                              </View>
                              <DateTimePicker
                                value={startTime}
                                mode="time"
                                is24Hour
                                display="spinner"
                                onChange={(e, d) => {
                                  if (d) setStartTime(d);
                                }}
                                textColor={Colors.light.text}
                              />
                            </View>
                          </View>
                        </Modal>
                      ) : (
                        <DateTimePicker
                          value={startTime}
                          mode="time"
                          is24Hour
                          display="default"
                          onChange={(e, d) => {
                            setShowStartTimePicker(false);
                            if (d) setStartTime(d);
                          }}
                        />
                      )
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={routineFormStyles.smallLabel}>Routine End Time</Text>
                    <TouchableOpacity
                      style={[routineFormStyles.timeBox]}
                      onPress={() => setShowEndTimePicker(true)}
                    >
                      <Text style={[routineFormStyles.timeText]}>{formatTime(endTime)}</Text>
                    </TouchableOpacity>

                    {/* End Time Picker */}
                    {showEndTimePicker && (
                      Platform.OS === 'ios' ? (
                        <Modal visible={showEndTimePicker} transparent animationType="fade">
                          <View style={routineFormStyles.modalOverlay}>
                            <View style={routineFormStyles.iosPickerContainer}>
                               <View style={routineFormStyles.pickerHeader}>
                                <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                                  <Text style={routineFormStyles.doneButton}>Done</Text>
                                </TouchableOpacity>
                              </View>
                              <DateTimePicker
                                value={endTime}
                                mode="time"
                                is24Hour
                                display="spinner"
                                onChange={(e, d) => {
                                  if (d) setEndTime(d);
                                }}
                                textColor={Colors.light.text}
                              />
                            </View>
                          </View>
                        </Modal>
                      ) : (
                        <DateTimePicker
                          value={endTime}
                          mode="time"
                          is24Hour
                          display="default"
                          onChange={(e, d) => {
                            setShowEndTimePicker(false);
                            if (d) setEndTime(d);
                          }}
                        />
                      )
                    )}
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[routineFormStyles.createBtn, { marginTop: 40 }]}
                onPress={handleCreate}
                disabled={isSubmitting || !routineListId}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                    Create New Routine
                  </Text>
                )}
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}
