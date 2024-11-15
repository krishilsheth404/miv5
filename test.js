// app using yahoo.com as a search engine
const express = require('express'); // Include ExpressJS
const app = express(); // Create an ExpressJS app
const bodyParser = require('body-parser'); // Middleware 
const axios = require('axios');
const path = require('path');
const cheerio = require('cheerio')
const puppeteer = require('puppeteer');
const request = require('request');
const mysql = require('mysql');
const mongoose = require("mongoose");
const sessions = require('express-session');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const rateLimit = require('express-rate-limit');


// const finalPageLimiter = rateLimit({
//     windowMs: 60 * 1000, // 1 minutes window
//     max: 20, // Limit each IP to 100 requests per `window` (here, per 1 minute)
//     handler: (req, res) => {
//         // Redirect to the /rateLimitExceeded route when the rate limit is exceeded
//         res.redirect('/rateLimitExceeded');
//     },
//     standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//     legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });

// const Razorpay = require('razorpay');
// var instance = new Razorpay({
//     key_id: 'YOUR_KEY_ID',
//     key_secret: 'YOUR_KEY_SECRET',
//   });

const { MongoClient } = require('mongodb');

const stringSimilarity = require('string-similarity');
// const customerRoute = require("./routes/customer.route.js");


// const connection = mysql.createConnection({
//     host :'sql12.freesqldatabase.com',
//     user:'sql12627038',
//     password:'nILwiGK3gB',
//     database:'sql12627038',
// })

const axiosParallel = require('axios-parallel');

const { performance } = require('perf_hooks');
const fs = require('fs');
const ejs = require("ejs");
const { ConnectAppContext } = require('twilio/lib/rest/api/v2010/account/connectApp');
const { filter } = require('domutils');
const { runInContext } = require('vm');
const { Console } = require('console');
const e = require('express');




// app.use("/customer", customerRoute);



// mongoose
// .connect(
//   "mongodb+srv://krishil:hwMRi.iXePK.4J3@medicompuser.vjqrgbt.mongodb.net/?retryWrites=true&w=majority&appName=medicompUser"
// )
// .then(() => {
//   console.log("Connected to DB");
//   app.listen(3001, () => {
//     console.log("Server running on port 3001");
//   });
// })
// .catch((e) => {
//   console.log(e);
//   console.log("Could not connect to MongoDB");
// });

app.use(express.static(__dirname));
app.use(cookieParser('medicomp9i3s7t2h6e7b7e2s4t5@'));  // Replace 'yourSecretKey' with a strong, unique secret key

const REQUEST_LIMIT = 10;            // Max requests per session per window
const WINDOW_DURATION = 60 * 1000;   // 1 minute in milliseconds
const sessionRequestCounts = new Map();  // For storing request counts and timestamps

const generateSessionToken = () => crypto.randomBytes(16).toString('hex');

const rateLimiter = (req, res, next) => {
    const { signedCookies } = req;
    let sessionToken = signedCookies['sessionToken'];

    // If no session token, generate a new one and store it
    if (!sessionToken) {
        sessionToken = generateSessionToken();
        res.cookie('sessionToken', sessionToken, { httpOnly: true, secure: true, signed: true });
        sessionRequestCounts.set(sessionToken, { count: 1, timestamp: Date.now() });
        return next();
    }

    // Retrieve or initialize session data
    const sessionData = sessionRequestCounts.get(sessionToken) || { count: 0, timestamp: Date.now() };
    const { count, timestamp } = sessionData;
    const currentTime = Date.now();

    // Reset the count if the time window has passed
    if (currentTime - timestamp > WINDOW_DURATION) {
        sessionData.count = 1;
        sessionData.timestamp = currentTime;
        sessionRequestCounts.set(sessionToken, sessionData);
        return next();
    }

    // Increment the count if within the same window
    if (count < REQUEST_LIMIT) {
        sessionData.count++;
        sessionRequestCounts.set(sessionToken, sessionData);
        next();
    } else {
        // Redirect if the limit is exceeded
        res.redirect('/rateLimitExceeded');
    }
};



app.set('view engine', 'ejs');


function validateReferer(req, res, next) {
    const allowedOrigin = 'https://medicomp.in';  // Replace with your actual domain
    const origin = req.get('origin') || req.get('referer');  // Check both Origin and Referer headers

    // If the request comes from the allowed origin/referer, proceed; otherwise, block the request
    if (origin && origin.startsWith(allowedOrigin)) {
        return next();
    } else {
        return res.status(403).json({ message: 'Unauthorized access - Invalid Origin/Referer' });
    }
}




// session middleware
// app.use(sessions({
// secret: "thisismysecrctekey",
// saveUninitialized:true,
// cookie: {
//     secure: false,           // Set to true if you're using HTTPS
//     maxAge: 30 * 24 * 60 * 60 * 1000  // Set maxAge to 30 days (in milliseconds)
// },
// resave: false
// }));

const uri = "mongodb+srv://krishil:hwMRi.iXePK.4J3@medicompuser.vjqrgbt.mongodb.net"; // Replace with your MongoDB URI

const options = {
    useUnifiedTopology: true,  // Helps in connection pooling
    maxPoolSize: 10,           // Set the max connection pool size to 10
    socketTimeoutMS: 45000,    // Timeout after 45 seconds if no response
    connectTimeoutMS: 30000,   // Timeout for initial connection
  };
  
  const client = new MongoClient(uri, options);
  
  async function connectToDb() {
    try {
      await client.connect();
      console.log('Connected to MongoDB with connection pooling enabled!');
    } catch (err) {
      console.error('Error connecting to MongoDB:', err);
    }
  }
  
  connectToDb();    

app.use(cookieParser());
// app.use(rateLimiter);

app.use('/medicomp', rateLimiter);
app.use('/scrape-data', rateLimiter);


// app.set('views', './');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// var newItem;
// Route to Login Page

app.get('/', async (req, res) => {




    const url = 'https://api-console.mkart.dev/api/v1/check';
    const data = { // Object containing data to be sent in the request body

    };

    const headers = {
        'Content-Type': 'application/json', // Example header
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNzhlOGVkMTZiMTBlMmFiYzhiNDdkNDdkYTExZmI5MzFlYjNlMGZiNzBhZjg4Njg2NDI3MTFjMjU5ZjRiZjVjMGQ0MWU4MDhlNzhkZGM3MjUiLCJpYXQiOjE3MTk2NTkyNTYuMzYyOTY0LCJuYmYiOjE3MTk2NTkyNTYuMzYyOTY2LCJleHAiOjE3NTExOTUyNTYuMzQ5NzcsInN1YiI6IjQiLCJzY29wZXMiOltdfQ.jJw6_397To_aq8fdRqBIsJPNsSCJopU75SZIGOmzoe5iRlINC17d4yJrg1vW6GfBse8SEM8FHg98dQOFYc3nxaIfP8fZwLgk6LcGapBWtZPV4w3p9VqRP8Iwx8-z4R48W5MW9qLE-6SB0ikcuBZzYDj6adyxgBfZDvOGqqBgk3lDM-YCUZl6SFWvtO0emkPjq9ZnB5P_HUBArPgzEY5rE9U9kWbKYCgpB_N19qcSiconCSjJJDXu-cfPIudYsJvSYREluz9hfh02gyxFdcxmgafNM32MRjx3x7KU1OcD3F7tTzxkDDCunPNn9P36lKV5SHVCg0-3og621uTsl5Xc5tO137jupbNSTqCzyRZ4bzqt3amAhRD01aHkEl0jZ4qyFJDPy6c7z8wyQP4W2zk1paucsgFmvmZY0IqiY9EVe-YVN3jks5uTstUVvOWdladFVAQrmUsiL0wNKomRUY9slgi0zAN47fnCOGz5sTit7fYqRpNyS2g2luYtpgq6u_AGEve2sEjOXmxKcrm5hCOUL9xsIedv6KfttZmBqFmoMLbIYENc6GK4EwEn3UinC0_aOnARpzYE9r1LEdTTB76vRaONDvPLJzZdVZROtpWjEFPdp2v8JnsnOjwpDszwfFOYSqlcEaSb2VtaNW8Y1bL38vdaT3pTJbTdMtQZGnB_UxE',
    };

    await axios.post(url, data, { headers })
        .then(response => {
            console.log(response.data); // Response data from the server
        })
        .catch(error => {
            console.error(error);
        });
    res.render(__dirname + '/Laptopindex.html');

    // if (req.session.user) {
    //     res.redirect('/home')
    // } else {
    //    res.redirect('/login')
    // }
});

app.get('/about-us', async (req, res) => {
    res.sendFile(__dirname + '/about.html');
    // if (req.session.user) {
    //     res.redirect('/home')
    // } else {
    //    res.redirect('/login')
    // }
});



app.get('/index.html', async (req, res) => {
    // res.sendFile(__dirname+'/index.html');
    res.render(__dirname + '/Laptopindex.html');

    // if (req.session.user) {
    //     res.redirect('/home')
    // } else {
    //    res.redirect('/login')
    // }
});

app.get('/home', (req, res) => {

    // console.log(req.session.user)
    res.sendFile(__dirname + 'Laptopindex.html');
    // if (req.session.user) {
    //     res.sendFile(__dirname+'/index.html');
    // } else {
    //    res.redirect('/login')
    // }
});

app.get('/rateLimitExceeded', (req, res) => {

    // console.log(req.session.user)
    res.sendFile(__dirname + '/rateLimitExceeded.html');
    // if (req.session.user) {
    //     res.sendFile(__dirname+'/index.html');
    // } else {
    //    res.redirect('/login')
    // }
});

app.post('/home', (req, res) => {

    console.log(req.session.user)
    if (req.session.user) {
        res.render(__dirname + '/Laptopindex.html');
    } else {
        res.redirect('/login')
    }
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/loginPage.html');
    // if (req.session.user) {
    //     res.redirect('/home');
    // } else {
    // }
});


app.get('/medkart', async (req, res) => {
    const url = 'https://api-console.mkart.dev/api/v1/product/search?q=Crocin 650 Tablet 15&page=1';

    const headers = {
        'Content-Type': 'application/json', // Example header
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNzhlOGVkMTZiMTBlMmFiYzhiNDdkNDdkYTExZmI5MzFlYjNlMGZiNzBhZjg4Njg2NDI3MTFjMjU5ZjRiZjVjMGQ0MWU4MDhlNzhkZGM3MjUiLCJpYXQiOjE3MTk2NTkyNTYuMzYyOTY0LCJuYmYiOjE3MTk2NTkyNTYuMzYyOTY2LCJleHAiOjE3NTExOTUyNTYuMzQ5NzcsInN1YiI6IjQiLCJzY29wZXMiOltdfQ.jJw6_397To_aq8fdRqBIsJPNsSCJopU75SZIGOmzoe5iRlINC17d4yJrg1vW6GfBse8SEM8FHg98dQOFYc3nxaIfP8fZwLgk6LcGapBWtZPV4w3p9VqRP8Iwx8-z4R48W5MW9qLE-6SB0ikcuBZzYDj6adyxgBfZDvOGqqBgk3lDM-YCUZl6SFWvtO0emkPjq9ZnB5P_HUBArPgzEY5rE9U9kWbKYCgpB_N19qcSiconCSjJJDXu-cfPIudYsJvSYREluz9hfh02gyxFdcxmgafNM32MRjx3x7KU1OcD3F7tTzxkDDCunPNn9P36lKV5SHVCg0-3og621uTsl5Xc5tO137jupbNSTqCzyRZ4bzqt3amAhRD01aHkEl0jZ4qyFJDPy6c7z8wyQP4W2zk1paucsgFmvmZY0IqiY9EVe-YVN3jks5uTstUVvOWdladFVAQrmUsiL0wNKomRUY9slgi0zAN47fnCOGz5sTit7fYqRpNyS2g2luYtpgq6u_AGEve2sEjOXmxKcrm5hCOUL9xsIedv6KfttZmBqFmoMLbIYENc6GK4EwEn3UinC0_aOnARpzYE9r1LEdTTB76vRaONDvPLJzZdVZROtpWjEFPdp2v8JnsnOjwpDszwfFOYSqlcEaSb2VtaNW8Y1bL38vdaT3pTJbTdMtQZGnB_UxE',
    };

    await axios.get(url, { headers: headers })
        .then(response => {
            const products = response.data.data.products;
            // console.log(products);

            // const products = jsonData.data.products;

            // Filter products with package_size of 10
            const filteredProducts = products.filter(product => product.package_size === 15);

            // Log the filtered products
            // console.log(productsWithPackageSize10);

            const targetString = "Crocin 650 Tablet";

            let mostSimilarProduct = null;
            let highestSimilarityScore = 0;

            filteredProducts.forEach(product => {
                const similarityScore = stringSimilarity.compareTwoStrings(product.name, targetString);
                if (similarityScore > highestSimilarityScore) {
                    highestSimilarityScore = similarityScore;
                    mostSimilarProduct = product;
                }
            });

            if (mostSimilarProduct) {
                console.log('Product with the highest similarity to "Crocin 650 Tablet":');
                console.log(`Name: ${mostSimilarProduct.name}`);
                console.log(`Similarity Score: ${highestSimilarityScore.toFixed(2)}`);
            } else {
                console.log('No products found with package size of 10.');
            }

            res.send(response.data); // Response data from the server


        })
        .catch(error => {
            console.error(error);
        });
});



app.get('/get', (req, res) => {
    console.log(req.session.user)
});

app.post('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/home')
    } else {
        res.redirect('/login')
    }
});


// app.get('/getSearchHistoryData', async (req, res) => {

//     async function fetchData() {
//         const uri = "mongodb+srv://krishil:hwMRi.iXePK.4J3@medicompuser.vjqrgbt.mongodb.net/?retryWrites=true&w=majority"; // Replace with your MongoDB URI
//         var client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
//         try {
//             // Connect to the MongoDB client
//             await client.connect();
//             console.log('Connected to the MongoDB server');

//             // Select the database and collection
//             const db = client.db("MedicompDb");
//             const collection = db.collection("finalResultPageMedicomp");

//             // Perform a query to get all documents (adjust query as necessary)
//             const filter = {
//                 "DateOfComparison": { $regex: "[0-9]{2}/09/2024" }
//             };

//             // Perform the filtered query to get documents
//             const data = await collection.find(filter).toArray();

//             const count = await collection.countDocuments(filter);
//             console.log('Total count of documents:', count);

//             return data;
//         } catch (error) {
//             console.error('Error fetching data:', error);
//         } finally {
//             // Ensure the client is closed when finished
//             await client.close();
//             console.log('MongoDB connection closed');
//         }
//     }

//     // Call the function to fetch data
//     var a=fetchData();


//     res.send(a)

// })


app.get('/signin', async (req, res) => {
    console.log(req.query['email'])
    console.log(req.query['password'])

    async function retrieveData(email, password) {
        const uri = "mongodb+srv://krishil:hwMRi.iXePK.4J3@medicompuser.vjqrgbt.mongodb.net/?retryWrites=true&w=majority"; // Replace with your MongoDB URI
        var client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        try {
            const database = client.db('MedicompDb');
            const collection = database.collection('User');

            // Find documents that match a query
            const user = await collection.findOne({ email });
            console.log(user)

            if (!user) {
                return 'Incorrect Email';
            }

            if (user.password !== password) {
                return 'Incorrect Password';
            }

            // Return the username if email and password are correct
            return user.username;

        } catch (err) {
            if (err.code === 11000 && err.keyPattern.email) {
                console.error('Duplicate email found');
            } else {
                console.error('Error inserting document', err);
            }
        } finally {
            await client.close();
        }
    }
    // retrieveData(req.body.email_id,req.body.password);
    var cVal = await retrieveData(req.query['email'], req.query['password']);

    if (cVal == 'Incorrect Email') {
        res.send('Incorrect Email');
    } else if (cVal == 'Incorrect Password') {
        res.send('Incorrect Password');
    } else {
        req.session.user = {
            name: cVal,
            isLoggedIn: true,
        };


        res.send('Ok')
    }

})
app.get('/signup', async (req, res) => {

    console.log(req.query['username'])
    console.log(req.query['email'])
    console.log(req.query['password'])

    var errorOccured = [];

    const uri = "mongodb+srv://krishil:hwMRi.iXePK.4J3@medicompuser.vjqrgbt.mongodb.net/?retryWrites=true&w=majority"; // Replace with your MongoDB URI

    async function checkEmailExists(email) {
        var client1 = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        try {
            const database = client1.db('MedicompDb');
            const collection = database.collection('User');

            // Check if the email exists in the collection
            const existingUser = await collection.findOne({ email });

            return !!existingUser; // Return true if email exists, false otherwise
        } catch (err) {
            console.error('Error checking email existence', err);
            return false;
        } finally {
            await client1.close();
        }
    }



    async function insertSignUpData(u, e, p) {
        var client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        try {
            const database = client.db('MedicompDb');
            const collection = database.collection('User');

            const emailExists = await checkEmailExists(e);
            if (emailExists) {
                console.error('Email already exists');
                errorOccured.push("Email Duplicate Error")
                return 'duplicate Email';
            }


            // Insert a single document
            const result = await collection.insertOne(
                {
                    username: u,
                    email: e,
                    password: p,
                }
            );

            console.log(`Inserted details of ${u} sucessfully`);
            return 'Ok';
        } catch (err) {
            if (err.code === 11000 && err.keyPattern.email) {
                console.error('Duplicate email found');
            } else {
                console.error('Error inserting document', err);
            }
        } finally {
            await client.close();
        }
    }



    var cVal = await insertSignUpData(req.query['username'], req.query['email'], req.query['password']);

    if (cVal === 'duplicate Email') {
        res.send('duplicate Email');
    } else {
        req.session.user = {
            name: req.query['username'],
            isLoggedIn: true,
        };


        res.send('Ok')
    }

})



app.post('/logout', (req, res) => {
    req.session.user.isLoggedIn = '';
    res.redirect('/login');
});




app.get('/temp', async (req, res) => {
    // axios.post('http://localhost:3001/customer',req.body)
    // .then(() => {
    //     console.log("data sent")
    //   })
    //   .catch((e) => {
    //     console.log("Could not send");
    //     console.log(e)
    //   });

    var DataFinalForMDB = [];





    async function addData() {
        const uri = "mongodb+srv://krishil:hwMRi.iXePK.4J3@medicompuser.vjqrgbt.mongodb.net/?retryWrites=true&w=majority"; // Replace with your MongoDB URI
        const dbName = 'MedicompDb'; // Replace with your database name
        const collectionName = 'medicineList'; // Replace with your collection name


        try {
            const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
            const db = client.db(dbName);
            const collection = db.collection(collectionName);

            // const result = await collection.createIndex({ medicineName: 1 });
            // console.log("Index created successfully:", result);

            await collection.createIndex({ "medicineName": "text" }, { "default_language": "english", "weights": { "medicineName": 10 } });


            console.log("done")
            // console.log(collection('medicineList').getIndexes())
            // const regex = new RegExp("ant", 'i'); // 'i' for case-insensitive
            // const cursor = collection.find({ medicineName: { $regex: regex } }).limit(20);

            // Convert cursor to array and log the results
            console.log("Found the following records:");


            //   for (const line of lines) {
            //     console.log(line);
            //     const td = line.split(',');

            //         // await collection.insertOne({medicineName:td[0],manufacturerName:td[1],medicinePackSize:td[2],saltComposition:td[3].split('+'),prescriptionReq:td[4],prodLink:td[5]});
            //         await collectionName.createIndex({medicineName: `${td[0]}`})
            // }

            await client.close();
        } catch (err) {
            console.error('Error inserting data:', err);
        }
    }


    // const myData = { // Replace with your actual data object
    //     name: "Hello World",
    //     age: 21,
    //     city: "India"
    // };

    await addData();
    console.log('Data inserted successfully');


});

app.get('/ScrapeDataFromApollo', async (req, res) => {
    const downloadImage = async (imageUrl, localPath) => {
        try {
            // Fetch the image
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

            // Save the image to a local file
            fs.writeFileSync(localPath, response.data);

        } catch (error) {
            console.error(`Error downloading image: ${imageUrl}`, error);
        }
    };

    extractAddress = async (url) => {

        const { data } = await axios.get(url, { responseType: 'arraybuffer' });
        const $ = cheerio.load(data);
        var medicompFileName = $('.black-txt').text().replace(/[%,+'\/\\\s.]/g, '').trim();
        var imageUrl = $('.largeimage img').attr('src')


        // downloadImage($('.largeimage img').attr('src'), `./MedicineImage/${medicompFileName}.jpg`);

        try {
            // Fetch the image
            // const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

            // Save the image to a local file
            await downloadImage(imageUrl, `./MedicineImage/${medicompFileName}.jpg`);

            console.log('Image downloaded successfully' + url);

        } catch (error) {
            console.error('Error downloading image:', error);
        }
        // for images from netmeds



        // const { data } = await axios.get(url);
        // const $ = cheerio.load(data);

        // const image =$('.largeimage img').attr('src')

        // fs.appendFile('./NetmedsImagesLink.txt', `${image}\n`, (err) => {
        //     if (err) {
        //         console.error('Error writing to file:', err);
        //     } else {
        //         console.log(`Saved Link ${image}`);
        //     }
        // })//for medlinks images links



        // for (let i = 0; i < urls.length; i++) {
        //     const { data } = await axios.get(urls[i]);
        //     const $ = cheerio.load(data);

        //     const medName = $('.medName').first().text();
        //     const medStrips = $('.medStrips').first().text();
        //     const manufacturer = $('#manufacturer').first().text();
        //     const compositionDescription = $('.compositionDescription').first().text();

        //     console.log(medName, medStrips, manufacturer, compositionDescription);

        //     fs.appendFile('./TryAllMedicineNamesWithExtraDescStartingWithA.txt', `${medName},${medStrips},${manufacturer},${compositionDescription}\n`, (err) => {
        //         if (err) {
        //             console.error('Error writing to file:', err);
        //         } else {
        //             console.log(`Found ${urls[i]}`);
        //         }
        //     });
        // }

    };


    extractLinksOnly = async (url) => {
        // const { data } = await axios.get(url)
        // const $ = cheerio.load(data);

        // var a = $('.houWZm a');
        // var d = [];
        // a.each((index, element) => {
        //     // Access element properties or content here
        //     fs.appendFile('./allLinksForNames.txt', `${$(element).text()}~${$(element).attr('href')}` + '\n', (err) => {
        //         if (err) {
        //             console.error('Error writing to allLinksForNames.txt:', err);
        //         } else {
        //             console.log(`found...${url}`);
        //         }
        //     });
        // });


        // const inputFilePath = 'allLinksForNames.txt';
        const outputFilePath = 'medicineDb.txt';

        const appendToFile = (data) => {
            fs.appendFileSync(outputFilePath, `${data}\n`, (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
            console.log("appened...");
        };

        // const fetchDataAndAppendToFile = async (line) => {
        //     return new Promise(async (resolve, reject) => {
        //         const [medicineName, url] = line.split('~');
        //         await axios.get(url)
        //             .then(response => {
        //                 const $ = cheerio.load(response.data);
        //                 // Extract the required information using cheerio
        //                 var medicineData = []
        //                 medicineData.push($('.medName').text())
        //                 medicineData.push($('#manufacturer').text())
        //                 medicineData.push($('.medStrips').text())
        //                 medicineData.push($('.compositionDescription').text())
        //                 medicineData.push($('.instructionLine').text().includes('Prescription') ? $('.instructionLine').text() : "No Prescription Required");
        //                 medicineData.push($('.medName').text())
        //                 appendToFile(`${medicineData}`);
        //                 console.log("Appended For " + medicineName);
        //                 resolve();
        //             })
        //             .catch(error => {
        //                 console.error(`Error fetching data for ${medicineName}: ${error.message}`);
        //                 resolve(); // Resolve the promise even if there's an error to continue processing other links
        //             });
        //     });
        // };


        // const lines = fs.readFileSync(inputFilePath, 'utf-8').split('\n').filter(Boolean);

        // const processLinks = async () => {
        //     for (const line of lines) {
        //         await new Promise(resolve => setTimeout(resolve, 1000)); // Delay of 1 second
        //         await fetchDataAndAppendToFile(line);
        //     }
        // };

        // processLinks().then(() => {
        //     console.log('Finished processing all links.');
        // });



        fs.readFile('allLinksForNamesFinal.txt', 'utf8', async (err, data) => {
            if (err) {
                console.error(err);
                return;
            }

            const lines = data.split('\n');


            for (const line of lines) {
                // Process the line here
                console.log(line);
                // Split the data into individual JSON objects
                const url = line.split('~')[1];
                console.log(url);


                await axios.get(url)
                    .then(async response => {
                        const $ = cheerio.load(response.data);
                        // Extract the required information using cheerio
                        var medicineData = []
                        medicineData.push($('.medName').first().text())
                        medicineData.push($('#manufacturer').first().text())
                        medicineData.push($('.medStrips p').first().text())
                        if ($('.compositionDescription').text().includes('...See more')) {
                            medicineData.push($('.compositionDescription').text().split('...See more')[0])
                        } else {
                            medicineData.push($('.compositionDescription').text())
                        }
                        medicineData.push($('.instructionLine').text().includes('Prescription') ? $('.instructionLine').text() : "No Prescription Required");
                        medicineData.push(url)
                        await appendToFile(`${medicineData}`);
                        console.log("Appended For " + $('.medname').text());
                    })
                    .catch(error => {
                        console.log(error)
                        // console.error(`Error fetching data for ${$('.medname').text()}: ${error.message}`);
                    });

            }

        });

    };

    // var links = [];
    // for (var i = 1; i <= 99; i++) {

    //     await extractLinksOnly(`https://www.truemeds.in/all-medicine-list?page=${i}&label=z`);
    //     console.log(i+" - found");

    // }


    await extractLinksOnly();

})


app.get('/addLinksToMednames', async (req, res) => {
    fs.readFile('MedicineNamesStartingWithC.txt', 'utf8', async (err, data) => {
        if (err) {
            console.error(err);
            return;
        }

        // Split the data into an array of medicine names
        const medicineNames = data.split('\n').map(name => name.replace(/[^\w\s+\/\\]/gi, '').replace('%', '').trim());



        // Construct links for each medicine name
        for (const medicineName of medicineNames) {
            try {
                // Construct the URL for the API endpoint
                const link = `http://localhost:4000/fastCompMorePharmasFasterOp?medname=${encodeURIComponent(medicineName)}`;

                // Make the API request and wait for the response
                const response = await axios.get(link);

                // Append the response data to the file
                fs.appendFile('./MedicineLinksForNamesStartingWithZ.txt', `${medicineName} : ${JSON.stringify(response.data)}\n`, err => {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    console.log(`Link for ${medicineName} saved to MedicineLinksForNamesStartingWithZ.txt`);
                    var message = `${medicineName} Search Complete`;
                    say.speak(message);


                });
            } catch (error) {
                console.error(`Error fetching data for ${medicineName}: ${error.message}`);
            }
        }
    });
});


app.get('/limitedTimeOffers', async (req, res) => {

    const { data } = await axios.get("https://netmeds.com");
    const $ = cheerio.load(data);

    const final = [];
    $('.flashsale .swiper-slide').map((i, elm) => {
        final.push({
            title: ($(elm).find('.cat_title').first().text()),
            imgsrc: ($(elm).find('.cat-img img').first().attr('src')),
            fprice: ($(elm).find('#final_price').first().text()),
            oprice: ($(elm).find('.price').first().text()),
        });
    });
    res.send(final);

});


function levenshteinDistance(a, b) {
    const an = a.length;
    const bn = b.length;
    if (an === 0) return bn;
    if (bn === 0) return an;

    let v0 = new Array(bn + 1).fill(0).map((_, i) => i);
    let v1 = new Array(bn + 1);

    for (let i = 0; i < an; i++) {
        v1[0] = i + 1;
        for (let j = 0; j < bn; j++) {
            const cost = a[i] === b[j] ? 0 : 1;
            v1[j + 1] = Math.min(
                v1[j] + 1,        // Insertion
                v0[j + 1] + 1,    // Deletion
                v0[j] + cost      // Substitution
            );
        }
        [v0, v1] = [v1, v0];
    }
    return v0[bn];
}




function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/\b(of|the|for|and)\b/gi, '') // Remove stop words
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .trim();
}

// Extract all numbers (like quantity, weight, etc.)
function extractNumbers(text) {
    return text.match(/\d+/g) || []; // Extract all numbers or return empty array if none found
}



async function calculateSimilarity(medicine1, medicine2) {
    const numbers1 = extractNumbers(medicine1);
    const numbers2 = extractNumbers(medicine2);

    // Normalize the rest of the text
    const normMedicine1 = normalizeText(medicine1);
    const normMedicine2 = normalizeText(medicine2);

    // Use string-similarity to compare the rest of the text
    const similarityScore = stringSimilarity.compareTwoStrings(normMedicine1, normMedicine2);

    // Print the similarity score no matter what

    // Comparison logic
    let finalMatch = false;

    if (numbers1.length > 0 && numbers2.length > 0) {
        // If both contain numbers, check if they match exactly
        finalMatch = JSON.stringify(numbers1) === JSON.stringify(numbers2) && similarityScore > 0.6;
    } else if (numbers1.length === 0 || numbers2.length === 0) {
        // If only one contains numbers, rely on text similarity with a higher threshold
        finalMatch = similarityScore > 0.75;
    }

    console.log(`Similarity Score: ${similarityScore}`);
    return (similarityScore * 100).toFixed(2);
}



function compareStringArraysByIndex(arr1, arr2) {
    const similarities = [];
    let totalSimilarity = 0;
    const shortestLength = Math.min(arr1.length, arr2.length);
    for (let i = 0; i < shortestLength; i++) {
        const element1 = arr1[i].toLowerCase(); // Convert to lowercase
        const element2 = arr2[i].toLowerCase(); // Convert to lowercase
        if (element1 && element2) {
            const similarity = stringSimilarity.compareTwoStrings(element1, element2);
            totalSimilarity += similarity;
            const percentage = similarity * 100;
            similarities.push({ element1, element2, similarity: percentage.toFixed(2) });
        }
    }
    const averageSimilarity = totalSimilarity / (shortestLength || 1);
    return { similarities, averageSimilarity: (averageSimilarity * 100).toFixed(2) };
}


app.post('/getImageData', async (req, res) => {
    const start = performance.now();

    console.log(req.body);

    const browser = await puppeteer.launch({

        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ]

    })
    const page = await browser.newPage();

    await page.goto(`https://yandex.com/images/search?rpt=imageview&url=${req.body.blah}`);
    const data = await page.evaluate(() => document.querySelector('*').outerHTML);

    await browser.close();

    const final = [];
    const $ = cheerio.load(data, { xmlMode: false });
    $('.CbirSection-Title').map((i, elm) => {
        if ($(elm).text() == "Image appears to contain") {
            console.log('yes')
            $(elm).next().find('a').map((i, elm) => {
                final.push($(elm).text());
            });
        }
    });



    const end = performance.now() - start;
    console.log(`Execution time: ${end}ms`);

    res.render(__dirname + '/imageDetection', { final: final });

});

app.get('/multiSearchOld', async (req, res) => {
    console.log('started')
    const start = performance.now();

    const LinkDataResponses = await axiosParallel(
        ['https://localhost:1000/compare?medname=Dolo-650+Tablet+10%27s',
            'https://localhost:1000/compare?medname=Volini+Pain+Relief+Spray%2C+40+gm',
            'https://localhost:1000/compare?medname=Moov+Pain+Relief+Cream%2C+15+gm',
            'https://localhost:1000/compare?medname=Dolo-650+Tablet+10%27s',
            'https://localhost:1000/compare?medname=endoreg%2014s',
        ]);
    // console.log(LinkDataResponses[0].data);

    for (var i = 0; i < 5; i++) {
        const $ = cheerio.load(LinkDataResponses[i].data);
        console.log($('.bottom-area').html());
    }


    const end = performance.now() - start;
    console.log(`Execution time: ${end}ms`);
});

app.post('/redirect', async (req, res) => {
    console.log(req.body.medlink);
    console.log(req.body.medName);
    console.log(req.body.medicineName);
    const final = []
    final.push(req.body.medlink)
    final.push(req.body.medName)
    final.push(req.body.medicineName)

    const imageLogos = {

        apollo: 'https://image3.mouthshut.com/images/imagesp/925643839s.png',
        netmeds: 'https://cashbackpot.in/img/netmedsede7e2b6d13a41ddf9f4bdef84fdc737.png',
        pharmeasy: 'https://hindubabynames.info/downloads/wp-content/themes/hbn_download/download/health-and-fitness-companies/pharmeasy-logo.png',
        healthskool: 'https://www.healthskoolpharmacy.com/assets/uploads/326389268.png',
        pasumai: 'https://play-lh.googleusercontent.com/_TgqQftpsZ7MrQEU8pJXJZ_3lFommPqzUj_0dovrHmVhp5NVTud6sbVEHxkVFRJzxn6H',
        flipkart: 'https://cdn.grabon.in/gograbon/images/merchant/1653477064516/flipkart-health-plus-logo.jpg',
        pulseplus: 'https://aniportalimages.s3.amazonaws.com/media/details/pulsepluspiximpov23jkgh_8zvoiRv.jpg',
        tabletshablet: 'https://www.tabletshablet.com/wp-content/uploads/2020/09/TBS_logo.jpg',
        healthmug: 'https://static.oxinis.com/healthmug/image/healthmug/healthmuglogo-192.png',
        myupchar: 'https://image.myupchar.com/8910/original/jobs-in-myupchar-delhi-healthcare-healthtech-techjobs-content-doctor-marketing.jpg',

    }

    if (req.body.medlink.includes('apollo')) {
        final.push(imageLogos['apollo']);
    } else if (req.body.medlink.includes('netmeds')) {
        final.push(imageLogos['netmeds']);
    } else if (req.body.medlink.includes('pharmeasy')) {
        final.push(imageLogos['pharmeasy']);
    } else if (req.body.medlink.includes('healthskool')) {
        final.push(imageLogos['healthskool']);
    } else if (req.body.medlink.includes('pasumai')) {
        final.push(imageLogos['pasumai']);
    } else if (req.body.medlink.includes('flipkart')) {
        final.push(imageLogos['flipkart']);
    } else if (req.body.medlink.includes('pulseplus')) {
        final.push(imageLogos['pulseplus']);
    } else if (req.body.medlink.includes('tabletshablet')) {
        final.push(imageLogos['tabletshablet']);
    } else if (req.body.medlink.includes('healthmug')) {
        final.push(imageLogos['healthmug']);
    } else if (req.body.medlink.includes('myupchar')) {
        final.push(imageLogos['myupchar']);
    }
    res.render(__dirname + '/mediToSite', { final: final });

});


app.get('/medname', async (req, res) => {
    // Insert Login Code Here

    const final = []

    const l = (req.query['q']);
    var urlForPe = `https://pharmeasy.in/search/all?name=${l}`;
    var urlForAp = `https://www.apollopharmacy.in/search-medicines/${l}`;

    extractMedNamesFromApollo = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);
            var temp;
            // BreadCrumb_peBreadCrumb__2CyhJ
            $('.ProductCard_pdHeader__ETKkp').map((i, elm) => {
                if ($(elm).find(".ProductCard_productName__f82e9").text().includes('Apollo')) {

                } else {
                    final.push({
                        name: $(elm).find(".ProductCard_productName__f82e9").text(),
                        img: $(elm).find('img').attr('src'),
                    })
                }
            })
            final.sort();
            final.push(req.query['q']);
            // console.log(final)

        } catch (error) {
            // res.sendFile(__dirname + '/try.html');
            // res.sendFile(__dirname + '/error.html');
            // console.log(error);

            console.log(error);
            return {};
        }
    };
    extractMedNamesFromPharmeasy = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)
            const $ = cheerio.load(data);
            // console.log(data)
            // console.log(final);
            $('.Search_medicineLists__hM5Hk').map((i, elm) => {
                final.push({
                    name: $(elm).find('.ProductCard_medicineName__8Ydfq').text(),
                    img: (($(elm).find('.ProductCard_medicineImgDefault__Q8XbJ noscript').html()).split('src="')[1]).split('"')[0],
                    manufacturerName: ($(elm).find('.ProductCard_brandName__kmcog').text().split("By")[1]),
                })
            });





        } catch (error) {
            // res.sendFile(__dirname + '/try.html');
            // res.sendFile(__dirname + '/error.html');
            // console.log(error);
            final.push({
                name: "No Products Found",
            });


        }
    };

    await Promise.all([extractMedNamesFromPharmeasy(urlForPe)])

    // final.sort();
    // console.log(final)
    final.push(req.body.pin);
    final.push(req.body.foodItem);
    // return final;
    res.send(final)
    // res.render(__dirname + '/medDetails', { final: final });
});

app.get('/med', async (req, res) => {
    // Insert Login Code Here

    const final = []
    console.log();

    const l = (req.query['q']);
    var urlForPe = `https://pharmeasy.in/search/all?name=${l}`;
    var urlForAp = `https://www.apollopharmacy.in/search-medicines/${l}`;

    extractMedNamesFromApollo = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);
            var temp;
            // BreadCrumb_peBreadCrumb__2CyhJ
            $('.ProductCard_pdHeader__ETKkp').map((i, elm) => {
                if ($(elm).find(".ProductCard_productName__f82e9").text().includes('Apollo')) {

                } else {
                    final.push({
                        name: $(elm).find(".ProductCard_productName__f82e9").text(),
                        img: $(elm).find('img').attr('src'),
                    })
                }
            })
            final.sort();
            final.push(req.query['q']);
            // console.log(final)

        } catch (error) {
            // res.sendFile(__dirname + '/try.html');
            // res.sendFile(__dirname + '/error.html');
            // console.log(error);

            console.log(error);
            return {};
        }
    };
    extractMedNamesFromPharmeasy = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)
            const $ = cheerio.load(data);
            // console.log(data)
            // console.log(final);
            $('.Search_medicineLists__hM5Hk').map((i, elm) => {
                final.push({
                    name: $(elm).find('.ProductCard_medicineName__8Ydfq').text(),
                    img: (($(elm).find('.ProductCard_medicineImgDefault__Q8XbJ noscript').html()).split('src="')[1]).split('"')[0],
                })
            });





        } catch (error) {
            // res.sendFile(__dirname + '/try.html');
            // res.sendFile(__dirname + '/error.html');
            // console.log(error);
            final.push({
                name: "No Products Found",
            });


        }
    };

    await Promise.all([extractMedNamesFromPharmeasy(urlForPe)])

    // final.sort();
    console.log(final)
    final.push(req.body.pin);
    final.push(req.body.foodItem);

    res.render(__dirname + '/medDetails', { final: final });
});

app.post('/products', async (req, res) => {
    // Insert Login Code Here

    const final = []
    console.log(req.body.foodItem)
    urlForPe = `https://www.pulseplus.in/products/${req.body.foodItem}`;
    extractdoe = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);
            var temp;
            var count = 0;
            // BreadCrumb_peBreadCrumb__2CyhJ
            try {

                $('.col-sm-4 a').map((i, elm) => {
                    // if(count<100){

                    final.push({
                        name: $(elm).text(),
                        link: 'https://www.pulseplus.in' + $(elm).attr('href')
                    });
                    count++;
                    // }
                })

            } catch (e) {
                console.log(e);
            }
            // final.sort();
            // final.push(req.body.pin);
            // final.push(req.body.foodItem);
            // console.log(final)

        } catch (error) {
            return {};
        }
    };
    await extractdoe(urlForPe);
    res.render(__dirname + '/charMedSearch', { final: final });
});

