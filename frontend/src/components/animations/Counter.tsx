import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export interface CounterProps {
  value: number;
}

export const Counter: React.FC<CounterProps> = ({ value }) => {
  const spring = useSpring(0, { mass: 1, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
};

export default Counter;
