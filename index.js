const express = require('express');
const cors = require('cors')
const app = express();
const bodyParser = require('body-parser');
const userRouter = require('./routes/user.js');
const adminRouter=require('./routes/admin.js')




// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.use('/api/user', userRouter);
app.use('/api/admin',adminRouter);


// Start server
const PORT = process.env.PORT || 10000;
const server =app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
server.keepAliveTimeout = 120000;  // 120 seconds
server.headersTimeout = 120000;    // 120 seconds