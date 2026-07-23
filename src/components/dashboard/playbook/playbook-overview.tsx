"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { useSetups } from "./use-setups";
import { PlaybookEmptyState } from "./playbook-empty-state";
import { SetupCard } from "./setup-card";
import { SetupFormModal } from "./setup-form-modal";
import type { SetupDTO } from "@/types/setup";

export function PlaybookOverview() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const { setups, refetch } = useSetups();

  const [modal, setModal] = useState<"form" | null>(null);

  function handleAdd() {
    setModal("form");
  }

  function handleOpen(setup: SetupDTO) {
    router.push(`/dashboard/playbook/${setup.id}`);
  }

  function handleClose() {
    setModal(null);
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
            <SetupCard key={setup.id} setup={setup} onClick={() => handleOpen(setup)} />
          ))}
        </div>
      )}

      {modal === "form" && <SetupFormModal onClose={handleClose} onSaved={refetch} />}
    </div>
  );
}
