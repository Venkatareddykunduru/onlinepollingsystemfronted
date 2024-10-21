document.getElementById('signupForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await axios.post('http://localhost:3000/auth/register', {
            name:name,
            email:email,
            password:password
        });
        if (response.status === 201) {
            alert('Registration successful. Redirecting to login page.');
            window.location.href = 'login.html';
        }
        if (response.status === 400){
            alert('User already exist');
        }
    } catch (error) {
        console.error('Error during registration:', error);
        alert('Registration failed. Please try again.');
    }
});