"use client";

import { Trash2 } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { extractErrorMessage } from "@/lib/api/client";
import { useFolderTree } from "@/lib/api/folders";
import { useGroups } from "@/lib/api/groups";
import { useAssignPermission, usePermissionsForResource, useRemovePermission } from "@/lib/api/permissions";
import { PermissionLevel, ResourceType } from "@/lib/types";
import { PermissionResourcePicker, type SelectedResource } from "./PermissionResourcePicker";

const levelLabels: Record<PermissionLevel, string> = {
  [PermissionLevel.View]: "Görüntüleme",
  [PermissionLevel.Edit]: "Düzenleme",
  [PermissionLevel.Manage]: "Yönetim",
};

export function PermissionsManager() {
  const { data: tree, isLoading: isTreeLoading } = useFolderTree();
  const { data: groups } = useGroups();
  const [selectedResource, setSelectedResource] = useState<SelectedResource | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<PermissionLevel>(PermissionLevel.View);

  const resourceType = selectedResource?.type ?? ResourceType.Folder;
  const { data: permissions, isLoading: isPermissionsLoading } = usePermissionsForResource(resourceType, selectedResource?.id);
  const assignPermission = useAssignPermission(resourceType, selectedResource?.id ?? "");
  const removePermission = useRemovePermission(resourceType, selectedResource?.id ?? "");

  async function handleAssign() {
    if (!selectedResource || !selectedGroupId) {
      return;
    }

    try {
      await assignPermission.mutateAsync({
        groupId: selectedGroupId,
        resourceType: selectedResource.type,
        resourceId: selectedResource.id,
        level: selectedLevel,
      });
      toast.success("İzin atandı");
      setSelectedGroupId("");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  async function handleRemove(permissionId: string) {
    try {
      await removePermission.mutateAsync(permissionId);
      toast.success("İzin kaldırıldı");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  function handleLevelChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedLevel(Number(event.target.value) as PermissionLevel);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <div className="max-h-[36rem] overflow-y-auto rounded-xl border border-zinc-100 dark:border-zinc-800 p-3">
        {isTreeLoading && <Spinner className="mx-auto mt-6 text-primary-500 dark:text-primary-400" />}
        {tree && <PermissionResourcePicker nodes={tree} selected={selectedResource} onSelect={setSelectedResource} />}
      </div>

      <div>
        {!selectedResource && <p className="text-sm text-zinc-400 dark:text-zinc-500">İzinlerini yönetmek için soldan bir klasör veya doküman seçin.</p>}

        {selectedResource && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{selectedResource.label}</h2>

            <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 p-4">
              <Select label="Grup" value={selectedGroupId} onChange={(event) => setSelectedGroupId(event.target.value)} className="w-56">
                <option value="">Grup seçin</option>
                {groups?.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </Select>
              <Select label="Seviye" value={selectedLevel} onChange={handleLevelChange} className="w-40">
                <option value={PermissionLevel.View}>Görüntüleme</option>
                <option value={PermissionLevel.Edit}>Düzenleme</option>
                <option value={PermissionLevel.Manage}>Yönetim</option>
              </Select>
              <Button onClick={handleAssign} disabled={!selectedGroupId} isLoading={assignPermission.isPending}>
                Ata
              </Button>
            </div>

            {isPermissionsLoading && <Spinner className="text-primary-500 dark:text-primary-400" />}

            <div className="flex flex-col gap-2">
              {permissions?.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between rounded-lg border border-zinc-100 dark:border-zinc-800 px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{permission.groupName}</span>
                    <Badge variant="primary">{levelLabels[permission.level]}</Badge>
                  </div>
                  <button type="button" onClick={() => handleRemove(permission.id)} className="text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400" aria-label="İzni kaldır">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {permissions && permissions.length === 0 && <p className="text-sm text-zinc-400 dark:text-zinc-500">Bu kaynak için henüz izin tanımlanmamış.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
