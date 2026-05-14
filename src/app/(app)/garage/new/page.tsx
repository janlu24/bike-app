import { redirect } from "next/navigation";

export default function RedirectNewItem() {
  redirect("/inventory/new");
}
