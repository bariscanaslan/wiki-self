"use client";

import { Plus, Trash2, Users as UsersIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/api/client";
import { useDeleteGroup, useGroups } from "@/lib/api/groups";
import type { GroupResponse } from "@/lib/types";
import { CreateGroupModal } from "./CreateGroupModal";
import { EditGroupModal } from "./EditGroupModal";

export function GroupsTable() {
  const { data: groups, isLoading } = useGroups();
  const deleteGroup = useDeleteGroup();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<GroupResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GroupResponse | null>(null);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteGroup.mutateAsync(deleteTarget.id);
      toast.success("Grup silindi");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} /> Yeni Grup
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="text-primary-500 dark:text-primary-400" />
        </div>
      )}

      {!isLoading && groups?.length === 0 && <EmptyState icon={UsersIcon} title="Henüz grup yok" />}

      <div className="grid gap-3 sm:grid-cols-2">
        {groups?.map((group) => (
          <div key={group.id} className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/admin/groups/${group.id}`} className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-primary-600 dark:hover:text-primary-400">
                  {group.name}
                </Link>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{group.memberCount} üye</p>
                {group.description && <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{group.description}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditGroup(group)}>
                  Düzenle
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(group)} aria-label="Sil">
                  <Trash2 size={14} className="text-red-500 dark:text-red-400" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <EditGroupModal group={editGroup} onClose={() => setEditGroup(null)} />
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Grubu sil"
        description={`"${deleteTarget?.name ?? ""}" grubunu silmek istediğinize emin misiniz?`}
        confirmLabel="Sil"
        isLoading={deleteGroup.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
