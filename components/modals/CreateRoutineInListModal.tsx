import { routineService } from "@/services/routine.service";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

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

  const [routineName, setRoutineName] = useState("");
  const [startTime, setStartTime] = useState(new Date(new Date().setHours(9, 0, 0)));
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(10, 0, 0)));
  const [startDate, setStartDate] = useState(new Date());
  const [frequency, setFrequency] = useState<FrequencyType>("DAILY");
  const [repeatAt, setRepeatAt] = useState<string>("Morning");

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [freqOpen, setFreqOpen] = useState(false);
  const [repeatOpen, setRepeatOpen] = useState(false);

  const onFreqOpen = useCallback(() => setRepeatOpen(false), []);
  const onRepeatOpen = useCallback(() => setFreqOpen(false), []);

  const frequencyItems = [
    { label: "Daily", value: "DAILY" as FrequencyType },
    { label: "Weekly", value: "WEEKLY" as FrequencyType },
  ];

  const repeatItems = [
    { label: "Morning", value: "Morning" },
    { label: "Afternoon", value: "Afternoon" },
    { label: "Evening", value: "Evening" },
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
      backgroundColor: "#2196F3",
      borderColor: "transparent",
      borderRadius: 8,
      minHeight: 50,
    }),
    []
  );

  const validate = () => {
    const errors: string[] = [];
    if (!routineListId) errors.push("Routine list id missing.");
    if (!routineName.trim()) errors.push("Please enter a routine name.");
    if (startTime >= endTime) errors.push("Routine end time must be after start time.");
    if (!frequency) errors.push("Please select a frequency.");
    if (frequency === "WEEKLY" && !repeatAt) errors.push("Please select repeat time.");
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
      const frequencyDetail =
        frequency === "DAILY"
          ? undefined
          : repeatAt === "Morning"
          ? 1
          : repeatAt === "Afternoon"
          ? 2
          : 3;

      const body: any = {
        routineListId: Number(routineListId),
        routineName: routineName.trim(),
        frequencyType: frequency,
        ...(frequencyDetail !== undefined && { frequencyDetail }),
        startTime: formatTimeForAPI(startTime),
        endTime: formatTimeForAPI(endTime),
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
      <LinearGradient colors={BACKGROUND_GRADIENT as any} style={routineFormStyles.screen}>
        <View style={routineFormStyles.outerWrapper}>
          <View style={routineFormStyles.sheet}>
            <ScrollView contentContainerStyle={[routineFormStyles.content, { paddingBottom: 60 }]}>

              <View style={routineFormStyles.headerRow}>
                <Text style={routineFormStyles.title}>Create Routine</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={30} color="#111827" />
                </TouchableOpacity>
              </View>

              {/* ✅ Category YOK */}

              <Text style={[routineFormStyles.sectionLabel, { marginTop: 20 }]}>Routine Name</Text>
              <View style={[routineFormStyles.inputContainer, { backgroundColor: "#2196F3" }]}>
                <TextInput
                  value={routineName}
                  onChangeText={setRoutineName}
                  placeholder="Enter your routine name"
                  placeholderTextColor="#ffffffcc"
                  style={[routineFormStyles.textInput, { color: "#fff" }]}
                />
              </View>

              {/* Times */}
              <View style={[routineFormStyles.rowSpace, { marginTop: 25 }]}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={routineFormStyles.smallLabel}>Routine Start Time</Text>
                  <TouchableOpacity
                    style={[routineFormStyles.timeBox, { backgroundColor: "#2196F3" }]}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Text style={[routineFormStyles.timeText, { color: "#fff" }]}>{formatTime(startTime)}</Text>
                  </TouchableOpacity>

                  {showStartTimePicker && (
                    <DateTimePicker
                      value={startTime}
                      mode="time"
                      is24Hour
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(e, d) => {
                        if (Platform.OS === "android") setShowStartTimePicker(false);
                        if (d) setStartTime(d);
                      }}
                    />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={routineFormStyles.smallLabel}>Routine End Time</Text>
                  <TouchableOpacity
                    style={[routineFormStyles.timeBox, { backgroundColor: "#2196F3" }]}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Text style={[routineFormStyles.timeText, { color: "#fff" }]}>{formatTime(endTime)}</Text>
                  </TouchableOpacity>

                  {showEndTimePicker && (
                    <DateTimePicker
                      value={endTime}
                      mode="time"
                      is24Hour
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(e, d) => {
                        if (Platform.OS === "android") setShowEndTimePicker(false);
                        if (d) setEndTime(d);
                      }}
                    />
                  )}
                </View>
              </View>

              {/* Date */}
              <Text style={[routineFormStyles.sectionLabel, { marginTop: 20 }]}>Start Date</Text>
              <TouchableOpacity
                style={[
                  routineFormStyles.dateInputContainer,
                  { backgroundColor: "#2196F3", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 15 },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>{formatDate(startDate)}</Text>
                <MaterialIcons name="calendar-today" size={22} color="#ffffff" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(e, d) => {
                    if (Platform.OS === "android") setShowDatePicker(false);
                    if (d) setStartDate(d);
                  }}
                />
              )}

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
                  textStyle={{ color: "#fff", fontSize: 16 }}
                  dropDownContainerStyle={{ backgroundColor: "#2196F3", borderColor: "#1E88E5" }}
                  placeholderStyle={{ color: "#ffffffcc" }}
                  listMode="SCROLLVIEW"
                />
              </View>

              {frequency === "WEEKLY" && (
                <>
                  <Text style={[routineFormStyles.sectionLabel, { marginTop: 20 }]}>Repeat at</Text>
                  <View style={{ zIndex: 1000 }}>
                    <DropDownPicker
                      open={repeatOpen}
                      value={repeatAt}
                      items={repeatItems}
                      setOpen={setRepeatOpen}
                      setValue={setRepeatAt}
                      onOpen={onRepeatOpen}
                      placeholder="Select Repeat Time"
                      style={dropDownStyle}
                      textStyle={{ color: "#fff", fontSize: 16 }}
                      dropDownContainerStyle={{ backgroundColor: "#2196F3", borderColor: "#1E88E5" }}
                      placeholderStyle={{ color: "#ffffffcc" }}
                      listMode="SCROLLVIEW"
                    />
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[routineFormStyles.createBtn, { marginTop: 40, backgroundColor: "#111827" }]}
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
