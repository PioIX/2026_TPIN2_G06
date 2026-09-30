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
// MANEJO DE EVENTOS DE SOCKET.IO
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

  // Evento para que el usuario se una a la sala de un chat específico
  socket.on("join_chat", (id_chat) => {
    socket.join(`chat_${id_chat}`);
    console.log(`Socket ${socket.id} se unió a la sala: chat_${id_chat}`);
  });

  // Evento para enviar un mensaje en tiempo real y guardarlo en la DB
  socket.on("send_message", async (data, callback) => {
    const { id_chat, id_emisor, contenido } = data;

    try {
      // 1. Guardar el mensaje en la base de datos
      const resultado = await realizarQuery(
        "INSERT INTO Mensajes (id_chat, id_emisor, contenido) VALUES (?, ?, ?)",
        [id_chat, id_emisor, contenido]
      );

      // 2. Consultar datos del emisor para adjuntarlos al evento emitido
      const emisor = await realizarQuery(
        "SELECT nombre, foto_perfil FROM Usuarios WHERE id_usuario = ?",
        [id_emisor]
      );

      const nuevoMensaje = {
        id_mensaje: resultado.insertId,
        id_chat,
        id_emisor,
        contenido,
        fecha_hora: new Date(),
        nombre: emisor[0]?.nombre,
        foto_perfil: emisor[0]?.foto_perfil,
      };

      // 3. Emitir a TODOS los conectados en la sala del chat
      io.to(`chat_${id_chat}`).emit("receive_message", nuevoMensaje);

      if (callback) callback({ ok: true, mensaje: nuevoMensaje });
    } catch (error) {
      console.error("❌ Error al guardar/enviar mensaje:", error);
      if (callback) callback({ ok: false, msg: "Error al procesar el mensaje." });
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
        return res.send({respuesta, existe});
    } catch (error) {
        console.log(error.message)
        res.send({ message: "usuario no existe registrate", ok: false });
    }
});

app.get('/chats', async function (req, res) {
    try {
        let chats = await realizarQuery(`SELECT * from Chats INNER JOIN
        UsuarioEnChat ON Chats.id_chat = UsuarioEnChat.id_chat
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
    let chat1 = await realizarQuery(`select id_usuario, nombre from Usuarios where mail = "${req.body.mail}"`)
    if (chat1.length > 0) {
        existe = await realizarQuery(`
            SELECT * FROM UsuariosEnChat WHERE id_usuario = ${chat1[0].id_usuario};
        `)
    }
    console.log(existe)
    if (existe.length > 0) {
        res.send({ message: "Ya existe" })
    } else {
      await realizarQuery(`
        INSERT INTO Chats (nom_grupo) VALUES
        ('${chat1[0].nombre}')`)

        let chat = await realizarQuery(`select id_chat from Chats`)
        await realizarQuery(`
        INSERT INTO UsuariosEnChat (id_usuario, id_chat) VALUES
        (${chat1[0].id_usuario}, ${chat[chat.length - 1].id_chat})
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

// =========================================================
// NUEVOS ENDPOINTS REST REQUERIDOS
// =========================================================

// Crear un chat grupal a partir de múltiples mails
app.post("/chatGrupal", async (req, res) => {
  const { id_creador, mails, nombre_grupal } = req.body;

  if (!mails || !Array.isArray(mails) || mails.length === 0) {
    return res.status(400).json({ ok: false, msg: "Se requiere un array de mails." });
  }

  try {
    const placeholders = mails.map(() => "?").join(",");
    const usuarios = await realizarQuery(
      `SELECT id_usuario FROM Usuarios WHERE mail IN (${placeholders})`,
      mails
    );

    const idsParticipantes = new Set(usuarios.map((u) => u.id_usuario));
    idsParticipantes.add(Number(id_creador));

    const resultadoChat = await realizarQuery(
      "INSERT INTO Chats (es_grupal, nombre_chat) VALUES (1, ?)",
      [nombre_grupal || "Nuevo Grupo"]
    );
    const id_chat = resultadoChat.insertId;

    for (const id_usuario of idsParticipantes) {
      await realizarQuery(
        "INSERT INTO UsuarioEnChat (id_chat, id_usuario) VALUES (?, ?)",
        [id_chat, id_usuario]
      );
    }

    res.json({ ok: true, msg: "Chat grupal creado con éxito", id_chat });
  } catch (error) {
    console.error("Error en /chatGrupal:", error);
    res.status(500).json({ ok: false, msg: "Error al crear el chat grupal." });
  }
});

// Historial de mensajes de un chat
app.get("/mensajes/:id_chat", async (req, res) => {
  const { id_chat } = req.params;

  try {
    const mensajes = await realizarQuery(
      `SELECT m.id_mensaje, m.id_chat, m.id_emisor, m.contenido, m.fecha_hora, u.nombre, u.foto_perfil
       FROM Mensajes m
       JOIN Usuarios u ON m.id_emisor = u.id_usuario
       WHERE m.id_chat = ?
       ORDER BY m.fecha_hora ASC`,
      [id_chat]
    );

    res.json({ ok: true, mensajes });
  } catch (error) {
    console.error("Error en /mensajes:", error);
    res.status(500).json({ ok: false, msg: "Error al recuperar el historial." });
  }
});