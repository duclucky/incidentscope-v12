import { useEffect } from "react";


export function useCanonicalReload(reload: () => void, poolId?: string): void {
  useEffect(() => {
    const handle = (event: Event) => {
      const requestedPool = (event as CustomEvent<{ poolId?: string }>).detail?.poolId;
      if (!poolId || !requestedPool || requestedPool === poolId) reload();
    };
    window.addEventListener("incidentscope:canonical-reload", handle);
    return () => window.removeEventListener("incidentscope:canonical-reload", handle);
  }, [poolId, reload]);
}
