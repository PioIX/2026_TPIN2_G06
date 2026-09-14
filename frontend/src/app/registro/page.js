'use client';
import { useState, useEffect } from 'react';

const [fotos, setFotos] = useState([]);
useEffect(() => {
    fetch("http://localhost:3000/fotos")
        .then(response => response.json())
        .then(data => setFotos(data));
}, []);


export default function RegistroPage() {
    return (
        <div>
            <h1>Registro</h1>
            <form>
                <input type="text" placeholder="Username" />
                <input type="text" placeholder="Mail" />
                <input type="password" placeholder="Password" />
                <h3> Elige tu foto de perfil:</h3>
                <ul>
                    {fotos.map(foto => (
                        <li key={foto.id}>{foto.nombre}</li>
                    ))}
                </ul>
                <button type="submit">Registrarse</button>
            </form>
        </div>
    );
}
