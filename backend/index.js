const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { Server } = require("socket.io");
const { realizarQuery } = require("./modulos/mysql");

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

// =========================================================
// MANEJO DE REGISTRO MEDIANTE SOCKET.IO
// =========================================================
io.on("connection", (socket) => {
  console.log("🟢 Nuevo cliente conectado por Socket.IO con ID:", socket.id);

  socket.on("register", async (data, callback) => {
    console.log("📥 Datos recibidos en el servidor:", data);

    const foto = data.fotoPerfil || '/default-profile.png';

    try {
      // 1. Verificar si el usuario o mail ya existe
      let existe = await realizarQuery(`
        SELECT * FROM Usuarios WHERE nombre = '${data.nombre}' OR mail = '${data.mail}'
      `);

      if (existe.length > 0) {
        console.log("⚠️ El usuario o mail ya existe");
        return callback({
          ok: false,
          msg: "El nombre de usuario o el email ya están en uso."
        });
      }

      // 2. Insertar nuevo usuario con su foto
      await realizarQuery(`
        INSERT INTO Usuarios (nombre, contra, mail, foto_perfil) VALUES
        ('${data.nombre}', '${data.contra}', '${data.mail}', '${foto}');
      `);

      console.log("✅ Usuario insertado con éxito en MySQL");
      callback({
        ok: true,
        msg: "Usuario registrado con éxito",
        usuario: { nombre: data.nombre, mail: data.mail, foto_perfil: foto }
      });

    } catch (error) {
      console.error("❌ Error en MySQL:", error);
      callback({
        ok: false,
        msg: "Error interno al intentar registrar."
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado:", socket.id);
  });
});

// =========================================================
// RUTAS EXPRESS INTACTAS
// =========================================================

app.post('/login', async function (req, res) {
    console.log(req.body);
    try {
      let respuesta = {
            ok: false,
            msg: "No se pudo loguear"
        };
        let existe = await realizarQuery(`
            SELECT * FROM Usuarios WHERE mail = '${req.body.mail}' AND contra = '${req.body.contra}'
        `);

        if (existe.length > 0) {
            respuesta.msg = "El usuario existe.";
            respuesta.ok = true
        }
        return res.send(respuesta);
    } catch (error) {
        console.log(error.message)
        res.send({ message: "usuario no existe registrate", ok: false });
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
});

app.post('/chatIndividual', async function (req, res) {
    console.log(req.body) 
    let existe = []
    let chat1 = await realizarQuery(`select mail from Usuarios where mail = "${req.body.mail}"`)
    if (chat1.length > 0) {
        existe = await realizarQuery(`
            SELECT * FROM UsuariosEnChat WHERE id_usuario = ${id_u[0].id};
        `)
    }
    console.log(existe)
    if (existe.length > 0) {
        res.send({ message: "Ya existe" })
    } else {
        await realizarQuery(`
        INSERT INTO Partidas (id_usuario) VALUES
        (${id_u[0].id})
    `)
        res.send({ message: "Se ha agregado" });
    }
});

app.post("/usuarios", (req, res) => {
    console.log("Usuario recibido:", req.body);
    res.json({
        mensaje: "Usuario registrado correctamente",
        usuario: req.body
    });
});