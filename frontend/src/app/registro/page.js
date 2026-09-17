'use client';

import { useState, useEffect } from 'react';

export default function RegistroPage() {
    const [username, setUsername] = useState('');
    const [mail, setMail] = useState('');
    const [password, setPassword] = useState('');
    const [fotoPerfil, setFotoPerfil] = useState(null);

    const [fotos, setFotos] = useState([]);

    useEffect(() => {
        fetch("http://localhost:4000/fotos")
            .then(response => response.json())
            .then(data => setFotos(data));
    }, []);

    function handleSubmit(e) {
        e.preventDefault();

        fetch("http://localhost:4000/usuarios", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                mail: mail,
                password: password,
                fotoPerfil: fotoPerfil
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Usuario registrado:", data);
        });

        console.log("Username:", username);
        console.log("Mail:", mail);
        console.log("Password:", password);
        console.log("Foto Perfil:", fotoPerfil);
    }

    return (
        <div>
            <h1>Registro</h1>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <input
                    type="text"
                    placeholder="Mail"
                    value={mail}
                    onChange={(e) => setMail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <h3>Elige tu foto de perfil:</h3>

                <ul>
                    {fotos.map(foto => (
                        <li
                            key={foto.id}
                            onClick={() => setFotoPerfil(foto)}
                        >
                            <img src={foto.url} />
                        </li>
                    ))}
                </ul>

                <button type="submit">Registrarse</button>
            </form>
        </div>
    );
}
