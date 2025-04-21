class Buyer {
  full_name: string;
  email: string;
  phone: string;
}

class Shipping {
  delivery_service_id: string;
  shipping_service: string;
  shipping_address_city: string;
  shipping_address_country: string;
  shipping_address_region: string;
  shipping_address_zip: string;
  recipient_full_name: string;
  recipient_phone: string;
  warehouse_ref: string;
}

class Payment {
  payment_method_id: string;
  payment_method: string;
  amount: string;
  description: string;
  payment_date: string;
  status: string;
}

class Property {
  name: string;
  value: string;
}

class Product {
  sku: string;
  price: number;
  quantity: number;
  properties: Property[];
  name: string;
  picture: string;
}

export class CreateOrderCrmDto {
  manager_id: number;
  source_id: number;
  buyer_comment: string;
  buyer: Buyer;
  shipping: Shipping;
  payments: Payment[];
  products: Product[];
}
// { // TODO: make normal send order in crm
//   manager_id: MANAGER_ID,
//     source_id: SOURCE_ID,
//   buyer_comment: `Тип мессенджера: ${data.messengerType}, Мессенджер: ${data.messenger}`,
//   buyer: {
//   full_name: `${data.firstName} ${data.secondName} ${data.patronymic}`,
//     email: data.messengerType === "mail" ? data.messenger : "",
//     phone: data.phone,
// },
//   shipping: {
//     delivery_service_id: DELIVERY_SERVICE_ID,
//       shipping_service: "Нова Пошта",
//       shipping_address_city: data.city,
//       shipping_address_country: "Ukraine",
//       shipping_address_region: data.cityArea,
//       shipping_address_zip: "",
//       recipient_full_name: `${data.firstName} ${data.secondName} ${data.patronymic}`,
//       recipient_phone: data.phone,
//       warehouse_ref: data.warehouseRef,
//   },
//   payments: [
//     {
//       payment_method_id: PAYMENT_METHOD_IDS[data.paymentType],
//       payment_method: t(
//         `store.delivery.form.paymentType.options.${data.paymentType}`
//       ),
//       amount: totalSum,
//       description: t(
//         `store.delivery.form.paymentType.options.${data.paymentType}`
//       ),
//       payment_date: "",
//       status: "not_paid",
//     },
//   ],
//     products: cart.map((item) => ({
//   sku: item.sku || null,
//   price: item.price,
//   quantity: item.quantity,
//   properties: [
//     {
//       name: "Size",
//       value: item.size.name,
//     },
//   ],
//   name: item.name,
//   picture: item.image,
// })),
// });
