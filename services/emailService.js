const mailer=require('nodemailer')
const mailConfig = {
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "timebank.gecw@gmail.com",
      pass: "sjyu bftc qrld jlgu",
  },
  };

  const serviceStartMail = async (recepient_mail,name,otp) => {
    const transport = await mailer.createTransport(mailConfig);
     await transport.sendMail({
      from:"timebank.gecw@gmail.com",
      to: recepient_mail,
      subject: "Time Bank - Your Volunteer is On the Way!",
      html:`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Time Bank - Your Volunteer is On the Way!</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background: #f9f9f9;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(90deg, #FF7E79, #FFB88C);
      color: #fff;
      text-align: center;
      padding: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 20px;
      line-height: 1.6;
    }
    .otp {
      background-color: #fff3e0;
      border: 2px dashed #FF7E79;
      border-radius: 5px;
      font-size: 32px;
      font-weight: bold;
      text-align: center;
      padding: 10px;
      letter-spacing: 4px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background-color: #FF7E79;
      color: #fff;
      text-decoration: none;
      padding: 12px 25px;
      border-radius: 5px;
      margin-top: 20px;
    }
    .footer {
      background: #f0f0f0;
      text-align: center;
      padding: 15px;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <!-- Email sent when a volunteer accepts the service -->
  <div class="container">
    <div class="header">
      <h1>Time Bank 🚀</h1>
    </div>
    <div class="content">
      <h2>Hello ${name}! 😊</h2>
      <p>Your volunteer has accepted your service request and will be on their way shortly to assist you!</p>
      <p>Please share the following One-Time Password (OTP) with your volunteer <strong>before the service begins</strong> to verify the start of the service:</p>
      
      <div class="otp">${otp}</div>
      
      <p>Simply show or read out this OTP when your volunteer arrives. If you have any questions or need help, just reply to this email or click the button below.</p>
      <a href="#" class="button">Contact Support</a>
      <p>Thank you for choosing Time Bank – we're here for you! 🤗</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Time Bank. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`
    })
    console.log('starting mail snd');
    
}
  const serviceEndMail = async (recepient_mail,name,otp) => {
    const transport = await mailer.createTransport(mailConfig);
     await transport.sendMail({
      from:"timebank.gecw@gmail.com",
      to: recepient_mail,
      subject: "Time Bank - Confirm Service Completion",
      html:`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Time Bank - Confirm Service Completion</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background: #f9f9f9;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(90deg, #66BB6A, #A5D6A7);
      color: #fff;
      text-align: center;
      padding: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 20px;
      line-height: 1.6;
    }
    .otp {
      background-color: #e8f5e9;
      border: 2px dashed #66BB6A;
      border-radius: 5px;
      font-size: 32px;
      font-weight: bold;
      text-align: center;
      padding: 10px;
      letter-spacing: 4px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background-color: #66BB6A;
      color: #fff;
      text-decoration: none;
      padding: 12px 25px;
      border-radius: 5px;
      margin-top: 20px;
    }
    .footer {
      background: #f0f0f0;
      text-align: center;
      padding: 15px;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <!-- Email sent when the volunteer completes the service -->
  <div class="container">
    <div class="header">
      <h1>Time Bank 🎉</h1>
    </div>
    <div class="content">
      <h2>Hello ${name}! 😊</h2>
      <p>Your service has been successfully completed by the volunteer. To confirm the completion and to credit the volunteer’s time, please use the OTP below:</p>
      
      <div class="otp">${otp}</div>
      
      <p>Enter this OTP on our platform to verify that the service is finished. We’d also love to hear your feedback—feel free to rate your experience or ask for additional information if needed!</p>
      <a href="#" class="button">Rate Service</a>
      <p>If you have any questions or need further assistance, please contact our support team. We're always here to help! 🤗</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Time Bank. All rights reserved.</p>
    </div>
  </div>
</body>
</html>

`
    })
    console.log('end mail send');
    
}

module.exports={serviceEndMail,serviceStartMail}
