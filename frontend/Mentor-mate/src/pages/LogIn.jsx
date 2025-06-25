import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";

function LogIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

const navigate = useNavigate();

  const handleLogIn = async (form) => {
form.preventDefault();

const response = await fetch('http://localhost:5000/api/login', {
  method: 'POST',
  headers: {  "Content-Type" : "application/json", },
body: JSON.stringify({ email : email, plainPassword: password }),

})
const user = await response.json();
if (response.ok) {
    alert('You are logged in!')
}else{
    alert('Error signing up: ')
}
setEmail('');
setPassword('');
  }

  return(
    <>
    <form onSubmit={handleLogIn}>
    <h1>Log in</h1>
    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
    <button>Log in</button>
    </form>
    </>
  )
}

export default LogIn;
