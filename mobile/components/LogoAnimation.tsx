import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Svg, { Path, G, Rect, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

const AnimatedG = (G ? Animated.createAnimatedComponent(G) : View) as any;

interface LogoAnimationProps {
  onComplete: () => void;
}

export default function LogoAnimation({ onComplete }: LogoAnimationProps) {
  // Animation progress values
  const bookOpen = useSharedValue(0);
  const featherProgress = useSharedValue(0);
  const invoiceProgress = useSharedValue(0);
  const sadbhawanaOpacity = useSharedValue(0);
  const billdeskProgress = useSharedValue(0);

  useEffect(() => {
    // 1. Book Opens First (0 - 1000ms)
    bookOpen.value = withTiming(1, {
      duration: 1000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    // 2. Golden Feather Animates Upward (800 - 1800ms)
    featherProgress.value = withDelay(
      700,
      withTiming(1, {
        duration: 1000,
        easing: Easing.out(Easing.back(1.5)),
      })
    );

    // 3. Invoice Document Slides from Side (1400 - 2400ms)
    invoiceProgress.value = withDelay(
      1300,
      withTiming(1, {
        duration: 900,
        easing: Easing.out(Easing.quad),
      })
    );

    // 4. "Sadbhawana" Text Appears (2000 - 2800ms)
    sadbhawanaOpacity.value = withDelay(
      1900,
      withTiming(1, {
        duration: 800,
        easing: Easing.ease,
      })
    );

    // 5. "BILLDESK" Appears with glowing premium effect (2600 - 3600ms)
    billdeskProgress.value = withDelay(
      2500,
      withTiming(1, {
        duration: 900,
        easing: Easing.out(Easing.back(1.2)),
      }, (finished) => {
        if (finished) {
          // Trigger complete callback
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  // Animated styles
  const leftPageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${90 - (bookOpen.value * 90)}deg` }
      ],
      opacity: bookOpen.value,
    };
  });

  const rightPageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${-90 + (bookOpen.value * 90)}deg` }
      ],
      opacity: bookOpen.value,
    };
  });

  const featherStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: 40 - (featherProgress.value * 50) },
        { scale: 0.5 + (featherProgress.value * 0.5) }
      ],
      opacity: featherProgress.value,
    };
  });

  const invoiceStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: 60 - (invoiceProgress.value * 60) },
        { translateY: 30 - (invoiceProgress.value * 30) },
        { rotate: `${15 - (invoiceProgress.value * 15)}deg` },
        { scale: 0.7 + (invoiceProgress.value * 0.3) }
      ],
      opacity: invoiceProgress.value,
    };
  });

  const sadbhawanaStyle = useAnimatedStyle(() => {
    return {
      opacity: sadbhawanaOpacity.value,
      transform: [
        { translateY: 10 - (sadbhawanaOpacity.value * 10) }
      ]
    };
  });

  const billdeskStyle = useAnimatedStyle(() => {
    return {
      opacity: billdeskProgress.value,
      transform: [
        { scale: 0.8 + (billdeskProgress.value * 0.2) }
      ],
      shadowOpacity: billdeskProgress.value * 0.6,
      shadowRadius: billdeskProgress.value * 12,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: '#0B0F19' }]}>
      <View style={styles.animationWrapper}>
        <Svg width="240" height="240" viewBox="0 0 200 200">
          {/* Hinge/Spine of the book */}
          <Path d="M 100,50 L 100,150" stroke="#3B82F6" strokeWidth="3" opacity="0.7" />
          
          {/* Left Page (Animated Group) */}
          <AnimatedG style={leftPageStyle}>
            {/* Curved Left Page Outline */}
            <Path 
              d="M 100,150 C 75,145 60,150 40,145 L 40,75 C 60,80 75,75 100,80 Z" 
              fill="#0F172A" 
              stroke="#3B82F6" 
              strokeWidth="2.5" 
            />
            {/* Lines inside left page representing book contents */}
            <Line x1="50" y1="95" x2="85" y2="98" stroke="#1E293B" strokeWidth="2.5" />
            <Line x1="50" y1="110" x2="80" y2="113" stroke="#1E293B" strokeWidth="2.5" />
            <Line x1="50" y1="125" x2="85" y2="128" stroke="#1E293B" strokeWidth="2.5" />
          </AnimatedG>
 
          {/* Right Page (Animated Group) */}
          <AnimatedG style={rightPageStyle}>
            {/* Curved Right Page Outline */}
            <Path 
              d="M 100,150 C 125,145 140,150 160,145 L 160,75 C 140,80 125,75 100,80 Z" 
              fill="#0F172A" 
              stroke="#3B82F6" 
              strokeWidth="2.5" 
            />
            {/* Lines inside right page representing book contents */}
            <Line x1="115" y1="98" x2="150" y2="95" stroke="#1E293B" strokeWidth="2.5" />
            <Line x1="120" y1="113" x2="150" y2="110" stroke="#1E293B" strokeWidth="2.5" />
            <Line x1="115" y1="128" x2="145" y2="125" stroke="#1E293B" strokeWidth="2.5" />
          </AnimatedG>
 
          {/* Golden Feather (Animated Group) */}
          <AnimatedG style={featherStyle}>
            {/* Golden Feather Path rising from spine */}
            <Path 
              d="M 100,90 C 95,75 92,60 96,40 C 99,48 102,60 102,70 C 105,62 108,55 110,48 C 109,58 107,68 104,78 C 106,82 107,86 108,92" 
              fill="#D4AF37" 
              stroke="#D4AF37" 
              strokeWidth="1.5" 
            />
            {/* Shaft/Quill */}
            <Path d="M 100,95 L 99,65" stroke="#CF9F1D" strokeWidth="1.5" />
          </AnimatedG>
 
          {/* Invoice Document (Animated Group sliding from side) */}
          <AnimatedG style={invoiceStyle}>
            {/* Invoice Background */}
            <Rect 
              x="125" 
              y="35" 
              width="36" 
              height="48" 
              rx="3" 
              fill="#1E293B" 
              stroke="#D4AF37" 
              strokeWidth="2" 
            />
            {/* Invoice header & rows */}
            <Rect x="131" y="41" width="10" height="3" rx="0.5" fill="#3B82F6" />
            <Line x1="131" y1="50" x2="153" y2="50" stroke="#475569" strokeWidth="1.5" />
            <Line x1="131" y1="58" x2="153" y2="58" stroke="#475569" strokeWidth="1.5" />
            <Line x1="131" y1="66" x2="145" y2="66" stroke="#D4AF37" strokeWidth="1.5" />
            <Rect x="148" y="64" width="5" height="4" fill="#D4AF37" />
          </AnimatedG>
        </Svg>
      </View>
 
      {/* Typography container */}
      <View style={styles.textContainer}>
        {/* Sadbhawana Text */}
        <Animated.View style={[styles.titleWrapper, sadbhawanaStyle]}>
          <Text style={styles.sadbhawanaText}>SADBHAWANA</Text>
        </Animated.View>
        
        {/* BILLDESK Glowing Text */}
        <Animated.View style={[styles.billdeskWrapper, billdeskStyle]}>
          <Text style={styles.billdeskText}>BILLDESK</Text>
        </Animated.View>
      </View>
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationWrapper: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // Android elevation for SVGs sometimes helps layout
    elevation: 2,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  titleWrapper: {
    overflow: 'hidden',
  },
  sadbhawanaText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#3B82F6', // Royal Blue (Vibrant)
    letterSpacing: 6,
    fontFamily: 'System',
    textAlign: 'center',
  },
  billdeskWrapper: {
    marginTop: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.7)', // Glass panel
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: '#D4AF37', // Premium Golden Glow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8, // Android glow fallback
  },
  billdeskText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#D4AF37', // Premium Gold
    letterSpacing: 4,
    fontFamily: 'System',
    textAlign: 'center',
  },
});

