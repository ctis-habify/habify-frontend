"use client";

import { AntDesign, Ionicons } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("akcasueda@gmail.com");
  const [password, setPassword] = useState("************");
  const [remember, setRemember] = useState(true);

  const handleLogin = () => {
    // frontend-only for now 
    // later navigate to home screen
    router.push("/(personal)/home");
  };

  const handleGoogle = () => {
    // TODO: integrate Google auth
  };

  const handleApple = () => {
    // TODO: integrate Apple auth 
  };

  return (
    <LinearGradient
      colors={["#061a3c", "#020b20"]}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={["#163b7b", "#081b47"]}
          style={styles.card}
        >
          {/* Logo & title */}
          <View style={styles.logoWrapper}>
            <View style={styles.leafCircle}>
              <Ionicons name="leaf" size={20} color="#ffffff" />
            </View>
            <Text style={styles.logoText}>Habify</Text>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#6c8bd9"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#6c8bd9"
              secureTextEntry
              style={styles.input}
            />
          </View>

          {/* Remember me & Forgot */}
          <View style={styles.rowBetween}>
            <View style={styles.rememberRow}>
              <Checkbox
                value={remember}
                onValueChange={setRemember}
                color={remember ? "#0ea5e9" : undefined}
              />
              <Text style={styles.rememberText}>Remember me</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.forgotText}>Forgot?</Text>
            </TouchableOpacity>
          </View>

          {/* Login button */}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
            <Text style={styles.primaryBtnText}>Log In</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google button */}
          <TouchableOpacity style={styles.socialBtn} onPress={handleGoogle}>
            <AntDesign name="google" size={20} color="#ffffff" />
            <Text style={styles.socialText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Apple button */}
          <TouchableOpacity style={styles.socialBtn} onPress={handleApple}>
            <AntDesign name="apple" size={20} color="#ffffff" />            
            <Text style={styles.socialText}>Continue with Apple</Text>
          </TouchableOpacity>

          {/* Bottom text for registration */}
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Don&apos;t have an account ? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.bottomLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020817",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  card: {
    borderRadius: 32,
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  logoWrapper: {
    alignItems: "center",
    marginBottom: 32,
  },
  leafCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    color: "#e5edff",
    marginBottom: 6,
    fontSize: 14,
  },
  input: {
    backgroundColor: "#0f2c6b",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#ffffff",
    fontSize: 15,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rememberText: {
    color: "#e5edff",
    fontSize: 13,
  },
  forgotText: {
    color: "#60a5fa",
    fontSize: 13,
  },
  primaryBtn: {
    backgroundColor: "#007bff",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 22,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#475569",
  },
  dividerText: {
    color: "#9ca3af",
    fontSize: 12,
    marginHorizontal: 8,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0f2c6b",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  socialText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  bottomText: {
    color: "#9ca3af",
    fontSize: 13,
  },
  bottomLink: {
    color: "#3b82f6",
    fontSize: 13,
  },
});
