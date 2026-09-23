import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function useMounted() {
  return useIsClient();
}
