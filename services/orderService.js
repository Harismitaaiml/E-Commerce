const {db,admin}=require("../config/firebase");
function need(v,k){if(typeof v!=="string"||!v.trim()){const e=new Error(k+" is required");e.status=400;e.publicMessage=e.message;throw e;}return v.trim();}
async function createOrder(b, uid){
 const c=b.customer||{},a=b.address||{},name=need(c.name,"customer.name"),email=need(c.email,"customer.email").toLowerCase(),phone=need(c.phone,"customer.phone");
 const line1=need(a.line1,"address.line1"),city=need(a.city,"address.city"),state=need(a.state,"address.state"),postalCode=need(a.postalCode,"address.postalCode");
 if(!Array.isArray(b.items)||!b.items.length||b.items.length>50) {const e=new Error("items must contain 1–50 products");e.status=400;e.publicMessage=e.message;throw e;}
 const quantities=new Map();for(const i of b.items){if(!i||typeof i.productId!=="string"||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>20){const e=new Error("Each item needs productId and quantity 1–20");e.status=400;e.publicMessage=e.message;throw e;}quantities.set(i.productId,(quantities.get(i.productId)||0)+i.quantity);}
 const ref=db.collection("orders").doc();
 const result=await db.runTransaction(async tx=>{
  const ids=[...quantities.keys()],refs=ids.map(id=>db.collection("products").doc(id)),docs=await Promise.all(refs.map(r=>tx.get(r)));
  let totalPaise=0;const items=[];
  docs.forEach((d,i)=>{if(!d.exists||d.data().active===false){const e=new Error("Product unavailable: "+d.id);e.status=400;e.publicMessage=e.message;throw e;}
   const p=d.data(),qty=quantities.get(ids[i]),stock=Number(p.qty),price=Number(p.pricePaise);
   if(!Number.isInteger(stock)||stock<qty){const e=new Error("Insufficient stock for "+d.id);e.status=409;e.publicMessage=e.message;throw e;}
   if(!Number.isInteger(price)||price<0)throw new Error("Invalid price for "+d.id);
   totalPaise+=price*qty;items.push({productId:d.id,title:String(p.title||d.id),unitPricePaise:price,quantity:qty});
  });
  docs.forEach((d,i)=>tx.update(d.ref,{qty:Number(d.data().qty)-quantities.get(ids[i])}));
  tx.set(ref,{customer:{uid,name,email,phone},address:{line1,line2:String(a.line2||"").trim(),city,state,postalCode,country:String(a.country||"India")},items,totalPaise,currency:"INR",paymentMethod:"COD",status:"PLACED",createdAt:admin.firestore.FieldValue.serverTimestamp()});
  return {orderId:ref.id,totalPaise,currency:"INR",status:"PLACED",items};
 });
 return {message:"Order placed successfully",...result};
}
module.exports={createOrder};
