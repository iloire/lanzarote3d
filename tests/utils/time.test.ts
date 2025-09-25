import { formatTime, isDayTime } from '../../src/utils/time';

describe('Time utilities', () => {
  describe('formatTime', () => {
    test('should format time correctly', () => {
      expect(formatTime(0)).toBe('00:00:00');
      expect(formatTime(3661)).toBe('01:01:01');
      expect(formatTime(43200)).toBe('12:00:00');
      expect(formatTime(86399)).toBe('23:59:59');
    });

    test('should handle large values', () => {
      expect(formatTime(90061)).toBe('01:01:01'); // 25:01:01 wrapped to 1:01:01
    });

    test('should handle negative values', () => {
      expect(formatTime(-1)).toBe('23:59:59');
    });
  });

  describe('isDayTime', () => {
    test('should identify day time correctly', () => {
      expect(isDayTime(21600)).toBe(true);  // 6 AM
      expect(isDayTime(43200)).toBe(true);  // 12 PM
      expect(isDayTime(64800)).toBe(true);  // 6 PM
    });

    test('should identify night time correctly', () => {
      expect(isDayTime(0)).toBe(false);     // Midnight
      expect(isDayTime(10800)).toBe(false); // 3 AM
      expect(isDayTime(72000)).toBe(false); // 8 PM
      expect(isDayTime(82800)).toBe(false); // 11 PM
    });

    test('should handle boundary cases', () => {
      expect(isDayTime(21600)).toBe(true);  // 6 AM (start of day)
      expect(isDayTime(68400)).toBe(false); // 7 PM (start of night)
    });
  });
});