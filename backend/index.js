const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const sessionMiddleware = session({
  secret: "supersarasa",
  resave: false,
  saveUninitialized: false,
});
app.use(sessionMiddleware);

const server = app.listen(PORT, () => {
  console.log(`Servidor NodeJS corriendo en http://localhost:${PORT}/`);
});

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});



app.post('/login', async function (req, res) {
    console.log(req.body);
try {
  let respuesta = {
        ok: false,
        msg: "No se pudo loguear"
    };
     let existe = await realizarQuery(`
            SELECT * FROM Usuarios WHERE nombre = '${req.body.nombre}' OR contra = '${req.body.contra}'
        `);

        if (existe.length > 0) {
            respuesta.msg = "El usuario existe.";
            respuesta.ok = true
        }
        return res.send(respuesta);
} catch (error) {
    res.send({ message: "usuario no existe registrate", ok: false });
}
});

app.post("/register", async function (req, res) { 
    console.log(req.body);

    let respuesta = {
        ok: false,
        msg: "No se pudo registrar"
    };

    try {
        let existe = await realizarQuery(`
            SELECT * FROM Usuarios WHERE nombre = '${req.body.nombre}' OR contra = '${req.body.contra}'
        `);

        if (existe.length > 0) {
            respuesta.msg = "El nombre de usuario o el email ya están en uso.";
            return res.send(respuesta);
        }

        await realizarQuery(`
            INSERT INTO Usuarios (id_usuario, nombre, contra, mail) VALUES
            ('${req.body.id_usuario}', '${req.body.nombre}', '${req.body.contra}', '${req.body.mail}');
        `);

        respuesta.ok = true;
        respuesta.msg = "Usuario registrado con éxito";
        res.send(respuesta);

    } catch (error) {
        console.error("Error en base de datos:", error);
        respuesta.msg = "Error interno al intentar registrar.";
        res.status(500).send(respuesta);
    }
});

app.get('/chats', async function (req, res) {
    try {
        let chats = await realizarQuery(`SELECT * from Chats INNER JOIN
        UsuarioEnChat ON Chat.id_chat = UsuarioEnChat.id_chat
        INNER JOIN Usuarios ON Usuarios.id_usuario = UsuarioEnChat.id_usuario
        WHERE id_usuario = ${req.query.id_usuario};`);
        console.log("en el back", chats[0]);
        res.send({ chats: chats, status: 1 })
    } catch (error) {
        res.send({ status: -1, error: error.message })
    }
})


app.post('/chatIndividual', async function (req, res) {
    console.log(req.body) 
    let existe = []
    let chat1 = await realizarQuery(`select mail from Usuarios where mail = "${req.body.mail}"`)
    if (chat1.length > 0) {
        existe = await realizarQuery(`
            SELECT * FROM UsuariosEnChat WHERE id_usuario = ${id_u[0].id} AND ranking = ${req.body.ranking}
            AND hora_final = NOW();
        `)

    }
    console.log(existe)
    if (existe.length > 0) {
        res.send({ message: "Ya existe" })

    } else {
        await realizarQuery(`
        INSERT INTO Partidas (id_usuario,ranking) VALUES
        (${id_u[0].id},${Number(req.body.ranking)})
    `)
        res.send({ message: "Se agregado" });
    }
})