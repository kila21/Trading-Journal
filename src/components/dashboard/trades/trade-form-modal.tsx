"use client";

import { Dialog } from "@/components/ui/dialog";
import { TradeForm } from "./trade-form";
import type { TradeDTO } from "@/types/trade";

export function TradeFormModal({
  date,
  trade,
  onClose,
  onSaved,
}: {
  date: Date;
  trade?: TradeDTO;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Dialog onClose={onClose} className="max-w-2xl">
      <TradeForm date={date} trade={trade} onClose={onClose} onSaved={onSaved} />
    </Dialog>
  );
}
