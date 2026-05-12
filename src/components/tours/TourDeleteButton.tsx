"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTourAction } from "@/app/(app)/tours/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface TourDeleteButtonProps {
  tourId: string;
  tourName: string;
}

export function TourDeleteButton({ tourId, tourName }: TourDeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteTourAction(tourId);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/tours");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && (
        <p role="alert" className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-cockpit-muted hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900"
          >
            Löschen
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-cockpit-surface border-cockpit-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Tour wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription className="text-cockpit-muted">
              „{tourName}" und alle Packlisten-Einträge werden dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-700 text-white hover:bg-red-600"
            >
              {isPending ? "Wird gelöscht…" : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
