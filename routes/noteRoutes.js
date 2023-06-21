import express from "express"; 
import multer from "multer";
import path from "path";
import Note from "../models/Note.js";
import asyncHandler from "express-async-handler";
import {createNote, getNotes, viewNote, deleteNote, updateNote} from '../controllers/noteControllers.js'
import {isAuthenticated} from '../middlewares/authMiddleware.js'
import { body } from 'express-validator';
import {stripe} from '../config/stripe.js'
import User from "../models/User.js";

const router=express.Router()


// Set up multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extname = path.extname(file.originalname);
      cb(null, uniqueSuffix + extname);
    }
  });

// Create multer instance with storage configuration
const upload = multer({ storage: storage });


//getnotes.....................
router.get('/',isAuthenticated, getNotes)

//create note....................
// get create note page
router.get('/create', isAuthenticated, (req,res)=>{
    res.render('dashboard/createNote', { layout: 'layout/sidebarLayout'})
})
// create note
router.post('/create', [
  body('logo').notEmpty().withMessage('Name is required'),
  body('title').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('kmPerMonth').notEmpty().withMessage('Phone number is required'),
  body('price').notEmpty().withMessage('VAT is required'),
  body('truckType').notEmpty().withMessage('Address is required'),
  body('description').notEmpty().withMessage('Password is required')
], isAuthenticated, upload.single('logo'), createNote),

// view subscription page
router.get ('/view/subscribe', isAuthenticated, async(req,res)=>{
  const prices = await stripe.prices.list({
    apiKey: process.env.STRIPE_SECRET_KEY,
});
  res.render('dashboard/subscribe', {prices, layout: 'layout/sidebarLayout'})
});

// post stripe session and redirect to stripe checkout page. if successfully paid then redirect to dashboard. if subscriber role paid then access view single note
router.post('/view/subscribe', isAuthenticated, asyncHandler(async(req,res)=>{
  const user = await User.findByPk(req.session.userId);
  const {priceId} = req.body;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: 'http://localhost:3000/dashboard',
    cancel_url: 'http://localhost:3000/dashboard',
    customer: user.stripeCustomerId
  },
  {
    apiKey: process.env.STRIPE_SECRET_KEY,
  }
  );
  res.redirect(session.url);
}
));

//view single note....................
router.get('/view/:id', isAuthenticated, viewNote)

// delete note.....................
router.get('/delete/:id', isAuthenticated, deleteNote)

// update note.........................
router.get('/update/:id', isAuthenticated, asyncHandler(async (req, res) => {
    const note = await Note.findByPk(req.params.id);
    res.render('dashboard/updateNote', { note, layout: 'layout/sidebarLayout' });
}));

//update note
router.post('/update/:id', [
  body('logo').notEmpty().withMessage('Name is required'),
  body('title').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('kmPerMonth').notEmpty().withMessage('Phone number is required'),
  body('price').notEmpty().withMessage('VAT is required'),
  body('truckType').notEmpty().withMessage('Address is required'),
  body('description').notEmpty().withMessage('Password is required')
], isAuthenticated, upload.single('logo'), updateNote)




router.get('/me', isAuthenticated, asyncHandler(async (req, res) => {
  if (req.session.role === 'admin') {
    const users = await User.findAll();
    res.render('dashboard/me', { users: users, layout: 'layout/sidebarLayout' });
  } else {
    const user = await User.findByPk(req.session.userId);
    let subscription; // Define the subscription variable
    if (req.session.role === 'subscriber') {
      const user = await User.findByPk(req.session.userId);
      subscription = await stripe.subscriptions.list(
        {
          customer: user.stripeCustomerId,
          status: 'all',
        },
        {
          apiKey: process.env.STRIPE_SECRET_KEY,
        }
      );
      console.log(subscription);
    }
    res.render('dashboard/me', { user: user, subscription: subscription, layout: 'layout/sidebarLayout' });
  }
}));






 

// if admin then delete user
router.get('/me/:id', isAuthenticated, asyncHandler(async(req,res)=>{
  if (req.session.role === 'admin') {
  try{
    const user = await User.findByPk(req.params.id);
    await user.destroy();
    res.redirect('/dashboard/me');
  }
  catch(err){
    res.redirect('/dashboard/me');
  }
} else{
  res.send('You are not authorized to delete user');
}

}));


export default router
