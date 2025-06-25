import { useState } from 'react'
import './App.css'
import SignUp from './pages/SignUp'
import Welcome from './pages/Welcome'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LogIn from './pages/LogIn';

function App() {

  return (
    <>
 <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<LogIn />} />
      </Routes>
    </Router>
    </>
  )
}

export default App
