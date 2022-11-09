const express = require('express')
const app = express()
const port = process.env.PORT || 5000;
//Require dotenv to connect secure info(user, pass, secret key)
require('dotenv').config()
//Require JWT to genaratinga and verifiying access token
const jwt = require('jsonwebtoken');
//Require mongoclient and other essentials
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb')
//Middle Wares
const cors = require('cors')
app.use(cors())
app.use(express.json())

//Setup MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@firstmongodb.yjij5fj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//Genarate Access token for the user
app.post('/getaccesstoken', async (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
    res.send({ token })
})

//Genarate a verification function for JWT
const verifiyToken = (req, res, next) => {
    const authToken = req.headers.authorization;
    if (!authToken) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authToken.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next()
    })

}

//DataBase Connection and Apis
const dbConnect = () => {
    const services = client.db("lauraJane").collection("services");

    //Get Limited Services from MongoDB
    app.get('/services/limit', async (req, res) => {
        const query = {};
        //Services Sorting on desending order, latest added item will show first
        const cursor = services.find(query).sort({addedOn: -1})
        const result = await cursor.limit(3).toArray();
        res.send(result)
    })
    //API for Adding new Service by user
    app.post('/services/add', async (req, res) => {
        const newService = req.body;
        const result = await services.insertOne(newService);
        res.send(result)

    })

    //Get All Services from the Database and implement Pagination
    app.get('/services', async (req, res) => {
        let query = {};
        const servicePerPage = parseInt(req.query.servicePerPage);
        const currentPage = parseInt(req.query.currentPage);
        const cursor = services.find(query)
        const result = await cursor.skip(currentPage * servicePerPage).limit(servicePerPage).toArray();
        const count = await services.estimatedDocumentCount()
        res.send({count, result})
    })
    //Get All Services added by a specific user
    app.get('/services/user', verifiyToken, async (req, res) => {
        let query = {};
        const decoded = req.decoded;
        const email = req.query.email;
        if (decoded.email !== email) {
            return res.status(403).send({ message: 'Forbidden! Data is unacceessible for you' })
        }
        if (email) {
            query = {
                addedBy: email
            }
        }
        const cursor = services.find(query).sort({addedOn: -1})
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

    //Update Service
    app.put('/services/edit/:id', async(req, res)=> {
        const id = req.params.id;
        const service = req.body;
        const filter = {_id: ObjectId(id)}
        const options = {upsert: true}
        const updatedService = {
            $set : {
                name: service.name,
                description: service.description,
                serviceCost: service.serviceCost,
                completedCase: service.completedCase,
                rating:{
                    total:service.rating.total,
                    rate: service.rating.rate
                },
                img: service.img,
                addedBy: service.addedBy
            }
        }
        const result = await services.updateOne(filter, updatedService, options);
        res.send(result)
    })
    //Delete a Service added by User
    app.delete('/services/delete/:id', async(req, res)=> {
        const id = req.params.id;
        const query = {_id: ObjectId(id)}
        const result = await services.deleteOne(query)
        res.send(result)
    })

    //All Review Collections
    const allReviews = client.db("lauraJane").collection("reviews");

    // Post New Review and store review to the Database
    app.post('/reviews/write', async (req, res) => {
        const newReview = req.body;
        const result = await allReviews.insertOne(newReview);
        res.send(result)
    })
    //Get All Reviews for a single Service
    app.get('/reviews', async (req, res) => {
        const requestedId = req.query.serviceId;
        let query = {}
        if (requestedId) {
            query = {
                serviceId: requestedId,
                // email: email
            }
        }
        //Latest added review will show first
        const cursor = allReviews.find(query).sort({addedOn: -1})
        const result = await cursor.toArray()
        res.send(result)
    })
    //Get all the Reviews added by a Specific user
    app.get('/reviews', verifiyToken, async (req, res) => {
        let query = {};
        const decoded = req.decoded;
        const email = req.query.email;
        if (decoded.email !== email) {
            return res.status(403).send({ message: 'Forbidden! Data is unacceessible for you' })
        }
        if (email) {
            query = {
                email: email
            }
        }
        const cursor = allReviews.find(query)
        const result = await cursor.toArray()
        res.send(result)
    })

    //Get a Single Review
    app.get('/reviews/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) }
        const cursor = allReviews.find(query)
        const review = await cursor.toArray()
        res.send(review)
    })

    //Update Review
    app.put('/reviews/update/:id', async (req, res) => {
        const id = req.params.id
        const review = req.body;
        const options = { upsert: true }
        const filter = { _id: ObjectId(id) }
        const updatedReview = {
            $set: {
                serviceId : review.serviceId,
                email : review.email,
                reviewerName : review.reviewerName,
                rating : review.rating,
                reviewerImg : review.reviewerImg,
                description : review.description,
            }
        }
        const result = await allReviews.updateOne(filter, updatedReview, options)
        res.send(result)
    })
    //Delete a Specific Review
    app.delete('/reviews/delete/:id', async(req, res)=> {
        const id = req.params.id;
        const query = {_id: ObjectId(id)}
        const result = await allReviews.deleteOne(query)
        res.send(result)
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