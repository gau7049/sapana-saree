import { NextResponse } from "next/server";

// action*() return a plain object for Server Actions (consumed by
// lib/action-handler.ts on the client); api*() wrap the same shape in a
// NextResponse for Route Handlers. Kept as one shared shape so both call
// sites can be handled identically on the client.
export type ActionResult<T = null> = {
  status: boolean;
  message: string;
  result: T | null;
};

export function actionSuccess<T = null>(
  message: string,
  result: T | null = null
): ActionResult<T> {
  return { status: true, message, result };
}

export function actionError(message: string): ActionResult {
  return { status: false, message, result: null };
}

export function apiSuccess<T = null>(
  message: string,
  result: T | null = null,
  httpStatus = 200
) {
  return NextResponse.json(
    { status: true, message, result },
    { status: httpStatus }
  );
}

export function apiError(message: string, httpStatus = 400) {
  return NextResponse.json(
    { status: false, message, result: null },
    { status: httpStatus }
  );
}
