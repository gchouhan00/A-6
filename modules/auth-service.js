const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // Ensure the environment variables are loaded

let Schema = mongoose.Schema;

let userSchema = new Schema({
    userName: {
        type: String,
        unique: true,
        required: true // Added required validation
    },
    password: {
        type: String,
        required: true // Added required validation
    },
    email: {
        type: String,
        required: true // Added required validation
    },
    loginHistory: [{
        dateTime: {
            type: Date,
            default: Date.now // Ensure dateTime is a Date object
        },
        userAgent: String
    }],
});

let User; // to be defined on new connection

function initialize() {
    return new Promise((resolve, reject) => {
        // Changed to mongoose.connect for the main connection
        mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(() => {
                User = mongoose.model("user", userSchema);
                resolve();
            })
            .catch(err => {
                reject(err);
            });
    });
}

function registerUser(userData) {
    return new Promise(async (resolve, reject) => {
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
        } else {
            try {
                // Hash the password before saving
                const hash = await bcrypt.hash(userData.password, 10);
                userData.password = hash;
                let newUser = new User(userData);
                await newUser.save(); // Save the new user
                resolve();
            } catch (err) {
                reject(`There was an error creating the user: ${err}`);
            }
        }
    });
}

function checkUser(userData) {
    return new Promise(async (resolve, reject) => {
        try {
            // Changed to use find to get an array of users
            const users = await User.find({ userName: userData.userName }).exec();
            if (users.length === 0) { // Corrected to check array length
                reject(`Unable to find user: ${userData.userName}`);
            } else {
                const user = users[0]; // Access the first user in the array
                // Compare password with the hashed password
                const result = await bcrypt.compare(userData.password, user.password);
                if (result) {
                    if (user.loginHistory.length === 8) {
                        user.loginHistory.pop(); // Remove the oldest login if needed
                    }
                    user.loginHistory.unshift({
                        dateTime: new Date(), // Ensure dateTime is a Date object
                        userAgent: userData.userAgent
                    });

                    // Update the login history in the database
                    await User.updateOne(
                        { userName: user.userName },
                        { $set: { loginHistory: user.loginHistory } }
                    ).exec();
                    resolve(user);
                } else {
                    reject(`Incorrect Password for user: ${userData.userName}`);
                }
            }
        } catch (err) {
            reject(`There was an error verifying the user: ${err.message}`);
        }
    });
}

module.exports = {
    initialize,
    registerUser,
    checkUser,
};
