import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

import {
  createFavorite,
  deleteFavorite,
  getFavoriteCount,
  getFavoriteStatus,
} from "../api/favorite";

import { useAuthStore } from "@/features/auth/store/useAuthStore";

import type {
  FavoriteCountResponse,
  FavoriteStatusResponse,
} from "../api/favorite";

type UseFavoriteParams = {
  workID: string;
  isInitiallyLiked?: boolean;
  isCountVisible: boolean;
};

type UseFavoriteReturn = {
  count: number;
  isLiked: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  canToggle: boolean;
  toggleFavorite: () => Promise<void>;
};

const useFavorite = ({
  workID,
  isInitiallyLiked,
  isCountVisible,
}: UseFavoriteParams): UseFavoriteReturn => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [localIsLiked, setLocalIsLiked] = useState(isInitiallyLiked ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const countKey = isCountVisible ? `/works/${workID}/favorite` : null;
  const statusKey =
    accessToken && isInitiallyLiked === undefined
      ? ([`/auth/works/${workID}/favorite/is-favorite`, accessToken] as const)
      : null;

  const { data: countResponse, mutate: mutateCount } =
    useSWR<FavoriteCountResponse>(countKey, () => getFavoriteCount(workID), {
      suspense: false,
    });
  const { data: statusResponse, mutate: mutateStatus } =
    useSWR<FavoriteStatusResponse>(
      statusKey,
      () => getFavoriteStatus(workID, accessToken ?? ""),
      { suspense: false },
    );

  const isLiked =
    isInitiallyLiked === undefined
      ? (statusResponse?.isFavorite ?? false)
      : localIsLiked;
  const isLoading =
    !!accessToken &&
    isInitiallyLiked === undefined &&
    statusResponse === undefined;

  useEffect(() => {
    if (isInitiallyLiked !== undefined) {
      setLocalIsLiked(isInitiallyLiked);
    }
  }, [isInitiallyLiked]);

  const toggleFavorite = async () => {
    if (!accessToken || isSubmittingRef.current || isLoading) return;

    const nextIsLiked = !isLiked;
    const countOffset = nextIsLiked ? 1 : -1;
    let isCountUpdated = false;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      if (isInitiallyLiked === undefined) {
        await mutateStatus({ isFavorite: nextIsLiked }, false);
      } else {
        setLocalIsLiked(nextIsLiked);
      }
      if (isCountVisible) {
        await mutateCount(
          (current) =>
            current
              ? { total: Math.max(0, current.total + countOffset) }
              : current,
          false,
        );
        isCountUpdated = true;
      }

      if (nextIsLiked) {
        await createFavorite(workID, accessToken);
      } else {
        await deleteFavorite(workID, accessToken);
      }
      if (isInitiallyLiked === undefined) {
        void mutateStatus().catch(() => undefined);
      }
      if (isCountVisible) void mutateCount().catch(() => undefined);
    } catch (error) {
      if (isInitiallyLiked === undefined) {
        await mutateStatus({ isFavorite: isLiked }, false);
      } else {
        setLocalIsLiked(isLiked);
      }
      if (isCountUpdated) {
        await mutateCount(
          (current) =>
            current
              ? { total: Math.max(0, current.total - countOffset) }
              : current,
          false,
        );
      }
      throw error;
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return {
    count: countResponse?.total ?? 0,
    isLiked,
    isLoading,
    isSubmitting,
    canToggle: !!accessToken,
    toggleFavorite,
  };
};

export default useFavorite;
