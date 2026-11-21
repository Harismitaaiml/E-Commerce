const r=require("express").Router(),c=require("../controllers/customerController");r.post("/",c.create);r.get("/:customerId",c.get);module.exports=r;
