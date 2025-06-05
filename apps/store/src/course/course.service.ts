import { Injectable, InternalServerErrorException } from "@nestjs/common";

import { TKeyCRMOrder } from "@shared/types";
import { ConfigService } from "@nestjs/config";
import { EnvironmentVariablesForAdmin } from "@shared/configuration";

@Injectable()
export class CourseService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariablesForAdmin>,
  ) {}

  async getCourseQuantity() {
    try {
      const response = await fetch(
        `${this.configService.get("CRM_API_URL")}/products/360`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.configService.get("CRM_API_KEY")}`,
          },
        },
      );
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
