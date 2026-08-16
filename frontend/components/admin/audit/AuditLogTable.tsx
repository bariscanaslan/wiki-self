"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { useAuditLogs } from "@/lib/api/audit";
import { useUsers } from "@/lib/api/users";
import { AuditAction, ResourceType } from "@/lib/types";

const actionLabels: Record<AuditAction, string> = {
  [AuditAction.Create]: "Oluşturma",
  [AuditAction.Update]: "Güncelleme",
  [AuditAction.Delete]: "Silme",
  [AuditAction.View]: "Görüntüleme",
  [AuditAction.Export]: "Dışa Aktarma",
};

const resourceTypeLabels: Record<ResourceType, string> = {
  [ResourceType.Folder]: "Klasör",
  [ResourceType.Document]: "Doküman",
};

const PAGE_SIZE = 25;

export function AuditLogTable() {
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [page, setPage] = useState(1);

  const { data: users } = useUsers();
  const { data, isLoading, isFetching } = useAuditLogs({
    userId: userId || undefined,
    action: action === "" ? undefined : (Number(action) as AuditAction),
    resourceType: resourceType === "" ? undefined : (Number(resourceType) as ResourceType),
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE)) : 1;
  const isBusy = isLoading || isFetching;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          value={userId}
          onChange={(event) => {
            setUserId(event.target.value);
            setPage(1);
          }}
          className="w-52"
        >
          <option value="">Tüm kullanıcılar</option>
          {users?.map((user) => (
            <option key={user.id} value={user.id}>
              {user.displayName}
            </option>
          ))}
        </Select>
        <Select
          value={action}
          onChange={(event) => {
            setAction(event.target.value);
            setPage(1);
          }}
          className="w-44"
        >
          <option value="">Tüm aksiyonlar</option>
          {Object.entries(actionLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={resourceType}
          onChange={(event) => {
            setResourceType(event.target.value);
            setPage(1);
          }}
          className="w-44"
        >
          <option value="">Tüm kaynaklar</option>
          {Object.entries(resourceTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {isBusy && (
        <div className="flex justify-center py-16">
          <Spinner className="text-primary-500 dark:text-primary-400" />
        </div>
      )}

      {!isBusy && data?.items.length === 0 && <EmptyState title="Kayıt bulunamadı" />}

      {!isBusy && data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Kullanıcı</th>
                <th className="px-4 py-3">Aksiyon</th>
                <th className="px-4 py-3">Kaynak</th>
                <th className="px-4 py-3">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.items.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{log.userDisplayName}</td>
                  <td className="px-4 py-3">
                    <Badge variant="primary">{actionLabels[log.action]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {resourceTypeLabels[log.resourceType]} · {log.resourceId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{format(new Date(log.timestamp), "d MMM yyyy HH:mm", { locale: tr })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
            Önceki
          </Button>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>
            Sonraki
          </Button>
        </div>
      )}
    </div>
  );
}
