export const isValidDateRange = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) {
    return false;
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start < end;
};

export const createMonthLabel = (dateValue) => {
  const date = new Date(dateValue);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const boolFromQuery = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

export const randomInteger = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const addMonths = (dateValue, offset) => {
  const date = new Date(dateValue);
  date.setMonth(date.getMonth() + offset);
  return date;
};

export const toDateOnly = (dateValue) => {
  return new Date(dateValue).toISOString().slice(0, 10);
};
