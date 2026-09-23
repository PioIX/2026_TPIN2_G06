'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Conexión única con Socket.IO
const socket = io("http://localhost:4000");

export default function RegistroPage() {
    const [username, setUsername] = useState('');
    const [mail, setMail] = useState('');
    const [password, setPassword] = useState('');
    const [fotoPerfil, setFotoPerfil] = useState(null);
    const [fotos, setFotos] = useState([]);

    useEffect(() => {
        // Pedir las fotos por Socket.IO al cargar la página
        socket.emit("obtener_fotos", (respuesta) => {
            if (respuesta.ok) {
                setFotos(respuesta.fotos);
            } else {
                console.error("Error al obtener fotos:", respuesta.msg);
            }
        });
    }, []);

    function handleSubmit(event) {
        event.preventDefault();

        // Enviar los datos del registro por Socket.IO
        socket.emit("register", {
            nombre: username,
            mail: mail,
            contra: password,
            fotoPerfil: fotoPerfil
        }, (respuesta) => {
            if (respuesta.ok) {
                console.log("Usuario registrado con éxito:", respuesta.usuario);
                alert("Registro exitoso");
            } else {
                alert("Error al registrar: " + respuesta.msg);
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

                <input
                    type="text"
                    placeholder="Mail"
                    value={mail}
                    onChange={(event) => setMail(event.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />

                <h3>Elige tu foto de perfil:</h3>

                <ul>
                    {fotos.map(foto => (
                        <li
                            key={foto.id}
                            onClick={() => setFotoPerfil(foto)}
                            style={{
                                border: fotoPerfil?.id === foto.id ? '2px solid blue' : 'none',
                                cursor: 'pointer',
                                display: 'inline-block',
                                margin: '5px'
                            }}
                        >
                            <img src={foto.url} alt="Foto de perfil" width="50" height="50" />
                        </li>
                    ))}
                </ul>

                <button type="submit">Registrarse</button>
            </form>
        </div>
    );
}