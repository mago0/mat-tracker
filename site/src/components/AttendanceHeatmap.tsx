"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AttendanceHeatmapProps {
  data: { date: string; count: number }[];
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getColorClass(count: number): string {
  if (count === 0) return "bg-gray-100";
  if (count <= 2) return "bg-green-200";
  if (count <= 4) return "bg-green-400";
  return "bg-green-600";
}

export function AttendanceHeatmap({ data }: AttendanceHeatmapProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  // Build a map for quick lookup
  const countMap = new Map<string, number>();
  for (const { date, count } of data) {
    countMap.set(date, count);
  }

  // Generate the last 52 weeks of dates
  const today = new Date();
  const weeks: Date[][] = [];

  // Start from the Sunday of 52 weeks ago
  const start = new Date(today);
  start.setDate(start.getDate() - 364 - start.getDay());

  let currentWeek: Date[] = [];
  const current = new Date(start);

  while (current <= today) {
    currentWeek.push(new Date(current));
    if (current.getDay() === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    current.setDate(current.getDate() + 1);
  }

  // Push remaining days if any
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Get month labels with positions
  const monthLabels: { month: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const firstDayOfWeek = week[0];
    if (firstDayOfWeek && firstDayOfWeek.getMonth() !== lastMonth) {
      lastMonth = firstDayOfWeek.getMonth();
      monthLabels.push({ month: MONTHS[lastMonth], weekIndex });
    }
  });

  const formatDate = (date: Date): string => {
    // Use local timezone to match how dates are stored in the database
    return date.toLocaleDateString("en-CA");
  };

  const handleMouseEnter = (
    e: React.MouseEvent,
    date: Date,
    count: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      count,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  return (
    <div className="relative">
      {/* Month labels */}
      <div className="flex text-xs text-gray-500 mb-1 ml-8">
        {monthLabels.map(({ month, weekIndex }, idx) => (
          <div
            key={idx}
            className="absolute"
            style={{ left: `${weekIndex * 12 + 32}px` }}
          >
            {month}
          </div>
        ))}
      </div>

      <div className="flex mt-4">
        {/* Day labels */}
        <div className="flex flex-col text-[10px] text-gray-500 mr-1 gap-[2px]">
          <div className="h-[10px]"></div>
          <div className="h-[10px] flex items-center">Mon</div>
          <div className="h-[10px]"></div>
          <div className="h-[10px] flex items-center">Wed</div>
          <div className="h-[10px]"></div>
          <div className="h-[10px] flex items-center">Fri</div>
          <div className="h-[10px]"></div>
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-[2px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[2px]">
              {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                const date = week.find((d) => d.getDay() === dayOfWeek);
                if (!date) {
                  return (
                    <div key={dayOfWeek} className="w-[10px] h-[10px]" />
                  );
                }
                const dateStr = formatDate(date);
                const count = countMap.get(dateStr) || 0;
                return (
                  <div
                    key={dayOfWeek}
                    className={`w-[10px] h-[10px] rounded-sm ${getColorClass(count)} cursor-pointer hover:ring-2 hover:ring-blue-400`}
                    onMouseEnter={(e) => handleMouseEnter(e, date, count)}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => router.push(`/attendance?date=${dateStr}`)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-3 text-xs text-gray-500 ml-8">
        <span>Less</span>
        <div className="w-[10px] h-[10px] rounded-sm bg-gray-100" />
        <div className="w-[10px] h-[10px] rounded-sm bg-green-200" />
        <div className="w-[10px] h-[10px] rounded-sm bg-green-400" />
        <div className="w-[10px] h-[10px] rounded-sm bg-green-600" />
        <span>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 30,
            transform: "translateX(-50%)",
          }}
        >
          {tooltip.count} check-in{tooltip.count !== 1 ? "s" : ""} on{" "}
          {tooltip.date}
        </div>
      )}
    </div>
  );
}
