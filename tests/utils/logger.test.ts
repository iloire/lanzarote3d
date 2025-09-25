import { logger, LogLevel } from '../../src/foundation/utils/logger';

describe('Logger', () => {
  // Mock console methods
  let mockDebug: jest.SpyInstance;
  let mockInfo: jest.SpyInstance;
  let mockWarn: jest.SpyInstance;
  let mockError: jest.SpyInstance;

  beforeEach(() => {
    mockDebug = jest.spyOn(console, 'debug').mockImplementation();
    mockInfo = jest.spyOn(console, 'info').mockImplementation();
    mockWarn = jest.spyOn(console, 'warn').mockImplementation();
    mockError = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should log debug messages when level is DEBUG', () => {
    logger.setLevel(LogLevel.DEBUG);
    logger.debug('Test debug message', { data: 'test' });

    expect(mockDebug).toHaveBeenCalledWith('[DEBUG] Test debug message', { data: 'test' });
  });

  test('should log info messages when level is INFO or lower', () => {
    logger.setLevel(LogLevel.INFO);
    logger.info('Test info message');

    expect(mockInfo).toHaveBeenCalledWith('[INFO] Test info message');
  });

  test('should log warning messages when level is WARN or lower', () => {
    logger.setLevel(LogLevel.WARN);
    logger.warn('Test warning message');

    expect(mockWarn).toHaveBeenCalledWith('[WARN] Test warning message');
  });

  test('should log error messages when level is ERROR or lower', () => {
    logger.setLevel(LogLevel.ERROR);
    logger.error('Test error message');

    expect(mockError).toHaveBeenCalledWith('[ERROR] Test error message');
  });

  test('should not log debug messages when level is INFO', () => {
    logger.setLevel(LogLevel.INFO);
    logger.debug('Should not appear');

    expect(mockDebug).not.toHaveBeenCalled();
  });

  test('should not log anything when level is NONE', () => {
    logger.setLevel(LogLevel.NONE);
    logger.debug('Should not appear');
    logger.info('Should not appear');
    logger.warn('Should not appear');
    logger.error('Should not appear');

    expect(mockDebug).not.toHaveBeenCalled();
    expect(mockInfo).not.toHaveBeenCalled();
    expect(mockWarn).not.toHaveBeenCalled();
    expect(mockError).not.toHaveBeenCalled();
  });

  test('should handle multiple arguments', () => {
    logger.setLevel(LogLevel.DEBUG);
    logger.info('Message with', 'multiple', 'arguments', { key: 'value' });

    expect(mockInfo).toHaveBeenCalledWith(
      '[INFO] Message with',
      'multiple',
      'arguments',
      { key: 'value' }
    );
  });
});