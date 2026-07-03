"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AccordionItemData {
  id: string;
  trigger: ReactNode;
  content: ReactNode;
}

export function Accordion({
  items,
  allowMultiple = false,
}: {
  items: AccordionItemData[];
  allowMultiple?: boolean;
}) {
  const [openIds, setOpenIds] = useState<string[]>([]);

  function toggle(id: string) {
    setOpenIds((prev) => {
      const isOpen = prev.includes(id);
      if (allowMultiple) {
        return isOpen ? prev.filter((openId) => openId !== id) : [...prev, id];
      }
      return isOpen ? [] : [id];
    });
  }

  return (
    <div className="divide-y divide-border">
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-4 text-left font-medium"
            >
              {item.trigger}
              <span
                aria-hidden
                className={cn(
                  "shrink-0 text-xl leading-none transition-transform",
                  isOpen && "rotate-45",
                )}
              >
                +
              </span>
            </button>
            {isOpen && (
              <div className="pb-4 text-sm text-muted">{item.content}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
