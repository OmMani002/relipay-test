'use server';

import { signUp } from "@relipay/nextjs/server";
import { redirect } from "next/navigation";

export async function registerAction(prevState: any, formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!name || !email || !password) {
    return { error: "Please enter your name, email address, and password." };
  }

  let success = false;
  try {
    await signUp({ email, password, metadata: { name } });
    success = true;
  } catch (err: any) {
    console.error("Register server action error:", err);
    return { error: err.message || "Registration failed. Account might already exist." };
  }

  if (success) {
    redirect("/dashboard");
  }
}
