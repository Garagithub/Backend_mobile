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
  //  const datos = await db.query('select * from table')


})

server.get('/', (req, res)=>{
    res.send('hola desde el servidor')

})

// 3 formas de recibir algo: req.body (cuando le manda el json al front), req.params, req.query

// se puede mandar un status haciendo res.sendStatus(500)


/* {

    fila integer,
    columna integer

} */
server.post('/cinema-room', async (req, res) => {

   if (!req.body.id_sucursal || typeof(req.body.id_sucursal) != 'number'||!req.body.fila || typeof(req.body.fila) != 'number' || !req.body.columna || typeof(req.body.columna) != 'number') {

    res.sendStatus(400);
    return;

   }


   const sala = await db.query('insert into sala (id_sucursal) values($1) returning *', [req.body.id_sucursal])

   const multiplicacion = fila * columna

   for (let i = 0; i < multiplicacion; i++) {
    const asientos = await db.query('insert into asientos (nro_asiento, id_sala, reservada) values($1, $2, $3)',
     [i+1, sala.rows[0].id, false])
   }




   res.sendStatus(200)


})


server.listen(port,()=> console.log('El servidor está escuchando en localhost: '+ port));



