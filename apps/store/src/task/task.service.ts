import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { OrderService } from "../order/order.service";
import { DateTime } from "luxon";
@Injectable()
export class TasksService {
  constructor(
    private readonly orderService: OrderService,
    private readonly logger: Logger,
  ) {}
  SERVICE_NAME = "task";

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleHandlePayment() {
    this.logger.debug("Handle payment start");
    const orders = await this.orderService.findAll({
      where: {
        status: "success",
      },
    });
    const promises = orders.map(async (order) => {
      const externalPayments = await this.orderService.getExternalPayment({
        from: DateTime.fromJSDate(order.createdAt)
          .toUTC()
          .toFormat("yyyy-MM-dd TT"),
        to: DateTime.now().toUTC().toFormat("yyyy-MM-dd TT"),
      });
      const foundExternalPayment = externalPayments.find(
        (item) => item.source_uuid === order.invoiceId,
      );
      if (!foundExternalPayment) {
        this.logger.error(
          `External payment not found ${order.invoiceId}`,
          this.SERVICE_NAME,
        );
        return null;
      }
      const totalSum = order.OrderProduct.reduce(
        (acc, item) =>
          acc +
          Math.round(item.price - (item.price * item.discount) / 100) *
            item.quantity,
        0,
      );
      const orderFromCrm = await this.orderService.getOrderFromCrm(
        order.keyCrmOrderId,
      );
      const payment = orderFromCrm.payments.find(
        (item) => item.status !== "canceled" && item.amount === totalSum,
      );
      if (!payment) {
        this.logger.error(
          `Order payment  does not exists ${order.invoiceId}`,
          null,
          this.SERVICE_NAME,
        );
        return null;
      }
      await this.orderService.setExternalPaymentToOrder(payment.id, {
        transaction_uuid: foundExternalPayment.uuid,
        transaction_id: foundExternalPayment.id,
      });
      return this.orderService.update(order.id, {
        status: "completed",
      });
    });
    try {
      await Promise.all(promises);
    } catch (error) {
      this.logger.error(error.message, error, this.SERVICE_NAME);
    }
    this.logger.debug("Handle payment end");
  }
}
