const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const userRoutes = require('./routes/user.js');
const adminRoutes=require('./routes/admin.js')




// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.use('/api/user', userRoutes);
app.use('/api/admin',adminRoutes);


// Start server
const port = 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});