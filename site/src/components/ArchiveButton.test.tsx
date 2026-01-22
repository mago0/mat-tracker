import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ArchiveButton } from "./ArchiveButton";

describe("ArchiveButton", () => {
  const mockAction = vi.fn();

  it("shows 'Archive' when student is active", () => {
    render(
      <ArchiveButton studentId="123" isArchived={false} action={mockAction} />
    );

    expect(screen.getByRole("button")).toHaveTextContent("Archive");
  });

  it("shows 'Unarchive' when student is archived", () => {
    render(
      <ArchiveButton studentId="123" isArchived={true} action={mockAction} />
    );

    expect(screen.getByRole("button")).toHaveTextContent("Unarchive");
  });

  it("has red styling when student is active", () => {
    render(
      <ArchiveButton studentId="123" isArchived={false} action={mockAction} />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-red-50");
    expect(button).toHaveClass("text-red-700");
  });

  it("has green styling when student is archived", () => {
    render(
      <ArchiveButton studentId="123" isArchived={true} action={mockAction} />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-green-50");
    expect(button).toHaveClass("text-green-700");
  });

  it("includes studentId as hidden input", () => {
    const { container } = render(
      <ArchiveButton studentId="test-id-456" isArchived={false} action={mockAction} />
    );

    const hiddenInput = container.querySelector('input[type="hidden"]');
    expect(hiddenInput).toHaveAttribute("name", "studentId");
    expect(hiddenInput).toHaveAttribute("value", "test-id-456");
  });

  it("shows confirmation state on first click", () => {
    render(
      <ArchiveButton studentId="123" isArchived={false} action={mockAction} />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(button).toHaveTextContent("Tap again to confirm");
    expect(button).toHaveClass("bg-yellow-100");
  });

  it("shows confirmation state for unarchive on first click", () => {
    render(
      <ArchiveButton studentId="123" isArchived={true} action={mockAction} />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(button).toHaveTextContent("Tap again to confirm");
    expect(button).toHaveClass("bg-yellow-100");
  });
});
