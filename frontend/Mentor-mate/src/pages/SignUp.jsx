import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

const navigate = useNavigate();

  const handleSignUp = async (form) => {
form.preventDefault();

const response = await fetch('http://localhost:5000/api/signup', {
  method: 'POST',
  headers: {  "Content-Type" : "application/json", },
body: JSON.stringify({ email : email, encrypted_password: password }),

})
const user = await response.json();
if (response.ok) {
    navigate("./Welcome")
}else{
    alert('Error signing up: ')
}
setEmail('');
setPassword('');
  }

  return(
    <>
    <form onSubmit={handleSignUp}>
    <h1>Sign Up</h1>
    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
    <button>Sign Up</button>
    </form>
    </>
  )
}

export default SignUp;
