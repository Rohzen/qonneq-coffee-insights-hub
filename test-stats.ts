async function testStats() {
    try {
        // First login to get token
        const loginRes = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin@qonneq.com', password: 'admin' })
        });
        const loginData = await loginRes.json();
        console.log('=== Got token ===');

        // Now call stats with the token
        const statsRes = await fetch('http://localhost:3001/api/dashboard/stats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.token}`
            },
            body: JSON.stringify({})
        });
        const statsData = await statsRes.json();
        console.log('\n=== Stats Response ===');
        console.log(JSON.stringify(statsData, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
    process.exit(0);
}

testStats();
