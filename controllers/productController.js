const { db } = require("../config/firebase");

const allowedFields = [
  "title",
  "category",
  "description",
  "pricePaise",
  "qty",
  "icon",
  "active"
];

exports.list = async (req, res, next) => {
  try {
    let q = db.collection("products");

    if (req.query.category) {
      q = q.where("category", "==", String(req.query.category));
    }

    const snap = await q.get();
    const products = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.active !== false);

    res.json({ count: products.length, products });
  } catch (e) {
    next(e);
  }
};

exports.get = async (req, res, next) => {
  try {
    const d = await db.collection("products")
      .doc(req.params.productId).get();

    if (!d.exists || d.data().active === false) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ id: d.id, ...d.data() });
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { id, title, category, pricePaise, qty } = req.body;

    if (!id || !title || !category ||
        !Number.isInteger(pricePaise) || pricePaise < 0 ||
        !Number.isInteger(qty) || qty < 0) {
      return res.status(400).json({ error: "Valid id, title, category, pricePaise and qty are required" });
    }

    const ref = db.collection("products").doc(String(id));
    const existing = await ref.get();

    if (existing.exists) {
      return res.status(409).json({ error: "Product ID already exists" });
    }

    const product = {
      id: String(id),
      title,
      category,
      pricePaise,
      qty,
      description: req.body.description || "",
      icon: req.body.icon || "📦",
      active: true,
      schemaVersion: 1
    };

    await ref.set(product);
    res.status(201).json({ message: "Product created", product });
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const ref = db.collection("products").doc(req.params.productId);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields provided" });
    }

    if (updates.pricePaise !== undefined &&
        (!Number.isInteger(updates.pricePaise) || updates.pricePaise < 0)) {
      return res.status(400).json({ error: "Invalid pricePaise" });
    }

    if (updates.qty !== undefined &&
        (!Number.isInteger(updates.qty) || updates.qty < 0)) {
      return res.status(400).json({ error: "Invalid qty" });
    }

    await ref.update(updates);
    const updated = await ref.get();

    res.json({ message: "Product updated", product: { id: updated.id, ...updated.data() } });
  } catch (e) {
    next(e);
  }
};

exports.setStatus = async (req, res, next) => {
  try {
    const active = req.body.active;

    if (typeof active !== "boolean") {
      return res.status(400).json({ error: "active must be true or false" });
    }

    const ref = db.collection("products").doc(req.params.productId);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    await ref.update({ active });
    res.json({ message: "Product status updated", id: ref.id, active });
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const ref = db.collection("products").doc(req.params.productId);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    await ref.delete();
    res.json({ message: "Product deleted", id: ref.id });
  } catch (e) {
    next(e);
  }
};
