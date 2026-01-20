interface MonthlyCalendarProps {
  year: number;
  month: number; // 0-indexed (0 = January)
  attendanceDates: Set<string>; // ISO date strings like "2025-01-15"
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function MonthlyCalendar({
  year,
  month,
  attendanceDates,
}: MonthlyCalendarProps) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Build calendar grid
  const cells: (number | null)[] = [];

  // Empty cells before first day
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push(null);
  }

  // Day numbers
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }

  // Check if a day has attendance
  const hasAttendance = (day: number): boolean => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendanceDates.has(dateStr);
  };

  return (
    <div className="bg-white rounded-lg shadow p-3">
      <h3 className="text-sm font-medium text-gray-900 text-center mb-2">
        {MONTHS[month]} {year}
      </h3>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map((day) => (
          <div
            key={day}
            className="text-[10px] text-gray-400 text-center font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => (
          <div
            key={idx}
            className={`
              aspect-square flex items-center justify-center text-xs
              ${day === null ? "" : ""}
              ${day && hasAttendance(day) ? "bg-green-500 text-white rounded" : "text-gray-600"}
            `}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}
