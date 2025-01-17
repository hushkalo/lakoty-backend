import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import {
  CRM_API_KEY,
  KEY_CRM_API,
  MANAGER_ID,
  SOURCE_ID,
} from "../configuration";

@Injectable()
export class CourseService {
  async create(data: CreateOrderDto) {
    try {
      const response = await fetch(KEY_CRM_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CRM_API_KEY}`,
        },
        body: JSON.stringify({
          manager_id: MANAGER_ID,
          source_id: SOURCE_ID,
          buyer_comment: `Ім'я: ${data.firstName} Тип мессенджера: ${data.messengerType}, Мессенджер: ${data.messenger}`,
          buyer: {
            full_name: `${data.messenger}`,
            email: "",
            phone: data.phone,
          },
          products: [
            {
              sku: null,
              price: "4200",
              quantity: 1,
              name: "Курс по товарці",
            },
          ],
        }),
      });
      if (!response.ok) {
        console.log(response);
        throw new InternalServerErrorException("Failed to create order");
      }
      return {
        status: "success",
        message: "Order created successfully",
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