app.post('/bookdoc', async (req, res) => {
    // Insert Login Code Here

    const final = []
    // console.log(req.body.foodItem)
    urlForPe = `https://www.apollo247.com/specialties`;
    extractdoe = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);

            console.log($.html());
            const specialties_img = []//detailed description
            const specialties_link = []//detailed description
            const specialties_category = []//detailed description
            const specialties_reason = []//detailed description
            const specialties_type = []//detailed description
            // const descr = [];

            $('.Specialties_specialityLogo__3ksS8 img').map((i, elm) => {
                specialties_img.push($(elm).attr('src')); //image
            })


            $('.Specialties_spContent__3exhw').map((i, elm) => {
                specialties_category.push($(elm).find('div').first().text());
                specialties_reason.push($(elm).find('.Specialties_specialityDetails__2wrMe').text());
                specialties_type.push($(elm).find('.Specialties_symptoms__1mIse').text());
            })


            final.push({
                specialties_img: "https://prodaphstorage.blob.core.windows.net/specialties/ee249e8a-950a-489c-8a33-8846889831f5.jpg",
                specialties_category: "Dermatology",
                specialties_link: "https://www.apollo247.com/specialties/dermatology",
                specialties_reason: "Specialists for skin and hair treatments",
                specialties_type: "Rashes, Pimples, Acne, Hairfall, Dandruff",
            })
            final.push({
                specialties_img: "https://newassets.apollo247.com/specialties/ic_general_medicine.png",
                specialties_category: "General Physician/ Internal Medicine",
                specialties_link: "https://www.apollo247.com/specialties/general-physician-internal-medicine",
                specialties_reason: "Managing acute medical conditions",
                specialties_type: "Typhoid, Abdominal Pain, Migraine, Infections",
            })
            final.push({
                specialties_img: "https://newassets.apollo247.com/specialties/ic_paediatrics.png",
                specialties_category: "Paediatrics",
                specialties_link: "https://www.apollo247.com/specialties/paediatrics",
                specialties_reason: "Specialists to care and treat children",
                specialties_type: "Constipation, Puberty, Nutrition, Autism",
            })

            for (var i = 0; i < specialties_type.length; i++) {
                final.push({
                    specialties_img: specialties_img[i],
                    specialties_category: specialties_category[i],
                    specialties_link: "https://www.apollo247.com/specialties/" + ((((specialties_category[i].replaceAll('/', '-')).replaceAll(',', '')).replaceAll('&', 'and')).replaceAll(' ', '-')),
                    specialties_reason: specialties_reason[i],
                    specialties_type: specialties_type[i],
                })
            }
            console.log(final);

        } catch (error) {
            return {};
        }
    };
    await extractdoe(urlForPe);
    res.render(__dirname + '/orderDocOnline', { final: final });
});

app.get('/getOffers', async (req, res) => {
    // console.log(req.body.chemName)
    var final = await getOffersOfNetmeds();
    res.send(final);
});

app.get('/getNearbyChemistData', async (req, res) => {
    // Insert Login Code Here

    const final = []


    urlForPe = `https://www.bing.com/search?q= chemists in ${req.query['chemCity']}  pincode-${req.query['chemPin']} `;
    extractdoe = async (url) => {
        try {
            // Fetching HTML

            const browser = await puppeteer.launch({
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                ]
            });;
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });
            const data = await page.evaluate(() => document.querySelector('*').outerHTML);
            await browser.close();

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);
            const chemist_name = [];
            const chemist_direction = [];
            const chemist_status = [];
            const chemist_addr = [];

            final.push({ map_img: $('#mv_baseMap').attr('src') });

            $('.lc_content h2').map((i, elm) => {
                chemist_name.push($(elm).text()); //gtext form bing for maps
            })
            $('.lc_content').map((i, elm) => {
                chemist_addr.push($(elm).find('.b_factrow:nth-child(3)').text()); //gtext form bing for maps
            })

            $('a[aria-label="directions"]').map((i, elm) => {
                chemist_direction.push($(elm).attr('href')); //gtext form bing for maps
            })

            $('.lc_content').map((i, elm) => {
                chemist_status.push($(elm).find('.b_factrow:nth-child(4)').text())
            })



            for (var i = 0; i < chemist_name.length; i++) {
                final.push({
                    chemist_name: chemist_name[i],
                    chemist_direction: `https://www.google.com/maps/dir//${chemist_name[i]} in ${req.query['chemCity']} ${req.query['chemPin']}`,
                    chemist_status: chemist_status[i],
                    chemist_addr: chemist_addr[i],
                })
            }
            final.push($('.b_ilhTitle').text())
        } catch (error) {
            return {};
        }
    };
    await extractdoe(urlForPe);
    res.send(final);
});

app.post('/shops', async (req, res) => {
    // Insert Login Code Here

    const final = []
    console.log(req.body.foodArea)
    console.log(req.body.foodItem)
    urlForPe = `https://www.bing.com/search?q=10 chemist shops%20in%20%20mumbai%20400007`;
    extractdoe = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);
            console.log($.html())
            const chemist_name = [];
            const chemist_direction = [];
            const chemist_status = [];

            final.push({ map_img: $('#mv_baseMap').attr('src') });

            $('.lc_content h2').map((i, elm) => {
                chemist_name.push($(elm).text()); //gtext form bing for maps
            })

            $('a[aria-label="directions"]').map((i, elm) => {
                chemist_direction.push($(elm).attr('href')); //gtext form bing for maps
            })

            $('.opHours>span>span').map((i, elm) => {
                chemist_status.push($(elm).text()); //gtext form bing for maps
            })



            for (var i = 0; i < chemist_name.length; i++) {
                final.push({
                    chemist_name: chemist_name[i],
                    chemist_direction: "https://bing.com" + chemist_direction[i],
                    chemist_status: chemist_status[i],
                })
            }
            console.log(final)
        } catch (error) {
            return {};
        }
    };
    await extractdoe(urlForPe);
    res.render(__dirname + '/shopsnearme', { final: final });
});

app.post('/doclist', async (req, res) => {
    // Insert Login Code Here

    const final = []
    console.log(req.body.foodItem)
    const docUrl = req.body.foodItem;
    // urlForPe = `https://www.apollo247.com/specialties`;
    extractdoe = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);
            // console.log($.html())


            const doc_img = []//detailed description
            const doc_link = []//detailed description
            const doc_name = []//detailed description
            // const doc_desc = []//detailed description
            const doc_price = []//detailed description
            const doc_avail = []//detailed description
            const final = [];
            // const descr = [];

            try {
                $('.MuiAvatar-img').map((i, elm) => {
                    doc_img.push($(elm).attr('src')); //image
                })

                $('.jss192>a').map((i, elm) => {
                    doc_link.push($(elm).attr('href')); //link
                })

                $('.MuiAvatar-img').map((i, elm) => {
                    doc_name.push($(elm).attr('alt')); //
                })

                // $('.jss193 .jss199').map((i, elm) => {
                //     doc_desc.push($(elm).find('h2').text() + " " + $(elm).find('span').text() ); //
                //   })

                $('.jss216 span').map((i, elm) => {
                    doc_price.push($(elm).text()); //
                })


                $('.jss227 p').map((i, elm) => {
                    doc_avail.push($(elm).text()); //
                })
            } catch (e) {
                console.log(e);
            }

            for (var i = 0; i < doc_img.length; i++) {
                final.push({
                    doc_name: doc_name[i],
                    doc_img: doc_img[i],
                    //   doc_desc:doc_desc[i],
                    doc_price: doc_price[i],
                    doc_avail: doc_avail[i],
                    doc_link: "https://www.apollo247.com" + doc_link[i],
                })
            }

            console.log(final);

            res.render(__dirname + '/docOnlineList', { final: final });
        } catch (error) {
            return {};
        }
    };
    await extractdoe(docUrl); z``
});

app.post('/description', async (req, res) => {
    // Insert Login Code Here

    const final = []
    const l = (req.query['q']);
    url = req.body.foodLink;


    extractDescFromApollo = async (url) => {
        try {
            // Fetching HTML

            const { data } = await axios.get(url)

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);
            // console.log($.html())



            const z = []//detailed description
            const x = [];
            const descr = [];
            $('.ProductDetailsGeneric_descListing__w3wG3 h2').map((i, elm) => {
                z.push($(elm).text());
            })

            $('.ProductDetailsGeneric_descListing__w3wG3 div').map((i, elm) => {
                x.push($(elm).text());
                //  console.log('https://www.pulseplus.in'+$(elm).attr('href'));                        
            })

            for (var i = 0; i < x.length; i++) {
                descr.push({
                    'data': z[i],
                    'res': x[i]
                });
            }

            console.log(descr)
            const y = [];
            var temp, temp2;
            $('.PdpFaq_panelRoot__3xR9g').map((i, elm) => {
                temp = $(elm).text().split('?')[0];
                temp2 = $(elm).text().split('?')[1];
                y.push({
                    heading: temp,
                    data: temp2
                });
            });

            final.push({
                desc: descr,
                faq: y,
            });












            url = url.split('?')[0];
            // url="https://apollopharmacy.in"+url;
            console.log('got it->' + url);

            // var a = JSON.parse($('#__NEXT_DATA__').text());
            // var fa = a['props']['pageProps']['productDetails']['similar_products'];
            // if (!fa) {
            //     fa = a['props']['pageProps']['productDetails'];
            // }


            // if (fa.length > 0) {
            //     for (var i = 0; i < fa.length; i++) {
            //         final.push({
            //             subsname: fa[i]['name'],
            //             subsprice: fa[i]['price'],
            //             subsImgLink: "https://newassets.apollo247.com/pub/media" + fa[i]['image'],
            //         })
            //     }

            // } else {
            //     fa = a['props']['pageProps']['productDetails']['productSubstitutes']['products'];
            //     for (var i = 0; i < fa.length; i++) {
            //         final.push({
            //             subsname: (fa[i]['name']),
            //             subsprice: (fa[i]['price']),
            //             subsImgLink: ("https://newassets.apollo247.com/pub/media" + fa[i]['image']),
            //         })
            //     }
            // }
            // final.push(url)




            // console.log(final)

        } catch (error) {
            // res.sendFile(__dirname + '/try.html');
            // res.sendFile(__dirname + '/error.html');
            // console.log(error);

            // console.log(error);
            return {};
        }
    };



    urlForYtVideo = `https://in.video.search.yahoo.com/search?p=${l}+medicine+site:youtube.com&fr=sfp`;

    extractdoe = async (url) => {
        try {
            // Fetching HTML
            const { data } = await axios.get(url)

            // Using cheerio to extract <a> tags
            const $ = cheerio.load(data);
            var temp;
            const vname = [], vlink = [], vimglink = [];
            $('.v-meta h3').each(function (i, elm) {
                vname.push($(elm).text()) // for name 
            });
            $('.results li a').each(function (i, elm) {
                vlink.push($(elm).attr('data-rurl')) // for name 
            });
            $('.fill img').each(function (i, elm) {
                vimglink.push($(elm).attr('src')) // for name 
            });
            // BreadCrumb_peBreadCrumb__2CyhJ
            console.log(vname)
            try {
                for (var i = 0; i < 3; i++) {

                    final.push({
                        videoname: vname[i],
                        videolink: vlink[i],
                        videoImgLink: vimglink[i],
                    });
                }


            } catch (e) {
                console.log(e);
            }
            final.push({ nameOfMed: l });
            // console.log(final)

        } catch (error) {
            // res.sendFile(__dirname + '/try.html');
            // res.sendFile(__dirname + '/error.html');
            // console.log(error);

            console.log(error);
            return {};
        }
    };

    await extractDescFromApollo(url);
    await extractdoe(urlForYtVideo);
    // console.log(final)


    res.send(final);

});

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/name.html');
// });

// extractLinkFromGoogle = async(url) => {
//     try {
//         // Fetching HTML
//         const { data } = await axios.get(url)

//         // Using cheerio to extract <a> tags
//         const $ = cheerio.load(data);


//         rawUrl = $('.kCrYT>a').first().attr('href');
//         url = rawUrl.split("/url?q=")[1].split("&")[0];
//         console.log('Extracting url: ', url);

//         return url;

//     } catch (error) {
//         // res.sendFile(__dirname + '/try.html');
//         // res.sendFile(__dirname + '/error.html');
//         console.log(error);
//         return 0;
//     }
// };

function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    // Initialize the matrix
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    // Fill the matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[len1][len2];
}




extractLinkFromBing = async (url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)
        // console.log(typeof(data));
        // console.log(data)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        // console.log($.html());

        const rawUrl = $('li[class=b_algo] h2 a').first().attr('href');
        console.log(rawUrl);
        if (rawUrl != undefined) {
            return rawUrl
        } else {
            return '';
        }
        // url = rawUrl.split("/url?q=")[1].split("&")[0];
        // console.log('Extracting url: ', url);


    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

extractLinkFromyahoo = async (url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)
        // console.log(typeof(data));
        // console.log(data)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        // console.log($.html());

        const rawUrl = $('li .compTitle h3 a').first().attr('href');
        console.log(rawUrl);
        if (rawUrl != undefined) {
            return rawUrl
        } else {
            return '';
        }

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return 0;
    }
};



getOffersOfPharmeasy = async () => {

    const { data } = await axios.get(`https://pharmeasy.in/offers`)

    // Using cheerio to extract <a> tags
    const $ = cheerio.load(data);
    const offer = [];
    var count = 0;
    $('.OffersCard_container__L_jzu').map((i, elm) => {
        if (count < 2) {
            offer.push({
                offer: $(elm).find('.OffersCard_offerInnerContainer__r_zuK').text(),
                code: ($(elm).find('.OffersCard_code__bTCOL').text()),
            });
            count++;
        }
    });
    return offer;
}

function getPackSize(productName) {
    // Match both whole numbers and decimal numbers
    const allNumbers = productName.match(/\d+(\.\d+)?/g);

    // If there's at least one match, return the last one as the pack size
    if (allNumbers && allNumbers.length > 0) {
        return allNumbers[allNumbers.length - 1]; // Last number is often the pack size
    }

    // If no numbers are found, return an empty string
    return '';
}


function getDeliveryChargeForPharmeasy(price) {
    var dc = 0;
    if (price < 300) {
        dc = 199;
    } else if (price >= 300 && parseFloat(price) < 500) {
        dc = 129;
    } else if (price >= 500 && parseFloat(price) < 750) {
        dc = 49;
    } else if (price >= 750 && parseFloat(price) < 1000) {
        dc = 25;
    } else if (price >= 1000 && parseFloat(price) < 1250) {
        dc = 14;
    } else if (price >= 1250) {
        dc = 0;
    }


    return dc;
}
extractManufacNameFromPharmeasy = async (url) => {
    const { data } = await axios.get(url)
    const $ = cheerio.load(data, { xmlMode: false });
    var a = JSON.parse($('script[type=application/json]').text());
    return a['props']['pageProps']['productDetails']['manufacturer'];
}
extractDataOfPharmEasy = async (meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {
    try {
        var filterCount = 600;


        var pharmeasyData = await axios.get(`https://pharmeasy.in/apt-api/search/search?q=${nameOfMed}`);
        if(!pharmeasyData){
            var searchName=extractSearchName(nameOfMed);
             pharmeasyData = await axios.get(`https://pharmeasy.in/apt-api/search/search?q=${searchName}`);
        }



        const products = (pharmeasyData.data.data.products);
        
        var fprod = [];
        
        const filteredProducts = products.filter(product => {
            // Check if text_msg is defined and not empty
            const extractedNumber = parseFloat(extractLargestNumber(product.subtitleText));
            // Compare it with medicinePackSize
            if (medicinePackSize.includes(extractedNumber)) {
                fprod.push(product);
            }
        });
        
        
        
        // Log the filtered products
        //   console.log(filteredProducts);
        
        const targetString = nameOfMed.toLowerCase();
        
        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;
        
        fprod.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.name.toLowerCase(), targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });
        
        var finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
            // console.log(mostSimilarProduct)
        } else {
            console.log('No products found with that package size');
            return {};
        }
        
        
        console.log("FinalProd From Pharmeasy"+finalProd.name)



        const { data } = await axios.get(`https://pharmeasy.in/online-medicine-order/${finalProd.slug}`, { timeout: 5000 });
        const $ = cheerio.load(data, { xmlMode: false });

        var lson = await axios.get(`https://pharmeasy.in/apt-api/pincode/pincode?pincode=${pincode}`);
        // lson = Pincode Serviceable or not

        var delTime = ''

        if (lson.data.neighbourhoodAttributes.isExpressAvailable || null) {
            delTime = "1 - 2 days"
        } else {
            delTime = "2 - 7 days"
        }

        if (lson.data && lson.data.cityAttributes) {
            lson = "Pincode Serviceable"
        } else {
            lson = "Pincode Not Serviceable"
        }



        var a = JSON.parse($('script[type=application/json]').text());


        var costPrice = 0;
        var finalPrice = 0;
        var discProv = parseInt(a['props']['pageProps']['productDetails']['discountPercent']);
        // console.log(a['props']['pageProps']['productDetails'])
        costPrice = parseFloat(a['props']['pageProps']['productDetails']['costPrice']);

        if (discProv == 4 || discProv == 8 || discProv == 12) {
            if (costPrice <= 749) {
                finalPrice = costPrice;
            } else if (costPrice > 749 && costPrice <= 849) {
                finalPrice = costPrice - (costPrice * 0.04);
            } else if (costPrice > 849 && costPrice <= 999) {
                finalPrice = costPrice - (costPrice * 0.8);
            } else if (costPrice > 999) {
                finalPrice = costPrice - (costPrice * 0.12);
            }
        } else {
            finalPrice = parseFloat(a['props']['pageProps']['productDetails']['salePrice'])
        }




        var dc = '';
        var dc = 0;
        if (parseFloat(costPrice) < 300) {
            dc = 199;
        } else if (parseFloat(costPrice) >= 300 && parseFloat(costPrice) < 500) {
            dc = 129;
        } else if (parseFloat(costPrice) >= 500 && parseFloat(costPrice) < 700) {
            dc = 49;
        } else if (parseFloat(costPrice) >= 700) {
            dc = 0;
        }

        try {
            var imgurl = a['props']['pageProps']['productDetails']['damImages'][0]['url'];
        } catch (e) {
            imgurl = "";
        }



        var salts = (a['props']['pageProps']['productDetails']['compositions'].map(composition => composition.name) || "NA")

        if (typeof (salts) == 'string') {
            salts = [salts];
        }

        console.log("Size In Pharmeasy " + a['props']['pageProps']['productDetails']['measurementUnit']);
        var qty = a['props']['pageProps']['productDetails']['measurementUnit'];

        if (qty == '' || qty == "NA" || qty == " " || qty == null) {
            qty = getPackSize(a['props']['pageProps']['productDetails']['name']);
        } else {
            qty = extractLargestNumber(qty);
        }



        var cfnieScore = 0;
        try {
            var newcfnie = a['props']['pageProps']['productDetails']['name'].match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];
            console.log(newcfnie)
            var foundCount = 0;

            if (cfnie.length) {

                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    var inSalt = salts.includes(num.toString()) || 0;
                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inPackSize = [qty].includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
                    console.log("AAAA inside pharmeasy" + meddata.packSize)
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }

                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    console.log("foundcount length in pharmeasy " + foundCount)
                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }

        } catch (error) {
            console.log(error)
            filterCount -= 100;;
        }

        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }


        var smed = parseFloat(await calculateSimilarity(a['props']['pageProps']['productDetails']['name'].toLowerCase(), nameOfMed.toLowerCase()));


        // if(finalCharge>=749&&finalCharge<849){
        //     finalCharge=finalCharge-(0.04*finalCharge)
        // }else if(finalCharge>=849&&finalCharge<999){
        //     finalCharge=finalCharge-(0.08*finalCharge)
        // }else{
        //     finalCharge=finalCharge-(0.12*finalCharge)
        // }

        var firstWordScore = 0;
        var firstWord = a['props']['pageProps']['productDetails']['name'];
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = a['props']['pageProps']['productDetails']['name'].toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;


        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = a['props']['pageProps']['productDetails']['name'].replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase();
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        // //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);



        if (secondaryAnchor != '@') {

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }

        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }


        return {
            name: 'PharmEasy',
            item: a['props']['pageProps']['productDetails']['name'],
            link: `https://pharmeasy.in/online-medicine-order/${finalProd.slug}`,
            imgLink: imgurl,
            price: finalPrice.toFixed(2),
            offer: '',
            deliveryCharge: dc ? dc : 0,
            finalCharge: (parseFloat(finalPrice + dc)).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            newcfnie: newcfnie,
            cfnieScore: cfnieScore,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,

            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            secondaryAnchor: secondaryAnchor,
            tempnewanchor: tempnewanchor,

            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            lson: lson,
            deliveryTime: delTime,

            manufacturerName: a['props']['pageProps']['productDetails']['manufacturer'],
            medicineAvailability: (a['props']['pageProps']['productDetails']['productAvailabilityFlags']['isAvailable']),
            minQty: a['props']['pageProps']['productDetails']['minQuantity'],
            saltName: salts,
            qtyItContainsDesc: qty,
            LevenshteinDistance: levenshteinDistance(nameOfMed.toLowerCase(), a['props']['pageProps']['productDetails']['name']),
        };


    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

extractDataOfMedkart = async (meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, secondaryAnchor,pincode, releaseMechanism) => {
    try {

        var filterCount = 600;

        // console.log("link->"+nameOfMed)
        const url = `https://api-console.mkart.dev/api/v1/product/search?q=${nameOfMed}&page=1`;

        const headers = {
            'Content-Type': 'application/json', // Example header
            'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNzhlOGVkMTZiMTBlMmFiYzhiNDdkNDdkYTExZmI5MzFlYjNlMGZiNzBhZjg4Njg2NDI3MTFjMjU5ZjRiZjVjMGQ0MWU4MDhlNzhkZGM3MjUiLCJpYXQiOjE3MTk2NTkyNTYuMzYyOTY0LCJuYmYiOjE3MTk2NTkyNTYuMzYyOTY2LCJleHAiOjE3NTExOTUyNTYuMzQ5NzcsInN1YiI6IjQiLCJzY29wZXMiOltdfQ.jJw6_397To_aq8fdRqBIsJPNsSCJopU75SZIGOmzoe5iRlINC17d4yJrg1vW6GfBse8SEM8FHg98dQOFYc3nxaIfP8fZwLgk6LcGapBWtZPV4w3p9VqRP8Iwx8-z4R48W5MW9qLE-6SB0ikcuBZzYDj6adyxgBfZDvOGqqBgk3lDM-YCUZl6SFWvtO0emkPjq9ZnB5P_HUBArPgzEY5rE9U9kWbKYCgpB_N19qcSiconCSjJJDXu-cfPIudYsJvSYREluz9hfh02gyxFdcxmgafNM32MRjx3x7KU1OcD3F7tTzxkDDCunPNn9P36lKV5SHVCg0-3og621uTsl5Xc5tO137jupbNSTqCzyRZ4bzqt3amAhRD01aHkEl0jZ4qyFJDPy6c7z8wyQP4W2zk1paucsgFmvmZY0IqiY9EVe-YVN3jks5uTstUVvOWdladFVAQrmUsiL0wNKomRUY9slgi0zAN47fnCOGz5sTit7fYqRpNyS2g2luYtpgq6u_AGEve2sEjOXmxKcrm5hCOUL9xsIedv6KfttZmBqFmoMLbIYENc6GK4EwEn3UinC0_aOnARpzYE9r1LEdTTB76vRaONDvPLJzZdVZROtpWjEFPdp2v8JnsnOjwpDszwfFOYSqlcEaSb2VtaNW8Y1bL38vdaT3pTJbTdMtQZGnB_UxE',
        };

        const response = await axios.get(url, { headers: headers, timeout: 5000 })

        const products = response.data.data.products;
        // console.log(products);

        // const products = jsonData.data.products;

        // Filter products with package_size of 10
        const filteredProducts = products.filter(product =>
            medicinePackSize.includes(parseFloat(product.package_size))
        );
        // Log the filtered products
        //   console.log(filteredProducts);

        const targetString = nameOfMed.toLowerCase();

        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        filteredProducts.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.name.toLowerCase(), targetString.toLowerCase());
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        var finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
            // console.log(mostSimilarProduct)     
        } else {
            console.log('No products found with that package size');
        }

        console.log(finalProd)


        var saltSection = (finalProd.combinations || "NA");
        if (typeof (saltSection) == 'string') {
            saltSection = [saltSection];
        }

        var cfnieScore = 0;
        try {
            var newcfnie = finalProd.name.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    var inPackSize = ([finalProd.package_size]).includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
              //      console.log("AAAA inside pharmeasy")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }


        } catch (error) {
            filterCount -= 100;;
        }


        //   console.log(finalProd);

        var qty = finalProd.package_size;
        qty = parseFloat(qty);
        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.name.toLowerCase(), nameOfMed.toLowerCase()));

        var firstWordScore = 0;
        var firstWord = finalProd.name;
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = finalProd.name.toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = finalProd.name.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        if (secondaryAnchor != '@') {

            const allPresent = secondaryAnchor.every(anchor =>
                newTempStringForExtractingSecondaryAnchor.includes(anchor.toLowerCase())
            ); // this checks if all Og secondary anchors , are present in the new string or not


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }

        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }


        var lson="Not Serviceable";
        var deltimeData;
        var delTime="";
        var dc=0;

        try {
            deltimeData = await axios.get(`https://app.medkart.in/api/v1/pincode-details?pincode=${pincode}`);

            if(deltimeData.data.code==200){
                if(deltimeData.data["pincode-details"].is_deliverable){
                    lson="Pincode Serviceable";
                    delTime=deltimeData.data["pincode-details"].delivery_time;
                    dc=parseFloat(deltimeData.data["pincode-details"].normal_charges);
                }else{
                    lson="Pincode Not Serviceable";
                }
            }else{
                lson="Pincode Not Serviceable";
            }

            

        } catch (error) {
            deltimeData="";
        }
       

        // var delTime = (deltimeData.data.Result.result[0].delivery_estimate.in_day_counts.on_or_after);


        
        var finalPrice=finalProd.mrp +dc;


        return {
            name: 'Medkart',
            item: finalProd.name ? finalProd.name : '',
            link: finalProd.slug ? `https://www.medkart.in/${finalProd.slug}` : '',
            imgLink: finalProd.images && finalProd.images[0] ? finalProd.images[0].url : '',
            price: finalProd.mrp ? finalProd.mrp : 0,
            offer: finalProd.sales_price ? finalProd.sales_price : 0,
            deliveryCharge: finalProd.mrp < 1500 ? 70 : 0,
            finalCharge: finalPrice.toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,

            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,
            lson: lson,
            deliveryTime:delTime,

            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: finalProd.manufacturer_name ? finalProd.manufacturer_name : 0,
            medicineAvailability: finalProd.is_live ? finalProd.is_live : 0,
            minQty: 1,
            saltName: saltSection,
            qtyItContainsDesc: `${finalProd.package_size ? finalProd.package_size : 0} ${finalProd.uom ? finalProd.uom : 0}`
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {
            name: 'Medkart',
            item: '',
            link: '',
            imgLink: '',
            price: 0,
            offer: 0,
            deliveryCharge: 0,
            finalCharge: 0,
            // similarityIndex: simIndex,
            smed: 0,
            sman: 0,
            manufacturerName: 0,
            medicineAvailability: 0,
            minQty: 1,
            saltName: 0,
            qtyItContainsDesc: 0,
        };

        console.log(error);
        // return {};
    }
};


extractDataOfFlipkart = async (url, nameOfMed) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        var dc = '';

        if ($('.custAddCrtBtn').attr('offerprice') < 99) {
            dc = 75;
        } else if ($('.custAddCrtBtn').attr('offerprice') >= 100 && $('.custAddCrtBtn').attr('offerprice') < 299) {
            dc = 49;
        } else if ($('.custAddCrtBtn').attr('offerprice') >= 300 && $('.custAddCrtBtn').attr('offerprice') < 499) {
            dc = 19;
        } else if ($('.custAddCrtBtn').attr('offerprice') >= 500) {
            dc = 0;
        }

        return {
            name: 'Flipkart Health+',
            item: ($('.custAddCrtBtn').attr('displayname')).substring(0, 30),
            link: url,
            imgLink: $('#med_dtl_img').attr('src'),
            price: $('.custAddCrtBtn').attr('offerprice'),
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat($('.custAddCrtBtn').attr('offerprice')) + parseFloat(dc),
            similarityIndex: await calculateSimilarity(($('.custAddCrtBtn').attr('displayname')).toLowerCase(), nameOfMed.toLowerCase()),


        };
    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);

        console.log(error);
        return {};
    }
};

