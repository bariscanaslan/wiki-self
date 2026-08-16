"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { extractErrorMessage } from "../../lib/api/client";
import { useDocumentVersion, useDocumentVersions, useRestoreVersion } from "../../lib/api/documents";
import { cn } from "../../lib/utils/cn";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Modal } from "../ui/Modal";
import { Spinner } from "../ui/Spinner";
import { DocumentView } from "./DocumentView";

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  currentVersionNumber: number;
  editable: boolean;
}

export function VersionHistoryModal({ isOpen, onClose, documentId, currentVersionNumber, editable }: VersionHistoryModalProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const { data: versions, isLoading } = useDocumentVersions(isOpen ? documentId : undefined);
  const { data: versionDetail, isLoading: isVersionLoading } = useDocumentVersion(documentId, selectedVersionId ?? undefined);
  const restoreVersion = useRestoreVersion();

  async function handleRestore() {
    if (!confirmRestoreId) {
      return;
    }

    try {
      await restoreVersion.mutateAsync({ id: documentId, versionId: confirmRestoreId });
      toast.success("Versiyon geri yüklendi");
      setConfirmRestoreId(null);
      setSelectedVersionId(null);
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Versiyon Geçmişi" size="lg">
      <div className="flex h-[28rem] gap-4">
        <div className="w-48 shrink-0 overflow-y-auto border-r border-zinc-100 dark:border-zinc-800 pr-3">
          {isLoading && <Spinner className="mx-auto mt-6 text-primary-500 dark:text-primary-400" />}
          {versions?.map((version) => (
            <button
              key={version.id}
              type="button"
              onClick={() => setSelectedVersionId(version.id)}
              className={cn(
                "mb-1 flex w-full flex-col items-start rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
                selectedVersionId === version.id ? "bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800",
              )}
            >
              <span className="font-semibold">
                v{version.versionNumber} {version.versionNumber === currentVersionNumber && "(güncel)"}
              </span>
              <span className="text-zinc-400 dark:text-zinc-500">{version.authorDisplayName}</span>
              <span className="text-zinc-400 dark:text-zinc-500">{format(new Date(version.createdAt), "d MMM yyyy HH:mm", { locale: tr })}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {!selectedVersionId && <p className="mt-10 text-center text-sm text-zinc-400 dark:text-zinc-500">İncelemek için bir versiyon seçin</p>}
          {selectedVersionId && isVersionLoading && <Spinner className="mx-auto mt-10 text-primary-500 dark:text-primary-400" />}
          {versionDetail && (
            <div>
              <DocumentView contentJson={versionDetail.contentJson} />
              {editable && versionDetail.versionNumber !== currentVersionNumber && (
                <Button className="mt-4" variant="outline" onClick={() => setConfirmRestoreId(versionDetail.id)}>
                  <RotateCcw size={14} /> Bu Versiyonu Geri Yükle
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirmRestoreId)}
        title="Versiyonu geri yükle"
        description="Bu versiyon güncel içerik olarak kaydedilecek ve yeni bir versiyon oluşturulacak. Devam edilsin mi?"
        confirmLabel="Geri Yükle"
        isDangerous={false}
        isLoading={restoreVersion.isPending}
        onConfirm={handleRestore}
        onCancel={() => setConfirmRestoreId(null)}
      />
    </Modal>
  );
}
