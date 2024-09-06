const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const { campgroundSchema } = require('../schemas.js');

const ExpressError = require('../utils/ExpressError');
const Campground = require('../models/campground');
const {isCompanyLoggedIn} = require("../middleware")

const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

const categories = ['حج', 'عمرة']

router.get('/', catchAsync(async (req, res) => {
    const {category} = req.query;
    if(category) {
        const campgrounds = await Campground.find({category})
        res.render('campgrounds/index', {campgrounds, category})
    } else {
        const campgrounds = await Campground.find({})
        res.render('campgrounds/index', {campgrounds, category: 'All'})
    }
}));

router.get('/new', isCompanyLoggedIn, (req, res) => {
    res.render('campgrounds/new', {categories});
})

router.post('/', validateCampground, catchAsync(async (req, res, next) => {
    const campground = new Campground(req.body.campground);
    campground.author = req.user._id
    await campground.save();
    req.flash('success', 'تم اضافة خدمة جديدة');
    res.redirect(`/campgrounds/${campground._id}`)
}))

router.get('/:id', catchAsync(async (req, res,) => {
    const campground = await Campground.findById(req.params.id).populate('reviews').populate('author');
    if (!campground) {
        req.flash('error', 'لا يمكن العثور علي تلك الخدمة');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground, categories });
}));

router.get('/:id/edit', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    if (!campground) {
        req.flash('error', 'لا يمكن العثور علي تلك الخدمة');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground, categories });
}))

router.put('/:id', validateCampground, catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    req.flash('success', 'تم تعديل الخدمة بنجاح');
    res.redirect(`/campgrounds/${campground._id}`)
}));

router.delete('/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'تم حذف الخدمة بنجاح')
    res.redirect('/campgrounds');
}));

module.exports = router;