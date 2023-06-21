import express from "express";
const router = express.Router();
import {signupControllers, signinControllers, verifyController} from "../controllers/authControllers.js";
import { body } from 'express-validator';

//show signup.ejs page
router.get("/signup", (req, res) => {
    res.render("signup");
});

//signup post route
router.post("/signup", [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
    body('phone_number').notEmpty().withMessage('Phone number is required'),
    body('vat').notEmpty().withMessage('VAT is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').notEmpty().withMessage('Role is required'),
  ], signupControllers)


// verify
router.get("/verify", verifyController);

// Signin route
router.get('/signin', (req, res) => {
    res.render('signin');
  });

//signin post route
router.post("/signin", [
    body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ], signinControllers)

//signout route
router.get("/signout", (req, res) => {
    req.session.destroy();
    res.redirect("/signin");
});



export default router;
