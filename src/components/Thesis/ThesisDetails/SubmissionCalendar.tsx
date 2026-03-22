import React, { useMemo } from "react";

interface SubmissionCalendarProps {
  dateValue: string | null | undefined;
}

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

const buildCalendarDays = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const startWeekDay = firstDay.getDay();
  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();
  const previousMonthDays = new Date(
    date.getFullYear(),
    date.getMonth(),
    0,
  ).getDate();

  const days: Array<{ value: number; isCurrentMonth: boolean }> = [];

  for (let i = startWeekDay - 1; i >= 0; i -= 1) {
    days.push({ value: previousMonthDays - i, isCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({ value: day, isCurrentMonth: true });
  }

  const tailCount = Math.max(0, 42 - days.length);
  for (let day = 1; day <= tailCount; day += 1) {
    days.push({ value: day, isCurrentMonth: false });
  }

  return days.slice(0, 35);
};

const SubmissionCalendar: React.FC<SubmissionCalendarProps> = ({
  dateValue,
}) => {
  const date = useMemo(() => {
    const parsed = dateValue ? new Date(dateValue) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) {
      return new Date();
    }
    return parsed;
  }, [dateValue]);

  const calendarDays = useMemo(() => buildCalendarDays(date), [date]);

  return (
    <div className="mt-2 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="bg-orange-500 px-3 py-2 flex items-center justify-between text-white">
        <span className="text-xs font-bold uppercase tracking-widest">
          {date.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </span>
        <div className="flex gap-2 opacity-70">
          <i className="pi pi-chevron-left text-xs" />
          <i className="pi pi-chevron-right text-xs" />
        </div>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 mb-2">
          {weekdayLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
          {calendarDays.map((day, index) => {
            const isSelected =
              day.isCurrentMonth && day.value === date.getDate();
            return (
              <span
                key={`${day.value}-${index}`}
                className={`py-1 rounded-full ${
                  isSelected
                    ? "bg-orange-500 text-white font-bold"
                    : day.isCurrentMonth
                      ? "text-slate-700"
                      : "text-slate-300"
                }`}
              >
                {day.value}
              </span>
            );
          })}
        </div>
      </div>

      <div className="px-3 py-2 border-t border-slate-200 bg-white flex items-center gap-2">
        <i className="pi pi-calendar text-[12px] text-orange-500" />
        <span className="text-[10px] font-medium text-slate-500">
          Submitted on{" "}
          {date.toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
};

export default React.memo(SubmissionCalendar);
