const express = require("express");
const pg = require("pg")
const bcrypt = require("bcrypt");
const server = express();
const jwt = require("jsonwebtoken");
const res = require("express/lib/response");
const port = process.env.PORT || 4000

server.use(express.json());

const db = new pg.Pool({
  host: "containers-us-west-72.railway.app",
  port: 7035,
  password: "MegAemOb9TngNH7s6PDb",
  database: "railway",
  user: "postgres"

})



server.get('/', (req, res) => {
  res.status(200).send('El servidor está disponible')


})

// 3 formas de recibir algo: req.body (cuando le manda el json al front), req.params, req.query

// se puede mandar un status haciendo res.sendStatus(500)


/* {

    fila integer,
    columna integer

} */

server.post("/api/auths", async (req, res) => {

  try {
    const { email, password } = req.body;

    const user = await db.query(`
        SELECT *
        FROM socios
        WHERE email = $1;
    `, [email]);

    if (user.rows.length === 0) {
      return res.status(401).json('Password or email is incorrect');

    }



    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json('Password or email is incorrect');

    }

    const payload = {
      user: {
        id: user.rows[0].id
      }
    }

    const token = jwt.sign(payload, "password123", { expiresIn: "48hr" },)

    res.status(200).json({ token: token })




  } catch (error) {
    res.status(500).send();

    console.log(error);
  }

});

server.put('/api/socios/update', async (req, res) => {
  try {
    const { id, email, id_empresa } = req.body;
    if (!id || typeof (id) != 'number' || !email || typeof (email) != 'string' || !id_empresa || typeof (id_empresa) != 'number') {

      res.sendStatus(400);
      return;

    }


    const usuarioupdate = await db.query("UPDATE socios SET  email = $2, id_empresa = $3 " +
      "WHERE id = $1 RETURNING *", [id, email, id_empresa]);


    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});
//hola 

server.delete('/api/socios/delete', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || typeof (id) !== 'number') {
      res.sendStatus(400);
      return;
    }


    //const usuario = await db.query('SELECT id FROM usuarios WHERE (id = $1 )', [id]);



    const socios_delete = await db.query('delete from socios where id=$1', [id]);
    //const reserva_delete=await db.query('delete from reservas where id_user=$1',[id]);
    //const eliminar_usuario = await db.query('DELETE FROM usuarios WHERE id = $1 ', [id]);


    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
})


