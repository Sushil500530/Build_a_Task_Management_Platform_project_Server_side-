const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const app = express();
const port = process.env.PORT || 5000;

// middleware 
app.use(cors({
  origin: [
    "https://task_management.surge.sh",
    "task_management.surge.sh",
    "https://sushil-portfollio.surge.sh"
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
    const taskDataCollection = client.db('tastManagement').collection('taskDatas')
    const favoriteCollection = client.db('tastManagement').collection('favorites')
    const dataCollection = client.db('tastManagement').collection('datas')



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


    //  front-end api 
    app.get('/users', async (req, res) => {
      try {
        const result = await userCollection.find().toArray();
        res.send(result)
      }
      catch (error) {
        console.log(error);
      }
    })
    app.get('/datas', async (req, res) => {
      try {
        const result = await dataCollection.find().toArray();
        res.send(result)
      }
      catch (error) {
        console.log(error);
      }
    })

    app.get('/data/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await dataCollection.findOne(query);
        res.send(result)
      }
      catch (error) {
        console.log(error);
      }
    })


    app.get('/task-all', async (req, res) => {
      try {
        const result = await taskDataCollection.find().toArray();
        res.send(result)
      }
      catch (error) {
        console.log(error);
      }
    })

    app.get('/taskDatas', async (req, res) => {
      try {
        const filter = req.query;
       const query = {
            taskName: {
                $regex: filter.search,
                $options: 'i'
            }
        };
        const cursor = taskDataCollection.find(query);
        const result = await cursor.toArray();
        res.send(result)
      }
      catch (error) {
        console.log(error);
      }
    })
    app.get('/task-all/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await taskDataCollection.findOne(query);
        res.send(result)
      }
      catch (error) {
        console.log(error);
      }
    })
    // all post method 
    app.post('/user', async (req, res) => {
      try {
        const userData = req.body;
        const query = { email: userData?.email };
        const existedUser = await userCollection.findOne(query);
        if (existedUser) {
          return res.send({ message: "user already existed in", insertedId: null })
        }
        const result = await userCollection.insertOne(userData);
        res.send(result)
      }
      catch (error) {
        console.log(error);
      }
    })
    app.post('/task-products', async (req, res) => {
      try {
        const product = req.body;
        console.log(product);
        const result = await taskDataCollection.insertOne(product);
        res.send(result)
      }
      catch (error) {
        console.log(error);
      }
    })
    app.post('/favorite', async (req, res) => {
      try {
        const product = req.body;
        console.log(product);
        const result = await favoriteCollection.insertOne(product);
        res.send(result)
      }
      catch (error) {
        console.log(error);
      }
    })
    app.get('/favorite', async (req, res) => {
      try {
        const result = await favoriteCollection.find().toArray();
        res.send(result)
      }
      catch (error) {
        console.log(error);
      }
    })
    app.get('/favorites/:email',verifyToken, async (req, res) => {
      try { 
        const email = req.params.email;
        const query = {fa_Owner: email }
        if (req?.params?.email !== req?.user?.email) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        const result = await favoriteCollection.find(query).toArray();
        res.send(result);
      }
      catch (error) {
        console.log(error);
      }
    })
    // app.get('/taskData', async (req, res) => {
    //   try { 
    //     const result = await taskDataCollection.find().toArray();
    //     res.send(result);
    //   }
    //   catch (error) {
    //     console.log(error);
    //   }
    // })
    app.get('/taskData/:email', verifyToken,  async (req, res) => {
      try { 
        const email = req.params.email;
        const query = {taskOwnerEmail: email }
        if (req?.params?.email !== req?.user?.email) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        const result = await taskDataCollection.find(query).toArray();
        res.send(result);
      }
      catch (error) {
        console.log(error);
      }
    })

    app.delete('/favorite/:id', verifyToken, async (req, res) => {
      try {
          const id = req.params.id;
          const query = { _id: new ObjectId(id) };
          const result = await favoriteCollection.deleteOne(query);
          res.send(result);
      }
      catch (err) {
          console.log(err);
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