<<<<<<< Updated upstream
'use client';

import { useState, useEffect, useRef } from 'react';

export default function ChatPage() {
  const [usuario, setUsuario] = useState({
    id_usuario: null,
    nombre: "",
    username: "",
    foto: ""
  });
=======
"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import Input from "@/components/Input";
import Button from "@/components/Button";
import ChatList from "@/components/ChatList";
import Message from "@/components/Message";
import NewChatPopup from "@/components/NewChatPopup";

export default function Home() {
  // Estado de sesión y navegación entre Auth / App
  const [user, setUser] = useState(null);
  const [isRegister, setIsRegister] = useState(false);
>>>>>>> Stashed changes

  // Formulario Auth
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [mail, setMail] = useState("");
  const [contra, setContra] = useState("");
  const [foto, setFoto] = useState("");
  const [authError, setAuthError] = useState("");

  // Estado del Chat
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");

<<<<<<< Updated upstream
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoModal, setTipoModal] = useState('individual');
  const [mailIndividual, setMailIndividual] = useState("");
  const [nombreGrupo, setNombreGrupo] = useState("");
  const [mailsGrupo, setMailsGrupo] = useState("");
  const [errorModal, setErrorModal] = useState("");

  const messagesEndRef = useRef(null);

  // Auto-scroll al final de los mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
=======
  const socket = useSocket("http://localhost:4000");
>>>>>>> Stashed changes

  // Cargar lista de chats cuando hay un usuario logueado
  useEffect(() => {
<<<<<<< Updated upstream
    scrollToBottom();
  }, [mensajes]);

  // Helper para normalizar respuestas de arrays del Backend
  const normalizarArray = (data) => {
    if (Array.isArray(data)) return data;
    return data?.mensajes || data?.chats || data?.resultado || data?.data || [];
  };

  // 1. Cargar usuario desde localStorage
  useEffect(() => {
    const userGuardado = localStorage.getItem('usuario');
    if (userGuardado) {
      try {
        const u = JSON.parse(userGuardado);
        setUsuario(u);
        cargarChats(u.id_usuario);
      } catch (e) {
        console.error("Error al parsear usuario desde localStorage:", e);
=======
    if (user) {
      cargarChats();
    }
  }, [user]);

  // Manejo de eventos en tiempo real con Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      if (activeChat && msg.id_chat === activeChat.id_chat) {
        setMensajes((prev) => [...prev, msg]);
>>>>>>> Stashed changes
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, activeChat]);

  // Cargar chats del usuario desde el Backend
  const cargarChats = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:4000/chats?id_usuario=${user.id_usuario}`);
      const data = await res.json();
      if (data.status === 1) {
        setChats(data.chats);
      }
    } catch (err) {
      console.error("Error al cargar los chats:", err);
    }
  };

  // Manejar Login / Registro vı́a HTTP REST
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");

    const endpoint = isRegister ? "/register" : "/login";
    const body = isRegister
      ? { nombre, username: username || nombre, mail, contra, fotoPerfil: foto }
      : { mail, contra };

    try {
      if (isRegister && socket) {
        // Opción vía Socket para Registro según tu backend
        socket.emit("register", { nombre, username: username || nombre, mail, contra, fotoPerfil: foto }, (res) => {
          if (res.ok) {
            alert("Registro exitoso. Ahora podés iniciar sesión.");
            setIsRegister(false);
          } else {
            setAuthError(res.msg);
          }
        });
      } else {
        // Login vía HTTP REST
        const res = await fetch(`http://localhost:4000${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (res.ok && data.ok) {
          setUser(data.usuario);
        } else {
          setAuthError(data.msg || "Error en la autenticación.");
        }
      }
    } catch (err) {
      setAuthError("Error de conexión con el servidor.");
    }
  };

  // Seleccionar un chat e ingresar a su sala en Socket.IO
  const seleccionarChat = async (chat) => {
    setActiveChat(chat);
    if (socket) {
      socket.emit("join_chat", chat.id_chat);
    }
<<<<<<< Updated upstream
  }, []);

  // 2. Polling para refrescar mensajes en tiempo real
  useEffect(() => {
    if (!activeChat?.id_chat) return;

    const fetchMensajesRefrescar = async () => {
      try {
        const res = await fetch(`http://localhost:4000/mensajes/${activeChat.id_chat}`);
        const data = await res.json();
        setMensajes(normalizarArray(data));
      } catch (e) {
        console.error("Error refrescando mensajes:", e);
      }
    };

    fetchMensajesRefrescar();
    const intervalId = setInterval(fetchMensajesRefrescar, 2000);

    return () => clearInterval(intervalId);
  }, [activeChat]);

  // Obtener lista de chats del usuario
  const cargarChats = async (idUserExplicit) => {
    const id = idUserExplicit || usuario.id_usuario;
    if (!id) return;

    try {
      const res = await fetch(`http://localhost:4000/chats?id_usuario=${id}`);
      const data = await res.json();
      setChats(normalizarArray(data));
    } catch (error) {
      console.error("Error cargando lista de chats:", error);
    }
  };

  // Seleccionar chat y traer historial inicial
  const seleccionarChat = async (chat) => {
    setActiveChat(chat);
    setMensajes([]);

    if (!chat.id_chat) return;

    try {
      const res = await fetch(`http://localhost:4000/mensajes/${chat.id_chat}`);
      const data = await res.json();
      setMensajes(normalizarArray(data));
    } catch (e) {
      console.error("Error cargando mensajes:", e);
    }
  };

  // Crear o abrir Chat Individual
  const handleCrearIndividual = async (e) => {
    e.preventDefault();
    setErrorModal("");
    const mail = mailIndividual.trim();

    if (!mail) return setErrorModal("Ingresá un mail.");
    if (!usuario?.id_usuario) {
      return setErrorModal("No se detectó tu sesión. Volvé a ingresar.");
    }

    try {
      const res = await fetch("http://localhost:4000/chatIndividual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: usuario.id_usuario, mail: mail }),
      });
      const data = await res.json();

      if (data.ok) {
        const chatObj = {
          id_chat: data.id_chat,
          nombre: data.nombre || mail,
          es_grupal: false,
          foto: data.foto || ""
        };

        setMailIndividual("");
        setModalAbierto(false);
        await cargarChats(usuario.id_usuario);
        seleccionarChat(chatObj);
      } else {
        setErrorModal(data.message || data.msg || "El usuario no existe.");
      }
    } catch (err) {
      setErrorModal("Error de conexión con el servidor.");
    }
  };

  // Crear Chat Grupal
  const handleCrearGrupo = async (e) => {
    e.preventDefault();
    setErrorModal("");
    if (!nombreGrupo.trim() || !mailsGrupo.trim()) {
      return setErrorModal("Completá todos los campos.");
    }

    const arrayMails = mailsGrupo.split(",").map((m) => m.trim()).filter(Boolean);

    try {
      const res = await fetch("http://localhost:4000/chatGrupal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_creador: usuario.id_usuario,
          mails: arrayMails,
          nombre_grupal: nombreGrupo.trim()
        }),
      });
      const data = await res.json();

      if (data.ok) {
        const grupoObj = {
          id_chat: data.id_chat,
          nombre: nombreGrupo.trim(),
          es_grupal: true
        };

        setNombreGrupo("");
        setMailsGrupo("");
        setModalAbierto(false);
        await cargarChats(usuario.id_usuario);
        seleccionarChat(grupoObj);
      } else {
        setErrorModal(data.msg || "Error al crear el grupo.");
      }
    } catch (err) {
      setErrorModal("Error al conectar con el servidor.");
    }
  };

  // Enviar mensaje a la BD y actualizar estado
  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !activeChat?.id_chat) return;

    const mensajeTexto = nuevoMensaje;
    setNuevoMensaje("");

    try {
      const res = await fetch("http://localhost:4000/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_chat: activeChat.id_chat,
          id_emisor: usuario.id_usuario,
          contenido: mensajeTexto
        })
      });

      const data = await res.json();

      if (data.ok) {
        const resMsjs = await fetch(`http://localhost:4000/mensajes/${activeChat.id_chat}`);
        const dataMsjs = await resMsjs.json();
        setMensajes(normalizarArray(dataMsjs));
      } else {
        console.error("Error guardando el mensaje:", data.msg);
      }
    } catch (err) {
      console.error("Error enviando mensaje:", err);
    }
  };

  // Helper para renderizar fotos o iniciales
  const renderAvatar = (item, size = 38) => {
    const fotoUrl = item?.foto || item?.foto_perfil;
    const nombreMostrar = item?.nombre || item?.username || item?.mail || "?";

    if (fotoUrl) {
      return (
        <img
          src={fotoUrl}
          alt={nombreMostrar}
          style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', objectFit: 'cover' }}
        />
      );
    }

    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: '#6b7280',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: `${size / 2.3}px`
      }}>
        {nombreMostrar[0]?.toUpperCase() || 'C'}
      </div>
    );
  };
