// import Link from "next/link";
// import { auth } from "@relipay/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  redirect('/dashboard');
  return null;
}
