import React, { useEffect } from 'react';
import { useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { formatRupiah } from '../utils/kprCalculator';

interface AnimatedCurrencyProps {
  value: number;
  className?: string;
  compact?: boolean;
}

export const AnimatedCurrency: React.FC<AnimatedCurrencyProps> = ({
  value,
  className = '',
  compact = false,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const motionVal = useMotionValue(value);
  const springVal = useSpring(motionVal, {
    stiffness: 220,
    damping: 28,
    mass: 0.6,
  });
  const [display, setDisplay] = React.useState<string>(() =>
    formatRupiah(value, compact)
  );

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplay(formatRupiah(value, compact));
      return;
    }
    motionVal.set(value);
  }, [value, compact, motionVal, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const unsubscribe = springVal.on('change', (latest) => {
      setDisplay(formatRupiah(latest, compact));
    });
    return () => unsubscribe();
  }, [springVal, compact, shouldReduceMotion]);

  return <span className={className}>{display}</span>;
};