function getDeliveryChargeForNetmeds(totalMedPrice) {
    var dc = 0;
    if (totalMedPrice < 199) {
        dc = 69;
    } else if (totalMedPrice >= 199 && totalMedPrice < 499) {
        dc = 49;
    } else if (totalMedPrice >= 499 && totalMedPrice < 999) {
        dc = 29;
    } else if (totalMedPrice > 1000) {
        dc = 0;
    }
    return dc;
}
getOffersOfNetmeds = async () => {
    const { data } = await axios.get(`https://netmeds.com/offers`)

    // Using cheerio to extract <a> tags
    const $ = cheerio.load(data);
    const offers = [];
    const coupon = [], offerDet = [];

    $('.rOffer-Block .offer_sub_img').map((i, elm) => {
        offerDet.push($(elm).attr('alt')); //details
    });
    $('.rOffer-Block .offer-coupon').map((i, elm) => {
        coupon.push($(elm).text());
    });
    for (var i = 0; i < 2; i++) {
        offers.push({
            offer: offerDet[i],
            code: coupon[i],
        })
    }
    return offers;
}
extractDataOfNetMeds = async (url, meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {

    try {
        var filterCount = 600;

        const { data } = await axios.get(url, { timeout: 5000 });


        const $ = cheerio.load(data);
        var dc = '';

        var sku = $('div[class=wishlist] label').attr('data-sku');

        var pric = ($('.final-price').first().text());
        pric = pric.match(/\d+(\.\d+)?/)[0];

        var lson = await axios.get(`https://www.netmeds.com/nmsd/rest/v2/pin/${pincode}`);
        // lson = Pincode Serviceable or not

        if (lson.data.status === 'success') {
            lson = "Pincode Serviceable"
        } else {
            lson = "Pincode Not Serviceable"
        }

        if (parseFloat(pric) < 199) {
            dc = 69;
        } else if (parseFloat(pric) >= 199 && parseFloat(pric) < 250) {
            dc = 49;
        } else if (parseFloat(pric) >= 250) {
            dc = 0;
        }


        var saltSection = ($('.drug-conf').first().text().split('+') || "NA");
        if (typeof (saltSection) == 'string') {
            saltSection = [saltSection];
        }

        var qty = $(".drug-varient").first().text();
        if (qty == '' || qty == "NA" || qty == " " || qty == null) {
            qty = await getPackSize($('.prodName h1').first().text());
        } else {
            qty = extractLargestNumber(qty);
        }



        var cfnieScore = 0;
        try {
            var newcfnie = $('.prodName h1').first().text().match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    var inPackSize = [qty].includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
              //      console.log("AAAA inside pharmeasy")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }

        } catch (error) {
            filterCount -= 100;;
        }

        const params = {
            "pincode": pincode,
            "do_not_split": false,
            "calling_to_route": true,
            "lstdrug": [
                {
                    "itemcode": sku,
                    "Qty": 1
                }
            ]
        };
        var deltimeData = await axios.post(`https://www.netmeds.com/nmsp/api/v2/Splitpost`, params);

        var delTime = (deltimeData.data.Result.result[0].delivery_estimate.in_day_counts.on_or_after);

        if (delTime > 2) {
            delTime = `${delTime - 2} - ${delTime} days`;
        } else {
            delTime = `${delTime - 1} - ${delTime} days`;
        }




        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity($('.product-detail .prodName h1').first().text().toLowerCase(), nameOfMed.toLowerCase()));


        var firstWordScore = 0;
        var firstWord = $('.prodName h1').first().text();
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = $('.prodName h1').first().text().toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = $('.prodName h1').first().text().toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase();
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        if (secondaryAnchor != '@') {

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }

        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }


        return {
            name: 'NetMeds',
            item: $('.prodName h1').first().text(),
            link: url,
            imgLink: $('.largeimage img').attr('src'),
            price: parseFloat(pric),
            offer: '',
            deliveryCharge: dc,
            finalCharge: (parseFloat(pric) + parseFloat(dc)).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,

            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,

            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            secondaryAnchor: secondaryAnchor,
            tempnewanchor: tempnewanchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            lson: lson,
            deliveryTime: delTime,

            manufacturerName: $('span[class=drug-manu] > a').first().text(),
            medicineAvailability: $('.os-txt').text() == "" ? true : false,
            minQty: parseFloat(($('.min_qty_alert').first().text().split(':')[1]) ? ($('.min_qty_alert').first().text().split(':')[1]) : 1),
            saltName: saltSection,
            qtyItContainsDesc: qty,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

function getDeliveryChargeForApollo(m) {
    var dc = 0;
    if (m < 200) {
        dc = 100;
    } else if (m >= 300 && m < 400) {
        dc = 75;
    } else if (m >= 400 && m < 500) {
        dc = 25;
    } else if (m >= 500) {
        dc = 0;
    }
    return dc;
}
getOffersOfApollo = async () => {
    const { data } = await axios.get(`https://www.apollopharmacy.in/special-offers`)

    // Using cheerio to extract <a> tags
    const $ = cheerio.load(data);
    const offers = [];
    const coupon = [], offerDet = [];
    $('.OffersCard_title__6QWzu').map((i, elm) => {
        offerDet.push($(elm).text());

    });
    $('.OffersCard_detailMainList__pLknV').map((i, elm) => {
        coupon.push($(elm).find('.OffersCard_dmtList__VMxN6').text());
    });

    for (var i = 0; i < 2; i++) {
        offers.push({
            offer: offerDet[i],
            code: coupon[i],
        })
    }

    return offers;
}
extractDataOfApollo = async (url, final, presReq, nameOfMed) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data, { xmlMode: false });
        const apolloData = JSON.parse($('#__NEXT_DATA__').text());
        console.log(url);

        console.log($('.PdpWeb_subTxt__Soj3p').text());

        try {
            m = apolloData.props.pageProps.productDetails.productdp.special_price;
            console.log(m)
        } catch (error) {
            m = apolloData.props.pageProps.productDetails.productdp.price;
            console.log(m)
        }
        // if (apolloData['props']['pageProps']['productDetails']['productdp']['is_prescription_required'] == 1) {
        //     presReq[0] = "Yes";
        // }
        //    console.log(fa);

        var t, m;
        const offers = [];
        //  await getOffersOfApollo(url,final);

        //  await Promise.all([getOffersOfApollo()])
        //         .then(await axios.spread(async (...responses) => {
        //             // console.log(...responses);
        //             offers.push(responses[0])
        //             // final.push(responses[1])

        //             // await extractSubsfApollo(item[7], final);
        //         }))
        console.log("Done");



        try {
            m = apolloData.props.pageProps.productDetails.productdp.special_price;
            console.log(m)
        } catch (error) {
            m = apolloData.props.pageProps.productDetails.productdp.price;
            console.log(m)
        }
        // console.log("price from apollo-> " + $('.MedicineInfoWeb_medicinePrice__HPf1s').text())
        var dc = '';

        // if (m < 300) {
        //     dc = 99;
        // } else if (m >= 300 && m < 500) {
        //     dc = 69;
        // } else if (m >= 500 && m < 800) {
        //     dc = 25;
        // } else if (m >= 800) {
        //     dc = 0;
        // }

        if (m < 200) {
            dc = 100;
        } else if (m >= 300 && m < 400) {
            dc = 75;
        } else if (m >= 400 && m < 500) {
            dc = 25;
        } else if (m >= 500) {
            dc = 0;
        }

        return {
            name: 'Apollo',
            item: apolloData.props.pageProps.productDetails.productdp.name,
            link: url,
            imgLink: 'https://newassets.apollo247.com/pub/media' + apolloData.props.pageProps.productDetails.productdp.image[0],
            price: m,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(m) + parseFloat(dc),
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

function extractNumbersWithDecimalPoints(text) {
    // Regex to match numbers with decimal points
    const regex = /[-+]?\d*\.?\d+/g;

    // Use match() to find all numbers in the string
    const matches = text.match(regex);

    // Convert matches to numbers
    const numbers = matches ? matches.map(Number) : [];

    if (numbers.length === 1) {
        numbers.unshift(1);
    }


    return numbers;
}

/*-----------------------------------------------------------------------------------------------*/








function normalizeString(str) {
    // Extract only alphanumeric characters and convert to lowercase
    return str.replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase();
}


function extractSearchName(medicineName) {
    // Split the input by spaces to get individual wordssea
    let words = medicineName.split(' ');


    // Check if the first word is a single character or a number
    if (!isNaN(words[0])) {
        // Return the first two words if the first word is a single character or a number
        return words[0].toLowerCase() + ' ' + words[1].toLowerCase();
    }

    if (words[0].toLowerCase() === 'dr') {
        // Return the second word if the first word is 'Dr'
        return words[1].toLowerCase();
    }

    // Return only the first word if it is not a single character or a number
    return words[0].toLowerCase();
}

function compareFirstWords(word1, word2) {
    // Normalize both words
    const normalizedWord1 = normalizeString(word1);
    const normalizedWord2 = normalizeString(word2);

    // console.log(normalizedWord1+" "+word1+"From Apolo")
    // console.log(normalizedWord2+"From Apolo")

    // If exact match fails, search for normalizedWord2 in word1
    if (normalizedWord1 === normalizedWord2) {
        return true;
    } else {
        var newnormalizedWord1 = normalizeString(word1).replace(/\s+/g, ' ').toLowerCase();
        console.log("***" + newnormalizedWord1)
        console.log(word2 + "*****")

        return newnormalizedWord1.includes(normalizedWord2);
    }
}






FastextractDataOfApollo = async (url, meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching HTML
        console.log(cfnie + " Apollp")
        var filterCount = 600;

        var a = url;
        const lastPart = a.replace(/\?doNotTrack=true$/, '').split('/').pop();


        const { data } = await axios.get(url, { timeout: 5000 });

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data, { xmlMode: false });
        // const apolloData = JSON.parse($('#__NEXT_DATA__').text());       
        const apolloData = await JSON.parse($('script[class="structured-data-list"]').html());
        // console.log("apollo data "+$.html())


        var cp = 0;
        //     $('#PDP\\ price\\ banner\\ Mweb span').each((i, el) => {
        // const text = $(el).text().trim();
        // if (text.startsWith('₹') || text.includes('MRP')) {
        //     // Extract the MRP values from the text
        //         cp=parseFloat(text.replace(/MRP|₹|\s+/g, '').trim());
        // }
        // });



        var apolloDataFromFirstApi;
        const apollourl = 'https://api.apollo247.com/';
        const apollofirstheaders = {
            Accept: '*/*',
            Authorization: 'Bearer 1',
        };


        const apollofirstbody = {
            operationName: 'getPDPV4',
            variables: {
                sku: lastPart,
                targetLanguage: '',
                pincode: `${pincode}`,
                lat: 1,
                lng: 1,
            },
            query: `query getPDPV4($lat: Float, $lng: Float, $pincode: String, $sku: String!, $targetLanguage: String) {
        getPDPV4(
            lng: $lng
            lat: $lat
            pincode: $pincode
            sku: $sku
            targetLanguage: $targetLanguage
        )
      }`,
        };

        try {
            apolloDataFromFirstApi = await axios.post(apollourl, apollofirstbody, {
                headers: apollofirstheaders, // Use 'headers' here
            });
            console.log(apolloData.data); // Log the response data
        } catch (error) {
            console.error('Error fetching data:', error.response ? error.response.data : error.message);
        }








        var saltSection = ($('h3:contains("Composition")').next('a').find('div').text() || "NA");
        if (typeof (saltSection) == 'string') {
            saltSection = [saltSection];
        }






        var qty = apolloDataFromFirstApi.data.data.getPDPV4.productdp.pack_size;
        if (qty == '' || qty == "NA" || qty == " " || qty == null) {
            qty = (getPackSize(apolloDataFromFirstApi.data.data.getPDPV4.productdp.name));
        } else {
            qty = extractLargestNumber(qty);
        }




        var cfnieScore = 0;
        try {

            var newcfnie = apolloDataFromFirstApi.data.data.getPDPV4.productdp.name.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    var inPackSize = [qty].includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
                console.log("AAAA apollo")
                if (newcfnie) {
                    console.log("AAAA inside apollo")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    console.log("AAAA inside apollo " + foundCount + "  " + newcfnie.length)
                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }

        } catch (error) {
            filterCount -= 100;;
        }

        console.log("FIlter Count in APollo" + filterCount)


        qty = parseFloat(qty);
        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }



        // console.log("price from apollo-> " + $('.MedicineInfoWeb_medicinePrice__HPf1s').text())
        var dc = '';

        // if (m < 300) {
        //     dc = 99;
        // } else if (m >= 300 && m < 500) {
        //     dc = 69;
        // } else if (m >= 500 && m < 800) {
        //     dc = 25;
        // } else if (m >= 800) {
        //     dc = 0;
        // }

        var lson = await axios.get(`https://apigateway.apollo247.in/serviceability-api//v1/geocode/serviceable?pincode=${pincode}`);
        // lson = Pincode Serviceable or not

        var delTime = '';

        if (lson.data.data.data.isServiceable) {
            if (lson.data.data.data.isCourierServiceable) {
                delTime = "2 - 4 days"
            }
            if (lson.data.data.data.isHyperlocalServiceable) {
                delTime = "3 - 24 hours"
            }
            if (lson.data.data.data.instantAvailableStore) {
                delTime = "1 - 3 hours"
            }
        }

        if (lson.data.data.data.isServiceable) {
            lson = "Pincode Serviceable"
        } else {
            lson = "Pincode Not Serviceable"
        }








        var smed = parseFloat(await calculateSimilarity(apolloDataFromFirstApi.data.data.getPDPV4.productdp.name.toLowerCase(), nameOfMed.toLowerCase()));



        var firstWordScore = 0;
        var firstWord = apolloDataFromFirstApi.data.data.getPDPV4.productdp.name;

        console.log("Apollo Data -> " + extractSearchName(nameOfMed));

        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = apolloDataFromFirstApi.data.data.getPDPV4.productdp.name.replace(/-/g, ' ').toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = apolloDataFromFirstApi.data.data.getPDPV4.productdp.name.replace(/-/g, ' ').toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);






        if (secondaryAnchor != '@') {

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }


        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }



        var apolloDataFromSecondSkuIdDetailApi;
        const apollsecondourl = 'https://api.apollo247.com/';
        const apollosecondheaders = {
            Accept: '*/*',
            Authorization: 'Bearer 1',
        };

        const sku = apolloDataFromFirstApi.data.data.getPDPV4.productdp.sku; // SKU value
        console.log(sku)

        const apollosecondbody = {
            operationName: 'getSkuInfo',
            variables: {
                skuInfoInput: {
                    sku: `${sku}`,
                    qty: 1,
                    addressInfo: {
                        pincode: `${pincode}`,
                        lat: 1,
                        lng: 7,
                    },
                },
            },
            query: `query getSkuInfo($skuInfoInput: SkuInfoInput!) {
            getSkuInfo(skuInfoInput: $skuInfoInput) {
              stat
              previouslyBought
              pdpPriceInfo {
                price
                mrp
                discount
                discountMessage
                dualPriceInfo {
                  circleCashbackPercent
                  circleCashbackValue
                  circleMembershipMessage
                  circlePrice
                  circleTotalDiscount
                  circleCashback
                  __typename
                }
                __typename
              }
              tatInfo {
                variantSKUs {
                  autoSelected
                  exist
                  mrp
                  qty
                  sellingPrice
                  sku
                  unitOfMeasurement
                  unitPrice
                  variant_attributes {
                    subVariant
                    variant
                    __typename
                  }
                  __typename
                }
                fasterTatVariant {
                  showAfterAtc
                  fasterTatVariants {
                    autoSelected
                    exist
                    mrp
                    pack_size
                    qty
                    sellingPrice
                    sku
                    unitOfMeasurement
                    unitPrice
                    variantSkuTatHours
                    variant_attributes {
                      subVariant
                      variant
                      __typename
                    }
                    __typename
                  }
                  __typename
                }
                tatResponse {
                  tat
                  formattedTat
                  skuTatHours
                  inventoryExist
                  items {
                    qty
                    sku
                    mrp
                    exist
                    __typename
                  }
                  tatU
                  __typename
                }
                magentoAvailability
                showTat
                message
                unitPrice
                packInfo
                tag {
                  name
                  value
                  __typename
                }
                __typename
              }
              __typename
            }
          }`,
        };

        try {
            apolloDataFromSecondSkuIdDetailApi = await axios.post(apollsecondourl, apollosecondbody, {
                headers: apollosecondheaders,
            });
        } catch (error) {
            console.error('Error fetching data:', error.response ? error.response.data : error.message);
        }


        var cp = parseFloat(apolloDataFromSecondSkuIdDetailApi.data.data.getSkuInfo.pdpPriceInfo.mrp);




        if (cp < 200) {
            dc = 49;
        } else if (cp > 200 && cp < 500) {
            dc = 9;
        } else if (cp >= 500) {
            dc = 0;
        }


        return {
            name: 'Apollo',
            item: apolloDataFromFirstApi.data.data.getPDPV4.productdp.name,
            link: url,
            imgLink: 'https://images.apollo247.in/pub/media' + apolloDataFromFirstApi.data.data.getPDPV4.productdp.image[0].imageUrl,
            price: cp,
            offer: '',
            deliveryCharge: dc,
            finalCharge: (cp + dc).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,
            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,


            secondaryAnchor: secondaryAnchor,
            tempnewanchor: tempnewanchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            lson: lson,
            deliveryTime: delTime,

            manufacturerName: apolloDataFromFirstApi.data.data.getPDPV4.productdp.manufacturer,
            medicineAvailability: apolloDataFromSecondSkuIdDetailApi.data.data.getSkuInfo.tatInfo.tatResponse.items[0].exist,
            minQty: 1,
            saltName: saltSection,
            qtyItContainsDesc: qty,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

extractDataOfHealthmug = async (url) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data, { xmlParse: false });
        // console.log($.html());
        var healthMugData;
        $("script[type=application/ld+json]").map(function (i, v) {
            if (i == 1) {
                healthMugData = JSON.parse($(this).text());
            }
        });

        var dc = '';

        if (healthMugData.offers.price < 499) {
            dc = 50;
        } else if (healthMugData.offers.price >= 500) {
            dc = 0;
        }


        return {
            name: 'Healthmug',
            item: healthMugData.name,
            link: url,
            imgLink: healthMugData.image,
            price: healthMugData.offers.price,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(healthMugData.offers.price) + parseFloat(dc),
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

function getDeliveryChargeForTrueMeds(totalMedPrice) {
    if (parseFloat(totalMedPrice) < 500) {
        dc = 50;
    } else if (parseFloat(totalMedPrice) >= 500) {
        dc = 0;
    }

    return dc;
}
//newely added TRUEMEDS
extractDataOfTruemeds = async (url, meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching HTML
        var filterCount = 600;

        var { data } = '';
        try {
            // Make the request and wait for it to complete
            data = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                }
            });
            data = data.data;

            // Log the response data once it's received
            // console.log(data);
        } catch (error) {
            // Handle any errors
            if (error.response) {
                data = error.response.data;
                // console.log('Error response HTML:', error.response.data);
            } else {
                // console.log('Error:', error.message);
            }
        }
        const $ = cheerio.load(data);

        var dc = '';

        if (parseFloat($('.medSelling').first().text().split('₹')[1]) < 400) {
            dc = 39 + 11;
        } else if (parseFloat($('.medSelling').first().text().split('₹')[1]) >= 400 && parseFloat($('.medSelling').first().text().split('₹')[1]) < 550) {
            dc = 29 + 11;
        } else if (parseFloat($('.medSelling').first().text().split('₹')[1]) >= 550) {
            dc = 11;
        }



        var a = JSON.parse($('script[type=application/ld+json]:contains("availability")').first().text());


        var qty = $('.medStrips button').first().text();
        console.log(qty)
        if (qty == '' || qty == "NA" || qty == " " || qty == null) {
            qty = getPackSize($('.medName').first().text());
            console.log("if " + qty)
        } else {
            console.log("else " + qty)
            qty = getPackSize(qty);
        }

        var newcfnie = $('.medName').first().text().match(/\d+/g);
        newcfnie = newcfnie ? newcfnie.map(Number) : [];

        var exists = cfnie.every(num => newcfnie.includes(num));
        var cfnieScore = 0;

        try {
            var newcfnie = $('.medName').first().text().match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];
            var foundCount = 0;


            if (cfnie.length) {

                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = $('.compositionDescription').first().text().split("+").join(' ').includes(num.toString());

                    var inPackSize = $('.medStrips button').first().text().includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }
            } else {
               // console.log("AAAA")
                if (newcfnie) {
              //      console.log("AAAA inside pharmeasy")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }


        } catch (error) {
            console.log(error)
            filterCount -= 100;;
        }

        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        console.log("truemeds pincode " + pincode)
        try {
            var lson = await axios.get(`https://nal.tmmumbai.in/ThirdPartyService/checkPincodeServiceability?pincode=${pincode}`);
            if (lson.data.isServicable) {
                lson = "Pincode Serviceable";
            }
        } catch (e) {
            console.log(e)
            lson = "Pincode Not Serviceable";
        }


        var firstWordScore = 0;
        var firstWord = $('.medName').first().text();
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }





        var newSecondaryAnchor = $('.medName').first().text().replace(/-/g, ' ').toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = $('.medName').first().text().replace(/-/g, ' ').toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        console.log(fullNewMedicineName)
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        console.log("New Sub String " + newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);



        if (secondaryAnchor != '@') {

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                console.log(secondaryAnchor)
                console.log("Otherwise, check if the word is present anywhere in the string case-insensitive");
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }


        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }






        var delTime = '';
        try {
            var delTimeData = await axios.get(`https://nal.tmmumbai.in/CustomerService/getEstimatedDeliveryDateBasedOnPincode?pincode=${pincode}`);
            if (delTimeData.data.surface) {
                delTime = Math.ceil((new Date(delTimeData.data.surface) - new Date()) / (1000 * 60 * 60 * 24));


                if (delTime > 2) {
                    delTime = `${delTime - 2} - ${delTime} days`;
                } else {
                    delTime = `${delTime - 1} - ${delTime} days`;
                }


                if (delTime == 0) {
                    delTime = "Within 24 hours";
                }
            }
        } catch (e) {
            console.log(e)
            delTime = "Pincode Not Serviceable";
        }


        var smed = parseFloat(await calculateSimilarity($('.medName').first().text().toLowerCase(), nameOfMed.toLowerCase()));



        return {
            name: 'TrueMeds',
            item: $('.medName').first().text(),
            link: url,
            imgLink: $('.image-gallery-image img').attr('src'),
            price: parseFloat($('.medSelling').first().text().split('₹')[1]),
            offer: '',
            deliveryCharge: dc,
            finalCharge: (parseFloat($('.medSelling').first().text().split('₹')[1]) + parseFloat(dc)).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,
            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,


            secondaryAnchor: secondaryAnchor,
            tempnewanchor: tempnewanchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            lson: lson,
            deliveryTime: delTime,

            manufacturerName: $('#manufacturer').first().text(),
            medicineAvailability: a.offers.availability.includes('InStock') ? a.offers.availability.includes('InStock') : false,
            minQty: 1,
            saltName: $('.compositionDescription').first().text().split("+"),
            qtyItContainsDesc: qty,
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

function getDeliveryChargeForHealthskool(totalMedPrice) {
    var dc = 0;

    if (totalMedPrice <= 999) {
        dc = 40;
    } else if (totalMedPrice > 999) {
        dc = 0;
    }
    return dc;
}
getOffersOfHealthskoolpharmacy = async () => {
    const { data } = await axios.get(`https://www.healthskoolpharmacy.com/offers`)

    // Using cheerio to extract <a> tags
    const $ = cheerio.load(data);
    const offers = [];
    const coupon = [], offerDet = [];
    $('h2').map((i, elm) => {
        offerDet.push($(elm).text());

    });
    $('h3').map((i, elm) => {
        coupon.push($(elm).text());
    });

    for (var i = 0; i < 2; i++) {
        offers.push({
            offer: offerDet[i],
            code: coupon[i],
        })
    }

    return offers;
}
extractDataOfHealthskoolpharmacy = async (url, nameOfMed) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data, { xmlParse: false });
        // console.log($.html());
        var Curr_price = $('.product-price').text();
        Curr_price = Curr_price.split('₹')[1];

        var dc = '';

        if (Curr_price <= 999) {
            dc = 40;
        } else if (Curr_price > 999) {
            dc = 0;
        }


        return {
            name: 'HealthsKool Pharmacy',
            item: $('.product-title').text().substring(0, 30),
            link: url,
            imgLink: $('.product-info .image a').first().attr('href'),
            price: Curr_price,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(Curr_price) + parseFloat(dc),
            similarityIndex: await calculateSimilarity($('.product-title').text().toLowerCase(), nameOfMed.toLowerCase()),

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};


extractDataOf3Meds = async (url, nameOfMed) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        const offers = [];
        $('.AdditionalOffers ul li').map((i, elm) => {
            offers.push($(elm).text());
        });
        var p = $('.actualrate').text().trim();
        p = p.split('Rs.')[1];

        return {
            name: '3 Meds',
            item: $('h1').text().substring(0, 30),
            link: url,
            imgLink: $('.productimg img').first().attr('src'),
            price: p,
            offer: offers,
            similarityIndex: await calculateSimilarity($('h1').text().toLowerCase(), nameOfMed.toLowerCase()),

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};

function getDeliveryChargeForTata1mg(m) {
    var dc = 0;
    if (parseFloat(m) > 0 && parseFloat(m) < 100) {
        dc = 81;
    } else if (parseFloat(m) >= 100 && parseFloat(m) < 200) {
        dc = 75;
    } else if (parseFloat(m) >= 200) {
        dc = 0;
    }

    return dc;
}






function extractDateComponents(dateString) {
    // Define a regular expression to match the format
    const dateRegex = /(\w+),\s*(\d{1,2})\s*(\w+)/;

    // Match the string against the regular expression
    const match = dateString.match(dateRegex);
    if (match) {
        const dayOfWeek = match[1]; // Day of the week
        const day = parseInt(match[2], 10); // Day of the month
        const month = match[3]; // Month name

        return [dayOfWeek, month, day];
    }

    // Return null if no match is found
    return null;
}

function calculateDeliveryRange(delTimeInMs) {
    let timeInMinutes = Math.ceil(delTimeInMs / (1000 * 60));

    if (timeInMinutes < 60) {
        // If time is in minutes
        return `${timeInMinutes} - ${timeInMinutes * 2} mins`;
    }

    let timeInHours = Math.ceil(timeInMinutes / 60);

    if (timeInHours < 24) {
        // If time is in hours
        return `${timeInHours} - ${timeInHours * 2} hours`;
    }

    let timeInDays = Math.ceil(timeInHours / 24);

    // If time is in days
    return `${timeInDays}  - ${timeInDays * 2} days`;
}
function parseDeliveryTime(input) {
    var input = input.toLowerCase();
    const now = new Date();
    let deliveryTime = new Date();

    if (input.includes('mins') || input.includes('hours')) {
        // Extract minutes or hours
        const timeMatch = input.match(/\d+/);
        if (timeMatch) {
            const timeValue = parseInt(timeMatch[0], 10);
            if (input.includes('mins')) {
                deliveryTime = new Date(now.getTime() + timeValue * 60000); // Adding minutes
            } else if (input.includes('hours')) {
                deliveryTime = new Date(now.getTime() + timeValue * 3600000); // Adding hours
            }
        }
        const timeInMs = deliveryTime - now;
        return calculateDeliveryRange(timeInMs);

    } else if (input.includes('Tomorrow')) {
        // Handle "Tomorrow"
        const hoursUntilTomorrow = 24 - now.getHours() + 4; // Add 4 hours for range
        return `${hoursUntilTomorrow} - ${hoursUntilTomorrow + 4} hours`;

    } else if (input.includes('monday') || input.includes('tuesday') || input.includes('wednesday') || input.includes('thursday')
        || input.includes('friday') || input.includes('saturday') || input.includes('sunday')) {
        // Handle specific date
        const [dayOfWeek, month, day] = extractDateComponents(input);
        deliveryTime = new Date(`${month} ${day}, ${now.getFullYear()}`);

        // If the date is in the past, assume it's for next year
        if (deliveryTime < now) {
            deliveryTime.setFullYear(now.getFullYear() + 1);
        }

        const timeInMs = deliveryTime - now;
        const timeInDays = Math.ceil(timeInMs / (1000 * 60 * 60 * 24));
        return `${timeInDays} - ${timeInDays + 2} days`;

    } else {
        throw new Error('Unknown format');
    }
}



extractDataOfTata = async (url, nameOfMed, medicinePackSize, cfnie, pincode, secondaryAnchor) => {
    try {
        // Fetching HTML
        var filterCount = 4;
        var prodId = url.match(/\d+$/)[0];

        console.log(url);
        var { data } = await axios.get(url);

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        var t, m;
        // console.log($.html());
        // return {};

        t = $('h1[class=l3SemiBold]').first().html();

        m = $('.l4Regular').html().match(/\d+(\.\d+)?/)[0];

        var qty = $('#content .marginTop-16.col-6.smallRegular.textSecondary').first().text();
        // console.log(qty)
        if (qty == '' || qty == "NA" || qty == " " || qty == null) {
            qty = getPackSize(t);
            console.log("if   " + qty)
        } else {
            console.log("else  " + qty)
            qty = getPackSize(qty);
        }


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(t.toLowerCase(), nameOfMed.toLowerCase()));

        var dc = 0;
        if (parseFloat(m) > 0 && parseFloat(m) < 150) {
            dc = 79;
        } else if (parseFloat(m) >= 150 && parseFloat(m) < 200) {
            dc = 29;
        } else if (parseFloat(m) >= 200) {
            dc = 0;
        }

        var cfnieScore = 0;
        try {
            var newcfnie = t.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var exists = cfnie.every(num => newcfnie.includes(num));
            if (cfnie.length) {
                if (exists) {
                    cfnieScore = 100;
                } else {
                    cfnieScore = 0;
                }
            } else {
                filterCount -= 100;;
            }
        } catch (error) {
            filterCount -= 100;;
        }

        var { data } = await axios.post(`https://www.1mg.com/pharmacy_api_gateway/v4/skus/${prodId}/eta`, {
            sku_id: prodId,
            pincode: `${pincode}`
        })



        console.log("atatimgsds  " + data.data.ga_data.info.eta_text)
        if (data.data.ga_data.info.eta_text.includes("not")) {
            lson = "Pincode Not Serviceable";
        } else {
            lson = "Pincode Servicaeble";
        }



        var firstWordScore = 0;
        var firstWord = t.split(' ')[0];
        if (firstWord.toLowerCase() == (nameOfMed.split(' ')[0]).toLowerCase()) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = t.toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;
        if (secondaryAnchor != '@') {

            if (newSecondaryAnchor.includes(secondaryAnchor)) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        } else {
            filterCount -= 100;;
        }


        return {
            name: 'Tata 1mg',
            item: t,
            link: url,
            price: parseFloat(m),
            imgLink: $('#content img').first().attr('src'),
            // price: $('.DrugPriceBox__price___dj2lv').text(),
            // price: $('span[property=priceCurrency]').text()
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(m) + parseFloat(dc),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            sfinalAvg: (parseFloat(smed + spack + cfnieScore + firstWordScore) / filterCount).toFixed(2),
            filterCount: filterCount,

            lson: lson,
            deliveryTime: data.data.ga_data.info.eta_text.includes('not') ? "" : parseDeliveryTime(data.data.ga_data.info.eta_text),

            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: newSecondaryAnchor,
            secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: '',
            medicineAvailability: true,
            minQty: 1,
            saltName: '',
            qtyItContainsDesc: qty,
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error)
        return {};
    }
};  // penfing location , cfnie 


function getDeliveryChargeForPulsePlus(totalMedPrice) {
    var dc = 0;
    if (totalMedPrice < 999) {
        dc = 50;
    } else if (totalMedPrice >= 1000) {
        dc = 15;
    }


    return dc;
}
getNameOfPulsePlus = async (url) => {
    const { data } = await axios.get(url)

    // Using cheerio to extract <a> tags
    const $ = cheerio.load(data);
    var temp;
    // BreadCrumb_peBreadCrumb__2CyhJ

    $('.col-sm-4 a').map((i, elm) => {
        temp = "https://www.pulseplus.in/products" + $(elm).text();
    })
    return temp;
}

extractDataOfmedplusMart = async (url, nameOfMed, medicinePackSize) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url, { timeout: 5000 });

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        // console.log($.html());

        // const offers = [];
        // $('.mb-1 label').each(function (i, elm) {
        //     offers.push({offer:$(elm).text()});
        // })
        // console.log(offers);


        var t = $('span[property=price]').attr('content');

        var dc;
        if (t < 999) {
            dc = 57;
        } else if (t >= 1000) {
            dc = 15;
        }

        var a = JSON.parse($('script[type=text/javascript]:contains("Packing")').first().text().split("=")[1].split(";")[0]);

        var qty = a['Packing'];
        if (qty == '' || qty == "NA" || qty == " " || qty == null) {
            qty = await getPackSize($('#divProductTitle>h1').text());
        } else {
            qty = getPackSize(qty);
        }


        qty = parseFloat(qty);
        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }


        //after 2 verification steps , IF still qty is not available , only focus on name similarity
        if (qty == '' || qty == "NA" || qty == " " || qty == null) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity($('#divProductTitle>h1').text().toLowerCase(), nameOfMed.toLowerCase()));

        return {
            name: 'PulsePlus',
            item: $('#divProductTitle>h1').text().substring(0, 30),
            link: url,
            imgLink: $('.profile-picture').attr('src'),
            // price: $('.DrugPriceBox__price___dj2lv').text(),
            // price: $('span[property=priceCurrency]').text()
            price: t,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(t) + parseFloat(dc),

            smed: smed,
            spack: spack,
            sfinalAvg: (parseFloat(smed + spack) / 2).toFixed(2),

            manufacturerName: $('#divProductTitle>div').text(),
            medicineAvailability: $('.text-primary2').text() == "In Stock" ? true : false,
            minQty: 1,
            saltName: 'NA',
            qtyItContainsDesc: qty,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

function getDeliveryChargeForMyUpChar(totalMedPrice) {
    var dc = 0;
    if (totalMedPrice < 499) {
        dc = 49;
    } else if (totalMedPrice > 500) {
        dc = 0;
    }

    return dc;
}
getOffersOfMyUpChar = async () => {
    const { data } = await axios.get(`https://www.myupchar.com/en/offers`)

    // Using cheerio to extract <a> tags
    const $ = cheerio.load(data);
    const offers = [];
    $('.offers-bx h2').each(function (i, elm) {
        offers.push({ offer: $(elm).text() });
    });
    return offers;
}
extractDataOfMyUpChar = async (url, meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching HTML
        var filterCount = 600;

        console.log("Myupchar link -> " + url)
        const { data } = await axios.get(url, { timeout: 5000 });

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data, { xmlMode: false });

        var a = $('.head h1').first().text();
        if (!a) {
            a = $('#med_details h1').first().text();
        }
        // console.log(a);
        var b = $('.price_txt .txt_big').first().text();
        if (!b) {
            b = $('.pack_sp').first().text();
        }
        if (!b) {
            b = $('.pack_mrp').first().text();
        }
        // console.log(b);
        if (b != '') {
            if (b.includes('₹')) {
                b = b.split('₹')[1];
            }
        }

        var dc = '';

        if (b < 100) {
            dc = 49;
        } else if (b >= 100) {
            dc = 0;
        }



        var qty = $('.pack_size').first().text();
        if (qty == '' || qty == "NA" || qty == " " || qty == null) {
            qty = $('.pack_qty').first().text();
        }

        if (qty == '' || qty == "NA" || qty == " " || qty == null) {
            qty = await getPackSize($('#med_details h1[class=container_margin]').first().text());
        } else {
            qty = extractLargestNumber(qty);
        }





        var smed = parseFloat(await calculateSimilarity(a.toLowerCase(), nameOfMed.toLowerCase()));


        var saltSection = ($('#manu_details li:contains("Contains / Salt")').text().split(":")[1] || "NA");
        if (typeof (saltSection) == 'string') {
            saltSection = [saltSection];
        }


        var cfnieScore = 0;
        try {
            var newcfnie = $('#med_details h1[class=container_margin]').first().text().match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    var inPackSize = [qty].includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
              //      console.log("AAAA inside pharmeasy")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }

        } catch (error) {
            filterCount -= 100;;
        }

        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }



        var firstWordScore = 0;
        var firstWord = $('#med_details h1[class=container_margin]').first().text();

        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = $('#med_details h1[class=container_margin]').first().text().toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = $('#med_details h1[class=container_margin]').first().text().toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);



        if (secondaryAnchor != '@') {

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }

        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf",
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }

        return {
            name: 'myupchar',
            item: $('#med_details h1[class=container_margin]').first().text(),
            link: url,
            imgLink: $('.image_slide').attr('src'),
            price: b,
            offer: '',
            deliveryCharge: parseFloat(b) < 100 ? 49 : 0,
            finalCharge: (parseFloat(b) + (parseFloat(b) < 100 ? 49 : 0)).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,

            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            lson: "Pincode Serviceable",
            deliveryTime: "4 - 5 days",

            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: $('#manu_details li:contains("Manufactured") a').first().text(),
            medicineAvailability: true,
            minQty: 1,
            saltName: saltSection,
            qtyItContainsDesc: qty,
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

function getDeliveryChargeForTabletShablet(totalMedPrice) {
    var dc = 0;

    if (totalMedPrice < 500) {
        dc = 68.88;
    } else if (totalMedPrice >= 500 && totalMedPrice < 1000) {
        dc = 50.40;
    } else if (totalMedPrice >= 1000) {
        console.log('hie')
        dc = 0;
    }
    return dc;
}
extractDataOfOBP = async (url, nameOfMed, medicinePackSize) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url, { timeout: 5000 });

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        var a = JSON.parse($('script[type=application/ld+json]').html());
        // console.log($.html());
        var p = a['@graph'][a['@graph'].length - 1].offers.price;
        // if (!p) {
        //     p = $('.price').first().text()
        // }
        // if (p) {
        //     if (p.includes(" – ")) {
        //         console.log(p)
        //         p = p.split(" – ")[0];
        //         console.log(p)
        //     }
        // }
        // if (p) {
        //     if (p.includes('₹')) {
        //         p = p.split('₹')[1];
        //     }
        //     if (p.includes(',')) {
        //         p = p.replace(',', '');
        //     }
        // }

        //     const offers=[];
        //     var count=0;
        //     $('.offer-item').map((i, elm) => {
        //         if(count<2){
        //             offers.push({
        //                 offer:$(elm).text(),
        //             });
        //            count++;
        //         }
        //   });
        var dc = '';

        console.log(p)
        console.log(typeof (parseFloat(p)))
        if (parseFloat(p) < 500) {
            dc = 68.88;
        } else if (parseFloat(p) >= 500 && parseFloat(p) < 1000) {
            dc = 50.40;
        } else if (parseFloat(p) >= 1000) {
            console.log('hie')
            dc = 0;
        }

        var simIndex = parseFloat(
            parseFloat(await calculateSimilarity($('.entry-title').text().toLowerCase(), nameOfMed.toLowerCase())) +
            parseFloat(await calculateSimilarity($('.woocommerce-product-attributes-item__value > p').first().text().toLowerCase(), manufacturer.toLowerCase()))
        ) / 2;


        return {
            name: 'Tablet Shablet',
            item: $('.entry-title').text().substring(0, 30),
            link: url,
            imgLink: $('.jws-gallery-image img').attr('src'),
            price: p,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(p) + parseFloat(dc),
            smed: parseFloat(await calculateSimilarity($('.entry-title').text().toLowerCase(), nameOfMed.toLowerCase())),
            sman: parseFloat(await calculateSimilarity($('.woocommerce-product-attributes-item__value > p').first().text().toLowerCase(), manufacturer.toLowerCase())),
            manufacturerName: $('.woocommerce-product-attributes-item__value > p').first().text(),
            medicineAvailability: true,
            minQty: 1,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};

extractDataOfPP = async (url, nameOfMed, medicinePackSize, cfnie) => {
    try {
        // Fetching HTML
        var filterCount = 3;

        const { data } = await axios.get(url, { timeout: 5000 });

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        var dataOfPP = {};
        $("script[type=application/ld+json]").map(function (i, v) {
            dataOfPP = JSON.parse($(this).text());
        });

        var dc = '';

        if (dataOfPP.offers.price < 275) {
            dc = 73;
        } else if (dataOfPP.offers.price >= 275 && dataOfPP.offers.price < 1000) {
            dc = 63;
        } else if (dataOfPP.offers.price >= 1000) {
            dc = 13;
        }
        // console.log($.html());

        var cfnieScore = 0;
        if (cfnie.length) {
            if (dataOfPP.name.includes(cfnie)) {
                cfnieScore = 100;
            }
        } else {
            filterCount -= 100;;
        }



        var qty = $('.panel-content div:contains("Packing")').next('div').find('span').text();
        if (qty == '' || qty == "NA" || qty == " " || qty == null) {
            qty = await getPackSize(dataOfPP.name);
        } else {
            qty = getPackSize(qty);
        }


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(dataOfPP.name.toLowerCase(), nameOfMed.toLowerCase()));

        return {
            name: 'Pasumai Pharmacy',
            item: dataOfPP.name.substring(0, 30),
            link: url,
            imgLink: dataOfPP.image,
            price: dataOfPP.offers.price,
            offer: '',
            deliveryCharge: dc,
            finalCharge: parseFloat(dataOfPP.offers.price) + parseFloat(dc),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            sfinalAvg: (parseFloat(smed + spack + cfnieScore) / filterCount).toFixed(2),
            filterCount: filterCount,

            lson: "Pincode Serviceable",


            manufacturerName: $('#divProductTitle > label[class=text-muted]').text(),
            medicineAvailability: dataOfPP.offers.availability == 'http://schema.org/InStock' ? true : false,
            minQty: 1,
            saltName: ($('.item-header').first().text().split("+")),
            qtyItContainsDesc: qty,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {};
    }
};

function getDeliveryChargeForPasumai(price) {
    var dc = 0;

    if (price < 280) {
        dc = 68;
    } else if (price >= 280 && price < 1000) {
        dc = 58;
    } else if (price >= 1000) {
        dc = 8;
    }


    return dc;
}

function getDeliveryChargeForMedPlusMart(price) {
    var dc = 0;
    if (price > 0 && price < 350) {
        dc = 40;
    } else if (price >= 350) {
        dc = 20;
    }
    return dc;
}


extractDataOfEgmedi = async (url, nameOfMed) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);

        // console.log($.html());

        return {
            name: 'Egmedi',
            item: $('.product h2').first().text().substring(0, 30),
            link: $('.product a').first().attr('href'),
            imgLink: $('.product img').first().attr('src'),
            price: $('.product .price').first().text(),
            offer: '',
        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {};
    }
};


function getDeliveryChargeForOgMedPlusMart(totalMedPrice) {
    var dc = 0;
    if (price > 0 && price < 350) {
        dc = 40;
    } else if (price >= 350) {
        dc = 20;
    }
    return dc;
}

//added new 

extractDataOfOgMPM = async (url, nameOfMed, medicinePackSize, cfnie) => {
    try {
        // Fetching HTML
        var filterCount = 4;

        const { data } = await axios.get(url, { timeout: 5000 });

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        try {
            var a = await JSON.parse($('script[type="application/ld+json"]:contains("productID")').text());

        } catch (error) {
            return {
                name: 'MedplusMart',
                item: 'NA',
                link: url,
                imgLink: '',
                price: '',
                deliveryCharge: 0,
                offer: '',
                finalCharge: '',
            };
        }

        var dc = 0;
        if (parseFloat(a[0].offers.price ? a[0].offers.price : 0) > 0 && parseFloat(a[0].offers.price ? a[0].offers.price : 0) < 350) {
            dc = 40;
        } else if (parseFloat(a[0].offers.price ? a[0].offers.price : 0) >= 350) {
            dc = 20;
        }


        var qty = '';
        if (qty == '' || qty == "NA" || qty == " " || qty == null) {
            qty = await getPackSize(a[0].name);
        } else {
            qty = getPackSize(qty);
        }

        var cfnieScore = 0;
        if (cfnie.length) {
            if (a[0].name.includes(cfnie)) {
                cfnieScore = 100;
            }
        } else {
            filterCount -= 100;;
        }


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(a[0].name.toLowerCase(), nameOfMed.toLowerCase()));

        var firstWordScore = 0;
        var firstWord = a[0].name.split(' ')[0];
        if (firstWord.toLowerCase() == (nameOfMed.split(' ')[0]).toLowerCase()) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        return {
            name: 'MedplusMart',
            item: a[0].name,
            link: url,
            imgLink: a[0].image,
            price: parseFloat(a[0].offers.price ? a[0].offers.price : 0).toFixed(2),
            deliveryCharge: dc,
            offer: '',
            finalCharge: parseFloat(a[0].offers.price ? a[0].offers.price : 0).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            sfinalAvg: (parseFloat(smed + spack + cfnieScore + firstWordScore) / filterCount).toFixed(2),
            filterCount: filterCount,
            lson: "Pincode Serviceable",

            manufacturerName: a[0].brand.name,
            medicineAvailability: true,
            minQty: 1,
            saltName: '',
            qtyItContainsDesc: qty,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {
            name: 'MedplusMart',
            item: 'NA',
            link: url,
            imgLink: '',
            price: '',
            deliveryCharge: 0,
            offer: '',
            finalCharge: '',
        };
    }
};





function getDeliveryChargeForKauveryMeds(totalMedPrice) {
    var dc = totalMedPrice;

    return 75;
}



