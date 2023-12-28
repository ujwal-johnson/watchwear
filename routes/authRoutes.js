const express = require('express');
const router = express.Router();

// Import necessary modules (e.g., your User model and OTP generation functions)
const User = require('../models/user'); // Replace with your actual User model import
const { generateOTP, verifyOTP } = require('../utils/otp'); // Replace with your OTP generation/verification functions

// Define a route to render the OTP verification page
router.get('/verify-otp', (req, res) => {
    // Render the OTP verification page (verify-otp.html)
    res.render('verify-otp'); // Replace with the actual path to your HTML template
});

// Define a route to handle OTP verification
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Fetch the user by email (you can use a similar approach as in your registration route)
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify the OTP
        const isOTPValid = verifyOTP(user.otpSecret, otp);

        if (isOTPValid) {
            // If OTP is valid, you can update the user's verification status or perform other actions
            user.isVerified = true;
            await user.save();

            return res.status(200).json({ message: 'OTP verification successful' });
        } else {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'OTP verification failed' });
    }
});

module.exports = router;
