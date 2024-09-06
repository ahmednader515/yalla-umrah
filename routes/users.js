const express = require("express")
const router = express.Router()
const User = require("../models/user")
const catchAsync = require("../utils/catchAsync")
const passport = require("passport")
const { storeReturnTo } = require('../middleware');

router.get('/register', (req, res) => {
    res.render('users/register')
})

router.get("/choose/login", (req, res) => {
    res.render("other/login")
})

router.get("/choose/register", (req, res) => {
    res.render("other/register")
})

router.post("/register", catchAsync(async (req, res) => {
    try {
    const {email, username, password} = req.body
    const user = new User({email, username})
    const registeredUser = await User.register(user, password)
    req.login(registeredUser, err => {
        if(err) return next(err)
        req.flash('success', 'مرحبا بك')
        res.redirect("/campgrounds")
    })
    } catch(error) {
        req.flash('error', error.message)
        res.redirect('register')
    }
}))

router.get("/login", (req, res) => {
    res.render("users/login")
})

router.post("/login", storeReturnTo, passport.authenticate('user-local', {failureFlash: true, failureRedirect: '/login'}), (req, res) => {
    req.flash("success", "اهلا بعودتك")
    const redirectUrl = res.locals.returnTo || '/campgrounds'
    delete res.locals.returnTo
    res.redirect(redirectUrl)
})

router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'نراك لاحقا');
        res.redirect('/campgrounds');
    });
}); 

module.exports = router