import React, { useState, useEffect } from 'react';
import { Modal, Box, Group, Button, Stack } from '@mantine/core';
import { motion, AnimatePresence } from 'motion/react';
import { IconArrowRight, IconArrowLeft, IconCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { OnboardingWelcomeStep } from '../OnboardingWelcomeStep/OnboardingWelcomeStep';
import { OnboardingConnectorsStep } from '../OnboardingConnectorsStep/OnboardingConnectorsStep';
import { OnboardingProjectStep } from '../OnboardingProjectStep/OnboardingProjectStep';
import { useUserStore } from '../../store/userStore';
import { useCreateProject } from '../../api/projects';
import './OnboardingModal.css';

export const OnboardingModal: React.FC = () => {
  const [opened, setOpened] = useState(() => {
    const onboarded = localStorage.getItem('atom_onboarded');
    return onboarded !== 'true';
  });
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0); // -1 for back, 1 for forward
  const [projectName, setProjectName] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const createProjectMutation = useCreateProject();

  // Initialize first project name from user fullname/username
  useEffect(() => {
    if (user) {
      const name = user.fullname || user.username || 'My';
      const firstWord = name.split(' ')[0];
      setProjectName(`${firstWord}'s First Project`);
    }
  }, [user]);

  const handleNextStep = () => {
    setDirection(1);
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  const handleSkip = () => {
    localStorage.setItem('atom_onboarded', 'true');
    setOpened(false);
  };

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      if (projectName.trim()) {
        const newProject = await createProjectMutation.mutateAsync(projectName.trim());
        if (newProject && newProject.id) {
          navigate(`/project/${newProject.id}`);
        }
      }
    } catch (error) {
      console.error('Failed to create onboarding project:', error);
    } finally {
      localStorage.setItem('atom_onboarded', 'true');
      setOpened(false);
      setIsCompleting(false);
    }
  };

  // Motion animation variants for step changes
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 50 : -50,
      opacity: 0
    })
  };

  return (
    <Modal
      opened={opened}
      onClose={handleSkip}
      closeOnClickOutside={true}
      closeOnEscape={true}
      withCloseButton={false}
      size="lg"
      centered
      radius="xl"
      padding="xl"
      className="onboarding-modal"
      transitionProps={{ transition: 'pop', duration: 300 }}
    >
      <Box className="onboarding-modal-container">
        {/* Content transition wrapping steps */}
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 ? (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="onboarding-step-content"
            >
              <OnboardingWelcomeStep />
            </motion.div>
          ) : step === 2 ? (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="onboarding-step-content"
            >
              <OnboardingConnectorsStep />
            </motion.div>
          ) : (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="onboarding-step-content"
            >
              <OnboardingProjectStep
                projectName={projectName}
                setProjectName={setProjectName}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Actions */}
        <Stack gap="md" className="onboarding-footer">
          <Group justify="space-between" align="center">
            {/* Step indicators */}
            <div className="onboarding-dots-container">
              <div className={`onboarding-dot ${step === 1 ? 'active' : ''}`} />
              <div className={`onboarding-dot ${step === 2 ? 'active' : ''}`} />
              <div className={`onboarding-dot ${step === 3 ? 'active' : ''}`} />
            </div>

            <Group gap="sm">
              {step === 1 ? (
                <>
                  <Button 
                    variant="subtle" 
                    color="zinc.5" 
                    onClick={handleSkip} 
                    size="sm"
                    disabled={isCompleting}
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    size="sm"
                    variant="filled"
                    color="zinc"
                    rightSection={<IconArrowRight size={14} />}
                  >
                    Continue
                  </Button>
                </>
              ) : step === 2 ? (
                <>
                  <Button
                    variant="subtle"
                    color="zinc.5"
                    leftSection={<IconArrowLeft size={14} />}
                    onClick={handlePrevStep}
                    size="sm"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    size="sm"
                    variant="filled"
                    color="zinc"
                    rightSection={<IconArrowRight size={14} />}
                  >
                    Continue
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="subtle"
                    color="zinc.5"
                    leftSection={<IconArrowLeft size={14} />}
                    onClick={handlePrevStep}
                    size="sm"
                    disabled={isCompleting}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleComplete}
                    size="sm"
                    variant="filled"
                    color="zinc"
                    loading={isCompleting}
                    rightSection={!isCompleting && <IconCheck size={14} />}
                  >
                    Finish
                  </Button>
                </>
              )}
            </Group>
          </Group>
        </Stack>
      </Box>
    </Modal>
  );
};
