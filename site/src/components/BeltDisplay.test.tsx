import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BeltDisplay } from "./BeltDisplay";

describe("BeltDisplay", () => {
  it("renders a white belt", () => {
    const { container } = render(<BeltDisplay belt="white" stripes={0} />);

    const belt = container.firstChild as HTMLElement;
    expect(belt).toHaveClass("bg-white");
  });

  it("renders a blue belt", () => {
    const { container } = render(<BeltDisplay belt="blue" stripes={0} />);

    const belt = container.firstChild as HTMLElement;
    expect(belt).toHaveClass("bg-blue-600");
  });

  it("renders a purple belt", () => {
    const { container } = render(<BeltDisplay belt="purple" stripes={0} />);

    const belt = container.firstChild as HTMLElement;
    expect(belt).toHaveClass("bg-purple-600");
  });

  it("renders a brown belt", () => {
    const { container } = render(<BeltDisplay belt="brown" stripes={0} />);

    const belt = container.firstChild as HTMLElement;
    expect(belt).toHaveClass("bg-amber-800");
  });

  it("renders a black belt", () => {
    const { container } = render(<BeltDisplay belt="black" stripes={0} />);

    const belt = container.firstChild as HTMLElement;
    expect(belt).toHaveClass("bg-black");
  });

  it("renders correct number of stripes", () => {
    const { container } = render(<BeltDisplay belt="white" stripes={3} />);

    // Find stripe elements (white divs inside the stripe section)
    const stripeSection = container.querySelector(".w-2\\/5");
    const stripes = stripeSection?.querySelectorAll(".bg-white");

    expect(stripes).toHaveLength(3);
  });

  it("renders zero stripes when stripes is 0", () => {
    const { container } = render(<BeltDisplay belt="blue" stripes={0} />);

    const stripeSection = container.querySelector(".w-2\\/5");
    const stripes = stripeSection?.querySelectorAll(".bg-white");

    expect(stripes).toHaveLength(0);
  });

  it("renders 4 stripes maximum", () => {
    const { container } = render(<BeltDisplay belt="purple" stripes={4} />);

    const stripeSection = container.querySelector(".w-2\\/5");
    const stripes = stripeSection?.querySelectorAll(".bg-white");

    expect(stripes).toHaveLength(4);
  });

  it("renders small size", () => {
    const { container } = render(<BeltDisplay belt="white" stripes={0} size="sm" />);

    const belt = container.firstChild as HTMLElement;
    expect(belt).toHaveClass("h-4");
    expect(belt).toHaveClass("w-24");
  });

  it("renders medium size by default", () => {
    const { container } = render(<BeltDisplay belt="white" stripes={0} />);

    const belt = container.firstChild as HTMLElement;
    expect(belt).toHaveClass("h-6");
    expect(belt).toHaveClass("w-32");
  });

  it("renders large size", () => {
    const { container } = render(<BeltDisplay belt="white" stripes={0} size="lg" />);

    const belt = container.firstChild as HTMLElement;
    expect(belt).toHaveClass("h-8");
    expect(belt).toHaveClass("w-48");
  });
});
