-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type user_role as enum ('admin', 'coach', 'parent');
create type invitation_status as enum ('pending', 'accepted', 'declined');

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) primary key,
  name text not null,
  email text not null unique,
  role user_role not null default 'parent',
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Invitations table
create table if not exists public.invitations (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  role user_role not null default 'parent',
  invited_by uuid references public.profiles(id) not null,
  status invitation_status not null default 'pending',
  token text not null unique,
  expires_at timestamp with time zone not null,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

-- Players table
create table if not exists public.players (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  number integer,
  position text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Matches table
create table if not exists public.matches (
  id uuid default uuid_generate_v4() primary key,
  date timestamp with time zone not null,
  type text not null default '練習試合',
  opponent text not null,
  venue text,
  goals_for integer default 0,
  goals_against integer default 0,
  formation text not null default '4-4-2',
  mvp text,
  notes text,
  youtube_url text,
  photos jsonb default '[]'::jsonb,
  is_multi_match boolean default false,
  sub_matches jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Match lineups table
create table if not exists public.match_lineups (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  player_id uuid references public.players(id) on delete cascade not null,
  position text not null,
  is_starter boolean not null default true,
  created_at timestamp with time zone default now() not null
);

-- Substitutions table
create table if not exists public.substitutions (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  player_out_id uuid references public.players(id) on delete cascade not null,
  player_in_id uuid references public.players(id) on delete cascade not null,
  minute integer not null,
  reason text,
  created_at timestamp with time zone default now() not null
);

-- Player statistics table
create table if not exists public.player_statistics (
  id uuid default uuid_generate_v4() primary key,
  player_id uuid references public.players(id) on delete cascade not null,
  match_id uuid references public.matches(id) on delete cascade not null,
  goals integer default 0,
  assists integer default 0,
  minutes_played integer default 0,
  yellow_cards integer default 0,
  red_cards integer default 0,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Team settings table (for customization)
create table if not exists public.team_settings (
  id uuid default uuid_generate_v4() primary key,
  team_name text not null default '宮中サッカー部',
  primary_color text not null default '#6366f1',
  secondary_color text,
  logo_url text,
  header_image_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Insert default team settings
insert into public.team_settings (team_name, primary_color)
values ('宮中サッカー部', '#6366f1')
on conflict do nothing;

-- Create RLS (Row Level Security) policies
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_lineups enable row level security;
alter table public.substitutions enable row level security;
alter table public.player_statistics enable row level security;
alter table public.team_settings enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Invitations policies (only admins can manage)
create policy "Only admins can view invitations" on public.invitations
  for select using (
    exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Only admins can insert invitations" on public.invitations
  for insert with check (
    exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Players policies (everyone can view, admins/coaches can modify)
create policy "Everyone can view players" on public.players
  for select using (true);

create policy "Admins and coaches can insert players" on public.players
  for insert with check (
    exists(select 1 from public.profiles where id = auth.uid() and role in ('admin', 'coach'))
  );

create policy "Admins and coaches can update players" on public.players
  for update using (
    exists(select 1 from public.profiles where id = auth.uid() and role in ('admin', 'coach'))
  );

-- Matches policies
create policy "Everyone can view matches" on public.matches
  for select using (true);

create policy "Admins and coaches can insert matches" on public.matches
  for insert with check (
    exists(select 1 from public.profiles where id = auth.uid() and role in ('admin', 'coach'))
  );

create policy "Admins and coaches can update matches" on public.matches
  for update using (
    exists(select 1 from public.profiles where id = auth.uid() and role in ('admin', 'coach'))
  );

-- Match lineups policies
create policy "Everyone can view match lineups" on public.match_lineups
  for select using (true);

create policy "Admins and coaches can manage match lineups" on public.match_lineups
  for all using (
    exists(select 1 from public.profiles where id = auth.uid() and role in ('admin', 'coach'))
  );

-- Substitutions policies
create policy "Everyone can view substitutions" on public.substitutions
  for select using (true);

create policy "Admins and coaches can manage substitutions" on public.substitutions
  for all using (
    exists(select 1 from public.profiles where id = auth.uid() and role in ('admin', 'coach'))
  );

-- Player statistics policies
create policy "Everyone can view player statistics" on public.player_statistics
  for select using (true);

create policy "Admins and coaches can manage player statistics" on public.player_statistics
  for all using (
    exists(select 1 from public.profiles where id = auth.uid() and role in ('admin', 'coach'))
  );

-- Team settings policies (only admins can modify)
create policy "Everyone can view team settings" on public.team_settings
  for select using (true);

create policy "Only admins can update team settings" on public.team_settings
  for update using (
    exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Create functions and triggers for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger handle_players_updated_at
  before update on public.players
  for each row execute function public.handle_updated_at();

create trigger handle_matches_updated_at
  before update on public.matches
  for each row execute function public.handle_updated_at();

create trigger handle_player_statistics_updated_at
  before update on public.player_statistics
  for each row execute function public.handle_updated_at();

create trigger handle_team_settings_updated_at
  before update on public.team_settings
  for each row execute function public.handle_updated_at();

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'parent')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user registration
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();