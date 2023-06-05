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
  try{
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
  const register_socio=await db.query("insert into socios (email,password, id_empresa) values($1,$2,$3) returning *",[email,hashed_password,register_empresa.rows[0].id])
  const payload = {
    user: {
      id: register_socio.rows[0].id
    }}
  const token= jwt.sign (payload,"password123",{expiresIn:"48hr"},)

  res.status(201).json({token:token})
}
catch(er){res.sendStatus(500)}
})

server.post("/api/cinema/{id_cinema}/branches", async (req, res) => {
  try {
  const { id, nombre, pais, provincia, localidad, calle, altura, precio, cerrado } = req.body;
  
  if (!id || typeof(id) !== 'number' || !nombre || typeof(nombre) !== 'string' || !pais || typeof(pais) !== 'string' ||
      !provincia || typeof(provincia) !== 'string' || !localidad || typeof(localidad) !== 'string' ||
      !calle || typeof(calle) !== 'string' || !altura || typeof(altura) !== 'number' ||
      !precio || typeof(precio) !== 'number' || typeof(cerrado) !== 'boolean') {
    res.sendStatus(400);
    return;
  }
  const sucursalexiste= await db.query("select nombre from sucursal where nombre=$1", [nombre])
  if (sucursalexiste.rows.length>=1 ){
  
    res.status(400).send("There is already a branch with this name");

    return;
  }
  
    const sucursal = await db.query("INSERT INTO sucursal (id, nombre, pais, provincia, localidad, calle, altura, precio, cerrado) " +
                                    "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
                                    [id, nombre, pais, provincia, localidad, calle, altura, precio, cerrado]);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.delete("/api/cinema/{id_cinema}/branches/{id_branch}", async (req,res)=>{
  const id_sucursal = req.params.id_sucursal;

  try {
    //revisar este try esta raro
   const existesucursal= await db.query("select nombre from sucursales where id=$1", [id_sucursal])
   if (existesucursal.rows.length===0 ){
   
     res.status(400).send("There is no branch whit this id");
 
     return;
   }
    await db.query('DELETE FROM sucursales WHERE id = $1', [id_sucursal]);

    res.sendStatus(200);
  } catch (error) {
    console.error('Error al eliminar la sucursal:', error);
    res.sendStatus(500);
  }
});


server.post("/api/auths", async (req,res)=>{

  try {
    const { email, password } = req.body;

    const user = await pool.query(`
        SELECT *
        FROM socios
        WHERE email = $1;
    `, [email]);

    if (user.rows.length === 0) {
        return res.status(401).json('Password or email is incorrect');

    } 

    const validPassword = await bcrypt.compare(password, user.rows[0].pass);
    if (!validPassword){
        return res.status(401).json('Password or email is incorrect');

    } 

    const token = jwtGenerator(user.rows[0].id);
    res.json({ token });

} catch(error) {
    res.status(500).send();
}

});


server.listen(port,()=> console.log('El servidor está escuchando en localhost: '+ port));



