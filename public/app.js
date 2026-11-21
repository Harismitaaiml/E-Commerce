let products = [];
let cart = [];

async function loadProducts() {
  const message = document.getElementById("message");

  try {
    const response = await fetch("/hobby-api/products");
    if (!response.ok) throw new Error("API returned HTTP " + response.status);

    const data = await response.json();
    products = data.products || [];

    const categories = [...new Set(products.map(p => p.category))];
    document.getElementById("category").innerHTML =
      '<option value="">All categories</option>' +
      categories.map(c => `<option value="${c}">${c}</option>`).join("");

    message.textContent = `🎉 ${products.length} products ready to explore!`;
    render();
  } catch (error) {
    console.error("HobbyHub product loading error:", error);
    message.textContent =
      "Unable to load products: " + error.message + ". Please refresh the page.";
  }
}

function render() {
  const search = document.getElementById("search").value.toLowerCase();
  const category = document.getElementById("category").value;

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search) &&
    (!category || p.category === category)
  );

  document.getElementById("products").innerHTML = filtered.map(p => `
    <article class="card">
      <div class="icon">${p.icon || "📦"}</div>
      <div class="category">${p.category}</div>
      <h3>${p.title}</h3>
      <p class="description">${p.description || ""}</p>
      <div class="price-row">
        <span class="price">₹${(p.pricePaise / 100).toFixed(2)}</span>
        <span class="stock">${p.qty} in stock</span>
      </div>
      <button class="add" data-action="add" data-id="${p.id}" ${p.qty < 1 ? "disabled" : ""}>
        Add to Cart +
      </button>
    </article>
  `).join("") || "<p>No products found. Try another search.</p>";
}

function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  const item = cart.find(x => x.id === id);

  if (item) {
    if (item.qty >= p.qty) return alert("Stock limit reached");
    item.qty++;
  } else {
    cart.push({ id, qty: 1 });
  }

  updateCart();
}

function changeQty(id, change) {
  const item = cart.find(x => x.id === id);
  const p = products.find(x => x.id === id);

  if (!item || !p) return;
  if (change > 0 && item.qty >= p.qty) return alert("Stock limit reached");

  item.qty += change;

  if (item.qty <= 0) {
    cart = cart.filter(x => x.id !== id);
  }

  updateCart();
}

function updateCart() {
  document.getElementById("cartCount").textContent =
    cart.reduce((sum, item) => sum + item.qty, 0);

  document.getElementById("cartItems").innerHTML = cart.length
    ? cart.map(item => {
        const p = products.find(y => y.id === item.id);

        return `
          <div class="cart-line">
            <span>${p.title} × ${item.qty}</span>
            <span>
              <button data-action="qty" data-id="${item.id}" data-change="-1">−</button>
              <button data-action="qty" data-id="${item.id}" data-change="1">+</button>
            </span>
          </div>
        `;
      }).join("")
    : "Your cart is empty. Let's find something fun!";

  const total = cart.reduce(
    (sum, item) => sum + products.find(p => p.id === item.id).pricePaise * item.qty,
    0
  );

  document.getElementById("total").textContent =
    "Total: ₹" + (total / 100).toFixed(2);
}

function clearCart() {
  cart = [];
  updateCart();
}

document.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.scroll) {
    document.getElementById(button.dataset.scroll)
      .scrollIntoView({ behavior: "smooth" });
  }

  if (button.dataset.action === "add") {
    addToCart(button.dataset.id);
  }

  if (button.dataset.action === "qty") {
    changeQty(button.dataset.id, Number(button.dataset.change));
  }

  if (button.dataset.action === "clear") {
    clearCart();
  }
});

document.getElementById("search").addEventListener("input", render);
document.getElementById("category").addEventListener("change", render);

loadProducts();
