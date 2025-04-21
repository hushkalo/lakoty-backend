class CustomField {
  uuid: string;
  value: string;
}

export class CreateProductCrmDto {
  name: string;
  description: string;
  pictures: string[];
  sku: string;
  currency_code: string;
  price: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  category_id: number;
  custom_fields: CustomField[];
}
