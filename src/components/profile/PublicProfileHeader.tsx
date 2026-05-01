import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface PublicProfileHeaderProps {
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export function PublicProfileHeader({
  username,
  full_name,
  bio,
  avatar_url,
}: PublicProfileHeaderProps) {
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
      <Avatar className="h-20 w-20 shrink-0 border-2 border-petrol-700/60">
        {avatar_url ? (
          <AvatarImage src={avatar_url} alt={`Profilbild von ${username}`} />
        ) : null}
        <AvatarFallback className="bg-petrol-950 text-petrol-300 text-lg font-semibold">
          {initials || <User size={28} strokeWidth={1.5} aria-hidden />}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-1">
        {full_name && (
          <h1 className="text-xl font-semibold tracking-tight text-cockpit-text">
            {full_name}
          </h1>
        )}
        <p className="text-sm text-cockpit-muted">
          <span className="text-petrol-400">@</span>
          {username}
        </p>
        {bio && (
          <p className="mt-2 text-sm text-cockpit-text/80 max-w-prose">{bio}</p>
        )}
      </div>
    </div>
  );
}
