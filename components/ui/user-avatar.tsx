import React from 'react';
import { Image, StyleSheet, View, ViewStyle, ImageStyle } from 'react-native';

interface UserAvatarProps {
  url?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle | ImageStyle;
  borderWidth?: number;
  borderColor?: string;
}

export function UserAvatar({
  url,
  name = 'User',
  size = 40,
  style,
  borderWidth = 0,
  borderColor = 'transparent',
}: UserAvatarProps) {
  // Use DiceBear as fallback if URL is missing or is a legacy ID
  const isUrl = url && (url.startsWith('http') || url.startsWith('https'));
  const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  
  const finalUrl = isUrl ? url : fallbackUrl;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth,
          borderColor,
        },
        style as ViewStyle,
      ]}
    >
      <Image
        source={{ uri: finalUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
