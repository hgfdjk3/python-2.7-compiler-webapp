import { ScheduleConfig } from './ScheduleConfigurator';

export const getScheduleString = (config: ScheduleConfig): string => {
  if (!config || !config.frequency) {
    return 'Invalid schedule';
  }

  const { frequency, interval = 1, time } = config;
  const plural = interval > 1 ? 's' : '';
  const timeStr = time ? ` at ${time}` : '';

  if (frequency === 'weeks' && config.byDays && config.byDays.length > 0) {
    const daysStr = config.byDays.map(d => d && typeof d === 'string' ? d.charAt(0).toUpperCase() + d.slice(1) : '').filter(Boolean).join(', ');
    return `Every ${interval} week${plural} on ${daysStr}${timeStr}`;
  }

  const freqSingle = typeof frequency === 'string' && frequency.endsWith('s') ? frequency.slice(0, -1) : frequency;
  return `Every ${interval} ${freqSingle}${plural}${timeStr}`;
};
