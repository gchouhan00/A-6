/********************************************************************************
* WEB322 – Assignment 05
* 
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
* 
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
* Name: _________GITIKA CHOUHAN_____________ Student ID: ___169815214___________ Date: ___28/07/24___________
*
* Published URL: __________________https://github.com/gchouhan00/Assignment-5_________________________________________
*
********************************************************************************/



const legoData = require("./modules/legoSets");
const path = require("path");
const authData = require("./modules/auth-service.js")
const bcrypt = require('bcryptjs');
const express = require('express');
const clientSessions = require('client-sessions');
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, "public")));

app.use(
  clientSessions({
    cookieName: 'session', 
    secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr', 
    duration: 2 * 60 * 1000, 
    activeDuration: 1000 * 60, 
  })
);


app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
 });


 function ensureLogin(req, res, next){
    if(!req.session.user){
        res.redirect("/login");
    } else {
        next();
    }
 }
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.render("home")
});

app.get('/about', (req, res) => {
  res.render("about");
});

app.get("/lego/sets", async (req,res)=>{

  let sets = [];

  try{    
    if(req.query.theme){
      sets = await legoData.getSetsByTheme(req.query.theme);
    }else{
      sets = await legoData.getAllSets();
    }

    res.render("sets", {sets})
  }catch(err){
    res.status(404).render("404", {message: err});
  }
  
});

app.get("/lego/sets/:num", async (req,res)=>{
  try{
    let set = await legoData.getSetByNum(req.params.num);
    res.render("set", {set})
  }catch(err){
    res.status(404).render("404", {message: err});
  }
});



app.get("/lego/addSet", ensureLogin, async (req, res) => {
  try{
    const themes = await legoData.getAllThemes();
    res.render("addSet", {themes});
  } catch(err){
    res.render("500", {message: `Error: ${err.message}`});
  }
});


app.post("/lego/addSet",ensureLogin,  async(req, res) => {
  try{
    await legoData.addSet(req.body);
    res.redirect("/lego/sets");
  } catch(err){
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});


app.get("/lego/editSet/:set_num", ensureLogin, async (req, res) => {
  try {
    const set = await legoData.getSetByNum(req.params.set_num);
    const themes = await legoData.getAllThemes();
    res.render("editSet", {themes, set});
  } catch(err){
    res.status(404).render("404", {message: err.message});
  }
});

app.post("/lego/editSet", ensureLogin, async (req, res) => {
  try {
    await legoData.editSet(req.body.set_num, req.body);
    res.redirect("/lego/sets");
  } catch(err){
    res.status(500).render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});


app.get("/lego/deleteSet/:set_num",ensureLogin, async (req, res) => {
  try {
    await legoData.deleteSet(req.params.set_num);
    res.redirect("/lego/sets");
  } catch (err){
    res.status(500).render("500", {
      message: `I'm sorry, but we have encountered the following error: ${err}`,
    });
  }
});


//new routes for the last assignment
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  authData
  .registerUser(req.body)
  .then(() => res.render("register", {successMessage: "User Created"}))
  .catch((err) => 
  res.render("register", {errorMessage: err, userName: req.body.userName})
);
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  authData.checkUser(req.body)
  .then((user) => {
    req.session.user = {
      userName: userName,
      email: user.email,
      loginHistory: user.loginHistory,
    };
    res.redirect("/lego/sets");
  })
  .catch((err) => {
    res.render("login", {errorMessage: err, userName: req.body.userName});
  });
});

app.get("/logout", (req, res) => {
  res.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

app.use((req, res, next) => {
  res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
});

// legoData.initialize().then(()=>{
//   app.listen(HTTP_PORT, () => { console.log(`server listening on: ${HTTP_PORT}`) });
// });



legoData.initialize()
.then(authData.initialize)
.then(function(){
 app.listen(HTTP_PORT, function(){
 console.log(`app listening on: ${HTTP_PORT}`);
 });
}).catch(function(err){
 console.log(`unable to start server: ${err}`);
});