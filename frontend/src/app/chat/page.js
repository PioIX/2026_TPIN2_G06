'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const { usuario, socket, logoutUser } = useAuth();
  const router = useRouter();

  // Estado del Chat
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");

  // Estado Modales
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

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  // Helper para normalizar respuestas de arrays del Backend
  const normalizarArray = (data) => {
    if (Array.isArray(data)) return data;
    return data?.mensajes || data?.chats || data?.resultado || data?.data || [];
  };

  // 1. Redirección si no hay usuario logueado
  useEffect(() => {
    if (!usuario) {
      router.push('/login');
    } else {
      cargarChats(usuario.id_usuario);
    }
  }, [usuario]);

  // 2. Escuchar mensajes por WebSockets en tiempo real
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msj) => {
      if (activeChat && msj.id_chat === activeChat.id_chat) {
        setMensajes((prev) => [...prev, msj]);
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, activeChat]);

  // Obtener lista de chats del usuario desde el Backend
  const cargarChats = async (idUserExplicit) => {
    const id = idUserExplicit || usuario?.id_usuario;
    if (!id) return;

    try {
      const res = await fetch(`http://localhost:4000/chats?id_usuario=${id}`);
      const data = await res.json();
      setChats(normalizarArray(data));
    } catch (error) {
      console.error("Error cargando lista de chats:", error);
    }
  };

  // Seleccionar un chat, unirse al cuarto en Socket.IO y traer historial
  const seleccionarChat = async (chat) => {
    setActiveChat(chat);
    setMensajes([]);

    if (socket && chat.id_chat) {
      socket.emit("join_chat", chat.id_chat);
    }

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

  // Enviar mensaje a través de WebSockets
  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !activeChat?.id_chat || !socket) return;

    const mensajeTexto = nuevoMensaje;
    setNuevoMensaje("");

    const dataMsg = {
      id_chat: activeChat.id_chat,
      id_emisor: usuario.id_usuario,
      contenido: mensajeTexto
    };

    socket.emit("send_message", dataMsg, (res) => {
      if (!res.ok) {
        console.error("Error guardando el mensaje:", res.msg);
      }
    });
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

  if (!usuario) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f3f4f6', color: '#000' }}>
      
      {/* Panel Izquierdo: Lista de Chats */}
      <div style={{ width: '35%', backgroundColor: '#ffffff', borderRight: '1px solid #d1d5db', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header Usuario */}
        <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderBottom: '1px solid #d1d5db', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderAvatar(usuario, 34)}
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{usuario.username || usuario.nombre || "Mi Cuenta"}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
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
            <button
              onClick={logoutUser}
              style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Salir
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
                        {!esPropio && m.nombre && (
                          <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#4b5563' }}>
                            {m.nombre}
                          </div>
                        )}
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
    </div>
  );
}