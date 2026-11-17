import { DeliveryStatus } from '../enums/delivery-status.enum';
import {
  canTransition,
  DELIVERY_STATUS_TRANSITIONS,
} from './delivery-status-transitions';

describe('Transiciones de estado de entregas', () => {
  it.each([
    [DeliveryStatus.PROGRAMADA, DeliveryStatus.EN_TRANSITO],
    [DeliveryStatus.PROGRAMADA, DeliveryStatus.CANCELADA],
    [DeliveryStatus.EN_TRANSITO, DeliveryStatus.ENTREGADA],
    [DeliveryStatus.EN_TRANSITO, DeliveryStatus.CANCELADA],
  ])('permite pasar de %s a %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each([
    [DeliveryStatus.PROGRAMADA, DeliveryStatus.ENTREGADA],
    [DeliveryStatus.PROGRAMADA, DeliveryStatus.PROGRAMADA],
    [DeliveryStatus.EN_TRANSITO, DeliveryStatus.PROGRAMADA],
    [DeliveryStatus.ENTREGADA, DeliveryStatus.CANCELADA],
    [DeliveryStatus.CANCELADA, DeliveryStatus.PROGRAMADA],
  ])('no permite pasar de %s a %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it('ENTREGADA y CANCELADA son estados finales', () => {
    expect(DELIVERY_STATUS_TRANSITIONS[DeliveryStatus.ENTREGADA]).toEqual([]);
    expect(DELIVERY_STATUS_TRANSITIONS[DeliveryStatus.CANCELADA]).toEqual([]);
  });

  it('todos los estados tienen sus transiciones definidas', () => {
    for (const status of Object.values(DeliveryStatus)) {
      expect(DELIVERY_STATUS_TRANSITIONS[status]).toBeDefined();
    }
  });
});
