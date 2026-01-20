import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MonthlyCalendar } from "./MonthlyCalendar";

describe("MonthlyCalendar", () => {
  it("renders the correct month and year label", () => {
    render(
      <MonthlyCalendar year={2025} month={0} attendanceDates={new Set()} />
    );

    expect(screen.getByText("January 2025")).toBeInTheDocument();
  });

  it("renders day headers", () => {
    render(
      <MonthlyCalendar year={2025} month={0} attendanceDates={new Set()} />
    );

    expect(screen.getByText("Su")).toBeInTheDocument();
    expect(screen.getByText("Mo")).toBeInTheDocument();
    expect(screen.getByText("Tu")).toBeInTheDocument();
    expect(screen.getByText("We")).toBeInTheDocument();
    expect(screen.getByText("Th")).toBeInTheDocument();
    expect(screen.getByText("Fr")).toBeInTheDocument();
    expect(screen.getByText("Sa")).toBeInTheDocument();
  });

  it("renders all days of the month", () => {
    render(
      <MonthlyCalendar year={2025} month={0} attendanceDates={new Set()} />
    );

    // January has 31 days
    for (let day = 1; day <= 31; day++) {
      expect(screen.getByText(String(day))).toBeInTheDocument();
    }
  });

  it("highlights attendance days with green background", () => {
    const attendanceDates = new Set(["2025-01-15", "2025-01-20"]);

    const { container } = render(
      <MonthlyCalendar year={2025} month={0} attendanceDates={attendanceDates} />
    );

    // Find cells with attendance (green background)
    const greenCells = container.querySelectorAll(".bg-green-500");
    expect(greenCells).toHaveLength(2);

    // Check that the correct days are highlighted
    expect(greenCells[0]).toHaveTextContent("15");
    expect(greenCells[1]).toHaveTextContent("20");
  });

  it("does not highlight days without attendance", () => {
    const attendanceDates = new Set(["2025-01-15"]);

    const { container } = render(
      <MonthlyCalendar year={2025} month={0} attendanceDates={attendanceDates} />
    );

    // Day 14 should not have green background
    const day14 = screen.getByText("14");
    expect(day14).not.toHaveClass("bg-green-500");
  });

  it("handles February correctly (28 days in non-leap year)", () => {
    render(
      <MonthlyCalendar year={2025} month={1} attendanceDates={new Set()} />
    );

    expect(screen.getByText("February 2025")).toBeInTheDocument();
    expect(screen.getByText("28")).toBeInTheDocument();
    expect(screen.queryByText("29")).not.toBeInTheDocument();
  });

  it("handles February in leap year (29 days)", () => {
    render(
      <MonthlyCalendar year={2024} month={1} attendanceDates={new Set()} />
    );

    expect(screen.getByText("February 2024")).toBeInTheDocument();
    expect(screen.getByText("29")).toBeInTheDocument();
  });

  it("formats date strings correctly for attendance lookup", () => {
    // Test that single-digit months and days are zero-padded
    const attendanceDates = new Set(["2025-01-05"]);

    const { container } = render(
      <MonthlyCalendar year={2025} month={0} attendanceDates={attendanceDates} />
    );

    const greenCells = container.querySelectorAll(".bg-green-500");
    expect(greenCells).toHaveLength(1);
    expect(greenCells[0]).toHaveTextContent("5");
  });

  it("handles month with attendance in different year", () => {
    // Attendance from 2024 should not show in 2025 calendar
    const attendanceDates = new Set(["2024-01-15"]);

    const { container } = render(
      <MonthlyCalendar year={2025} month={0} attendanceDates={attendanceDates} />
    );

    const greenCells = container.querySelectorAll(".bg-green-500");
    expect(greenCells).toHaveLength(0);
  });
});
