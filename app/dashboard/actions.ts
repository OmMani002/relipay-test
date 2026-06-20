'use server';

import { signOut } from "@relipay/nextjs/server";

export async function logoutAction() {
  await signOut("/login");
}