extractDataOfKauveryMeds = async (url, nameOfMed, medicinePackSize, cfnie) => {
    try {
        // Fetching HTML
        var filterCount = 3;

        const { data } = await axios.get(url, { timeout: 5000 });

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);
        var a = await JSON.parse($('script[type="application/ld+json"]').first().text());

        var dc = 75;

        var qty = '';
        if (qty == '' || qty == "NA" || qty == " " || qty == null) {
            qty = await getPackSize($('.productdetail_title').first().text());
        } else {
            qty = getPackSize(qty);
        }


        var cfnieScore = 0;
        if (cfnie.length) {
            if ($('.productdetail_title').first().text().includes(cfnie)) {
                cfnieScore = 100;
            }
        } else {
            filterCount -= 100;;
        }


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(a.name.toLowerCase(), nameOfMed.toLowerCase()));

        return {
            name: 'Kauverymeds',
            item: ($('.productdetail_title').first().text()),
            link: url,
            imgLink: 'https://www.kauverymeds.com/uploads/product/main/thumb.png',
            price: parseFloat(a.offers.price),
            deliveryCharge: dc,
            offer: '',
            finalCharge: 0,

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            sfinalAvg: (parseFloat(smed + spack + cfnieScore) / filterCount).toFixed(2),
            filterCount: filterCount,
            lson: "Pincode Serviceable",

            manufacturerName: a.manufacturer,
            medicineAvailability: a.offers.availability.toLowerCase().includes('instock') ? true : false,
            minQty: 1,
            saltName: '',
            qtyItContainsDesc: qty,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {
            name: 'Kauverymeds',
            item: 'NA',
            link: url,
            imgLink: 'https://www.kauverymeds.com/uploads/product/main/thumb.png',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};

extractDataOfIndiMedo = async (url, nameOfMed, medicinePackSize) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url, { timeout: 5000 });

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);

        var simIndex = parseFloat(
            parseFloat(await calculateSimilarity($('.product-title').text().toLowerCase(), nameOfMed.toLowerCase())) +
            parseFloat(await calculateSimilarity($('.d-block').find('strong:contains("Manufacturer")').parent().text().split(':')[1].trim().toLowerCase(), manufacturer.toLowerCase()))
        ) / 2;

        return {
            name: 'Indi Medo',
            item: $('.product-title').text(),
            link: url,
            imgLink: $('.single-image img').attr('src'),
            price: parseFloat($('.discounted-price').text()),
            deliveryCharge: 'Login',
            offer: '',
            finalCharge: 0,
            similarityIndex: simIndex,
            smed: parseFloat(await calculateSimilarity($('.product-title').text().toLowerCase(), nameOfMed.toLowerCase())),
            sman: parseFloat(await calculateSimilarity($('.d-block').find('strong:contains("Manufacturer")').parent().text().split(':')[1].trim().toLowerCase(), manufacturer.toLowerCase())),
            manufacturerName: $('.d-block').find('strong:contains("Manufacturer")').parent().text().split(':')[1].trim(),
            medicineAvailability: true,
            minQty: 1,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {
            name: 'IndiMedi',
            item: 'NA',
            link: url,
            imgLink: $('.single-image img').attr('src'),
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};



// extractDataOfSecondMedic = async (url, nameOfMed,medicinePackSize) => {
//     try {
//         // Fetching HTML
//         const { data } = await axios.get(url)

//         // Using cheerio to extract <a> tags
//         const $ = cheerio.load(data);
//         var a = await JSON.parse($('script[type="application/ld+json"]').first().text());

//         var dc = 0;
//         if (parseFloat(a.offers.price) < 850) {
//             dc = 85;
//         } else {
//             dc = 0;
//         }

//         var simIndex=parseFloat(
//             parseFloat(await calculateSimilarity(a.name.toLowerCase(), nameOfMed.toLowerCase())) +
//            parseFloat( await calculateSimilarity(a.brand.name.toLowerCase(), manufacturer.toLowerCase()))
//         )/2;

//         return {
//             name: 'Second Medic',
//             item: a.name,
//             link: url,
//             imgLink:a.image[0],
//             price: parseFloat(a.offers.price),
//             deliveryCharge: dc,
//             offer: '',
//             finalCharge: 0,
//             similarityIndex: simIndex,
//             smed:parseFloat(await calculateSimilarity(a.name.toLowerCase(), nameOfMed.toLowerCase())) ,
//             sman: parseFloat(await calculateSimilarity(a.brand.name.toLowerCase(), manufacturer.toLowerCase())),
//             manufacturerName: a.brand.name,
//             medicineAvailability:(a.offers.availability.includes("InStock")?true:false),
//             minQty:1,

//         };

//     } catch (error) {
//         // res.sendFile(__dirname + '/try.html');
//         // res.sendFile(__dirname + '/error.html');
//         console.log(error);
//         return {
//             name: 'Second Medic',
//             item: 'NA',
//             link: url,
//             imgLink:a.image[0],
//             price: '',
//             deliveryCharge: '',
//             offer: '',
//             finalCharge: 0,
//             similarityIndex: '',
//             smed:'' ,
//             sman: '',
//             manufacturerName: '',
//             medicineAvailability:'',
//             minQty:1,
//         };
//     }
// };

function extractLargestNumber(inputString) {
    if (!inputString) return 0; // Return 0 if the input is undefined or empty
    const numbers = inputString.match(/\d+(\.\d+)?/g);
    if (!numbers) return 0; // Return 0 if no numbers are found

    return Math.max(...numbers.map(Number));
}


extractDataOfChemistBox = async (url, nameOfMed, medicinePackSize) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url, { timeout: 5000 });

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);

        var dc = 125;

        var qty = $('.pro-details-sku-info').first().text();
        if (qty == '' || qty == "NA" || qty == " " || qty == null) {
            qty = await extractLargestNumber($('h2').first().text());
        } else {
            qty = extractLargestNumber(qty);
        }



        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity($('h2').first().text().toLowerCase(), nameOfMed.toLowerCase()));

        return {
            name: 'Chemit Box',
            item: $('h2').first().text(),
            link: url,
            imgLink: $('.swiper-wrapper img').first().attr('src'),
            price: parseFloat($('.old-price.not-cut').html().split('<del')[0].split('₹')[1].trim()),
            deliveryCharge: dc,
            offer: '',
            finalCharge: 0,

            smed: smed,
            spack: spack,
            sfinalAvg: (parseFloat(smed + spack) / 2).toFixed(2),

            manufacturerName: $('.pro-details-sku-info:contains("Brand") ul li').first().text(),
            medicineAvailability: ($('.product-details-content .new.hide.text-danger').html() ? true : false),
            minQty: 1,
            saltName: '',
            qtyItContainsDesc: qty,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        // console.log(error);
        return {
            name: 'Chemist Box',
            item: 'NA',
            link: url,
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};

extractDataOfChemistsWorld = async (url, nameOfMed, medicinePackSize) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        // Using cheerio to extract <a> tags
        const $ = cheerio.load(data);


        var dc = 55;
        var simIndex = parseFloat(
            parseFloat(await calculateSimilarity($('h1[itemprop="name"]').first().text().toLowerCase(), nameOfMed.toLowerCase())) +
            parseFloat(await calculateSimilarity($('.marketer__sec a').first().text().trim().toLowerCase(), manufacturer.toLowerCase()))
        ) / 2;

        var p = $('.product_cart_area__1 li').first().text();

        if (!p) {
            p = $('span[itemprop="price"]').first().text();
        }

        return {
            name: 'Chemists World',
            item: $('h1[itemprop="name"]').first().text(),
            link: url,
            imgLink: $('.img_area img').attr('src'),
            price: parseFloat(p),
            deliveryCharge: 55,
            offer: '',
            finalCharge: 0,
            similarityIndex: simIndex,
            smed: parseFloat(await calculateSimilarity($('h1[itemprop="name"]').first().text().toLowerCase(), nameOfMed.toLowerCase())),
            sman: parseFloat(await calculateSimilarity($('.marketer__sec a').first().text().trim().toLowerCase(), manufacturer.toLowerCase())),
            manufacturerName: $('.marketer__sec a').first().text().trim(),
            medicineAvailability: true,
            minQty: 1,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {
            name: 'Chemists World',
            item: 'NA',
            link: url,
            imgLink: $('.img_area img').attr('src'),
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};


function extractWordsForApis(inputString) {
    // Regex to match the first word and the second word if the first word is a number
    const regex = /^(\w+)(?:\s+(\w+))?/;

    // Execute the regex on the input string
    const match = inputString.match(regex);

    // Check if the first word is a number and extract accordingly
    if (match) {
        const firstWord = match[1];
        const secondWord = match[2];

        // Check if the first word is a number
        if (!isNaN(firstWord) || firstWord.length == 1) {
            // Return the first and second word if the first word is a number
            return [firstWord, secondWord];
        } else {
            // Return only the first word
            return [firstWord];
        }
    }

    // Return an empty array if no match is found
    return [];
}





// extractDataFromApiOfPracto = async (nameOfMed, medicinePackSize) => {
//     try {
//       // Fetching HTML
//       const searchName = extractWordsForApis(nameOfMed).toString() + " " + medicinePackSize;

//       // Fetching data from Practo API
//       const response = await axios.get(
//         `https://www.practo.com/practopedia/api/v1/search?query=${searchName}&pincode=110045`,
//         { timeout: 5000 }
//       );
//       const products = response.data.data; // Adjusted based on Practo's response structure

//       // Filter products by pack size
//       const filteredProducts = products.filter((product) =>
//         parseFloat(product.pack_size) === parseFloat(medicinePackSize)
//       );

//       // Log the filtered products
//       // console.log(filteredProducts);

//       const targetString = nameOfMed;

//       let mostSimilarProduct = null;
//       let highestSimilarityScore = 0;

//       filteredProducts.forEach((product) => {
//         const similarityScore = stringSimilarity.compareTwoStrings(
//           product.name,
//           targetString
//         );
//         if (similarityScore > highestSimilarityScore) {
//           highestSimilarityScore = similarityScore;
//           mostSimilarProduct = product;
//         }
//       });

//       let finalProd;
//       if (mostSimilarProduct) {
//         finalProd = mostSimilarProduct;
//         // console.log(mostSimilarProduct);
//       } else {
//         console.log("No products found with that package size");
//       }

//       const qty = getPackSize(finalProd.pack_size);

//       let spack = 0;
//       if (parseFloat(qty) === parseFloat(medicinePackSize)) {
//         spack = 100;
//       }

//       const smed = parseFloat(
//         await calculateSimilarity(finalProd.name.toLowerCase(), nameOfMed.toLowerCase())
//       );

//       return {
//         name: "Practo",
//         item: finalProd.name,
//         link: `https://www.practo.com/medicine-info/${finalProd.slug}`,
//         imgLink: finalProd.product_image,
//         price: parseFloat(finalProd.mrp), // Adjusted field names according to Practo's API response
//         deliveryCharge: 100, // You can update this if delivery charges differ
//         offer: finalProd.discount || '', // Use Practo's discount field
//         finalCharge: 0, // Calculate final charge if needed

//         smed: smed,
//         spack: spack,
//         sfinalAvg: (parseFloat(smed + spack) / 2).toFixed(2),

//         manufacturerName: finalProd.manufacturer_name, // Adjusted field names
//         medicineAvailability: finalProd.stock_status === "In Stock",
//         minQty: finalProd.minimum_order_quantity || 1,
//         saltName: finalProd.salt_name || '',
//         qtyItContainsDesc: qty,
//       };
//     } catch (error) {
//       console.log(error);
//       return {
//         name: "Practo",
//         item: "NA",
//         link: "",
//         imgLink: "",
//         price: "",
//         deliveryCharge: "",
//         offer: "",
//         finalCharge: 0,
//         similarityIndex: "",
//         smed: "",
//         spack: "",
//         sfinalAvg: "",
//         manufacturerName: "",
//         medicineAvailability: "",
//         minQty: 1,
//         saltName: '',
//         qtyItContainsDesc: '',
//       };
//     }
//   };




extractDataFromApiOfChemist180 = async (meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching HTML
        var searchName = extractWordsForApis(nameOfMed).toString();
        console.log(searchName)
        var filterCount = 600;


        const response = (await axios.get(`https://api.chemist180.com/api/list/productlist?limit=20&keyword=${searchName}&count=false&offset=0`, { timeout: 5000 }));
        const products = (response.data.data.suggestedProductList);
        // console.log(products)

        // console.log(products)


        const filteredProducts = products.filter(product =>
            medicinePackSize.includes(parseFloat(product.packSize))
        );
        // Log the filtered products
        //   console.log(filteredProducts);

        const targetString = nameOfMed.toLowerCase();

        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        filteredProducts.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.name.toLowerCase(), targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        var finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
            // console.log(mostSimilarProduct)     
        } else {
            console.log('No products found with that package size');
            return {};
        }


        var saltSection = (finalProd.productComposition[0].compositionName || "NA");
        if (typeof (saltSection) == 'string') {
            saltSection = [saltSection];
        }

        var cfnieScore = 0;
        try {
            var newcfnie = finalProd.name.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    var inPackSize = ([finalProd.packSize]).includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
              //      console.log("AAAA inside pharmeasy")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }

        } catch (error) {
            filterCount -= 100;;
        }


        var qty = getPackSize(finalProd.packSize);


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.name.toLowerCase(), nameOfMed.toLowerCase()));


        var firstWordScore = 0;
        var firstWord = finalProd.name;
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = finalProd.name.toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = finalProd.name.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        if (secondaryAnchor != '@') {

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }


        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }

        return {
            name: 'Chemist180',
            item: finalProd.name,
            link: "https://chemist180.com/products/productdetails/" + finalProd.slug,
            imgLink: './public/NoImageAv.png',
            price: parseFloat(finalProd.price),
            deliveryCharge: 100,
            offer: '',
            finalCharge: (parseFloat(finalProd.price) + 100).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,

            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            lson: "Pincode Serviceable",
            deliveryTime: "1 - 4 days",

            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: finalProd['manufacture']['name'],
            medicineAvailability: finalProd.stockStatusId == 2 ? true : false,
            minQty: 1,
            saltName: saltSection,
            qtyItContainsDesc: qty,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {
            name: 'Chemist180',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};

extractDataFromApiOfOneBharatPharmacy = async (meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching HTML
        var searchName = extractWordsForApis(nameOfMed).toString();
        var filterCount = 600;

        if (typeof (searchName) == 'object') {
            searchName = JSON.stringify(searchName);
        }
        console.log(typeof (searchName))

        const { data } = await axios.get(`https://www.onebharatpharmacy.com/searchproduct/indexget?keyword=${searchName}&category=all`, { timeout: 5000 });
        const products = (data.result_data);
        // console.log(products)

        var fprod = [];

        const filteredProducts = products.filter(product => {
            // Check if text_msg is defined and not empty
            if (product.type == "product_name") {
                // Extract the largest number from text_msg
                const extractedNumber = parseFloat(extractLargestNumber(product.text_msg));
                // Compare it with medicinePackSize
                if (medicinePackSize.includes(extractedNumber)) {
                    fprod.push(product);
                }
            }
        });



        // Log the filtered products
        //   console.log(filteredProducts);

        const targetString = nameOfMed.toLowerCase();

        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        fprod.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.product_name.toLowerCase(), targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        var finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
            // console.log(mostSimilarProduct)
        } else {
            console.log('No products found with that package size');
            return {};
        }

        var saltSection = (finalProd.pro_compos || "NA");
        if (typeof (saltSection) == 'string') {
            saltSection = [saltSection];
        }
        var cfnieScore = 0;
        try {
            var newcfnie = finalProd.product_name.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    var inPackSize = ([finalProd.text_msg]).includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
              //      console.log("AAAA inside pharmeasy")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }

        } catch (error) {
            filterCount -= 100;;
        }

        var qty = extractLargestNumber(finalProd.text_msg);


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.product_name.toLowerCase(), nameOfMed.toLowerCase()));


        var deliPrice = 0;
        if (parseFloat(finalProd.product_discount_price) <= 700) {
            deliPrice = 50;
        }

        var firstWordScore = 0;
        var firstWord = finalProd.product_name;
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = finalProd.product_name.toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = finalProd.product_name.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        if (secondaryAnchor != '@') {

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }

        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }


        return {
            name: 'One Bharat Pharmacy',
            item: finalProd.product_name,
            link: finalProd.url,
            imgLink: './public/NoImageAv.png',
            price: parseFloat(finalProd.product_discount_price),
            deliveryCharge: deliPrice,
            offer: '',
            finalCharge: (parseFloat(finalProd.product_discount_price) + deliPrice).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,

            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            lson: "Pincode Serviceable",
            deliveryTime: "4 - 5 days",

            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: finalProd.cmp_nm,
            medicineAvailability: finalProd.in_out_stock == '0' ? true : false,
            minQty: 1,
            saltName: saltSection,
            qtyItContainsDesc: qty,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {
            name: 'Chemist180',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};

extractDataFromApiOfMediBuddy = async (nameOfMed, medicinePackSize, cfnie) => {
    try {
        // Fetching words for API
        let searchName = extractWordsForApis(nameOfMed).toString().toString();
        var filterCount = 4;


        const params = {
            key: searchName, // Use extracted search name
            source: 'medibuddy',
            to: 20,
        };

        // Perform the POST request to Medibuddy API
        const { data } = await axios.post('https://meds-service.medibuddy.in/app/medicine/search', params, { timeout: 5000 });

        // Extract products from response
        const products = data.message;

        // Filter products based on text_msg and medicinePackSize
        const filteredProducts = products.filter(product => parseFloat(product.size) === parseFloat(medicinePackSize));


        // Find the most similar product
        const targetString = nameOfMed;
        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        filteredProducts.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.name, targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        let finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
        } else {
            console.log('No products found with that package size');
            return {};
        }

        var cfnieScore = 0;
        if (cfnie.length) {
            if (finalProd.name.includes(cfnie)) {
                cfnieScore = 100;
            }
        } else {
            filterCount -= 100;;
        }

        // Extract the necessary details from the most similar product
        var qty = finalProd.size;


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.name.toLowerCase(), nameOfMed.toLowerCase()));


        var firstWordScore = 0;
        var firstWord = finalProd.name.split(' ')[0];
        if (firstWord.toLowerCase() == (nameOfMed.split(' ')[0]).toLowerCase()) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        return {
            name: 'Medibuddy',
            item: finalProd.name,
            link: `https://www.medibuddy.in/about/${finalProd.drugCode}`, // Construct a link based on the drug code
            imgLink: finalProd.productImageSlug.length > 0 ? finalProd.productImageSlug[0] : finalProd.productImageSlug, // Use the first image if available
            price: parseFloat(finalProd.discountPrice),
            deliveryCharge: 0,
            offer: finalProd.discountPercentageText,
            finalCharge: 0,

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            sfinalAvg: (parseFloat(smed + spack + cfnieScore + firstWordScore) / filterCount).toFixed(2),
            filterCount: filterCount,
            lson: "Pincode Serviceable",


            manufacturerName: finalProd.brand,
            medicineAvailability: finalProd.availableStatus == 'A' ? true : false,
            minQty: 1,
            saltName: finalProd.composition,
            qtyItContainsDesc: qty,
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            name: 'Medibuddy',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};


extractDataFromApiOfDawaaDost = async (nameOfMed, medicinePackSize, cfnie, pincode) => {
    try {
        // Fetching words for API
        let searchName = extractWordsForApis(nameOfMed).toString().toString();

        var filterCount = 4;


        const params = {
            query: searchName,
        };

        const { data } = await axios.post("https://api.dawaadost.com/api/medicine/vertexSearch", params)

        const products = data.data;
        //   console.log(products[0].dd_skupackaging.stringValue)

        // Filter products based on text_msg and medicinePackSize
        const filteredProducts = products.filter(product => parseFloat(extractLargestNumber(product.dd_skupackaging.stringValue)) === parseFloat(medicinePackSize));

        //   console.log(filteredProducts)

        // Find the most similar product
        const targetString = nameOfMed;
        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        filteredProducts.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.dd_name.stringValue, targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        let finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
        } else {
            console.log('No products found with that package size');
            return {};
        }

        var cfnieScore = 0;
        if (cfnie.length) {
            if (finalProd.dd_name.stringValue.includes(cfnie)) {
                cfnieScore = 100;
            }
        } else {
            filterCount -= 100;;
        }

        // Extract the necessary details from the most similar product
        var qty = parseFloat(extractLargestNumber(finalProd.dd_skupackaging.stringValue));


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.dd_name.stringValue.toLowerCase(), nameOfMed.toLowerCase()));

        var firstWordScore = 0;
        var firstWord = finalProd.dd_name.stringValue.split(' ')[0];
        if (firstWord.toLowerCase() == (nameOfMed.split(' ')[0]).toLowerCase()) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }


        return {
            name: 'DawaaDost',
            item: finalProd.dd_name.stringValue,
            link: `https://www.dawaadost.com/medicine/${finalProd.dd_route_name.stringValue}`, // Construct a link based on the drug code
            imgLink: finalProd.dd_image_url.stringValue ? finalProd.dd_image_url.stringValue : './public/NoImageAv.png',
            price: (Math.ceil(finalProd.dd_price.numberValue - (0.1 * finalProd.dd_price.numberValue))),
            deliveryCharge: (Math.ceil(finalProd.dd_price.numberValue - (0.1 * finalProd.dd_price.numberValue))) < 850 ? 75 : 0,
            offer: '',
            finalCharge: 0,

            smed: smed,
            spack: spack,
            firstWordScore: firstWordScore,
            sfinalAvg: (parseFloat(smed + spack + cfnieScore + firstWordScore) / filterCount).toFixed(2),
            filterCount: filterCount,
            lson: "Pincode Serviceable",
            deliveryTime: "4 - 5 days",

            manufacturerName: finalProd.dd_company.stringValue,
            medicineAvailability: true,
            minQty: 1,
            saltName: finalProd.dd_composition.stringValue,
            qtyItContainsDesc: qty,
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            name: 'DawaaDost',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
}; //pending

extractDataFromApiTata1mg = async (nameOfMed, searchNameForApi, medicinePackSize, cfnie, pincode) => {
    try {
        // Fetching words for API
        const filterCount = 3;
        console.log("Tata 1mg SKU " + searchNameForApi)
        const { data } = await axios.get(`https://www.1mg.com/api/v1/search/autocomplete?pageSize=12&types=all&name=${searchNameForApi}`)

        const products = data.results;



        //   console.log(products)

        // Filter products based on text_msg and medicinePackSize
        const filteredProducts = products.filter(product => parseFloat(extractLargestNumber(product.pack_size_label)) === parseFloat(medicinePackSize));

        //   console.log(filteredProducts)

        // Find the most similar product
        const targetString = nameOfMed;
        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        filteredProducts.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.label, targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        let finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
        } else {
            console.log('No products found with that package size');
            return {};
        }

        var cfnieScore = 0;
        if (cfnie.length) {
            if (finalProd.label.includes(cfnie)) {
                cfnieScore = 100;
            }
        } else {
            filterCount -= 100;;
        }

        // Extract the necessary details from the most similar product
        var qty = parseFloat(extractLargestNumber(finalProd.pack_size_label))


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.label.toLowerCase(), nameOfMed.toLowerCase()));




        var lson = await axios.post(`https://www.1mg.com/pharmacy_api_gateway/v4/skus/${finalProd.id}/eta`, {
            "sku_id": finalProd.id,
            "pincode": `${pincode}`
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });


        if (lson.data.data.ga_data.info.eta_text.includes("not")) {
            lson = "Pincode Not Serviceable";
        } else {
            lson = "Pincode Servicaeble";
        }



        return {
            name: 'Tata 1mg',
            item: finalProd.label,
            link: `https://1mg.com${finalProd.url_path}`, // Construct a link based on the drug code
            imgLink: finalProd.image_urls[0],
            price: parseFloat(finalProd.price),
            deliveryCharge: 0,
            offer: '',
            finalCharge: 0,

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            sfinalAvg: (parseFloat(smed + spack + cfnieScore) / filterCount).toFixed(2),
            filterCount: filterCount,

            lson: lson,

            manufacturerName: finalProd.marketer_name,
            medicineAvailability: finalProd.available,
            minQty: 1,
            saltName: '',
            qtyItContainsDesc: qty,
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            name: 'Tata 1mg',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};

extractDataFromApiMyupchar = async (nameOfMed, medicinePackSize, cfnie, pincode) => {
    try {
        // Fetching words for API
        var filterCount = 3;


        let searchName = extractWordsForApis(nameOfMed).toString().toString();

        const { data } = await axios.get(`https://www.myupchar.com/en/search/autocomplete_v2?query=${searchName} ${medicinePackSize}`)

        const products = data;
        //   console.log(products)

        // Filter products based on text_msg and medicinePackSize
        const filteredProducts = products.filter(product => parseFloat(extractLargestNumber(product.form)) === parseFloat(medicinePackSize));

        // Find the most similar product
        const targetString = nameOfMed;
        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        filteredProducts.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.text, targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        let finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
        } else {
            console.log('No products found with that package size');
            // return {};
        }

        var cfnieScore = 0;
        console.log("Myupchar " + finalProd)
        if (cfnie.length) {
            if (finalProd.text.includes(cfnie)) {
                cfnieScore = 100;
            }
        } else {
            filterCount -= 100;;
        }

        // Extract the necessary details from the most similar product
        var qty = parseFloat(extractLargestNumber(finalProd.form));


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.text, nameOfMed.toLowerCase()));


        const lson = await axios.post(
            'https://www.myupchar.com/orders/city_and_locality',
            { pincode, locale }, // JSON payload
            { headers: { 'Content-Type': 'application/json' } } // Set the appropriate headers
        );

        if (lson.data.status == 200) {
            lson = "Pincode Serviceable";
        } else {
            lson = "Pincode Not Serviceable";
        }


        return {
            name: 'MyUpChar',
            item: finalProd.text,
            link: `https://www.myupchar.com/${finalProd["website-link"]}`, // Construct a link based on the drug code
            imgLink: finalProd.image,
            price: parseFloat(finalProd.sp),
            deliveryCharge: parseFloat(finalProd.sp) < 100 ? 49 : 0,
            offer: '',
            finalCharge: 0,

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,

            sfinalAvg: (parseFloat(smed + spack + cfnieScore) / filterCount).toFixed(2),
            filterCount: filterCount,

            lson: lson,
            deliveryTime: "4 - 5 days",

            manufacturerName: finalProd.mfr,
            medicineAvailability: true,
            minQty: 1,
            saltName: '',
            qtyItContainsDesc: qty,
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            name: 'MyUpChar',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};

extractDataFromApiPulseplus = async (meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching words for API

        var filterCount = 600;

        let searchName = extractWordsForApis(nameOfMed).toString().toString();

        const { data } = await axios.get(`https://www.pulseplus.in/Pulse/SearchProduct?searchText=${searchName}&searchLength=30`, { timeout: 5000 })

        const products = data;
        //   console.log(products)


        // Filter products based on text_msg and medicinePackSize
        //   const filteredProducts = products.filter(
        //       product => 

        //         var qty=parseFloat(extractLargestNumber(product.Packing))
        //         if(qty==''||qty=="NA"||qty==" "||qty==null){
        //             qty =parseFloat(extractLargestNumber(product.ProductName));
        //         }
        //         parseFloat(extractLargestNumber(qty)) === parseFloat(medicinePackSize)
        // );

        var fprod = [];

        const filteredProducts = products.filter(product => {
            // Extract the largest number from Packing
            let qty = parseFloat(extractLargestNumber(product.Packing));

            // If qty is not a valid number, try extracting from ProductName
            if (!qty || isNaN(qty)) {
                qty = parseFloat(getPackSize(product.ProductName));
            }

            // Check if qty matches any value in medicinePackSize (if medicinePackSize is an array)
            if (Array.isArray(medicinePackSize)) {
                if (medicinePackSize.includes(qty)) {
                    fprod.push(product);
                }
            } else {
                // Compare with medicinePackSize if it's a single value
                if (qty === parseFloat(medicinePackSize)) {
                    fprod.push(product);
                }
            }

            qty = ''; // Reset qty
        });


        // Find the most similar product
        const targetString = nameOfMed.toLowerCase();
        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        fprod.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.ProductName.toLowerCase(), targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        let finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
        } else {
            console.log('No products found with that package size');
            // return {};
        }
        var cfnieScore = 0;



        // Extract the necessary details from the most similar product
        var qty = parseFloat(extractLargestNumber(finalProd.Packing));
        if (qty == '' || qty == "NA" || qty == " " || qty == null) {
            qty = parseFloat(extractLargestNumber(finalProd.ProductName));
        }


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.ProductName, nameOfMed.toLowerCase()));


        if (finalProd.MRP < 999) {
            dc = 57;
        } else {
            dc = 15;
        }



        //Offers Section


        var firstWordScore = 0;
        var firstWord = finalProd.ProductName;
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }


        var newSecondaryAnchor = finalProd.ProductName.toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = finalProd.ProductName.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        if (secondaryAnchor != '@') {

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }

        var checkForSaltName = await axios.get(`https://www.pulseplus.in${finalProd["ProductLinkUrl"]}`)
        var $$ = cheerio.load(checkForSaltName.data);
        var saltSection = ($$('.prod-uses-label.mt-2').first().next('div').text() || "NA");
        if (typeof (saltSection) == 'string') {
            saltSection = [saltSection];
        }

        try {
            var newcfnie = finalProd.ProductName.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    var inPackSize = ([finalProd.Packing]).includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
              //      console.log("AAAA inside pharmeasy")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }

        } catch (error) {
            filterCount -= 100;;
        }


        var lson = await axios.post('https://www.pulseplus.in/Pulse/UpdateDetectedLocation',
            new URLSearchParams({
                PinCode: pincode
            }), // Format the data as URLSearchParams
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } } // Set the appropriate headers
        );

        var delTime;
        if (lson.data.EstimatedDeliveryInfo) {
            delTime = lson.data.EstimatedDeliveryInfo;
            lson = "Pincode Serviceable";
        } else {
            lson = "Pincode Not Serviceable";
        }


        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }


        return {
            name: 'PulsePlus',
            item: finalProd.ProductName,
            link: `https://www.pulseplus.in${finalProd["ProductLinkUrl"]}`, // Construct a link based on the drug code
            imgLink: './public/NoImageAv.png',
            price: parseFloat(finalProd.MRP),
            deliveryCharge: dc,
            offer: '',
            finalCharge: (parseFloat(finalProd.MRP) + dc).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,

            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            lson: lson,
            deliveryTime: delTime,

            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: finalProd.MfgName,
            medicineAvailability: true,
            minQty: 1,
            saltName: saltSection,
            qtyItContainsDesc: qty,
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            name: 'PulsePlus',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};

extractDataFromApiChemistBox = async (meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching words for API


        var filterCount = 600;

        let searchName = extractWordsForApis(nameOfMed).toString().toString();

        var { data } = (await axios.get(`https://chemistbox.in/ajax/ProductSearch?SearchKey=${searchName}`, { timeout: 5000 }))
        const $ = cheerio.load(data);

        var products = JSON.parse($.html().split(/<\/?body>/)[1].trim())
        // console.log(products)


        // Filter products based on text_msg and medicinePackSize
        const filteredProducts = products.filter(product => {
            const largestNumber = extractLargestNumber(product.Strength);
            return medicinePackSize.includes(parseFloat(largestNumber));
        });



        //   console.log(filteredProducts)
        // Find the most similar product
        const targetString = nameOfMed.toLowerCase();
        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        filteredProducts.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.ProductName.toLowerCase(), targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        // console.log(mostSimilarProduct)
        let finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
        } else {
            console.log('No products found with that package size In ChemistBox');
            return {};
        }

        var cfnieScore = 0;


        // Extract the necessary details from the most similar product
        var qty = parseFloat(extractLargestNumber(finalProd.Strength));


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.ProductName, nameOfMed.toLowerCase()));


        var { data } = await axios.get(`https://chemistbox.in/Ajax/SearchPincode?pincode=${pincode}`)
        var chemLocData = JSON.parse(data.replace(/^\[\s*|\s*\]$/g, ''));


        if (chemLocData.isDeliverables) {
            lson = "Pincode Serviceable";
        } else {
            lson = "Pincode Not Servicaeble";
        }

        var dc = parseFloat(chemLocData.DeliveryCharge);
        var maxOrderAmt_ForFreeCharge = parseFloat(chemLocData.MaxOrderAmt_FreeDelivery);

        if (parseFloat(finalProd.SalePrice) > maxOrderAmt_ForFreeCharge) {
            dc = 0;
        }


        var firstWordScore = 0;
        var firstWord = finalProd.ProductName;
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = finalProd.ProductName.toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = finalProd.ProductName.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        if (secondaryAnchor != '@') {

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }



        try {
            var saltSection = (finalProd.GenericName || "NA");
            if (typeof (saltSection) == 'string') {
                saltSection = [saltSection];
            }

            var newcfnie = finalProd.ProductName.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    var inPackSize = ([finalProd.Strength]).includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
              //      console.log("AAAA inside pharmeasy")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }

        } catch (error) {
            filterCount -= 100;;
        }

        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }


        return {
            name: 'ChemistBox',
            item: finalProd.ProductName,
            link: `https://chemistbox.in/Search/${finalProd.ProductURL}-${finalProd.RefID}`, // Construct a link based on the drug code
            imgLink: finalProd.ProdImage,
            price: parseFloat(finalProd.SalePrice),
            deliveryCharge: dc,
            offer: '',
            finalCharge: (parseFloat(finalProd.SalePrice) + dc).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,


            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            lson: lson,
            deliveryTime: "4 - 5 days",

            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: finalProd.MrkGroupName,
            medicineAvailability: true,
            minQty: 1,
            saltName: finalProd.GenericName || "NA",
            qtyItContainsDesc: qty,
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            name: 'ChemistBox',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};

extractDataFromApiChemistsWorld = async (meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching words for API


        var filterCount = 600;

        let searchName = extractWordsForApis(nameOfMed).toString().toString();

        var { data } = await axios.get(`https://www.chemistsworld.com/ajax/common2.php?term=${searchName}`, { timeout: 5000 })
        const products = (data);


        //   console.log(products)      

        var fprod = [];



        const formData = new URLSearchParams();
        formData.append('action', 'CheckDeliveryPincodePre');
        formData.append('pincode', pincode);

        // Make a POST request with form data
        var lson = await axios.post('https://www.chemistsworld.com/ajax/AddToCart.php', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (lson.data.includes("not")) {
            lson = "Pincode Not Serviceable";
        } else {
            lson = "Pincode Servicaeble";
        }

        const filteredProducts = products.filter(product => {
            // Check if text_msg is defined and not empty

            var emContent = product.desc.match(/<em>(.*?)<\/em>/); //pack size
            emContent = emContent ? emContent[1] : null;

            var fontContent = product.desc.match(/<font>(?:<i.*?<\/i>)(.*?)<\/font>/); //price
            fontContent = fontContent ? parseFloat(fontContent[1]) : null;



            if (medicinePackSize.includes(extractLargestNumber(emContent))) {
                fprod.push(product);
            }
        });


        // Filter products based on text_msg and medicinePackSize
        //   const filteredProducts = products.filter(product => parseFloat(extractLargestNumber(product.Strength)) === parseFloat(medicinePackSize));

        //   console.log(filteredProducts)
        // Find the most similar product
        const targetString = nameOfMed.toLowerCase();
        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        fprod.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.value.toLowerCase(), targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        let finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
        } else {
            console.log('No products found with that package size');
            return {};
        }


        var fprice = await axios.get(finalProd.id);
        var $$ = cheerio.load(fprice.data);
        var sprice = ($$('span[itemprop=price]').first().text().trim())

        if (!sprice) {
            sprice = ($$('#qty_1 option').first().text().trim())
            let cleanedPrice = sprice.replace(/,/g, ' ');
            let matches = cleanedPrice.match(/\d+(\.\d+)?/g);
            let price = matches ? parseFloat(matches[matches.length - 1]) : null;
            sprice = price
        }

        var saltSection = ($$('.salt_composition__sec p').first().text().trim() || "NA");
        if (typeof (saltSection) == 'string') {
            saltSection = [saltSection];
        }
        var avail = $$('.product_cart_area').first().html().toLowerCase().includes("add to cart") ? true : false;



        var emContent = finalProd.desc.match(/<em>(.*?)<\/em>/); //pack size
        emContent = emContent ? emContent[1] : null;

        var fontContent = finalProd.desc.match(/<font>(?:<i.*?<\/i>)(.*?)<\/font>/); //price
        fontContent = fontContent ? parseFloat(fontContent[1]) : null;

        console.log("Font Content : " + fontContent)

        var qty = parseFloat(extractLargestNumber(emContent));



        var cfnieScore = 0;
        try {
            var newcfnie = finalProd.value.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    var inPackSize = ([emContent]).includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
              //      console.log("AAAA inside pharmeasy")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }

        } catch (error) {
            console.log(error)
            filterCount -= 100;;
        }


        // Extract the necessary details from the most similar product




        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.value, nameOfMed.toLowerCase()));

        var firstWordScore = 0;
        var firstWord = finalProd.value;
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = finalProd.value.toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = finalProd.value.replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        if (secondaryAnchor != '@') {

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }

        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }



        return {
            name: 'ChemistsWorld',
            item: finalProd.value,
            link: finalProd.id, // Construct a link based on the drug code
            imgLink: './public/NoImageAv.png',
            price: parseFloat(sprice),
            deliveryCharge: parseFloat(sprice) < 2000 ? 55 : 0,
            offer: '',
            finalCharge: (parseFloat(sprice) + (parseFloat(sprice) < 2000 ? 55 : 0)).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,

            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            lson: lson,
            deliveryTime: "2 - 4 days",

            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: tempnewanchor,
            secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: '',
            medicineAvailability: avail,
            minQty: 1,
            saltName: saltSection,
            qtyItContainsDesc: qty,
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            name: 'ChemistsWorld',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};

