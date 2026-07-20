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
  SIGNUP_SUCCESS: "Account created successfully.",
  LOGIN_SUCCESS: "Signed in successfully.",
  USERNAME_TAKEN: "That username is already taken.",
  INVALID_USERNAME: "Username must be 3-20 characters: lowercase letters, numbers, and underscores, starting with a letter.",
  LOGIN_ADMIN_REQUIRED: "Unauthorized. Please login as admin.",
  LOGOUT_SUCCESS: "Logged out successfully.",
  NO_RECOVERY_EMAIL: "No verified recovery email on file for this account. Please double-check your password, verify your email from your account page, or create a new account.",
  PASSWORD_UPDATED: "Password updated successfully.",
  NO_EMAIL_TO_VERIFY: "There's no unverified email on file for your account.",
  OTP_SENT: "We've emailed you a 6-digit code.",
  OTP_INVALID: "That code is incorrect. Please try again.",
  OTP_EXPIRED: "That code has expired. Request a new one.",
  OTP_RESEND_TOO_SOON: "Please wait a moment before requesting another code.",
  EMAIL_VERIFIED: "Email verified successfully.",
  PASSWORD_RESET_SUCCESS: "Password updated. You can now sign in.",
} as const;

export const products = {
  CREATED: "Product created successfully.",
  UPDATED: "Product updated successfully.",
  DELETED: "Product deleted.",
  ARCHIVED: "Product archived.",
  CREATE_ERROR: "Failed to create product.",
  NOT_FOUND: "Product not found.",
  SLUG_TAKEN: "That URL slug is already in use by another product.",
  INVALID_COMPARE_AT_PRICE: "Compare at Price must be higher than Price.",
  BULK_UPDATED: (count: number) => `${count} ${count === 1 ? "product" : "products"} updated.`,
  BULK_DELETED: (count: number) => `${count} ${count === 1 ? "product" : "products"} deleted.`,
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
  TOO_MANY_IMAGES: (max: number) => `Maximum ${max} images per product.`,
  DELETE_ERROR: "Failed to delete image.",
} as const;

export const reviews = {
  MODERATED: (status: string) => `Review ${status}.`,
  DELETED: "Review deleted.",
  SUBMITTED: "Review submitted successfully.",
  ALREADY_REVIEWED: "You've already reviewed this product.",
  POINTS_ALREADY_SPENT:
    "This review can't be deleted because you've already used the loyalty points it earned.",
} as const;

export const inquiries = {
  UPDATED: "Inquiry updated.",
  LOGGED: "Inquiry recorded.",
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
  ADDRESS_SAVED: "Address saved.",
} as const;

export const contact = {
  SENT: "Message sent successfully. We'll get back to you soon!",
  SEND_ERROR: "Failed to send message. Please try again.",
} as const;
