import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconArrowRight,
  IconPencil,
} from '@tabler/icons-react';
import { AnimatePresence, motion } from 'motion/react';
import './PromptClarification.css';

export interface ClarificationQuestionData {
  question: string;
  options: string[];
  allowCustom?: boolean;
  customPlaceholder?: string;
}

export interface PromptClarificationProps {
  /** Array of clarification questions to present */
  questions: ClarificationQuestionData[];
  /** Called with a formatted answer string when all questions are completed */
  onSubmit: (formattedAnswer: string) => void;
  /** Called when user closes the entire clarification panel */
  onClose: () => void;
}

export const PromptClarification: React.FC<PromptClarificationProps> = ({
  questions,
  onSubmit,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customValue, setCustomValue] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const customInputRef = useRef<HTMLInputElement>(null);
  const total = questions.length;

  // Reset selection when question changes
  useEffect(() => {
    setSelectedOption(null);
    setCustomValue('');
  }, [currentIndex]);

  // Reset everything when questions change
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setCustomValue('');
    setAnswers({});
  }, [questions]);

  const handleComplete = useCallback((finalAnswers: Record<number, string>) => {
    const answerEntries = Object.entries(finalAnswers);
    if (answerEntries.length > 0) {
      const parts = answerEntries.map(([idx, answer]) => {
        const q = questions[Number(idx)];
        return q ? `${q.question} ${answer}` : answer;
      });
      onSubmit(parts.join('\n'));
    } else {
      onClose();
    }
  }, [questions, onSubmit, onClose]);

  if (total === 0) return null;

  const current = questions[currentIndex];

  const goNext = (updatedAnswers?: Record<number, string>) => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Last question — complete
      handleComplete(updatedAnswers ?? answers);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
    const updated = { ...answers, [currentIndex]: option };
    setAnswers(updated);
    // Auto-advance after a short delay for visual feedback
    setTimeout(() => goNext(updated), 250);
  };

  const handleCustomSubmit = () => {
    const trimmed = customValue.trim();
    if (trimmed) {
      const updated = { ...answers, [currentIndex]: trimmed };
      setAnswers(updated);
      setTimeout(() => goNext(updated), 250);
    }
  };

  const handleSkip = () => {
    goNext();
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomSubmit();
    }
  };

  return (
    <div className="prompt-clarification-root">
      {/* Header */}
      <div className="prompt-clarification-header">
        <div className="prompt-clarification-header-left">
          <span className="prompt-clarification-question-title">
            {current.question}
          </span>
        </div>
        <div className="prompt-clarification-header-right">
          {total > 1 && (
            <>
              <button
                className="prompt-clarification-nav-btn"
                onClick={goPrev}
                disabled={currentIndex === 0}
                aria-label="Previous question"
              >
                <IconChevronLeft size={16} stroke={2} />
              </button>
              <span className="prompt-clarification-pagination">
                {currentIndex + 1} of {total}
              </span>
              <button
                className="prompt-clarification-nav-btn"
                onClick={() => goNext()}
                disabled={currentIndex === total - 1}
                aria-label="Next question"
              >
                <IconChevronRight size={16} stroke={2} />
              </button>
            </>
          )}
          <button
            className="prompt-clarification-close-btn"
            onClick={onClose}
            aria-label="Close clarification"
          >
            <IconX size={16} stroke={2} />
          </button>
        </div>
      </div>

      {/* Options */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <div className="prompt-clarification-options">
            {current.options.map((option, idx) => (
              <button
                key={option}
                className={`prompt-clarification-option ${selectedOption === option ? 'selected' : ''}`}
                onClick={() => handleSelectOption(option)}
              >
                <span className="prompt-clarification-option-number">
                  {idx + 1}
                </span>
                <span className="prompt-clarification-option-label">
                  {option}
                </span>
                <span className="prompt-clarification-option-arrow">
                  <IconArrowRight size={16} stroke={1.5} />
                </span>
              </button>
            ))}
          </div>

          {/* Custom input row */}
          {(current.allowCustom !== false) && (
            <div className="prompt-clarification-custom-row">
              <span className="prompt-clarification-custom-icon">
                <IconPencil size={16} stroke={1.5} />
              </span>
              <input
                ref={customInputRef}
                className="prompt-clarification-custom-input"
                placeholder={current.customPlaceholder || 'Something else'}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={handleCustomKeyDown}
              />
              <button
                className="prompt-clarification-skip-btn"
                onClick={handleSkip}
              >
                Skip
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
