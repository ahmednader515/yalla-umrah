const express = require("express")
const router = express.Router()
const Company = require("../models/company")
const catchAsync = require("../utils/catchAsync")
const passport = require("passport")
const { storeReturnTo } = require('../middleware');
const { isCompanyLoggedIn } = require("../middleware")
const Campground = require('../models/campground');

router.get('/register', (req, res) => {
    res.render('companies/register')
})

router.get('/dashboard', isCompanyLoggedIn, catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('other/dashboard', { campgrounds })
}));

router.post("/register", catchAsync(async (req, res) => {
    try {
    const {email, username, password} = req.body
    const company = new Company({email, username})
    const registeredCompany = await Company.register(company, password)
    req.login(registeredCompany, err => {
        if(err) return next(err)
        req.flash('success', 'مرحبا بك')
        res.redirect("/company/dashboard")
    })
    } catch(error) {
        req.flash('error', error.message)
        res.redirect('register')
    }
}))

router.get("/new", isCompanyLoggedIn, (req, res) => {
    res.render("companies/new")
})

router.get("/login", (req, res) => {
    res.render("companies/login")
})

router.post("/login", storeReturnTo, passport.authenticate('company-local', {failureFlash: true, failureRedirect: '/company/login'}), (req, res) => {
    req.flash("success", "اهلا بعودتك")
    const redirectUrl = res.locals.returnTo || '/company/dashboard'
    delete res.locals.returnTo
    res.redirect(redirectUrl)
})

router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'نراك لاحكنا');
        res.redirect('/campgrounds');
    });
}); 

module.exports = router