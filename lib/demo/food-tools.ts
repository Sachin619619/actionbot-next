const RESTAURANTS = [
  { id: "r1", name: "Biryani Blues", cuisine: "Biryani", rating: 4.5, deliveryTime: "30 min", priceRange: "₹200-400", area: "Koramangala" },
  { id: "r2", name: "Dosa Corner", cuisine: "South Indian", rating: 4.2, deliveryTime: "25 min", priceRange: "₹100-250", area: "Indiranagar" },
  { id: "r3", name: "Dragon Wok", cuisine: "Chinese", rating: 4.3, deliveryTime: "35 min", priceRange: "₹250-500", area: "HSR Layout" },
  { id: "r4", name: "Pizza Paradise", cuisine: "Italian", rating: 4.1, deliveryTime: "40 min", priceRange: "₹300-600", area: "Whitefield" },
  { id: "r5", name: "Chaat Street", cuisine: "Street Food", rating: 4.6, deliveryTime: "20 min", priceRange: "₹50-150", area: "Jayanagar" },
  { id: "r6", name: "Tandoori Nights", cuisine: "North Indian", rating: 4.4, deliveryTime: "35 min", priceRange: "₹200-450", area: "MG Road" },
  { id: "r7", name: "Sushi Zen", cuisine: "Japanese", rating: 4.7, deliveryTime: "45 min", priceRange: "₹500-1000", area: "UB City" },
  { id: "r8", name: "Kerala Kitchen", cuisine: "Kerala", rating: 4.3, deliveryTime: "30 min", priceRange: "₹150-350", area: "BTM Layout" },
  { id: "r9", name: "Momos Hub", cuisine: "Tibetan", rating: 4.0, deliveryTime: "25 min", priceRange: "₹100-200", area: "Kalyan Nagar" },
  { id: "r10", name: "Burger Barn", cuisine: "American", rating: 4.2, deliveryTime: "30 min", priceRange: "₹200-400", area: "Electronic City" },
];

const MENUS: Record<string, any[]> = {
  r1: [
    { id: "m1", name: "Hyderabadi Chicken Biryani", price: 299, veg: false, popular: true },
    { id: "m2", name: "Paneer Biryani", price: 249, veg: true, popular: true },
    { id: "m3", name: "Mutton Biryani", price: 399, veg: false, popular: false },
    { id: "m4", name: "Egg Biryani", price: 199, veg: false, popular: false },
    { id: "m5", name: "Veg Dum Biryani", price: 219, veg: true, popular: false },
    { id: "m6", name: "Chicken 65", price: 179, veg: false, popular: true },
    { id: "m7", name: "Raita", price: 49, veg: true, popular: false },
  ],
  r2: [
    { id: "m8", name: "Masala Dosa", price: 89, veg: true, popular: true },
    { id: "m9", name: "Rava Dosa", price: 99, veg: true, popular: false },
    { id: "m10", name: "Idli Vada Combo", price: 79, veg: true, popular: true },
    { id: "m11", name: "Uttapam", price: 109, veg: true, popular: false },
    { id: "m12", name: "Filter Coffee", price: 39, veg: true, popular: true },
  ],
  r3: [
    { id: "m13", name: "Chicken Manchurian", price: 279, veg: false, popular: true },
    { id: "m14", name: "Veg Fried Rice", price: 199, veg: true, popular: true },
    { id: "m15", name: "Chilli Paneer", price: 249, veg: true, popular: false },
    { id: "m16", name: "Hakka Noodles", price: 219, veg: true, popular: true },
    { id: "m17", name: "Dragon Chicken", price: 329, veg: false, popular: false },
  ],
  r5: [
    { id: "m18", name: "Pani Puri (6 pcs)", price: 49, veg: true, popular: true },
    { id: "m19", name: "Bhel Puri", price: 69, veg: true, popular: true },
    { id: "m20", name: "Sev Puri", price: 59, veg: true, popular: false },
    { id: "m21", name: "Dahi Puri", price: 79, veg: true, popular: false },
    { id: "m22", name: "Aloo Tikki", price: 89, veg: true, popular: true },
  ],
  r6: [
    { id: "m23", name: "Butter Chicken", price: 329, veg: false, popular: true },
    { id: "m24", name: "Dal Makhani", price: 249, veg: true, popular: true },
    { id: "m25", name: "Garlic Naan", price: 69, veg: true, popular: true },
    { id: "m26", name: "Paneer Tikka", price: 279, veg: true, popular: false },
    { id: "m27", name: "Chicken Tikka", price: 299, veg: false, popular: false },
  ],
  r9: [
    { id: "m28", name: "Steamed Chicken Momos (8 pcs)", price: 129, veg: false, popular: true },
    { id: "m29", name: "Fried Veg Momos (8 pcs)", price: 119, veg: true, popular: true },
    { id: "m30", name: "Paneer Momos (8 pcs)", price: 139, veg: true, popular: false },
    { id: "m31", name: "Thukpa Soup", price: 149, veg: false, popular: false },
  ],
};