extractDataFromApiMchemist = async (meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching words for API


        var filterCount = 600;

        let searchName = extractWordsForApis(nameOfMed).toString().toString();

        const { data } = await axios.get(`https://frontapi.mchemist.com/api/searchData?q=${searchName}`, { timeout: 5000 })

        var fprod = data.data;

        const targetString = nameOfMed.toLowerCase();
        var mostSimilarProduct = null;
        var highestSimilarityScore = 0;

        fprod.forEach(product => {
            // console.log(product.medicine_name_full)
            const similarityScore = stringSimilarity.compareTwoStrings(product.medicine_name_full.toLowerCase(), targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        var finalLink = mostSimilarProduct.link;

        var searchId = mostSimilarProduct.id;



        const url = `https://frontapi.mchemist.com/api/getDetail?q=${searchId}`;
        var medData = '';

        await axios.get(url)
            .then(response => {
                if (response.status === 200) {
                    medData = response.data.data;
                } else {
                    console.log(`Failed to fetch data. Status code: ${response.status}`);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error.message);
            });


        let finalProd;

        console.log("tpbro")
        console.log(medData.attributes[0].packing_qty)
        if (medicinePackSize.includes(extractedQty)) {
            finalProd = medData;
        }



        if (finalProd) {
            console.log("Yes Available In MChemist");
        } else {
            console.log('No products found with that package size');
            // return {};
        }


        // Extract the necessary details from the most similar product


        var qty = parseFloat(extractLargestNumber(finalProd.packing_qty));


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(mostSimilarProduct.medicine_name_full, nameOfMed.toLowerCase()));


        var saltSection = (finalProd.salt || "NA");
        if (typeof (saltSection) == 'string') {
            saltSection = [saltSection];
        }
        var cfnieScore = 0;

        try {
            var newcfnie = mostSimilarProduct.medicine_name_full.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    var inPackSize = ([finalProd.packing_qty]).includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
              //      console.log("AAAA inside pharmeasy")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }


        } catch (error) {
            filterCount -= 100;;
        }


        var firstWordScore = 0;
        var firstWord = mostSimilarProduct.medicine_name_full;
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = mostSimilarProduct.medicine_name_full.toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = mostSimilarProduct.medicine_name_full.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        console.log(finalProd.sale_rate + "From Mchemists")

        if (secondaryAnchor != '@') {

            const allPresent = secondaryAnchor.every(anchor =>
                newTempStringForExtractingSecondaryAnchor.includes(anchor.toLowerCase())
            ); // this checks if all Og secondary anchors , are present in the new string or not


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }

        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }



        return {
            name: 'M Chemist',
            item: mostSimilarProduct.medicine_name_full,
            link: "https://www.mchemist.com/" + finalLink, // Construct a link based on the drug code
            imgLink: finalProd.variation_image ? finalProd.variation_image.split(',')[0] : './public/NoImageAv.png',
            price: parseFloat(finalProd.sale_rate),
            deliveryCharge: dc.data.charge,
            offer: '',
            finalCharge: (parseFloat(finalProd.sale_rate) + parseFloat(dc.data.charge)).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,

            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            lson: "Pincode Serviceable",
            deliveryTime: "1 - 3 days",

            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: '',
            medicineAvailability: true,
            minQty: 1,
            saltName: saltSection,
            qtyItContainsDesc: qty,
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            name: 'M Chemist',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};

extractDataFromApiWellnessForever = async (nameOfMed, medicinePackSize) => {
    try {
        // Fetching words for API

        let searchName = extractWordsForApis(nameOfMed).toString().toString();

        const { data } = await axios.get(`https://www.chemistsworld.com/ajax/common2.php?term=${searchName}`)

        const products = (data);
        //   console.log(products)

        // var nps=



        var fprod = [];

        const filteredProducts = products.filter(product => {
            // Check if text_msg is defined and not empty

            var emContent = product.desc.match(/<em>(.*?)<\/em>/); //pack size
            emContent = emContent ? emContent[1] : null;

            var fontContent = product.desc.match(/<font>(?:<i.*?<\/i>)(.*?)<\/font>/); //price
            fontContent = fontContent ? parseFloat(fontContent[1]) : null;



            if (parseFloat(extractLargestNumber(emContent)) === parseFloat(medicinePackSize)) {
                fprod.push(product);
            }
        });


        // Filter products based on text_msg and medicinePackSize
        //   const filteredProducts = products.filter(product => parseFloat(extractLargestNumber(product.Strength)) === parseFloat(medicinePackSize));

        //   console.log(filteredProducts)
        // Find the most similar product
        const targetString = nameOfMed;
        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        fprod.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.value, targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        let finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
        } else {
            console.log('No products found with that package size');
            return {};
        }


        // Extract the necessary details from the most similar product

        var emContent = finalProd.desc.match(/<em>(.*?)<\/em>/); //pack size
        emContent = emContent ? emContent[1] : null;

        var fontContent = finalProd.desc.match(/<font>(?:<i.*?<\/i>)(.*?)<\/font>/); //price
        fontContent = fontContent ? parseFloat(fontContent[1]) : null;

        console.log("Font Content : " + fontContent)

        var qty = parseFloat(extractLargestNumber(emContent));


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.value, nameOfMed.toLowerCase()));




        return {
            name: 'Wellness Forever',
            item: finalProd.value,
            link: finalProd.id, // Construct a link based on the drug code
            imgLink: './public/NoImageAv.png',
            price: parseFloat(fontContent),
            deliveryCharge: 0,
            offer: '',
            finalCharge: 0,

            smed: smed,
            spack: spack,
            sfinalAvg: (parseFloat(smed + spack) / 2).toFixed(2),

            manufacturerName: '',
            medicineAvailability: true,
            minQty: 1,
            saltName: '',
            qtyItContainsDesc: qty,
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            name: 'Wellness Forever',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
}; //pending

extractDataFromApiOfPasumaiPharmacy = async (meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching HTML
        var searchName = extractWordsForApis(nameOfMed).toString() + " " + medicinePackSize;
        var filterCount = 600;


        const { data } = (await axios.get(`https://www.pasumaipharmacy.com/api/Order/SearchProduct?searchText=${searchName}&fullSearch=true`, { timeout: 5000 }));
        const products = data;

        // console.log(products)


        var fprod = [];

        const filteredProducts = products.filter(product => {
            // Check if SaleUnit matches any value in medicinePackSize
            if (medicinePackSize.includes(parseFloat(product.SaleUnit))) {
                fprod.push(product);
            } else {
                // Extract the largest number from ProductName
                const extractedNumber = parseFloat(getPackSize(product.ProductName));
                // Compare it with any value in medicinePackSize
                if (medicinePackSize.includes(extractedNumber)) {
                    fprod.push(product);
                }
            }
        });


        // Log the filtered products
        //   console.log(filteredProducts);

        const targetString = nameOfMed.toLowerCase();
        var mostSimilarProduct = null;
        var highestSimilarityScore = 0;

        fprod.forEach(product => {
            var similarityScore = stringSimilarity.compareTwoStrings(product.ProductName.toLowerCase(), targetString.toLowerCase());
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        var finalProd;
        // console.log(mostSimilarProduct)
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
            // console.log(mostSimilarProduct)     
        } else {
            console.log('No products found with that package size Pasumai');
            return {};
        }
        var cfnieScore = 0;

        try {
            var newcfnie = finalProd.ProductName.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];
            console.log(newcfnie + "Pasumaiaaa")
            console.log(cfnie.length + "Pasumaiaaa")

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    var inPackSize = ([finalProd.SaleUnit]).includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
              //      console.log("AAAA inside pharmeasy")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }

        } catch (error) {
            console.log(error)
            filterCount -= 100;
        }

        var qty = (finalProd.SaleUnit);


        if (medicinePackSize.includes(qty)) {
        } else {
            qty = getPackSize(finalProd.ProductName)
        }


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.ProductName.toLowerCase(), nameOfMed.toLowerCase()));


        var image = finalProd.ProfilePictureUrl;
        if (image.includes("pasumai")) {
        } else {
            image = "https://www.pasumaipharmacy.com" + image.replace(/[^a-zA-Z0-9/.-]/g, '')
        }


        var dc = 0;
        if (parseFloat(finalProd.SalePrice) >= 0 && parseFloat(finalProd.SalePrice) < 1000) {
            dc = 63;
        } else {
            dc = 13;
        }

        var firstWordScore = 0;
        var firstWord = finalProd.ProductName;
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = finalProd.ProductName.toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = finalProd.ProductName.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        if (secondaryAnchor != '@') {

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }

        var lson = await axios.post('https://www.pasumaipharmacy.com/Pasumai/UpdateDetectedLocation',
            new URLSearchParams({
                Location: '',
                PinCode: pincode
            }), // Format the data as URLSearchParams
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } } // Set the appropriate headers
        );

        var delTime = '';
        if (lson.data.EstimatedDeliveryInfo) {
            delTime = lson.data.EstimatedDeliveryInfo;
            lson = "Pincode Serviceable";
        } else {
            lson = "Pincode Not Serviceable";
        }

        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }



        return {
            name: 'Pasumai Pharmacy',
            item: finalProd.ProductName,
            link: "https://www.pasumaipharmacy.com" + finalProd.ProductLinkUrl,
            imgLink: image,
            price: parseFloat(finalProd.SalePriceMax),
            deliveryCharge: dc,
            offer: '',
            finalCharge: (parseFloat(finalProd.SalePriceMax) + dc).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,

            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            lson: lson,
            deliveryTime: delTime,

            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: finalProd.Mfg,
            medicineAvailability: finalProd.IsAvailable == 1 ? true : false,
            minQty: 1,
            saltName: 'NA',
            qtyItContainsDesc: qty,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {
            name: 'Pasumai Pharmacy',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};


extractDataFromApiOfPracto = async (meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching HTML
        var searchName = extractWordsForApis(nameOfMed).toString();
        console.log("Ptacto   " + searchName)
        var filterCount = 600;


        const { data } = (await axios.get(`https://www.practo.com/practopedia/api/v1/search?query=${searchName}&pincode=${pincode}`, { timeout: 5000 }));
        const products = data;

        // console.log(products)


        var fprod = [];

        const filteredProducts = products.filter(product => {
            // Check if text_msg is defined and not empty
            // Extract the largest number from text_msg
            if (parseFloat(product.drug.pack) == parseFloat(medicinePackSize)) {
                fprod.push(product);
            } else {
                const extractedNumber = parseFloat(getPackSize(product.display_text));
                // Compare it with medicinePackSize
                if (medicinePackSize.includes(extractedNumber)) {
                    fprod.push(product);
                }
            }

        });


        const targetString = nameOfMed.toLowerCase();
        var mostSimilarProduct = null;
        var highestSimilarityScore = 0;

        fprod.forEach(product => {
            var similarityScore = stringSimilarity.compareTwoStrings(product.display_text.toLowerCase(), targetString.toLowerCase());
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });
        // Log the filtered products
        //   console.log(filteredProducts);


        var finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
            // console.log(mostSimilarProduct)     
        } else {
            console.log('No products found with that package size');
            return {};
        }


        var saltSection = (finalProd.drug.product_name || "NA");
        if (typeof (saltSection) == 'string') {
            saltSection = [saltSection];
        }


        var cfnieScore = 0;
        try {
            var newcfnie = finalProd.display_text.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    var inPackSize = ([finalProd.drug.pack]).includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
                    console.log("AAAA inside practo")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }

        } catch (error) {
            console.log("Error practo " + [finalProd.drug.pack] + error)
            filterCount -= 100;;
        }


        var qty = (finalProd.drug.pack);


        if (medicinePackSize.includes(qty)) {
        } else {
            qty = getPackSize(finalProd.display_text)
        }


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.display_text.toLowerCase(), nameOfMed.toLowerCase()));


        if (finalProd.drug.is_available) {
            lson = "Pincode Serviceable";
        } else {
            lson = "Pincode Not Serviceable";
        }

        var firstWordScore = 0;
        var firstWord = finalProd.display_text;
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = finalProd.display_text.toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = finalProd.display_text.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        console.log("FUll Name in Practo " + fullNewMedicineName)
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        console.log("FUll Name in Practo " + newTempStringForExtractingSecondaryAnchor)
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        if (secondaryAnchor != '@') {

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }


        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }


        return {
            name: 'Practo',
            item: finalProd.display_text,
            link: "https://www.practo.com/medicine-info/" + finalProd.drug.slug,
            imgLink: finalProd.drug.images ? finalProd.drug.images[0]['res-750'] : './public/NoImageAv.png',
            price: parseFloat(finalProd.drug.mrp),
            deliveryCharge: 0,
            offer: '',
            finalCharge: (parseFloat(finalProd.drug.mrp) + 0).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,

            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            lson: "Pincode Serviceable",
            deliveryTime: "2 - 3 days",

            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: finalProd.drug.manufacturer_name,
            medicineAvailability: (finalProd.is_available) ? true : false,
            minQty: 1,
            saltName: saltSection,
            qtyItContainsDesc: qty,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {
            name: 'Practo',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};



extractDataFromExpressMed = async (url, meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching words for API


        var filterCount = 600;

        var { data } = (await axios.get(url))
        const $ = cheerio.load(data);

        // var products=JSON.parse($.html().split(/<\/?body>/)[1].trim())
        // console.log(products)


        // Filter products based on text_msg and medicinePackSize

        var price = parseFloat($('.item-price').first().clone().children().remove().end().text().trim().replace(',', ''))

        var saltSection = ($('.detail-key-incre ul li').text().split('+') || 'NA');
        if (typeof (saltSection) == 'string') {
            saltSection = [saltSection];
        }

        var cfnieScore = 0;
        try {
            var newcfnie = $('h2').first().text().match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];


            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    var inPackSize = $('.item-qty').first().text().includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }
            } else {
               // console.log("AAAA")
                if (newcfnie) {
              //      console.log("AAAA inside pharmeasy")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }


        } catch (error) {
            console.log(error)
            filterCount -= 100;;
        }

        // Extract the necessary details from the most similar product
        var qty = parseFloat(extractLargestNumber($('.item-qty').first().text()));
        console.log("Express Med +" + $('.item-qty').first().text())


        console.log(qty)

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        } else if (medicinePackSize.includes(parseFloat(getPackSize($('h2').first().text())))) {
            spack = 100;
            qty = medicinePackSize;
        } else {
            spack = 0;
        }

        var smed = parseFloat(await calculateSimilarity($('h2').first().text().toLowerCase(), nameOfMed.toLowerCase()));



        var dc = 0;

        if (price < 150) {
            dc = 150;
        } else if (price >= 150 && price < 500) {
            dc = 100;
        } else if (price >= 500) {
            dc = 0;
        }


        var firstWordScore = 0;
        var firstWord = $('h2').first().text();
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        // var newSecondaryAnchor=await getSecondaryAnchorValueFromString($('h2').first().text().toLowerCase());
        var newSecondaryAnchor = $('h2').first().text().toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = $('h2').first().text().toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        if (secondaryAnchor != '@') {

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }

        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }


        return {
            name: 'ExpressMed',
            item: $('h2').first().text(),
            link: url, // Construct a link based on the drug code
            imgLink: $('#exzoom img').first().attr('src'),
            price: price,
            deliveryCharge: dc,
            offer: '',
            finalCharge: (price + dc).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,


            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            lson: "Pincode Serviceable",
            deliveryTime: "2 - 3 days",

            tempnewanchor: tempnewanchor,
            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: $('.product-description p').first().text(),
            medicineAvailability: $('.product-detail-content .add-cart').html() ? true : false,
            minQty: 1,
            saltName: saltSection,
            qtyItContainsDesc: qty,
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            name: 'ExpressMed',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};


extractDataFromApiOfHealthmug = async (meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching HTML
        var searchName = extractWordsForApis(nameOfMed).toString();
        var filterCount = 600;


        const { data } = (await axios.post(`https://api.healthmug.com/productlist/getproductlist`, {
            "atts": "",
            "price": "",
            "brand": "",
            "sortby": "0",
            "keywords": searchName[0],
            "delivery": "",
            "pagetype": "search",
            "pageno": 1,
            "disease_id": "",
            "categoryid": "",
            "appstring": "Desktop - v2.0",
            "rating": "",
            "weight": ""
        }, { timeout: 5000 }));
        const products = data.itemlist.items;



        var fprod = [];

        const filteredProducts = products.filter(product => {
            // Check if text_msg is defined and not empty
            // Extract the largest number from text_msg
            // console.log(product)
            // console.log(extractLargestNumber(product.variant_size))
            // console.log(medicinePackSize)
            if (medicinePackSize.includes(extractLargestNumber(product.variant_size))) {
                // console.log(product.variant_size);
                fprod.push(product);
            }

        });


        const targetString = nameOfMed.toLowerCase();
        var mostSimilarProduct = null;
        var highestSimilarityScore = 0;

        fprod.forEach(product => {
            var similarityScore = stringSimilarity.compareTwoStrings(product.name.toLowerCase(), targetString.toLowerCase());
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });
        // Log the filtered products
        //   console.log(filteredProducts);


        var finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
            // console.log(mostSimilarProduct)     
        } else {
            console.log('No products found with that package size');
            // return {};
        }


        var cfnieScore = 0;



        var qty = extractLargestNumber(finalProd.variant_size);


        if (medicinePackSize.includes(qty)) {
        } else {
            qty = getPackSize(finalProd.name)
        }


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.name.toLowerCase(), nameOfMed.toLowerCase()));

        // console.log("healthMug pincode " + pincode)
        // console.log("healthMug pincode " + finalProd.id)

        var lson = await axios.post('https://api.healthmug.com/products/checkcourier',
            {
                "pincode": pincode,
                "idcode": finalProd.id,
            }
        )
        var delTime = `${lson.data.prepaid.time} - ${lson.data.prepaid.time + 2} days`


        if (lson.data.prepaid.time) {
            lson = "Pincode Servicaeble";
        } else {
            lson = "Pincode Not Serviceable";
        }


        var firstWordScore = 0;
        var firstWord = finalProd.name;
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = finalProd.name.toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = finalProd.name.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        console.log("New Sub String Healthmiug" + newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        if (secondaryAnchor != '@') {

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else if (firstWord.includes()) {

            } else {
                secondAnchorSearchScore = 0;
            }
        }

        var saltname = await axios.post(`https://api.healthmug.com/products/getproductdetails`, {
            idcode: finalProd.id,
        })


        var saltSection = (saltname.data.productdetail.productinfo.salt || "NA");
        if (typeof (saltSection) == 'string') {
            saltSection = [saltSection];
        }
        try {
            var newcfnie = finalProd.name.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    var inPackSize = ([finalProd.variant_size]).includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
              //      console.log("AAAA inside pharmeasy")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }


        } catch (error) {
            filterCount -= 100;;
        }

        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }


        return {
            name: 'HealthMug',
            item: finalProd.name,
            link: "https://www.healthmug.com" + finalProd.url,
            imgLink: './public/NoImageAv.png',
            price: parseFloat(finalProd.price),
            deliveryCharge: finalProd.price < 500 ? 50 : 0,
            offer: '',
            finalCharge: (parseFloat(finalProd.price) + parseFloat(finalProd.price < 500 ? 50 : 0)).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,

            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            lson: "Pincode Serviceable",
            deliveryTime: delTime,

            secondaryAnchor: secondaryAnchor,
            tempnewanchor: tempnewanchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: '',
            medicineAvailability: finalProd.not_deliverable == false ? true : false,
            minQty: 1,
            saltName: saltSection,
            qtyItContainsDesc: qty,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {
            name: 'HealthMug',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};



extractDataFromApiMedivik = async (meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching words for API


        var filterCount = 600;

        let searchName = extractWordsForApis(nameOfMed).toString().toString();

        var { data } = (await axios.get(`https://www.medivik.com/products/index?search=${searchName}`, { timeout: 5000 }))
        const $ = cheerio.load(data);

        // console.log(products)

        const products = [];



        // Iterate over each parent div (or section) that contains price information
        $('#category-products .col-md-3').each((i, column) => {
            const section = $(column).find('.section-area');
            const prices = [];

            // Find the price elements (look for ₹ or .fa-inr class) within the section-area
            section.find('i.fa-inr').each((j, elem) => {
                const priceText = $(elem).parent().text().trim(); // Get the price with the ₹ symbol
                prices.push(priceText);
            });

            // Fetch product name (h5) and packaging information (span[style=float:right]) if available
            const productName = section.find('h5').first().text().trim(); // Use text() to avoid HTML tags
            const packagingInfo = section.find('span[style=float:right]').first().text().trim(); // Use text() to avoid HTML tags

            const productLink = section.find('a').attr('href'); // Get the href for the product link
            const imgLink = section.find('img').attr('src');    // Get the src for the image link


            // Check if the "Add to Cart" button is present in the next div
            const isAvailable = $(column).find('div:nth-child(2) .add-card span').first().html().includes("Add");

            // Only proceed if there are at least two prices (MRP and sale price)
            if (prices.length >= 2) {
                const mrp = prices[0];
                const salePrice = prices[1];

                // Store the product details along with availability status
                products.push({
                    ProductName: productName,
                    Packaging: packagingInfo,
                    MRP: mrp,
                    SalePrice: salePrice,
                    ProductLink: productLink,
                    ImgLink: imgLink,
                    ProductAvailable: isAvailable
                });
            } else {
                // Handle cases where prices are missing
                const mrp = prices[0] || 'NA';
                products.push({
                    ProductName: productName,
                    Packaging: packagingInfo,
                    MRP: mrp,
                    SalePrice: 'NA',
                    ProductLink: productLink,
                    ImgLink: imgLink,
                    ProductAvailable: isAvailable
                });
            }
        });


        // Filter products based on text_msg and medicinePackSize
        const filteredProducts = products.filter(product => {
            const extractedSize = parseFloat(extractLargestNumber(product.Packaging));

            // Check if medicinePackSize is an array
            if (Array.isArray(medicinePackSize)) {
                // Return true if extractedSize matches any value in medicinePackSize
                return medicinePackSize.includes(extractedSize);
            } else {
                // If medicinePackSize is a single value, directly compare it
                return extractedSize === parseFloat(medicinePackSize);
            }
        });

        //   console.log(filteredProducts)
        // Find the most similar product
        const targetString = nameOfMed.toLowerCase();
        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        filteredProducts.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.ProductName.toLowerCase(), targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        // console.log(mostSimilarProduct)


        let finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
        } else {
            console.log('No products found with that package size In ChemistBox');
            return {};
        }

        var cfnieScore = 0;



        // Extract the necessary details from the most similar product
        var qty = parseFloat(extractLargestNumber(finalProd.Packaging));


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.ProductName, nameOfMed.toLowerCase()));


        var { data } = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`)


        if (data[0].Status == "Success") {
            lson = "Pincode Serviceable";
        } else {
            lson = "Pincode Not Servicaeble";
        }



        var saltName = await axios.get(`https://medivik.com${finalProd.ProductLink}`);
        const $$ = cheerio.load(saltName.data)

        var saltSection = ($$('.col-md-2:contains("Composition")').first().next('div').text().trim() || "NA");
        if (typeof (saltSection) == 'string') {
            saltSection = [saltSection];
        }


        try {
            var newcfnie = finalProd.ProductName.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    var inPackSize = ([finalProd.Packaging]).includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
              //      console.log("AAAA inside pharmeasy")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }

        } catch (error) {
            filterCount -= 100;;
        }


        var firstWordScore = 0;
        var firstWord = finalProd.ProductName;
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = finalProd.ProductName.toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);

        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = finalProd.ProductName.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        // //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        if (secondaryAnchor != '@') {

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }

        var fp = parseFloat(finalProd.SalePrice == 'NA' ? finalProd.MRP : finalProd.SalePrice);


        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }


        return {
            name: 'Medivik',
            item: finalProd.ProductName,
            link: `https://medivik.com${finalProd.ProductLink}`, // Construct a link based on the drug code
            imgLink: "https://medivik.com" + finalProd.ImgLink,
            price: fp,
            deliveryCharge: fp < 1000 ? 45 : 0,
            offer: '',
            finalCharge: (fp + (fp < 1000 ? 45 : 0)).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,


            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            lson: lson,
            deliveryTime: "2 - 4 days",

            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: finalProd.MrkGroupName,
            medicineAvailability: true,
            minQty: 1,
            saltName: saltSection,
            qtyItContainsDesc: qty,
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            name: 'Medivik',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};



function calculateDaysRangeForMrMed(minDate, maxDate) {
    const today = new Date();
    const minDateObj = new Date(minDate);
    const maxDateObj = new Date(maxDate);

    // Calculate the difference in time
    const diffMin = Math.ceil((minDateObj - today) / (1000 * 60 * 60 * 24));
    const diffMax = Math.ceil((maxDateObj - today) / (1000 * 60 * 60 * 24));

    // If any difference is negative, set it to zero (no days remaining)
    const remainingMin = diffMin > 0 ? diffMin : 0;
    const remainingMax = diffMax > 0 ? diffMax : 0;

    return `${remainingMin}-${remainingMax} days`;
}

const generateLinkForMedPay = ({ name, sku_id }) => {
    // Convert the product name to a URL-friendly format
    const urlFriendlyName = name.toLowerCase().replace(/\s+/g, '-');
    return `https://www.medpay.store/products/${urlFriendlyName}-${sku_id}`;
};



extractDataFromApiOfMedpay = async (meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching HTML
        var searchName = extractWordsForApis(nameOfMed).toString();
        console.log("Medpay searchname "+ searchName)
        var filterCount = 600;
        
        if (typeof (searchName) == 'object') {
            searchName = JSON.stringify(searchName);
        }
        searchName=searchName.toString();
        console.log("Medpay searchname 2"+ searchName)
        

        const { data } = await axios.get(`https://www.medpay.store/api/sku-store-search?name=${searchName}`, { timeout: 5000 });
        console.log(data)
        const products = (data.data.response.sku_results.results);
        console.log(products)

        var fprod = [];

        const filteredProducts = products.filter(product => {
            // Check if text_msg is defined and not empty
            const extractedNumber = parseFloat(extractLargestNumber(product.pack_qty_label));
            // Compare it with medicinePackSize
            if (medicinePackSize.includes(extractedNumber)) {
                fprod.push(product);
            }
        });



        // Log the filtered products
        //   console.log(filteredProducts);

        const targetString = nameOfMed.toLowerCase();

        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        fprod.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.name.toLowerCase(), targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        var finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
            // console.log(mostSimilarProduct)
        } else {
            console.log('No products found with that package size');
            // return {};
        }

        var saltSection = (finalProd.composition || "NA");
        if (typeof (saltSection) == 'string') {
            saltSection = [saltSection];
        }


        var cfnieScore = 0;
        try {
            var newcfnie = finalProd.name.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    var inPackSize = ([finalProd.pack_qty_label]).includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
              //      console.log("AAAA inside pharmeasy")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }

        } catch (error) {
            filterCount -= 100;;
        }

        var qty = extractLargestNumber(finalProd.pack_qty_label);


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.name.toLowerCase(), nameOfMed.toLowerCase()));


        var deliPrice = 50;


        var firstWordScore = 0;
        var firstWord = finalProd.name;
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = finalProd.name.toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = finalProd.name.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        if (secondaryAnchor != '@') {

            console.log("SECONDARY ANCHOR INSIDE MEDPAY " + secondaryAnchor)

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }

        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }


        return {
            name: 'MedPay Store',
            item: finalProd.name,
            link: generateLinkForMedPay(finalProd),
            imgLink: finalProd.images[0] || './public/NoImageAv.png',
            price: parseFloat(finalProd.mrp),
            deliveryCharge: deliPrice,
            offer: '',
            finalCharge: (parseFloat(finalProd.mrp) + deliPrice).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,

            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            lson: "Pincode Serviceable",
            deliveryTime: "1 - 3 days",

            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: finalProd.mfr,
            medicineAvailability: finalProd.status == "available" ? true : false,
            minQty: 1,
            saltName: saltSection,
            qtyItContainsDesc: qty,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {
            name: 'Medpay',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};




extractDataFromApiOfMrmed = async (meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching HTML
        var searchName = extractWordsForApis(nameOfMed).toString();
        var filterCount = 600;

        if (typeof (searchName) == 'object') {
            searchName = JSON.stringify(searchName);
        }
        console.log(typeof (searchName))

        const { data } = await axios.get(`https://api.mrmed.in/products/api/v1/product/search?size=10&page=1&search=${searchName}`, { timeout: 5000 });
        const products = (data.data.list);
        // console.log(products)

        var fprod = [];

        const filteredProducts = products.filter(product => {
            // Check if text_msg is defined and not empty
            const extractedNumber = parseFloat(extractLargestNumber(product.packingDetail));
            // Compare it with medicinePackSize
            if (medicinePackSize.includes(extractedNumber)) {
                fprod.push(product);
            }
        });



        // Log the filtered products
        //   console.log(filteredProducts);

        const targetString = nameOfMed.toLowerCase();

        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        fprod.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.medicineName.toLowerCase(), targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        var finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
            // console.log(mostSimilarProduct)
        } else {
            console.log('No products found with that package size');
            return {};
        }

        var saltSection = ""


        var cfnieScore = 0;
        try {
            var newcfnie = finalProd.medicineName.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    var inPackSize = ([finalProd.packingDetail]).includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
              //      console.log("AAAA inside pharmeasy")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }

        } catch (error) {
            console.log("Practo Error " + error)
            filterCount -= 100;;
        }

        var qty = extractLargestNumber(finalProd.packingDetail);


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.medicineName.toLowerCase(), nameOfMed.toLowerCase()));


        var deliPrice = 0;

        if (finalProd.priceToCustomer < 1100) {
            deliPrice = 89;
        } else if (finalProd.priceToCustomer >= 1100 && finalProd.priceToCustomer < 1500) {
            deliPrice = 59;
        } else if (finalProd.priceToCustomer >= 1500 && finalProd.priceToCustomer < 2000) {
            deliPrice = 39;
        } else if (finalProd.priceToCustomer >= 2000) {
            deliPrice = 0;
        }

        if (finalProd.coldChain.toLowerCase() == "yes") {
            deliPrice += 100;
        }


        var firstWordScore = 0;
        var firstWord = finalProd.medicineName;
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = finalProd.medicineName.toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = finalProd.medicineName.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        if (secondaryAnchor != '@') {

            console.log("SECONDARY ANCHOR INSIDE MEDPAY " + secondaryAnchor)

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }

        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }



        // var { pincodeServiceable } = await axios.get(`https://api.mrmed.in/orders/api/v1/pincode/pincodeServiceabilty?pincode=${pincode}`);

        var pincodeServiceable = await axios.get(`https://api.mrmed.in/orders/api/v1/pincode/estimateOrder?pincode=${pincode}`);

        var delTime = calculateDaysRangeForMrMed(pincodeServiceable.data.data.MinimumDate, pincodeServiceable.data.data.MaximumDate);

        var lson = "";
        if (delTime.split('-')[0] != 0) {
            lson = "Pincode Serviceable";
        } else {
            lson = "Pincode Not Servicaeble";
        }



        return {
            name: 'Mr Med',
            item: finalProd.medicineName,
            link: 'https://www.mrmed.in/medicines/' + finalProd.medicineName.toLowerCase().replace(/ /g, '-'),
            imgLink: finalProd.imgUrls[0].url || './public/NoImageAv.png',
            price: parseFloat(finalProd.priceToCustomer),
            deliveryCharge: deliPrice,
            offer: '',
            finalCharge: (parseFloat(finalProd.priceToCustomer) + deliPrice).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,

            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            lson: lson,
            deliveryTime: delTime,

            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: finalProd.manufacturer,
            medicineAvailability: finalProd.stock,
            minQty: 1,
            saltName: saltSection,
            qtyItContainsDesc: qty,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {
            name: 'Chemist180',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};



extractDataFromApiOfMfine = async (meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching HTML
        var searchName = (nameOfMed);
        var filterCount = 600;

        if (typeof (searchName) == 'object') {
            searchName = JSON.stringify(searchName);
        }
        console.log(typeof (searchName))

        var params =
        {
            "params": {},
            "payload": {
                "q": `${searchName}`,
                "provider": "onemg",
                "city": "Kolkata",
                "pincode": `${pincode}`,
            }
        }

        const { data } = await axios.post(`https://www.mfine.co/order/proxy/pbl/ctg/fml`, params, { timeout: 5000 });
        const products = (data.searchResults);
        // console.log(products)

        var fprod = [];

        const filteredProducts = products.filter(product => {
            // Check if text_msg is defined and not empty
            const extractedNumber = parseFloat(extractLargestNumber(product.label));
            // Compare it with medicinePackSize
            if (medicinePackSize.includes(extractedNumber)) {
                fprod.push(product);
            }
        });



        // Log the filtered products
        //   console.log(filteredProducts);

        const targetString = nameOfMed.toLowerCase();

        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        fprod.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.name.toLowerCase(), targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        var finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
            // console.log(mostSimilarProduct)
        } else {
            console.log('No products found with that package size');
            return {};
        }

        var saltSection = ""


        var cfnieScore = 0;
        try {
            var newcfnie = finalProd.name.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    var inPackSize = ([finalProd.label]).includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
                    console.log("AAAA inside mfine")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }

        } catch (error) {
            filterCount -= 100;;
        }

        var qty = extractLargestNumber(finalProd.label);


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.name.toLowerCase(), nameOfMed.toLowerCase()));


        var deliPrice = 0;

        var price = finalProd.prices.discounted_price ? finalProd.prices.discounted_price : finalProd.prices.mrp
        price = parseFloat(price.split("₹")[1]);

        if (price < 150) {
            deliPrice = 82;
        } else if (price >= 150 && price < 200) {
            deliPrice = 32;
        } else if (price >= 200) {
            deliPrice = 3;
        }


        var firstWordScore = 0;
        var firstWord = finalProd.name;
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = finalProd.name.toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = finalProd.name.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        if (secondaryAnchor != '@') {

            console.log("SECONDARY ANCHOR INSIDE MEDPAY " + secondaryAnchor)

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }

        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }



        // var { pincodeServiceable } = await axios.get(`https://api.mrmed.in/orders/api/v1/pincode/pincodeServiceabilty?pincode=${pincode}`);

        return {
            name: 'M Fine',
            item: finalProd.name,
            link: `https://www.mfine.co/order/medicines/search?category=` + finalProd.name,
            imgLink: finalProd.image || './public/NoImageAv.png',
            price: price,
            deliveryCharge: deliPrice,
            offer: '',
            finalCharge: (parseFloat(price) + deliPrice).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,

            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            lson: "Pincode Serviceable",
            deliveryTime: "1-2 Days",

            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: '',
            medicineAvailability: finalProd.available,
            minQty: 1,
            saltName: saltSection,
            qtyItContainsDesc: qty,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {
            name: 'Chemist180',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};


extractDataFromApiOfNetmeds = async (meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching HTML
        const searchName = nameOfMed // Set your search name here
        var filterCount = 600;

        const url = 'https://0z9q3se3dl-dsn.algolia.net/1/indexes/*/queries';
        const headers = {
            'x-algolia-agent': 'Algolia for JavaScript (3.33.0); Browser; instantsearch.js (4.49.1); JS Helper (3.11.1)',
            'x-algolia-application-id': '0Z9Q3SE3DL',
            'x-algolia-api-key': 'daff858f97cc3361e1a3f722e3729753',
            'Content-Type': 'application/json' // Specify that you're sending JSON content
        };
        
        
        const data = {
            requests: [
                {
                    indexName: 'prod_meds',
                    params: `clickAnalytics=true&facets=%5B%22in_stock%22%2C%22categories%22%2C%22brand%22%2C%22manufacturer_name%22%2C%22algolia_facet.Benefits%22%2C%22algolia_facet.Product%20Characteristic%22%2C%22algolia_facet.Skin%20Concern%22%2C%22algolia_facet.Skin%20Type%22%2C%22selling_price%22%2C%22discount_pct%22%5D&highlightPostTag=__%2Fais-highlight__&highlightPreTag=__ais-highlight__&hitsPerPage=12&maxValuesPerFacet=50&page=0&query=${searchName}&tagFilters=&userToken=33420139`
                
                }
            ]
        };

        var netmedsData;
        try {
            const response = await axios.post(url, data, {
                headers,
                timeout: 5000 // Timeout specified in the same object
            });
        
            netmedsData = response.data; // Correctly access the data property from response
            // console.log(netmedsData);
        } catch (error) {
            console.error('Error:', error);
        }

        const products = (netmedsData['results'][0]['hits']);
        console.log(products)
        console.log("netmeds")

        var fprod = [];

        const filteredProducts = products.filter(product => {
            // Check if text_msg is defined and not empty
            const extractedNumber = parseFloat(extractLargestNumber(product.pack_size));
            // Compare it with medicinePackSize
            if (medicinePackSize.includes(extractedNumber)) {
                fprod.push(product);
            }
        });



        // Log the filtered products
        //   console.log(filteredProducts);

        const targetString = nameOfMed.toLowerCase();

        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        fprod.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.display_name.toLowerCase(), targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        var finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
            // console.log(mostSimilarProduct)
        } else {
            console.log('No products found with that package size');
            return {};
        }

        var saltSection = ""


        var cfnieScore = 0;
        try {
            var newcfnie = finalProd.display_name.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    var inPackSize = ([finalProd.pack_size]).includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
                    console.log("AAAA inside mfine")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }

        } catch (error) {
            filterCount -= 100;;
        }

        var qty = extractLargestNumber(finalProd.pack_size);


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.display_name.toLowerCase(), nameOfMed.toLowerCase()));


        var deliPrice = 0;

        var price = parseFloat(finalProd.selling_price);
        // price = parseFloat(price.split("₹")[1]);

        if (parseFloat(price) < 199) {
            deliPrice = 69;
        } else if (parseFloat(price) >= 199 && parseFloat(price) < 250) {
            deliPrice = 49;
        } else if (parseFloat(price) >= 250) {
            deliPrice = 0;
        }


        var firstWordScore = 0;
        var firstWord = finalProd.display_name;
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = finalProd.display_name.toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = finalProd.display_name.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        if (secondaryAnchor != '@') {

            console.log("SECONDARY ANCHOR INSIDE MEDPAY " + secondaryAnchor)

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }

        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }



        var lson = await axios.get(`https://www.netmeds.com/nmsd/rest/v2/pin/${pincode}`);
        // lson = Pincode Serviceable or not

        if (lson.data.status === 'success') {
            lson = "Pincode Serviceable"
        } else {
            lson = "Pincode Not Serviceable"
        }

        const params = {
            "pincode": pincode,
            "do_not_split": false,
            "calling_to_route": true,
            "lstdrug": [
                {
                    "itemcode": finalProd.product_code,
                    "Qty": 1
                }
            ]
        };
        var deltimeData = await axios.post(`https://www.netmeds.com/nmsp/api/v2/Splitpost`, params);

        var delTime = (deltimeData.data.Result.result[0].delivery_estimate.in_day_counts.on_or_after);

        if (delTime > 2) {
            delTime = `${delTime - 2} - ${delTime} days`;
        } else {
            delTime = `${delTime - 1} - ${delTime} days`;
        }

       

        return {
            name: 'Netmeds',
            item: finalProd.display_name,
            link: `https://netmeds.com` + finalProd.url_path,
            imgLink: `https://netmeds.com/` +finalProd.image_url || './public/NoImageAv.png',
            price: price,
            deliveryCharge: deliPrice,
            offer: '',
            finalCharge: (parseFloat(price) + deliPrice).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,

            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            lson: lson,
            deliveryTime: delTime,

            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: finalProd.manufacturer_name,
            medicineAvailability: finalProd.availability_status=='A'?true:false,
            minQty: 1,
            saltName: saltSection,
            qtyItContainsDesc: qty,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {
            name: 'Netmeds',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};


extractDataFromApiOfTruemeds = async (meddata, nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism) => {
    try {
        // Fetching HTML
        const searchName = extractSearchName(nameOfMed) // Set your search name here
        var filterCount = 600;

        var truemedsData;
      try {
            const {data} = await axios.get(`https://nal.tmmumbai.in/CustomerService/getSearchResult?warehouseId=10&elasticSearchType=SKU_BRAND_SEARCH&searchString=${searchName}&isMultiSearch=true&variantId=8`, 
                {timeout: 5000 });
        
                truemedsData = data.responseData.elasticProductDetails; // Correctly access the data property from response
            // console.log(netmedsData);
        } catch (error) {
            console.error('Error:', error);
        }

        const products = (truemedsData);
        console.log(products +"Truemeds")

        var fprod = [];

        const filteredProducts = products.filter(product => {
            
            // Check if text_msg is defined and not empty
            const extractedNumber = parseFloat(extractLargestNumber(product.product.packForm));
            // Compare it with medicinePackSize
            if (medicinePackSize.includes(extractedNumber)) {
                fprod.push(product);
            }
        }); 



        // Log the filtered products
        //   console.log(filteredProducts);

        const targetString = nameOfMed.toLowerCase();

        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        fprod.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.product.skuName.toLowerCase(), targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });


        var finalProd;
        if (mostSimilarProduct) {
            finalProd = mostSimilarProduct;
            // console.log(mostSimilarProduct)
        } else {
            console.log('No products found with that package size');
            return {};
        }


        // console.log(finalProd.product)
        var saltSection = finalProd.product.composition||'';


        var cfnieScore = 0;
        try {
            var newcfnie = finalProd.product.skuName.match(/\d+/g);
            newcfnie = newcfnie ? newcfnie.map(Number) : [];

            var foundCount = 0;
            if (cfnie.length) {
                // Loop through cfnie numbers and check if they exist in apolloData.name or saltSection
                cfnie.forEach(num => {
                    // Check if the number is in apolloData.name
                    var inName = newcfnie.includes(num);

                    // Check if the number is in saltSection (join saltSection to a string and check)
                    var inSalt = saltSection.includes(num.toString()) || 0;

                    var inPackSize = ([extractLargestNumber(finalProd.product.packForm)]).includes(num) || 0;

                    // If found in either apolloData.name or saltSection, increment the counter
                    if (inName || inSalt || inPackSize) {
                        foundCount++;
                    }
                });

                // Update cfnieScore based on how many cfnie numbers were found
                if (foundCount === cfnie.length) {
                    cfnieScore = 100; // All numbers found
                } else {
                    cfnieScore = 0; // No numbers found
                }

            } else {
               // console.log("AAAA")
                if (newcfnie) {
                    console.log("AAAA inside mfine")
                    if (newcfnie.some(num => meddata.packSize.includes(num.toString()))) {
                        foundCount++;
                    }
                    if (
                        newcfnie.some(num =>
                            meddata.saltName.some(salt =>
                                salt.includes(num.toString())
                            )
                        )
                    ) {
                        foundCount++;
                    }

                    if (foundCount == newcfnie.length) {
                        cfnieScore = 100;
                    } else {
                        cfnieScore = 0;
                    }

                } else {
                    cfnieScore = 0;
                }
            }

        } catch (error) {
            filterCount -= 100;;
        }

        var qty = extractLargestNumber(finalProd.product.packForm);


        qty = parseFloat(qty);

        var spack = 0;
        if (medicinePackSize.includes(qty)) {
            spack = 100;
        }

        var smed = parseFloat(await calculateSimilarity(finalProd.product.skuName.toLowerCase(), nameOfMed.toLowerCase()));


        var deliPrice = 0;

        var price = parseFloat(finalProd.product.sellingPrice)||parseFloat(finalProd.product.mrp);
        // price = parseFloat(price.split("₹")[1]);

        if (price < 400) {
            deliPrice = 39 + 11;
        } else if (price >= 400 && price < 550) {
            deliPrice = 29 + 11;
        } else if (price >= 550) {
            deliPrice = 11;
        }


        var firstWordScore = 0;
        var firstWord = finalProd.product.skuName;
        if (compareFirstWords(firstWord, extractSearchName(nameOfMed))) {
            firstWordScore = 100;
        } else {
            firstWordScore = 0;
        }

        var newSecondaryAnchor = finalProd.product.skuName.toLowerCase().match(/[A-Za-z]+|\d+(\.\d+)?/g);
        var secondAnchorSearchScore = 0;

        var newTempStringForExtractingSecondaryAnchor = '';

        var fullNewMedicineName = finalProd.product.skuName.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
        if (firstWordScore == 100) {
            newTempStringForExtractingSecondaryAnchor = fullNewMedicineName.substring(fullNewMedicineName.toLowerCase().indexOf(extractSearchName(nameOfMed).toLowerCase())).toLowerCase();
        }
        //console.log("New Sub String "+ newTempStringForExtractingSecondaryAnchor)


        var tempnewanchor = getSecondaryAnchorValueFromString(newTempStringForExtractingSecondaryAnchor);


        if (secondaryAnchor != '@') {

            console.log("SECONDARY ANCHOR INSIDE MEDPAY " + secondaryAnchor)

            const allPresent = secondaryAnchor.every(anchor => {
                // If the anchor length is 1, use the original method
                if (anchor.length === 1) {
                    return new RegExp(`\\b${anchor}\\b`, 'i').test(newTempStringForExtractingSecondaryAnchor);
                }
                // Otherwise, check if the word is present anywhere in the string (case-insensitive)
                else {
                    return newTempStringForExtractingSecondaryAnchor.toLowerCase().includes(anchor.toLowerCase());
                }
            });


            if (allPresent) {
                secondAnchorSearchScore = 100;
            } else {
                secondAnchorSearchScore = 0;

            }
        } else {
            if (tempnewanchor == secondaryAnchor) {
                filterCount -= 100;
            } else {
                secondAnchorSearchScore = 0;
            }
        }

        var tempStringForCheckingRelease = newTempStringForExtractingSecondaryAnchor.toLowerCase().replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok",
            "dt", "md", "iu", "nmg", "dpi", "sf"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const newreleaseMechanism = foundWord ? foundWord.toLowerCase() : '@';

        if (releaseMechanism != '@') {
            if (newreleaseMechanism == releaseMechanism) {
                releaseMechScore = 100;
            } else {
                if (newreleaseMechanism == '@') {
                    releaseMechScore = 100;
                } else {
                    releaseMechScore = 0;
                }
            }
        } else {
            filterCount -= 100;
        }


        var lson;
        try {
            lson = await axios.get(`https://nal.tmmumbai.in/ThirdPartyService/checkPincodeServiceability?pincode=${pincode}`);
            if (lson.data.isServicable) {
                lson = "Pincode Serviceable";
            }
        } catch (e) {
            console.log(e)
            lson = "Pincode Not Serviceable";
        }

        var delTime = '';
        try {
            var delTimeData = await axios.get(`https://nal.tmmumbai.in/CustomerService/getEstimatedDeliveryDateBasedOnPincode?pincode=${pincode}`);
            if (delTimeData.data.surface) {
                delTime = Math.ceil((new Date(delTimeData.data.surface) - new Date()) / (1000 * 60 * 60 * 24));


                if (delTime > 2) {
                    delTime = `${delTime - 2} - ${delTime} days`;
                } else {
                    delTime = `${delTime - 1} - ${delTime} days`;
                }


                if (delTime == 0) {
                    delTime = "Within 24 hours";
                }
            }
        } catch (e) {
            console.log(e)
            delTime = "Pincode Not Serviceable";
        }


        // var { pincodeServiceable } = await axios.get(`https://api.mrmed.in/orders/api/v1/pincode/pincodeServiceabilty?pincode=${pincode}`);

        return {
            name: 'Truemeds',
            item: finalProd.product.skuName,
            link: `https://www.truemeds.in/` + finalProd.product.productUrlSuffix,
            imgLink: finalProd.product.productImageUrlArray[0] || './public/NoImageAv.png',
            price: price,
            deliveryCharge: deliPrice,
            offer: '',
            finalCharge: (parseFloat(price) + deliPrice).toFixed(2),

            smed: smed,
            spack: spack,
            cfnie: cfnie,
            cfnieScore: cfnieScore,
            newcfnie: newcfnie,
            firstWordScore: firstWordScore,
            releaseMechScore: releaseMechScore,

            sfinalAvg: Math.round(parseFloat(parseFloat(smed + spack + cfnieScore + firstWordScore + secondAnchorSearchScore + releaseMechScore) / filterCount) * 100),
            filterCount: filterCount,

            lson: lson,
            deliveryTime: delTime,

            secondaryAnchor: secondaryAnchor,
            newSecondaryAnchor: tempnewanchor, secondAnchorSearchScore: secondAnchorSearchScore,

            manufacturerName: finalProd.product.manufacturerName,
            medicineAvailability: finalProd.product.available,
            minQty: 1,
            saltName: saltSection,
            qtyItContainsDesc: qty,

        };

    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');
        console.log(error);
        return {
            name: 'Truemeds',
            item: 'NA',
            link: '',
            imgLink: '',
            price: '',
            deliveryCharge: '',
            offer: '',
            finalCharge: 0,
            similarityIndex: '',
            smed: '',
            sman: '',
            manufacturerName: '',
            medicineAvailability: '',
            minQty: 1,
        };
    }
};




