import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export function AuthHeader() {
  return (
    <View style={styles.header}>
      <Image 
        source={require('../../assets/images/habify-logo.png')} 
        style={styles.icon} 
        resizeMode="contain" 
      />
      <Text style={styles.appName}>Habify</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  icon: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
});