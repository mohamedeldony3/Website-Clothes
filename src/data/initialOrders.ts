import { OrderReceipt } from '../types';
import { PRODUCTS } from './products';

export const INITIAL_SAMPLE_ORDERS: OrderReceipt[] = [
  {
    orderId: 'MONO-784912',
    items: [
      {
        product: PRODUCTS[0],
        selectedColor: PRODUCTS[0].colors[0],
        selectedSize: 'L',
        quantity: 1,
      },
      {
        product: PRODUCTS[1],
        selectedColor: PRODUCTS[1].colors[0],
        selectedSize: 'XL',
        quantity: 1,
      },
    ],
    subtotal: 3500,
    shippingFee: 0,
    total: 3500,
    status: 'processing',
    customer: {
      fullName: 'أحمد محمود التميمي',
      phone: '01012345678',
      governorate: 'cairo',
      city: 'التجمع الخامس',
      streetAddress: 'شارع التسعين الشمالي، كمبوند القطامية ديونز، فيلا 14',
      notes: 'الاتصال قبل موعد التوصيل بنصف ساعة',
      paymentMethod: 'cod',
    },
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    orderId: 'MONO-651239',
    items: [
      {
        product: PRODUCTS[2],
        selectedColor: PRODUCTS[2].colors[0],
        selectedSize: 'M',
        quantity: 1,
      },
    ],
    subtotal: 1750,
    shippingFee: 70,
    total: 1820,
    status: 'shipped',
    customer: {
      fullName: 'عمر خالد الصاوي',
      phone: '01198765432',
      governorate: 'alexandria',
      city: 'سموحة',
      streetAddress: 'شارع فوزي معاذ، برج الأندلس، الدور 7',
      notes: 'الاستلام في الفترة الصباحية',
      paymentMethod: 'cod',
    },
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    orderId: 'MONO-519844',
    items: [
      {
        product: PRODUCTS[3],
        selectedColor: PRODUCTS[3].colors[0],
        selectedSize: 'XL',
        quantity: 1,
      },
    ],
    subtotal: 1600,
    shippingFee: 50,
    total: 1650,
    status: 'delivered',
    customer: {
      fullName: 'كريم عبد الرحمن',
      phone: '01234567890',
      governorate: 'giza',
      city: 'الشيخ زايد',
      streetAddress: 'الحي الثامن، عمارة 12، شقة 4',
      notes: '',
      paymentMethod: 'cod',
    },
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];
