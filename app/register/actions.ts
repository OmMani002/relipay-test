'use server';

import { signUp } from "@relipay/nextjs/server";
import { redirect } from "next/navigation";

export async function registerAction(prevState: any, formData: FormData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Please enter both an email address and password." };
  }

  let success = false;
  try {
    await signUp({ email, password });
    success = true;
  } catch (err: any) {
    console.error("Register server action error:", err);
    return { error: err.message || "Registration failed. Account might already exist." };
  }

  if (success) {
    redirect("/dashboard");
  }
}
