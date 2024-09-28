const jwt = require('jsonwebtoken');

async function verifyToken(req, res, next) {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({
      ec: 1,  // Lỗi: Không có token
      data: {},
      msg: 'No token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        ec: 1,  // Lỗi: Token không hợp lệ
        data: {},
        msg: 'Invalid token',
      });
    } else if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        ec: 1,  // Lỗi: Token đã hết hạn
        data: {},
        msg: 'Token has expired',
      });
    } else {
      console.error('Error verifying token:', err);
      return res.status(500).json({
        ec: 2,  // Lỗi server
        data: {},
        msg: 'Internal Server Error',
      });
    }
  }
}


module.exports = verifyToken;