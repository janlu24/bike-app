-- ============================================================================
-- Auto-create a minimal profile when a new auth user is created.
-- Uses SECURITY DEFINER to bypass RLS (no user session exists at trigger time).
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  candidate text;
  fallback  text;
begin
  -- Derive username from email prefix; strip non-alphanumeric chars, lowercase
  candidate := lower(
    regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')
  );

  -- Truncate to max allowed length (32 chars)
  candidate := left(candidate, 32);

  -- Build a deterministic fallback from the user uuid (always unique)
  fallback := 'user_' || left(replace(NEW.id::text, '-', ''), 8);

  -- Use fallback when candidate is too short (<3) or already taken
  if char_length(candidate) < 3
     or exists (select 1 from public.profiles where username = candidate)
  then
    candidate := fallback;
  end if;

  insert into public.profiles (id, username)
  values (NEW.id, candidate);

  return NEW;
exception
  when others then
    -- Log without PII; never block user creation on profile failure
    raise warning 'handle_new_user: profile creation failed for user %. sqlstate=%, sqlerrm=%',
      NEW.id, sqlstate, sqlerrm;
    return NEW;
end;
$$;

-- Drop and recreate trigger to ensure idempotency
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
