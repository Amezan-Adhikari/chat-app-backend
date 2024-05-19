
require('dotenv').config();
const secretKey = process.env.secretKey;

const jwt = require('jsonwebtoken');


module.exports = { 
    getToken : (payload) => {

    const options = { expiresIn: '24h' };

    const token = jwt.sign(payload, secretKey, options);

    return token;
},
verifyToken:(token)=>{
    try {
        const decoded = jwt.verify(token, secretKey);
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null; // Return null or handle the error as needed
    }
}
}
