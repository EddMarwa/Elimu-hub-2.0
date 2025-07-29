/**
 * Utility functions for time-based greetings and other common operations
 */

export const getTimeBasedGreeting = (): string => {
  const currentHour = new Date().getHours();

  if (currentHour >= 5 && currentHour < 12) {
    return 'Good Morning';
  } else if (currentHour >= 12 && currentHour < 17) {
    return 'Good Afternoon';
  } else if (currentHour >= 17 && currentHour < 22) {
    return 'Good Evening';
  } else {
    return 'Good Night';
  }
};

export const getGreetingIcon = (): string => {
  const currentHour = new Date().getHours();

  if (currentHour >= 5 && currentHour < 12) {
    return '🌅'; // Sunrise
  } else if (currentHour >= 12 && currentHour < 17) {
    return '☀️'; // Sun
  } else if (currentHour >= 17 && currentHour < 22) {
    return '🌆'; // Evening
  } else {
    return '🌙'; // Night
  }
};

export const formatUserName = (firstName?: string, lastName?: string): string => {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  }
  return 'User';
};

export const getCurrentDate = (): string => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getCurrentTime = (): string => {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
