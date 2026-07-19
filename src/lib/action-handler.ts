"use client";

import { toast } from "sonner";
import type { ActionResult } from "@/lib/api/response";
import { common } from "@/lib/messages";

interface ActionHandlerOptions {
  showToast?: boolean;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export async function handleAction<T = null>(
  action: Promise<ActionResult<T>>,
  options: ActionHandlerOptions = {}
): Promise<ActionResult<T>> {
  const { showToast = true, onSuccess, onError } = options;

  try {
    const result = await action;

    if (result.status) {
      if (showToast) toast.success(result.message);
      onSuccess?.();
    } else {
      if (showToast) toast.error(result.message);
      onError?.(result.message);
    }

    return result;
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    const message = error instanceof Error ? error.message : common.SOMETHING_WENT_WRONG;
    if (showToast) toast.error(message);
    onError?.(message);
    return { status: false, message, result: null };
  }
}

interface FetchHandlerOptions extends ActionHandlerOptions {
  headers?: Record<string, string>;
}

export async function handleFetch<T = null>(
  url: string,
  init: RequestInit,
  options: FetchHandlerOptions = {}
): Promise<ActionResult<T>> {
  const { showToast = true, onSuccess, onError } = options;

  try {
    const res = await fetch(url, init);
    const data = await res.json();

    if (!res.ok || data.status === false) {
      const message = data.message ?? common.SOMETHING_WENT_WRONG;
      if (showToast) toast.error(message);
      onError?.(message);
      return { status: false, message, result: null };
    }

    const message = data.message ?? "";
    if (showToast && message) toast.success(message);
    onSuccess?.();

    return {
      status: true,
      message,
      result: data.result ?? null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : common.SOMETHING_WENT_WRONG;
    if (showToast) toast.error(message);
    onError?.(message);
    return { status: false, message, result: null };
  }
}