for (const r of RESTAURANTS) {
  if (!MENUS[r.id]) {
    MENUS[r.id] = [
      { id: `${r.id}-m1`, name: `${r.cuisine} Special`, price: 299, veg: false, popular: true },
      { id: `${r.id}-m2`, name: `${r.cuisine} Veg Platter`, price: 249, veg: true, popular: true },
      { id: `${r.id}-m3`, name: `Chef's Special`, price: 399, veg: false, popular: false },
    ];
  }
}

const CARTS: Record<string, { items: any[]; restaurantId: string }> = {};
const ORDERS: Record<string, any> = {};

export async function search_restaurants(params: { cuisine?: string; budget?: string; location?: string }) {
  let results = [...RESTAURANTS];
  if (params.cuisine) {
    const q = params.cuisine.toLowerCase();
    results = results.filter((r) => r.cuisine.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
  }
  if (params.location) {
    const q = params.location.toLowerCase();
    results = results.filter((r) => r.area.toLowerCase().includes(q));
  }
  if (params.budget) {
    const maxBudget = parseInt(params.budget.replace(/[^\d]/g, ""));
    if (!isNaN(maxBudget)) {
      results = results.filter((r) => {
        const maxPrice = parseInt(r.priceRange.split("-")[1].replace(/[^\d]/g, ""));
        return maxPrice <= maxBudget + 100;
      });
    }
  }
  return {
    restaurants: results.length > 0 ? results : RESTAURANTS.slice(0, 5),
    count: results.length || 5,
    message: results.length > 0 ? `Found ${results.length} restaurants` : "Showing top restaurants",
  };
}

export async function get_menu(params: { restaurant_id: string }) {
  const restaurant = RESTAURANTS.find((r) => r.id === params.restaurant_id);
  const menu = MENUS[params.restaurant_id];
  if (!restaurant || !menu) return { error: "Restaurant not found" };
  return { restaurant: restaurant.name, restaurantId: params.restaurant_id, items: menu, totalItems: menu.length };
}

export async function add_to_cart(params: { restaurant_id: string; items: Array<{ item_id: string; name: string; price: number; quantity: number }>; cart_id?: string }) {
  const cartId = params.cart_id || crypto.randomUUID().slice(0, 8);
  if (!CARTS[cartId]) CARTS[cartId] = { items: [], restaurantId: params.restaurant_id };
  for (const item of params.items) {
    const existing = CARTS[cartId].items.find((i) => i.item_id === item.item_id);
    if (existing) existing.quantity += item.quantity || 1;
    else CARTS[cartId].items.push({ ...item, quantity: item.quantity || 1 });
  }
  const total = CARTS[cartId].items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { cartId, items: CARTS[cartId].items, itemCount: CARTS[cartId].items.length, total: `₹${total}`, message: "Items added to cart" };
}

export async function place_order(params: { cart_id: string; address: string }) {
  const cart = CARTS[params.cart_id];
  if (!cart || cart.items.length === 0) return { error: "Cart is empty or not found" };
  const orderId = `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const restaurant = RESTAURANTS.find((r) => r.id === cart.restaurantId);
  ORDERS[orderId] = {
    items: [...cart.items], restaurant: restaurant?.name || "Unknown",
    address: params.address, total: `₹${total}`, status: "confirmed",
    estimatedDelivery: "30-40 minutes", placedAt: new Date().toISOString(),
  };
  delete CARTS[params.cart_id];
  return {
    orderId, status: "confirmed", restaurant: restaurant?.name, items: ORDERS[orderId].items,
    total: `₹${total}`, address: params.address, estimatedDelivery: "30-40 minutes",
    message: `Order placed successfully! Your order ID is ${orderId}`,
  };
}

export async function track_order(params: { order_id: string }) {
  const order = ORDERS[params.order_id];
  if (!order) return { error: "Order not found. Please check your order ID." };
  const elapsed = Date.now() - new Date(order.placedAt).getTime();
  const minutes = Math.floor(elapsed / 60000);
  let status = order.status;
  let statusMessage = "";
  if (order.status === "cancelled") { status = "cancelled"; statusMessage = "This order has been cancelled"; }
  else if (minutes < 2) { status = "confirmed"; statusMessage = "Order confirmed! Restaurant is preparing your food"; }
  else if (minutes < 5) { status = "preparing"; statusMessage = "Your food is being prepared"; }
  else if (minutes < 10) { status = "out_for_delivery"; statusMessage = "Your order is out for delivery!"; }
  else { status = "delivered"; statusMessage = "Your order has been delivered. Enjoy!"; }
  return { orderId: params.order_id, status, statusMessage, restaurant: order.restaurant, total: order.total, estimatedDelivery: order.estimatedDelivery };
}

export async function cancel_order(params: { order_id: string; reason?: string }) {
  const order = ORDERS[params.order_id];
  if (!order) return { error: "Order not found" };
  if (order.status === "delivered") return { error: "Cannot cancel a delivered order" };
  if (order.status === "cancelled") return { error: "Order is already cancelled" };
  order.status = "cancelled";
  return { orderId: params.order_id, status: "cancelled", refund: order.total, message: `Order ${params.order_id} cancelled. Refund of ${order.total} will be processed in 3-5 business days.` };
}
