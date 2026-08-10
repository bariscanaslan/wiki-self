"use client";

import { KeyRound, Plus, Trash2, UserCog, Users as UsersIcon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/api/client";
import { useDeleteUser, useSetUserActive, useUsers } from "@/lib/api/users";
import { useAuth } from "@/lib/auth/AuthContext";
import type { UserResponse } from "@/lib/types";
import { AssignUserGroupsModal } from "./AssignUserGroupsModal";
import { CreateUserModal } from "./CreateUserModal";
import { EditUserModal } from "./EditUserModal";
import { ResetPasswordModal } from "./ResetPasswordModal";

export function UsersTable() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();
  const setUserActive = useSetUserActive();
  const deleteUser = useDeleteUser();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserResponse | null>(null);
  const [groupsUser, setGroupsUser] = useState<UserResponse | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);

  async function toggleActive(targetUser: UserResponse) {
    try {
      await setUserActive.mutateAsync({ id: targetUser.id, request: { isActive: !targetUser.isActive } });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      toast.success("Kullanıcı silindi");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} /> Yeni Kullanıcı
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="text-primary-500" />
        </div>
      )}

      {!isLoading && users?.length === 0 && <EmptyState icon={UsersIcon} title="Henüz kullanıcı yok" />}

      {!isLoading && users && users.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-100">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Kullanıcı</th>
                <th className="px-4 py-3">Gruplar</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-zinc-50/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900">
                      {user.displayName}{" "}
                      {user.isAdmin && (
                        <Badge variant="primary" className="ml-1">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.groups.map((group) => (
                        <Badge key={group.id}>{group.name}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleActive(user)} disabled={user.id === currentUser?.id} className="disabled:opacity-40">
                      <Badge variant={user.isActive ? "success" : "danger"}>{user.isActive ? "Aktif" : "Pasif"}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setGroupsUser(user)} aria-label="Grupları düzenle">
                        <UserCog size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setResetPasswordUser(user)} aria-label="Şifreyi sıfırla">
                        <KeyRound size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditUser(user)}>
                        Düzenle
                      </Button>
                      <Button variant="ghost" size="sm" disabled={user.id === currentUser?.id} onClick={() => setDeleteTarget(user)} aria-label="Sil">
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateUserModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <EditUserModal user={editUser} onClose={() => setEditUser(null)} />
      <AssignUserGroupsModal user={groupsUser} onClose={() => setGroupsUser(null)} />
      <ResetPasswordModal user={resetPasswordUser} onClose={() => setResetPasswordUser(null)} />
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Kullanıcıyı sil"
        description={`"${deleteTarget?.displayName ?? ""}" adlı kullanıcıyı silmek istediğinize emin misiniz?`}
        confirmLabel="Sil"
        isLoading={deleteUser.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
