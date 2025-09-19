const express = require('express')
require('dotenv').config()
// import express  from 'express'
const app = express()

// const PORT = 4000 => It is added to .env file

app.get('/', (req,res)=>{
    res.send('Hello raj')
})

app.get('/twitter',(req,res)=>{
    res.send('This is twitter app')
})

app.get('/login', (req,res)=>{
    res.send('<h1>Login here</h1>')
})

app.listen(process.env.PORT, ()=> {
    console.log(`Raj, I am listening at ${PORT}`)
})