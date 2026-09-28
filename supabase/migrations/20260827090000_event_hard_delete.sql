-- ---------------------------------------------------------------------------
-- Etkinliklerin kalıcı olarak silinmesi.
--
-- ÖNEMLİ: Bu, projenin genel "kritik kayıt asla fiziksel olarak silinmez"
-- ilkesinden kullanıcının açık isteğiyle sapan, bilinçli bir istisnadır.
-- Bir etkinlik silindiğinde ona bağlı TÜM satış/stok/sayım geçmişi de
-- birlikte silinir ve geri getirilemez. Silmeden önce audit_logs'a tam bir
-- JSON snapshot yazılır (bkz. fn_delete_event_permanently) — bu, silme
-- olayının kendisini denetlenebilir tutar, ama silinen verinin içeriğini
-- geri yüklemez.
-- ---------------------------------------------------------------------------

alter table public.stock_movements
  drop constraint if exists stock_movements_event_id_fkey,
  add constraint stock_movements_event_id_fkey
    foreign key (event_id) references public.events (id) on delete cascade;

alter table public.sales_batches
  drop constraint if exists sales_batches_event_id_fkey,
  add constraint sales_batches_event_id_fkey
    foreign key (event_id) references public.events (id) on delete cascade;

alter table public.stock_counts
  drop constraint if exists stock_counts_event_id_fkey,
  add constraint stock_counts_event_id_fkey
    foreign key (event_id) references public.events (id) on delete cascade;

alter table public.waste_records
  drop constraint if exists waste_records_event_id_fkey,
  add constraint waste_records_event_id_fkey
    foreign key (event_id) references public.events (id) on delete cascade;

-- Bir transferin diğer ucu silinmeyen bir etkinliğe aitse transfer kaydı
-- (ve dolayısıyla o etkinliğin stok hareketi geçmişi) korunsun; sadece
-- silinen etkinliğe işaret eden uç null'lanır.
alter table public.stock_transfers
  drop constraint if exists stock_transfers_from_event_id_fkey,
  add constraint stock_transfers_from_event_id_fkey
    foreign key (from_event_id) references public.events (id) on delete set null;

alter table public.stock_transfers
  drop constraint if exists stock_transfers_to_event_id_fkey,
  add constraint stock_transfers_to_event_id_fkey
    foreign key (to_event_id) references public.events (id) on delete set null;

-- Cascade/SET NULL, silen kullanıcının rolüyle (RLS altında) çalışır —
-- bu yüzden daha önce kasıtlı olarak eklenmemiş olan DELETE policy'leri
-- artık dar kapsamlı (yalnızca admin) olarak ekleniyor. drop+create ile bu
-- dosya güvenle tekrar çalıştırılabilir (idempotent).
drop policy if exists events_delete on public.events;
create policy events_delete on public.events for delete using (public.is_admin());
drop policy if exists stock_movements_delete on public.stock_movements;
create policy stock_movements_delete on public.stock_movements for delete using (public.is_admin());
drop policy if exists sales_batches_delete on public.sales_batches;
create policy sales_batches_delete on public.sales_batches for delete using (public.is_admin());
drop policy if exists sales_lines_delete on public.sales_lines;
create policy sales_lines_delete on public.sales_lines for delete using (public.is_admin());
drop policy if exists stock_counts_delete on public.stock_counts;
create policy stock_counts_delete on public.stock_counts for delete using (public.is_admin());
drop policy if exists stock_count_lines_delete on public.stock_count_lines;
create policy stock_count_lines_delete on public.stock_count_lines for delete using (public.is_admin());
drop policy if exists waste_records_delete on public.waste_records;
create policy waste_records_delete on public.waste_records for delete using (public.is_admin());
-- SET NULL cascade'i teknik olarak bir UPDATE'tir.
drop policy if exists stock_transfers_update on public.stock_transfers;
create policy stock_transfers_update on public.stock_transfers for update using (public.is_admin()) with check (public.is_admin());

create or replace function public.fn_delete_event_permanently(p_event_id uuid) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_event public.events%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için admin yetkisi gerekli' using errcode = '42501';
  end if;

  select * into v_event from public.events where id = p_event_id;
  if not found then
    raise exception 'Etkinlik bulunamadı' using errcode = 'P0002';
  end if;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, old_value)
  values (auth.uid(), 'event.delete_permanent', 'events', p_event_id, to_jsonb(v_event));

  delete from public.events where id = p_event_id;

  return jsonb_build_object('status', 'deleted', 'event_id', p_event_id);
end;
$$;
