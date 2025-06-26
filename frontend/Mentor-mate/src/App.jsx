import { useState } from 'react'
import './App.css'
import SignUp from './pages/SignUp'
import Welcome from './pages/Welcome'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {

  return (
    <>
 <Router>
      <Routes>
        <Route path="/" element={<SignUp />} />
        <Route path="/welcome" element={<Welcome />} />
      </Routes>
    </Router>
    </>
  )
}

export default App
