"use client";

import { FileText } from "lucide-react";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { verifyPassword } from "../../../lib/api/auth";
import { extractErrorMessage } from "../../../lib/api/client";
import { useFolderTree } from "../../../lib/api/folders";
import { countDocuments, downloadBlob, exportAllAsZip, type ExportAllFormat } from "../../../lib/export/exportAll";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";
import { PasswordInput } from "../../ui/PasswordInput";

interface ExportAllModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Phase = "password" | "exporting";

const FORMAT_LABELS: Record<ExportAllFormat, string> = { pdf: "PDF", markdown: "Markdown" };

export function ExportAllModal({ isOpen, onClose }: ExportAllModalProps) {
  const { data: tree } = useFolderTree();
  const [phase, setPhase] = useState<Phase>("password");
  const [format, setFormat] = useState<ExportAllFormat>("pdf");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  function reset() {
    setPhase("password");
    setFormat("pdf");
    setPassword("");
    setError(null);
    setIsVerifying(false);
    setProgress({ done: 0, total: 0 });
  }

  function handleClose() {
    if (phase === "exporting") {
      return;
    }
    reset();
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!password) {
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      await verifyPassword({ password });
    } catch {
      setError("Şifre yanlış. Lütfen tekrar deneyin.");
      setIsVerifying(false);
      return;
    }

    const nodes = tree ?? [];
    const total = countDocuments(nodes);
    if (total === 0) {
      toast.error("Dışa aktarılacak doküman bulunamadı");
      setIsVerifying(false);
      return;
    }

    setPhase("exporting");
    setProgress({ done: 0, total });

    try {
      const blob = await exportAllAsZip(nodes, format, (done, docTotal) => setProgress({ done, total: docTotal }));
      downloadBlob(blob, `wiki-export-${format}.zip`);
      toast.success("Dışa aktarma tamamlandı");
      reset();
      onClose();
    } catch (exportError) {
      toast.error(extractErrorMessage(exportError));
      reset();
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tümünü Dışa Aktar" size="sm">
      {phase === "password" && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            {(Object.keys(FORMAT_LABELS) as ExportAllFormat[]).map((option) => (
              <Button
                key={option}
                type="button"
                variant={format === option ? "primary" : "outline"}
                className="flex-1"
                disabled={isVerifying}
                onClick={() => setFormat(option)}
              >
                <FileText size={16} /> {FORMAT_LABELS[option]}
              </Button>
            ))}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Tüm klasörler ve içerdikleri dokümanlar {FORMAT_LABELS[format]} olarak, klasör yapısı korunarak bir .zip dosyasında
            indirilecek. Devam etmek için şifrenizi girin.
          </p>
          <PasswordInput
            label="Şifre"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={error ?? undefined}
            placeholder="Şifreniz"
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isVerifying}>
              Vazgeç
            </Button>
            <Button type="submit" isLoading={isVerifying}>
              Doğrula ve Dışa Aktar
            </Button>
          </div>
        </form>
      )}

      {phase === "exporting" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Dokümanlar {FORMAT_LABELS[format]} olarak hazırlanıyor, lütfen bekleyin...</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-primary-600 transition-all"
              style={{ width: progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : "0%" }}
            />
          </div>
          <p className="text-right text-xs text-zinc-500 dark:text-zinc-400">
            {progress.done} / {progress.total} doküman
          </p>
        </div>
      )}
    </Modal>
  );
}
