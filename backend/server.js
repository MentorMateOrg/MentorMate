import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'


const prisma = new PrismaClient()

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const JWT_SECRET = process.env.JWT_SECRET

app.post('/api/signup', async (req, res) => {
  const { email, plainPassword } = req.body;
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
try{
  const newUser = await prisma.user.create({
    data : {email : email, encrypted_password: hashedPassword}
  })
  const token = jwt.sign({id: newUser.id, email: newUser.email}, JWT_SECRET, {expiresIn: '30d'});
  res.status(201).json({message: "User created successfully", newUser})
}catch(err){
  throw new Error(err)
}
})

app.post('/api/login', async (req, res) => {
  try{
  const { email, plainPassword } = req.body;
  const user = await prisma.user.findUnique({where: {email: email}});
  if (!user){
    return res.status(404).json({message: "User not found"});
  }
  const userPresent = await bcrypt.compare(plainPassword, user.encrypted_password);
  if (!userPresent){
    return res.status(401).json({message: "Invalid password"});
  }
  const token = jwt.sign({id: user.id, email: user.email}, JWT_SECRET, {expiresIn: '30d'});
  res.json({token, user: {id: user.id, email: user.email}});
} catch (err) {
  throw new Error(err)
}
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})
