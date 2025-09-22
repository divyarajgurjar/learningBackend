import express from 'express'
const app = express()


app.get('/',(req,res)=>{ 
    res.send('I am ready')
})

app.get('/api/jokes',(req,res)=>{
   const jokes = [
  {
    id: 1,
    title: "Programmer Joke",
    content: "Why do programmers prefer dark mode? Because light attracts bugs!"
  },
  {
    id: 2,
    title: "Math Joke",
    content: "Why was the equal sign so humble? Because it knew it wasn’t less than or greater than anyone else."
  },
  {
    id: 3,
    title: "Computer Joke",
    content: "Why did the computer go to the doctor? Because it caught a virus!"
  },
  {
    id: 4,
    title: "Dad Joke",
    content: "I told my wife she should embrace her mistakes… She gave me a hug."
  },
  {
    id: 5,
    title: "AI Joke",
    content: "Why did the AI break up with its partner? Too many arguments in the training data!"
  }
]; res.send(jokes)
})
app.listen(4000, () => {
    console.log("Hey! I am listening")
})