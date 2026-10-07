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
// GET /chats - Cargar lista de chats
app.get('/chats', async function (req, res) {
  try {
    const id_usuario = req.query.id_usuario;
    if (!id_usuario) {
      return res.send({ chats: [], status: 1 });
    }

    let chats = await realizarQuery(`
      SELECT 
        c.id_chat, 
        c.nom_grupo AS nombre, 
        c.es_grupal,
        u.foto_perfil AS foto
      FROM Chats c
      INNER JOIN UsuarioEnChat uc ON c.id_chat = uc.id_chat
      INNER JOIN Usuarios u ON u.id_usuario = uc.id_usuario
      WHERE uc.id_chat IN (
        SELECT id_chat FROM UsuarioEnChat WHERE id_usuario = ?
      ) AND uc.id_usuario != ?
    `, [id_usuario, id_usuario]);

    res.send({ chats: Array.isArray(chats) ? chats : [], status: 1 });
  } catch (error) {
    console.error("Error en /chats:", error);
    res.send({ chats: [], status: -1, error: error.message });
  }
});

// POST /chatIndividual - Crear o abrir chat
app.post('/chatIndividual', async function (req, res) {
  try {
    const { id_usuario, mail } = req.body;

    if (!id_usuario || !mail) {
      return res.send({ ok: false, message: "Faltan datos de usuario o mail." });
    }

    // 1. Buscar al usuario por su mail
    let usuarioDestino = await realizarQuery(
      "SELECT id_usuario, nombre, foto_perfil FROM Usuarios WHERE mail = ?",
      [mail]
    );

    if (!usuarioDestino || !Array.isArray(usuarioDestino) || usuarioDestino.length === 0) {
      return res.send({ ok: false, message: "El usuario no existe." });
    }

    const idDestino = usuarioDestino[0].id_usuario;
    const nombreDestino = usuarioDestino[0].nombre || mail;
    const fotoDestino = usuarioDestino[0].foto_perfil || "/default-profile.png";

    // 2. Verificar si ya existe chat individual entre ambos
    let chatExistente = await realizarQuery(`
      SELECT uc1.id_chat 
      FROM UsuarioEnChat uc1
      JOIN UsuarioEnChat uc2 ON uc1.id_chat = uc2.id_chat
      JOIN Chats c ON c.id_chat = uc1.id_chat
      WHERE uc1.id_usuario = ? AND uc2.id_usuario = ? AND c.es_grupal = 0
    `, [id_usuario, idDestino]);

    if (chatExistente && Array.isArray(chatExistente) && chatExistente.length > 0) {
      return res.send({ 
        ok: true, 
        message: "Ya existe el chat", 
        id_chat: chatExistente[0].id_chat,
        nombre: nombreDestino,
        foto: fotoDestino 
      });
    }

    // 3. Crear el nuevo Chat
    let resultInsert = await realizarQuery(
      "INSERT INTO Chats (nom_grupo, es_grupal) VALUES (?, 0)",
      [nombreDestino]
    );

    let id_chat = resultInsert.insertId;

    // 4. Agregar a ambos en UsuarioEnChat
    await realizarQuery(
      "INSERT INTO UsuarioEnChat (id_usuario, id_chat) VALUES (?, ?), (?, ?)",
      [id_usuario, id_chat, idDestino, id_chat]
    );

    res.send({ 
      ok: true, 
      message: "Chat creado con éxito", 
      id_chat: id_chat,
      nombre: nombreDestino,
      foto: fotoDestino 
    });

  } catch (error) {
    console.error("Error en /chatIndividual:", error);
    res.send({ ok: false, message: "Error interno: " + error.message });
  }
});

// POST /chatGrupal - Crear un chat grupal
app.post("/chatGrupal", async (req, res) => {
  const { id_creador, mails, nombre_grupal } = req.body;

  if (!mails || !Array.isArray(mails) || mails.length === 0) {
    return res.status(400).json({ ok: false, msg: "Se requiere un array de mails." });
  }

  try {
    const usuarios = await realizarQuery(
      "SELECT id_usuario FROM Usuarios WHERE mail IN (?)",
      [mails]
    );

    const idsParticipantes = new Set(
      Array.isArray(usuarios) ? usuarios.map((u) => u.id_usuario) : []
    );
    idsParticipantes.add(Number(id_creador));

    const resultadoChat = await realizarQuery(
      "INSERT INTO Chats (es_grupal, nom_grupo) VALUES (1, ?)",
      [nombre_grupal || "Nuevo Grupo"]
    );
    const id_chat = resultadoChat.insertId;

    for (const id_usr of idsParticipantes) {
      await realizarQuery(
        "INSERT INTO UsuarioEnChat (id_chat, id_usuario) VALUES (?, ?)",
        [id_chat, id_usr]
      );
    }

    res.json({ ok: true, msg: "Chat grupal creado con éxito", id_chat });
  } catch (error) {
    console.error("Error en /chatGrupal:", error);
    res.status(500).json({ ok: false, msg: "Error al crear el chat grupal." });
  }
});

// POST /mensajes - Guardar un nuevo mensaje en la BD
app.post("/mensajes", async (req, res) => {
  try {
    const { id_chat, id_emisor, contenido } = req.body;

    if (!id_chat || !id_emisor || !contenido) {
      return res.status(400).json({ ok: false, msg: "Faltan datos obligatorios." });
    }

    const resultado = await realizarQuery(
      "INSERT INTO Mensajes (id_chat, id_emisor, contenido, fecha_hora) VALUES (?, ?, ?, NOW())",
      [id_chat, id_emisor, contenido]
    );

    res.json({ 
      ok: true, 
      msg: "Mensaje enviado", 
      id_mensaje: resultado.insertId 
    });
  } catch (error) {
    console.error("Error en POST /mensajes:", error);
    res.status(500).json({ ok: false, msg: "Error al guardar el mensaje." });
  }
});

// GET /mensajes/:id_chat - Historial de mensajes
app.get("/mensajes/:id_chat", async (req, res) => {
  const { id_chat } = req.params;

  try {
    const mensajes = await realizarQuery(`
      SELECT m.id_mensaje AS id_msj, m.id_chat, m.id_emisor AS id_usuario, m.contenido, m.fecha_hora, u.nombre, u.foto_perfil
      FROM Mensajes m
      JOIN Usuarios u ON m.id_emisor = u.id_usuario
      WHERE m.id_chat = ?
      ORDER BY m.fecha_hora ASC
    `, [id_chat]);

    res.json({ ok: true, mensajes: Array.isArray(mensajes) ? mensajes : [] });
  } catch (error) {
    console.error("Error en /mensajes:", error);
    res.status(500).json({ ok: false, msg: "Error al recuperar el historial." });
  }
});