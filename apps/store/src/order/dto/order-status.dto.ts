export class OrderStatusDto {
  id: number;
  name: string;
  alias: string;
  is_active: boolean;
  group_id: number;
  is_closing_order: boolean;
  is_reserved: boolean;
  expiration_period: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
