import express from 'express'
const router=express.Router()

// home route
router.get('/',(req,res)=>{
    res.render('home')
})

export default router