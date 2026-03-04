import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export const useSpinAnimation = (active: boolean) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (active) {
      rotation.setValue(0);
      animRef.current = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 700,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animRef.current.start();
    } else {
      animRef.current?.stop();
      animRef.current = null;
    }
  }, [active, rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return { rotate };
};
