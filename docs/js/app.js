import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  firebaseConfig,
  FIREBASE_CONFIG,
  FIRESTORE_DOCUMENTS_URL
} from "./firebase-config.js";

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
let authUser = null;

// HobbyHub website: products are read from Firestore REST API.
// The existing browser-local demo login/cart/order history are retained as requested.
// Browser-local login is NOT secure authentication and must not authorize privileged writes.
const CART_KEY='hobbyhub_fb_cart', ORDERS_KEY='hobbyhub_fb_orders';
const categories=[['Photography','Capture the moments','📷'],['Gaming','Level up your setup','🎮'],['Art & Painting','Make something yours','🎨'],['Music','Find your rhythm','🎸'],['Fitness','Move with purpose','🏋️'],['DIY & Crafts','Build it yourself','🧵'],['Reading','Get lost in a story','📚'],['Gardening','Grow something good','🪴']];
let productsCache=[], filter='', query='', sort='featured';
function money(p){return '₹'+(Number(p||0)/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}}
function cart(){return read(CART_KEY,[])}
function saveCart(c){localStorage.setItem(CART_KEY,JSON.stringify(c));updateCartCount()}
function currentUser(){
 const u=authUser;
 return u ? {uid:u.uid,email:u.email||'',name:u.displayName||u.email?.split('@')[0]||'Customer'} : null;
}
function toast(s){$('#toast').text(s).addClass('show');setTimeout(()=>$('#toast').removeClass('show'),2200)}
function updateCartCount(){$('#cart-count').text(cart().reduce((n,x)=>n+x.qty,0))}
function showModal(html){$('#modal-body').html(html);$('#overlay').removeClass('hidden')}
function closeModal(){$('#overlay').addClass('hidden')}
function renderCategories(){
 const box=$('#categories').empty(),select=$('#filter').empty().append('<option value="">All hobbies</option>');
 categories.forEach(([name,desc,icon])=>box.append(`<button class="category" data-category="${esc(name)}"><span>${icon}</span><strong>${esc(name)}</strong><small>${esc(desc)}</small></button>`));
 [...new Set(productsCache.map(p=>p.category))].sort().forEach(c=>select.append(`<option value="${esc(c)}">${esc(c)}</option>`));
}
function decodeFirestoreValue(v){
 if('stringValue'in v)return v.stringValue;
 if('integerValue'in v)return Number(v.integerValue);
 if('doubleValue'in v)return Number(v.doubleValue);
 if('booleanValue'in v)return v.booleanValue;
 if('nullValue'in v)return null;
 if('arrayValue'in v)return (v.arrayValue.values||[]).map(decodeFirestoreValue);
 if('mapValue'in v){const o={};Object.entries(v.mapValue.fields||{}).forEach(([k,x])=>o[k]=decodeFirestoreValue(x));return o}
 return null;
}
function documentToProduct(doc){
 const f={};Object.entries(doc.fields||{}).forEach(([k,v])=>f[k]=decodeFirestoreValue(v));
 return {id:doc.name.split('/').pop(),...f};
}
async function loadProducts(){
 $('#status').text('Loading products from Firebase Firestore…');
 try{
  const url=`${FIRESTORE_DOCUMENTS_URL}/${FIREBASE_CONFIG.productsCollection}?pageSize=100`;
  const response=await fetch(url);
  if(!response.ok){let detail='';try{const e=await response.json();detail=e.error?.message||''}catch{}throw new Error(`Firestore returned ${response.status}${detail?': '+detail:''}`)}
  const data=await response.json();
  productsCache=(data.documents||[]).map(documentToProduct).filter(p=>p.active!==false);
  renderCategories();renderProducts();
  $('#status').text(`${productsCache.length} products loaded from Firebase Firestore.`);
 }catch(err){
  $('#status').text(`Could not load Firebase products: ${err.message}. Check project ID, collection name and Firestore read rules.`);
  $('#products').html('<div class="panel">The website is running, but it cannot read the Firestore catalogue yet. Review the setup guide in README.md.</div>');
 }
}
function renderProducts(){
 let list=[...productsCache];
 if(filter)list=list.filter(p=>p.category===filter);
 if(query)list=list.filter(p=>(p.title+' '+p.category+' '+p.description).toLowerCase().includes(query));
 if(sort==='low')list.sort((a,b)=>a.pricePaise-b.pricePaise);
 if(sort==='high')list.sort((a,b)=>b.pricePaise-a.pricePaise);
 const box=$('#products').empty();
 if(!list.length){box.html('<div class="panel">No products match your search.</div>');return}
 list.forEach(p=>box.append(`<article class="product-card"><div class="product-art"><span class="stock">${Number(p.qty)>0?'IN STOCK':'SOLD OUT'}</span>${esc(p.icon||'✦')}</div><div class="product-info"><small>${esc(p.category)}</small><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><div class="product-bottom"><strong>${money(p.pricePaise)}</strong><button class="btn btn-dark" data-add="${esc(p.id)}" ${Number(p.qty)<1?'disabled':''}>${Number(p.qty)<1?'Sold out':'Add to cart'}</button></div></div></article>`));
}
function addToCart(id){
 const p=productsCache.find(x=>x.id===id);if(!p)return;
 const c=cart(),item=c.find(x=>x.id===id),current=item?.qty||0;
 if(current>=Number(p.qty))return toast('Not enough stock available.');
 if(item)item.qty++;else c.push({id,qty:1,title:p.title,pricePaise:p.pricePaise});
 saveCart(c);toast(`${p.title} added to cart.`);
}
function renderCart(){
 const c=cart();let total=0;
 const rows=c.map(i=>{const p=productsCache.find(x=>x.id===i.id)||i;if(!p)return '';const line=Number(p.pricePaise)*i.qty;total+=line;return `<div class="cart-row"><div><strong>${esc(p.title)}</strong><div class="muted">${money(p.pricePaise)} each · Line total ${money(line)}</div></div><div class="cart-actions"><button class="qty" data-cart="minus" data-id="${esc(i.id)}">−</button><b>${i.qty}</b><button class="qty" data-cart="plus" data-id="${esc(i.id)}">+</button><button class="qty" data-cart="remove" data-id="${esc(i.id)}">×</button></div></div>`}).join('');
 showModal(`<p class="eyebrow">Your bag</p><h2>Shopping cart</h2>${rows||'<p class="muted">Your cart is empty.</p>'}<div class="total"><span>Grand total</span><strong>${money(total)}</strong></div><button class="btn btn-dark" id="checkout" ${c.length?'':'disabled'}>Continue to checkout</button><p class="muted">Cart contents and totals are calculated in this browser. Inventory is read from Firestore.</p>`);
}
function updateCart(action,id){
 const c=cart(),item=c.find(x=>x.id===id),p=productsCache.find(x=>x.id===id);if(!item)return;
 if(action==='remove'){saveCart(c.filter(x=>x.id!==id))}
 if(action==='minus'){item.qty--;saveCart(c.filter(x=>x.qty>0))}
 if(action==='plus'){if(!p||item.qty>=Number(p.qty))return toast('Stock limit reached.');item.qty++;saveCart(c)}
 renderCart();
}
function showLogin(){showModal(`<p class="eyebrow">HobbyHub account</p><h2>Sign in</h2><form id="login-form"><label>Email<input id="login-email" type="email" required></label><label>Password<input id="login-password" type="password" required></label><button class="btn btn-dark">Sign in</button><p id="auth-error" class="muted"></p></form><p class="muted">New customer? <button id="show-signup" class="text-link">Create account</button></p><p class="muted">Demo login remains browser-local; it is not Firebase Authentication.</p>`)}
function showSignup(){showModal(`<p class="eyebrow">Join HobbyHub</p><h2>Create account</h2><form id="signup-form"><label>Name<input id="new-name" required></label><label>Email<input id="new-email" type="email" required></label><label>Password<input id="new-password" type="password" minlength="6" required></label><label>Confirm password<input id="confirm-password" type="password" required></label><button class="btn btn-dark">Create account</button><p id="auth-error" class="muted"></p></form><p class="muted">Already registered? <button id="show-login" class="text-link">Sign in</button></p>`)}
function updateHeader(){
 const u=currentUser();
 $('#auth-open').toggleClass('hidden',!!u);
 $('#logout').toggleClass('hidden',!u);
 $('#user-label').text(u?`Hi, ${u.name.split(' ')[0]}`:'');
}
async function renderOrders(){
 const u=currentUser(),box=$('#order-list');
 if(!u){
  box.text('Sign in to view your orders.');
  return;
 }
 box.text('Loading your orders...');
 try{
  const token=await authUser.getIdToken();
  const response=await fetch('/hobby-api/orders/mine',{
   headers:{'X-Firebase-Auth':`Bearer ${token}`}
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||'Could not load orders');

  const orders=data.orders||[];
  box.html(orders.length?orders.map(o=>`
   <div class="order">
    <strong>${esc(o.orderId)} · ${money(o.totalPaise||0)}</strong>
    <p class="muted">
     ${o.createdAt?new Date(o.createdAt._seconds*1000).toLocaleString():''}
     · ${esc(o.paymentMethod||'COD')}
     · Status: <strong>${esc(o.status||'PLACED')}</strong>
    </p>
    <p>${(o.items||[]).map(i=>`${esc(i.title)} × ${Number(i.quantity)}`).join('<br>')}</p>
    <p class="muted">Delivery: ${esc(o.address?.line1)}, ${esc(o.address?.city)}, ${esc(o.address?.state)} - ${esc(o.address?.postalCode)}</p>
   </div>`).join(''):'No orders yet.');
 }catch(error){
  box.text(`Could not load orders: ${error.message}`);
 }
}
function checkout(){
 const u=currentUser();if(!u)return showLogin();const c=cart();if(!c.length)return toast('Your cart is empty.');
 const total=c.reduce((sum,i)=>sum+Number((productsCache.find(p=>p.id===i.id)||i).pricePaise)*i.qty,0);
 showModal(`<p class="eyebrow">Secure order request</p><h2>Delivery details</h2><form id="checkout-form">
 <label>Full name<input id="delivery-name" value="${esc(u.name)}" maxlength="100" required></label>
 <label>Email<input id="delivery-email" type="email" value="${esc(u.email)}" maxlength="160" required></label>
 <label>Phone number<input id="delivery-phone" type="tel" pattern="[0-9+() -]{8,20}" maxlength="20" placeholder="10-digit phone number" required></label>
 <label>Address line<input id="delivery-address" maxlength="180" required></label>
 <label>City<input id="delivery-city" maxlength="80" required></label>
 <label>State<input id="delivery-state" maxlength="80" required></label>
 <label>PIN code<input id="delivery-pin" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required></label>
 <div class="total"><span>Order total</span><strong>${money(total)}</strong></div>
 <label>Payment method<select id="payment-method"><option value="cod">Cash on delivery</option></select></label>
 <p class="muted">Your order and stock update will be processed by the HobbyHub backend. No online payment is collected.</p>
 <p id="checkout-error" class="muted" role="alert"></p><button class="btn btn-dark" id="place-order-button">Place order</button></form>`);
}
async function placeOrder(){
 const u=currentUser(),c=cart();if(!u||!c.length)return;
 const button=$('#place-order-button');button.prop('disabled',true).text('Placing order…');$('#checkout-error').text('');
 const payload={
  customer:{
   name:$('#delivery-name').val().trim(),
   email:$('#delivery-email').val().trim().toLowerCase(),
   phone:$('#delivery-phone').val().trim()
  },
  address:{
   line1:$('#delivery-address').val().trim(),
   city:$('#delivery-city').val().trim(),
   state:$('#delivery-state').val().trim(),
   postalCode:$('#delivery-pin').val().trim()
  },
  paymentMethod:'cod',
  items:c.map(i=>({productId:i.id,quantity:i.qty}))
 };
 try{
  const token = await authUser.getIdToken();
   const response=await fetch('/hobby-api/orders',{
    method:'POST',
    headers:{
     'Content-Type':'application/json',
     'X-Firebase-Auth':`Bearer ${token}`
    },
    body:JSON.stringify(payload)
   });
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(result.error||`Order request failed (${response.status}).`);
  const orders=read(ORDERS_KEY,[]);orders.push({id:result.orderId,customerEmail:payload.customer.email,time:result.createdAt,method:'Cash on delivery',totalPaise:result.totalPaise,lines:result.items.map(x=>({id:x.productId,title:x.title,qty:x.quantity,pricePaise:x.pricePaise})),source:'Firestore'});localStorage.setItem(ORDERS_KEY,JSON.stringify(orders));
  saveCart([]);closeModal();updateCartCount();renderOrders();toast(`Order ${result.orderId} placed successfully.`);
 }catch(err){$('#checkout-error').text(err.message||'Could not place order. Please try again.');button.prop('disabled',false).text('Place order');}
}
$(function(){
 updateCartCount();updateHeader();renderOrders();loadProducts();
 onAuthStateChanged(auth,user=>{
   authUser=user;
   updateHeader();
   renderOrders();
 });
 $('#auth-open').on('click',showLogin);$('#logout').on('click',async()=>{
   try { await signOut(auth); toast('Signed out.'); }
   catch(err) { toast(err.message); }
 });
 $('#cart-open').on('click',renderCart);$('#close').on('click',closeModal);$('#overlay').on('click',e=>{if(e.target.id==='overlay')closeModal()});
 $('#categories').on('click','[data-category]',function(){filter=$(this).data('category');$('#filter').val(filter);renderProducts();document.querySelector('.products-heading').scrollIntoView()});
 $('#filter').on('change',function(){filter=this.value;renderProducts()});$('#search').on('input',function(){query=this.value.toLowerCase().trim();renderProducts()});$('#sort').on('change',function(){sort=this.value;renderProducts()});
 $('#products').on('click','[data-add]',function(){addToCart($(this).data('add'))});
 $('#modal-body').on('click','#show-signup',showSignup).on('click','#show-login',showLogin);
 $('#modal-body').on('submit','#signup-form',async function(e){
   e.preventDefault();
   const name=$('#new-name').val().trim();
   const email=$('#new-email').val().trim().toLowerCase();
   const pw=$('#new-password').val();
   if(pw!==$('#confirm-password').val()) return $('#auth-error').text('Passwords do not match.');
   const button=$(this).find('button[type="submit"],button').first();
   button.prop('disabled',true).text('Creating account...');
   try {
     const credential=await createUserWithEmailAndPassword(auth,email,pw);
     await updateProfile(credential.user,{displayName:name});
     authUser=credential.user;
     closeModal(); updateHeader(); renderOrders(); toast('Account created successfully.');
   } catch(err) {
     $('#auth-error').text(err.code==='auth/email-already-in-use'?'This email is already registered.':err.code==='auth/weak-password'?'Password must be at least 6 characters.':err.message);
     button.prop('disabled',false).text('Create account');
   }
 });
 $('#modal-body').on('submit','#login-form',async function(e){
   e.preventDefault();
   const email=$('#login-email').val().trim().toLowerCase();
   const pw=$('#login-password').val();
   const button=$(this).find('button[type="submit"],button').first();
   button.prop('disabled',true).text('Signing in...');
   try {
     const credential=await signInWithEmailAndPassword(auth,email,pw);
     authUser=credential.user;
     closeModal(); updateHeader(); renderOrders(); toast('Welcome back.');
   } catch(err) {
     $('#auth-error').text(err.code==='auth/invalid-credential'?'Incorrect email or password.':err.code==='auth/user-not-found'?'Account not found. Please create an account first.':err.message);
     button.prop('disabled',false).text('Sign in');
   }
 });
 $('#modal-body').on('click','[data-cart]',function(){updateCart($(this).data('cart'),$(this).data('id'))});
 $('#modal-body').on('click','#checkout',checkout).on('submit','#checkout-form',function(e){e.preventDefault();placeOrder()});
});
