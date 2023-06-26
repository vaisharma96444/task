var whois = require('whois')
const fs = require('fs');
const schedule = require('node-schedule');
//const whois = require('nodejs-whois');
const nodemailer = require('nodemailer');

// Configuration
const targetTime = '15:05'; // Specify the time you want the script to run
const outputFile = 'domain_data.csv';
const errorLogFile = 'error_log.txt';
const emailConfig = {
  service: 'gmail',
  auth: {
    user: 'vaisharma9644@gmail.com',
    pass: 'xyz'
  }
};
const recipientEmail = 'vaisharma96444@gmail.com';


schedule.scheduleJob(`0 ${targetTime} * * *`, () => {
  console.log('Running WHOIS lookup...');


  const domain = '	gmail.com'; 
  whois.lookup(domain, (err, data) => {
    if (err) {
      logError(err);
      return;
    }


    const name = extractValue(data, 'Registrant Name');
    const domainName = extractValue(data, 'Domain Name');
    const email = extractValue(data, 'Registrant Email');
    const phone = extractValue(data, 'Registrant Phone');

    // Create a timestamp
    const timestamp = new Date().toISOString();

    // Store extracted data in CSV file
    const csvData = `${timestamp},${name},${domainName},${email},${phone}\n`;
    fs.appendFile(outputFile, csvData, (err) => {
      if (err) {
        logError(err);
      } else {
        console.log('Data stored successfully.');
        sendEmail(csvData);
      }
    });
  });
});

// Helper function to extract WHOIS data
function extractValue(data, key) {
  const regex = new RegExp(`${key}:\\s*(.+)`);
  const match = data.match(regex);
  return match ? match[1] : '';
}

// Helper function to log errors
function logError(err) {
  const errorMessage = `${new Date().toISOString()} - ${err.message}\n`;
  fs.appendFile(errorLogFile, errorMessage, (err) => {
    if (err) {
      console.error('Failed to log error:', err);
    } else {
      console.error('An error occurred. Error details logged.');
    }
  });
}

// Helper function to send email
async function sendEmail(csvData) {
  try {
    const transporter = nodemailer.createTransport(emailConfig);
    await transporter.sendMail({
      from: 'vaisharma9644@gmail.com',
      to: recipientEmail,
      subject: 'Newly Registered Domain',
      text: 'Domain details:',
      attachments: [{ filename: outputFile, content: csvData }]
    });
    console.log('Email sent successfully.');
  } catch (error) {
    logError(error);
  }
}
