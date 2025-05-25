const express = require('express');
const app = express();
const connectDB = require('./config/db')
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser')
const authRoutes = require('./routes/authRoutes/index')
const adminRoute = require('./routes/admin/routes')
const shopProductRouter = require('./routes/shop/shop-routes')
const fileUpload = require('express-fileupload')

connectDB();
app.use(cors({
  origin: 'http://localhost:5173', // frontend origin
  credentials: true               // allow cookies / auth headers
}));
const port = process.env.port;


app.use(express.json());
app.use(cookieParser())

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));


//routes
app.use('/api/auth',authRoutes)
app.use('/api/admin',adminRoute)
app.use('/api/shop/products',shopProductRouter)



app.listen(port,()=>{
    console.log(`running at ${port}`);
})