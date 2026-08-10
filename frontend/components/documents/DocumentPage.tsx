"use client";

import { motion } from "framer-motion";
import { History, Pencil, Save } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { extractErrorMessage } from "../../lib/api/client";
import { useDocument, useSaveDocument } from "../../lib/api/documents";
import { canEdit } from "../../lib/auth/permissions";
import { Button } from "../ui/Button";
import { FullPageSpinner } from "../ui/Spinner";
import { CategorySelect } from "./CategorySelect";
import { DocumentEditor, type DocumentEditorHandle } from "./editor/DocumentEditor";
import { DocumentView } from "./DocumentView";
import { ExportPdfButton } from "./export/ExportPdfButton";
import { TagPicker } from "./TagPicker";
import { VersionHistoryModal } from "./VersionHistoryModal";

export function DocumentPage({ documentId }: { documentId: string }) {
  const { data: document, isLoading } = useDocument(documentId);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const editorRef = useRef<DocumentEditorHandle>(null);
  const saveDocument = useSaveDocument();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!document) {
    return null;
  }

  const editable = canEdit(document.effectivePermission);

  function startEditing() {
    setTitle(document!.title);
    setIsEditing(true);
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
              <ExportPdfButton documentId={documentId} />
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
        </div>
      </div>

      {!isEditing && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <CategorySelect documentId={documentId} categoryId={document.categoryId} editable={editable} />
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
    </div>
  );
}
