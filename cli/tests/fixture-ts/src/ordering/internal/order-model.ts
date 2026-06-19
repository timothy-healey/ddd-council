import { sequelize } from '@app/shared/db';
export const Order = sequelize.define('Order', { id: {}, status: {}, shipmentStatus: {} }, { tableName: 'orders' });
export const placed = () => Order.create({ status: 'placed' });
