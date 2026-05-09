import { TourForm } from "@/components/tours/TourForm";
import { updateTourAction } from "@/app/(app)/tours/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface EditTourPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTourPage({ params }: EditTourPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tour } = await supabase
    .from("tours")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!tour) notFound();

  // Only the owner may edit.
  if (!user || user.id !== tour.user_id) redirect(`/tours/${id}`);

  const boundAction = updateTourAction.bind(null, id);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">Tour bearbeiten</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="text-petrol-400">{tour.name}</span> bearbeiten
        </h1>
      </div>

      <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-5 shadow-cockpit">
        <TourForm action={boundAction} initialData={tour} submitLabel="Änderungen speichern" />
      </div>
    </div>
  );
}
