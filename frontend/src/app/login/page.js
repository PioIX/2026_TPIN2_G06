'use client';

export default function LoginPage() {
    return (
        <div>
            <h1>Login</h1>
            <form>
                <input type="text" placeholder="Mail" />
                <input type="password" placeholder="Password" />
                <button type="submit">Login</button>
            </form>
        </div>
    );
}
