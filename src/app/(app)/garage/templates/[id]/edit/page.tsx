import { TemplateForm } from "@/components/templates/TemplateForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ItemCategory, TemplateRow } from "@/types/supabase";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface EditTemplatePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: raw } = await supabase
    .from("item_templates")
    .select("id, category, name, property_keys, created_at, updated_at, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!raw) notFound();
  const template = raw as TemplateRow;

  // Count linked items.
  const { count: linkedItemCount } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("template_id", id)
    .eq("user_id", user.id);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <Link
          href="/garage/templates"
          className="mb-3 inline-flex items-center gap-1 text-xs text-cockpit-muted hover:text-cockpit-text"
        >
          <ChevronLeft size={14} strokeWidth={1.75} aria-hidden />
          Zurück zu Vorlagen
        </Link>
        <p className="text-[11px] uppercase tracking-widest text-cockpit-muted">
          Vorlage bearbeiten
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="text-petrol-400">{template.name}</span>
        </h1>
        {(linkedItemCount ?? 0) > 0 && (
          <p className="mt-1 text-xs text-cockpit-muted">
            {linkedItemCount} verknüpfte{linkedItemCount === 1 ? "s Item" : " Items"} — Änderungen werden nach Bestätigung übertragen.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-cockpit-border bg-cockpit-surface p-5 shadow-cockpit">
        <TemplateForm
          templateId={template.id}
          initialCategory={template.category as ItemCategory}
          initialName={template.name}
          originalKeys={template.property_keys}
          linkedItemCount={linkedItemCount ?? 0}
        />
      </div>
    </div>
  );
}
