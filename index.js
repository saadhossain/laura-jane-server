const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const { MongoClient, ObjectId } = require('mongodb')
//Middle Wares
const cors = require('cors')
app.use(cors())
app.use(express.json())

//setup MongoDB
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

//DataBase Connection and Apis
const dbConnect = () => {
    const services = client.db("laura-jane").collection("services");

    //Get Services from MongoDB
    app.get('/services', async(req, res)=> {
        const query = {};
        const cursor = services.find(query)
        const result = await cursor.limit(3).toArray();
        res.send(result)
    })
    //Get Single Service Data from the database
    app.get('/services/:id', async(req, res)=> {
        const id = req.params.id;
        const query = {_id: ObjectId(id)}
        const cursor = services.find(query);
        const result = await cursor.toArray()
        res.send(result);
    })

}
dbConnect()

//Server Default/root route
app.get('/', (req, res)=> {
    res.send('Laura Jane Server is Running...')
})

//Add a listener
app.listen(port, ()=> {
    console.log('Server Running On port: ',port);
})