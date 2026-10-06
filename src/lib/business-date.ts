type DateParts = { year: number; month: number; day: number };

function datePartsAt(date: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function startOfDayInZone({ year, month, day }: DateParts, timeZone: string) {
  const targetAsUtc = Date.UTC(year, month - 1, day);
  let guess = targetAsUtc;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  // Resolve the timezone offset at local midnight, including daylight saving changes.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = formatter.formatToParts(new Date(guess));
    const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    const representedAsUtc = Date.UTC(
      value("year"),
      value("month") - 1,
      value("day"),
      value("hour"),
      value("minute"),
      value("second"),
    );
    guess += targetAsUtc - representedAsUtc;
  }

  return new Date(guess);
}

export function getBusinessDayRange(reference = new Date()) {
  const timeZone = process.env.STORE_TIMEZONE || "Asia/Dhaka";
  const today = datePartsAt(reference, timeZone);
  const tomorrowDate = new Date(Date.UTC(today.year, today.month - 1, today.day + 1));
  const tomorrow = {
    year: tomorrowDate.getUTCFullYear(),
    month: tomorrowDate.getUTCMonth() + 1,
    day: tomorrowDate.getUTCDate(),
  };

  return {
    start: startOfDayInZone(today, timeZone),
    end: startOfDayInZone(tomorrow, timeZone),
    timeZone,
  };
}
