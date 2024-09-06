const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user")
const Company = require("./models/company")
const Campground = require("./models/campground")
const axios = require("axios")
require('dotenv').config()

const userRoutes = require("./routes/users")
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const companyRoutes = require('./routes/companies');
const { isUserLoggedInPay } = require('./middleware');
const dbUrl = process.env.DB_URL;
const localdburl = 'mongodb://localhost:27017/yelp-camp';


mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

const config = {
    headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        "Authorization" : process.env.paymentAPI
    }
};

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(__dirname + '/public'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: process.env.secret
    }
});

const sessionConfigUser = {
    store,
    secret: process.env.secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfigUser))
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use('user-local', new LocalStrategy(User.authenticate()));
passport.use('company-local', new LocalStrategy(Company.authenticate()));

passport.serializeUser(function(user, done) { 
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    if(user!=null)
    done(null,user);
});

passport.serializeUser(function(company, done) { 
    done(null, company);
});

passport.deserializeUser(function(company, done) {
    if(company!=null)
    done(null,company);
});

app.use((req, res, next) => {
    res.locals.currentCompany = req.company
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use("/", userRoutes)
app.use("/company", companyRoutes)
app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)

app.get('/', (req, res) => {
    res.render('other/home')
});

app.post("/services/:id/pay",isUserLoggedInPay, async (req, res) => {

    const {id} = req.params
    const service = await Campground.findById(id)

    axios.post('https://secure-egypt.paytabs.com/payment/request', {

        "profile_id": 139370,
        "tran_type": "sale",
        "tran_class": "ecom" ,
        "cart_id": process.env.cartID,
        "cart_description": service.title,
        "cart_currency": "EGP",
        "cart_amount": service.price,

    }, config).then((response) => {
        res.redirect(response.data.redirect_url)
    }).catch((error) => {
        console.log(error)
    })

})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

app.listen(3000, () => {
    console.log('Serving on port 3000')
})


