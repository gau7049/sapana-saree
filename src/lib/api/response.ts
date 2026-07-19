import { NextResponse } from "next/server";

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
