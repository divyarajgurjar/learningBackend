//import mongoose from 'mongoose'
// import express from 'express'
// const app = express()
import dotenv from 'dotenv'
//import {DB_NAME} from './constants'
import connectDB from './db/index.js';
import {app} from './App.js'
dotenv.config({
    path: './.env',
})
connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})




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