extractLinkFromOptimizedyahoo = async (url, pharmaNames, medname) => {
    try {
        // Fetching HTML
        const { data } = await axios.get(url)

        const $ = cheerio.load(data);

        console.log("fetchedDataFromYahoo");
        var keywords = medname.split(' ');

        var resultsA = [], resultsB = [], resultsC = [], resultsD = [], resultsE = [], resultsF = [], resultsG = [], resultsH = [], resultsI = [], resultsJ = [], resultsK = [], resultsL = [], resultsM = [], resultsN = [], resultsO = [], resultsP = [];

        console.log("-----------");
        console.log(pharmaNames);
        $('#web ol li h3 a').each(function () {
            var str = $(this).attr('href');
            //dolo 650 mg

            // console.log(str);

            if (str.includes(pharmaNames[0]) && !str.includes("yahoo.com") && pharmaNames[0] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsA.push({ plink: str, point: count });

            } else if (str.includes(pharmaNames[1]) && !str.includes("yahoo.com") && pharmaNames[1] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsB.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[2]) && !str.includes("yahoo.com") && pharmaNames[2] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsC.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[3]) && !str.includes("yahoo.com") && pharmaNames[3] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsD.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[4]) && !str.includes("yahoo.com") && pharmaNames[4] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsE.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[5]) && !str.includes("yahoo.com") && pharmaNames[5] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsF.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[6]) && !str.includes("yahoo.com") && pharmaNames[6] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsG.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[7]) && !str.includes("yahoo.com") && pharmaNames[7] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsH.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[8]) && !str.includes("yahoo.com") && pharmaNames[8] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsI.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[9]) && !str.includes("yahoo.com") && pharmaNames[9] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsJ.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[10]) && !str.includes("yahoo.com") && pharmaNames[10] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsK.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[11]) && !str.includes("yahoo.com") && pharmaNames[11] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsL.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[12]) && !str.includes("yahoo.com") && pharmaNames[12] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsM.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[13]) && !str.includes("yahoo.com") && pharmaNames[13] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsN.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[14]) && !str.includes("yahoo.com") && pharmaNames[14] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsO.push({ plink: str, point: count });
            } else if (str.includes(pharmaNames[15]) && !str.includes("yahoo.com") && pharmaNames[15] != 0) {
                var count = 1;
                for (var i = 0; i < keywords.length; i++) {
                    if ((new RegExp("\\b" + keywords[i] + "\\b", "i").test(str))) {
                        count++;
                    }
                }
                resultsP.push({ plink: str, point: count });
            }

        })

        resultsA.sort((a, b) => {
            return b.point - a.point;
        });
        resultsB.sort((a, b) => {
            return b.point - a.point;
        });
        resultsC.sort((a, b) => {
            return b.point - a.point;
        });
        resultsD.sort((a, b) => {
            return b.point - a.point;
        });
        resultsE.sort((a, b) => {
            return b.point - a.point;
        });
        resultsF.sort((a, b) => {
            return b.point - a.point;
        });
        resultsG.sort((a, b) => {
            return b.point - a.point;
        });
        resultsH.sort((a, b) => {
            return b.point - a.point;
        });
        resultsI.sort((a, b) => {
            return b.point - a.point;
        });
        resultsJ.sort((a, b) => {
            return b.point - a.point;
        });
        resultsK.sort((a, b) => {
            return b.point - a.point;
        });
        resultsL.sort((a, b) => {
            return b.point - a.point;
        });
        resultsM.sort((a, b) => {
            return b.point - a.point;
        });
        resultsN.sort((a, b) => {
            return b.point - a.point;
        });
        resultsO.sort((a, b) => {
            return b.point - a.point;
        });
        resultsP.sort((a, b) => {
            return b.point - a.point;
        });




        const final = [];

        try {
            final.push(resultsA[0]['plink'])
            console.log(resultsA[0]['plink'])
            pharmaNames[0] = 0;
        } catch (error) {
            // final.push(0)
        }


        try {
            final.push(resultsB[0]['plink'])
            console.log(resultsB[0]['plink'])
            pharmaNames[1] = 0;
        } catch (error) {
            // final.push(0)
        }


        try {
            final.push(resultsC[0]['plink'])
            console.log(resultsC[0]['plink'])
            pharmaNames[2] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsD[0]['plink'])
            console.log(resultsD[0]['plink'])
            pharmaNames[3] = 0;
        } catch (error) {
            // final.push(0)
        }


        try {
            final.push(resultsE[0]['plink'])
            console.log(resultsE[0]['plink'])
            pharmaNames[4] = 0;
        } catch (error) {
            // final.push(0)
        }


        try {
            final.push(resultsF[0]['plink'])
            console.log(resultsF[0]['plink'])

            pharmaNames[5] = 0;
        } catch (error) {
            // final.push(0)
        }
        try {
            final.push(resultsG[0]['plink'])
            console.log(resultsG[0]['plink'])
            pharmaNames[6] = 0;
        } catch (error) {
            // final.push(0)
        }


        try {
            final.push(resultsH[0]['plink'])
            console.log(resultsH[0]['plink'])
            pharmaNames[7] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsI[0]['plink'])
            console.log(resultsI[0]['plink'])
            pharmaNames[8] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsJ[0]['plink'])
            console.log(resultsJ[0]['plink'])
            pharmaNames[9] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsK[0]['plink'])
            console.log(resultsK[0]['plink'])
            pharmaNames[10] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsL[0]['plink'])
            console.log(resultsL[0]['plink'])
            pharmaNames[11] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsM[0]['plink'])
            console.log(resultsM[0]['plink'])
            pharmaNames[12] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsN[0]['plink'])
            console.log(resultsN[0]['plink'])
            pharmaNames[13] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsO[0]['plink'])
            console.log(resultsO[0]['plink'])
            pharmaNames[14] = 0;
        } catch (error) {
            // final.push(0)
        }

        try {
            final.push(resultsP[0]['plink'])
            console.log(resultsP[0]['plink'])
            pharmaNames[15] = 0;
        } catch (error) {
            // final.push(0)
        }



        return final;
        // url = rawUrl.split("/url?q=")[1].split("&")[0];
        // console.log('Extracting url: ', url);


    } catch (error) {
        // res.sendFile(__dirname + '/try.html');
        // res.sendFile(__dirname + '/error.html');

        console.log(error)
        return 0;
    }
};

fasterIgextractLinkFromOptimizedyahoo = async (url, pharmaNames, medname) => {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const keywords = medname.split(' ');

        const results = pharmaNames.map(() => []);

        $('#web ol li h3 a').each(function () {
            const str = $(this).attr('href');

            pharmaNames.forEach((pharmaName, index) => {
                if (str.includes(pharmaName) && !str.includes("yahoo.com") && pharmaName !== 0) {
                    let count = 1;
                    keywords.forEach((keyword) => {
                        if ((new RegExp("\\b" + keyword + "\\b", "i").test(str))) {
                            count++;
                        }
                    });
                    results[index].push({ plink: str, point: count });
                }
            });
        });

        const final = [];

        for (var i = 0; i < results.length; i++) {
            results[i].sort((a, b) => b.point - a.point);
        }
        // console.log(results)

        results.forEach((result, index) => {
            try {
                final.push(result[0]['plink']);
                console.log(result[0]['plink']);
                pharmaNames[index] = 0;
            } catch (error) {
                // final.push(0)
            }
        });

        console.log(final)
        return final;
    } catch (error) {
        console.log(error);
        return 0;
    }
};

function checkforzero(arr) {
    var count = 0;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == 0) {
            count++;
        }
    }
    return count;
}



































const tempfzz = [];

app.get('/getUpdatesOfMultiMeds', async (req, res) => {

    // res.send(tempfzz);

    async function extractMedInfoFromApiMyUpChar(nameOfMed, medicinePackSize) {
        const response = await axios.get(`https://www.myupchar.com/en/search/autocomplete_v2?query=${nameOfMed}`);
        const products = response.data;
        // console.log(products)

        const filteredProducts = products.filter(product => extractLargestNumber(product.form) === medicinePackSize);

        console.log(filteredProducts)

        const targetString = "Crocin 650 Tablet";

        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        filteredProducts.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.text, targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        return ["MyUpChar", mostSimilarProduct.text, mostSimilarProduct["website-link"]];
    }

    async function extractMedInfoFromApiPulsePlus(nameOfMed, medicinePackSize) {
        const response = await axios.get(`https://www.pulseplus.in/Pulse/SearchProduct?searchText=${nameOfMed}&searchLength=10`);
        const products = response.data;
        // console.log(products)

        const filteredProducts = products.filter(product => extractLargestNumber(product.Packing) === medicinePackSize);

        console.log(filteredProducts)
        console.log(extractLargestNumber("15 is a apple"))

        const targetString = "Crocin 650 Tablet";

        let mostSimilarProduct = null;
        let highestSimilarityScore = 0;

        filteredProducts.forEach(product => {
            const similarityScore = stringSimilarity.compareTwoStrings(product.ProductName, targetString);
            if (similarityScore > highestSimilarityScore) {
                highestSimilarityScore = similarityScore;
                mostSimilarProduct = product;
            }
        });

        return ["PulsePlus", mostSimilarProduct.ProductName, mostSimilarProduct.ProductLinkUrl];
    }



    console.log(await extractMedInfoFromApiMyUpChar("Crocin ", 15));
    console.log(await extractMedInfoFromApiPulsePlus("Crocin ", 15));



});

app.get('/FastGetPharmaDataFromLinks', async (req, res) => {
    const item = req.query['pharmalinks'].split(",");
    // console.log(typeof(req.query['pharmalinks']));
    var nameOfMed = req.query['medname'];
    var manufacturer = req.query['manufacturer'];
    // console.log(medName)
    console.log("76567")
    const pharmaData = []

    // 'apollopharmacy.in','netmeds.com', 'pharmeasy.in',
    // 'pasumaipharmacy.com', 'pulseplus.in', 'medplusmart.com',
    // 'truemeds.in', 'kauverymeds.com',

    // FastextractDataOfApollo(pharmaLinkArray[0], medName,manufacturer),
    // extractDataOfNetMeds(pharmaLinkArray[1], medName,manufacturer),
    // extractDataOfPharmEasy(pharmaLinkArray[2], medName,manufacturer),
    // // extractDataOfOBP(pharmaLinkArray[2], medName,manufacturer),
    // extractDataOfPP(pharmaLinkArray[3], medName,manufacturer),
    // extractDataOfmedplusMart(pharmaLinkArray[4], medName,manufacturer),
    // extractDataOfOgMPM(pharmaLinkArray[5], medName,manufacturer),
    // // extractDataOfMyUpChar(pharmaLinkArray[4], medName,manufacturer),
    // extractDataOfTruemeds(pharmaLinkArray[6], medName,manufacturer),
    // // extractDataOfTata(pharmaLinkArray[8], medName,manufacturer),
    // extractDataOfKauveryMeds(pharmaLinkArray[7], medName,manufacturer),

    pharmaData.push(await Promise.all([
        FastextractDataOfApollo(item[0], nameOfMed, manufacturer),
        extractDataOfNetMeds(item[1], nameOfMed, manufacturer),
        extractDataOfPharmEasy(item[2], nameOfMed, manufacturer),
        extractDataOfPP(item[3], nameOfMed, manufacturer),
        extractDataOfmedplusMart(item[4], nameOfMed, manufacturer),
        extractDataOfOgMPM(item[5], nameOfMed, manufacturer),
        extractDataOfTruemeds(item[6], nameOfMed, manufacturer),
        extractDataOfKauveryMeds(item[7], nameOfMed, manufacturer),
    ]));
    console.log(pharmaData.data);
    // res.send(pharmaData);



    res.send(pharmaData);

});



app.get('/findCombination', async (req, res) => {
    console.log(res.query['q'])
});


app.get('/fastComp', async (req, res) => {


    var nameOfMed = req.query['medname'] + '\n';
    var manufacturerName = req.query['manufacturer'] + '\n';
    nameOfMed = nameOfMed.trim();
    console.log(nameOfMed);
    const presReq = ["No"];
    var arr = [

        'apollopharmacy.in', 'netmeds.com', 'pharmeasy.in',
        'pasumaipharmacy.com', 'pulseplus.in', 'medplusmart.com',
        'truemeds.in', 'kauverymeds.com',
        //  'myupchar.com',
        // '1mg.com', 
        // 'onebharatpharmacy.com',
        // 'wellnessforever.com',
        // 'secondmedic.com', 'chemistsworld.com', 'callhealth.com',
    ]



    var cont = checkforzero(arr);
    // console.log(arr)

    var tries = 0;
    var cpyOftempf;
    var tempf = [];
    var t = [0, 0, 0, 0, 0, 0, 0, 0];


    var tempFinal = [];
    while (cont != 8) {


        tries++;



        var mixUrl;
        // mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=intitle:(${nameOfMed},${req.query['packSize']?req.query['packSize']:''} ${req.query['manufacturerName']?req.query['manufacturerName']:''})&vs=`;
        // mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=intitle:(${nameOfMed})&vs=`;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] != 0) {
                mixUrl += arr[i] + "+%2C+";
            }
        }
        console.log("New Url => " + mixUrl)
        // console.log(arr)



        tempf = [...tempf, await fasterIgextractLinkFromOptimizedyahoo(mixUrl, arr, nameOfMed)];
        if (cpyOftempf == tempf || tries >= 12) {
            break;
        } else {
            cont = checkforzero(arr);
            console.log(cont)
            console.log("Try -> " + tries);
            cpyOftempf = tempf;
            tempf = tempf.flat();
        }
    }

    tempfzz.push(1);



    for (var k = 0; k < tempf.length; k++) {
        if (tempf[k].includes("apollo")) {
            t[0] = tempf[k];
        } else if (tempf[k].includes("netmeds")) {
            t[1] = tempf[k];
        } else if (tempf[k].includes("pharmeasy")) {
            t[2] = tempf[k];
        }
        else if (tempf[k].includes("pasumai")) {
            t[3] = tempf[k];
        }
        else if (tempf[k].includes("pulseplus")) {
            t[4] = tempf[k];
        } else if (tempf[k].includes("medplusmart")) {
            t[5] = tempf[k];
        } else if (tempf[k].includes("truemeds")) {
            t[6] = tempf[k];
        } else if (tempf[k].includes("kauverymeds")) {
            t[7] = tempf[k];
        }
    }

    t.push(req.query['manufacturerName']);
    t.push(nameOfMed)
    console.log(t);





    tempf = tempf.flat();

    tempfzz.push(1);



    for (var k = 0; k < tempf.length; k++) {
        if (tempf[k].includes("netmeds")) {
            t[0] = tempf[k];
        } else if (tempf[k].includes("pharmeasy")) {
            t[1] = tempf[k];
        } else if (tempf[k].includes("tabletshablet")) {
            t[2] = tempf[k];
        } else if (tempf[k].includes("pulseplus")) {
            t[3] = tempf[k];
        } else if (tempf[k].includes("myupchar")) {
            t[4] = tempf[k];
        } else if (tempf[k].includes("pasumai")) {
            t[5] = tempf[k];
        } else if (tempf[k].includes("medplusmart")) {
            t[6] = tempf[k];
        } else if (tempf[k].includes("truemeds")) {
            t[7] = tempf[k];
        } else if (tempf[k].includes("1mg")) {
            t[8] = tempf[k];
        }
    }
    console.log(t);

    // const urlForApolloNetmedsPharmEasy = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+apollopharmacy.in+netmeds.com+pharmeasy.in)+
    // -1mg.com%2Chealthmug.com%2Cpasumaipharmacy.com%2Cmyupchar.in%2Chealthskoolpharmacy.com%2Ctabletshablet.com%2Cpulseplus.in
    // &vs=apollopharmacy.in+%2C+netmeds.com+%2Cpharmeasy.in&ad=dirN&o=0`;

    // const urlForHealthskoolTabletshabletPulsePlus = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+healthskoolpharmacy+tabletshablet+pulseplus)+
    // &vs=healthskoolpharmacy.com+%2C+tabletshablet.com%2Cpulseplus.in&ad=dirN&o=0`;

    // const urlForMyupcharMedplusMartPasumai = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+pasumaipharmacy+medplusmart+myupchar)+
    // &vs=medplusmart.com%2Cmyupchar.com+%2Cpasumaipharmacy.com&ad=dirN&o=0`;

    // const Finallinks = await axios.all([extractLinkFromOptimizedyahoo(urlForApolloNetmedsPharmEasy, nameOfMed, 'apollo', 'netmeds', 'pharmeasy'),
    // extractLinkFromOptimizedyahoo(urlForHealthskoolTabletshabletPulsePlus, nameOfMed, 'healthskool', 'tabletshablet', 'pulseplus')
    //     , extractLinkFromOptimizedyahoo(urlForMyupcharMedplusMartPasumai, nameOfMed, 'myupchar', 'pasumai', 'medplusmart')])


    tempf.length = 0;


    res.send(t);

    // await axios.all([extractLinkFromOptimizedyahoo(urlForApolloNetmedsPharmEasy,nameOfMed, 'apollo', 'netmeds', 'pharmeasy'),
    // extractLinkFromOptimizedyahoo(urlForHealthskoolTabletshabletPulsePlus,nameOfMed, 'healthskool', 'tabletshablet', 'pulseplus')
    //     , extractLinkFromOptimizedyahoo(urlForMyupcharHealthmugPasumai,nameOfMed, 'myupchar', 'healthmug', 'pasumai')])
    //     .then(await axios.spread(async (...responses) => {
    //         // console.log(...responses);
    //         const end = performance.now() - start;
    //         console.log(`Execution time: ${end}ms`);

    //         // item.push(responses[0])

    //         console.log(responses[0]);
    //         console.log(responses[1]);
    //         console.log(responses[2]);

    //         // getData(item);
    //     }))


});

app.get('/fastCompMorePharmas', async (req, res) => {
    // Insert Login Code Here

    // {
    //     // apollo - x
    //     // netmeds -ok
    //     // pharmeasy -x
    //     // healthslool - ok
    //     // tabletshablet - ok
    //     // pulseplus - ok
    //     // medplusmart - ok
    //     // pasumai - ok
    // } for med price change as per location

    // {
    //     // apollo -  x
    //     // netmeds - ok final
    //     // pharmeasy - x 
    //     // healthslool - ok final
    //     // tabletshablet - ok final
    //     // pulseplus - ok  work on it 
    //     // medplusmart - ok final
    //     // pasumai - ok ~ 
    // } for delivery price change as per location


    var nameOfMed = req.query['medname'] + '\n';
    nameOfMed = nameOfMed.trim();
    console.log(nameOfMed);
    const presReq = ["No"];


    var tempFinal = [];

    var mixUrl;
    // var mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=medicine intitle:(${nameOfMed})&vs=pharmeasy.in+%2C+myupchar.com+%2C+netmeds.com+%2C+medplusmart.com+%2C+tabletshablet.com+%2C+pulseplus.in+%2C+pasumaipharmacy.com+%2C+truemeds.in+%2C+1mg.com`;


    var arr = [

        'netmeds.com', 'pharmeasy.in',
        'pasumaipharmacy.com', 'pulseplus.in',
        'tabletshablet.com', 'medplusmart.com', 'myupchar.com',
        'truemeds.in', '1mg.com', 'onebharatpharmacy.com',
        'kauverymeds.com', 'indimedo.com', 'wellnessforever.com',
        'secondmedic.com', 'chemistsworld.com', 'callhealth.com',
    ]


    var cont = checkforzero(arr);
    // console.log(arr)
    var tempf = [];
    var t = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var tries = 0;
    while (cont != 16) {


        tries++;
        mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=buy intitle:(${nameOfMed})&vs=`;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] != 0) {
                mixUrl += arr[i] + "+%2C+";
            }
        }
        console.log("New Url => " + mixUrl)
        // console.log(arr)



        tempf = [...tempf, await fasterIgextractLinkFromOptimizedyahoo(mixUrl, arr, nameOfMed)];

        cont = checkforzero(arr);
        console.log(cont)
        console.log("Try -> " + tries);
    }
    tempf = tempf.flat();

    tempfzz.push(1);



    for (var k = 0; k < tempf.length; k++) {
        if (tempf[k].includes("netmeds")) {
            t[0] = tempf[k];
        } else if (tempf[k].includes("pharmeasy")) {
            t[1] = tempf[k];
        }
        // else if (tempf[k].includes("healthskool")) {
        // t[3]=tempf[k];
        // } 
        else if (tempf[k].includes("tabletshablet")) {
            t[2] = tempf[k];
        } else if (tempf[k].includes("pulseplus")) {
            t[3] = tempf[k];
        } else if (tempf[k].includes("myupchar")) {
            t[4] = tempf[k];
        } else if (tempf[k].includes("pasumai")) {
            t[5] = tempf[k];
        } else if (tempf[k].includes("medplusmart")) {
            t[6] = tempf[k];
        } else if (tempf[k].includes("truemeds")) {
            t[7] = tempf[k];
        } else if (tempf[k].includes("1mg")) {
            t[8] = tempf[k];
        } else if (tempf[k].includes("onebharatpharmacy")) {
            t[9] = tempf[k];
        } else if (tempf[k].includes("kauverymeds")) {
            t[10] = tempf[k];
        } else if (tempf[k].includes("indimedo")) {
            t[11] = tempf[k];
        } else if (tempf[k].includes("wellnessforever")) {
            t[12] = tempf[k];
        } else if (tempf[k].includes("secondmedic")) {
            t[13] = tempf[k];
        } else if (tempf[k].includes("chemistsworld")) {
            t[14] = tempf[k];
        } else if (tempf[k].includes("callhealth")) {
            t[15] = tempf[k];
        }
    }
    console.log(t);


    // const urlForApolloNetmedsPharmEasy = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+apollopharmacy.in+netmeds.com+pharmeasy.in)+
    // -1mg.com%2Chealthmug.com%2Cpasumaipharmacy.com%2Cmyupchar.in%2Chealthskoolpharmacy.com%2Ctabletshablet.com%2Cpulseplus.in
    // &vs=apollopharmacy.in+%2C+netmeds.com+%2Cpharmeasy.in&ad=dirN&o=0`;

    // const urlForHealthskoolTabletshabletPulsePlus = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+healthskoolpharmacy+tabletshablet+pulseplus)+
    // &vs=healthskoolpharmacy.com+%2C+tabletshablet.com%2Cpulseplus.in&ad=dirN&o=0`;

    // const urlForMyupcharMedplusMartPasumai = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+pasumaipharmacy+medplusmart+myupchar)+
    // &vs=medplusmart.com%2Cmyupchar.com+%2Cpasumaipharmacy.com&ad=dirN&o=0`;

    // const Finallinks = await axios.all([extractLinkFromOptimizedyahoo(urlForApolloNetmedsPharmEasy, nameOfMed, 'apollo', 'netmeds', 'pharmeasy'),
    // extractLinkFromOptimizedyahoo(urlForHealthskoolTabletshabletPulsePlus, nameOfMed, 'healthskool', 'tabletshablet', 'pulseplus')
    //     , extractLinkFromOptimizedyahoo(urlForMyupcharMedplusMartPasumai, nameOfMed, 'myupchar', 'pasumai', 'medplusmart')])




    res.send(t);

    // await axios.all([extractLinkFromOptimizedyahoo(urlForApolloNetmedsPharmEasy,nameOfMed, 'apollo', 'netmeds', 'pharmeasy'),
    // extractLinkFromOptimizedyahoo(urlForHealthskoolTabletshabletPulsePlus,nameOfMed, 'healthskool', 'tabletshablet', 'pulseplus')
    //     , extractLinkFromOptimizedyahoo(urlForMyupcharHealthmugPasumai,nameOfMed, 'myupchar', 'healthmug', 'pasumai')])
    //     .then(await axios.spread(async (...responses) => {
    //         // console.log(...responses);
    //         const end = performance.now() - start;
    //         console.log(`Execution time: ${end}ms`);

    //         // item.push(responses[0])

    //         console.log(responses[0]);
    //         console.log(responses[1]);
    //         console.log(responses[2]);

    //         // getData(item);
    //     }))


});

app.get('/fastCompMorePharmasUsingAxiosParallel', async (req, res) => {


    var nameOfMed = req.query['medname'] + '\n';
    nameOfMed = nameOfMed.trim();
    console.log(nameOfMed);
    const presReq = ["No"];

    var t = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const urlForNetMeds = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+netmeds.com) &vs=netmeds.com`;
    const urlForPharmEasy = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+pharmeasy.in) &vs=pharmeasy.in`;  //*//
    const urlForPP = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+pasumaipharmacy.com) &vs=pasumaipharmacy.com`;
    const urlForPulsePlus = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+pulseplus.in) &vs=pulseplus.in`;
    const urlForOBP = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+tabletshablet.com) &vs=tabletshablet.com`;
    const urlForMedPlusMart = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+medplusmart.com) &vs=medplusmart.com`;
    const urlForMyUpChar = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+myupchar.com) &vs=myupchar.com`;
    const urlForTruemeds = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+truemeds.in) &vs=truemeds.in`;
    const urlForTata = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+1mg.com) &vs=1mg.com`;

    const urlForOneBharat = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+onebharatpharmacy.com) &vs=onebharatpharmacy.com`;
    const urlForKauverymeds = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+kauverymeds.com) &vs=kauverymeds.com`;
    const urlForIndimedo = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+indimedo.com) &vs=indimedo.com`;
    const urlForWellnessforever = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+wellnessforever.com) &vs=wellnessforever.com`;
    const urlForSecondmedic = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+secondmedic.com) &vs=secondmedic.com`;
    const urlForChemistsworld = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+chemistsworld.com) &vs=chemistsworld.com`;
    const urlForCallhealth = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+callhealth.com) &vs=callhealth.com`;


    t = await Promise.all([
        extractLinkFromyahoo(urlForNetMeds), extractLinkFromyahoo(urlForPharmEasy), extractLinkFromyahoo(urlForPP),
        extractLinkFromyahoo(urlForPulsePlus), extractLinkFromyahoo(urlForOBP), extractLinkFromyahoo(urlForMedPlusMart),
        extractLinkFromyahoo(urlForMyUpChar), extractLinkFromyahoo(urlForTruemeds), extractLinkFromyahoo(urlForTata), extractLinkFromyahoo(urlForOneBharat),
        extractLinkFromyahoo(urlForKauverymeds), extractLinkFromyahoo(urlForIndimedo),
        extractLinkFromyahoo(urlForWellnessforever), extractLinkFromyahoo(urlForSecondmedic),
        extractLinkFromyahoo(urlForChemistsworld), extractLinkFromyahoo(urlForCallhealth)
    ])

    res.send(t);

});



app.get('/getUpdatesOfSingleMedicineComparison', async (req, res) => {

    res.send(app.locals.tempf);
});


app.get('/searchPharm', async (req, res) => {
    // Insert Login Code Here

    // {
    //     // apollo - x
    //     // netmeds -ok
    //     // pharmeasy -x
    //     // healthslool - ok
    //     // tabletshablet - ok
    //     // pulseplus - ok
    //     // medplusmart - ok
    //     // pasumai - ok
    // } for med price change as per location

    // {
    //     // apollo -  x
    //     // netmeds - ok final
    //     // pharmeasy - x 
    //     // healthslool - ok final
    //     // tabletshablet - ok final
    //     // pulseplus - ok  work on it 
    //     // medplusmart - ok final
    //     // pasumai - ok ~ 
    // } for delivery price change as per location


    var nameOfMed = req.query['medname'] + '\n';
    nameOfMed = nameOfMed.trim().replace(/[%,+]/g, ' ');
    console.log(nameOfMed);
    var tempf = [];
    var t = [0, 0, 0, 0, 0, 0, 0];
    const presReq = ["No"];


    var tempFinal = [];

    var mixUrl;
    // var mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=medicine intitle:(${nameOfMed})&vs=pharmeasy.in+%2C+myupchar.com+%2C+netmeds.com+%2C+medplusmart.com+%2C+tabletshablet.com+%2C+pulseplus.in+%2C+pasumaipharmacy.com+%2C+truemeds.in+%2C+1mg.com`;


    // var arr = [

    //     'netmeds.com', 'pharmeasy.in',
    //     'pasumaipharmacy.com', 'pulseplus.in',
    //     'tabletshablet.com', 'medplusmart.com', 'myupchar.com',
    //     'truemeds.in', '1mg.com', 'onebharatpharmacy.com',
    //     'kauverymeds.com', 'indimedo.com', 'wellnessforever.com',
    //     'secondmedic.com', 'chemistsworld.com', 'callhealth.com',
    // ]

    var arr = [

        'netmeds.com', 'pharmeasy.in',
        'pasumaipharmacy.com', 'pulseplus.in',
        'tabletshablet.com', 'medplusmart.com',
        'truemeds.in',
        //  'myupchar.com',
        // '1mg.com', 
        // 'onebharatpharmacy.com',
        // 'kauverymeds.com', 'indimedo.com', 
        // 'secondmedic.com', 'chemistsworld.com', 'chemistbox.in',
    ]


    var cont = checkforzero(arr);
    // console.log(arr)

    var tries = 0;
    var cpyOftempf;
    while (cont != 7) {


        tries++;



        mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=buy intitle:(${nameOfMed})&vs=`;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] != 0) {
                mixUrl += arr[i] + "+%2C+";
            }
        }
        console.log("New Url => " + mixUrl)
        // console.log(arr)



        tempf = [...tempf, await fasterIgextractLinkFromOptimizedyahoo(mixUrl, arr, nameOfMed)];
        app.locals.tempf = tempf;
        if (cpyOftempf == tempf || tries >= 7) {
            break;
        } else {
            cont = checkforzero(arr);
            console.log(cont)
            console.log("Try -> " + tries);
            cpyOftempf = tempf;
            tempf = tempf.flat();
        }
    }

    tempf = tempf.flat();
    tempfzz.push(1);



    for (var k = 0; k < tempf.length; k++) {
        if (tempf[k].includes("netmeds")) {
            t[0] = tempf[k];
        } else if (tempf[k].includes("pharmeasy")) {
            t[1] = tempf[k];
        }
        else if (tempf[k].includes("pasumai")) {
            t[2] = tempf[k];
        }
        else if (tempf[k].includes("pulseplus")) {
            t[3] = tempf[k];
        } else if (tempf[k].includes("tabletshablet")) {
            t[4] = tempf[k];
        } else if (tempf[k].includes("medplusmart")) {
            t[5] = tempf[k];
        } else if (tempf[k].includes("truemeds")) {
            t[6] = tempf[k];
        }
    }


    tempf.length = 0;
    console.log(t)


    // const urlForApolloNetmedsPharmEasy = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+apollopharmacy.in+netmeds.com+pharmeasy.in)+
    // -1mg.com%2Chealthmug.com%2Cpasumaipharmacy.com%2Cmyupchar.in%2Chealthskoolpharmacy.com%2Ctabletshablet.com%2Cpulseplus.in
    // &vs=apollopharmacy.in+%2C+netmeds.com+%2Cpharmeasy.in&ad=dirN&o=0`;

    // const urlForHealthskoolTabletshabletPulsePlus = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+healthskoolpharmacy+tabletshablet+pulseplus)+
    // &vs=healthskoolpharmacy.com+%2C+tabletshablet.com%2Cpulseplus.in&ad=dirN&o=0`;

    // const urlForMyupcharMedplusMartPasumai = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+pasumaipharmacy+medplusmart+myupchar)+
    // &vs=medplusmart.com%2Cmyupchar.com+%2Cpasumaipharmacy.com&ad=dirN&o=0`;

    // const Finallinks = await axios.all([extractLinkFromOptimizedyahoo(urlForApolloNetmedsPharmEasy, nameOfMed, 'apollo', 'netmeds', 'pharmeasy'),
    // extractLinkFromOptimizedyahoo(urlForHealthskoolTabletshabletPulsePlus, nameOfMed, 'healthskool', 'tabletshablet', 'pulseplus')
    //     , extractLinkFromOptimizedyahoo(urlForMyupcharMedplusMartPasumai, nameOfMed, 'myupchar', 'pasumai', 'medplusmart')])




    res.send(t)

    // await axios.all([extractLinkFromOptimizedyahoo(urlForApolloNetmedsPharmEasy,nameOfMed, 'apollo', 'netmeds', 'pharmeasy'),
    // extractLinkFromOptimizedyahoo(urlForHealthskoolTabletshabletPulsePlus,nameOfMed, 'healthskool', 'tabletshablet', 'pulseplus')
    //     , extractLinkFromOptimizedyahoo(urlForMyupcharHealthmugPasumai,nameOfMed, 'myupchar', 'healthmug', 'pasumai')])
    //     .then(await axios.spread(async (...responses) => {
    //         // console.log(...responses);
    //         const end = performance.now() - start;
    //         console.log(`Execution time: ${end}ms`);

    //         // item.push(responses[0])

    //         console.log(responses[0]);
    //         console.log(responses[1]);
    //         console.log(responses[2]);

    //         // getData(item);
    //     }))


});

app.get('/storeSearchedMedicineData', async (req, res) => {
    try {
        const database = client.db('MedicompDb');
        const collection = database.collection('searchPharmas');

        

        // Insert a single document
        const result = await collection.insertOne({ medicine: req.query['medicineName'], DateOfSearch: getCurrentDate() });

        console.log(`Inserted ${req.query['medicineName']} document`);
       
    } catch (err) {
        console.error('Error inserting medicine', err);
    }

});

app.get('/searchPharmacies', validateReferer, async (req, res) => {
    // Insert Login Code Here

    console.log(req.body)

    // {
    //     // apollo - x
    //     // netmeds -ok
    //     // pharmeasy -x
    //     // healthslool - ok
    //     // tabletshablet - ok
    //     // pulseplus - ok
    //     // medplusmart - ok
    //     // pasumai - ok
    // } for med price change as per location

    // {
    //     // apollo -  x
    //     // netmeds - ok final
    //     // pharmeasy - x 
    //     // healthslool - ok final
    //     // tabletshablet - ok final
    //     // pulseplus - ok  work on it 
    //     // medplusmart - ok final
    //     // pasumai - ok ~ 
    // } for delivery price change as per location


    var linksExistsInDb = false;
    console.log(req.query)
    var nameOfMed = req.query['medname'] + '\n';
    nameOfMed = nameOfMed.replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase();
    console.log(nameOfMed);
    var tempf = [];
    var t = [0, 0, 0, 0, 0, 0];
    var mixUrl;


    try {

        //     const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });    
        //     const database = client.db('MedicompDb');
        //     const collection = database.collection('medicineList');

        // // const result = await collection.findOne({ medicineName: "Crocin 650 Tablet 15" }, { links: 1, _id: 0 });

        //     const result = await collection.findOne({ medicineName: `${nameOfMed}` }, { links: 1 });
        //     linksExistsInDb = !!result.links;


        console.log("Hola! New Medicine Searched - " + nameOfMed);

        // var mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=medicine intitle:(${nameOfMed})&vs=pharmeasy.in+%2C+myupchar.com+%2C+netmeds.com+%2C+medplusmart.com+%2C+tabletshablet.com+%2C+pulseplus.in+%2C+pasumaipharmacy.com+%2C+truemeds.in+%2C+1mg.com`;


        // var arr = [

        //     'netmeds.com', 'pharmeasy.in',
        //     'pasumaipharmacy.com', 'pulseplus.in',
        //     'tabletshablet.com', 'medplusmart.com', 'myupchar.com',
        //     'truemeds.in', '1mg.com', 'onebharatpharmacy.com',
        //     'kauverymeds.com', 'indimedo.com', 'wellnessforever.com',
        //     'secondmedic.com', 'chemistsworld.com', 'callhealth.com',
        // ]

        var arr = [

            'apollopharmacy.in', 'netmeds.com', 'pharmeasy.in',
            'pasumaipharmacy.com',
            // 'pulseplus.in', 
            'medplusmart.com',
            //  'kauverymeds.com',
            // 'chemistbox.in','1mg.com', 
            'myupchar.com',
            // 'chemistsworld.com', 
            '1mg.com', 'expressmed.in'
            // 'onebharatpharmacy.com',
            // 'wellnessforever.com',
            // 'secondmedic.com', 
            // 'callhealth.com',
        ]



        var cont = checkforzero(arr);
        // console.log(arr)

        var tries = 0;
        var cpyOftempf;
        while (cont != 8) {


            tries++;



            mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=buy intitle:(${nameOfMed},${req.query['medicinePackSize']} })&vs=`;
            // mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=intitle:(${nameOfMed})&vs=`;
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] != 0) {
                    mixUrl += arr[i] + "+%2C+";
                }
            }
            console.log("New Url => " + mixUrl)
            // console.log(arr)



            tempf = [...tempf, await fasterIgextractLinkFromOptimizedyahoo(mixUrl, arr, nameOfMed)];
            if (cpyOftempf == tempf || tries >= 7) {
                break;
            } else {
                cont = checkforzero(arr);
                console.log(cont)
                console.log("Try -> " + tries);
                cpyOftempf = tempf;
                tempf = tempf.flat();
            }
        }

        tempf = tempf.flat();
        tempfzz.push(1);



        for (var k = 0; k < tempf.length; k++) {
            if (tempf[k].includes("apollo")) {
                t[0] = tempf[k];
            } else if (tempf[k].includes("netmeds")) {
                t[1] = tempf[k];
            } else if (tempf[k].includes("pharmeasy")) {
                t[2] = tempf[k];
            }
            else if (tempf[k].includes("pasumai")) {
                t[3] = tempf[k];
            }
            else if (tempf[k].includes("medplusmart")) {
                t[4] = tempf[k];
            }
            else if (tempf[k].includes("myupchar")) {
                t[5] = tempf[k];
            } else if (tempf[k].includes("1mg")) {
                t[6] = tempf[k];
            } else if (tempf[k].includes("expressmed")) {
                t[7] = tempf[k];
            }
            //  else if (tempf[k].includes("kauverymeds")) {
            //     t[6] = tempf[k];
            // }
            // else if (tempf[k].includes("chemistbox.in")) {
            //     t[7] = tempf[k];
            // }else if (tempf[k].includes("1mg.com")) {
            //     t[8] = tempf[k];
            // }else if (tempf[k].includes("myupchar")) {
            //     t[9] = tempf[k];
            // }
        }

        t.push(req.query['prodLink']);
        t.push(req.query['medicinePackSize']);
        t.push(req.query['pincode']);
        t.push(req.query['medname'])
        console.log(t);





        console.log("Links Added To Db - " + nameOfMed);





        // try {
        //     await client.close();
        //     console.log('Closed MongoDB connection');
        // } catch (err) {
        //     console.error('Error closing MongoDB connection', err);
        // }


    } catch (err) {
        console.error('Error Fetching Whether links exist or not', err);
    }





    // const urlForApolloNetmedsPharmEasy = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+apollopharmacy.in+netmeds.com+pharmeasy.in)+
    // -1mg.com%2Chealthmug.com%2Cpasumaipharmacy.com%2Cmyupchar.in%2Chealthskoolpharmacy.com%2Ctabletshablet.com%2Cpulseplus.in
    // &vs=apollopharmacy.in+%2C+netmeds.com+%2Cpharmeasy.in&ad=dirN&o=0`;

    // const urlForHealthskoolTabletshabletPulsePlus = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+healthskoolpharmacy+tabletshablet+pulseplus)+
    // &vs=healthskoolpharmacy.com+%2C+tabletshablet.com%2Cpulseplus.in&ad=dirN&o=0`;

    // const urlForMyupcharMedplusMartPasumai = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+pasumaipharmacy+medplusmart+myupchar)+
    // &vs=medplusmart.com%2Cmyupchar.com+%2Cpasumaipharmacy.com&ad=dirN&o=0`;

    // const Finallinks = await axios.all([extractLinkFromOptimizedyahoo(urlForApolloNetmedsPharmEasy, nameOfMed, 'apollo', 'netmeds', 'pharmeasy'),
    // extractLinkFromOptimizedyahoo(urlForHealthskoolTabletshabletPulsePlus, nameOfMed, 'healthskool', 'tabletshablet', 'pulseplus')
    //     , extractLinkFromOptimizedyahoo(urlForMyupcharMedplusMartPasumai, nameOfMed, 'myupchar', 'pasumai', 'medplusmart')])

    tempf.length = 0;
    res.render(__dirname + '/medicineAvail.ejs', { t });

    // await axios.all([extractLinkFromOptimizedyahoo(urlForApolloNetmedsPharmEasy,nameOfMed, 'apollo', 'netmeds', 'pharmeasy'),
    // extractLinkFromOptimizedyahoo(urlForHealthskoolTabletshabletPulsePlus,nameOfMed, 'healthskool', 'tabletshablet', 'pulseplus')
    //     , extractLinkFromOptimizedyahoo(urlForMyupcharHealthmugPasumai,nameOfMed, 'myupchar', 'healthmug', 'pasumai')])
    //     .then(await axios.spread(async (...responses) => {
    //         // console.log(...responses);
    //         const end = performance.now() - start;
    //         console.log(`Execution time: ${end}ms`);

    //         // item.push(responses[0])

    //         console.log(responses[0]);
    //         console.log(responses[1]);
    //         console.log(responses[2]);

    //         // getData(item);
    //     }))


});

