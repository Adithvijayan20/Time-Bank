module.exports = {
    ensureAuthenticated: (req, res, next) => {
        if (req.session && req.session.loggedIn) {
            return next();
        } else {
            res.redirect('/login');
        }
    },

    checkRole: (role) => {
        return (req, res, next) => {
            if (req.session.user && req.session.user.role === role) {
                next();
            } else {
                res.status(403).send('Access Denied');
            }
        };
    }
}
