const express = require("express");
const pg = require("pg")

const server = express();
const port = process.env.PORT | 4000

server.use(express.json());

const db = new pg.Pool({
    host: "containers-us-west-23.railway.app",
    port: 6437,
    password: "pOTCjGkYnK0ixuX7Lc77",
    database: "railway",
    user: "postgres"

})

server.get('/db', async (req, res)=>{
    const datos = await db.query('select * from table')


})

server.get('/', (req, res)=>{
    res.send('hola desde el servidor')

})


server.listen(port,()=> console.log('El servidor está escuchando en localhost: '+ port));



