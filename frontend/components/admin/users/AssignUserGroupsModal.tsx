"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/api/client";
import { useGroups } from "@/lib/api/groups";
import { useAssignUserGroups } from "@/lib/api/users";
import type { UserResponse } from "@/lib/types";

export function AssignUserGroupsModal({ user, onClose }: { user: UserResponse | null; onClose: () => void }) {
  const { data: groups, isLoading } = useGroups();
  const [prevUser, setPrevUser] = useState(user);
  const [selectedIds, setSelectedIds] = useState<string[]>(user?.groups.map((group) => group.id) ?? []);
  const assignGroups = useAssignUserGroups();

  if (user !== prevUser) {
    setPrevUser(user);
    if (user) {
      setSelectedIds(user.groups.map((group) => group.id));
    }
  }

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((groupId) => groupId !== id) : [...prev, id]));
  }

  async function handleSave() {
    if (!user) {
      return;
    }

    try {
      await assignGroups.mutateAsync({ id: user.id, request: { groupIds: selectedIds } });
      toast.success("Gruplar güncellendi");
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={Boolean(user)} onClose={onClose} title={`${user?.displayName ?? ""} — Gruplar`} size="sm">
      {isLoading && <Spinner className="mx-auto text-primary-500 dark:text-primary-400" />}
      <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
        {groups?.map((group) => (
          <label key={group.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <input
              type="checkbox"
              checked={selectedIds.includes(group.id)}
              onChange={() => toggle(group.id)}
              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-primary-600 dark:text-primary-400 focus:ring-primary-400"
            />
            {group.name}
          </label>
        ))}
        {groups && groups.length === 0 && <p className="px-2 py-4 text-center text-sm text-zinc-400 dark:text-zinc-500">Henüz grup yok</p>}
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Vazgeç
        </Button>
        <Button onClick={handleSave} isLoading={assignGroups.isPending}>
          Kaydet
        </Button>
      </div>
    </Modal>
  );
}
