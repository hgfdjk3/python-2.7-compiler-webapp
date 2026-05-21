import React, { useState } from 'react';
import { Box, Button, Group, Stack, Text, Textarea, ThemeIcon, ActionIcon } from '@mantine/core';
import { IconHelpCircle, IconSend, IconCheck } from '@tabler/icons-react';
import './ClarificationBlock.css';

export interface ClarificationQuestion {
  question: string;
  type: 'multiple_choice' | 'free_text';
  options?: string[];
}

export interface ClarificationData {
  context?: string;
  questions: ClarificationQuestion[];
}

export interface ClarificationBlockProps {
  content: string;
  onSubmitAnswer?: (answer: string) => void;
}

/**
 * Robust JSON repair helper to parse cut-off JSON during streaming.
 */
const repairAndParseJson = (jsonStr: string): ClarificationData => {
  const trimmed = jsonStr.trim();
  if (!trimmed) return { context: '', questions: [] };

  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === '{') openBraces++;
    else if (char === '}') openBraces--;
    else if (char === '[') openBrackets++;
    else if (char === ']') openBrackets--;
  }

  let repaired = trimmed;
  if (inString) {
    repaired += '"';
  }

  while (openBrackets > 0) {
    repaired += ']';
    openBrackets--;
  }
  while (openBraces > 0) {
    repaired += '}';
    openBraces--;
  }

  try {
    const parsed = JSON.parse(repaired);
    return {
      context: parsed.context || '',
      questions: Array.isArray(parsed.questions) ? parsed.questions : []
    };
  } catch (e) {
    return { context: 'Preparing clarification questions...', questions: [] };
  }
};

export const ClarificationBlock: React.FC<ClarificationBlockProps> = ({ content, onSubmitAnswer }) => {
  const data = repairAndParseJson(content);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelectOption = (index: number, option: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [index]: option }));
  };

  const handleTextChange = (index: number, text: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [index]: text }));
  };

  const isSubmitDisabled = () => {
    if (data.questions.length === 0) return true;
    // Require all questions to have some answer
    return data.questions.some((_, idx) => !answers[idx]?.trim());
  };

  const handleSubmit = () => {
    if (isSubmitDisabled() || submitted || !onSubmitAnswer) return;

    // Format the response message
    let responseMessage = "Here are my answers to your clarifying questions:\n";
    data.questions.forEach((q, idx) => {
      responseMessage += `- **${q.question}**: ${answers[idx]}\n`;
    });

    onSubmitAnswer(responseMessage);
    setSubmitted(true);
  };

  return (
    <Box className="clarification-block-root">
      <Group gap="sm" className="clarification-header">
        <ThemeIcon variant="filled" size="md" color="blue" radius="md">
          <IconHelpCircle size={18} />
        </ThemeIcon>
        <Stack gap={0}>
          <Text size="sm" fw={600} className="clarification-title">
            Clarification Needed
          </Text>
          {data.context && (
            <Text size="xs" c="dimmed" className="clarification-context">
              {data.context}
            </Text>
          )}
        </Stack>
      </Group>

      {data.questions.length > 0 ? (
        <Stack gap="md" className="clarification-questions-list">
          {data.questions.map((q, idx) => (
            <Box key={idx} className="clarification-question-item">
              <Text size="sm" fw={500} mb="xs" className="question-text">
                {idx + 1}. {q.question}
              </Text>

              {q.type === 'multiple_choice' && q.options && (
                <Group gap="xs" wrap="wrap">
                  {q.options.map((opt) => {
                    const isSelected = answers[idx] === opt;
                    return (
                      <Button
                        key={opt}
                        variant={isSelected ? 'filled' : 'outline'}
                        color={isSelected ? 'blue' : 'gray'}
                        size="xs"
                        radius="md"
                        disabled={submitted}
                        onClick={() => handleSelectOption(idx, opt)}
                        className={`option-button ${isSelected ? 'selected' : ''}`}
                      >
                        {opt}
                      </Button>
                    );
                  })}
                </Group>
              )}

              {q.type === 'free_text' && (
                <Textarea
                  placeholder="Type your response here..."
                  size="xs"
                  radius="md"
                  rows={2}
                  disabled={submitted}
                  value={answers[idx] || ''}
                  onChange={(e) => handleTextChange(idx, e.currentTarget.value)}
                  className="question-textarea"
                />
              )}
            </Box>
          ))}

          {onSubmitAnswer && (
            <Group justify="flex-end" mt="xs">
              <Button
                size="sm"
                radius="md"
                color={submitted ? 'green' : 'blue'}
                disabled={isSubmitDisabled() || submitted}
                onClick={handleSubmit}
                rightSection={submitted ? <IconCheck size={16} /> : <IconSend size={16} />}
                className="clarification-submit-btn"
              >
                {submitted ? 'Submitted' : 'Submit Answers'}
              </Button>
            </Group>
          )}
        </Stack>
      ) : (
        <Box p="md" style={{ textAlign: 'center' }}>
          <Text size="xs" c="dimmed">
            Analyzing request context to formulate clarifying questions...
          </Text>
        </Box>
      )}
    </Box>
  );
};
