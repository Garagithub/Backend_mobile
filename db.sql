CREATE TABLE "pelicula" (
  "id" integer PRIMARY KEY,
  "titulo" varchar,
  "descripcion" varchar,
  "genero" varchar,
  "promedio_calificacion" float,
  "en_cines" boolean,
  "imagen" varchar
);

CREATE TABLE "sucursal" (
  "id" integer PRIMARY KEY,
  "nombre" varchar,
  "pais" varchar,
  "provincia" varchar,
  "localidad" varchar,
  "calle" varchar,
  "altura" integer,
  "precio_por_funcion" float,
  "cerrado_temporalmente" boolean,
  id_empresa integer FOREIGN KEY empresa(id)
);



-- CAMBIAR TODOS LOS ID POR SERIAL EN VEZ DE INT

CREATE TABLE "funcion" (
  "id" serial PRIMARY KEY,
  "dia" date,
  "horario" time,
  "id_pelicula" integer,
  "id_sala" integer
);

CREATE TABLE "reservas" (
  "id" integer PRIMARY KEY,
  "id_funcion" integer,
  "id_user" integer,
  "cantidad_entradas" integer
);

CREATE TABLE sala (
  "id" serial PRIMARY KEY,
  "id_sucursal" integer
);

CREATE TABLE asientos (
    id serial PRIMARY KEY,
    nro_asiento integer,
    id_sala integer FOREIGN KEY sala(id),
    reservada boolean
)

CREATE TABLE "socio" (
  "id_socio" serial PRIMARY KEY,
  "email" varchar,
  "password" varchar,
  "id_empresa" integer FOREIGN KEY "empresa"("id")
);

CREATE TABLE "empresa" (
    "id" serial PRIMARY KEY,
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

ALTER TABLE "sala" ADD FOREIGN KEY ("id_sucursal") REFERENCES "sucursal" ("id");

ALTER TABLE "pelicula" ADD FOREIGN KEY ("id") REFERENCES "funcion" ("id_pelicula");

ALTER TABLE "funcion" ADD FOREIGN KEY ("id") REFERENCES "reservas" ("id_funcion");

ALTER TABLE "sucursal" ADD FOREIGN KEY ("id") REFERENCES "socio" ("id_sucursal");

ALTER TABLE "sala" ADD FOREIGN KEY ("id") REFERENCES "funcion" ("id_sala");

ALTER TABLE "usuario" ADD FOREIGN KEY ("id_user") REFERENCES "reservas" ("id_user");

ALTER TABLE "comentarios" ADD FOREIGN KEY ("id_user") REFERENCES "usuario" ("id_user");

ALTER TABLE "pelicula" ADD FOREIGN KEY ("id") REFERENCES "comentarios" ("id_pelicula");



