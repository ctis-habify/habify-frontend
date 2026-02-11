import { Colors } from '@/constants/theme';
import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

interface LogoProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export function Logo({ width = 180, height = 90, style }: LogoProps): React.ReactElement {
  // "Rhythm & Run" - A horizontal logo combining Soundwaves (Music) and Heartbeat (Sport)
  return (
    <View style={[{ width, height, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={width} height={height} viewBox="0 0 200 100" fill="none">
        <Defs>
          <LinearGradient id="logo_grad_wide" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={Colors.light.primary} />
            <Stop offset="1" stopColor={Colors.light.secondary} />
          </LinearGradient>
        </Defs>

        {/* Background Unifier: Organic "Cloud/Life" Shape */}
        <Path
          d="M20 50 Q 20 20 50 15 Q 90 10 130 20 Q 180 15 190 50 Q 195 90 150 90 Q 110 95 70 85 Q 20 90 20 50 Z"
          fill="url(#logo_grad_wide)"
          opacity={0.1}
        />

        {/* --- Hobbies Cluster --- */}

        {/* 1. Music (Left Main) */}
        <Path d="M25 65 V 35 L 55 25 V 55" stroke="url(#logo_grad_wide)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="20" cy="65" r="7" fill="url(#logo_grad_wide)" />
        <Circle cx="50" cy="55" r="7" fill="url(#logo_grad_wide)" />

        {/* 2. Knowledge (Top Center): Open Book */}
        <Path d="M75 25 Q 85 30 95 25 Q 105 30 115 25 V 40 Q 105 45 95 40 Q 85 45 75 40 Z" stroke="url(#logo_grad_wide)" strokeWidth="2" fill="rgba(255,255,255,0.5)" />
        <Path d="M95 25 V 40" stroke="url(#logo_grad_wide)" strokeWidth="1" />

        {/* 3. Creativity (Bottom Left): Art Palette */}
        <Path d="M55 82 Q 45 92 35 82 Q 30 72 40 67 Q 50 62 60 72 Z" fill="url(#logo_grad_wide)" opacity={0.8} />
        <Circle cx="40" cy="77" r="2" fill="white" />

        {/* 4. Gaming (Top Right): Controller */}
        <Rect x="120" y="20" width="30" height="18" rx="5" stroke="url(#logo_grad_wide)" strokeWidth="2" fill="none" />
        <Circle cx="128" cy="29" r="3" fill="url(#logo_grad_wide)" />
        <Circle cx="142" cy="27" r="1.5" fill="url(#logo_grad_wide)" />
        <Circle cx="145" cy="31" r="1.5" fill="url(#logo_grad_wide)" />

        {/* 5. Photography (Center/Right): Camera */}
        <Rect x="85" y="55" width="24" height="16" rx="3" stroke="url(#logo_grad_wide)" strokeWidth="2" fill="none" />
        <Circle cx="97" cy="63" r="5" stroke="url(#logo_grad_wide)" strokeWidth="2" />
        <Rect x="90" y="52" width="6" height="3" fill="url(#logo_grad_wide)" />

        {/* 6. Fitness (Bottom Center): Dumbbell */}
        <Path d="M95 85 H 125" stroke="url(#logo_grad_wide)" strokeWidth="4" strokeLinecap="round" />
        <Rect x="90" y="80" width="5" height="10" rx="2" fill="url(#logo_grad_wide)" />
        <Rect x="125" y="80" width="5" height="10" rx="2" fill="url(#logo_grad_wide)" />

        {/* 7. Sport (Right Main): Racket & Ball */}
        <Ellipse
          cx="165" cy="55" rx="16" ry="20"
          stroke="url(#logo_grad_wide)"
          strokeWidth="3"
          transform="rotate(-20, 165, 55)"
        />
        <Path d="M158 50 L 172 60 M160 45 L 170 65" stroke="url(#logo_grad_wide)" strokeWidth="1" opacity={0.5} />
        <Path d="M158 70 L 148 85" stroke="url(#logo_grad_wide)" strokeWidth="3" strokeLinecap="round" />
        <Circle cx="185" cy="40" r="5" fill="#FACC15" />

        {/* Decor: Stars to fill gaps */}
        <Path d="M65 15 L 67 20 L 72 22 L 67 24 L 65 29 L 63 24 L 58 22 L 63 20 Z" fill="#FACC15" opacity={0.8} />
        <Circle cx="110" cy="15" r="2" fill={Colors.light.primary} />
        <Circle cx="150" cy="85" r="2" fill={Colors.light.secondary} />
        <Circle cx="180" cy="20" r="3" fill={Colors.light.secondary} opacity={0.6} />
      </Svg>
    </View>
  );
}
