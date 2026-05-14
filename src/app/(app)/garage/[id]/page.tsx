import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RedirectItemDetail({ params }: Props) {
  const { id } = await params;
  redirect(`/inventory/${id}`);
}
