import express from "express";
import User from "../models/User.js";
import asyncHandler from "express-async-handler";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import { stripe } from "../config/stripe.js";
import nodemailer from "nodemailer";

const signupControllers = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // There are validation errors
    const errorMessages = errors.array().map((error) => error.msg);
    return res.render("signup", { errors: errorMessages });
  }
  const { name, email, phone_number, vat, address, password, role } = req.body;
  // Check if the email already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: "Email already exists" });
  }

  // create a new user
  const user = await User.create({
    name,
    email,
    phone_number,
    vat,
    address,
    password,
    role,
  });

  // if user role is subscriber, create a stripe customer
  if (role === "subscriber") {
    const customer = await stripe.customers.create(
      {
        email: req.session.email,
      },
      {
        apiKey: process.env.STRIPE_SECRET_KEY,
      }
    );

    // save stripe customer id to the user
    await user.update({ stripeCustomerId: customer.id });
  }

  // Send verification email to user
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_USE_TLS === 'true',
    auth: {
      user: process.env.EMAIL_HOST_USER,
      pass: process.env.EMAIL_HOST_PASSWORD,
    },
  });


  const verificationLink = `${process.env.BASE_URL}/verify?email=${email}`;

  await transporter.sendMail({
    from: 'ali@aliahad.com',
    to: email,
    subject: "Verify your email",
    text: `Please verify your email by clicking the following link: ${verificationLink}`,
    html: `<p>Please verify your email by clicking the following link: <a href="${verificationLink}">${verificationLink}</a></p>`,
  });

  // Redirect to the verify page
  res.render("verify")
});

// Verify controller
const verifyController = asyncHandler(async (req, res) => {
  const { email } = req.query;

  // Find the user by email
  const user = await User.findOne({ where: { email } });

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  // Update the user's verification status
  await user.update({ isVerified: true });

  // Redirect to the login page
  res.redirect('/signin');
});

// signin controller
const signinControllers = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // There are validation errors
    const errorMessages = errors.array().map((error) => error.msg);
    return res.render("signin", { errors: errorMessages });
  }

  const { email, password } = req.body;

  // Find the user by email
  const user = await User.findOne({ where: { email } });

  if (!user) {
    const errorMessages = ["Invalid email or password"];
    return res.render("signin", { errors: errorMessages });
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const errorMessages = ["Invalid email or password"];
    return res.render("signin", { errors: errorMessages });
  }

  // Check if the user is verified
  if (!user.isVerified) {
    const errorMessages = ['Please verify your email before logging in'];
    return res.render('signin', { errors: errorMessages });
  }

  // Set user role and userId in session
  req.session.role = user.role;
  req.session.userId = user.id; // Assuming your User model has an 'id' field

  // Redirect to dashboard
  res.redirect("/dashboard");
});

export { signupControllers, verifyController, signinControllers };
