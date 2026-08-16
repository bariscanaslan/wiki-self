"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/api/client";
import { useGroup, useUpdateGroupMembers } from "@/lib/api/groups";
import { useUsers } from "@/lib/api/users";

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: group, isLoading } = useGroup(params.id);
  const { data: allUsers } = useUsers();
  const updateMembers = useUpdateGroupMembers();
  const [pendingUserId, setPendingUserId] = useState("");

  if (isLoading || !group) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="text-primary-500 dark:text-primary-400" />
      </div>
    );
  }

  const memberIds = group.members.map((member) => member.id);
  const availableUsers = (allUsers ?? []).filter((user) => !memberIds.includes(user.id));

  async function addMember() {
    if (!pendingUserId) {
      return;
    }

    try {
      await updateMembers.mutateAsync({ id: group!.id, request: { userIds: [...memberIds, pendingUserId] } });
      setPendingUserId("");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  async function removeMember(userId: string) {
    try {
      await updateMembers.mutateAsync({ id: group!.id, request: { userIds: memberIds.filter((id) => id !== userId) } });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <div>
      <Link href="/admin/groups" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400">
        <ArrowLeft size={14} /> Gruplara dön
      </Link>
      <h2 className="mb-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">{group.name}</h2>
      {group.description && <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">{group.description}</p>}

      <div className="mb-4 flex gap-2">
        <select
          value={pendingUserId}
          onChange={(event) => setPendingUserId(event.target.value)}
          className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
        >
          <option value="">Kullanıcı seçin...</option>
          {availableUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.displayName} ({user.email})
            </option>
          ))}
        </select>
        <Button onClick={addMember} disabled={!pendingUserId} isLoading={updateMembers.isPending}>
          Ekle
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Üye</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {group.members.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">{member.displayName}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{member.email}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => removeMember(member.id)} aria-label="Üyeyi kaldır">
                    <Trash2 size={14} className="text-red-500 dark:text-red-400" />
                  </Button>
                </td>
              </tr>
            ))}
            {group.members.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
                  Henüz üye yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
