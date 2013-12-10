
exports.authorize = function(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        var errorDescription = 'Access denied';
        req.session.error = errorDescription;
        res.statusCode = 403;
        return res.send(JSON.stringify({
            code: res.statusCode,
            message: 'Not Authorized',
            description: errorDescription }));
    }
}