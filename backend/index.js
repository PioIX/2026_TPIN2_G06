/*const express = require("express");
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
                SELECT id_chat FROM UsuarioEnChat WHERE id_usuario = ${id_usuario}
            ) AND uc.id_usuario != ${id_usuario};
        `);

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
            `SELECT id_usuario, nombre, foto_perfil FROM Usuarios WHERE mail = '${mail}'`
        );

        if (!usuarioDestino || !Array.isArray(usuarioDestino) || usuarioDestino.length === 0) {
            return res.send({ ok: false, message: "El usuario no existe." });
        }

        const idDestino = usuarioDestino[0].id_usuario;
        const nombreDestino = usuarioDestino[0].nombre || mail;
        const fotoDestino = usuarioDestino[0].foto_perfil || "";

        // 2. Verificar si ya existe chat individual entre ambos
        let chatExistente = await realizarQuery(`
            SELECT uc1.id_chat 
            FROM UsuarioEnChat uc1
            JOIN UsuarioEnChat uc2 ON uc1.id_chat = uc2.id_chat
            WHERE uc1.id_usuario = ${id_usuario} AND uc2.id_usuario = ${idDestino}
        `);

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
            `INSERT INTO Chats (nom_grupo, es_grupal) VALUES ('${nombreDestino}', 0)`
        );

        let id_chat = resultInsert ? resultInsert.insertId : null;
        if (!id_chat) {
            let ultimoChat = await realizarQuery(`SELECT MAX(id_chat) as id FROM Chats`);
            id_chat = (ultimoChat && Array.isArray(ultimoChat) && ultimoChat[0]) ? ultimoChat[0].id : Date.now();
        }

        // 4. Agregar a ambos en UsuarioEnChat
        await realizarQuery(
            `INSERT INTO UsuarioEnChat (id_usuario, id_chat) VALUES (${id_usuario}, ${id_chat})`
        );
        await realizarQuery(
            `INSERT INTO UsuarioEnChat (id_usuario, id_chat) VALUES (${idDestino}, ${id_chat})`
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

<<<<<<< Updated upstream
// POST /chatGrupal - Crear un chat grupal
app.post("/chatGrupal", async (req, res) => {
    const { id_creador, mails, nombre_grupal } = req.body;

    if (!mails || !Array.isArray(mails) || mails.length === 0) {
        return res.status(400).json({ ok: false, msg: "Se requiere un array de mails." });
=======
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

// Obtener chats de un usuario (Individuales y Grupales)
app.get('/chats', async function (req, res) {
  const { id_usuario } = req.query;
  try {
    let chats = await realizarQuery(`
      SELECT c.id_chat, c.es_grupo, c.nom_grupo, c.foto_grupo,
             u.nombre AS contacto_nombre, u.foto AS contacto_foto
      FROM Chats c
      JOIN UsuariosEnChat uec ON c.id_chat = uec.id_chat
      LEFT JOIN UsuariosEnChat uec2 ON c.id_chat = uec2.id_chat AND uec2.id_usuario != ? AND c.es_grupo = FALSE
      LEFT JOIN Usuarios u ON uec2.id_usuario = u.id_usuario
      WHERE uec.id_usuario = ?
    `, [id_usuario, id_usuario]);

    const chatsFormateados = chats.map(c => ({
      id_chat: c.id_chat,
      es_grupo: Boolean(c.es_grupo),
      nombre: c.es_grupo ? c.nom_grupo : c.contacto_nombre,
      foto: c.es_grupo ? (c.foto_grupo || '/default-group.png') : (c.contacto_foto || '/default-avatar.png')
    }));

    res.send({ chats: chatsFormateados, status: 1 });
  } catch (error) {
    res.status(500).send({ status: -1, error: error.message });
  }
});

// Crear Chat Individual
app.post('/chatIndividual', async function (req, res) {
  const { id_usuario, mail } = req.body;
  try {
    // 1. Buscar al otro usuario
    let contacto = await realizarQuery(`SELECT id_usuario, nombre FROM Usuarios WHERE mail = ?`, [mail]);
    
    if (contacto.length === 0) {
      return res.status(404).send({ ok: false, message: "El usuario con ese mail no existe" });
    }

    const id_contacto = contacto[0].id_usuario;

    // 2. Crear nuevo Chat
    let nuevoChat = await realizarQuery(`INSERT INTO Chats (es_grupo) VALUES (FALSE)`);
    let id_chat = nuevoChat.insertId;

    // 3. Vincular a AMBOS usuarios en UsuariosEnChat
    await realizarQuery(
      `INSERT INTO UsuariosEnChat (id_usuario, id_chat) VALUES (?, ?), (?, ?)`,
      [id_usuario, id_chat, id_contacto, id_chat]
    );

    res.send({ ok: true, message: "Chat creado con éxito", id_chat });
  } catch (error) {
    res.status(500).send({ ok: false, error: error.message });
  }
});

// Crear Chat Grupal
app.post("/chatGrupal", async (req, res) => {
  const { id_creador, mails, nombre_grupal, foto_grupo } = req.body;

  if (!mails || !Array.isArray(mails) || mails.length === 0) {
    return res.status(400).json({ ok: false, msg: "Se requiere un array de mails válidos." });
  }

  try {
    const placeholders = mails.map(() => "?").join(",");
    const usuarios = await realizarQuery(
      `SELECT id_usuario FROM Usuarios WHERE mail IN (${placeholders})`,
      mails
    );

    if (usuarios.length !== mails.length) {
      return res.status(400).json({ ok: false, msg: "Uno o varios mails no están registrados." });
    }

    const idsParticipantes = new Set(usuarios.map((u) => u.id_usuario));
    idsParticipantes.add(Number(id_creador));

    const resultadoChat = await realizarQuery(
      "INSERT INTO Chats (es_grupo, nom_grupo, foto_grupo) VALUES (TRUE, ?, ?)",
      [nombre_grupal || "Nuevo Grupo", foto_grupo || "/default-group.png"]
    );
    const id_chat = resultadoChat.insertId;

    for (const id_u of idsParticipantes) {
      await realizarQuery(
        "INSERT INTO UsuariosEnChat (id_chat, id_usuario) VALUES (?, ?)",
        [id_chat, id_u]
      );
>>>>>>> Stashed changes
    }

    try {
        const mailsFormatted = mails.map(m => `'${m}'`).join(",");
        const usuarios = await realizarQuery(
            `SELECT id_usuario FROM Usuarios WHERE mail IN (${mailsFormatted})`
        );

        const idsParticipantes = new Set(
            Array.isArray(usuarios) ? usuarios.map((u) => u.id_usuario) : []
        );
        idsParticipantes.add(Number(id_creador));

        const resultadoChat = await realizarQuery(
            `INSERT INTO Chats (es_grupal, nom_grupo) VALUES (1, '${nombre_grupal || "Nuevo Grupo"}')`
        );
        const id_chat = resultadoChat ? resultadoChat.insertId : Date.now();

        for (const id_usr of idsParticipantes) {
            await realizarQuery(
                `INSERT INTO UsuarioEnChat (id_chat, id_usuario) VALUES (${id_chat}, ${id_usr})`
            );
        }

        res.json({ ok: true, msg: "Chat grupal creado con éxito", id_chat });
    } catch (error) {
        console.error("Error en /chatGrupal:", error);
        res.status(500).json({ ok: false, msg: "Error al crear el chat grupal." });
    }
});

<<<<<<< Updated upstream
// POST /mensajes - Guardar un nuevo mensaje en la BD
app.post("/mensajes", async (req, res) => {
    try {
        const { id_chat, id_emisor, contenido } = req.body;

        if (!id_chat || !id_emisor || !contenido) {
            return res.status(400).json({ ok: false, msg: "Faltan datos obligatorios." });
        }

        const textoLimpio = String(contenido).replace(/'/g, "''");

        const resultado = await realizarQuery(`
            INSERT INTO Mensajes (id_chat, id_emisor, contenido, fecha_hora) 
            VALUES (${id_chat}, ${id_emisor}, '${textoLimpio}', NOW())
        `);

        res.json({ 
            ok: true, 
            msg: "Mensaje enviado", 
            id_mensaje: resultado ? resultado.insertId : Date.now() 
        });
    } catch (error) {
        console.error("Error en POST /mensajes:", error);
        res.status(500).json({ ok: false, msg: "Error al guardar el mensaje." });
    }
});

// GET /mensajes/:id_chat - Historial de mensajes
=======
// Historial de Mensajes de un Chat
>>>>>>> Stashed changes
app.get("/mensajes/:id_chat", async (req, res) => {
    const { id_chat } = req.params;

<<<<<<< Updated upstream
    try {
        const mensajes = await realizarQuery(`
            SELECT m.id_mensaje AS id_msj, m.id_chat, m.id_emisor AS id_usuario, m.contenido, m.fecha_hora, u.nombre, u.foto_perfil
            FROM Mensajes m
            JOIN Usuarios u ON m.id_emisor = u.id_usuario
            WHERE m.id_chat = ${id_chat}
            ORDER BY m.fecha_hora ASC
        `);
=======
  try {
    const mensajes = await realizarQuery(
      `SELECT m.id_msj, m.id_chat, m.id_usuario, m.texto, m.fecha_hora, u.username, u.nombre, u.foto
       FROM Mensajes m
       JOIN Usuarios u ON m.id_usuario = u.id_usuario
       WHERE m.id_chat = ?
       ORDER BY m.fecha_hora ASC`,
      [id_chat]
    );
>>>>>>> Stashed changes

        res.json({ ok: true, mensajes: Array.isArray(mensajes) ? mensajes : [] });
    } catch (error) {
        console.error("Error en /mensajes:", error);
        res.status(500).json({ ok: false, msg: "Error al recuperar el historial." });
    }
});