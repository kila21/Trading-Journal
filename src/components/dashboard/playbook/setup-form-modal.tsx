"use client";

import { Dialog } from "@/components/ui/dialog";
import { SetupForm } from "./setup-form";
import type { SetupDTO } from "@/types/setup";

export function SetupFormModal({
  setup,
  onClose,
  onSaved,
}: {
  setup?: SetupDTO;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Dialog onClose={onClose} className="max-w-2xl">
      <SetupForm setup={setup} onClose={onClose} onSaved={onSaved} />
    </Dialog>
  );
}
