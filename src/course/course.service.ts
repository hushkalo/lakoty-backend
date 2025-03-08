import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import {
  CRM_API_KEY,
  CRM_API_URL,
  MANAGER_ID,
  SOURCE_ID,
} from "../configuration";
import { TKeyCRMOrder } from "../type/response-data.type";

@Injectable()
export class CourseService {
  async create(data: CreateOrderDto) {
    try {
      const response = await fetch(`${CRM_API_URL}/order`, {
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

  async getCourseQuantity() {
    try {
      const response = await fetch(`${CRM_API_URL}/products/360`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CRM_API_KEY}`,
        },
      });
      if (!response.ok) {
        console.log(response);
        throw new InternalServerErrorException("Failed to create order");
      }
      const data = (await response.json()) as TKeyCRMOrder;
      return {
        quantity: data.quantity,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
