export function getDaysSinceRegistration(dateString: string): string {
  const registrationDate = new Date(dateString);
  const currentDate = new Date();

  if (isNaN(registrationDate.getTime())) {
    return '0 дней';
  }

  const msInDay = 1000 * 60 * 60 * 24;
  const timeDiff = currentDate.getTime() - registrationDate.getTime();

  const rawDays = Math.floor(timeDiff / msInDay);
  const daysDiff = Math.max(0, rawDays);

  const lastDigit = daysDiff % 10;
  const lastTwoDigits = daysDiff % 100;

  let daysWord: string;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    daysWord = 'дней';
  } else if (lastDigit === 1) {
    daysWord = 'день';
  } else if (lastDigit >= 2 && lastDigit <= 4) {
    daysWord = 'дня';
  } else {
    daysWord = 'дней';
  }

  return `${daysDiff} ${daysWord}`;
}
