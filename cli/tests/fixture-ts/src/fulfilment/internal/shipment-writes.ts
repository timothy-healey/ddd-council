import { sequelize } from '@app/shared/db';
const Order = sequelize.define('OrderFromFulfilment', { id: {}, shipmentStatus: {} }, { tableName: 'orders' });
export const markShipped = () => Order.update({ shipmentStatus: 'Shipped' });
