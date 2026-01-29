-- Create SEO Pages table for Bulk Generator
create table if not exists public.seo_pages (
    id uuid default gen_random_uuid() primary key,
    location text not null,
    keyword text not null,
    title text not null,
    description text,
    content text,
    slug text not null unique,
    status text default 'published' check (status in ('published', 'draft', 'archived')),
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.seo_pages enable row level security;

create policy "Enable read access for all users"
    on public.seo_pages for select
    using (true);

create policy "Enable all access for admins"
    on public.seo_pages for all
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );
