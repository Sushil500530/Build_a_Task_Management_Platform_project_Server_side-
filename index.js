const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const app = express();
const port = process.env.PORT || 5000;

// middleware 
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ruakr2a.mongodb.net/?retryWrites=true&w=majority`;
  
  // Create a MongoClient with a MongoClientOptions object to set the Stable API version
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const userCollection = client.db('tastManagement').collection('users')



    app.post('/jwt', (req, res) => {
      try {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, { expiresIn: '150d' });
        // console.log('token is ------>', token);
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production' ? true : false,
          sameSite: process.env.NODE_ENV === 'production' ? "none" : "strict"
        }).send({ success: true, token })
      }
      catch (error) {
        console.log(error);
      }
    })

      // verify token 
      const verifyToken = async (req, res, next) => {
        try {
          const token = req.cookies?.token;
          // console.log('token is found?-------->', token);
          if (!token) {
            return res.status(401).send({ message: 'not authorized access' })
          }
          jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (error, decode) => {
            if (error) {
              return res.status(401).send({ message: 'unAuthorized access why' })
            }
            req.user = decode;
            next();
          })
        }
        catch (error) {
          res.status(401).send({ success: false, message: error.message })
        }
      }
  
      // post method start 
      app.post('/logout', async (req, res) => {
        try {
          const user = req.body;
          // console.log('log out user is in---->', user);
          res.clearCookie('token', { maxAge: 0, sameSite: 'none', secure: true }).send({ success: true })
        }
        catch (error) {
          console.log(error);
        }
      })
  

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send("Server is Running Now.....")
  })
  app.listen(port, () => {
    console.log(`Server Running on port: ${port}`);
  })