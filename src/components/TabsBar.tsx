import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../constants/theme';

type ThemeType = typeof THEME;

interface Tab {
  id: string;
  name: string;
}

interface TabsBarProps {
  tabs: Tab[];
  activeTab: string;
  onSelect: (id: string) => void;
  theme: ThemeType;
}

export const TabsBar = ({ tabs, activeTab, onSelect, theme }: TabsBarProps) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const layoutsRef = useRef<Record<string, { x: number; width: number }>>({});
  const containerWidthRef = useRef<number>(0);

  useEffect(() => {
    const layout = layoutsRef.current[activeTab];
    if (!layout || !scrollViewRef.current || containerWidthRef.current === 0) return;
    const targetX = layout.x + layout.width / 2 - containerWidthRef.current / 2;
    scrollViewRef.current.scrollTo({ x: Math.max(0, targetX), animated: true });
  }, [activeTab]);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        onLayout={(e) => { containerWidthRef.current = e.nativeEvent.layout.width; }}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onLayout={(e) => {
              layoutsRef.current[tab.id] = {
                x: e.nativeEvent.layout.x,
                width: e.nativeEvent.layout.width,
              };
            }}
            style={[
              styles.tab,
              activeTab === tab.id
                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                : { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => onSelect(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id
                  ? { color: theme.primaryForeground }
                  : { color: theme.text },
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <LinearGradient
        colors={[theme.background, 'transparent']}
        locations={[0.3, 0.43]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fadeLeft, { pointerEvents: 'none' }]}
      />
      <LinearGradient
        colors={['transparent', theme.background]}
        locations={[0.56, 0.69]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fadeRight, { pointerEvents: 'none' }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    height: 44,
    marginBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  fadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 50,
    zIndex: 1,
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 50,
    zIndex: 1,
  },
});
