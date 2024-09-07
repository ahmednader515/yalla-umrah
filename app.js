require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const axios = require('axios');
const ExpressError = require('./utils/ExpressError');
const { isUserLoggedInPay } = require('./middleware');
const User = require('./models/user');
const Company = require('./models/company');
const Campground = require('./models/campground');
const userRoutes = require('./routes/users');
const companyRoutes = require('./routes/companies');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');

// Database Connection
const dbUrl = process.env.DB_URL;
const dbUrlLocal = 'mongodb://localhost:27017/yelp-camp';
mongoose.connect(dbUrlLocal, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => console.log('Database connected'));

// App initialization
const app = express();
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session Configuration
const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: process.env.SECRET,
    },
});

const sessionConfig = {
    store,
    secret: process.env.SECRET || 'secret', // Fallback secret if not in env
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
};

app.use(session(sessionConfig));
app.use(flash());

// Passport Configuration
app.use(passport.initialize());
app.use(passport.session());

passport.use('user-local', new LocalStrategy(User.authenticate()));
passport.use('company-local', new LocalStrategy(Company.authenticate()));

// Universal serializeUser and deserializeUser (User or Company)
passport.serializeUser((entity, done) => {
    done(null, { id: entity.id, type: entity instanceof User ? 'User' : 'Company' });
});

passport.deserializeUser(async ({ id, type }, done) => {
    const Model = type === 'User' ? User : Company;
    try {
        const entity = await Model.findById(id);
        done(null, entity);
    } catch (err) {
        done(err);
    }
});

// Global middleware to set locals
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Routes
app.use('/', userRoutes);
app.use('/company', companyRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);

// Home Route
app.get('/', (req, res) => res.render('other/home'));

// Payment Route
app.post('/services/:id/pay', isUserLoggedInPay, async (req, res) => {
    const { id } = req.params;
    const service = await Campground.findById(id);

    const config = {
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            "Authorization" : process.env.paymentAPI,
        },
    };

    axios
        .post(
            'https://secure-egypt.paytabs.com/payment/request',
            {
                profile_id: 139370,
                tran_type: 'sale',
                tran_class: 'ecom',
                cart_id: process.env.CART_ID,
                cart_description: service.title,
                cart_currency: 'EGP',
                cart_amount: service.price,
            },
            config
        )
        .then((response) => {
            res.redirect(response.data.redirect_url);
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('فشل الدفع');
        });
});

// 404 Handler
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

// Error Handler
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!';
    res.status(statusCode).render('error', { err });
});

// Start the server
app.listen(3000, () => {
    console.log('Serving on port 3000');
});
