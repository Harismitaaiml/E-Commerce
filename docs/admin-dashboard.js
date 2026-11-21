import { initializeApp } from
"https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from
"https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let products = [];
let editingId = null;

const tokenKey = "adminToken";

async function getToken() {
    if (!auth.currentUser) {
        throw new Error("Please log in again.");
    }

    return await auth.currentUser.getIdToken();
}

async function api(url, options = {}) {
    const token = await getToken();

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "X-Firebase-Auth": `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "API request failed");
    }

    return data;
}

onAuthStateChanged(auth, async (user) => {
    if (!user || !sessionStorage.getItem(tokenKey)) {
        window.location.href = "/admin-login.html";
        return;
    }

    try {
        const token = await user.getIdToken();

        const verify = await fetch("https://e-commerce-zrdv.onrender.com/hobby-api/admin/verify", {
            headers: { "X-Firebase-Auth": `Bearer ${token}` }
        });

        if (!verify.ok) {
            await signOut(auth);
            sessionStorage.removeItem(tokenKey);
            window.location.href = "/admin-login.html";
            return;
        }

        document.getElementById("adminEmail").textContent = user.email;

        await loadProducts();
        await loadOrders();

    } catch (error) {
        alert(error.message);
    }
});

/* NAVIGATION */

document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => showSection(button.dataset.section));
});

document.querySelectorAll("[data-goto]").forEach(button => {
    button.addEventListener("click", () => showSection(button.dataset.goto));
});

function showSection(section) {
    document.querySelectorAll(".content-section").forEach(item => {
        item.classList.remove("active");
    });

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });

    document.getElementById(section).classList.add("active");

    document.querySelector(`[data-section="${section}"]`)
        ?.classList.add("active");

    const titles = {
        overview: "Dashboard Overview",
        products: "Product Management",
        orders: "Order Management",
        customers: "Customer Management"
    };

    document.getElementById("pageTitle").textContent = titles[section];
    if (section === "orders") loadOrders();
}

/* PRODUCTS */

async function loadProducts() {
    try {
        const data = await fetch("https://e-commerce-zrdv.onrender.com/hobby-api/products").then(response => {
            if (!response.ok) throw new Error("Could not load products");
            return response.json();
        });

        products = Array.isArray(data) ? data :
            (data.products || data.data || []);

        renderProducts();
        updateStatistics();

    } catch (error) {
        document.getElementById("productTable").textContent = error.message;
        document.getElementById("recentProducts").textContent = error.message;
    }
}

function getPrice(product) {
    if (product.pricePaise !== undefined) {
        return Number(product.pricePaise) / 100;
    }

    return Number(product.price || 0);
}

function getStock(product) {
    return Number(product.qty ?? product.stock ?? product.stockQuantity ?? 0);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function renderProducts() {
    const search = document.getElementById("productSearch")
        .value.toLowerCase();

    const filtered = products.filter(product =>
        String(product.name || product.title || product.productName || "")
            .toLowerCase().includes(search)
    );

    const rows = filtered.map(product => {
        const id = product.id || product.productId;

        return `
        <tr>
            <td>${escapeHTML(id)}</td>
            <td>${escapeHTML(product.name || product.title || product.productName)}</td>
            <td>${escapeHTML(product.category)}</td>
            <td>₹${getPrice(product).toFixed(2)}</td>
            <td>${getStock(product)}</td>
            <td><span class="status">${getStock(product) > 0 ? "Available" : "Out of Stock"}</span></td>
            <td>
                <button class="action-btn edit-btn" data-edit="${escapeHTML(id)}">Edit</button>
                <button class="action-btn delete-btn" data-delete="${escapeHTML(id)}">Delete</button>
            </td>
        </tr>`;
    }).join("");

    const table = `
    <table>
        <thead>
            <tr>
                <th>ID</th><th>Product</th><th>Category</th>
                <th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
            </tr>
        </thead>
        <tbody>${rows || "<tr><td colspan='7'>No products found</td></tr>"}</tbody>
    </table>`;

    document.getElementById("productTable").innerHTML = table;

    const recent = products.slice(0, 5);

    document.getElementById("recentProducts").innerHTML = `
    <table>
        <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th></tr></thead>
        <tbody>
        ${recent.map(product => `
            <tr>
                <td>${escapeHTML(product.name || product.title || product.productName)}</td>
                <td>${escapeHTML(product.category)}</td>
                <td>₹${getPrice(product).toFixed(2)}</td>
                <td>${getStock(product)}</td>
            </tr>`).join("")}
        </tbody>
    </table>`;
}

function updateStatistics() {
    document.getElementById("totalProducts").textContent = products.length;

    document.getElementById("lowStock").textContent =
        products.filter(product => getStock(product) < 10).length;
}

document.getElementById("productSearch")
    .addEventListener("input", renderProducts);

/* PRODUCT MODAL */

const modal = document.getElementById("productModal");
const form = document.getElementById("productForm");

function openModal(product = null) {
    form.reset();
    editingId = product ? (product.id || product.productId) : null;

    document.getElementById("modalTitle").textContent =
        product ? "Edit Product" : "Add Product";

    document.getElementById("productId").disabled = Boolean(product);

    if (product) {
        document.getElementById("productId").value = editingId;
        document.getElementById("productName").value =
            product.name || product.title || product.productName || "";

        document.getElementById("productCategory").value = product.category || "";
        document.getElementById("productDescription").value = product.description || "";
        document.getElementById("productPrice").value = getPrice(product);
        document.getElementById("productStock").value = getStock(product);
        document.getElementById("productImage").value = product.imageUrl || product.image || "";
    }

    document.getElementById("productMessage").textContent = "";
    modal.classList.add("open");
}

document.getElementById("addProductBtn").addEventListener("click", () => openModal());

document.getElementById("closeModal").addEventListener("click", () => {
    modal.classList.remove("open");
});

modal.addEventListener("click", event => {
    if (event.target === modal) modal.classList.remove("open");
});

form.addEventListener("submit", async event => {
    event.preventDefault();

    const message = document.getElementById("productMessage");
    const button = document.getElementById("saveProductBtn");

    button.disabled = true;
    message.textContent = "Saving...";

    const price = Number(document.getElementById("productPrice").value);

    const product = {
        id: document.getElementById("productId").value.trim(),
        title: document.getElementById("productName").value.trim(),
        category: document.getElementById("productCategory").value.trim(),
        description: document.getElementById("productDescription").value.trim(),
        pricePaise: Math.round(price * 100),
        qty: Number(document.getElementById("productStock").value),
        imageUrl: document.getElementById("productImage").value.trim()
    };

    try {
        if (editingId) {
            await api(`/hobby-api/products/${encodeURIComponent(editingId)}`, {
                method: "PUT",
                body: JSON.stringify(product)
            });
        } else {
            await api("https://e-commerce-zrdv.onrender.com/hobby-api/products", {
                method: "POST",
                body: JSON.stringify(product)
            });
        }

        modal.classList.remove("open");
        await loadProducts();

    } catch (error) {
        message.textContent = error.message;
    } finally {
        button.disabled = false;
    }
});

/* EDIT / DELETE */

document.addEventListener("click", async event => {
    const editId = event.target.dataset.edit;
    const deleteId = event.target.dataset.delete;

    if (editId) {
        const product = products.find(item =>
            String(item.id || item.productId) === editId
        );

        if (product) openModal(product);
    }

    if (deleteId) {
        if (!confirm(`Delete product ${deleteId}?`)) return;

        try {
            await api(`/hobby-api/products/${encodeURIComponent(deleteId)}`, {
                method: "DELETE"
            });

            await loadProducts();

        } catch (error) {
            alert(error.message);
        }
    }
});

/* LOGOUT */

document.getElementById("logoutBtn").addEventListener("click", async () => {
    sessionStorage.removeItem(tokenKey);
    await signOut(auth);
    window.location.href = "/admin-login.html";
});


/* ORDER MANAGEMENT */

async function loadOrders() {
    const box = document.getElementById("orderTable");
    const message = document.getElementById("orderMessage");

    if (!box || !message) return;

    message.textContent = "Loading orders...";
    box.innerHTML = "";

    try {
        const data = await api("https://e-commerce-zrdv.onrender.com/hobby-api/orders");
        const orders = data.orders || [];

        message.textContent = `${orders.length} order(s) found.`;

        if (!orders.length) {
            box.innerHTML = "<p>No customer orders found.</p>";
            return;
        }

        const statuses = [
            "PLACED", "CONFIRMED", "PROCESSING",
            "SHIPPED", "DELIVERED", "CANCELLED"
        ];

        box.innerHTML = `
        <div style="overflow-x:auto">
        <table>
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Address</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
            ${orders.map(order => {
                const customer = order.customer || {};
                const address = order.address || {};
                const items = order.items || [];
                const total = Number(order.totalPaise || 0) / 100;

                const dateValue = order.createdAt?._seconds
                    ? new Date(order.createdAt._seconds * 1000)
                    : order.createdAt?.seconds
                    ? new Date(order.createdAt.seconds * 1000)
                    : null;

                const itemText = items.map(item =>
                    `${escapeHTML(item.title)} × ${Number(item.quantity || 0)}`
                ).join("<br>");

                const addressText = [
                    address.line1, address.line2,
                    address.city, address.state,
                    address.postalCode, address.country
                ].filter(Boolean).map(escapeHTML).join(", ");

                return `
                <tr>
                    <td>
                        <strong>${escapeHTML(order.orderId)}</strong>
                        <br><small>${dateValue ? dateValue.toLocaleString() : "Date unavailable"}</small>
                    </td>
                    <td>${escapeHTML(customer.name)}</td>
                    <td>
                        ${escapeHTML(customer.email)}
                        <br>${escapeHTML(customer.phone)}
                    </td>
                    <td>${addressText || "Not provided"}</td>
                    <td>${itemText || "No items"}</td>
                    <td>₹${total.toFixed(2)}</td>
                    <td>${escapeHTML(order.paymentMethod || "COD")}</td>
                    <td>
                        <select data-order-status="${escapeHTML(order.orderId)}">
                            ${statuses.map(status =>
                                `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`
                            ).join("")}
                        </select>
                    </td>
                    <td>
                        <button class="action-btn" data-update-order="${escapeHTML(order.orderId)}">
                            Update
                        </button>
                    </td>
                </tr>`;
            }).join("")}
            </tbody>
        </table>
        </div>`;
    } catch (error) {
        message.textContent = "Could not load orders: " + error.message;
        box.innerHTML = "";
    }
}

document.getElementById("refreshOrdersBtn")
    ?.addEventListener("click", loadOrders);

document.addEventListener("click", async event => {
    const orderId = event.target.dataset.updateOrder;
    if (!orderId) return;

    const select = document.querySelector(
        `[data-order-status="${CSS.escape(orderId)}"]`
    );

    if (!select) return;

    event.target.disabled = true;

    try {
        await api(`/hobby-api/orders/${encodeURIComponent(orderId)}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: select.value })
        });

        document.getElementById("orderMessage").textContent =
            `Order ${orderId} updated to ${select.value}.`;

        await loadOrders();
    } catch (error) {
        alert("Status update failed: " + error.message);
    } finally {
        event.target.disabled = false;
    }
});
