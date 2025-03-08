class ProductOfferProperties {
  name: string;
  value: string;
}

class ProductOffer {
  sku: string;
  price: number;
  weight: number;
  height: number;
  image_url: string;
  length: number;
  width: number;
  properties: ProductOfferProperties[];
}

export class CreateProductOffersCrmDto {
  offers: ProductOffer[];
}
