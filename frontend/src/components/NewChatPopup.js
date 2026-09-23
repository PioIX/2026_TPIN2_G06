import React, { useState } from "react";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";

function NewChatPopup({ idUsuario, actualizarChats }) {

  const [mail, setMail] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function crearChat() {

    setMensaje("");

    if (!mail) {
      setMensaje("Ingresá un email.");
      return;
    }

    try {

      const respuesta = await fetch(
        "http://localhost:4000/chatIndividual",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          credentials: "include",

          body: JSON.stringify({
            mail: mail,
            id_usuario: idUsuario
          })
        }
      );

      const datos = await respuesta.json();

      if (!datos.ok) {
        setMensaje(datos.msg);
        return;
      }

      setMensaje("Chat creado correctamente.");

      setMail("");

      // Volvemos a pedir los chats
      await actualizarChats();

    } catch (error) {

      console.error(error);

      setMensaje(
        "Ocurrió un error al crear el chat."
      );

    }
  }

  return (

    <Popup
      trigger={
        <button>
          + Nuevo chat
        </button>
      }
      modal
      nested
    >

      {(close) => (

        <div className="popup">

          <h2>Nuevo chat</h2>

          <p>
            Ingresá el email del usuario:
          </p>

          <input
            type="email"
            placeholder="usuario@email.com"
            value={mail}
            onChange={(e) =>
              setMail(e.target.value)
            }
          />

          <button onClick={crearChat}>
            Crear chat
          </button>

          <button onClick={close}>
            Cancelar
          </button>

          {mensaje && (
            <p>{mensaje}</p>
          )}

        </div>

      )}

    </Popup>

  );
}

export default NewChatPopup;
