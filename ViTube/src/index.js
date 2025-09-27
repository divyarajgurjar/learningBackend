//import mongoose from 'mongoose'
//import express from 'express'
import dotenv from 'dotenv'
//import {DB_NAME} from './constants'
import connectDB from './db/index.js';
dotenv.config({
    path: './env',
})
connectDB()


// const app = express()
// ;(async ()=> {
//     try {
//         await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
//         app.on("error", (error)=>{
//             console.log("error", error)
//             throw error
//         });
//         app.listen(process.env.PORT,()=>{
//             console.log(`Server is currently running on PORT: ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.error("Error:",error);
        
//     }
// })()