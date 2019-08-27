require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const ejsLint = require('ejs-lint');
const mongoose = require("mongoose");
// const client = require('socket.io').listen(4000).sockets;
const _ = require("lodash");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

// let userID = null;
// let signinStatus = "signin";
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
    personName: String,
    username: {
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
    username: { type: String, ref: 'user' },
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

// passport.serializeUser(user.serializeUser());
// passport.deserializeUser(user.deserializeUser()); 

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});


// ***************Getting all GET requests****************

app.get("/", function (req, res) {

    req.session.signinStatus = "signin";
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

        if (req.isAuthenticated()) {
            req.session.signinStatus = "signout";
            res.render("index", {
                signinStatus: req.session.signinStatus,
                subcategories: allSubCategories
            });
        } else {
            res.render("index", {
                signinStatus: req.session.signinStatus,
                subcategories: allSubCategories
            });
        }
    });

});

app.get("/signup", function(req, res){
    res.render("signup",{
        signinStatus: req.session.signinStatus
    });
    
});

app.get("/signin", function (req, res) {
    res.render("signin", {
        signinStatus: req.session.signinStatus
    });

});

app.get("/signout", function (req, res) {
    // userID = null;
    req.logout();
    req.session.signinStatus = "signin";
    res.redirect("/");
})

app.get("/post", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("post", {
            signinStatus: req.session.signinStatus
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
                signinStatus: req.session.signinStatus,
                details: items,
                deleteAd: false
            });

        }

    });

});
app.get("/ad/details/:adID", function (req, res) {
    if (req.isAuthenticated()) {
        var id = req.params.adID;
        ad.findOne({
            _id: id
        }, function (err, foundAd) {
            if (err) {
                console.log(err);
            } else {
                user.findOne({
                    username: foundAd.username
                }, function (err, foundUser) {
                    if (!err) {
                        chat.findOne({
                            adID: id
                        }, function (err, foundChat) {
                            if (!err) {
                                if (foundChat) {
                                    user.findOne({
                                        username: req.session.username
                                    }, function (err, user) {
                                        res.render("description", {
                                            signinStatus: req.session.signinStatus,
                                            adData: foundAd,
                                            userData: foundUser,
                                            chatData: foundChat,
                                            name: user.personName,
                                            userId: user.id
                                        });
                                    });

                                } else {
                                    user.findOne({
                                        username: req.session.username
                                    }, function (err, user) {
                                        res.render("description", {
                                            signinStatus: req.session.signinStatus,
                                            adData: foundAd,
                                            userData: foundUser,
                                            chatData: null,
                                            name: user.personName,
                                            userId: user.id
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
        signinStatus: req.session.signinStatus,
    });
});

app.get("/services", function (req, res) {
    res.render('services', {
        signinStatus: req.session.signinStatus,
    });
});

app.get("/contact_us", function (req, res) {
    res.render('contact_us', {
        signinStatus: req.session.signinStatus,
    });
});

app.get("/myads", function(req, res){

    ad.find({username: req.session.username}, function(err, docs){
        if(err){
            console.log(err);
        }else{
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
                signinStatus: req.session.signinStatus,
                details: items,
                deleteAd: true
            });

        }
    });

});

// ***********Getting all POST requests*****************


app.post("/signin", function(req, res){

    const newuser = new user({
        username: req.body.username,
        password: req.body.password
    });

    req.login(newuser, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/signin");
        } else {
            passport.authenticate("local")(req, res, function(err) {
                // var id = user.id;
                req.session.username = req.body.username;
                res.redirect("/");
                
            });
         
        }
    });

});



app.post("/signup", function(req,res){
    const username = req.body.username;
    const personName = req.body.person_name;
    const password = req.body.password;

    user.register({username: username, personName: personName, ad_ids:[]},password,function(err, user){
        if(err){
            console.log(err);
            res.redirect("/signup");
        }else{
            passport.authenticate("local")(req, res, function(err){
                if(err){
                    res.redirect("/signup");
                }else{
                req.session.username = username;
                res.redirect("/");

                }
            });
        }
    });

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

    const newAd = new ad({
        phno: phno,
        category: category,
        subcategory: subcategory,
        title: title,
        description: description,
        address: address,
        username: req.session.username,
        chatId: null,
        date: dateTime
    });

    ad.create(newAd, function(err,docsInserted){
        user.findOne({username: req.session.username}, function(err, foundList){
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

app.post("/delete", function(req,res){
    ad.deleteOne({
        _id:req.body.adID}, function(err, item){
            if(err){
                console.log(err);
            }else{
                res.redirect("/myads");
            }
        });
});


app.listen(3000, function (err) {
    console.log("Server has started at port 3000");
});



