require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const ejsLint = require('ejs-lint');
const mongoose = require("mongoose");
const client = require('socket.io').listen(4000).sockets;
const _ = require("lodash");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

let userID = null;
let signinStatus = "signin";
const pssd = process.env.PSSWD;

// console.log(pssd);
app.use(bodyParser.urlencoded({
    extended: true
}));
 
mongoose.connect('mongodb://localhost:27017/craigslistDB', {
// let mongoConnectLink = "mongodb+srv://admin-terance:".concat(pssd).concat("@cluster0-u5arr.mongodb.net/picklistDB");
    // mongoose.connect(mongoConnectLink, {
    useNewUrlParser: true
});
mongoose.set("useCreateIndex",true);


app.use(express.static("public/css"));
app.use(express.static("public/js"));
app.set('view engine', 'ejs');
// app.use(express.static(path.join(__dirname, 'public')));

// Setting up session and passport 
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


const Schema = mongoose.Schema;

// Creating the user Schema for user collection model
const userSchema = new Schema({
    username: String,
    email: {
        type: String,
        index: {
            unique: true,
            dropDups: true
        }
    },
    password: String,
    ad_ids: [{
        type: Schema.Types.ObjectId,
        ref: 'ad'
    }]
});
userSchema.plugin(passportLocalMongoose);
const user = mongoose.model("user", userSchema);



// Creating the ad Schema and the ad collection model 
const adSchema = new Schema({
    phno: Number,
    category: String,
    subcategory: String,
    title: String,
    description:String,
    address:String,
    userId: { type: Schema.Types.ObjectId, ref: 'user' },
    chatId: { type: Schema.Types.ObjectId, ref: 'chat' },
    date: String
});
const ad = mongoose.model("ad",adSchema);



// Creating the message Schema 
const messageSchema = new Schema({
    name: String,
    message: String
});

const message = mongoose.model("message",messageSchema);



// Creating the chatSchema
const chatSchema = new Schema({
    adID : { type: Schema.Types.ObjectId, ref: 'ad',index: {unique: true, dropDups: true} },
    allchats: [messageSchema]
});

const chat = mongoose.model("chat",chatSchema);


passport.use(user.createStrategy());

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());


// ***************Getting all GET requests****************

app.get("/", function (req, res) {
    if(req.isAuthenticated()){
        console.log(req.session.email);
    }
    ad.find({}, function (err, docs) {
        var serviceIndexes = _.keys(_.pickBy(docs, {
            category: "Services"
        }));
        var communityIndexes = _.keys(_.pickBy(docs, {
            category: "Community"
        }));
        var housingIndexes = _.keys(_.pickBy(docs, {
            category: "Housing"
        }));
        var forsaleIndexes = _.keys(_.pickBy(docs, {
            category: "For sale"
        }));
        var jobsIndexes = _.keys(_.pickBy(docs, {
            category: "Jobs"
        }));
        var tempjobsIndexes = _.keys(_.pickBy(docs, {
            category: "Temp jobs"
        }));

        var serviceSubCategories = [];
        serviceIndexes.forEach(element => {
            serviceSubCategories.push(docs[element].subcategory);
        });

        var communitySubCategories = [];
        communityIndexes.forEach(element => {
            communitySubCategories.push(docs[element].subcategory);
        });

        var housingSubCategories = [];
        housingIndexes.forEach(element => {
            housingSubCategories.push(docs[element].subcategory);
        });

        var forsaleSubCategories = [];
        forsaleIndexes.forEach(element => {
            forsaleSubCategories.push(docs[element].subcategory);
        });


        var jobsSubCategories = [];
        jobsIndexes.forEach(element => {
            jobsSubCategories.push(docs[element].subcategory);
        });

        var tempjobsSubCategories = [];
        tempjobsIndexes.forEach(element => {
            tempjobsSubCategories.push(docs[element].subcategory);
        });

        var serviceSubCategories = _.uniq(serviceSubCategories, 'subcategory');
        var communitySubCategories = _.uniq(communitySubCategories, 'subcategory');
        var housingSubCategories = _.uniq(housingSubCategories, 'subcategory');
        var forsaleSubCategories = _.uniq(forsaleSubCategories, 'subcategory');
        var jobsSubCategories = _.uniq(jobsSubCategories, 'subcategory');
        var tempjobsSubCategories = _.uniq(tempjobsSubCategories, 'subcategory');
        var allSubCategories = [
            ["Community", communitySubCategories],
            ["Services", serviceSubCategories],
            ["For sale", forsaleSubCategories],
            ["Housing", housingSubCategories],
            ["Jobs", jobsSubCategories],
            ["Temp jobs", tempjobsSubCategories]
        ];

        if (userID) {
            signinStatus = "signout";
            res.render("index", {
                signinStatus: signinStatus,
                subcategories: allSubCategories
            });
        } else {
            res.render("index", {
                signinStatus: signinStatus,
                subcategories: allSubCategories
            });
        }
    });

});

app.get("/signup", function(req, res){
    res.render("signup",{
        signinStatus: signinStatus
    });
    
});

app.get("/signin", function (req, res) {
    res.render("signin", {
        signinStatus: signinStatus
    });

});

app.get("/signout", function (req, res) {
    userID = null;
    signinStatus = "signin";
    res.redirect("/");
})

app.get("/post", function (req, res) {
    if (userID) {
        res.render("post", {
            signinStatus: signinStatus
        });

    } else {
        res.redirect("/signin");
    }
});

