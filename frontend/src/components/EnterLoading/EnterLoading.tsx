import React, { useEffect } from 'react';
import { Box, Stack, Text } from '@mantine/core';
import { motion } from 'framer-motion';
import './EnterLoading.css';

export interface EnterLoadingProps {
  onComplete: () => void;
}

export const EnterLoading: React.FC<EnterLoadingProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000); // 2 seconds total loading animation duration
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="enter-loading-overlay"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.4, ease: [0.43, 0.13, 0.23, 0.96] }}
    >
      <Stack gap="md" align="center">
        {/* Animated brand logo */}
        <motion.div
          className="enter-loading-glow"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 250 250"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path
              d="M169.409 167.053C169.409 167.053 175.911 189.526 171.07 203.931C160.236 236.167 99.7539 125.423 95.8704 126.682C88.0981 129.2 62.4202 203.822 72.9758 208.027C87.034 213.628 111.081 186.027 111.081 186.027M136.842 64.6012C136.842 64.6012 153.053 47.7332 167.949 44.7234C201.282 37.9878 135.617 145.739 138.648 148.473C144.716 153.945 222.179 138.872 220.543 127.628C218.364 112.652 182.438 105.628 182.438 105.628M64.887 144.76C64.887 144.76 42.1735 139.155 32.1191 127.76C9.6191 102.26 135.767 105.252 136.619 101.26C138.324 93.2696 86.539 33.7212 77.6191 40.7599C65.7395 50.1341 77.6191 84.7599 77.6191 84.7599"
              stroke="var(--mantine-color-text)"
              strokeWidth="14"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                pathLength: { duration: 1.4, ease: "easeInOut" }
              }}
            />
          </svg>
        </motion.div>

        {/* Brand Name with smooth blur and fade-in */}
        <motion.div
          initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
        >
          <Text
            fw={900}
            size="xl"
            style={{
              letterSpacing: '-1px',
              fontFamily: 'Geist',
              fontSize: '22px',
              color: 'var(--mantine-color-text)',
            }}
          >
            Atom.
          </Text>
        </motion.div>
      </Stack>
    </motion.div>
  );
};
