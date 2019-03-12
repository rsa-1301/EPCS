var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require("mongoose");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var methodOverride = require("method-override");
var passportLocalMongoose = require("passport-local-mongoose");
app.use(methodOverride("_method"));

mongoose.connect("mongodb://localhost/EPCC");
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname + '/public'));

app.use(require("express-session")({
    secret: "Once again rusty wins",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

var userSchema = new mongoose.Schema({
    name: String,
    username: String,
    phone: String,
    password: String,
    credit: Number,
    Upaper: [{
            type: mongoose.Schema.Types.ObjectId,
            ref:"Paper"
    }],
    Ppaper: []
    
});

var paperSchema = new mongoose.Schema({
    slot: String,
    code: String,   
    sem: String,    //fall,winter
    type: String,    //cat,fat
    year: String,
    link: String
});

userSchema.plugin(passportLocalMongoose);
var Paper = mongoose.model("Paper",paperSchema);
var User = mongoose.model("User",userSchema); 


passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




var multer = require('multer');
var path = require('path');

var publicDir = path.join(__dirname,'/public');
var storage = multer.diskStorage({
    destination: function(req,file,callback){
        callback(null,"C:/EPCS/public/Images");  
    }, 
    filename: function(req,file,callback){
        var type = file.mimetype;
        var type = type.split("/");
        var format = type[type.length-1];
        
        var fname = file.originalname;
        var fname = fname.split(".");
        var fname = fname[0];
        callback(null,fname + "_" +file.fieldname + "_" + Date.now() +"."+ format);
    }
});


var upload = multer({
    storage:storage 
});


/*app.use(require('cookie-parser')());*/




/*app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    next();
});*/


//Routes
app.get("/",function(req,res){
        res.render("index");
});

app.get("/newpaper",isLoggedIn,function(req,res){
    res.render("newpaper"); 
});

app.post("/newpaper",isLoggedIn,upload.single('imgUploader'),function(req,res){
    console.log(req.user);
    console.log(req.body);
    console.log(req.file);
    var pap = {
        slot: req.body.slot,
        code: req.body.code,
        sem: req.body.sem,
        type: req.body.type,
        year: req.body.year,
        link:"/Images/" + req.file.filename
    };
    console.log(pap);
    Paper.create(pap,function(err,pap){
        if(err){
            console.log(err);
        } else {
            console.log(pap);
            var usr  = req.user;
            usr.Upaper.push(pap);
            usr.credit = usr.credit+1;
            console.log(usr)
            
            User.findByIdAndUpdate(usr._id,usr,function(err,updatedUser){
                res.render("success");
            });
        }
    });  
});

app.get("/search",isLoggedIn,function(req,res){
    var data =[]
    res.render("search",{Data:data ,User: req.user}); 
});

app.post("/search",isLoggedIn,function(req,res){
    console.log(req.body.code.toUpperCase());
    var pcode = req.body.code.toUpperCase();
    var ptype = req.body.type;
    Paper.find({code:pcode,type:ptype},function(err,data){
        if(err){
            console.log(err);
        } else {
        console.log(data);
        res.render("search",{Data:data,User:req.user});
        }
    });
});

app.post("/purchase/:code/:type",isLoggedIn,function(req,res){
    var pap = req.params.code + "_" + req.params.type;
    console.log(pap)
    var usr = req.user;
    console.log(usr)
    usr.Ppaper.push(pap);
    usr.credit = usr.credit-1;
    console.log(usr);
    User.findOneAndUpdate({_id:usr._id},usr,function(err,updatedUser){
        if(err){
            console.log(err);
        } else {
            res.render("success1");
        }
                
    });
});

app.get("/download/:id",isLoggedIn,function(req,res){
     Paper.findById(req.params.id,function(err,paper){
            if(err){
                console.log(err);
            } else {
                var file = publicDir + paper.link;
                var name_array = paper.link.split('/');
                var fname = name_array[1];
                res.download(file,fname);
            }
     });
});
//Authentication Routes
app.post("/register",function(req,res){
    console.log(req.body);
    var user = {
        username:req.body.username,
        name:req.body.name,
        phone:req.body.phone,
        credit: 5
    };
    console.log(user);
    User.register(new User(user),req.body.password,function(err,data){
        console.log(data);
        if(err){
            console.log(err);
            return res.redirect("/");
        }
            passport.authenticate("local")(req,res,function(){
                console.log("We have registered");
                res.redirect("/newpaper");
            });
    });
});



app.post("/login",passport.authenticate("local", {successRedirect:"/newpaper",failureRedirect:"/"}),function(req,res){
    
});




//MiddleWares
function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

app.listen(3000,function(){
    console.log("Server Serving at 3000"); 
});