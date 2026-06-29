export const common = {
  NOT_AUTHENTICATED: "Not authenticated.",
  UNAUTHORIZED: "Unauthorized.",
  FORBIDDEN: "Forbidden. You do not have permission to perform this action.",
  NOT_FOUND: "Resource not found.",
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again.",
  RATE_LIMIT_EXCEEDED: "Too many requests. Please wait a moment and try again.",
  REQUEST_TIMEOUT: "Request timed out. Please try again.",
  MISSING_REQUIRED_FIELDS: "Missing required fields.",
  INVALID_FILE_TYPE: "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
  FILE_TOO_LARGE: "File too large. Maximum size is 5MB.",
  MISSING_FILE_OR_PRODUCT: "Missing file or product ID.",
} as const;

export const auth = {
  SIGNUP_SUCCESS: "Check your email to confirm your account.",
  SIGNUP_UNAVAILABLE: "Supabase is not configured. Sign up is not available in demo mode.",
  LOGIN_FAILED: "Invalid email or password.",
  LOGIN_ADMIN_REQUIRED: "Unauthorized. Please login as admin.",
  LOGOUT_SUCCESS: "Logged out successfully.",
  PASSWORD_RESET_SENT: "Check your email for a password reset link.",
  PASSWORD_RESET_UNAVAILABLE: "Password reset is not available in demo mode.",
  PASSWORD_UPDATED: "Password updated successfully.",
} as const;

export const products = {
  CREATED: "Product created successfully.",
  UPDATED: "Product updated successfully.",
  DELETED: "Product deleted.",
  CREATE_ERROR: "Failed to create product.",
  NOT_FOUND: "Product not found.",
} as const;

export const categories = {
  CREATED: "Category created.",
  UPDATED: "Category updated.",
  DELETED: "Category deleted.",
  CREATE_ERROR: "Failed to create category.",
  NOT_FOUND: "Category not found.",
} as const;

export const images = {
  DELETED: "Image deleted.",
  ORDER_UPDATED: "Image order updated.",
  PRIMARY_UPDATED: "Primary image updated.",
  UPLOADED: "Image uploaded successfully.",
  UPLOAD_FAILED: (detail: string) => `Upload failed: ${detail}`,
  DELETE_ERROR: "Failed to delete image.",
} as const;

export const reviews = {
  MODERATED: (status: string) => `Review ${status}.`,
  DELETED: "Review deleted.",
  SUBMITTED: "Review submitted successfully.",
  ALREADY_REVIEWED: "You've already reviewed this product.",
} as const;

export const inquiries = {
  UPDATED: "Inquiry updated.",
  STATUS_CHANGED: (status: string) => `Inquiry marked as ${status}.`,
} as const;

export const wishlists = {
  ADDED: "Added to wishlist.",
  REMOVED: "Removed from wishlist.",
  ALREADY_EXISTS: "Already in wishlist.",
} as const;

export const profile = {
  UPDATED: "Profile updated.",
  UPDATE_ERROR: "Failed to update profile.",
} as const;

export const contact = {
  SENT: "Message sent successfully. We'll get back to you soon!",
  SEND_ERROR: "Failed to send message. Please try again.",
} as const;
