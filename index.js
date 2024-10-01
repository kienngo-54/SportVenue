require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const userRouter = require('./routes/user.js');
const adminRouter = require('./routes/admin.js');
const { connectToDB, closeDBConnection } = require('./utils/db.js');
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
// Kết nối MongoDB khi server khởi động
(async () => {
  try {
    await connectToDB();  // Kết nối MongoDB
    const PORT = process.env.PORT || 10000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });

    server.keepAliveTimeout = 120000;  // 120 seconds
    server.headersTimeout = 120000;

    // Đóng kết nối MongoDB khi server tắt
    process.on('SIGINT', async () => {
      await closeDBConnection();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
})();
