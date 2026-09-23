'use client';

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Message from "../../../components/Message";

function Chat() {

  const params = useParams();
  const idChat = params.idChat;

  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);

  // Por ahora lo dejamos fijo para probar.
  // Después lo vamos a obtener del usuario logueado.
  const idUsuario = 1;

  useEffect(() => {

    async function obtenerMensajes() {

      try {

        const respuesta = await fetch(
          `http://localhost:4000/chats/${idChat}/mensajes`,
          {
            credentials: "include"
          }
        );

        const datos = await respuesta.json();

        console.log("Mensajes recibidos:", datos);

        if (datos.status === 1) {
          setMensajes(datos.mensajes);
        }

      } catch (error) {

        console.error(
          "Error obteniendo los mensajes:",
          error
        );

      } finally {

        setCargando(false);

      }
    }

    obtenerMensajes();

  }, [idChat]);


  function enviarMensaje() {

    if (mensaje.trim() === "") {
      return;
    }

    console.log("Mensaje:", mensaje);

    // Acá después vamos a poner el WebSocket.

    setMensaje("");
  }


  if (cargando) {
    return <p>Cargando mensajes...</p>;
  }


  return (
    <div>

      <h1>Chat</h1>

      <div>

        {mensajes.map((mensaje) => (
          <Message
            key={mensaje.id_mensaje}
            mensaje={mensaje}
            idUsuario={idUsuario}
          />
        ))}

      </div>

      <div>

        <input
          type="text"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Escribí un mensaje"
        />

        <button onClick={enviarMensaje}>
          Enviar
        </button>

      </div>

    </div>
  );
}

export default Chat;