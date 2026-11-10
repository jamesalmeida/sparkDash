import type { StorageMetrics } from "../api/types";

/**
 * Shared "main disk" policy for the Overview card and Storage Manager:
 * prefer "/", never /boot/efi, then the historical nvme0n1p2 fallback.
 *
 * This module was imported by e89f8d1 but not included in that commit.
 * Local install-only shim so `npm run build` succeeds; not pushed upstream.
 */
export const metricsView = {
  preferLabel: "/",
  excludeLabels: ["/boot/efi"],
  fallbackDevice: "nvme0n1p2",
} as const;

export type FilesystemView = {
  preferLabel?: string;
  excludeLabels?: readonly string[];
  fallbackDevice?: string;
};

export function mainFilesystem(
  storage: StorageMetrics[] | undefined | null,
  view: FilesystemView = metricsView,
): StorageMetrics | undefined {
  const disks = Array.isArray(storage) ? storage : [];
  const excluded = new Set(view.excludeLabels ?? metricsView.excludeLabels);
  const usable = disks.filter((d) => d && !excluded.has(d.label));
  const prefer = view.preferLabel ?? metricsView.preferLabel;
  const fallback = view.fallbackDevice ?? metricsView.fallbackDevice;
  return usable.find((d) => d.label === prefer) ?? usable.find((d) => d.device === fallback) ?? usable[0];
}