=======

    try {
      const res = await fetch(`http://localhost:4000/mensajes/${chat.id_chat}`);
      const data = await res.json();
      if (data.ok) {
        setMensajes(data.mensajes);
      }
    } catch (err) {
      console.error("Error al cargar el historial:", err);
    }
  };

  // Enviar mensaje mediante Socket.IO
  const enviarMensaje = (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !activeChat || !socket) return;

    socket.emit("send_message", {
      id_chat: activeChat.id_chat,
      id_usuario: user.id_usuario,
      contenido: nuevoMensaje,
    });

    setNuevoMensaje("");
  };

  // -------------------------------------------------------------
  // VISTA 1: FORMULARIO DE LOGIN / REGISTRO
  // -------------------------------------------------------------
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 p-4">
        <form onSubmit={handleAuth} className="p-6 bg-white rounded-lg shadow-lg w-full max-w-sm space-y-4">
          <h2 className="text-2xl font-bold text-center text-gray-800">
            {isRegister ? "Crear Cuenta" : "Pio Chat"}
          </h2>

          {authError && <p className="text-red-500 text-xs text-center font-medium">{authError}</p>}

          {isRegister && (
            <>
              <Input
                placeholder="Nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
              <Input
                placeholder="Nombre de usuario (Username)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <Input
                placeholder="URL Foto de perfil (Opcional)"
                value={foto}
                onChange={(e) => setFoto(e.target.value)}
              />
            </>
          )}

          <Input
            type="email"
            placeholder="Correo electrónico"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={contra}
            onChange={(e) => setContra(e.target.value)}
            required
          />

          <Button type="submit" className="w-full font-semibold">
            {isRegister ? "Registrarse" : "Iniciar Sesión"}
          </Button>

          <p
            onClick={() => {
              setIsRegister(!isRegister);
              setAuthError("");
            }}
            className="text-xs text-blue-600 hover:underline cursor-pointer text-center"
          >
            {isRegister ? "¿Ya tenés cuenta? Iniciá sesión" : "¿No tenés cuenta? Registrate acá"}
          </p>
        </form>
      </div>
    );
  }
