import React from 'react';
import { Pressable, Animated, Text, StyleSheet, Easing } from 'react-native';
import { THEME } from '../../constants/theme';

interface OptionRowProps {
  onPress: () => void;
  label: string;
  textColor: string;
  children: React.ReactNode;
}

export const OptionRow = ({ onPress, label, textColor, children }: OptionRowProps) => {
  const opacity = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(opacity, { toValue: 0.5, duration: 80, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      style={styles.optionRow}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.Text style={[styles.optionText, { color: textColor, opacity }]}>
        {label}
      </Animated.Text>
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 16,
    color: THEME.text,
  },
});
