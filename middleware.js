const storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
};

const isAuthenticated = (req, res, next, role, redirectUrl, errorMessage) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl || redirectUrl;
        req.flash('error', errorMessage);
        return res.redirect(redirectUrl);
    }
    next();
};

// Middleware for user authentication
const isUserLoggedIn = (req, res, next) => {
    isAuthenticated(req, res, next, 'user', '/login', 'يجب عليك تسجيل الدخول اولا');
};

// Middleware for user authentication during payment
const isUserLoggedInPay = (req, res, next) => {
    isAuthenticated(req, res, next, 'user', '/login', 'يجب عليك تسجيل الدخول اولا للدفع');
};

// Middleware for company authentication
const isCompanyLoggedIn = (req, res, next) => {
    isAuthenticated(req, res, next, 'company', '/company/login', 'يجب عليك تسجيل الدخول كشركة اولا');
};

module.exports = {
    storeReturnTo,
    isUserLoggedIn,
    isUserLoggedInPay,
    isCompanyLoggedIn
};