const whois = require('node-whois');
const schedule = require('node-schedule');
const fs = require('fs');
const csvWriter = require('csv-writer');
const nodemailer = require('nodemailer');
const { promisify } = require('util');


const WHOIS_API_ENDPOINT =`https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=at_17snadu6oxLO9hGYODPkZXqjoPw4Y&domainName=google.com`;

const CSV_FILE_PATH = 'whois_data.csv';


const EMAIL_SERVICE = 'gmail.com';
const EMAIL_USERNAME = 'sender mail';
const EMAIL_PASSWORD = 'pass';
const EMAIL_RECIPIENT = 'reciver';


const LOG_FILE_PATH = 'error.log';6

async function extractWhoisData(domain) {
  return new Promise((resolve, reject) => {
    whois.lookup(domain, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}


function parseWhoisData(data) {
    const lines = data.split('\n');
  
    let name = '';
    let domain = '';
    let email = '';
    let phone = '';
  
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
  
      if (line.startsWith('Registrant Name:')) {
        name = line.substring('Registrant Name:'.length).trim();
      } else if (line.startsWith('Domain Name:')) {
        domain = line.substring('Domain Name:'.length).trim();
      } else if (line.startsWith('Registrant Email:')) {
        email = line.substring('Registrant Email:'.length).trim();
      } else if (line.startsWith('Registrant Phone:')) {
        phone = line.substring('Registrant Phone:'.length).trim();
      }
    }
  
    return {
      name,
      domain,
      email,
      phone,
    };
  }
  

async function storeDataInCSV(data) {
  const writer = csvWriter.createObjectCsvWriter({
    path: CSV_FILE_PATH,
    header: [
      { id: 'name', title: 'Name' },
      { id: 'domain', title: 'Domain Name' },
      { id: 'email', title: 'Email ID' },
      { id: 'phone', title: 'Phone Number' },
      { id: 'date', title: 'Date' },
      { id: 'time', title: 'Time' },
    ],
    append: true,
  });

  await writer.writeRecords(data);
}


async function sendEmail(data) {
  const transporter = nodemailer.createTransport({
    service: EMAIL_SERVICE,
    auth: {
      user: EMAIL_USERNAME,
      pass: EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: EMAIL_USERNAME,
    to: EMAIL_RECIPIENT,
    subject: 'WHOIS Data',
    text: 'Newly registered domain WHOIS data',
    attachments: [
      {
        filename: 'whois_data.csv',
        path: CSV_FILE_PATH,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}


async function handleError(error) {
  const logFile = await promisify(fs.open)(LOG_FILE_PATH, 'a');
  await promisify(fs.appendFile)(logFile, `${new Date().toISOString()} - ${error}\n`);
  await promisify(fs.close)(logFile);
}


async function main() {
  try {
    const domain = 'gmail.com'; 
    const whoisData = await extractWhoisData(domain);
    const parsedData = parseWhoisData(whoisData);

    const dataToStore = [
      {
        name: parsedData.name,
        domain: parsedData.domain,
        email: parsedData.email,
        phone: parsedData.phone,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      },
    ];

    await storeDataInCSV(dataToStore);
    await sendEmail(dataToStore);
  } catch (error) {
    await handleError(error);
  }
}


const scheduledJob = schedule.scheduleJob('03 15 * * *', () => {
  main();
});
