'use client';
import React, { useEffect, useState } from "react";
import ChatList from "../../components/ChatList";


function Chat() {

  const [chats, setChats] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Por ahora usamos un ID fijo para probar.
  // Después lo vamos a obtener del usuario logueado.
  const idUsuario = 1;

  useEffect(() => {

    async function obtenerChat() {

      try {

        const respuesta = await fetch(
          `http://localhost:4000/chats?id_usuario=${idUsuario}`,
          {
            credentials: "include"
          }
        );

        const datos = await respuesta.json();

        console.log("Chats recibidos:", datos);

        if (datos.status === 1) {
          setChats(datos.chats);
        }

      } catch (error) {

        console.error(
          "Error obteniendo los chats:",
          error
        );

      } finally {

        setCargando(false);

      }
    }

    obtenerChat();

  }, []);

  if (cargando) {
    return <p>Cargando chats...</p>;
  }

  return (
    <div>

      <h1>Mis chats</h1>

      <ChatList chats={chats} />

    </div>
  );
}

export default Chat;