app.get('/searchPharmaciesForBackendData', async (req, res) => {
    // Insert Login Code Here

    // {
    //     // apollo - x
    //     // netmeds -ok
    //     // pharmeasy -x
    //     // healthslool - ok
    //     // tabletshablet - ok
    //     // pulseplus - ok
    //     // medplusmart - ok
    //     // pasumai - ok
    // } for med price change as per location

    // {
    //     // apollo -  x
    //     // netmeds - ok final
    //     // pharmeasy - x 
    //     // healthslool - ok final
    //     // tabletshablet - ok final
    //     // pulseplus - ok  work on it 
    //     // medplusmart - ok final
    //     // pasumai - ok ~ 
    // } for delivery price change as per location


    console.log(req.query)
    var nameOfMed = req.query['medname'] + '\n';
    nameOfMed = nameOfMed.replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase();
    console.log(nameOfMed);

    // try {
    //     const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    //     const database = client.db('MedicompDb');
    //     const collection = database.collection('searchPharmas');

    //     // Insert a single document
    //     const result = await collection.insertOne({ medicine: nameOfMed ,DateOfSearch:await getCurrentDate()});

    //     console.log(`Inserted ${nameOfMed} document`);
    // } catch (err) {
    //     console.error('Error inserting medicine', err);
    // }

    var tempf = [];
    var t = [0, 0, 0, 0, 0, 0, 0, 0];
    const presReq = ["No"];


    var tempFinal = [];

    var mixUrl;
    // var mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=medicine intitle:(${nameOfMed})&vs=pharmeasy.in+%2C+myupchar.com+%2C+netmeds.com+%2C+medplusmart.com+%2C+tabletshablet.com+%2C+pulseplus.in+%2C+pasumaipharmacy.com+%2C+truemeds.in+%2C+1mg.com`;


    // var arr = [

    //     'netmeds.com', 'pharmeasy.in',
    //     'pasumaipharmacy.com', 'pulseplus.in',
    //     'tabletshablet.com', 'medplusmart.com', 'myupchar.com',
    //     'truemeds.in', '1mg.com', 'onebharatpharmacy.com',
    //     'kauverymeds.com', 'indimedo.com', 'wellnessforever.com',
    //     'secondmedic.com', 'chemistsworld.com', 'callhealth.com',
    // ]

    var arr = [

        'apollopharmacy.in', 'netmeds.com', 'pharmeasy.in',
        'pasumaipharmacy.com', 'pulseplus.in', 'medplusmart.com',
        'truemeds.in', 'kauverymeds.com', 'expressmed.in'
        //  'myupchar.com',
        // '1mg.com', 
        // 'onebharatpharmacy.com',
        // 'wellnessforever.com',
        // 'secondmedic.com', 'chemistsworld.com', 'callhealth.com',
    ]



    var cont = checkforzero(arr);
    // console.log(arr)

    var tries = 0;
    var cpyOftempf;
    while (cont != 9) {


        tries++;



        mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=buy intitle:(${nameOfMed},${req.query['packSize']})&vs=`;
        // mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=intitle:(${nameOfMed})&vs=`;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] != 0) {
                mixUrl += arr[i] + "+%2C+";
            }
        }
        console.log("New Url => " + mixUrl)
        // console.log(arr)



        tempf = [...tempf, await fasterIgextractLinkFromOptimizedyahoo(mixUrl, arr, nameOfMed)];
        if (cpyOftempf == tempf || tries >= 12) {
            break;
        } else {
            cont = checkforzero(arr);
            console.log(cont)
            console.log("Try -> " + tries);
            cpyOftempf = tempf;
            tempf = tempf.flat();
        }
    }

    tempf = tempf.flat();
    tempfzz.push(1);



    for (var k = 0; k < tempf.length; k++) {
        if (tempf[k].includes("apollo")) {
            t[0] = tempf[k];
        } else if (tempf[k].includes("netmeds")) {
            t[1] = tempf[k];
        } else if (tempf[k].includes("pharmeasy")) {
            t[2] = tempf[k];
        }
        else if (tempf[k].includes("pasumai")) {
            t[3] = tempf[k];
        }
        else if (tempf[k].includes("pulseplus")) {
            t[4] = tempf[k];
        } else if (tempf[k].includes("medplusmart")) {
            t[5] = tempf[k];
        } else if (tempf[k].includes("truemeds")) {
            t[6] = tempf[k];
        } else if (tempf[k].includes("kauverymeds")) {
            t[7] = tempf[k];
        } else if (tempf[k].includes("expressmed")) {
            t[8] = tempf[k];
        }
    }

    t.push(req.query['manufacturer']);
    t.push(nameOfMed)
    console.log(t);



    // const urlForApolloNetmedsPharmEasy = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+apollopharmacy.in+netmeds.com+pharmeasy.in)+
    // -1mg.com%2Chealthmug.com%2Cpasumaipharmacy.com%2Cmyupchar.in%2Chealthskoolpharmacy.com%2Ctabletshablet.com%2Cpulseplus.in
    // &vs=apollopharmacy.in+%2C+netmeds.com+%2Cpharmeasy.in&ad=dirN&o=0`;

    // const urlForHealthskoolTabletshabletPulsePlus = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+healthskoolpharmacy+tabletshablet+pulseplus)+
    // &vs=healthskoolpharmacy.com+%2C+tabletshablet.com%2Cpulseplus.in&ad=dirN&o=0`;

    // const urlForMyupcharMedplusMartPasumai = `https://search.yahoo.com/search?&vl=lang_en&p=inurl:(${nameOfMed}+pasumaipharmacy+medplusmart+myupchar)+
    // &vs=medplusmart.com%2Cmyupchar.com+%2Cpasumaipharmacy.com&ad=dirN&o=0`;

    // const Finallinks = await axios.all([extractLinkFromOptimizedyahoo(urlForApolloNetmedsPharmEasy, nameOfMed, 'apollo', 'netmeds', 'pharmeasy'),
    // extractLinkFromOptimizedyahoo(urlForHealthskoolTabletshabletPulsePlus, nameOfMed, 'healthskool', 'tabletshablet', 'pulseplus')
    //     , extractLinkFromOptimizedyahoo(urlForMyupcharMedplusMartPasumai, nameOfMed, 'myupchar', 'pasumai', 'medplusmart')])




    tempf.length = 0;
    res.send(t);

    // await axios.all([extractLinkFromOptimizedyahoo(urlForApolloNetmedsPharmEasy,nameOfMed, 'apollo', 'netmeds', 'pharmeasy'),
    // extractLinkFromOptimizedyahoo(urlForHealthskoolTabletshabletPulsePlus,nameOfMed, 'healthskool', 'tabletshablet', 'pulseplus')
    //     , extractLinkFromOptimizedyahoo(urlForMyupcharHealthmugPasumai,nameOfMed, 'myupchar', 'healthmug', 'pasumai')])
    //     .then(await axios.spread(async (...responses) => {
    //         // console.log(...responses);
    //         const end = performance.now() - start;
    //         console.log(`Execution time: ${end}ms`);

    //         // item.push(responses[0])

    //         console.log(responses[0]);
    //         console.log(responses[1]);
    //         console.log(responses[2]);

    //         // getData(item);
    //     }))


});



app.get('/getDeliveryPriceOfPharmeasy', async (req, res) => {
    var price = parseFloat(req.query['val'])
    var dc = 0;
    if (price < 300) {
        dc = 199;
    } else if (price >= 300 && parseFloat(price) < 500) {
        dc = 129;
    } else if (price >= 500 && parseFloat(price) < 750) {
        dc = 49;
    } else if (price >= 750 && parseFloat(price) < 1000) {
        dc = 25;
    } else if (price >= 1000 && parseFloat(price) < 1250) {
        dc = 14;
    } else if (price >= 1250) {
        dc = 0;
    }

    res.send((dc).toString());;
})
app.get('/getDeliveryPriceOfNetmeds', async (req, res) => {
    var dc = 0;
    var totalMedPrice = parseFloat(req.query['val'])


    if (totalMedPrice < 199) {
        dc = 69;
    } else if (totalMedPrice >= 199 && totalMedPrice < 499) {
        dc = 49;
    } else if (totalMedPrice >= 499 && totalMedPrice < 999) {
        dc = 29;
    } else if (totalMedPrice > 1000) {
        dc = 0;
    }

    res.send((dc).toString());;
})
app.get('/getDeliveryPriceOfTata1mg', async (req, res) => {
    var price = parseFloat(req.query['val'])
    var dc = 0;
    if (price > 0 && price < 100) {
        dc = 81;
    } else if (price >= 100 && price < 200) {
        dc = 75;
    } else if (price >= 200) {
        dc = 0;
    }
    res.send((dc).toString());;
})
app.get('/getDeliveryPriceOfMedPlusMart', async (req, res) => {
    var price = parseFloat(req.query['val'])
    var dc = 0;
    if (price > 0 && price < 350) {
        dc = 40;
    } else if (price >= 350) {
        dc = 20;
    }
    res.send((dc).toString());;
})
app.get('/getDeliveryPriceOfPasumaiPharmacy', async (req, res) => {
    var price = parseFloat(req.query['val'])
    var dc = 0;

    if (price < 280) {
        dc = 68;
    } else if (price >= 280 && price < 1000) {
        dc = 58;
    } else if (price >= 1000) {
        dc = 8;
    }
    res.send((dc).toString());;
})
app.get('/getDeliveryPriceOfTabletShablet', async (req, res) => {
    var price = parseFloat(req.query['val'])
    var dc = 0;

    if (price < 500) {
        dc = 68.88;
    } else if (price >= 500 && price < 1000) {
        dc = 50.40;
    } else if (price >= 1000) {
        dc = 0;
    }

    res.send((dc).toString());;
})
app.get('/getDeliveryPriceOfMyUpChar', async (req, res) => {
    var price = parseFloat(req.query['val'])
    var dc = 0;

    if (price < 499) {
        dc = 49;
    } else if (price > 500) {
        dc = 0;
    }
    res.send((dc).toString());;
})
app.get('/getDeliveryPriceOfPulsePlus', async (req, res) => {
    var price = parseFloat(req.query['val'])
    var dc = 0;

    if (price < 999) {
        dc = 50;
    } else if (price >= 1000) {
        dc = 15;
    }
    res.send((dc).toString());;
})

app.get('/getDeliveryPriceOfApollo', async (req, res) => {
    var m = parseFloat(req.query['val'])
    var dc = 0;

    if (m < 200) {
        dc = 100;
    } else if (m >= 300 && m < 400) {
        dc = 75;
    } else if (m >= 400 && m < 500) {
        dc = 25;
    } else if (m >= 500) {
        dc = 0;
    }
    res.send((dc).toString());;
})

app.get('/getDeliveryPriceOfTruemeds', async (req, res) => {
    var price = parseFloat(req.query['val'])
    var dc = 0;

    if (price < 500) {
        dc = 50;
    } else if (price >= 500) {
        dc = 0;
    }
    console.log(dc)
    res.send((dc).toString());
})

app.get('/getDeliveryPriceOfKauvery', async (req, res) => {
    var price = parseFloat(req.query['val'])
    var dc = 0;

    dc = 75;
    console.log(dc)
    res.send((dc).toString());
})


app.post('/algoSuggest', async (req, res) => {
    const pharmaFinaldata = JSON.parse(req.body.finalFullData);
    const priceFinal = [];
    var temp = [];

    console.log(pharmaFinaldata[0][0][0])

    for (var i = 0; i < pharmaFinaldata.length; i++) {
        // final.push(pharmaFinaldata[i]['data']);


        pharmaFinaldata[i][0].forEach(async element => {
            temp.push(parseFloat(element['price'] ? element['price'] : 0)); // add accuracy setting right here
        })

        // var a=temp;
        // console.log(a);

        priceFinal.push(temp)

        // console.log(temp)
        temp = [];

    }


    function mergeArrays(arrays) {



        const sumArray = arrays.reduce((acc, val) => {
            if (acc.length === 0) {
                return val;
            }


            for (var i = 0; i < acc.length; i++) {
                if (acc[i] == 0) {
                    val[i] = 0;
                }
            }
            console.log("8**************===> " + acc);

            for (var i = 0; i < val.length; i++) {
                if (val[i] == 0) {
                    acc[i] = 0;
                }
            }
            console.log("84590===> " + val);

            return acc.map((num, index) => num + val[index]);

        }, []);

        console.log(sumArray)


        return sumArray;
    }

    console.log(priceFinal)
    const temppriceFinalData = priceFinal;

    var combChart = {};
    var tempcombiChart = [];
    var final = [];


    var finalPriceComboChart = {};

    function permute(n, r) {
        const a = [];
        const used = [];
        const result = [];

        function generate(depth) {
            if (depth === r) {
                result.push(a.join(''));
                return;
            }

            for (let i = 1; i <= n; i++) {
                if (!used[i] && (depth === 0 || i > a[depth - 1])) {
                    a[depth] = i;
                    used[i] = true;
                    generate(depth + 1);
                    used[i] = false;
                }
            }
        }

        generate(0);
        return result;
    }



    function findSmallest(arr) {
        let smallest = Infinity;
        let smallestIndex = -1;

        for (let i = 0; i < arr.length; i++) {
            if (arr[i] > 0 && arr[i] < smallest) {
                smallest = arr[i];
                smallestIndex = i;
            }
        }

        return smallestIndex;
    }


    for (var i = 1; i <= pharmaFinaldata.length; i++) {
        combChart[i] = (permute(pharmaFinaldata.length, i));
        console.log("9876789  -->>  " + combChart[i])
        tempcombiChart.push(permute(pharmaFinaldata.length, i));
    }



    var cq = [];
    var tempca = [];
    var smallesTotalCombValues = {};

    for (let key in combChart) {
        console.log(`Key: ${key}`);
        for (let inkey in combChart[key]) {
            var temp = combChart[key][inkey].split('');
            console.log("Combination-> " + temp);
            for (var i = 0; i < temp.length; i++) {
                cq.push(priceFinal[parseFloat(temp[i]) - 1])
            }

            tempca = [].concat(mergeArrays(cq));




            // 'apollopharmacy.in','netmeds.com', 'pharmeasy.in',
            // 'pasumaipharmacy.com', 'pulseplus.in', 'medplusmart.com',
            // 'truemeds.in', 'kauverymeds.com',

            for (var k = 0; k < 9; k++) {

                if (k == 0 && tempca[k]) {
                    tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForApollo(tempca[k]))
                } else if (k == 1 && tempca[k]) {
                    tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForNetmeds(tempca[k]))
                } else if (k == 2 && tempca[k]) {
                    tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForPharmeasy(tempca[k]))
                }
                //  else if (k == 3 && tempca[k]) {
                //     tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForHealthskool(tempca[k]))
                // } 
                else if (k == 3 && tempca[k]) {
                    tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForPasumai(tempca[k]))
                } else if (k == 4 && tempca[k]) {
                    tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForPulsePlus(tempca[k]))
                } else if (k == 5 && tempca[k]) {
                    tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForMedPlusMart(tempca[k]))
                } else if (k == 6 && tempca[k]) {
                    tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForTrueMeds(tempca[k]))
                } else if (k == 7 && tempca[k]) {
                    tempca[k] = tempca[k] + parseFloat(getDeliveryChargeForKauveryMeds(tempca[k]))
                }
            }//delivery charges are added
            // getDeliveryChargeForTata1mg
            // getDeliveryChargeForTrueMeds


            console.log("!~! " + tempca);
            console.log("Smallest Value --> " + tempca[findSmallest(tempca)]);
            smallesTotalCombValues[combChart[key][inkey]] = tempca[findSmallest(tempca)];
            smallesTotalCombValues[combChart[key][inkey] + "from"] = findSmallest(tempca);
            // smallesTotalCombValues.push(findSmallest(tempca)+1);
            // console.log("You Should Buy Medicine No--> "+temp+" from Pharmacy Number ->"+findSmallest(tempca));

            tempca = [];
            cq = [];

            console.log('\n');


            // finalPriceComboChart[combChart[key][inkey]]
        }
    }


    console.log(smallesTotalCombValues)//here the main final data of lowest prices 
    tempcombiChart.pop();
    tempcombiChart = [].concat(...tempcombiChart);



    function partitionSet(set) {

        const partitions = [];

        function partitionHelper(remainingSet, currentPartition) {
            if (remainingSet.length === 0) {
                if (currentPartition.length > 0) {
                    partitions.push(currentPartition);
                }
                return;
            }

            const currentElement = remainingSet[0];
            const restOfSet = remainingSet.slice(1);

            // Include current element in a new subset
            partitionHelper(restOfSet, [...currentPartition, [currentElement]]);

            // Include current element in existing subsets
            currentPartition.forEach((subset, index) => {
                partitionHelper(restOfSet, [...currentPartition.slice(0, index), [...subset, currentElement], ...currentPartition.slice(index + 1)]);
            });
        }

        partitionHelper(set, []);
        return partitions.map(partition => partition.map(subset => [subset.join('')]));
    }


    function getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
    }


    console.log("--> " + pharmaFinaldata.length);
    var set = [];
    for (var i = 1; i <= pharmaFinaldata.length; i++) {
        set.push(i)
    }
    console.log("Set - " + set)
    const partitions = partitionSet(set);
    console.log("=====>> >> " + typeof (partitions));
    console.log("=====>> paritions " + partitions);

    var tempLowestValue = set.toString().replace(/,/g, ' ');
    var newtemparea = [];

    tempLowestValue = smallesTotalCombValues[tempLowestValue];

    console.log(set.toString().replace(/,/g, ''))
    var vvtmp = 0;
    for (var i = 0; i < partitions.length; i++) {
        for (var j = 0; j < partitions[i].length; j++) {
            // console.log(j+" "+smallesTotalCombValues[partitions[i][j]])
            vvtmp += smallesTotalCombValues[partitions[i][j]];
        }
        if (vvtmp < tempLowestValue) {
            newtemparea.length = 0;
            tempLowestValue = vvtmp;
            console.log("k---" + partitions[i])
            newtemparea.push(partitions[i].flat());
        }
        vvtmp = 0;
    }


    var x;
    console.log(newtemparea + " + " + tempLowestValue)

    var mnames = [];

    console.log(typeof (newtemparea))
    console.log(newtemparea.flat())
    newtemparea = newtemparea.flat();


    if (newtemparea.length > 1) {
        x = newtemparea;
        for (var i = 0; i < x.length; i++) {
            // 'apollopharmacy.in','netmeds.com', 'pharmeasy.in',
            // 'pasumaipharmacy.com', 'pulseplus.in', 'medplusmart.com',
            // 'truemeds.in', 'kauverymeds.com',
            var pname;
            if (smallesTotalCombValues[x[i] + "from"] == '0') {
                pname = "Apollo";
            } else if (smallesTotalCombValues[x[i] + "from"] == '1') {
                pname = "Netmeds";
            } else if (smallesTotalCombValues[x[i] + "from"] == '2') {
                pname = "Pharmeasy";
            } else if (smallesTotalCombValues[x[i] + "from"] == '3') {
                pname = "PasumaiPharmacy";
            } else if (smallesTotalCombValues[x[i] + "from"] == '4') {
                pname = "PulsePlus";
            } else if (smallesTotalCombValues[x[i] + "from"] == '5') {
                pname = "MedplusMart";
            } else if (smallesTotalCombValues[x[i] + "from"] == '6') {
                pname = "TrueMeds";
            } else if (smallesTotalCombValues[x[i] + "from"] == '7') {
                pname = "Kauverymeds";
            }
            mnames.push("BUY " + "Medicine num" + `${x[i]} From ` + `${pname}`)
        }
    } else {
        var pname;
        if (smallesTotalCombValues[newtemparea + "from"] == '0') {
            pname = "Apollo";
        } else if (smallesTotalCombValues[newtemparea + "from"] == '1') {
            pname = "Netmeds";
        } else if (smallesTotalCombValues[newtemparea + "from"] == '2') {
            pname = "Pharmeasy";
        } else if (smallesTotalCombValues[newtemparea + "from"] == '3') {
            pname = "PasumaiPharmacy";
        } else if (smallesTotalCombValues[newtemparea + "from"] == '4') {
            pname = "PulsePlus";
        } else if (smallesTotalCombValues[newtemparea + "from"] == '5') {
            pname = "MedplusMart";
        } else if (smallesTotalCombValues[newtemparea + "from"] == '6') {
            pname = "TrueMeds";
        } else if (smallesTotalCombValues[newtemparea + "from"] == '7') {
            pname = "Kauverymeds";
        }
        mnames.push("BUY " + "Medicine num" + `${newtemparea} From ` + `${pname}`)


    }





    var tempSum = [];
    var i = 0;
    var j = tempcombiChart.length - 1;

    while (i < j) {
        // console.log(arr[i], arr[j]);
        tempSum.push(parseFloat(smallesTotalCombValues[tempcombiChart[i]]) + parseFloat(smallesTotalCombValues[tempcombiChart[j]]))
        i++;
        j--;
    }

    if (i === j) {
        console.log(tempcombiChart[i]);
    }

    var a = tempcombiChart[findSmallest(tempSum)];
    var b = tempcombiChart[tempcombiChart.length - findSmallest(tempSum) - 1];

    a = a + "from";
    b = b + "from";

    final.push({
        combiString: {
            // bestPossSol:
            //     a + " " + (parseFloat(smallesTotalCombValues[a])) + " & " + b + " " + (parseFloat(smallesTotalCombValues[b]))
            //     + " = " + (parseFloat(smallesTotalCombValues[tempcombiChart[findSmallest(tempSum)]]) + parseFloat(smallesTotalCombValues[tempcombiChart[tempcombiChart.length - findSmallest(tempSum) - 1]])),
            medNames: mnames,
        }
    });

    // console.log(final.medNames)
    res.send(final);

})


app.post('/multiSearch', async (req, res) => {

    const linkdata = [];
    const startF = performance.now();
    const mnames = [];
    const manunames = [];
    console.log(typeof (req.body.multiItems));
    console.log(req.body.multiItems);

    if (typeof (req.body.multiItems) == 'object') {

        for (mednames in req.body.multiItems) {

            var medName = req.body.multiItems[mednames].split('~')[0].trim().replace(/[^a-zA-Z0-9 %+|]/g, ' ');
            var manuName = req.body.multiItems[mednames].split('~')[1].trim().replace(/[^a-zA-Z0-9 %+|]/g, ' ');
            // var medicineN=medName.replace(/[^a-zA-Z0-9 %+|]/g, '')
            linkdata.push(`http://localhost:4000/searchPharmaciesForBackendData?medname=${medName}&manufacturer=${manuName}&packSize=${req.body['packSize']}`)
            mnames.push(medName)
            manunames.push(manuName)
        }
    } else {
        console.log(typeof (req.body.multiItems))
        var medName = req.body.multiItems[mednames].split('~')[0].trim().replace(/[^a-zA-Z0-9 %+|]/g, ' ');
        var manuName = req.body.multiItems[mednames].split('~')[1].trim().replace(/[^a-zA-Z0-9 %+|]/g, ' ');

        // var nameOfMed = req.body.multiItems.trim().replace(/[^a-zA-Z0-9 %+|]/g, ' ');
        // console.log(nameOfMed);
        linkdata.push(`http://localhost:4000/searchPharmaciesForBackendData?medname=${medName}&manufacturer=${manuName}&packSize=${req.body['packSize']}`);
        mnames.push(medName)
        manunames.push(manuName)
    }


    console.log("length - > " + mnames.length)


    const responses = await axiosParallel(linkdata);
    // var responses =  linkdata.map(async item =>  {
    //     return await axios.all(item);
    //   });


    console.log("7654567  -> " + responses.length);




    var finalMultiPriceData = [];
    for (var i = 0; i < responses.length; i++) {
        finalMultiPriceData.push(`http://localhost:4000/FastGetPharmaDataFromLinks?pharmalinks=${responses[i]['data']}&medname=${mnames[i]}&manufacturer=${manunames[i]}`);
    }

    // console.log(finalMultiPriceData)


    // console.log(finalMultiPriceData)
    const pharmaFinaldata = await axiosParallel(finalMultiPriceData);

    // console.log(pharmaFinaldata[0])



    //     responses[i]['data']=[].concat(responses[i]['data'][0],responses[i]['data'][1],responses[i]['data'][2]);
    //     console.log(responses[i]['data'])

    //     finalMultiPriceData.push( await Promise.all([extractDataOfApollo(responses[i]['data'][0]), extractDataOfNetMeds( responses[i]['data'][1]),extractDataOfPharmEasy( responses[i]['data'][2]),
    //     extractDataOfHealthskoolpharmacy( responses[i]['data'][3]), extractDataOfOBP( responses[i]['data'][4]),extractDataOfmedplusMart( responses[i]['data'][5]),
    //     extractDataOfMyUpChar( responses[i]['data'][6]), extractDataOfHealthmug( responses[i]['data'][7], final, presReq), extractDataOfPP( responses[i]['data'][8])]))




    const end1 = performance.now() - startF;
    // const responses = await Promise.all(FinalDataFunc);

    console.log("----------")


    const final = [];
    for (var i = 0; i < pharmaFinaldata.length; i++) {
        final.push(pharmaFinaldata[i]['data']);
    }

    console.log(final)



    console.log(`Execution time for final price scraping: ${end1}ms`);
    // res.render(__dirname + '/temptour', { final: final });
    res.render(__dirname + '/resultsv4Multi.ejs', { final: final });





});


app.post('/compareViaBlog', async (req, res) => {
    // Insert Login Code Here



    const nameOfMed = req.body.medname;
    var item = req.body.urls;
    item = item.split(',');
    console.log(item)
    const final = [];



    const manufacturerN = await extractManufacNameFromPharmeasy(item[1]);
    console.log(manufacturerN)


    const start1 = performance.now();
    // const LinkDataResponses = await axiosParallel(item);

    const responses = await Promise.all([extractDataOfNetMeds(item[0], nameOfMed, manufacturerN), extractDataOfPharmEasy(item[1], nameOfMed, manufacturerN),
    extractDataOfPP(item[2], nameOfMed, manufacturerN),
    extractDataOfmedplusMart(item[3], nameOfMed, manufacturerN),
    extractDataOfOBP(item[4], nameOfMed, manufacturerN),
    extractDataOfOgMPM(item[5], nameOfMed, manufacturerN), extractDataOfTruemeds(item[6], nameOfMed, manufacturerN),
        // extractDataOfMyUpChar(item[4], nameOfMed,manufacturerN),
        //   extractSubsfApollo(item[8],final),
    ]);

    const end1 = performance.now() - start1;
    console.log(`Execution time for pharmas: ${end1}ms`);
    // const responses = await Promise.all(FinalDataFunc);

    console.log(responses)
    for (var i = 0; i < 7; i++) {
        if (responses[i].name != "NA" && responses[i].price) {
            final.push(responses[i]);
        }
    }

    // final.push(responses[0])
    // final.push(responses[1])
    // final.push(responses[2])
    // final.push(responses[3])
    // final.push(responses[4])
    // final.push(responses[5])
    // final.push(responses[6])
    // final.push(responses[7])
    // final.push(responses[8])
    // final.push(responses[9])


    // final.sort((a, b) => a.finalCharge - b.finalCharge); // b - a for reverse sort
    final.push(nameOfMed)
    console.log(final)

    console.log('Found Everything Sir!..')
    try {

        console.log(final[0].finalCharge)
        console.log(final.length)
        if (final[0].finalCharge > 0 && final.length > 2) {
            res.render(__dirname + '/resultsv4.ejs', { final });
        } else {
            res.sendFile(__dirname + '/noResultsFound.html');
        }

    } catch (error) {
        console.error(error);
        res.sendFile(__dirname + '/noResultsFound.html');
    }
    //   res.render(__dirname + '/temptour.ejs', { final: final });



});


app.get('/compareUsingPromiseAll', async (req, res) => {
    // Insert Login Code Here


    // Insert Login Code Here



    const nameOfMed = req.query['medname'] + '\n';

    const presReq = ["No"];

    const urlForPharmEasy = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+pharmeasy.in) &vs=pharmeasy.in`;  //*//
    const urlForNetMeds = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+netmeds.com) &vs=netmeds.com`;
    const urlForApollo = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+apollopharmacy.in) &vs=apollopharmacy.in`;
    const urlForHealthsKool = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+healthskoolpharmacy.com) &vs=healthskoolpharmacy.com`;
    const urlForKauverymeds = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+kauvery.com) &vs=kauverymeds.com`;

    // const urlForHealthmug = `https://www.healthmug.com/search?keywords=${nameOfMed}`;
    const urlForTata = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+1mg.com) &vs=1mg.com`;
    const urlForOBP = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+tabletshablet.com) &vs=tabletshablet.com`;
    const urlForPulsePlus = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+pulseplus.in) &vs=pulseplus.in`;
    const urlForMyUpChar = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+myupchar.com) &vs=myupchar.com`;
    // const urlFor3Meds = `https://in.search.yahoo.com/search=?p=3meds.com+${nameOfMed}`
    const urlForHealthmug = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+healthmug.com) &vs=healthmug.com`;
    const urlForPP = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+pasumaipharmacy.com) &vs=pasumaipharmacy.com`;
    const urlForFH = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+healthplus.flipkart.com) &vs=healthplus.flipkart.com`;

    const urlForTorus = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+health.torusdigital.in) &vs=health.torusdigital.in`;
    const urlForTruemeds = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+truemeds.in) &vs=truemeds.in`;
    const urlForMedPlusMart = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+medplusmart.com) &vs=medplusmart.com`;
    const
        final = [];


    const item = await Promise.all([
        extractLinkFromyahoo(urlForApollo), extractLinkFromyahoo(urlForNetMeds), extractLinkFromyahoo(urlForPharmEasy),
        extractLinkFromyahoo(urlForPP), extractLinkFromyahoo(urlForMedPlusMart), extractLinkFromyahoo(urlForKauverymeds)])

    res.send(item);
});



