const express = require("express");
const pg = require("pg")
const bcrypt= require("bcrypt");
const server = express();
const jwt= require("jsonwebtoken");
const res = require("express/lib/response");
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

    const token= jwt.sign(payload,"password123",{expiresIn:"48hr"},)
    res.json({token:token});

} catch(error) {
    res.status(500).send();
}

});


server.post('/cinema-room', async (req, res) => {

const { id_sucursal, fila, columna, numero_sala}= req.body;
   if (!id_sucursal || typeof(id_sucursal) != 'number'||!fila || typeof(fila) != 'number' || !columna || typeof(columna) != 'number' || !numero_sala || typeof(numero_sala)!=='number' ) {

    res.sendStatus(400);
    return;

   }


   const sala = await db.query('insert into salas (id_sucursal,numero_sala) values($1,$2) returning *', [id_sucursal,numero_sala])

   const multiplicacion = fila * columna

   for (let i = 0; i < multiplicacion; i++) {
    const asientos = await db.query('insert into asientos (nro_asiento, id_sala, reservada) values($1, $2, $3)',[i+1, sala.rows[0].id, false])
   }




   res.sendStatus(200)


})

server.put('/cinema-room/update', async (req, res) => {
  try {
    const {id_sucursal, fila, columna, numero_sala } = req.body;

    if ( !fila || typeof(fila) !== 'number' || !columna || typeof(columna) !== 'number' ||!id_sucursal || typeof(id_sucursal)!== 'number' || !numero_sala 
        || typeof(numero_sala)!=='number' ) {
      res.sendStatus(400);
      return;
    }

    const sala = await db.query('SELECT id FROM salas WHERE (id_sucursal = $1 and numero_sala=$2) ', [id_sucursal,numero_sala]);

    if (sala.rows.length === 0) {
      res.status(404).send('Cinema room not found');
      return;
    }
    //pensar bien esto con el tema de asientos y demas
    const salas = await db.query('select * from salas where (id_sucursal=$1 and numero_sala=$2 )', [id_sucursal,numero_sala])
    const eliminar_asientos = await db.query('DELETE FROM asientos WHERE id_sala = $1 ', [salas.rows[0].id])
    
   
    const multiplicacion = fila * columna

   for (let i = 0; i < multiplicacion; i++) {
    const asientos = await db.query('insert into asientos (nro_asiento, id_sala, reservada) values($1, $2, $3) returning *',[i+1, sala.rows[0].id, false])
   }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.delete('/cinema-room/delete', async (req, res) => {
  try {
    const { id_sucursal,numero_sala } = req.body;

    if (!id_sucursal || typeof(id_sucursal) !== 'number' || !numero_sala || typeof(numero_sala)!== 'number') {
      res.sendStatus(400);
      return;
    }

    const sala = await db.query('SELECT id FROM salas WHERE (id_sucursal = $1 and numero_sala = $2)', [id_sucursal,numero_sala]);

    if (sala.rows.length === 0) {
      res.status(404).send('Cinema room not found');
      return;
    }
    const eliminar_asientos = await db.query('DELETE FROM asientos WHERE id_sala = $1 ', [sala.rows[0].id])
    const eliminacion = await db.query('delete from salas where id=$1',[sala.rows[0].id] )

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.get('/cinema-room/getall',async (req, res)=>{
  try{
    const salas= await db.query('select * from salas');
    res.status(200).json(salas.rows);
  }
  catch(error){
    console.error(error);
    res.sendStatus(500);
  }
    

});
server.get('/cinema-room/getbyid',async (req, res)=>{
  try{
    const {id_sucursal,numero_sala}= req.body;
    const ids= await db.query('select id from salas where (id_sucursal=$1 and numero_sala=$2)',[id_sucursal,numero_sala])
    const salas= await db.query('select * from salas where id=$1',[ids.rows[0].id]);
    res.status(200).json(salas.rows);
  }
  catch(error){
    console.error(error);
    res.sendStatus(500);
  }
    

});
server.post("/api/users",async (req,res)=>{
  try{
  const { password, email, company,imagen } = req.body;
  
  if (!imagen || typeof(imagen)!= 'string' || !password || typeof(password)!='string' ||!email ||typeof(email)!='string' ||!email.includes("@") || !company || typeof(company)!= 'string' ){
    res.sendStatus(400);
    return;
  }
  const userexiste= await db.query("select email from socios where email=$1", [email])
  if (userexiste.rows.length>=1 ){
  
    res.status(400).send("There is already an email asociate to this account");

    return;
  }
  const salt=await bcrypt.genSalt(10)
  const hashed_password=await bcrypt.hash(password,salt)
  const register_empresa=await db.query("insert into empresas (nombre,imagen) values ($1,$2) returning *",[company,imagen])
  const register_socio=await db.query("insert into socios (email,password, id_empresa) values($1,$2,$3) returning *",[email,hashed_password,register_empresa.rows[0].id])
  const payload = {
    user: {
      id: register_socio.rows[0].id
    }}
  const token= jwt.sign (payload,"password123",{expiresIn:"48hr"},)

  res.status(201).json({token:token})
}
catch(er){res.sendStatus(500)
console.log(er)}

})

server.post("/api/cinema/:id_cinema/branches", async (req, res) => {
  try {
  const { id, nombre, pais, provincia, localidad, calle, altura, precio, cerrado } = req.body;
  
  if (!id || typeof(id) !== 'number' || !nombre || typeof(nombre) !== 'string' || !pais || typeof(pais) !== 'string' ||
      !provincia || typeof(provincia) !== 'string' || !localidad || typeof(localidad) !== 'string' ||
      !calle || typeof(calle) !== 'string' || !altura || typeof(altura) !== 'number' ||
      !precio || typeof(precio) !== 'number' || typeof(cerrado) !== 'boolean'||!cerrado) {
    res.sendStatus(400);
    return;
  }
  const sucursalexiste= await db.query("select nombre from sucursales where nombre=$1", [nombre])
  if (sucursalexiste.rows.length>=1 ){
  
    res.status(400).send("There is already a branch with this name");

    return;
  }
  
  const sucursal = await db.query("INSERT INTO sucursales (id, nombre, pais, provincia, localidad, calle, altura, precio_por_funcion, cerrado_temporalmente) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",[id, nombre, pais, provincia, localidad, calle, altura, precio, cerrado]);
    res.sendStatus(200);
  }
  catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.delete("/api/cinema/branches", async (req,res)=>{
  const {id_sucursal}=req.body;

  try {
    //revisar este try esta raro
   const existesucursal= await db.query("select * from sucursales where id=$1", [id_sucursal])
   // este no funca 
   if (existesucursal.rows.length===0){
   
     res.status(400).send("There is no branch whit this id");
 
     return;
   }
   const eliminar= await db.query('DELETE FROM sucursales WHERE id = $1', [id_sucursal]);

    res.sendStatus(200);
  } catch (error) {
    console.error('Error al eliminar la sucursal:', error);
    res.sendStatus(500);
  }
});

server.put("/api/cinema//branches/update", async (req, res) => {
  try {
   
    const { id, nombre, pais, provincia, localidad, calle, altura, precio_por_funcion, cerrado_temporalmente} = req.body;

    if (!id || typeof(id) !== 'number' || !nombre || typeof(nombre) !== 'string' || !pais || typeof(pais) !== 'string' ||
        !provincia || typeof(provincia) !== 'string' || !localidad || typeof(localidad) !== 'string' ||
        !calle || typeof(calle) !== 'string' || !altura || typeof(altura) !== 'number' ||
        !precio_por_funcion || typeof(precio_por_funcion) !== 'number' || typeof(cerrado_temporalmente) !== 'boolean') {
      res.sendStatus(400);
      return;
    }

    const sucursalexiste = await db.query("SELECT nombre FROM sucursales WHERE nombre=$1", [nombre]);
    if (sucursalexiste.rows.length >= 1) {
      res.status(400).send("There is already a branch with this name");
      return;
    }
    if (sucursalexiste.rows.length === 0) {
      res.status(404).send("Branch not found");
      return;
    }

    const sucursal = await db.query("UPDATE sucursales SET  nombre = $2, pais = $3, provincia = $4, " +
                                    "localidad = $5, calle = $6, altura = $7, precio_por_funcion = $8, cerrado_temporalmente = $9 "+
                                    "WHERE id = $1 RETURNING *", [id, nombre, pais, provincia, localidad, calle, altura, precio_por_funcion, cerrado_temporalmente]);

   
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.post('/api/peliculas', async (req, res) => {
  try {
    const { titulo, descripcion, genero, promedio_calificacion, en_cines, imagen } = req.body;

    if (!titulo || !descripcion || !genero || typeof promedio_calificacion !== 'number' || typeof en_cines !== 'boolean' || !imagen) {
      res.sendStatus(400);
      return;
    }

    const nuevaPelicula = await db.query(
      'INSERT INTO pelicula (titulo, descripcion, genero, promedio_calificacion, en_cines, imagen) ' +
      'VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [titulo, descripcion, genero, promedio_calificacion, en_cines, imagen]
    );

    res.status(201).json(nuevaPelicula.rows[0]);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.put('/api/peliculas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, genero, promedio_calificacion, en_cines, imagen } = req.body;

    if (!titulo || !descripcion || !genero || typeof promedio_calificacion !== 'number' || typeof en_cines !== 'boolean' || !imagen) {
      res.sendStatus(400);
      return;
    }

    const peliculaActualizada = await db.query(
      'UPDATE pelicula SET titulo=$1, descripcion=$2, genero=$3, promedio_calificacion=$4, en_cines=$5, imagen=$6 ' +
      'WHERE id=$7 RETURNING *',
      [titulo, descripcion, genero, promedio_calificacion, en_cines, imagen, id]
    );

    if (peliculaActualizada.rows.length === 0) {
      res.sendStatus(404);
      return;
    }

    res.json(peliculaActualizada.rows[0]);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.delete('/api/peliculas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const peliculaEliminada = await db.query('DELETE FROM pelicula WHERE id=$1 RETURNING *', [id]);

    if (peliculaEliminada.rows.length === 0) {
      res.sendStatus(404);
      return;
    }

    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.post('/api/funciones', async (req, res) => {
  try {
    const { dia, horario, id_pelicula, id_sala } = req.body;

    // Validar los campos requeridos y tipos de datos
    if (!dia || !horario || typeof id_pelicula !== 'number' || typeof id_sala !== 'number') {
      res.sendStatus(400);
      return;
    }

    // Verificar si la película y la sala existen en la base de datos
    const peliculaExiste = await db.query('SELECT * FROM pelicula WHERE id = $1', [id_pelicula]);
    const salaExiste = await db.query('SELECT * FROM sala WHERE id = $1', [id_sala]);

    if (peliculaExiste.rows.length === 0 || salaExiste.rows.length === 0) {
      res.sendStatus(404);
      return;
    }

    const nuevaFuncion = await db.query(
      'INSERT INTO funcion (dia, horario, id_pelicula, id_sala) ' +
      'VALUES ($1, $2, $3, $4) RETURNING *',
      [dia, horario, id_pelicula, id_sala]
    );

    res.status(201).json(nuevaFuncion.rows[0]);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.put('/api/funciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { dia, horario, id_pelicula, id_sala } = req.body;

    // Validar los campos requeridos y tipos de datos
    if (!dia || !horario || typeof id_pelicula !== 'number' || typeof id_sala !== 'number') {
      res.sendStatus(400);
      return;
    }

    // Verificar si la película y la sala existen en la base de datos
    const peliculaExiste = await db.query('SELECT * FROM pelicula WHERE id = $1', [id_pelicula]);
    const salaExiste = await db.query('SELECT * FROM sala WHERE id = $1', [id_sala]);

    if (peliculaExiste.rows.length === 0 || salaExiste.rows.length === 0) {
      res.sendStatus(404);
      return;
    }

    const funcionActualizada = await db.query(
      'UPDATE funcion SET dia=$1, horario=$2, id_pelicula=$3, id_sala=$4 ' +
      'WHERE id=$5 RETURNING *',
      [dia, horario, id_pelicula, id_sala, id]
    );

    if (funcionActualizada.rows.length === 0) {
      res.sendStatus(404);
      return;
    }

    res.json(funcionActualizada.rows[0]);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.delete('/api/funciones/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const funcionEliminada = await db.query('DELETE FROM funcion WHERE id=$1 RETURNING *', [id]);

    if (funcionEliminada.rows.length === 0) {
      res.sendStatus(404);
      return;
    }

    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});


server.listen(port,()=> console.log('El servidor está escuchando en localhost: '+ port));



