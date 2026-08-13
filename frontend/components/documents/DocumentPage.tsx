"use client";

import axios from "axios";
import { motion } from "framer-motion";
import { AlertTriangle, History, Lock, Pencil, Save, Trash2 } from "lucide-react";
import { notFound, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { extractErrorMessage } from "../../lib/api/client";
import { useDeleteDocument, useDocument, useSaveDocument } from "../../lib/api/documents";
import { canEdit, canManage } from "../../lib/auth/permissions";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { FullPageSpinner } from "../ui/Spinner";
import { DocumentEditor, type DocumentEditorHandle } from "./editor/DocumentEditor";
import { DocumentView } from "./DocumentView";
import { ExportMenu } from "./export/ExportMenu";
import { TagPicker } from "./TagPicker";
import { VersionHistoryModal } from "./VersionHistoryModal";

export function DocumentPage({ documentId }: { documentId: string }) {
  const router = useRouter();
  const { data: document, isLoading, isError, error } = useDocument(documentId);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const editorRef = useRef<DocumentEditorHandle>(null);
  const saveDocument = useSaveDocument();
  const deleteDocument = useDeleteDocument();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isError) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;

    if (status === 404) {
      notFound();
    }

    if (status === 403) {
      return (
        <div className="flex h-full items-center justify-center px-6 py-20">
          <EmptyState
            icon={Lock}
            title="Erişim izniniz yok"
            description="Bu dokümana erişim izniniz bulunmuyor. Erişim talep etmek için bir yöneticiyle iletişime geçin."
          />
        </div>
      );
    }

    return (
      <div className="flex h-full items-center justify-center px-6 py-20">
        <EmptyState icon={AlertTriangle} title="Doküman yüklenemedi" description={extractErrorMessage(error)} />
      </div>
    );
  }

  if (!document) {
    return null;
  }

  const editable = canEdit(document.effectivePermission);
  const manageable = canManage(document.effectivePermission);

  function startEditing() {
    setTitle(document!.title);
    setIsEditing(true);
  }

  async function handleDelete() {
    try {
      await deleteDocument.mutateAsync(documentId);
      toast.success("Doküman silindi");
      router.push("/");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  async function handleSave() {
    if (!editorRef.current) {
      return;
    }

    const { contentJson, contentMarkdown } = editorRef.current.getContent();

    try {
      await saveDocument.mutateAsync({
        id: documentId,
        request: { title: title.trim() || document!.title, contentJson, contentMarkdown },
      });
      toast.success("Doküman kaydedildi");
      setIsEditing(false);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        {isEditing ? (
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full border-b-2 border-transparent bg-transparent text-2xl font-bold text-zinc-900 focus:border-primary-400 focus:outline-none"
          />
        ) : (
          <h1 className="text-2xl font-bold text-zinc-900">{document.title}</h1>
        )}

        <div className="flex shrink-0 gap-2">
          {!isEditing && (
            <>
              <ExportMenu documentId={documentId} />
              <Button variant="ghost" onClick={() => setIsHistoryOpen(true)}>
                <History size={16} /> Geçmiş
              </Button>
            </>
          )}
          {editable && (
            <>
              {isEditing ? (
                <>
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>
                    Vazgeç
                  </Button>
                  <Button onClick={handleSave} isLoading={saveDocument.isPending}>
                    <Save size={16} /> Kaydet
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={startEditing}>
                  <Pencil size={16} /> Düzenle
                </Button>
              )}
            </>
          )}
          {manageable && !isEditing && (
            <Button variant="ghost" onClick={() => setIsDeleteOpen(true)} aria-label="Dokümanı sil">
              <Trash2 size={16} className="text-red-500" />
            </Button>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <TagPicker documentId={documentId} tags={document.tags} editable={editable} />
        </div>
      )}

      <motion.div key={isEditing ? "edit" : "view"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
        {isEditing ? (
          <DocumentEditor ref={editorRef} documentId={documentId} initialContentJson={document.contentJson} />
        ) : (
          <DocumentView contentJson={document.contentJson} />
        )}
      </motion.div>

      <VersionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        documentId={documentId}
        currentVersionNumber={document.versionNumber}
        editable={editable}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Dokümanı sil"
        description={`"${document.title}" adlı dokümanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        isLoading={deleteDocument.isPending}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}
