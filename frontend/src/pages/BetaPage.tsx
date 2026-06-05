import React, { useState } from 'react';
import { Box, Stack, Text, Button, Title, Container, Group, Select, TextInput } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { IconArrowRight } from '@tabler/icons-react';
import './BetaPage.css';

export const BetaPage: React.FC = () => {
  const [role, setRole] = useState<string | null>(null);
  const [useCase, setUseCase] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role && useCase) {
      const bodyText = `Hi there,\n\nRole: ${role}\nUse Case: ${useCase}`;
      window.location.href = `mailto:support@example.com?subject=Contact%20Support&body=${encodeURIComponent(bodyText)}`;
      setSubmitted(true);
    }
  };

  return (
    <Box className="beta-page-root">
      <Container size="xs" className="beta-container">
        <Stack align="center" gap={48} style={{ width: '100%' }}>
          <Stack gap="xl" align="center" style={{ width: '100%' }}>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <Text size="xs" fw={700} className="beta-kicker">
                Early Access
              </Text>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 250 250"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <motion.path
                  d="M169.409 167.053C169.409 167.053 175.911 189.526 171.07 203.931C160.236 236.167 99.7539 125.423 95.8704 126.682C88.0981 129.2 62.4202 203.822 72.9758 208.027C87.034 213.628 111.081 186.027 111.081 186.027M136.842 64.6012C136.842 64.6012 153.053 47.7332 167.949 44.7234C201.282 37.9878 135.617 145.739 138.648 148.473C144.716 153.945 222.179 138.872 220.543 127.628C218.364 112.652 182.438 105.628 182.438 105.628M64.887 144.76C64.887 144.76 42.1735 139.155 32.1191 127.76C9.6191 102.26 135.767 105.252 136.619 101.26C138.324 93.2696 86.539 33.7212 77.6191 40.7599C65.7395 50.1341 77.6191 84.7599 77.6191 84.7599"
                  stroke="#FFFFFF"
                  strokeWidth="12"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </svg>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <Title order={1} className="beta-title">
                <span className="beta-title-bold">Atom</span> <span className="beta-title-light">is in Beta.</span>
              </Title>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Text ta="center" size="md" className="beta-description">
                We're currently refining the next-generation intelligent IDE.
                Access is limited to our waitlist members.
              </Text>
            </motion.div>
          </Stack>

          <Box style={{ width: '100%' }}>
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, filter: 'blur(8px)', scale: 0.98 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="beta-success-container"
                >
                  <Text size="lg" className="beta-success-title">
                    Request Received.
                  </Text>
                  <Text size="sm" mt={8} className="beta-success-subtitle">
                    Your email client should open shortly to send your request.
                  </Text>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                  transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  onSubmit={handleSubmit}
                  style={{ width: '100%' }}
                >
                  <Stack gap="xl">
                    <Stack gap="lg">
                      <Select
                        placeholder="Your Role"
                        data={[
                          'Developer',
                          'Product Manager',
                          'Attacker',
                          'Intelligence Analyst',
                          'Other'
                        ]}
                        value={role}
                        onChange={setRole}
                        required
                        size="md"
                        variant="unstyled"
                        classNames={{
                          input: 'beta-input',
                          dropdown: 'beta-select-dropdown',
                          option: 'beta-select-option'
                        }}
                      />

                      <TextInput
                        placeholder="What are your main use cases?"
                        value={useCase}
                        onChange={(e) => setUseCase(e.currentTarget.value)}
                        required
                        size="md"
                        variant="unstyled"
                        classNames={{
                          input: 'beta-input'
                        }}
                      />
                    </Stack>

                    <Button
                      type="submit"
                      size="md"
                      fullWidth
                      variant="white"
                      rightSection={<IconArrowRight size={18} stroke={1.5} />}
                      className="beta-submit-btn"
                    >
                      Join Waitlist
                    </Button>
                  </Stack>
                </motion.form>
              )}
            </AnimatePresence>
          </Box>
        </Stack>
      </Container>

    </Box>
  );
};
