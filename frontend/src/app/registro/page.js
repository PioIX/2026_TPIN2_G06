'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // 1. Importamos useRouter
import { io } from 'socket.io-client';

let socket;

const FOTOS_DISPONIBLES = [
  { id: 1, url: "/foto1.jpeg", nombre: "Opción 1" },
  { id: 2, url: "/perro.jpg", nombre: "Opción 2" },
  { id: 3, url: "/conejo.jpg", nombre: "Opción 3" }
];

const FOTO_DEFAULT = { id: 0, url: "/default-profile.png", nombre: "Por defecto" };

export default function RegistroPage() {
  const router = useRouter(); // 2. Inicializamos router
  const [username, setUsername] = useState('');
  const [mail, setMail] = useState('');
  const [password, setPassword] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState(FOTO_DEFAULT);

  useEffect(() => {
    socket = io("http://localhost:4000");

    socket.on("connect", () => {
      console.log("Conectado al servidor Socket.IO con ID:", socket.id);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  function handleSubmit(event) {
    event.preventDefault();

    if (!username || !mail || !password) {
      alert("Por favor completa todos los campos.");
      return;
    }

    if (!socket || !socket.connected) {
      alert("No hay conexión con el servidor.");
      return;
    }

    socket.emit("register", {
      nombre: username,
      mail: mail,
      contra: password,
      fotoPerfil: fotoPerfil.url
    }, (respuesta) => {
      if (respuesta && respuesta.ok) {
        alert("Registro exitoso");
        router.push('/login'); // 3. Redirige a la pantalla de Login
      } else {
        alert("Error al registrar: " + (respuesta?.msg || "Sin respuesta del servidor"));
      }
    });
  }

  return (
    <div>
      <h1>Registro</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <br /><br />
        <input
          type="text"
          placeholder="Mail"
          value={mail}
          onChange={(event) => setMail(event.target.value)}
        />
        <br /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <h3>Elige tu foto de perfil (Opcional):</h3>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li
            onClick={() => setFotoPerfil(FOTO_DEFAULT)}
            style={{
              border: fotoPerfil?.id === FOTO_DEFAULT.id ? '2px solid blue' : '1px solid #ccc',
              cursor: 'pointer',
              display: 'inline-block',
              margin: '5px',
              padding: '5px',
              textAlign: 'center'
            }}
          >
            <img src={FOTO_DEFAULT.url} alt="Foto por defecto" width="50" height="50" />
            <br />
            <small>Sin foto</small>
          </li>

          {FOTOS_DISPONIBLES.map(foto => (
            <li
              key={foto.id}
              onClick={() => setFotoPerfil(foto)}
              style={{
                border: fotoPerfil?.id === foto.id ? '2px solid blue' : '1px solid #ccc',
                cursor: 'pointer',
                display: 'inline-block',
                margin: '5px',
                padding: '5px'
              }}
            >
              <img src={foto.url} alt={foto.nombre} width="50" height="50" />
            </li>
          ))}
        </ul>

        <button type="submit">Registrarse</button>
      </form>
    </div>
  );
}