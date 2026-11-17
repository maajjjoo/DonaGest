import { DeliveryStatus } from '../enums/delivery-status.enum';

export const DELIVERY_STATUS_TRANSITIONS: Readonly<
  Record<DeliveryStatus, readonly DeliveryStatus[]>
> = {
  [DeliveryStatus.PROGRAMADA]: [
    DeliveryStatus.EN_TRANSITO,
    DeliveryStatus.CANCELADA,
  ],
  [DeliveryStatus.EN_TRANSITO]: [
    DeliveryStatus.ENTREGADA,
    DeliveryStatus.CANCELADA,
  ],
  [DeliveryStatus.ENTREGADA]: [],
  [DeliveryStatus.CANCELADA]: [],
};

export const canTransition = (
  from: DeliveryStatus,
  to: DeliveryStatus,
): boolean => DELIVERY_STATUS_TRANSITIONS[from].includes(to);
