const express = require("express");
const pg = require("pg")
const bcrypt= require("bcrypt");
const server = express();
const jwt= require("jsonwebtoken");
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
const {id_sucursal, fila, columna}= req.body;
   if (!id_sucursal || typeof(id_sucursal) != 'number'||!fila || typeof(fila) != 'number' || !columna || typeof(columna) != 'number') {

    res.sendStatus(400);
    return;

   }


   const sala = await db.query('insert into sala (id_sucursal) values($1) returning *', [id_sucursal])

   const multiplicacion = fila * columna

   for (let i = 0; i < multiplicacion; i++) {
    const asientos = await db.query('insert into asientos (nro_asiento, id_sala, reservada) values($1, $2, $3)',
     [i+1, sala.rows[0].id, false])
   }




   res.sendStatus(200)


})
server.post("/api/users",async (req,res)=>{
  const { password, email, company,imagen } = req.body;
  
  if (!imagen || typeof(imagen)!=string || !password || typeof(password)!=string ||!email ||typeof(email)!=string ||!email.includes("@") || !company || typeof(company)!= string ){
    res.sendStatus(400);
    return;
  }
  const userexiste= await db.query("select email from socio where email=$1", [email])
  if (userexiste.rows.length>=1 ){
  
    res.status(400).send("There is already an email asociate to this account");

    return;
  }
  const salt=await bcrypt.genSalt(10)
  const hashed_password=await bcrypt.hash(password,salt)
  const register_empresa=await db.query("insert into empresa (nombre,imagen) values ($1,$2) returning *",[company,imagen])
  const register_socio=await db.query("insert into socios (email,password, id_empresa) values($1,$2,$3) ",[email,hashed_password,register_empresa.rows[0].id])
  const token= 
  
  res.status(201).json({token:null})
})

server.listen(port,()=> console.log('El servidor está escuchando en localhost: '+ port));



