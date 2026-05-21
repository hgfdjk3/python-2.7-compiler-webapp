import React from 'react';
import { motion } from 'framer-motion';

export interface AnimatedItemProps {
  children: React.ReactNode;
  delay?: number;
}

export const AnimatedItem: React.FC<AnimatedItemProps> = ({ children, delay = 0 }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25, mass: 0.8, delay }}
      style={{ display: 'inline-flex' }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedItem;
