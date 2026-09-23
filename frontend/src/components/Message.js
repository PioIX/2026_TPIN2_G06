import React from "react";

function Message({ mensaje, idUsuario }) {

  const esMio = mensaje.id_usuario === idUsuario;

  return (
    <div className={esMio ? "mensaje-mio" : "mensaje-otro"}>
      <p>{mensaje.contenido}</p>
    </div>
  );
}

export default Message;