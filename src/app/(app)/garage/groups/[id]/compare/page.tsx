import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RedirectGroupCompare({ params }: Props) {
  const { id } = await params;
  redirect(`/inventory/groups/${id}/compare`);
}
