import jwt from 'jsonwebtoken';

async function testLogin() {
    try {
        const res = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin@qonneq.com', password: 'admin' })
        });
        const data = await res.json();
        console.log('=== Login Response ===');
        console.log('User:', data.user);

        if (data.token) {
            const decoded = jwt.decode(data.token);
            console.log('\n=== Decoded JWT Token ===');
            console.log(JSON.stringify(decoded, null, 2));
        }
    } catch (err) {
        console.error('Error:', err);
    }
    process.exit(0);
}

testLogin();
