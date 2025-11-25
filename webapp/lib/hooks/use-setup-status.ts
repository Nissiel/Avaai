"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface SetupStatus {
  profile_completed: boolean;
  phone_configured: boolean;
  assistant_created: boolean;
}

async function fetchSetupStatus(): Promise<SetupStatus> {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("access_token")
    : null;

  if (!token) {
    return {
      profile_completed: false,
      phone_configured: false,
      assistant_created: false,
    };
  }

  try {
    const response = await fetch("/api/user/setup-status", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch setup status");
    }

    return response.json();
  } catch {
    return {
      profile_completed: false,
      phone_configured: false,
      assistant_created: false,
    };
  }
}

export function useSetupStatus() {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { data: status, isLoading, isFetching } = useQuery<SetupStatus>({
    queryKey: ["setup-status"],
    queryFn: fetchSetupStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes - don't refetch frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    enabled: mounted && !dismissed,
    placeholderData: {
      // Show optimistic defaults while loading
      profile_completed: false,
      phone_configured: false,
      assistant_created: false,
    },
  });

  useEffect(() => {
    setMounted(true);
    const wasDismissed = localStorage.getItem("setup_checklist_dismissed");
    if (wasDismissed === "true") {
      setDismissed(true);
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem("setup_checklist_dismissed", "true");
  };

  const allCompleted = status
    ? status.profile_completed && status.phone_configured && status.assistant_created
    : false;

  const completedCount = status
    ? [status.profile_completed, status.phone_configured, status.assistant_created].filter(Boolean).length
    : 0;

  // Setup is active if not dismissed and not all completed
  // Show immediately with placeholder data, then update when real data arrives
  const isSetupActive = mounted && !dismissed && !allCompleted;

  return {
    status,
    isLoading,
    isFetching, // True when fetching (including background refetch)
    dismissed,
    mounted,
    dismiss,
    allCompleted,
    completedCount,
    isSetupActive,
  };
}