app.get('/compare', async (req, res) => {
    // Insert Login Code Here


    // Insert Login Code Here



    const nameOfMed = req.query['medname'] + '\n';

    const presReq = ["No"];

    // const nameOfMed = req.body.foodItem + '\n';
    // console.log(req.body.foodItem);
    // console.log('Name')
    // try {
    //     let date_ob = new Date();

    //     // current date
    //     // adjust 0 before single digit date
    //     const date = ("0" + date_ob.getDate()).slice(-2);

    //     // current month
    //     const month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    //     // current year
    //     const year = date_ob.getFullYear();
    //     const finalDate = date + '/' + month + '/' + year;

    //     const auth = new google.auth.GoogleAuth({
    //         scopes: "https://www.googleapis.com/auth/spreadsheets",
    //     })
    //     const spreadsheetId = "18AFfkHKArlpCqDuBC6yzfXOkTgOzRGmXeq88uhqQqGo";
    //     const client = await auth.getClient();
    //     const googleSheets = google.sheets({ version: "v4", auth: client });

    //     googleSheets.spreadsheets.values.append({
    //             auth,
    //             spreadsheetId,
    //             range: "Sheet1!A:B",
    //             valueInputOption: "USER_ENTERED",
    //             resource: {
    //                 values: [
    //                     [finalDate, nameOfMed]
    //                 ]
    //             },
    //         })
    //         // console.log(metadata);
    // } catch (error) {
    //     console.log({});
    // }



    // fs.appendFile("data.txt", nameOfMed, function(err) {
    //     if (err) {
    //         return console.log(err);
    //     }
    //     console.log("The file was saved!");
    // });
    // https://www.ask.com/web?q=site:apollopharmacy.in%20crocin%20advance+&ad=dirN&o=0

    // const urlForPharmEasy = `https://search.yahoo.com/search;_ylt=?p=site:pharmeasy.in+${nameOfMed} medicine`;  //*//
    // const urlForNetMeds = `https://search.yahoo.com/search;_ylt=?p=site:netmeds.com+${nameOfMed} medicine`;
    // const urlForApollo = `https://search.yahoo.com/search;_ylt=?p=site:apollopharmacy.in+${nameOfMed} medicine`;
    // const urlForHealthsKool = `https://search.yahoo.com/search;_ylt=?p=site:healthskoolpharmacy.com+${nameOfMed} medicine`;
    // // const urlForHealthmug = `https://www.healthmug.com/search?keywords=${nameOfMed}`;
    // const urlForTata = `https://search.yahoo.com/search;_ylt=?p=site:1mg.com+${nameOfMed} medicine`;
    // const urlForOBP = `https://search.yahoo.com/search;_ylt=?p=site:tabletshablet.com+${nameOfMed} medicine`;
    // const urlForPulsePlus = `https://search.yahoo.com/search;_ylt=?p=site:pulseplus.in+${nameOfMed} medicine`;
    // const urlForMyUpChar = `https://search.yahoo.com/search;_ylt=?p=site:myupchar.com+${nameOfMed} medicine`;
    // // const urlFor3Meds = `https://search.yahoo.com/search;_ylt=?p=site:3meds.com+${nameOfMed}`
    // const urlForHealthmug = `https://search.yahoo.com/search;_ylt=?p=site:healthmug.com+${nameOfMed} medicine`;
    // const urlForPP = `https://search.yahoo.com/search;_ylt=?p=site:pasumaipharmacy.com+${nameOfMed} medicine`;
    // const urlForFH = `https://search.yahoo.com/search;_ylt=?p=site:healthplus.flipkart.com+${nameOfMed} medicine`;

    const urlForPharmEasy = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+pharmeasy.in) &vs=pharmeasy.in`;  //*//
    const urlForNetMeds = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+netmeds.com) &vs=netmeds.com`;
    const urlForApollo = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+apollopharmacy.in) &vs=apollopharmacy.in`;
    const urlForHealthsKool = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+healthskoolpharmacy.com) &vs=healthskoolpharmacy.com`;
    // const urlForHealthmug = `https://www.healthmug.com/search?keywords=${nameOfMed}`;
    const urlForTata = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+1mg.com) &vs=1mg.com`;
    const urlForOBP = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+tabletshablet.com) &vs=tabletshablet.com`;
    const urlForPulsePlus = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+pulseplus.in) &vs=pulseplus.in`;
    const urlForMyUpChar = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+myupchar.com) &vs=myupchar.com`;
    // const urlFor3Meds = `https://in.search.yahoo.com/search=?p=3meds.com+${nameOfMed}`
    const urlForHealthmug = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+healthmug.com) &vs=healthmug.com`;
    const urlForPP = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+pasumaipharmacy.com) &vs=pasumaipharmacy.com`;
    const urlForFH = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+healthplus.flipkart.com) &vs=healthplus.flipkart.com`;

    const urlForTorus = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+health.torusdigital.in) &vs=health.torusdigital.in`;
    const urlForTruemeds = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+truemeds.in) &vs=truemeds.in`;
    const urlForMedPlusMart = `https://search.yahoo.com/search?p=inurl:(${nameOfMed}+medplusmart.com) &vs=medplusmart.com`;
    const
        final = [];
    // getLinks = async() => {
    //     for (const item of items) {
    //         // await fetchItem(item)
    //         // if (t != '') {
    //         if (item.includes('netmeds')) {
    //             final.push(
    //                     await extractLinkFromyahoo(item)
    //                 ) // final.push(await extractDataOfNetMeds(t));
    //         } else if (item.includes('1mg')) {

    //             final.push(
    //                 await extractLinkFromyahoo(item)
    //             )


    //             // final.push(await extractDataOfTata(t));
    //         } else if (item.includes('myupchar')) {
    //             final.push(
    //                 await extractLinkFromyahoo(item)
    //             )

    //             console.log(urlForMyUpChar);

    //             // final.push(await extractDataOfmedplusMart(t));
    //         } else if (item.includes('pharmeasy')) {
    //             // console.log('yes in it');
    //             final.push(

    //                 await extractLinkFromyahoo(item)
    //             )

    //             // console.log(urlForMyUpChar);

    //             // final.push(await extractDataOfmedplusMart(t));
    //         } else if (item.includes('pulseplus')) {
    //             // console.log('yes in it');
    //             final.push(
    //                 await extractLinkFromyahoo(item)
    //             )

    //             // console.log(urlForMyUpChar);

    //             // final.push(await extractDataOfmedplusMart(t));
    //         } else if (item.includes('tabletshablet')) {
    //             // console.log('yes in it');
    //             final.push(
    //                 await extractLinkFromyahoo(item)
    //             )

    //             // console.log(urlForMyUpChar);

    //             // final.push(await extractDataOfmedplusMart(t));
    //         }

    //         // if(a!=1){
    //         //     final.push(extractLinkFromGoogle('https://www.google.com/search?q=site:pharmeasy/com'))
    //         // }
    //         // } // linkNames.push(t);
    //     }
    // }
    // await getLinks();
    // console.log(final);
    extractSubsfApollo = async (url, final) => {
        try {
            // Fetching HTML
            // url = url.split('?')[0];
            // url="https://apollopharmacy.in"+url;
            // console.log('got it->' + url);
            // const { data } = await axios.get(url)
            const NameOfSubs = [];
            const PriceOfSubs = [];
            const ImgLinkOfSubs = [];
            // Using cheerio to extract <a> tags
            const { data } = await axios.get(url)
            const $ = cheerio.load(data);

            var a = JSON.parse($('#__NEXT_DATA__').text());
            var fa = a.props.pageProps.productDetails.productSubstitutes.products;


            if (fa.length > 0) {
                for (var i = 0; i < fa.length; i++) {
                    final.push({
                        subsname: fa[i]['name'],
                        subsprice: fa[i]['price'],
                        subsImgLink: fa[i]['image'],
                        subsProdLink: "https://www.apollopharmacy.in" + fa[i]['redirect_url'],
                        price: 0,
                    })
                }

            }

        } catch (error) {
            // res.sendFile(__dirname + '/try.html');
            // res.sendFile(__dirname + '/error.html');
            console.log(error);
            return error;
        }
    };

    const start = performance.now();
    const item = await Promise.all([extractLinkFromyahoo(urlForNetMeds), extractLinkFromyahoo(urlForPharmEasy), extractLinkFromyahoo(urlForOBP),
    extractLinkFromyahoo(urlForPulsePlus), extractLinkFromyahoo(urlForMyUpChar),
    extractLinkFromyahoo(urlForPP), extractLinkFromyahoo(urlForTruemeds),
    extractLinkFromyahoo(urlForMedPlusMart)])

    const manufacturerN = await extractManufacNameFromPharmeasy(item[1]);
    console.log(manufacturerN)

    const end = performance.now() - start;
    console.log(`Execution time for yahoo: ${end}ms`);

    const start1 = performance.now();
    // const LinkDataResponses = await axiosParallel(item);

    const responses = await Promise.all([extractDataOfNetMeds(item[0], nameOfMed, manufacturerN), extractDataOfPharmEasy(item[1], nameOfMed, manufacturerN),
    extractDataOfOBP(item[2], nameOfMed, manufacturerN),
    extractDataOfmedplusMart(item[3], nameOfMed, manufacturerN), extractDataOfMyUpChar(item[4], nameOfMed, manufacturerN),
    extractDataOfPP(item[5], nameOfMed, manufacturerN),
    //   extractSubsfApollo(item[8],final),
    extractDataOfTruemeds(item[6], nameOfMed, manufacturerN), extractDataOfOgMPM(item[7], nameOfMed, manufacturerN),
    extractDataOfMedkart(nameOfMed, manufacturerN),
    ]);

    const end1 = performance.now() - start1;
    console.log(`Execution time for pharmas: ${end1}ms`);
    // const responses = await Promise.all(FinalDataFunc);

    console.log(responses)
    for (var i = 0; i < 9; i++) {
        if (responses[i].name != "NA" && responses[i].price) {
            final.push(responses[i]);
        }
    }

    // final.push(responses[0])
    // final.push(responses[1])
    // final.push(responses[2])
    // final.push(responses[3])
    // final.push(responses[4])
    // final.push(responses[5])
    // final.push(responses[6])
    // final.push(responses[7])
    // final.push(responses[8])
    // final.push(responses[9])


    // final.sort((a, b) => a.finalCharge - b.finalCharge); // b - a for reverse sort
    final.push(nameOfMed)
    console.log(final)

    //   if (presReq[0] == "Yes") {
    //       final.push(presReq);
    //   }
    //   final.push(item[7])
    //   final.push(nameOfMed)
    //   console.log(final)

    console.log('Found Everything Sir!..')

    // const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // var dateOfSearch=new Date().getDay();
    // dateOfSearch=days[dateOfSearch];


    // const MedQuery="INSERT INTO MedicineSearchDetails (SearchTime,MedicineName) VALUES ?";
    // var values=[
    //     [`${dateOfSearch}`,`${nameOfMed}`]
    // ]
    // connection.query(MedQuery,[values],function(err,results){
    //   if(err) throw err;
    //   console.log("Records Inserted for "+nameOfMed);
    // })




    try {

        console.log(final[0].finalCharge)
        console.log(final.length)
        if (final[0].finalCharge > 0 && final.length > 2) {
            res.render(__dirname + '/resultsv4.ejs', { final });
        } else {
            res.sendFile(__dirname + '/noResultsFound.html');
        }

    } catch (error) {
        console.error(error);
        res.sendFile(__dirname + '/noResultsFound.html');
    }
    //   res.render(__dirname + '/temptour.ejs', { final: final });



});

function getCurrentDate() {
    const today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth() + 1; // January is 0!
    const yyyy = today.getFullYear();

    if (dd < 10) {
        dd = '0' + dd;
    }

    if (mm < 10) {
        mm = '0' + mm;
    }

    return dd + '/' + mm + '/' + yyyy;
}

app.post('/redirectFromMedicomp', async (req, res) => {
    console.log(req.body.MedicineName)

    try {
        const database = client.db('MedicompDb');
        const collection = database.collection('RedirectsFromMedicomp');


        // Insert a single document
        const result = await collection.insertOne({ PharmacyName: req.body.pharmaName, MedicineName: req.body.MedicineName, DateOfRedirect: getCurrentDate() });

        console.log(`Inserted ${req.body.pharmaName} document`);
        
        res.redirect(req.body.pharmaLink)
    } catch (err) {
        console.error('Error inserting medicine', err);
    }


});


app.get('/storeComparisonData', async (req, res) => {
    console.log(req.query['medicineName'])
    try {
        const database = client.db('MedicompDb');
        const collection = database.collection('finalResultPageMedicomp');



        // Insert a single document
        const result = await collection.insertOne({ medicine: req.query['medicineName'], Pincode: req.query['pincode'], DateOfComparison: await getCurrentDate() });

        console.log(`Inserted ${req.query['medicineName']} document`);
       
    } catch (err) {
        console.error('Error inserting medicine', err);
    }

});


app.get('/medicineName', async (req, res) => {
    console.log((req.query['q']))

const db = client.db("MedicompDb");
    const collection = db.collection("biggerDOM");
    


    try {

        // const records = await collection.find({
        //     medicineName: { $regex: `^${req.query['q']}`, $options: 'i' }
        // }).limit(5).toArray();

        var query = [
            {
                $search: {
                    index: "searchFromBiggerDOM",
                    compound: {
                        should: [
                            {
                                regex: {
                                    query: req.query['q'].replace(/&/g, '\\&'), // Escaping '&' for regex
                                    path: "medicineName",
                                    allowAnalyzedField: true
                                }
                            },
                            {
                                autocomplete: {
                                    query: req.query['q'],
                                    path: "medicineName",
                                }
                            },
                            {
                                autocomplete: {
                                    query: req.query['q'],
                                    path: "packSize",
                                }
                            },

                        ]
                    }
                }
            },
            { $limit: 5 }
        ];


        // Execute the query
        var records = await collection.aggregate(query).toArray();

        if (records.length > 0) {
            console.log("Found the following records:");
            // console.log(records);
        } else {
            console.log("Not Found")
            query = [
                {
                    $search: {
                        index: "searchFromBiggerDOM",
                        compound: {
                            should: [
                                {
                                    regex: {
                                        query: req.query['q'].replace(/&/g, '\\&'), // Escaping '&' for regex
                                        path: "medicineName",
                                        allowAnalyzedField: true
                                    }
                                },
                                {
                                    autocomplete: {
                                        query: req.query['q'],
                                        path: "medicineName",
                                        fuzzy: {
                                            maxEdits: 2, // Adjust based on your fuzzy search needs
                                            prefixLength: 1
                                        }
                                    }
                                },
                                {
                                    autocomplete: {
                                        query: req.query['q'],
                                        path: "packSize",
                                        fuzzy: {
                                            maxEdits: 2, // Adjust based on your fuzzy search needs
                                            prefixLength: 1
                                        }
                                    }
                                },

                            ]
                        }
                    }
                },
                { $limit: 5 }
            ];


            // Execute the query
            records = await collection.aggregate(query).toArray();
        }

        console.log(records)
      
        res.send(records)

    } catch (err) {
        console.error('Error inserting medicine', err);
    }








});

// function getSecondaryAnchorValueFromString(nameOfMed){

//     var nameOfMed= nameOfMed.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
//     var wordsToRemove = [
//         "tablet", "suspension", "syrup", "injection", "strip", "gel", "capsule", "cream", 
//         "drop", "lotion", "ointment", "liquid", "cap", "powder", "sachet", "infusion", 
//         "soap", "paste", "moisturizer", "facewash", "solution", "spray", "inj", "shampoo", 
//         "serum", "syringe", "tube", "face wash", "mouth wash", "granules","face","wash",
//         "of","and","the", "pills", "tablet pack", "supplement", "inhaler", "patch",
//         "bandage", "syrup pack", "gel pack", "drip", "vial", "ampoule", "lozenge", 
//         "chewable", "spritzer", "gargle", "dressing", "lotion pack", "spray bottle", "disinfectant",
//         "balm" ,"kit" , "vaccine","lancet","lancets","needle","thermometer","oximeter","pads","pad","wipes",
//         "tonic","dilution","inhaler","oil","sanitizer","lozenges","juice","roll","bar","drink","glove",

//     ];


//     var regex = new RegExp(`\\b(${wordsToRemove.join('|')})\\b`, 'gi');

//     // Remove the words from the string
//     var cleanedNameOfMed = nameOfMed.replace(regex, '').trim();

//     var splitArray = cleanedNameOfMed.split(' ');

//     // Convert numbers to integers and keep strings as strings
//     var secondaryAnchor = splitArray.map(item => {
//         var number = parseInt(item, 10);
//         return isNaN(number) ? item : number;
//     });

//     if(typeof(secondaryAnchor[1])=='string' && secondaryAnchor[1]!=''&& secondaryAnchor[1]!=' '){
//         console.log(typeof(secondaryAnchor));
//             console.log("secondaryAnchor = "+ secondaryAnchor[1])
//             secondaryAnchor=secondaryAnchor[1];
//         }else{
//             console.log("secondaryAnchor = "+ "@")    
//             secondaryAnchor='@';
//         }

//     return secondaryAnchor;
//   }

function getSecondaryAnchorValueFromString(nameOfMed) {
    // Clean up special characters and excess whitespace

    console.log("Befores name: ", nameOfMed);
    var nameOfMed = nameOfMed.replace(/[^a-zA-Z0-9 -]/g, ' ').replace(/\s+/g, ' ').trim();
    console.log("Cleaned name: ", nameOfMed);

    var lastNumberMatch = nameOfMed.match(/\b\d+\b(?!.*\b\d+\b)/) || -1; // Find the last standalone number
    
    if (lastNumberMatch) {
        var lastNumber = lastNumberMatch[0]; // Get the matched text (e.g., "14")
        var lastNumberIndex = nameOfMed.lastIndexOf(lastNumber); // Find the position of this last number in the string
        var substringBeforeLastNumber = nameOfMed.substring(0, lastNumberIndex).trim(); // Get the substring before the last number
    } else {
        var substringBeforeLastNumber = nameOfMed; // If no number is found, return the original string
    }

    // If a number is found, get the substring before the last number
    var substringBeforeLastNumber = lastNumberIndex !== -1 ? nameOfMed.substring(0, lastNumberIndex.index).trim() : nameOfMed;

    console.log("Substring before the last number: ", substringBeforeLastNumber);

    nameOfMed = substringBeforeLastNumber;

    // List of words to remove
    var wordsToRemove = [
        "spray bottle", "disinfectant", "moisturizer", "tablet pack", "lotion pack", "thermometer", "suppository", "dispersible", 
        "transdermal", "nasal spray", "suspension", "mouth wash", "supplement", "syrup pack", "oral drops", "injection", "face wash",
        "sanitizer", "eye drops", "ear drops", "ointment", "infusion", "facewash", "solution", "granules", "gel pack", "chewable",
        "spritzer", "dressing", "oximeter", "dilution", "lozenges", "emulsion", "liniment", "tablets", "capsule", "shampoo", "syringe",
        "inhaler", "bandage", "ampoule", "lozenge", "vaccine", "lancets", "regular", "softgel", "topical", "lotion", "liquid", "powder",
        "sachet", "gargle", "lancet", "needle", "mcg/ml", "mcg/kg", "tablet", "sachet", "bottle", "packet", "powder", "elixir", "dragee",
        "gargle", "liquid", "mousse", "troche", "syrup", "strips", "cream", "paste", "spray", "serum", "pills", "patch", "wipes", "tonic",
        "juice", "drink", "glove", "units", "mg/ml", "mg/kg", "drops", "patch", "spray", "strip", "bolus", "wafer",
        "drop", "soap", "tube", "face", "wash", "drip", "vial", "balm", "pads", "roll", "g/ml", "vial", "puff", "foam", "gel",
        "cap", "for","inj", "and", "the", "kit", "pad", "oil", "bar", "mcg", "mcl", "meq", "jar", "tab", "of", "mg", "gm", "kg", "ml",
        "oz", "lb", "iu", "cc", "mm", "g", "l"
    ];
    

    

    // Create regex for words to remove
    const regex = new RegExp(`\\b(${wordsToRemove.join('|')})\\b`, 'gi');

    // Remove unwanted words
    let cleanedNameOfMed = nameOfMed.replace(regex, '').trim().replace(/\s+/g, ' ').trim();
    console.log("After removing unnecessary words: ", cleanedNameOfMed);


    const finalWords = cleanedNameOfMed.split(' ').map(word => {
        // Extract numbers from the word
        const numberMatches = word.match(/\d+/g);

        // If the word contains numbers, check against wordsToRemove
        if (numberMatches) {
            // Remove any unwanted substrings from the word
            wordsToRemove.forEach(removeWord => {
                if (word.includes(removeWord)) {
                    word = word.replace(removeWord, ''); // Remove the unwanted word
                }
            });
        }

        return word.trim(); // Trim and return the modified word
    }).filter(Boolean); // Remove empty strings

    // Step 3: Join the final words
    let outputString = finalWords.join(' ').replace(/\s+/g, ' ').trim(); // Final output as a single string

    // Step 4: Remove individual numbers from the output string
    outputString = outputString.replace(/\b\d+\b/g, '').replace(/\s+/g, ' ').trim(); // Remove standalone numbers




    // Split the string into individual words
    const splitArray = outputString.split(' '); // Filter to remove empty entries
    console.log("Split Array: ", splitArray);

    // Fetch the second word or combination
    var secondaryAnchor = '';
    if (splitArray.length > 1) {
        secondaryAnchor = splitArray[1]; // Get the second word
        // console.log("Initial Secondary Anchor: ", secondaryAnchor);

        var additionalAnchors;
        // Check for hyphens and split if necessary
        try {
            additionalAnchors = secondaryAnchor.split('-');
        } catch (error) {
            additionalAnchors = [secondaryAnchor];
        }
        console.log("Final Secondary Anchors: ", additionalAnchors);
        return additionalAnchors; // Return as an array
    } else {
        console.log("No valid secondary anchor found.");
        return '@';  // Default value when no valid secondary anchor is found
    }
}


function privGetSecondaryAnchorValueFromString(nameOfMed) {
    // Clean up special characters and excess whitespace
    const standaloneNumbers = nameOfMed.match(/(?<!\S)\d+(?!\S)/g) || []; // Matches standalone numbers only

    // Remove standalone numbers and non-alphabetic/non-numeric characters
    var cleanedNameOfMed = nameOfMed
        .replace(/(?<!\S)\d+(?!\S)/g, ' ')  // Remove standalone numbers
        .replace(/[^A-Za-z0-9\s]/g, ' ')   // Remove non-alphabetic and non-numeric characters
        .trim();                           // Trim excess whitespace

    // Combine cleaned name with standalone numbers
    nameOfMed = `${cleanedNameOfMed} ${standaloneNumbers.join(' ')}`.trim(); // Join cleaned string with standalone numbers


    console.log("Befores name: ", nameOfMed);
    var nameOfMed = nameOfMed.replace(/[^a-zA-Z0-9 -]/g, ' ').replace(/\s+/g, ' ').trim();
    console.log("Cleaned name: ", nameOfMed);

    var lastNumberIndex = nameOfMed.match(/\b\d+\b(?!.*\b\d+\b)/) || -1; // Find the last standalone number

    // If a number is found, get the substring before the last number
    console.log(nameOfMed);
    console.log(lastNumberIndex.index);
    var substringBeforeLastNumber = lastNumberIndex !== -1 ? nameOfMed.substring(0, lastNumberIndex.index).trim() : nameOfMed;


    nameOfMed = substringBeforeLastNumber;
    console.log(nameOfMed);

    // List of words to remove
    var wordsToRemove = [
        "spray bottle", "disinfectant", "moisturizer", "tablet pack", "lotion pack", "thermometer", "suppository", "dispersible", 
        "transdermal", "nasal spray", "suspension", "mouth wash", "supplement", "syrup pack", "oral drops", "injection", "face wash",
        "sanitizer", "eye drops", "ear drops", "ointment", "infusion", "facewash", "solution", "granules", "gel pack", "chewable",
        "spritzer", "dressing", "oximeter", "dilution", "lozenges", "emulsion", "liniment", "tablets", "capsule", "shampoo", "syringe",
        "inhaler", "bandage", "ampoule", "lozenge", "vaccine", "lancets", "regular", "softgel", "topical", "lotion", "liquid", "powder",
        "sachet", "gargle", "lancet", "needle", "mcg/ml", "mcg/kg", "tablet", "sachet", "bottle", "packet", "powder", "elixir", "dragee",
        "gargle", "liquid", "mousse", "troche", "syrup", "strips", "cream", "paste", "spray", "serum", "pills", "patch", "wipes", "tonic",
        "juice", "drink", "glove", "units", "mg/ml", "mg/kg", "drops", "patch", "spray", "strip", "bolus", "wafer",
        "drop", "soap", "tube", "face", "wash", "drip", "vial", "balm", "pads", "roll", "g/ml", "vial", "puff", "foam", "gel",
        "cap", "for","inj", "and", "the", "kit", "pad", "oil", "bar", "mcg", "mcl", "meq", "jar", "tab", "of", "mg", "gm", "kg", "ml",
        "oz", "lb", "iu", "cc", "mm", "g", "l"
    ];

    // Create regex for words to remove
    var regex = new RegExp(`\\b(${wordsToRemove.join('|')})\\b`, 'gi');

    // Remove unwanted words
    var cleanedNameOfMed = nameOfMed.replace(regex, '').trim().replace(/\s+/g, ' ').trim();;
    console.log("After removing unnecessary words: ", cleanedNameOfMed);

    cleanedNameOfMed=cleanedNameOfMed.replace(/\b\d+\b/g, '').replace(/\s+/g, ' ').trim(); //removiign numbers

   
    const finalWords = cleanedNameOfMed.split(' ').map(word => {
        // Extract numbers from the word
        const numberMatches = word.match(/\d+/g);

        // If the word contains numbers, check against wordsToRemove
        if (numberMatches) {
            // Remove any unwanted substrings from the word
            wordsToRemove.forEach(removeWord => {
                if (word.includes(removeWord)) {
                    word = word.replace(removeWord, ''); // Remove the unwanted word
                }
            });
        }

        return word.trim(); // Trim and return the modified word
    }).filter(Boolean); // Remove empty strings

    // Step 3: Join the final words
    let outputString = finalWords.join(' ').replace(/\s+/g, ' ').trim(); // Final output as a single string

    // Step 4: Remove individual numbers from the output string
    outputString = outputString.replace(/\b\d+\b/g, '').replace(/\s+/g, ' ').trim(); // Remove standalone numbers




    // Split the string into individual words
    const splitArray = outputString.split(' '); // Filter to remove empty entries
    console.log("Split Array: ", splitArray);

    

    // Fetch the second word or combination
    var secondaryAnchor = '';
    if (splitArray.length > 1) {
        secondaryAnchor = splitArray[1]; // Get the second word
        // console.log("Initial Secondary Anchor: ", secondaryAnchor);

        var additionalAnchors;
        // Check for hyphens and split if necessary
        try {
            additionalAnchors = secondaryAnchor.split('-');
        } catch (error) {
            additionalAnchors = [secondaryAnchor];
        }
        console.log("Final ji Secondary Anchors: ", additionalAnchors);
        return additionalAnchors; // Return as an array
    } else {
        console.log("No valid secondary anchor found.");
        return '@';  // Default value when no valid secondary anchor is found
    }
}

//   function getSecondaryAnchorValueFromString(nameOfMed){

//     var nameOfMed= nameOfMed.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
//     var wordsToRemove = [
//         "tablet", "suspension", "syrup", "injection", "strip", "gel", "capsule", "cream", 
//         "drop", "lotion", "ointment", "liquid", "cap", "powder", "sachet", "infusion", 
//         "soap", "paste", "moisturizer", "facewash", "solution", "spray", "inj", "shampoo", 
//         "serum", "syringe", "tube", "face wash", "mouth wash", "granules","face","wash",
//         "of","and","the", "pills", "tablet pack", "supplement", "inhaler", "patch",
//         "bandage", "syrup pack", "gel pack", "drip", "vial", "ampoule", "lozenge", 
//         "chewable", "spritzer", "gargle", "dressing", "lotion pack", "spray bottle", "disinfectant",
//         "balm" ,"kit" , "vaccine","lancet","lancets","needle","thermometer","oximeter","pads","pad","wipes",
//         "tonic","dilution","inhaler","oil","sanitizer","lozenges","juice","roll","bar","drink","glove",

//     ];


//     var regex = new RegExp(`\\b(${wordsToRemove.join('|')})\\b`, 'gi');

//     // Remove the words from the string
//     var cleanedNameOfMed = nameOfMed.replace(regex, '').trim();

//     var splitArray = cleanedNameOfMed.split(' ');

//     // Convert numbers to integers and keep strings as strings
//     var secondaryAnchor = splitArray.map(item => {
//         var number = parseInt(item, 10);
//         return isNaN(number) ? item : number;
//     });

//     if(typeof(secondaryAnchor[1])=='string' && secondaryAnchor[1]!=''&& secondaryAnchor[1]!=' '){
//         console.log(typeof(secondaryAnchor));
//             console.log("secondaryAnchor = "+ secondaryAnchor[1])
//             secondaryAnchor=secondaryAnchor[1];
//         }else{
//             console.log("secondaryAnchor = "+ "@")    
//             secondaryAnchor='@';
//         }

//     return secondaryAnchor;
//   }



app.get('/medicomp', async (req, res) => {
    const dynamicTitle = `Find the Best Price for ${req.query['medname']} & Get Fast Delivery | Shop Online Now `;
    const dynamicDescription = `Purchase ${req.query['medname']} at the best price and get it delivered fast. Compare prices and save money on ${req.query['medname']}. Available for quick delivery.`;


    res.render(__dirname + '/tempresultsv4.ejs', {
        medname: req.query['medname'],
        pincode: 400003,
        title: dynamicTitle,
        description: dynamicDescription,
        keywords: `${req.query['medname']}, buy ${req.query['medname']} online, ${req.query['medname']} price, fast delivery ${req.query['medname']}, order ${req.query['medname']}, best price for ${req.query['medname']}, purchase ${req.query['medname']} online`
    });
});


async function getMedicineCollection(medname, packSize) {
    try {
       
        const database = client.db("MedicompDb");
        const collection = database.collection("biggerDOM");

        // Find all documents where medname matches the input
        const result = await collection.find({
            "medicineName": medname,
            "packSize": packSize // Add this line to filter by packSize as well
        }).toArray();

        if (result[0]) {

            console.log(result[0])
            return result;  // Return the entire collection matching the medname
        } else {
            return [];
        }
    } catch (err) {
        console.error("Error fetching collection:", err);
        return [];  // Return null in case of an error
    }
}



async function getPharmacyLinksUsingOurPAlgo(nameOfMed, packSize, medicineInformation) {


    var tempf = [];
    var t = [0, 0, 0];
    var mixUrl;


    try {




        console.log("Hola! New Medicine Searched - " + nameOfMed);



        var arr = [

            'apollopharmacy.in', 
            // 'pasumaipharmacy.com',
            // 'pulseplus.in', 
            // 'medplusmart.com',
            //  'kauverymeds.com',
            // 'chemistbox.in','1mg.com', 
            'myupchar.com',
            // 'chemistsworld.com', 
            // '1mg.com', 
            'expressmed.in',
            // 'truemeds.in',
            // 'onebharatpharmacy.com',
            // 'wellnessforever.com',
            // 'secondmedic.com', 
            // 'callhealth.com',
        ]



        var cont = checkforzero(arr);
        // console.log(arr)

        var tries = 0;
        var cpyOftempf;

        const processedSaltNames = medicineInformation.saltName.map(name => name.replace(/[^a-zA-Z0-9 -]/g, '').replace(/\s+/g, ' ').trim() || "");

        while (cont != 3) {


            tries++;



            mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=buy intitle:(${nameOfMed},${packSize},${processedSaltNames} })&vs=`;
            // mixUrl = `https://search.yahoo.com/search?&vl=lang_en&p=intitle:(${nameOfMed})&vs=`;
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] != 0) {
                    mixUrl += arr[i] + "+%2C+";
                }
            }
            console.log("New Url => " + mixUrl)
            // console.log(arr)



            tempf = [...tempf, await fasterIgextractLinkFromOptimizedyahoo(mixUrl, arr, nameOfMed)];
            if (cpyOftempf == tempf || tries >= 4) {
                break;
            } else {
                cont = checkforzero(arr);
                console.log(cont)
                console.log("Try -> " + tries);
                cpyOftempf = tempf;
                tempf = tempf.flat();
            }
        }

        tempf = tempf.flat();
        tempfzz.push(1);



        for (var k = 0; k < tempf.length; k++) {
            if (tempf[k].includes("apollo")) {
                t[0] = tempf[k];
            }else if (tempf[k].includes("myupchar")) {
                t[1] = tempf[k];
            } else if (tempf[k].includes("expressmed")) {
                t[2] = tempf[k];
            }

        }

        t.push(medicineInformation.prodLink)

        console.log(t)

        return t;


    } catch (err) {
        console.error('Error Fetching Whether links exist or not', err)
    }


    tempf.length = 0;

}




app.get('/scrape-data', async (req, res) => {


    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    var medicineInformation = await getMedicineCollection(req.query['medname'], req.query['packSize']);
    var pincode = parseInt(req.query['pincode']) || 400003;

    console.log(medicineInformation.length)

    if (medicineInformation.length > 0) {
        console.log(medicineInformation[0].medicineName)


        var linksExistsInDb = false;
        var nameOfMed = medicineInformation[0].medicineName + '\n';
        var packSize = medicineInformation[0].packSize;
        var medicineSaltName = medicineInformation[0].saltName;

        nameOfMed = nameOfMed.replace(/[^a-zA-Z0-9\s&.]/g, ' ').toLowerCase();

        // Step 2: Replace '&' with '%26'
        nameOfMed = nameOfMed.replace(/&/g, '%26');
        console.log(nameOfMed);
        console.log(packSize);



        var item = await getPharmacyLinksUsingOurPAlgo(nameOfMed, packSize, medicineInformation[0]);
        console.log(item)

        nameOfMed = medicineInformation[0].medicineName.replace(/-/g, " ");
        console.log("Results For " + nameOfMed);

        console.log(item)

        var cfnie = []; //Check For Number If Exists
        var splitCfnieBySpace = nameOfMed.split(' ');

        var tempArrayOfNumbersInString = nameOfMed.match(/\d+/g) || []; // Default to an empty array
        tempArrayOfNumbersInString = tempArrayOfNumbersInString.map(Number);
        if (tempArrayOfNumbersInString.length > 1) {
            cfnie = tempArrayOfNumbersInString.slice(0, -1);
        } else {
            cfnie = tempArrayOfNumbersInString;
        }

        console.log("CFNIE = " + cfnie)


        var secondaryAnchor = privGetSecondaryAnchorValueFromString(medicineInformation[0].medicineName.toLowerCase())
        console.log(nameOfMed);
        console.log(secondaryAnchor);



        var tempStringForCheckingRelease = nameOfMed.replace(/[^a-zA-Z0-9]/g, ' ');
        const wordsInString = tempStringForCheckingRelease.split(' ').filter(Boolean); // Filter to remove any empty entries
        const releaseMechanisms = [
            "cc", "cd", "cr", "da", "dr", "ds", "ec", "epr", "er", "es",
            "hbs", "hs", "id", "ir", "la", "lar", "ls", "mr", "mt", "mups",
            "od", "pa", "pr", "sa", "sr", "td", "tr", "xl", "xr", "xs",
            "xt", "zok"
        ];
        const foundWord = wordsInString.find(word => releaseMechanisms.includes(word.toLowerCase()));

        var releaseMechScore = 0;
        // Return the found word or '@' if not found
        const releaseMechanism = foundWord ? foundWord.toLowerCase() : '@';


        console.log("Release Mech Score - " + releaseMechanism)






        var medicinePackSize = extractNumbersWithDecimalPoints(packSize);
        // medicinePackSize=Math.max(...medicinePackSize)

        // const manufacturerN= await extractManufacNameFromPharmeasy(item[1]);
        // console.log(manufacturerN)

        console.log(medicinePackSize)
        const start1 = performance.now();
        // const LinkDataResponses = await axiosParallel(item);

        // 'netmeds.com', 'pharmeasy.in','pasumaipharmacy.com', 
        // 'pulseplus.in', 'medplusmart.com','truemeds.in', 
        // 'kauverymeds.com',

        const promises = [
            FastextractDataOfApollo(item[0], medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism),  /**/
            extractDataOfMyUpChar(item[1], medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, secondaryAnchor, releaseMechanism), /**/
            extractDataFromExpressMed(item[2], medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism), /**/
            // extractDataOfTruemeds(item[3], medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism), /**/
            // extractDataOfNetMeds(item[1], medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism),  /**/
            // extractDataOfPP(item[3], nameOfMed,medicinePackSize,cfnie),
            // extractDataOfmedplusMart(item[4], nameOfMed,medicinePackSize), //pulsepplus
            // extractDataOfOgMPM(item[4], nameOfMed,medicinePackSize,cfnie), //medplusmart   LOT TO WORK ON THIS
            // extractDataOfKauveryMeds(item[5], nameOfMed,medicinePackSize,cfnie),
            // extractDataOfChemistBox(item[7], nameOfMed,medicinePackSize),
            // extractDataOfTata(item[6],nameOfMed,medicinePackSize,cfnie,pincode,secondaryAnchor),
            // extractDataOfMyUpChar(item[9],nameOfMed,medicinePackSize),
            // extractDataFromApiTata1mg(nameOfMed,item[6].split('/').pop().replace(/-/g, ' '),medicinePackSize,cfnie,pincode), /**/
            // extractDataFromApiOfMediBuddy(nameOfMed,medicinePackSize,cfnie),
            
            // extractDataFromApiMyupchar(nameOfMed,medicinePackSize,cfnie),
            extractDataOfPharmEasy(medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism), /**/
            // extractDataOfMedkart(medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, secondaryAnchor,pincode, releaseMechanism),  //dont use untill full API is done
            extractDataFromApiOfChemist180(medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, secondaryAnchor, releaseMechanism),
            extractDataFromApiOfOneBharatPharmacy(medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism),
            extractDataFromApiOfPasumaiPharmacy(medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism),/**/
            extractDataFromApiPulseplus(medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism),/**/
            extractDataFromApiChemistBox(medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism), /**/
            extractDataFromApiChemistsWorld(medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism), /**/
            extractDataFromApiOfPracto(medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism), /**/
            extractDataFromApiMchemist(medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, secondaryAnchor, releaseMechanism),
            extractDataFromApiOfHealthmug(medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism),
            extractDataFromApiMedivik(medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism),
            extractDataFromApiOfMedpay(medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism),
            extractDataFromApiOfMrmed(medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism),
            extractDataFromApiOfMfine(medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism),
            extractDataFromApiOfNetmeds(medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism),
            extractDataFromApiOfTruemeds(medicineInformation[0], nameOfMed, medicinePackSize, cfnie, medicineSaltName, pincode, secondaryAnchor, releaseMechanism),
            // extractDataFromApiOfDawaaDost(nameOfMed,medicinePackSize,cfnie,pincode), /**/

        ];



        var final = [];


        promises.forEach(async (promise) => {
            try {
                const result = await promise;
                final.push(result);
                console.log(result)
                console.log(result.name);
                if (result.name != "NA" && result.price && result.sfinalAvg >= 85 && result.smed >= 50) {
                    res.write(`data: ${JSON.stringify(result)}\n\n`);
                }
            } catch (error) {
                console.error("Error processing promise:", error);
            }
        });

        Promise.all(promises).then(() => res.end());

        const end1 = performance.now() - start1;
        console.log(`Execution time for pharmas: ${end1}ms`);



        var products = final;

        function parseDeliveryTime(deliveryTime) {
            const timeMatch = deliveryTime.match(/(\d+)\s*-\s*(\d+)\s*(days|hours|mins)/);
            if (timeMatch) {
                let [_, min, max, unit] = timeMatch;
                min = parseInt(min, 10);
                max = parseInt(max, 10);
                const avg = (min + max) / 2; // Calculate average time
                console.log(deliveryTime)

                // Convert days and hours to minutes if needed
                if (unit === 'days') {
                    return avg * 24 * 60; // Convert days to minutes
                } else if (unit === 'hours') {
                    return avg * 60; // Convert hours to minutes
                } else if (unit === 'mins') {
                    return avg; // Already in minutes
                }
            } else {
                console.log(deliveryTime)
            }
            return Infinity; // Return a large number if no valid time is found for safety
        }

        // Function to assign ranks based on delivery time
        function assignDeliveryTimeRank(products) {
            // Calculate delivery hours and create a list of [index, deliveryHours] for ranking
            const deliveryTimes = products.map((product, index) => ({
                index,
                deliveryHours: parseDeliveryTime(product.deliveryTime),
            }));

            // Sort based on delivery hours
            deliveryTimes.sort((a, b) => a.deliveryHours - b.deliveryHours);

            console.log(deliveryTimes)
            // Assign ranks based on sorted order
            deliveryTimes.forEach((item, rank) => {
                products[item.index].rankForDelTime = rank + 1;
            });
        }

        function assignBestRank(products) {
            // Create a list of [index, sFinalAvg] for ranking
            const rankings = products.map((product, index) => ({
                index,
                sFinalAvg: product.sFinalAvg,
            }));

            // Sort based on sFinalAvg (assuming higher sFinalAvg is better)
            rankings.sort((a, b) => b.sFinalAvg - a.sFinalAvg);

            // Assign ranks based on sorted order
            rankings.forEach((item, rank) => {
                products[item.index].bestRank = rank + 1;
            });
        }

        // Assign delivery time ranks
        assignDeliveryTimeRank(products);
        assignBestRank(products);





        req.on('close', () => {
            res.write(`over`);  // Send each result as an SSE message
            console.log("Data Found Sir.")
            res.end();  // End the SSE stream
        });


    } else {
        console.log("Wrong Spelling Of Medicine")
        res.write(`over`);  // Send each result as an SSE message
        res.end();  // End the SSE stream

    }

    // extractDataOfOBP(item[4], nameOfMed,manufacturerN),
    // extractDataOfIndiMedo(item[7], nameOfMed,manufacturerN),
    // extractDataOfSecondMedic(item[7], nameOfMed,manufacturerN),

    // extractDataOfMyUpChar(item[4], nameOfMed,manufacturerN),
    //   extractSubsfApollo(item[8],final),


});


app.post('/checkout', (req, res) => {

    const final = [];
    final.push({
        pharmacyName: req.body.pharmacyName,
        medicineName: req.body.medicineName,
        ImgSrc: req.body.ImgSrc,
        medicinePrice: req.body.medicinePrice,
        deliveryCharge: req.body.deliveryCharge,
    })


    res.render(__dirname + '/checkOutPage.ejs', { final });
});

app.post('/create-order', async (req, res) => {
    const options = {
        amount: req.body.amount * 100,  // amount in the smallest currency unit
        currency: 'INR',
        receipt: 'order_rcptid_11'
    };

    try {
        const order = await razorpay.orders.create(options);
        res.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
            key_id: process.env.RAZORPAY_KEY_ID // Send the key_id to the client
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

app.post('/verify-payment', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature === razorpay_signature) {
        res.json({ status: 'success' });
    } else {
        res.json({ status: 'failure' });
    }
});



const port = process.env.PORT || 4000 // Port we will listen on

// Function to listen on the port
app.listen(port, () => console.log(`This app is listening on port ${port}`));