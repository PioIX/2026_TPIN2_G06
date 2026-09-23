'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from "@/components/Button";

export default function LoginPage() {
  const [mail, setMail] = useState('');
  const [contra, setContra] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mail, contra }),
      });

      const data = await res.json();
      console.log(data)
      if (data.ok) {
        // Guardamos los datos del usuario en el navegador para usarlos después
        localStorage.setItem('mail', JSON.stringify(mail));
        
        // Redirigimos a la pantalla principal de chats
        router.push('/chats');
      } else {
        setError(data.msg || 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error(error);
      setError('Error al conectar con el servidor');
    }
  };

  return (
    <>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="Mail" 
          value={mail}
          onChange={(e) => setMail(e.target.value)}
          required
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={contra}
          onChange={(e) => setContra(e.target.value)}
          required
        />
        
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <Button type="submit">Iniciar sesión</Button>
      </form>
    </>
  );
}