server.get("/api/socios/:idSocio", async (req, res) => {
  try {
    const { idSocio } = req.params;

    const query = `
      SELECT s.*, e.nombre AS nombre_empresa
      FROM socios s
      INNER JOIN empresas e ON s.id_empresa = e.id
      WHERE s.id = $1
    `;

    const socio = await db.query(query, [idSocio]);

    res.json({ socio: socio.rows });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});



server.post("/api/users", async (req, res) => {
  try {
    const { password, email, company } = req.body;

    if (!password || typeof (password) != 'string' || !email || typeof (email) != 'string' || !email.includes("@") || !company || typeof (company) != 'string') {
      res.sendStatus(400);
      return;
    }
    const userexiste = await db.query("select email from socios where email=$1", [email])
    if (userexiste.rows.length >= 1) {

      res.status(400).send("There is already an email asociate to this account");

      return;
    }
    const salt = await bcrypt.genSalt(10)
    const hashed_password = await bcrypt.hash(password, salt)
    const register_empresa = await db.query("insert into empresas (nombre) values ($1) returning *", [company])
    const register_socio = await db.query("insert into socios (email,password, id_empresa) values($1,$2,$3) returning *", [email, hashed_password, register_empresa.rows[0].id])
    const payload = {
      user: {
        id: register_socio.rows[0].id
      }
    }
    const token = jwt.sign(payload, "password123", { expiresIn: "48hr" },)

    res.status(201).json({ token: token })
  }
  catch (er) {
    console.log(er);
    res.status(500).json({ error: "Error en el registro", message: er.message });
  }

})

server.put('/api/users/update', async (req, res) => {
  try {
    const { id, nombre, apellido, imagen } = req.body;
    if (!id || typeof (id) != 'number' || !nombre || typeof (nombre) != 'string' || !apellido || typeof (apellido) != 'string' || !imagen || typeof (imagen) !== 'string') {

      res.sendStatus(400);
      return;

    }


    const usuarioupdate = await db.query("UPDATE usuarios SET  nombre = $2, apellido = $3, imagen = $4 " +
      "WHERE id = $1 RETURNING *", [id, nombre, apellido, imagen]);


    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.delete('/api/users/delete', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || typeof (id) !== 'number') {
      res.sendStatus(400);
      return;
    }


    //const usuario = await db.query('SELECT id FROM usuarios WHERE (id = $1 )', [id]);



    const coments_delete = await db.query('delete from comentarios where id_user=$1', [id]);
    const reserva_delete = await db.query('delete from reservas where id_user=$1', [id]);
    const eliminar_usuario = await db.query('DELETE FROM usuarios WHERE id = $1 ', [id]);


    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
})

server.get('/usuarios/:user_email', async (req, res) => {
  const { user_email } = req.params;

  try {
    const query = 'SELECT * FROM usuarios WHERE mail = $1';
    const values = [user_email];

    const result = await db.query(query, values);

    if (result.rows.length > 0) {
      const usuario = result.rows[0];
      res.json(usuario);
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener los datos del usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});



server.post('/cinema-room/:id_sucursal', async (req, res) => {
  const { id_sucursal } = req.params;
  const { fila, columna, numero_sala } = req.body;

  if (!fila || typeof fila !== 'number' || !columna || typeof columna !== 'number' || !numero_sala || typeof numero_sala !== 'number') {
    res.sendStatus(400);
    return;
  }

  // Resto del código para crear la sala de cine...



  const sala = await db.query('insert into salas (id_sucursal,numero_sala, fila, columna) values($1,$2, $3, $4) returning *', [id_sucursal, numero_sala, fila, columna])

  const multiplicacion = fila * columna

  for (let i = 0; i < multiplicacion; i++) {
    const asientos = await db.query('insert into asientos (nro_asiento, id_sala, reservada) values($1, $2, $3)', [i + 1, sala.rows[0].id, false])
  }




  res.sendStatus(200)


})

// server.put('/:idsucursal/:numero_sala/update', async (req, res) => {
//   try {
//     const {id_sucursal, numero_sala}= req.params;
//     const { fila, columna, numero_sala_nuevo } = req.body;
//     console.log('id_sucursal:', id_sucursal);
//     console.log('numero_sala:', numero_sala);

//     /*if ( !fila || typeof(fila) !== 'number' || !columna || typeof(columna) !== 'number' ||!id_sucursal || typeof(id_sucursal)!== 'number' || !numero_sala 
//         || typeof(numero_sala)!=='number' ) {
//       res.sendStatus(400);
//       return;
//     }*/

//     const sala = await db.query('SELECT * FROM salas WHERE (id_sucursal = $1 and numero_sala=$2) ', [id_sucursal,numero_sala]);

//     /*if (sala.rows.length === 0) {
//       res.status(404).send('Cinema room not found');
//       return;}
//     */
//     //pensar bien esto con el tema de asientos y demas
//     const eliminar_asientos = await db.query('DELETE FROM asientos WHERE id_sala = $1 ', [sala.rows[0].id])

//    const update= await db.query ('UPDATE salas SET numero_sala = $2 WHERE id = $1',[sala.rows[0].id,numero_sala_nuevo])
//     const multiplicacion = fila * columna

//    for (let i = 0; i < multiplicacion; i++) {
//     const asientos = await db.query('insert into asientos (nro_asiento, id_sala, reservada) values($1, $2, $3) returning *',[i+1, sala.rows[0].id, false])
//    }

//     res.sendStatus(200);
//   } catch (error) {
//     console.error(error);
//     res.sendStatus(500);
//   }
// });

server.put('/:id_sucursal/:numero_sala/update', async (req, res) => {
  const { id_sucursal, numero_sala } = req.params;
  const { fila, columna, numero_sala_nuevo } = req.body;

  if (!fila || typeof fila !== 'number' || !columna || typeof columna !== 'number' || !numero_sala_nuevo || typeof numero_sala_nuevo !== 'number') {
    res.sendStatus(400);
    return;
  }

  try {
    // Verificar si existe una sala con el número de sala actual
    const salaExistente = await db.query('SELECT * FROM salas WHERE id_sucursal = $1 AND numero_sala = $2', [id_sucursal, numero_sala]);

    if (!salaExistente.rows[0]) {
      res.sendStatus(404);
      return;
    }

    // Obtener el ID de la sala existente
    const salaId = salaExistente.rows[0].id;

    // Calcular el total de asientos actual y el nuevo total de asientos
    const totalAsientosActual = salaExistente.rows[0].fila * salaExistente.rows[0].columna;
    const totalAsientosNuevo = fila * columna;

    // Actualizar el número de sala
    await db.query('UPDATE salas SET numero_sala = $1 WHERE id_sucursal = $2 AND numero_sala = $3', [numero_sala_nuevo, id_sucursal, numero_sala]);


    // Actualizar las filas y columnas de la sala
    await db.query('UPDATE salas SET fila = $1, columna = $2 WHERE id = $3', [fila, columna, salaId]);

    // Si el nuevo total de asientos es menor, eliminar los asientos adicionales
    if (totalAsientosNuevo < totalAsientosActual) {
      const asientosEliminar = totalAsientosActual - totalAsientosNuevo;
      await db.query('DELETE FROM asientos WHERE id_sala = $1 AND nro_asiento > $2', [salaId, totalAsientosNuevo]);
    }
    // Si el nuevo total de asientos es mayor, agregar nuevos asientos
    else if (totalAsientosNuevo > totalAsientosActual) {
      for (let i = totalAsientosActual + 1; i <= totalAsientosNuevo; i++) {
        await db.query('INSERT INTO asientos (nro_asiento, id_sala, reservada) VALUES ($1, $2, $3)', [i, salaId, false]);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error al actualizar la sala de cine:', error);
    res.sendStatus(500);
  }
});




server.delete('/:idsucursal/:cinema-room/deletecinemaroom', async (req, res) => {
  try {
    const { id_sucursal, numero_sala } = req.params;

    //if (!id_sucursal || typeof(id_sucursal) !== 'number' || !numero_sala || typeof(numero_sala)!== 'number') {
    //res.sendStatus(400);
    //return;
    //}

    const sala = await db.query('SELECT id FROM salas WHERE (id_sucursal = $1 and numero_sala = $2)', [id_sucursal, numero_sala]);

    if (sala.rows.length === 0) {
      res.status(404).send('Cinema room not found');
      return;
    }
    const eliminar_asientos = await db.query('DELETE FROM asientos WHERE id_sala = $1 ', [sala.rows[0].id])
    const eliminacion = await db.query('delete from salas where id=$1', [sala.rows[0].id])

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});
server.delete('/:idsucursal/:cinema_room/deletecinemarooms', async (req, res) => {
  try {
    const { idsucursal, cinema_room } = req.params;

    const sala = await db.query('SELECT id FROM salas WHERE id_sucursal = $1 AND numero_sala = $2', [idsucursal, cinema_room]);

    if (sala.rows.length === 0) {
      res.status(404).send('Cinema room not found');
      return;
    }

    const eliminar_asientos = await db.query('DELETE FROM asientos WHERE id_sala = $1', [sala.rows[0].id]);
    const eliminacion = await db.query('DELETE FROM salas WHERE id = $1', [sala.rows[0].id]);

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.get('/:id_sucursal/cinema-room/getall', async (req, res) => {
  try {
    const { id_sucursal } = req.params
    const salas = await db.query('select * from salas where id_sucursal=$1', [id_sucursal]);
    res.status(200).json(salas.rows);
  }
  catch (error) {
    console.error(error);
    res.sendStatus(500);
  }


});
server.get('/:id_sucursal/cinema-room/getbyid', async (req, res) => {
  try {
    const { id_sucursal } = req.params;
    const { numero_sala } = req.body;
    const ids = await db.query('select id from salas where (id_sucursal=$1 and numero_sala=$2)', [id_sucursal, numero_sala])
    const salas = await db.query('select * from salas where id=$1', [ids.rows[0].id]);
    res.status(200).json(salas.rows);
  }
  catch (error) {
    console.error(error);
    res.sendStatus(500);
  }


});


// server.get('/:id_sucursal/cinema-room/:numero_sala/getbyid', async (req, res) => {
//   try {
//     const { id_sucursal, numero_sala } = req.params;
//     const sala = await db.query('SELECT * FROM salas WHERE id_sucursal = $1 AND numero_sala = $2', [id_sucursal, numero_sala]);

//     if (sala.rows.length > 0) {
//       res.status(200).json(sala.rows[0]);
//     } else {
//       res.status(404).json({ error: 'Sala no encontrada' });
//     }
//   } catch (error) {
//     console.error(error);
//     res.sendStatus(500);
//   }
// });

server.get('/:id_sucursal/cinema-room/:numero_sala/getbyid', async (req, res) => {
  try {
    const { id_sucursal, numero_sala } = req.params;
    const sala = await db.query('SELECT * FROM salas WHERE id_sucursal = $1 AND numero_sala = $2', [id_sucursal, numero_sala]);

    if (sala.rows.length > 0) {
      console.log('Datos de la sala:', sala.rows[0]); // Agregar el console.log aquí
      res.status(200).json(sala.rows[0]);
    } else {
      res.status(404).json({ error: 'Sala no encontrada' });
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});




server.post("/api/cinema/:id_cinema/branches", async (req, res) => {

  const { id_cinema } = req.params

  try {
    const { nombre, pais, provincia, localidad, calle, altura, precio, cerrado, imagen } = req.body;

    if (!nombre || typeof (nombre) !== 'string' || !pais || typeof (pais) !== 'string' ||
      !provincia || typeof (provincia) !== 'string' || !localidad || typeof (localidad) !== 'string' ||
      !calle || typeof (calle) !== 'string' || !altura || typeof (altura) !== 'number' ||
      !precio || typeof (precio) !== 'number' || typeof (cerrado) !== 'boolean' || cerrado === undefined) {
      res.sendStatus(400);

      return;
    }
    const sucursalexiste = await db.query("select nombre from sucursales where nombre=$1", [nombre])
    if (sucursalexiste.rows.length >= 1) {

      res.status(400).send("There is already a branch with this name");


      return;
    }

    const sucursal = await db.query("INSERT INTO sucursales ( nombre, pais, provincia, localidad, calle, altura, precio_por_funcion, cerrado_temporalmente, id_empresa,  imagen) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *", [nombre, pais, provincia, localidad, calle, altura, precio, cerrado, id_cinema, imagen]);
    res.sendStatus(200);
  }
  catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});


server.get("/api/cinema/:idSocio/branches", async (req, res) => {
  try {

    const { idSocio } = req.params;


    const empresa = await db.query("SELECT * FROM socios WHERE id = $1", [idSocio]);
    const sucursal = await db.query("SELECT * FROM sucursales WHERE id_empresa = $1", [empresa.rows[0].id_empresa]);

    res.json({ sucursal: sucursal.rows });
  }
  catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.delete("/api/cinema/branches", async (req, res) => {
  const { id_sucursal } = req.body;

  try {
    //revisar este try esta raro
    const existesucursal = await db.query("select * from sucursales where id=$1", [id_sucursal])
    // este no funca 
    if (existesucursal.rows.length === 0) {

      res.status(400).send("There is no branch whit this id");

      return;
    }
    const eliminar = await db.query('DELETE FROM sucursales WHERE id = $1', [id_sucursal]);

    res.sendStatus(200);
  } catch (error) {
    console.error('Error al eliminar la sucursal:', error);
    res.sendStatus(500);
  }
});

// server.put("/api/cinema/branches/update", async (req, res) => {
//   try {

//     const { id, nombre, pais, provincia, localidad, calle, altura, precio_por_funcion, cerrado_temporalmente} = req.body;

//     if (!id || typeof(id) !== 'number' || !nombre || typeof(nombre) !== 'string' || !pais || typeof(pais) !== 'string' ||
//         !provincia || typeof(provincia) !== 'string' || !localidad || typeof(localidad) !== 'string' ||
//         !calle || typeof(calle) !== 'string' || !altura || typeof(altura) !== 'number' ||
//         !precio_por_funcion || typeof(precio_por_funcion) !== 'number' || typeof(cerrado_temporalmente) !== 'boolean') {
//       res.sendStatus(400);
//       return;
//     }

//     const sucursalexiste = await db.query("SELECT nombre FROM sucursales WHERE nombre=$1", [nombre]);
//     if (sucursalexiste.rows.length >= 1) {
//       res.status(400).send("There is already a branch with this name");
//       return;
//     }
//     if (sucursalexiste.rows.length === 0) {
//       res.status(404).send("Branch not found");
//       return;
//     }

//     const sucursal = await db.query("UPDATE sucursales SET  nombre = $2, pais = $3, provincia = $4, " +
//                                     "localidad = $5, calle = $6, altura = $7, precio_por_funcion = $8, cerrado_temporalmente = $9 "+
//                                     "WHERE id = $1 RETURNING *", [id, nombre, pais, provincia, localidad, calle, altura, precio_por_funcion, cerrado_temporalmente]);


//     res.sendStatus(200);
//   } catch (error) {
//     console.error(error);
//     res.sendStatus(500);
//   }
// });


// server.put("/api/cinema/branches/update", async (req, res) => {
//   try {
//     const { id, nombre, pais, provincia, localidad, calle, altura, precio_por_funcion, cerrado_temporalmente } = req.body;

//     if (!id || typeof id !== "number" || !nombre || typeof nombre !== "string" || !pais || typeof pais !== "string" ||
//         !provincia || typeof provincia !== "string" || !localidad || typeof localidad !== "string" ||
//         !calle || typeof calle !== "string" || !altura || typeof altura !== "number" ||
//         !precio_por_funcion || typeof precio_por_funcion !== "number" || typeof cerrado_temporalmente !== "boolean") {
//       res.sendStatus(400);
//       return;
//     }

//     const sucursalexiste = await db.query("SELECT nombre FROM sucursales WHERE id <> $1 AND nombre = $2", [id, nombre]);
//     if (sucursalexiste.rows.length >= 1) {
//       res.status(400).send("There is already a branch with this name");
//       return;
//     }

//     if (sucursalexiste.rows.length === 0) {
//       res.status(404).send("Branch not found");
//       return;
//     }

//     const sucursal = await db.query("UPDATE sucursales SET nombre = $2, pais = $3, provincia = $4, " +
//       "localidad = $5, calle = $6, altura = $7, precio_por_funcion = $8, cerrado_temporalmente = $9 " +
//       "WHERE id = $1 RETURNING *", [id, nombre, pais, provincia, localidad, calle, altura, precio_por_funcion, cerrado_temporalmente]);

//     res.sendStatus(200);
//   } catch (error) {
//     console.error(error);
//     res.sendStatus(500);
//   }
// });


server.put("/api/cinema/branches/update", async (req, res) => {
  try {
    const { id, nombre, pais, provincia, localidad, calle, altura, precio_por_funcion, cerrado_temporalmente } = req.body;

    console.log('ID:', id);
    console.log('Nombre:', nombre);
    console.log('País:', pais);
    console.log('Provincia:', provincia);
    console.log('Localidad:', localidad);
    console.log('Calle:', calle);
    console.log('Altura:', altura);
    console.log('Precio por función:', precio_por_funcion);
    console.log('Cerrado temporalmente:', cerrado_temporalmente);

    if (!id || typeof id !== "number" || !nombre || typeof nombre !== "string" || !pais || typeof pais !== "string" ||
      !provincia || typeof provincia !== "string" || !localidad || typeof localidad !== "string" ||
      !calle || typeof calle !== "string" || !altura || typeof altura !== "number" ||
      !precio_por_funcion || typeof precio_por_funcion !== "number" || typeof cerrado_temporalmente !== "boolean") {
      console.log('Error de validación');
      res.sendStatus(400);
      return;
    }

    const sucursalexiste = await db.query("SELECT nombre FROM sucursales WHERE id <> $1 AND nombre = $2", [id, nombre]);
    if (sucursalexiste.rows.length >= 1) {
      console.log('Sucursal con el mismo nombre ya existe');
      res.status(400).send("There is already a branch with this name");
      return;
    }

    const sucursalfound = await db.query("SELECT nombre FROM sucursales WHERE id = $1", [id]);
    if (sucursalfound.rows.length === 0) {
      console.log('Sucursal no encontrada');
      res.status(404).send("Branch not found");
      return;
    }

    const sucursal = await db.query("UPDATE sucursales SET nombre = $2, pais = $3, provincia = $4, " +
      "localidad = $5, calle = $6, altura = $7, precio_por_funcion = $8, cerrado_temporalmente = $9 " +
      "WHERE id = $1 RETURNING *", [id, nombre, pais, provincia, localidad, calle, altura, precio_por_funcion, cerrado_temporalmente]);

    console.log('Sucursal actualizada:', sucursal.rows[0]);

    res.sendStatus(200);
  } catch (error) {
    console.error('Error:', error);
    res.sendStatus(500);
  }
});




server.get("/api/branches", async (req, res) => {
  try {
    const branches = await db.query("SELECT * FROM sucursales");
    res.json(branches.rows);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// server.get("/api/branches/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const branch = await db.query("SELECT id, nombre, pais, provincia, localidad, calle, altura, precio_por_funcion, cerrado_temporalmente, id_empresa FROM sucursales WHERE id = $1", [id]);

//     if (branch.rows.length === 0) {
//       return res.status(404).json({ message: "Branch not found" });
//     }

//     res.json(branch.rows[0]);
//   } catch (error) {
//     console.error(error);
//     res.sendStatus(500);
//   }
// });


server.get("/api/branches/:id/:id_socio", async (req, res) => {
  try {
    const { id, id_socio } = req.params;

    const query = `
      SELECT s.id, s.nombre, s.pais, s.provincia, s.localidad, s.calle, s.altura, s.precio_por_funcion, s.cerrado_temporalmente, s.id_empresa
      FROM sucursales s
      INNER JOIN empresas e ON s.id_empresa = e.id
      INNER JOIN socios so ON e.id = so.id_empresa
      WHERE s.id = $1 AND so.id = $2
    `;

    const branch = await db.query(query, [id, id_socio]);

    if (branch.rows.length === 0) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json(branch.rows[0]);
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
      'INSERT INTO peliculas (titulo, descripcion, genero, promedio_calificacion, en_cines, imagen) ' +
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
      'UPDATE peliculas SET titulo=$1, descripcion=$2, genero=$3, promedio_calificacion=$4, en_cines=$5, imagen=$6 ' +
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

server.delete('/api/peliculas/:id/delete', async (req, res) => {
  try {
    const { id } = req.params;

    const peliculaEliminada = await db.query('DELETE FROM peliculas WHERE id=$1 RETURNING *', [id]);

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

server.get("/api/peliculas", async (req, res) => {
  try {
    const peliculas = await db.query("SELECT id, titulo, descripcion, genero, promedio_calificacion, en_cines, imagen FROM peliculas");
    res.json(peliculas.rows);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.get("/api/peliculas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pelicula = await db.query("SELECT id, titulo, descripcion, genero, promedio_calificacion, en_cines, imagen FROM peliculas WHERE id = $1", [id]);

    if (pelicula.rows.length === 0) {
      res.status(404).json({ message: "Película no encontrada" });
      return;
    }

    res.json(pelicula.rows[0]);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});


// server.post('/api/funciones', async (req, res) => {
//   try {
//     const { dia, horario, id_pelicula, id_sala } = req.body;

//     // Validar los campos requeridos y tipos de datos
//     if (!dia || !horario || typeof id_pelicula !== 'number' || typeof id_sala !== 'number') {
//       res.sendStatus(400);
//       return;
//     }

//     // Verificar si la película y la sala existen en la base de datos
//     const peliculaExiste = await db.query('SELECT * FROM peliculas WHERE id = $1', [id_pelicula]);
//     const salaExiste = await db.query('SELECT * FROM salas WHERE id = $1', [id_sala]);

//     if (peliculaExiste.rows.length === 0 || salaExiste.rows.length === 0) {
//       res.sendStatus(404);
//       return;
//     }

//     const nuevaFuncion = await db.query(
//       'INSERT INTO funciones (dia, horario, id_pelicula, id_sala) ' +
//       'VALUES ($1, $2, $3, $4) RETURNING *',
//       [dia, horario, id_pelicula, id_sala]
//     );

//     res.status(201).json(nuevaFuncion.rows[0]);
//   } catch (error) {
//     console.error(error);
//     res.sendStatus(500);
//   }
// });

server.post('/api/funciones/:id_sala/create', async (req, res) => {
  try {
    const { id_sala } = req.params;
    const { titulo, descripcion, genero, imagen, dia, horario } = req.body;

    // Validar los campos requeridos y tipos de datos
    /*if (!dia || !horario || typeof id_sala !== 'number' /*|| !pelicula || typeof pelicula !== 'object') {
      res.sendStatus(400);
      return;
    }*/

    //const { titulo, descripcion, genero, imagen } = pelicula;

    // Verificar si la sala existe en la base de datos
    //const salaExiste = await db.query('SELECT * FROM salas WHERE id = $1', [id_sala]);

    /*if (salaExiste.rows.length === 0) {
      res.sendStatus(404);
      return;
    }*/

    const nuevaPelicula = await db.query(
      'INSERT INTO peliculas (titulo, descripcion, genero, imagen) ' +
      'VALUES ($1, $2, $3, $4) RETURNING *',
      [titulo, descripcion, genero, imagen]
    );

    const nuevaFuncion = await db.query(
      'INSERT INTO funciones (dia, horario, id_pelicula, id_sala) ' +
      'VALUES ($1, $2, $3, $4) RETURNING *',
      [dia, horario, nuevaPelicula.rows[0].id, id_sala]
    );

    console.log('Nueva función creada:', nuevaFuncion.rows[0]);

    res.status(201).json(nuevaFuncion.rows[0]);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});


// server.put('/api/funciones/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { dia, horario, id_pelicula, id_sala } = req.body;

//     // Validar los campos requeridos y tipos de datos
//     if (!dia || !horario || typeof id_pelicula !== 'number' || typeof id_sala !== 'number') {
//       res.sendStatus(400);
//       return;
//     }

//     // Verificar si la película y la sala existen en la base de datos
//     const peliculaExiste = await db.query('SELECT * FROM peliculas WHERE id = $1', [id_pelicula]);
//     const salaExiste = await db.query('SELECT * FROM salas WHERE id = $1', [id_sala]);

//     if (peliculaExiste.rows.length === 0 || salaExiste.rows.length === 0) {
//       res.sendStatus(404);
//       return;
//     }

//     const funcionActualizada = await db.query(
//       'UPDATE funciones SET dia=$1, horario=$2, id_pelicula=$3, id_sala=$4 ' +
//       'WHERE id=$5 RETURNING *',
//       [dia, horario, id_pelicula, id_sala, id]
//     );

//     if (funcionActualizada.rows.length === 0) {
//       res.sendStatus(404);
//       return;
//     }

//     res.json(funcionActualizada.rows[0]);
//   } catch (error) {
//     console.error(error);
//     res.sendStatus(500);
//   }
// });
//
server.put('/api/funciones/:id/:id_pelicula/:id:sala', async (req, res) => {
  try {
    const { id, id_pelicula, id_sala } = req.params;
    const { dia, horario, titulo, descripcion, genero, imagen } = req.body;

    // Validar los campos requeridos y tipos de datos
    if (!dia || !horario ) {
      res.sendStatus(400);
      return;
    }

    // Verificar si la película y la sala existen en la base de datos
    const peliculaExiste = await db.query('SELECT * FROM peliculas WHERE id = $1', [id_pelicula]);
    const salaExiste = await db.query('SELECT * FROM salas WHERE id = $1', [id_sala]);

   /* if (peliculaExiste.rows.length === 0 || salaExiste.rows.length === 0) {
      res.sendStatus(404);
      return;
    }*/

    // Actualizar la función
    const funcionActualizada = await db.query(
      'UPDATE funciones SET dia=$1, horario=$2, id_pelicula=$3, id_sala=$4 ' +
      'WHERE id=$5 RETURNING *',
      [dia, horario, id_pelicula, id_sala, id]
    );

    if (funcionActualizada.rows.length === 0) {
      res.sendStatus(404);
      return;
    }

    // Actualizar los campos adicionales de la película si se proporcionan
    if (titulo !== "" || descripcion !== "" || genero !== "" || imagen !== "") {
      const peliculaActualizada = await db.query(
        'UPDATE peliculas SET titulo=$1, descripcion=$2, genero=$3, imagen=$4 ' +
        'WHERE id=$5 RETURNING *',
        [titulo || null, descripcion || null, genero || null, imagen || null, id_pelicula]
      );

      if (peliculaActualizada.rows.length === 0) {
        res.sendStatus(404);
        return;
      }
    }


    res.json(funcionActualizada.rows[0]);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});


server.delete('/api/funciones/:id/deletebyid', async (req, res) => {
  try {
    const { id } = req.params;

    const funcionEliminada = await db.query('DELETE FROM funciones WHERE id=$1 RETURNING *', [id]);

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

server.get("/api/functions", async (req, res) => {
  try {
    const functions = await db.query(`
      SELECT f.id, f.dia, f.horario, p.titulo AS pelicula, p.imagen, s.numero_sala AS sala
      FROM funciones f
      INNER JOIN peliculas p ON f.id_pelicula = p.id
      INNER JOIN salas s ON f.id_sala = s.id
    `);
    res.json(functions.rows);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});



server.get("/api/functions/:idSala", async (req, res) => {
  try {
    const { idSala } = req.params;

    const query = `
      SELECT s.numero_sala AS numero_sala, p.titulo AS nombre_pelicula, f.dia, f.horario, f.id
      FROM salas s
      JOIN funciones f ON f.id_sala = s.id
      JOIN peliculas p ON p.id = f.id_pelicula
      WHERE s.id = $1
    `;

    const result = await db.query(query, [idSala]);
    const funciones = result.rows;

    res.json({ funciones });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});



server.get("/api/functions/:id/getbyid", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("SELECT f.id,f.id_pelicula, f.dia, f.horario, p.titulo, p.descripcion, p.genero, p.imagen, s.numero_sala FROM funciones f join peliculas p ON p.id = f.id_pelicula join salas s on f.id_sala = s.id WHERE f.id = $1", [id]);
    if (result.rows.length === 0) {
      res.sendStatus(404);
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});


// server.post("/api/comments", async (req, res) => {
//   const { rating, comentario, id_user, id_pelicula } = req.body;

//   // Verificar que los datos sean del tipo correspondiente
//   if (
//     typeof rating !== "number" ||
//     typeof comentario !== "string" ||
//     typeof id_user !== "number" ||
//     typeof id_pelicula !== "number"
//   ) {
//     res.status(400).send("Invalid data types");
//     return;
//   }

//   // Verificar la longitud del comentario
//   if (comentario.length > 200) {
//     res.status(400).send("Comment exceeds the maximum length");
//     return;
//   }

//   try {
//     const comment = await db.query(
//       "INSERT INTO comentarios (rating, comentario, id_user, id_pelicula) VALUES ($1, $2, $3, $4) RETURNING *",
//       [rating, comentario, id_user, id_pelicula]
//     );

//     res.status(201).json(comment.rows[0]);
//   } catch (error) {
//     console.error(error);
//     res.sendStatus(500);
//   }
// });

server.post('/peliculas/:id_pelicula/comentarios/:id_user', async (req, res) => {
  try {
    const { id_pelicula, id_user } = req.params;
    const { rating, comentario } = req.body;

    console.log('Valores del cuerpo de la solicitud:', rating, comentario);
    console.log('ID de la película:', id_pelicula);
    console.log('ID del usuario:', id_user);


    if (!rating || !comentario) {
      return res.status(400).json({ error: 'Faltan parámetros obligatorios' });
    }


    // Realizar la inserción del comentario en la base de datos
    const query = 'INSERT INTO comentarios (rating, comentario, id_user, id_pelicula) VALUES ($1, $2, $3, $4)';
    const values = [rating, comentario, id_user, id_pelicula];
    await db.query(query, values);

    // Responder con un mensaje de éxito
    res.status(201).json({ message: 'Comentario creado con éxito' });
  } catch (error) {
    console.error('Error al crear el comentario:', error);
    res.status(500).json({ error: 'Error al crear el comentario' });
  }
});

server.get('/funciones/:id_funcion/pelicula', async (req, res) => {
  const { id_funcion } = req.params;

  try {
    // Ejecuta una consulta para obtener el ID de la película asociada a la función
    const query = 'SELECT id_pelicula FROM funciones WHERE id = $1';
    const values = [id_funcion];
    const result = await db.query(query, values);

    // Verifica si se encontró un resultado
    if (result.rows.length > 0) {
      const peliculaId = result.rows[0].id_pelicula;
      res.json({ peliculaId });
    } else {
      res.status(404).json({ error: 'Función no encontrada' });
    }
  } catch (error) {
    console.error('Error al obtener el ID de la película:', error);
    res.status(500).json({ error: 'Error al obtener el ID de la película' });
  }
});




server.put("/api/comments/:id", async (req, res) => {
  const { id } = req.params;
  const { rating, comentario, id_user, id_pelicula } = req.body;

 
  if (
    typeof rating !== "number" ||
    typeof comentario !== "string" ||
    typeof id_user !== "number" ||
    typeof id_pelicula !== "number"
  ) {
    res.status(400).send("Invalid data types");
    return;
  }

  // Verificar la longitud del comentario
  if (comentario.length > 200) {
    res.status(400).send("Comment exceeds the maximum length");
    return;
  }

  try {
    const updatedComment = await db.query(
      "UPDATE comentarios SET rating = $1, comentario = $2, id_user = $3, id_pelicula = $4 WHERE id_comentario = $5 RETURNING *",
      [rating, comentario, id_user, id_pelicula, id]
    );

    if (updatedComment.rows.length === 0) {
      res.sendStatus(404);
    } else {
      res.json(updatedComment.rows[0]);
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// server.get("/api/comments", async (req, res) => {
//   try {
//     const comments = await db.query("SELECT * FROM comentarios");
//     res.json(comments.rows);
//   } catch (error) {
//     console.error(error);
//     res.sendStatus(500);
//   }
// });

// server.get("/api/comments/:id", async (req, res) => {
//   const { id } = req.params;

//   try {
//     const comment = await db.query("SELECT * FROM comentarios WHERE id_comentario = $1", [id]);

//     if (comment.rows.length === 0) {
//       res.sendStatus(404);
//     } else {
//       res.json(comment.rows[0]);
//     }
//   } catch (error) {
//     console.error(error);
//     res.sendStatus(500);
//   }
// });

server.get('/peliculas/:id_pelicula/comentarios/obtenercomentarios', async (req, res) => {
  const { id_pelicula } = req.params;
  console.log('ID de la película:', id_pelicula);

  try {
    // Verifica si se proporcionó un ID de película válido
    if (!id_pelicula) {
      return res.status(400).json({ error: 'ID de película inválido' });
    }

    // Ejecuta una consulta para obtener los comentarios de la película desde la base de datos
    const query = 'SELECT * FROM comentarios WHERE id_pelicula = $1';
    const values = [id_pelicula];
    const result = await db.query(query, values);

    // Devuelve los comentarios como respuesta
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener los comentarios:', error);
    res.status(500).json({ error: 'Error al obtener los comentarios' });
  }
});



server.delete("/api/comments/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedComment = await db.query("DELETE FROM comentarios WHERE id_comentario = $1 RETURNING *", [id]);

    if (deletedComment.rows.length === 0) {
      res.sendStatus(404);
    } else {
      res.sendStatus(204);
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// Crear una reserva
// server.post("/api/reservas/create", async (req, res) => {
//   try {
//     const { id_funcion, id_user, cantidad_entradas, id_sala, nro_asiento} = req.body;

//     /*if (!id_funcion || typeof (id_funcion) !== 'number' ||
//       !id_user || typeof (id_user) !== 'number' ||
//       !cantidad_entradas || typeof (cantidad_entradas) !== 'number') {
//       res.sendStatus(400);
//       return;
//     }*/

//     const crear_reserva = await db.query("insert into reservas (id_funcion, id_user, cantidad_entradas,id_sala,nro_asiento) values ($1,$2,$3) returning *", [id_funcion, id_user, cantidad_entradas,id_sala,nro_asiento])

//     res.status(201).json(crear_reserva.rows[0]);
//   } catch (error) {
//     console.error(error);
//     res.sendStatus(500);
//   }
// });

server.post("/api/reservas/create", async (req, res) => {
  try {
    const { id_funcion, id_user, cantidad_entradas, id_sala, nro_asiento } = req.body;

    const crear_reserva = await db.query(
      "INSERT INTO reservas (id_funcion, id_user, cantidad_entradas, id_sala, nro_asiento) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [id_funcion, id_user, cantidad_entradas, id_sala, nro_asiento]
    );

    res.status(201).json(crear_reserva.rows[0]);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});


// Actualizar una reserva por ID


// Eliminar una reserva por ID
server.delete("/api/reservas/:id/delete", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || typeof (id) !== 'number') {
      res.sendStatus(400);
      return;
    }

    const deletedreserva = await db.query("DELETE FROM reservas WHERE id = $1 RETURNING *", [id]);

    if (deletedreserva.rows.length === 0) {
      res.sendStatus(404);
    } else {
      res.sendStatus(204);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// Obtener todas las reservas
server.get("/api/reservas/getall", async (req, res) => {
  try {

    const reservas_get = await db.query("SELECT * FROM reservas ");

    if (reservas_get.rows.length === 0) {
      res.sendStatus(404);
    } else {
      res.json(reservas_get.rows[0]);
    }

    res.json(reservas_get);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// Obtener una reserva por ID
server.get("/api/reservas/:id/getbyid", async (req, res) => {
  try {
    const { id_funcion } = req.params;

    if (!id_funcion || typeof (id_funcion) !== 'number') {
      res.sendStatus(400);
      return;
    }


    const reservas_get = await db.query("SELECT * FROM reservas WHERE id_funcion = $1", [id_funcion]);

    if (reservas_get.rows.length === 0) {
      res.sendStatus(404);
    } else {
      res.json(reservas_get.rows[0]);
    }

    res.json(reservas_get);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});


// obtener las reservas de 1 usuario en particular
server.get("/api/reservas/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const reservas = await db.query(`
      SELECT s.nombre AS sucursal, sa.nro_sala, f.dia, f.horario, p.titulo, r.cantidad_entradas, r.nro_asiento
      FROM reservas r
      JOIN funcion f ON r.id_funcion = f.id
      JOIN sala sa ON f.id_sala = sa.id
      JOIN sucursal s ON sa.id_sucursal = s.id
      JOIN pelicula p ON f.id_pelicula = p.id
      WHERE r.id_user = $1
    `, [userId]);
    
    res.json(reservas.rows);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});



server.post("/api/createuser", async (req, res) => {
  try {
    const { nombre, apellido, imagen, mail } = req.body;

    // Verificar que se proporcionen los valores requeridos y sean del tipo correcto
    if (!nombre || !apellido) {
      res.sendStatus(400);
      return;
    }

    // Consulta SQL para verificar si ya existe un registro con el mismo id_google
    const existeUsuario = await db.query("SELECT * FROM usuarios WHERE mail = $1", [mail]);

    if (existeUsuario.rows.length > 0) {
      // Ya existe un registro con el mismo id_google
      res.status(409).json({ error: "Ya existe un usuario con el mismo mail" });
      return;
    }

    // Si no existe un registro con el mismo id_google, realizar la inserción
    const crearUsuario = await db.query("INSERT INTO usuarios (nombre, apellido, imagen, mail) VALUES ($1, $2, $3, $4) RETURNING *", [nombre, apellido, imagen, mail]);

    res.status(201).json(crearUsuario.rows[0]);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});
server.get('/api/sucursales/:titulo/getsucursalesbypelicula', async (req, res) => {
  try {
    const { titulo } = req.params;
    const sucursales = await db.query('SELECT s.nombre, f.dia,f.id_sala,sa.id ' +
      'FROM peliculas p ' +
      'INNER JOIN funciones f ON p.id = f.id_pelicula ' +
      'INNER JOIN salas sa ON f.id_sala = sa.id ' +
      'INNER JOIN sucursales s ON sa.id_sucursal = s.id ' +
      'WHERE p.titulo = $1', [titulo]);

    if (sucursales.rows.length === 0) {
      res.sendStatus(404);
    } else {
      res.json(sucursales.rows);
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.get('/api/salas/:id_sala/getfilasycolumnas', async (req, res) => {
  try {
    const { id_sala } = req.params;

    const fyc = await db.query('SELECT fila,columna ' +
      'FROM salas '+
      'WHERE id = $1', [id_sala]);

    if (fyc.rows.length === 0) {
      res.sendStatus(404);
    } else {
      res.json(fyc.rows);
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});
server.get('/api/user/:mail/getuserbymail', async (req, res) => {
  try {
    const { mail } = req.params;

    const fyc = await db.query('SELECT id ' +
      'FROM usuarios '+
      'WHERE mail = $1', [mail]);

    if (fyc.rows.length === 0) {
      res.sendStatus(404);
    } else {
      res.json(fyc.rows);
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});




server.listen(port, () => console.log('El servidor está escuchando en localhost: ' + port));



