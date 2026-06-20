'use server';

import { signIn } from "@relipay/nextjs/server";
import { redirect } from "next/navigation";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Please enter both an email address and password." };
  }

  let success = false;
  try {
    const outcome = await signIn({ email, password });
    if (outcome.kind === "session") {
      success = true;
    } else {
      return { error: "MFA is required but not supported by this UI." };
    }
  } catch (err: any) {
    console.error("Login server action error:", err);
    return { error: err.message || "Invalid credentials or login failed." };
  }

  if (success) {
    redirect("/dashboard");
  }
}
