import { Order } from '../../constants/order.ts';
import {
  EnumFieldOptional,
  NumberFieldOptional,
  StringFieldOptional,
} from '../../decorators/field.decorators.ts';

export class PageOptionsDto {
  @EnumFieldOptional(() => Order, {
    default: Order.ASC,
  })
  readonly order!: Order;

  @NumberFieldOptional({
    minimum: 1,
    int: true,
  })
  readonly page?: number;

  @NumberFieldOptional({
    minimum: 1,
    maximum: 50,
    int: true,
  })
  readonly take?: number;

  get skip(): number | undefined {
    if (!this.page || !this.take) {
      return undefined;
    }
    return (this.page - 1) * this.take;
  }

  @StringFieldOptional()
  readonly q?: string;
}
