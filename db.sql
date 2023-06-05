CREATE TABLE "pelicula" (
  "id" serial PRIMARY KEY,
  "titulo" varchar,
  "descripcion" varchar,
  "genero" varchar,
  "promedio_calificacion" float,
  "en_cines" boolean,
  "imagen" varchar
);

CREATE TABLE "empresa" (
    "id" serial PRIMARY KEY,
    "nombre" varchar,
    "imagen" varchar
)


CREATE TABLE "comentarios" (
  "id_comentario" serial PRIMARY KEY,
  "rating" integer,
  "comentario" varchar,
  "id_user" integer FOREIGN KEY usuario(id),
  "id_pelicula" integer 
  FOREIGN KEY (id_pelicula) references pelicula(id)
  FOREIGN KEY (id_user) references usuario(id)
);

CREATE TABLE "usuario" (
  "id" serial PRIMARY KEY,
  "nombre" varchar,
  "apellido" varchar,
  "imagen" varchar
);



CREATE TABLE "sucursal" (
  "id" serial PRIMARY KEY,
  "nombre" varchar,
  "pais" varchar,
  "provincia" varchar,
  "localidad" varchar,
  "calle" varchar,
  "altura" integer,
  "precio_por_funcion" float,
  "cerrado_temporalmente" boolean,
  id_empresa integer, 
  FOREIGN KEY (id_empresa) references empresa(id)
);

CREATE TABLE sala (
  "id" serial PRIMARY KEY,
  "id_sucursal" integer,
  FOREIGN KEY (id_sucursal) references sucursal(id)
);



-- CAMBIAR TODOS LOS ID POR SERIAL EN VEZ DE INT

CREATE TABLE "funcion" (
  "id" serial PRIMARY KEY,
  "dia" date,
  "horario" time,
  "id_pelicula" integer,
  "id_sala" integer ,
  FOREIGN KEY (id_pelicula) references pelicula(id),
  FOREIGN KEY (id_sala) references sala(id)
);

CREATE TABLE "reservas" (
  "id" serial PRIMARY KEY,
  "id_funcion" integer, 
  "id_user" integer,
  "cantidad_entradas" integer
  FOREIGN KEY (id_funcion) references funcion(id),
  FOREIGN KEY (id_user) references usuario(id)
  
);



CREATE TABLE asientos (
    id serial PRIMARY KEY,
    nro_asiento integer,
    reservada boolean,
    id_sala integer,
    FOREIGN KEY (id_sala) references sala(id),
    
)

CREATE TABLE "socio" (
  "id_socio" serial PRIMARY KEY,
  "email" varchar,
  "password" varchar,
  "id_empresa" integer FOREIGN KEY "empresa"("id")
);

CREATE TABLE "empresa" (
    "id" integer PRIMARY KEY,
    "nombre" varchar,
    "imagen" varchar
)

CREATE TABLE "usuario" (
  "id_user" integer PRIMARY KEY,
  "nombre" varchar,
  "apellido" varchar,
  "imagen" varchar
);

CREATE TABLE "comentarios" (
  "id_comentario" integer PRIMARY KEY,
  "rating" integer,
  "comentario" varchar,
  "id_user" integer,
  "id_pelicula" integer
);








