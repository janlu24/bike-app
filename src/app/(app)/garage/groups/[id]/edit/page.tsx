import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RedirectGroupEdit({ params }: Props) {
  const { id } = await params;
  redirect(`/inventory/groups/${id}/edit`);
}
