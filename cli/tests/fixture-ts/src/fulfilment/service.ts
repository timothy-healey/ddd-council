import { OrderRepository } from '../ordering/internal/order-repository';
import { placeOrder } from '../ordering/api';
export const ship = () => { new OrderRepository(); placeOrder(); };