>>>>>>> Stashed changes

  // -------------------------------------------------------------
  // VISTA 2: APLICACIÓN PRINCIPAL DE CHAT
  // -------------------------------------------------------------
  return (
<<<<<<< Updated upstream
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f3f4f6', color: '#000' }}>
      
      {/* Panel Izquierdo: Lista de Chats */}
      <div style={{ width: '35%', backgroundColor: '#ffffff', borderRight: '1px solid #d1d5db', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header Usuario */}
        <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderBottom: '1px solid #d1d5db', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderAvatar(usuario, 34)}
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{usuario.username || usuario.nombre || "Mi Cuenta"}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => { setTipoModal('individual'); setErrorModal(""); setModalAbierto(true); }}
              style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              + Chat
            </button>
            <button
              onClick={() => { setTipoModal('grupo'); setErrorModal(""); setModalAbierto(true); }}
              style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              + Grupo
            </button>
          </div>
        </div>

        {/* Lista de Chats */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {chats.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
              No tenés chats. Creá uno nuevo usando los botones de arriba.
            </div>
          ) : (
            chats.map((c, i) => (
              <div
                key={c.id_chat || i}
                onClick={() => seleccionarChat(c)}
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  backgroundColor: activeChat?.id_chat === c.id_chat ? '#dbeafe' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                {renderAvatar(c, 40)}
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{c.nombre || "Chat"}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{c.es_grupal ? 'Grupo' : 'Chat Individual'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Panel Derecho: Conversación */}
      <div style={{ width: '65%', display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb' }}>
        {activeChat ? (
          <>
            <div style={{ padding: '12px 16px', backgroundColor: '#ffffff', borderBottom: '1px solid #d1d5db', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {renderAvatar(activeChat, 36)}
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{activeChat.nombre}</span>
            </div>

            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mensajes.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', marginTop: 'auto', marginBottom: 'auto' }}>
                  Sin mensajes. ¡Escribí algo!
                </div>
              ) : (
                mensajes.map((m, idx) => {
                  const esPropio = Number(m.id_usuario || m.id_emisor) === Number(usuario.id_usuario);
                  return (
                    <div key={m.id_msj || m.id_mensaje || idx} style={{ display: 'flex', justifyContent: esPropio ? 'flex-end' : 'flex-start' }}>
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          maxWidth: '65%',
                          backgroundColor: esPropio ? '#2563eb' : '#ffffff',
                          color: esPropio ? '#ffffff' : '#000000',
                          border: esPropio ? 'none' : '1px solid #d1d5db',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                      >
                        {m.contenido}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={enviarMensaje} style={{ padding: '12px', backgroundColor: '#ffffff', borderTop: '1px solid #d1d5db', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Escribí un mensaje..."
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                style={{ flex: 1, border: '1px solid #9ca3af', padding: '10px', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
              />
              <button
                type="submit"
                style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280', fontSize: '15px' }}>
            Seleccioná un chat para comenzar a hablar.
          </div>
        )}
      </div>

      {/* Modal para Crear Chats */}
      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                {tipoModal === 'individual' ? 'Nuevo Chat Individual' : 'Nuevo Grupo'}
              </h3>
              <button onClick={() => setModalAbierto(false)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>

            {errorModal && <p style={{ color: '#ef4444', fontSize: '12px', margin: 0 }}>{errorModal}</p>}

            {tipoModal === 'individual' ? (
              <form onSubmit={handleCrearIndividual} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="email"
                  placeholder="Mail del destinatario"
                  value={mailIndividual}
                  onChange={(e) => setMailIndividual(e.target.value)}
                  style={{ border: '1px solid #d1d5db', padding: '8px', borderRadius: '4px', fontSize: '14px' }}
                  required
                />
                <button type="submit" style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Crear e Ir al Chat
                </button>
              </form>
            ) : (
              <form onSubmit={handleCrearGrupo} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Nombre del Grupo"
                  value={nombreGrupo}
                  onChange={(e) => setNombreGrupo(e.target.value)}
                  style={{ border: '1px solid #d1d5db', padding: '8px', borderRadius: '4px', fontSize: '14px' }}
                  required
                />
                <input
                  type="text"
                  placeholder="Mails separados por coma"
                  value={mailsGrupo}
                  onChange={(e) => setMailsGrupo(e.target.value)}
                  style={{ border: '1px solid #d1d5db', padding: '8px', borderRadius: '4px', fontSize: '14px' }}
                  required
                />
                <button type="submit" style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Crear Grupo e Ir
                </button>
              </form>
            )}
          </div>
        </div>
      )}
=======
    <div className="flex h-screen bg-gray-200">
      {/* Sidebar Izquierda: Perfil y Lista de Chats */}
      <div className="w-1/3 bg-white border-r border-gray-300 flex flex-col">
        {/* Cabecera del usuario */}
        <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <img
              src={user.foto || user.foto_perfil || "/default-profile.png"}
              alt={user.nombre}
              className="w-10 h-10 rounded-full object-cover border"
            />
            <span className="font-bold text-gray-800 text-sm">{user.username || user.nombre}</span>
          </div>

          {/* Modal para crear chat individual o grupal */}
          <NewChatPopup idUsuario={user.id_usuario} onChatCreated={cargarChats} />
        </div>

        {/* Lista de Chats */}
        <div className="flex-1 overflow-y-auto">
          <ChatList chats={chats} onSelectChat={seleccionarChat} />
        </div>
      </div>

      {/* Panel Derecho: Área de conversación */}
      <div className="w-2/3 flex flex-col justify-between bg-gray-50">
        {activeChat ? (
          <>
            {/* Header del Chat activo */}
            <div className="p-3 bg-white border-b border-gray-300 flex items-center gap-3 shadow-sm">
              <img
                src={activeChat.foto || "/default-profile.png"}
                alt={activeChat.nombre}
                className="w-10 h-10 rounded-full object-cover border"
              />
              <div>
                <h3 className="font-bold text-gray-800">{activeChat.nombre}</h3>
                <p className="text-xs text-gray-500">
                  {activeChat.es_grupo ? "Grupo" : "Chat individual"}
                </p>
              </div>
            </div>

            {/* Mensajes del Chat */}
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {mensajes.map((m) => (
                <Message
                  key={m.id_msj || m.id_mensaje}
                  mensaje={m}
                  esPropio={m.id_usuario === user.id_usuario || m.id_emisor === user.id_usuario}
                />
              ))}
            </div>

            {/* Input para enviar un nuevo mensaje */}
            <form onSubmit={enviarMensaje} className="p-3 bg-white flex gap-2 border-t border-gray-300">
              <Input
                placeholder="Escribí un mensaje..."
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
              />
              <Button type="submit">Enviar</Button>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 font-medium">
            Seleccioná un chat de la lista para empezar a escribir
          </div>
        )}
      </div>
>>>>>>> Stashed changes
    </div>
  );
}