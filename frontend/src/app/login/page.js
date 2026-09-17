'use client';
import Button from "@/components/Button";

export default function LoginPage() {
    return (
        <div>
            <h1>Login</h1>
            <form>
                <input type="text" placeholder="Mail" />
                <input type="password" placeholder="Password" />
                <Button type="submit">Iniciar sesión</Button>
            </form>
        </div>
    );
}
