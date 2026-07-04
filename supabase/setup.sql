-- Create a generic documents table
create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  amount numeric(10, 2) default 0.00,
  category text,
  is_recurring boolean default false,
  recurring_duration text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add a generated column for full text search
alter table documents
add column fts tsvector generated always as (to_tsvector('english', title || ' ' || content)) stored;

-- Create an index to make searches faster
create index documents_fts_idx on documents using gin (fts);

-- Function to search documents
create or replace function search_documents(search_query text)
returns setof documents
language plpgsql
as $$
begin
  return query
  select *
  from documents
  where fts @@ to_tsquery('english', search_query)
  order by ts_rank(fts, to_tsquery('english', search_query)) desc;
end;
$$;

-- Create the Storage Bucket for invoices
insert into storage.buckets (id, name, public) 
values ('invoices', 'invoices', true) 
on conflict (id) do nothing;

-- Allow public uploads to invoices bucket
create policy "Allow public uploads" on storage.objects
for insert to public with check (bucket_id = 'invoices');

-- Allow public reading of invoices
create policy "Allow public viewing" on storage.objects
for select to public using (bucket_id = 'invoices');
