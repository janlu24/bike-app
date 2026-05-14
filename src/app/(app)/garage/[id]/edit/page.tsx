import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RedirectItemEdit({ params }: Props) {
  const { id } = await params;
  redirect(`/inventory/${id}/edit`);
}
