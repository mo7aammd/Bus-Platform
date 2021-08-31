const express = require("express");
const router = express.Router();
const passport = require("passport");
const Company = require("../models/Company");
const { Customer } = require("../models/Customer");
const Account = require("../models/Account");
const { authAdmin } = require("../config/auth");
const validObjectId = require("../models/validateObjectId");

//GET Index
router.get("/", authAdmin, async (req, res) => {
  const accounts = await Account.find()
    .select("inAccount -_id")
  const totalPayments = accounts.reduce((a, b) => (a += parseFloat(b.inAccount)), 0);
  const companiesCount = await Company.countDocuments();
  const customersCount = await Customer.countDocuments();

  res.render("admin/index", { 
    layout: "adminLayout",
    totalPayments,
    companiesCount,
    customersCount
  });
})
//Login Page
router.get("/login", (req, res) => {
  res.render("admin/login", { layout: false });
});

//Login Handler
router.post("/login", (req, res, next) => {
  passport.authenticate("local.admin", {
    successRedirect: "/admin",
    failureRedirect: "/admin/login",
    failureFlash: true,
  })(req, res, next);
});

//Logout Handler
router.get("/logout", (req, res) => {
  req.logOut();
  req.flash("success_msg", "You are Logout");
  res.redirect("/admin/login");
});

//Get Accounts
router.get("/account", authAdmin, async(req, res) => {
  const { p = 1, limit = 10 } = req.query;

  const accounts = await Account.find()
    .populate('owner', 'companyName imageUrl email -_id')
    .limit(limit * 1)
    .skip((p - 1) * limit)
    .lean()
    .exec();
  
  const count = await Account.find().countDocuments();

  res.render("admin/accounts", {
    layout: "adminLayout",
    accounts,
    pagination: {
      page: p,
      pageCount: count === 0 ? 1 : Math.ceil(count / limit),
    },
  })
})

//Get Account
router.get("/account/:id", authAdmin, async(req, res) => {
  const accountId = req.params.id;
  if(!validObjectId(accountId)) return res.render("error",{
    layout: false,
    msg: 'Invalid Account ID!'
  });

  const account = await Account.findById(accountId)
    .populate('owner', 'companyName imageUrl email -_id')
    .lean();
  
  if(!account) return res.render("error",{
    layout: false,
    msg: 'Account Not found!'
  });

  res.render("admin/account", {
    layout: "adminLayout",
    account
  });
});

//Put Account
router.put("/account", authAdmin, async(req, res) => {
  const { accountId, withdraw } = req.body;
  if(!validObjectId(accountId)) return res.render("error",{
    layout: false,
    msg: 'Invalid Account ID!'
  });

  var account = await Account.findById(accountId)
    .populate('owner', 'companyName imageUrl email -_id')
    .lean();
  
  if(!account) return res.render("error",{
    layout: false,
    msg: 'Account Not found!'
  });

  if(account.inAccount < withdraw) return res.render("admin/account", {
    layout: "adminLayout",
    account,
    withdraw,
    errors: [{ msg: 'Account contains less than profid withdraw'}]
  });


  account = await Account.findById(accountId);
  account.inAccount -= withdraw;
  const result = await account.save();
  if(!result) {
    req.flash("error_msg", `Error ocours, please try again`);
    return res.redirect("/admin/account");
  }
  req.flash("success_msg", `Account Withdraw successfully!`);
  res.redirect("/admin/account");

})

//GET Companies
router.get("/company", authAdmin, async (req, res) => {
  const { p = 1, limit = 10 } = req.query;

  const companies = await Company.find()
    .select("-password")
    .limit(limit * 1)
    .skip((p - 1) * limit)
    .lean()
    .exec();

  const count = await Company.find().countDocuments();
  companies.forEach(
    (it) => (it.createdAt = new Date(it.createdAt).toLocaleString("en-US"))
  );
  res.render("admin/companies", {
    layout: "adminLayout",
    companies,
    pagination: {
      page: p,
      pageCount: count === 0 ? 1 : Math.ceil(count / limit),
    },
  });
});
//GET Company
router.get("/company/:id", authAdmin, async (req, res) => {
  const companyId = req.params.id;
  if(!validObjectId(companyId)) return res.render("error",{
    layout: false,
    msg: 'Invalid Company ID!'
  });;

  const company = await Company.findOne({ _id: companyId})
    .select("-password")
    .lean();
  if(!company) return res.send("Company not found!");

  res.render("admin/company",{
    layout: "adminLayout",
    company
  })
});
//PUT Company
router.put("/company", authAdmin, async (req, res) => {
  const { companyId, companyName, isEnabled} = req.body;
  if(!validObjectId(companyId)) return res.render("error",{
    layout: false,
    msg: 'Invalid Company ID!'
  });;

  const company = await Company.findOne({ _id: companyId})
    .select("-password")

  if(!company) return res.send("Company not found!");

  company.companyName = companyName;
  company.isEnabled = isEnabled? true : false;
  const result = await company.save();
  if(!result){
    req.flash("error_msg", `Error ocours, please try again`);
    return res.redirect("/admin/company");
  }
  req.flash("success_msg", `Company account edited successfully!`);
  res.redirect("/admin/company");

})
//GET Customers
router.get("/customer", authAdmin, async (req, res) => {
  const { p = 1, limit = 10 } = req.query;

  const customers = await Customer.find()
    .select("-password")
    .limit(limit * 1)
    .skip((p - 1) * limit)
    .lean()
    .exec();

  const count = await Customer.find().countDocuments();
  customers.forEach(
    (it) => (it.createdAt = new Date(it.createdAt).toLocaleString("en-US"))
  );
  res.render("admin/customers", {
    layout: "adminLayout",
    customers,
    pagination: {
      page: p,
      pageCount: count === 0 ? 1 : Math.ceil(count / limit),
    },
  });
});
//GET Customer
router.get("/customer/:id", authAdmin, async (req, res) => {
  const customerId = req.params.id;
  if(!validObjectId(customerId)) return res.render("error",{
    layout: false,
    msg: 'Invalid Customer ID!'
  });;

  const customer = await Customer.findOne({ _id: customerId})
    .select("-password")
    .lean();
  if(!customer) return res.send("Customer not found!");

  res.render("admin/customer",{
    layout: "adminLayout",
    customer
  })
})
//PUT Customer
router.put("/customer", authAdmin, async (req, res) => {
  const { customerId, name, isEnabled} = req.body;
  if(!validObjectId(customerId)) return res.render("error",{
    layout: false,
    msg: 'Invalid Customer ID!'
  });;

  const customer = await Customer.findOne({ _id: customerId})
    .select("-password")

  if(!customer) return res.send("Customer not found!");

  customer.name = name;
  customer.isEnabled = isEnabled? true : false;
  const result = await customer.save();
  if(!result){
    req.flash("error_msg", `Error ocours, please try again`);
    return res.redirect("/admin/customer");
  }
  req.flash("success_msg", `Customer account edited successfully!`);
  res.redirect("/admin/customer");

})
module.exports = router;