app.get("/ads/:customSubCategory", function (req, res) {
    // Reformating the text for querying
    var subCategory = _.replace(req.params.customSubCategory, new RegExp("%20", "g"), " ");
    var subCategory = _.replace(subCategory, new RegExp("-", "g"), "/");

    ad.find({
        subcategory: subCategory
    }, function (err, docs) {
        if (err) {
            console.log(err);

        } else {
            // Getting the title and description values
            var ids = _.map(docs, "_id");
            var titles = _.map(docs, "title");
            var description = _.map(docs, "description");
            var date = _.map(docs, "date");
            // Making a 2D array out of it 
            var items = [ids, titles, description, date];
            // Finding the transpose of the matrix, thereby making it to the format [title,description] of each value it items array  
            items = _.zipWith(...items, _.concat)
            res.render("details", {
                signinStatus: signinStatus,
                details: items
            });

        }

    });

});
app.get("/ad/details/:adID", function (req, res) {
    if (userID) {
        var id = req.params.adID;
        ad.findOne({
            _id: id
        }, function (err, foundAd) {
            if (err) {
                console.log(err);
            } else {
                user.findOne({
                    _id: foundAd.userId
                }, function (err, foundUser) {
                    if (!err) {
                        chat.findOne({
                            adID: id
                        }, function (err, foundChat) {
                            if (!err) {
                                if (foundChat) {
                                    user.findOne({
                                        _id: userID
                                    }, function (err, user) {
                                        res.render("description", {
                                            signinStatus: signinStatus,
                                            adData: foundAd,
                                            userData: foundUser,
                                            chatData: foundChat,
                                            name: user.username,
                                            userId: userID
                                        });
                                    });

                                } else {
                                    user.findOne({
                                        _id: userID
                                    }, function (err, user) {
                                        res.render("description", {
                                            signinStatus: signinStatus,
                                            adData: foundAd,
                                            userData: foundUser,
                                            chatData: null,
                                            name: user.username,
                                            userId: userID
                                        });
                                    });
                                }

                            }

                        });

                    }
                });

            }
        });

    } else {
        res.redirect("/signin");
    }
});

app.get("/about", function (req, res) {
    res.render('about', {
        signinStatus: signinStatus,
    });
});

app.get("/services", function (req, res) {
    res.render('services', {
        signinStatus: signinStatus,
    });
});

app.get("/contact_us", function (req, res) {
    res.render('contact_us', {
        signinStatus: signinStatus,
    });
});



// ***********Getting all POST requests*****************


app.post("/signin", function(req, res){
    const emailID = req.body.emailid;
    const password = req.body.password;

    user.findOne({email: emailID, password: password}, function(err, foundList){
        if(err){
            console.log(err);
        }
        else{
            if(foundList){
                userID = foundList.id;
                res.redirect("/");
            }
            else{
                res.redirect("/signin");

            }
           
        }
    });

});



app.post("/signup", function(req,res){
    const username = req.body.username;
    const email = req.body.emailid;
    const password = req.body.password;

    const newUser = new user({
        username: username,
        email: email,
        password: password,
        ad_ids: []

    });

    // Handle to error here when duplication occours.......
    // user.create(newUser,function(err,insertedDoc){
    //     if(err){
    //         console.log(err);
    //     }
    // });
    user.register({username: username, email: email, ad_ids:[]},password,function(err, user){
        if(err){
            console.log(err);
            res.redirect("/signup");
        }else{
            passport.authenticate("local")(req, res, function(){
                req.session.email = email;
                res.redirect("/");
            });
        }
    });

    // res.redirect("/");
});


app.post("/post", function(req, res){
    const phno = req.body.phno;
    const category = req.body.category;
    const subcategory = req.body.subcategory;
    const title = req.body.title;
    const description = req.body.description;
    const address = req.body.address;
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date+' '+time;


    // Try to add date and time too also write it also to the DB.


    const newAd = new ad({
        phno: phno,
        category: category,
        subcategory: subcategory,
        title: title,
        description: description,
        address: address,
        userId: userID,
        chatId: null,
        date: dateTime
    });

    ad.create(newAd, function(err,docsInserted){
        user.findOne({_id: userID}, function(err, foundList){
            foundList.ad_ids.push(docsInserted._id);
            foundList.save();
            res.redirect("/");
            });
        });
});



app.post("/ad/details", function(req,res){
    var id = req.body.adID;
    var name = req.body.username;
    var message = req.body.message;
    var clear = req.body.clear;
    // console.log(id);
    if(clear!="yes"){
        const newMessage = {
        name: name,
        message: message
    };

    query = {adID: id},
    update = {
        $set: {adID: id},
        $push: {allchats: newMessage}
    },
    options = {upsert: true};

    chat.findOneAndUpdate(query, update, options, function (err, oldChat){
        if(err){
            console.log(err);
        }else{
            if(!oldChat){
                chat.create({adID: id,allchats:newMessage}, function(err,newChat){
                    var redirectLink = "/ad/details/".concat(id);
                        res.redirect(redirectLink);
                });
                
            }else{
                var redirectLink = "/ad/details/".concat(id);
                        res.redirect(redirectLink);
            }
        }
    });
    }else if(clear == "yes"){
        chat.deleteOne({
            adID: id}, function(err,res) {
            if (err) {
                console.log(err);
            } else {
                console.log(res);
            }
        
    });
    var redirectLink = "/ad/details/".concat(id);
      res.redirect(redirectLink);

    }
    
});



app.listen(5000, function (err) {
    console.log("Server has started at port 5000");
});


