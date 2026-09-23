import React from "react";

function ChatItem({ chat }) {
  // Si tiene foto usamos esa.
  // Si no tiene, usamos una imagen por defecto.
  const foto =
    chat.foto ||
    chat.imagen ||
    "/default-profile.png";

  // Si es un grupo mostramos su nombre.
  // Si es un chat individual mostramos el nombre del contacto.
  const nombre =
    chat.tipo === "grupo"
      ? chat.nombre
      : chat.nombre_usuario;

  return (
    <div className="chat-item">

      <img
        src={foto}
        alt={nombre}
        className="chat-item-foto"
      />

      <div className="chat-item-info">
        <h3>{nombre}</h3>
      </div>

    </div>
  );
}

export default ChatItem;
