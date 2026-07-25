export const registerSchema = {
  body: (data: any) => {
    if (!data.email || typeof data.email !== "string" || !data.email.includes("@")) {
      return { error: "Valid email address is required" };
    }
    if (!data.username || typeof data.username !== "string" || data.username.trim().length < 3) {
      return { error: "Username must be at least 3 characters long" };
    }
    if (!data.password || typeof data.password !== "string" || data.password.length < 6) {
      return { error: "Password must be at least 6 characters long" };
    }
    return {};
  },
};

export const loginSchema = {
  body: (data: any) => {
    if (!data.identifier || typeof data.identifier !== "string" || data.identifier.trim().length === 0) {
      return { error: "Email or username is required" };
    }
    if (!data.password || typeof data.password !== "string" || data.password.length === 0) {
      return { error: "Password is required" };
    }
    return {};
  },
};

export const verifyEmailSchema = {
  body: (data: any) => {
    if (!data.email || typeof data.email !== "string") {
      return { error: "Email is required" };
    }
    if (!data.verificationCode || typeof data.verificationCode !== "string" || data.verificationCode.length !== 6) {
      return { error: "Verification code must be a 6-digit string" };
    }
    return {};
  },
};

export const forgotPasswordSchema = {
  body: (data: any) => {
    if (!data.identifier || typeof data.identifier !== "string") {
      return { error: "Email or username is required" };
    }
    return {};
  },
};

export const updatePasswordSchema = {
  body: (data: any) => {
    if (!data.identifier || typeof data.identifier !== "string") {
      return { error: "Email or username is required" };
    }
    if (!data.resetPasswordOtp || typeof data.resetPasswordOtp !== "string") {
      return { error: "Reset OTP is required" };
    }
    if (!data.newPassword || typeof data.newPassword !== "string" || data.newPassword.length < 6) {
      return { error: "New password must be at least 6 characters long" };
    }
    return {};
  },
};
