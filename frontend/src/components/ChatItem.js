import Link from "next/link";
import React from "react";

function ChatItem({ chat }) {

  const foto =
    chat.foto ||
    chat.imagen ||
    "/default-profile.png";

  const nombre =
    chat.tipo === "grupo"
      ? chat.nombre
      : chat.nombre_usuario;

  return (
    <Link href={`/chat/${chat.id_chat}`}>
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
    </Link>
  );
}

export default ChatItem;