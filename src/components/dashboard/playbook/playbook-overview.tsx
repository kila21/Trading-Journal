"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useSetups } from "./use-setups";
import { PlaybookEmptyState } from "./playbook-empty-state";
import { SetupCard } from "./setup-card";
import { SetupFormModal } from "./setup-form-modal";
import type { SetupDTO } from "@/types/setup";

export function PlaybookOverview() {
  const t = useTranslations("dashboard");
  const { setups, refetch } = useSetups();

  const [modal, setModal] = useState<"form" | null>(null);
  const [editingSetup, setEditingSetup] = useState<SetupDTO | undefined>(undefined);

  function handleAdd() {
    setEditingSetup(undefined);
    setModal("form");
  }

  function handleEdit(setup: SetupDTO) {
    setEditingSetup(setup);
    setModal("form");
  }

  function handleClose() {
    setModal(null);
    setEditingSetup(undefined);
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("playbookTitle")}</h1>
        <Button type="button" onClick={handleAdd}>
          {t("addSetup")}
        </Button>
      </div>

      {setups.length === 0 ? (
        <PlaybookEmptyState onAddSetup={handleAdd} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {setups.map((setup) => (
            <SetupCard key={setup.id} setup={setup} onClick={() => handleEdit(setup)} />
          ))}
        </div>
      )}

      {modal === "form" && <SetupFormModal setup={editingSetup} onClose={handleClose} onSaved={refetch} />}
    </div>
  );
}
