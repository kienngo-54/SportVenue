const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const userRouter = require('./routes/user.js');
const adminRouter=require('./routes/admin.js')




// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.use('/api/user', userRouter);
app.use('/api/admin',adminRouter);


// Start server
const port = 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});