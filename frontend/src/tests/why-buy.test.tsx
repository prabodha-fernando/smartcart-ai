import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WhyBuyThis from "@/components/ai/WhyBuyThis";
import { getWhyBuy } from "@/services/api";
import type { Product } from "@/types/product";

vi.mock("@/services/api", () => ({ getWhyBuy: vi.fn() }));

describe("WhyBuyThis", () => {
  beforeEach(() => vi.mocked(getWhyBuy).mockReset());

  it("renders the backend-generated explanation", async () => {
    vi.mocked(getWhyBuy).mockResolvedValue("A grounded backend recommendation.");
    render(<WhyBuyThis product={{ id: 1, title: "Test", price: 10, rating: 4.5 } as Product} />);

    await waitFor(() => {
      expect(screen.getByText("A grounded backend recommendation.")).toBeTruthy();
    });
    expect(getWhyBuy).toHaveBeenCalledWith(expect.objectContaining({ title: "Test", price: 10 }));
  });
});
