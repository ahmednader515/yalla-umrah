module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
}

module.exports.isUserLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'يجب عليك تسجيل الدخول اولا');
        return res.redirect('/login');
    }
    next();
}

module.exports.isUserLoggedInPay = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = '/campgrounds';
        req.flash('error', 'يجب عليك تسجيل الدخول اولا للدفع');
        return res.redirect('/login');
    }
    next();
}

module.exports.isCompanyLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'يجب عليك تسجيل الدخول كشركة اولا');
        return res.redirect('/company/login');
    }
    next();
}