const { db } = require("../config/firebase");
const { createOrder } = require("../services/orderService");

exports.create = async (req, res, next) => {
  try {
    const result = await createOrder(req.body || {}, req.customer.uid);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// Customer sees only their own orders.
// Includes older orders that were saved before UID tracking.
exports.mine = async (req, res, next) => {
  try {
    const snapshot = await db.collection("orders").get();
    const email = String(req.customer.email || "").toLowerCase();

    const orders = snapshot.docs
      .filter(doc => doc.id !== "_schema")
      .filter(doc => {
        const data = doc.data();
        return data.customer?.uid === req.customer.uid ||
          (!data.customer?.uid &&
           String(data.customer?.email || "").toLowerCase() === email);
      })
      .map(doc => ({ orderId: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() || 0;
        const tb = b.createdAt?.toMillis?.() || 0;
        return tb - ta;
      });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

// Admin sees all orders.
exports.listAll = async (req, res, next) => {
  try {
    const snapshot = await db.collection("orders").get();

    const orders = snapshot.docs
      .filter(doc => doc.id !== "_schema")
      .map(doc => ({ orderId: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() || 0;
        const tb = b.createdAt?.toMillis?.() || 0;
        return tb - ta;
      });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

// Admin updates order status.
exports.updateStatus = async (req, res, next) => {
  try {
    const allowed = [
      "PLACED",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED"
    ];

    const status = String(req.body.status || "").toUpperCase();

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid order status" });
    }

    const ref = db.collection("orders").doc(req.params.orderId);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    await ref.update({
      status,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      orderId: ref.id,
      status
    });
  } catch (error) {
    next(error);
  }
};
