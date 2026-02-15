const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        console.warn("No token provided");
        return res.status(401).send("Access denied. No token provided.");
    }

    jwt.verify(token, process.env.JWT_SECRET || "supersecret", (err, decoded) => {
        if (err) {
            console.warn("Invalid token");
            return res.status(403).send("Invalid token");
        }

        req.user = decoded;
        console.log("Token verified for user:", decoded.userId);
        next();
    });
}

function requireJwtAdmin(req, res, next) {
    console.log("Token decoded user:", req.user);
    if (req.user && req.user.admin === true) {
        return next();
    }
    return res.status(403).send("Admin access required.");
}

module.exports = {
    verifyToken,
    requireJwtAdmin
};
