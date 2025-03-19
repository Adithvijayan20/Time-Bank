
const crypto=require('crypto')
const otpgenerator=()=>{
    const otp=crypto.randomInt(Math.pow(10,5),Math.pow(10,6)).toString()
    return otp
 
}

module.exports={otpgenerator}