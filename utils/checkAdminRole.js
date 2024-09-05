const checkAdminRole = (req, res, next) => {
  try {
    // Giả định rằng thông tin người dùng đã được xác thực và lưu trong req.user
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: No user information found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    // Nếu là admin thì tiếp tục xử lý request
    next();
  } catch (error) {
    console.error('Error checking admin role:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = checkAdminRole;
