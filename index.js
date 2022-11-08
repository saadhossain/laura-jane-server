const express = require('express')
const app = express()
const port = process.env.PORT || 5000;
//Require dotenv to connect secure info(user, pass, secret key)
require('dotenv').config()
//Require mongoclient and other essentials
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb')
//Middle Wares
const cors = require('cors')
app.use(cors())
app.use(express.json())

//Setup MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@firstmongodb.yjij5fj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//DataBase Connection and Apis
const dbConnect = () => {
    const services = client.db("lauraJane").collection("services");

    //Get Limited Services from MongoDB
    app.get('/services/limit', async (req, res) => {
        const query = {};
        const cursor = services.find(query)
        const result = await cursor.limit(3).toArray();
        res.send(result)
    })
    //Get All Services from the Database
    app.get('/services', async (req, res) => {
        const query = {};
        const cursor = services.find(query)
        const result = await cursor.toArray();
        res.send(result)
    })
    //Get Single Service Data from the database
    app.get('/services/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) }
        const cursor = services.find(query);
        const result = await cursor.toArray()
        res.send(result);
    })

    const allReviews = client.db("lauraJane").collection("reviews");

    // Post New Review and store review to the Database
    app.post('/reviews/write', async(req, res)=> {
        const newReview = req.body;
        const result = await allReviews.insertOne(newReview);
        res.send(result)
        console.log(result);
    })
    //Get All Reviews for a single Service
    app.get('/reviews/', async (req, res) => {
        const requestedId = req.query.serviceId;
        let query = {}
        if (requestedId) {
            query = {
                serviceId: requestedId
            }
        }
        const cursor = allReviews.find(query)
        const result = await cursor.toArray()
        res.send(result)
        console.log(result);
    })

}
dbConnect()

//Server Default/root route
app.get('/', (req, res) => {
    res.send('Laura Jane Server is Running...')
})

//Add a listener
app.listen(port, () => {
    console.log('Server Running On port: ', port);
})