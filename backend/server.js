import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.post('/api/signup', async (req, res) => {
  const { email, encrypted_password } = req.body;
  const encryptedPassword = await bcrypt.hash(encrypted_password, 10);
try{
  const newUser = await prisma.user.create({
    data : {email : email, encrypted_password: encryptedPassword}
  })
  res.status(201).json({message: "User created successfully", newUser})
}catch(err){
  throw new Error(err)
}
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})
