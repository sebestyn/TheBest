//BEHÍVÁS
    const        halozatiServer = true;
    const        methodOverride = require("method-override");
    const               express = require("express");
    const                   app = express();
    const            bodyParser = require("body-parser");
    const              mongoose = require("mongoose");
    const              passport = require('passport');
    const         LocalStrategy = require("passport-local");
    const passportLocalMongoose = require('passport-local-mongoose');
    const                multer = require('multer');
    const                  date = new Date().toDateString().slice(4,15);
    const                  User = require("./models/user");
    const                SuliDB = require("./models/suli");
    const            TantargyDB = require("./models/tantargy");
    const       BelepesiKodokDB = require("./models/belepesiKodok");

//////////////////////////////////////////////////////////////////////////////////////////

//USE
    app.use(express.static('public'));
    app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:100000}));
    app.use(express.json({limit: '100mb'}));

// SET MULTER STORAGE -> SAVE FILES TO SERVER DISK WITH MULTER
/*
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
      cb(null, date + "-" +file.fieldname )
    }
  })
var upload = multer({ storage: storage })
*/

//ADATBÁZIS
    //ADATBÁZIS HELYE
    mongoose.connect('mongodb+srv://sebestyn:sebestyn@cluster0-uek7j.gcp.mongodb.net/theBest?retryWrites=true&w=majority', 
                    { useNewUrlParser: true, useUnifiedTopology: true  },
                    ()=>console.log('DATABASE CONNECTED')
                    );
        
//Authentication -> belépés/regisztráció
    app.use(require("express-session")({
        secret: "I hope it will work!",
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
    app.use(function(req,res,next){
        res.locals.user = req.user;
        if(req.user){
            res.locals.teacher = req.user.teacher;
        }
        next();
    })

//////////////////////////////////////////////////////////////////////////////////////////
//alapokMenteseAdatbazisba()

//OLDALAK (GET)
    
    //KÖZÖS
        //HOME OLDAL
            app.get("/",function(req,res){
                res.render("home.ejs");
            });
            
        //ÚTMUTATÓ OLDAL
            app.get("/utmutato",function(req,res){
                res.render("utmutato.ejs");
            });
        //LOGIN OLDAL
            app.get('/login',function(req, res) {
               res.render('login.ejs') 
            });
            
        //REGISZTRÁCIÓ OLDAL 
            app.get('/register',function(req, res) {
                var suliNevek = [];
                SuliDB.find({},function(err, sulik) {
                    if(err){
                        console.log("REGISZTRÁCIÓ ERROR");
                        console.log(err);
                    } else {
                        sulik.forEach(function(suli){
                            suliNevek.push({
                                'id':suli._id,
                                'nev':suli.nev
                            })
                        });
                        sortObj(suliNevek,"nev")
                        res.render('register.ejs',{sulik:suliNevek}) 
                    }
                })
            });
        //JELSZÓ VÁLZOZTATÁS
            app.get('/changepassword',isLoggedIn,function(req, res) {
                res.render("changePassword.ejs");
            });
            
        //ADATKEZELÉSI FELTÉTEL
            app.get("/feltetel",function(req, res) {
               res.render('feltetel.ejs') 
            });
                
            
    //DIÁK
        //DIÁK USER ADATAI OLDAL
            app.get('/userInfoSt',isLoggedIn,function(req, res) {
                var osztalyok = [];
                SuliDB.findOne({'_id':req.user.suli},function(err, suli) {
                    if(err){
                        console.log('SULI FIND ERROR 4');
                        console.log(err);
                    } else {
                        req.user.osztalyok.forEach(function(osztalyId){
                            suli.osztalyok.forEach(function(osztalyDB){
                                if(String(osztalyId) == String(osztalyDB._id)){
                                    osztalyok.push(osztalyDB.nev)
                                }
                            })
                        })
                        res.render('userInfo.ejs',{nev:req.user.nev,suli:suli.nev,osztalyok:osztalyok});
                    }
                });
            });
        
        //DIÁK ÚJ OSZTÁLYHOZ CSATLAKOZÁS OLDAL
            app.get('/connectSt',isLoggedIn,function(req, res) {
                res.render('student/connectToClass.ejs')
            });
        //DIÁK ÚJ OSZTÁLYHOZ CSATLAKOZÁS POST    
            app.post('/connectSt',function(req, res) {
                var sikerult = true;
                var kod = req.body.kod;
                
                //SULI MEGKERESÉSE
                    SuliDB.findOne({'_id':req.user.suli},function(err, suli) {
                       if(err){
                           console.log('SULI FIND ERROR 2');
                           console.log(err);
                       } else {
                           var index = suli.osztalyok.findIndex(x => x.kod == kod);
                           var marSzerepel = false;
                           //TALÁLT E
                           if(index==-1){
                               sikerult = false
                           } else {
                               //TANTÁRGYAK VÉGIG NÉZÉSE
                                   suli.osztalyok[index].tantargyak.forEach(function(tantargy){
                                       //SZEREPEL E A DIÁK MÁR A TANTÁRGY NÉVSORBAN
                                           if((tantargy.diakok.findIndex(x => String(x.userId) == String(req.user._id))) != -1){
                                                marSzerepel = true;
                                           }
                                           if(!marSzerepel){
                                               tantargy.diakok.push({
                                                    nev:req.user.nev,
                                                    userId:req.user._id,
                                                    pont:0,
                                                    kapott:[]
                                                });
                                           }
                                   });
                                // ELMENTÉSE
                                    suli.save(function(err,data){
                                        if(err){
                                             sikerult = false
                                             console.log('SULI FIND ERROR 3');
                                             console.log(err); 
                                        } else {
                                            if(!marSzerepel){
                                                //USER DB-be ÚJ OSZTÁLY ELMENTÉSE HA MÉG NEM SZEREPEL
                                                    User.findOne({'_id':req.user._id},function(err, diak) {
                                                        if(err){
                                                            sikerult = false
                                                            console.log('DIAK FIND ERROR 3');
                                                            console.log(err);
                                                        } else {
                                                            //ELVAN E ÁR MENTVE?
                                                            if((diak.osztalyok.findIndex(x => String(x) == String(suli.osztalyok[index]._id))) == -1){
                                                                diak.osztalyok.push(suli.osztalyok[index]._id);
                                                                diak.save(function(err,mentettDiak){
                                                                    if(err){
                                                                        sikerult = false
                                                                        console.log('DIAK FIND ERROR 3');
                                                                        console.log(err); 
                                                                    } else {
                                                                        console.log(req.user.nev + ' csatlakozott ehhez az osztályhoz: ' + suli.osztalyok[index].nev )
                                                                    }
                                                                })
                                                            }
                                                        }
                                                    });
                                            }
                                        }
                                    })
                           }
                           res.status(200).send({success: sikerult})
                       }
                    });
                
                
            });
            
            
        //DIÁK FŐOLDAL (csak bejelentkezéssel)
            app.get('/student',isLoggedIn,function(req, res) {
                if(!req.user.teacher){
                    var kapott = req.user.kapott;
                    kapott.reverse();
                    kapott = kapott.slice(0,10);
                    res.render('student/student.ejs',{kapott:kapott}) 
                }
                else{
                    res.redirect('/classesTe')
                }
            });
            
        // DIÁK PONTJAI
            app.get('/mypointsSt',isLoggedIn,function(req, res) {
                var pontjaim = [];
                SuliDB.findOne({'_id':req.user.suli},function(err, suli) {
                    if(err){
                        console.log('SULI ERROR 3');
                        console.log(err);
                    } else {
                        var osztalyokId = req.user.osztalyok;
                        osztalyokId.forEach(function(osztalyId){
                            var index = suli.osztalyok.findIndex(x => String(x._id) == String(osztalyId));
                            suli.osztalyok[index].tantargyak.forEach(function(tantargy){
                                tantargy.diakok.forEach(function(diak){
                                    if(String(diak.userId) == String(req.user._id)){
                                        pontjaim.push({
                                            'osztaly':suli.osztalyok[index].nev,
                                            'tantargy':tantargy.nev,
                                            'pont':diak.pont,
                                            'kapott':diak.kapott.reverse()
                                        })
                                    }
                                });
                            });
                        });
                        res.render('student/points.ejs',{pontjaim:pontjaim})
                    }
                });
            });
            
            
            
    //TANÁR  
        //TANÁR FŐOLDAL (csak tanári bejelentkezéssel)
            app.get('/teacher',isTeacherLoggedIn,function(req, res) {
               if(req.user.teacher){
                    res.redirect('/classesTe')
                    //res.render('teacher/teacher.ejs') 
                }
                else{
                    res.redirect('/student')
                }
            });
        
        //TANTÁRGYAI OLDAL
            app.get('/subjectsTe',isTeacherLoggedIn,function(req, res) {
                SuliDB.findOne({'_id':req.user.suli},function(err, suli) {
                    if(err){
                        console.log('SULI ERROR');
                        console.log(err);
                    } else {
                        var tantargyai = tanarTantargyai(suli.osztalyok,req.user._id);
                        sortObj(tantargyai,'nev');
                        res.render('teacher/subjects.ejs',{tantargyai:tantargyai}) 
                    }
                });
            });
            
        //OSZTÁLYAI OLDAL
            app.get('/classesTe',isTeacherLoggedIn,function(req, res) {
                SuliDB.findOne({'_id':req.user.suli},function(err, suli) {
                    if(err){
                        console.log('SULI ERROR');
                        console.log(err);
                    } else {
                        var osztalyai = tanarOsztalyai(suli.osztalyok,req.user._id);
                        sortObj(osztalyai,'nev');
                        res.render('teacher/classes.ejs',{osztalyai:osztalyai}) 
                    }
                });
            });
            
        //ÚJ OSZTÁLY LÉTREHOZÁSA OLDAL
            app.get('/newClassTe',isTeacherLoggedIn,function(req, res) {
                BelepesiKodokDB.find({},function(err,meglevoKodok){
                    if(err){
                        console.log('BELÉPÉSI KÓDOK ERROR');
                        console.log(err);
                    } else {
                        TantargyDB.find({},function(err,tantargyak){
                            if(err){
                                console.log("TANTÁRGYAK ERROR");
                                console.log(err);
                            } else {
                                res.render('teacher/newClass.ejs',{meglevoKodok:meglevoKodok,tantargyak:tantargyak});
                            }
                        })
                    }
                })
            });
        //ÚJ OSZTÁLY LÉTREHOZÁSA POST
            app.post('/newClassTe',function(req, res) {
                var nev = req.body.nev;
                var kod = req.body.kod;
                var tantargy = req.body.tantargy;
                var sikerult = true;
                var ujOsztaly = {
                        nev:nev,
                        kod:kod,
                        tantargyak:[{
                            nev:tantargy,
                            tanar:req.user.nev, 
                            tanarId:req.user._id,
                            diakok:[]
                        }]
                    };
                //KÓD MENTÉSE DB-be
                    BelepesiKodokDB.create({
                        kod:Number(kod)
                    },function(err,kod){
                        if(err){
                            sikerult = false;
                            console.log('KÓD MENTÉS ERROR');
                            console.log(err);
                        } else {
                            //ÚJ OSZTÁLY MENTÉSE SULI DB-be
                                SuliDB.findOneAndUpdate(
                                   { "_id":req.user.suli }, 
                                   { $push: { 'osztalyok': ujOsztaly  } },
                                  function (err, success) {
                                        if (err) {
                                            sikerult = false;
                                            console.log('ÚJ OSZTÁLY ERROR');
                                            console.log(err);
                                        } else {
                                            console.log(nev+' osztály létrehozva');
                                        }
                                    });
                        }
                    })
                res.status(200).send({success: sikerult})
            });
           
        //ÚJ TANTÁRGY LÉTREHOZÁSA EGY OSZTÁLYBAN OLDAL 
            app.get('/newSubjectTe',isTeacherLoggedIn,function(req, res) {
                BelepesiKodokDB.find({},function(err,meglevoKodok){
                    if(err){
                        console.log('BELÉPÉSI KÓDOK ERROR');
                        console.log(err);
                    } else {
                        TantargyDB.find({},function(err,tantargyak){
                            if(err){
                                console.log("TANTÁRGYAK ERROR");
                                console.log(err);
                            } else {
                                SuliDB.findOne({"_id":req.user.suli},function(err, suli) {
                                    if(err){
                                        console.log("SULI ERROR");
                                        console.log(err);
                                    } else {
                                        var osztalyok = [];
                                        suli.osztalyok.forEach(function(osztaly){
                                            osztalyok.push(osztaly.nev);
                                        })
                                        res.render('teacher/newSubject.ejs',{meglevoKodok:meglevoKodok,tantargyak:tantargyak,osztalyok:osztalyok});
                                    }
                                });
                            }
                        })
                    }
                })
            });
        
        //ÚJ TANTÁRGY MENTÉSE AZ OSZTÁLYHOZ
            app.post('/newSubjectTe',function(req, res) {
                var nev = req.body.nev;
                var tantargy = req.body.tantargy;
                var sikerult = true;
                
                SuliDB.findOne({"_id":req.user.suli},function(err, suli) {
                    if(err){
                        sikerult = false;
                        console.log('SULI ERROR 2');
                        console.log(err);
                    } else {
                        //TANTÁRGY LÉTREHOZÁS
                            var index = suli.osztalyok.findIndex(x => x.nev == nev);
                            suli.osztalyok[index].tantargyak.push({
                                "nev": tantargy,
                                "tanar": req.user.nev,
                                "tanarId": req.user._id,
                                "diakok": []
                            });
                        //TANTÁRGYHOZ A DIÁKOK AZ OZTÁLYBÓL AUTOMATIKUS CSATLAKOZÁSA
                            var lastTantargyIndex = suli.osztalyok[index].tantargyak.length-1;
                            if (lastTantargyIndex > 0){
                                suli.osztalyok[index].tantargyak[0].diakok.forEach(function(diak){
                                     suli.osztalyok[index].tantargyak[ lastTantargyIndex ].diakok.push({
                                         _id:diak._id,
                                         nev:diak.nev,
                                         userId:diak.userId,
                                         pont:0,
                                         kapott:[]
                                    });
                                });
                            }
                        //MENTÉS
                            suli.save(function(err, data){
                                if(err){
                                    sikerult = false;
                                    console.log('SULI SUJECT MENTÉS ERROR');
                                    console.log(err);
                                } else {
                                    console.log(tantargy +' hozzáadva a ' + suli.osztalyok[index].nev + '-hez');
                                }
                            });
                    }
                });
                res.status(200).send({success: sikerult})
            });
            
        //CSOPORT TÖRLÉSE
            app.post('/deleteGroup',function(req, res) {
               var osztalyId = req.body.osztalyId;
               var tantargy = req.body.tantargy
               SuliDB.findOne({"_id":req.user.suli},function(err, suli) {
                   if(err){
                       console.log("GROUP TÖRLÉS ERROR")
                   } else {
                      var osztalyIndex = suli.osztalyok.findIndex(x => x._id == osztalyId);
                      var tantargyIndex = suli.osztalyok[osztalyIndex].tantargyak.findIndex(x => x.nev == tantargy);
                      var osztalyNev = suli.osztalyok[osztalyIndex].nev;
                      suli.osztalyok[osztalyIndex].tantargyak.splice(tantargyIndex, 1) 
                      suli.save(function(err, data){
                            if(err){
                                console.log('GROUP TÖRLÉS ERROR 2');
                                console.log(err);
                            } else {
                                console.log(osztalyNev+' ' + tantargy +' törölve');
                            }
                        });
                   }
               });
               res.status(200).send({success: true})
            });
        
        //OSZTALYOK LISTÁJA
            app.get('/classList',isTeacherLoggedIn,function(req, res) {
                //OSZTÁLYOK KERESÉSE
                var osztalyok=[];
                    SuliDB.findOne({'_id':req.user.suli},function(err, suli) {
                       if(err){
                            console.log("OSZTALYOK LISTÁJA ERROR");
                            console.log(err);
                       } else {
                           suli.osztalyok.forEach(function(osztaly){
                              osztalyok.push({nev:osztaly.nev,kod:osztaly.kod});
                           });
                           res.render('teacher/classesList.ejs',{osztalyok:osztalyok})
                       }
                    });
            });
            
        //PONTOK HOZZÁADÁSA OLDAL
            app.get('/points/:classId/:subject',isTeacherLoggedIn,function(req, res) {
                var classId = req.params.classId;
                var subject = req.params.subject;
                SuliDB.findOne({'_id':req.user.suli},function(err, suli){
                    if(err || classId=="" || subject==""){
                        console.log("SULI ERROR 5");
                        console.log(err);
                    } else {
                        var osztalyIndex = suli.osztalyok.findIndex(x => String(x._id) == String(classId));
                        var tantargyIndex = suli.osztalyok[osztalyIndex].tantargyak.findIndex(x => String(x.nev) == String(subject));
                        var csoport = suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex];
                        // Ő A CSOPORT TANÁRA?
                            var tanarHozzaferes = false;
                            if(String(csoport.tanarId) == String(req.user._id)){
                                tanarHozzaferes = true;
                            }
                        if(tanarHozzaferes){
                            var diakok = csoport.diakok;
                            var csoportOsztaly = suli.osztalyok[osztalyIndex].nev;
                            var csoportTantargy = csoport.nev;
                            var osztalyKod = suli.osztalyok[osztalyIndex].kod
                            sortObj(diakok,'nev');
                            

                            res.render('teacher/pointsSt.ejs',{diakok:diakok,osztaly:csoportOsztaly,tantargy:csoportTantargy,classId:classId,subject:subject,kod:osztalyKod});
                        }
                    }
                });
            });
        //ÚJ PONT HOZZÁADÁSA
            app.post('/newPoint',function(req, res) {
                var sikerult = true;
                SuliDB.findOne({'_id':req.user.suli},function(err, suli){
                    if(err){
                        sikerult = false;
                        console.log("SULI ERROR 5");
                        console.log(err);
                    } else {
                        var osztalyId = req.body.osztalyId;
                        var tantargy = req.body.tantargy;
                        var diakok = req.body.emberek;
                        var osztalyIndex = suli.osztalyok.findIndex(x => String(x._id) == String(osztalyId));
                        var tantargyIndex = suli.osztalyok[osztalyIndex].tantargyak.findIndex(x => String(x.nev) == String(tantargy));
                        //DIÁKONKÉNT
                            diakok.forEach(function(diak,index){
                                //PONT FRISSÍTÉSE
                                    var diakIndex = suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok.findIndex(x => String(x._id) == String(diak.nevId))
                                    suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok[diakIndex].pont += Number(diak.pont);
                                //FELADAT OBJECT
                                    var feladatObj = {
                                        feladat_id: diak.feladatId,
                                        tantargy:tantargy,
                                        nev:diak.feladatNev,
                                        pont:diak.pont,
                                        mikor:date
                                    }
                                //FELADAT OBJECT SULI DB-be
                                    suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok[diakIndex].kapott.push(feladatObj);
                                //FELADAT OBJECT USER DB-be
                                    User.findOne({'_id':diak.userId},function(err, diakDBbol) {
                                        if(err){
                                            sikerult = false;
                                            console.log('SULI SUJECT MENTÉS ERROR 2');
                                            console.log(err);
                                        } else {
                                            diakDBbol.kapott.push(feladatObj);
                                            diakDBbol.save(function(){
                                               if(err){
                                                    sikerult = false;
                                                    console.log('SULI SUJECT MENTÉS ERROR 3');
                                                    console.log(err);
                                               }
                                            });
                                        }
                                    }); 
                            });
                            suli.markModified('osztalyok');
                            suli.save(function(err, data){
                                if(err){
                                    sikerult = false;
                                    console.log('SULI SUJECT MENTÉS ERROR 4');
                                    console.log(err);
                                } else {
                                    console.log('Új feladat mentve!');
                                }
                            });
                    }
                })
                res.status(200).send({success: sikerult})
            });
        //EGY FELADAT TÖRLÉSE
            app.post('/deleteTask',function(req,res){
                 let osztalyId = req.body.osztalyId;
                 let tantargy = req.body.tantargy;
                 let nevId = req.body.nevId;
                 let userId = req.body.userId;
                 let feladatId = req.body.feladatId;
                 let sikerult = true;
 
                 SuliDB.findOne({'_id':req.user.suli},function(err, suli){
                     if(err){
                         sikerult = false;
                         console.log("SULI ERROR 16");
                         console.log(err);
                     } else {
                         var osztalyIndex = suli.osztalyok.findIndex(x => String(x._id) == String(osztalyId));
                         var tantargyIndex = suli.osztalyok[osztalyIndex].tantargyak.findIndex(x => String(x.nev) == String(tantargy));
                         var userIndex = suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok.findIndex(x => String(x._id) == String(nevId))
                         var feladatIndex = suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok[userIndex].kapott.findIndex(x =>String(x.feladat_id) == String(feladatId))
 
                         //SULI DB
                             //PONT VALTOZTATÁS
                             suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok[userIndex].pont -= suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok[userIndex].kapott[feladatIndex].pont;
                             //FELADAT TÖRLÉS
                             suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok[userIndex].kapott.splice(feladatIndex, 1);

                         suli.save(function(err){
                             if(err){
                                 sikerult = false;
                                 console.log("SULI ERROR 18");
                                 console.log(err);
                             } else {
                                 //USER DB
                                 User.findOne({'_id':userId},function(err, diakDBbol) {
                                     if(err){
                                         sikerult = false;
                                         console.log('SULI  ERROR 16');
                                         console.log(err);
                                     } else {
                                         let kapottIndex = diakDBbol.kapott.findIndex(x =>String(x.feladat_id) == String(feladatId));
                                         diakDBbol.kapott.splice(kapottIndex, 1);
                                         diakDBbol.save(function(err){
                                             if(err){
                                                 sikerult = false;
                                                 console.log('SULI  ERROR 17');
                                                 console.log(err);
                                             } else {
                                                 console.log('Feladat törölve!');
                                             }
                                         });
                                     }
                                 });
                             }
                         });
                     }
                 });
                 res.status(200).send({success: sikerult});
            });
        //FELADAT VÁLTOZTATÁSA POST
            app.post('/changeTask',function(req,res){
                //console.log(req.body)
                let osztalyId = req.body.osztalyId;
                let tantargy = req.body.tantargy;
                let nevId = req.body.nevId;
                let userId = req.body.userId;
                let feladatId = req.body.feladatId;
                let feladatNev = req.body.feladatNev;
                let feladatPont = Number(req.body.feladatPont);
                let sikerult = true;

                SuliDB.findOne({'_id':req.user.suli},function(err, suli){
                    if(err){
                        sikerult = false;
                        console.log("SULI ERROR 16");
                        console.log(err);
                    } else {
                        var osztalyIndex = suli.osztalyok.findIndex(x => String(x._id) == String(osztalyId));
                        var tantargyIndex = suli.osztalyok[osztalyIndex].tantargyak.findIndex(x => String(x.nev) == String(tantargy));
                        var userIndex = suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok.findIndex(x => String(x._id) == String(nevId))
                        var feladatIndex = suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok[userIndex].kapott.findIndex(x =>String(x.feladat_id) == String(feladatId))

                        //SULI DB
                        let pontKulonbseg = feladatPont - suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok[userIndex].kapott[feladatIndex].pont;
                            //PONT VALTOZTATÁS
                            suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok[userIndex].pont += pontKulonbseg;
                            //FELADAT VÁLTOZTATÁS
                            suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok[userIndex].kapott[feladatIndex].nev = feladatNev;
                            suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok[userIndex].kapott[feladatIndex].pont = feladatPont;
                        suli.save(function(err){
                            if(err){
                                sikerult = false;
                                console.log("SULI ERROR 15");
                                console.log(err);
                            } else {
                                //USER DB
                                User.findOne({'_id':userId},function(err, diakDBbol) {
                                    if(err){
                                        sikerult = false;
                                        console.log('SULI  ERROR 12');
                                        console.log(err);
                                    } else {
                                        let kapottIndex = diakDBbol.kapott.findIndex(x =>String(x.feladat_id) == String(feladatId));
                                        diakDBbol.kapott[kapottIndex].nev = feladatNev;
                                        diakDBbol.kapott[kapottIndex].pont = feladatPont;
                                        diakDBbol.save(function(err){
                                            if(err){
                                                sikerult = false;
                                                console.log('SULI  ERROR 13');
                                                console.log(err);
                                            } else {
                                                console.log('Feladat szerkesztve!');
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
                res.status(200).send({success: sikerult});
            });
        //PONTOK/FELADATOK TÖRLÉSE
            app.post('/deletPoints',function(req, res) {
                var nevekId = req.body.nevekId;
                var osztalyId = req.body.osztalyId;
                var tantargy = req.body.tantargy;
                var sikerult = true;
                SuliDB.findOne({'_id':req.user.suli},function(err, suli){
                    if(err){
                        sikerult = false;
                        console.log("SULI ERROR 6");
                        console.log(err);
                    } else {
                        var osztalyIndex = suli.osztalyok.findIndex(x => String(x._id) == String(osztalyId));
                        var tantargyIndex = suli.osztalyok[osztalyIndex].tantargyak.findIndex(x => String(x.nev) == String(tantargy));
                        
                        nevekId.forEach(function(nevId){
                            //SULIDB-ből TÖRLÉS
                            var userIndex = suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok.findIndex(x => String(x._id) == String(nevId))
                            suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok[userIndex].pont = 0;
                            suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok[userIndex].kapott = [];
                        });
                        suli.save(function(err){
                            if(err){
                                sikerult = false;
                                console.log('SULI SUJECT MENTÉS ERROR 6');
                                console.log(err);
                            } else {
                                console.log(nevekId.toString() +' pontjai törölve' );
                            }
                        });
                        
                    }
                });
                res.status(200).send({success: sikerult})
            });
        //PROFIL TÖRLÉSE A CSOPORTBÓL
            app.post('/deletProfileFromGroup',function(req, res) {

                var nevId = req.body.nevId;
                var userId  = req.body.userId;
                var osztalyId = req.body.osztalyId;
                var tantargy = req.body.tantargy;
                
                var sikerult = true;
                SuliDB.findOne({'_id':req.user.suli},function(err, suli){
                    if(err){
                        sikerult = false;
                        console.log("SULI ERROR 6");
                        console.log(err);
                    } else {
                        var osztalyIndex = suli.osztalyok.findIndex(x => String(x._id) == String(osztalyId));
                        var tantargyIndex = suli.osztalyok[osztalyIndex].tantargyak.findIndex(x => String(x.nev) == String(tantargy));
                        var userIndex = suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok.findIndex(x => String(x._id) == String(nevId))
                        
                        //SULIDB-ből TÖRLÉS
                        suli.osztalyok[osztalyIndex].tantargyak[tantargyIndex].diakok[userIndex].remove()
                        suli.save(function(err, data){
                            if(err){
                                sikerult = false;
                                console.log('SULI TÖRLÉS ERROR 1');
                                console.log(err);
                            } else {
                                console.log(nevId +' törölve ' + osztalyId + ' csoportból' );
                                //USER DB-ből TÖRLÉS
                                User.findOne({'_id':userId},function(err, diakDBbol) {
                                    if(err){
                                        sikerult = false;
                                        console.log('SULI TÖRLÉS ERROR 2');
                                        console.log(err);
                                    } else {
                                        diakDBbol.osztalyok.splice(diakDBbol.osztalyok.indexOf(osztalyId),1)
                                        diakDBbol.save();
                                    }
                                });
                            }
                        });
                    }
                });
                res.status(200).send({success: sikerult})
            });
    
    
    
    
// POST Authentication

    //REGISZTRÁCIÓ
            app.post("/register", function(req, res){
                //TANÁR VAGY DIÁK  ?
                    var teljesNeve = req.body.lastname + ' ' + req.body.firstname;
                    var code = req.body.code;
                    var schoolId = req.body.schoolId;
                    var tanarVagyDiak = '';
                    var isTeacher = false;
                    var rosszKodotAdottMeg = false;
                    var sikerult = false;
                    //TANÁR KÓD = 8362
                    if(code==8362){
                        isTeacher = true;
                        sikerult = true;
                        tanarVagyDiak = 'tanár';
                    }
                    else if (code==000){
                        isTeacher == false;
                        sikerult = true;
                        tanarVagyDiak = 'diák';
                    }
                    else{
                        rosszKodotAdottMeg = true;
                    }
                    
                //ÚJ REGISZTRÁLT MENTÉSE
                    if(!rosszKodotAdottMeg){
                        var newUserAdatai = {};
                        
                        //MENTÉS USER DB-be
                            newUserAdatai = {
                                username: req.body.username,
                                teacher: isTeacher,
                                suli:schoolId, 
                                nev:teljesNeve,
                                osztalyok:[], 
                                kapott:[]
                            }
                        //MENTÉS USER DB-be
                            User.register(new User(newUserAdatai), req.body.password, function(err, user){
                                if(err){
                                    console.log('REGISTER ERROR 1');
                                    res.json({ success: false, message: 'Már létezik ilyen felhasználónév!' });
                                }else{
                                    console.log(user.username+' REGISZTRÁLT mint: ' + tanarVagyDiak)
                                    res.status(200).send({success: sikerult,tanar:isTeacher})
                                }
                            });
                    } else {
                        res.json({ success: false, message: 'Nem létező tanári kód!' });
                    }
            });
            
    //JELSZÓ VÁLTOZTATÁS POST
        app.post('/changepassword', function(req, res) {
            var userId = req.user._id;
            var oldpassword = req.body.oldpassword;
            var newpassword = req.body.newpassword;
            
            User.findOne({ _id: userId },(err, user) => {
              if (err) {
                res.json({ success: false, message: 'Próbáld meg újra!' });
              } else {
                if (!user) {
                    res.json({ success: false, message: 'Felhasználó nem létezik!' });
                } else {
                  user.changePassword(oldpassword, newpassword, function(err) {
                     if(err) {
                              if(err.name === 'IncorrectPasswordError'){
                                   res.json({ success: false, message: 'Rossz jelszót adtál meg!' }); // Return error
                              }else {
                                  res.json({ success: false, message: 'Próbáld meg később!' });
                              }
                    } else {
                        console.log('Jelsó változtatás: ' + req.user.nev);
                        res.json({ success: true, message: 'Elmentve!' });
                     }
                   })
                }
              }
            });   
        });
        
    //BEJELENTKEZÉS
        app.post("/login", passport.authenticate("local", {
            failureRedirect: "/rosszJelszo"
        }) ,function(req, res){
            res.redirect('/student')
        });

    //ROSSZ JELSZÓ
        app.get('/rosszJelszo',function(req, res) {
           res.render('rosszJelszo.ejs');
        });

    //KIJELENTKEZÉS
        app.get('/logout', function(req, res){
            console.log(req.user.nev + ' logout');
          req.logout();
          res.redirect('/');
        });
            
    
    
    

    //MÁS OLDAL -> VISSZA HOME OLDALRA
        app.get('/:s',function(req,res){
            res.redirect('/');
        });
        app.get('/:s/:s',function(req,res){
            res.redirect('/');
        });
        app.get('/:s/:s/:s',function(req,res){
            res.redirect('/');
        });
        app.get('/:s/:s/:s/:s',function(req,res){
            res.redirect('/');
        });



//FUNCTIONS
    
    //BE VAN-E JELENTKEZVE?
        function isLoggedIn(req, res, next){
            if(req.isAuthenticated()){
                return next();
            }
            res.redirect("/login");
        }
        
    //TANÁR VAN BEJELENTKEZVE?  
        function isTeacherLoggedIn(req, res, next){
            if(req.isAuthenticated() && req.user.teacher){
                return next();
            }
            res.redirect("/login");
        }
    
    //ADMIN BEVAN JELENTKEZVE?
        function isAdminLoggedIn(req, res, next){
            if(req.isAuthenticated() && req.user.username == 'sebestyn'){
                return next();
            }
            res.redirect("/login");
        }
        

    // SORT OBJECT IN ARRAY 
        function sortObj(array, key) {
              return array.sort(function (a, b) {
                var x = a[key]; var y = b[key];
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
        }
        
    // TELJES OSZTÁLYOK -> OSZTÁLYOK CSAK A TANÁR TANTÁRGYAIVAL
        function tanarOsztalyai(osztalyok,tanarIdja){
            var ujOsztalyok = [];
            osztalyok.forEach(function(osztaly){
                var vanOsztalybanTantargy = false
                var ujOsztaly = { 
                        'tantargyak': [ ], 
                        '_id': osztaly._id, 
                        'nev': osztaly.nev, 
                        'kod': osztaly.kod 
                    }
                    
                osztaly.tantargyak.forEach(function(tantargy){
                    if(tantargy.tanarId == tanarIdja){
                        vanOsztalybanTantargy = true;
                        ujOsztaly.tantargyak.push(tantargy)
                    }
                });
                if(vanOsztalybanTantargy){
                    ujOsztalyok.push(ujOsztaly)
                }
            });
            return ujOsztalyok
        }
        
    //TELJES OSZTÁLYOK -> TANTÁRGY OSZTÁLYOKKAL
        function tanarTantargyai(osztalyok,tanarIdja){

            var tantargyakSzerint = [];
            
            var tantargyakMarVannak = [];
            
            osztalyok.forEach(function(osztaly){
                
                osztaly.tantargyak.forEach(function(tantargy){
                    if(tantargy.tanarId == tanarIdja){
                        if(!tantargyakMarVannak.includes(tantargy.nev)){
                            tantargyakMarVannak.push(tantargy.nev);
                            tantargyakSzerint.push({
                                'nev':tantargy.nev,
                                '_id':tantargy._id,
                                'osztalyok':[{
                                    '_id': osztaly._id, 
                                    'nev': osztaly.nev, 
                                    'kod': osztaly.kod,
                                    'diakok':tantargy.diakok
                                }]
                            })
                        } else {
                            var index = tantargyakSzerint.findIndex(x => x.nev == tantargy.nev);
                            tantargyakSzerint[index].osztalyok.push({
                                '_id': osztaly._id, 
                                'nev': osztaly.nev, 
                                'kod': osztaly.kod,
                                'diakok':tantargy.diakok
                            })
                        }
                    }
                })
            });
            return tantargyakSzerint
        }
    //ID GENERATOR
        function idGenerator(id_length=4){
            let ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
            var d = new Date();
            var id = d.getTime()
            for (var i = 0; i < id_length; i++) {
                id += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
            }
            return id;
        }
        

    //ÜRES ADATBÁZISBA MENTÉS ALAPOK (TANTÁRGYAK,ISKOLÁK...)
        function alapokMenteseAdatbazisba(){
            //TANTÁRGYAK
            TantargyDB.create({
                nev:'matematika' 
             });
             TantargyDB.create({
                nev:'angol' 
             });
             TantargyDB.create({
                nev:'német' 
             });
             TantargyDB.create({
                nev:'biológia' 
             });
             TantargyDB.create({
                nev:'történelem' 
             });
             TantargyDB.create({
                nev:'fizika' 
             });
             TantargyDB.create({
                nev:'földrajz' 
             });
             TantargyDB.create({
                nev:'nyelvtan' 
             });
             TantargyDB.create({
                nev:'kémia' 
             });
             TantargyDB.create({
                nev:'irodalom' 
             });
             //SULIK
             SuliDB.create({
                 nev:'Budapest VI. Kerületi Kölcsey Ferenc Gimnázium',
                 osztalyok:[]
             })
             SuliDB.create({
                 nev:'Szinyei Merse Pál Gimnázium',
                 osztalyok:[]
             });
             SuliDB.create({
                 nev:'Madách Imre Gimnázium',
                 osztalyok:[]
             });
             SuliDB.create({
                 nev:'Szent István Gimnázium',
                 osztalyok:[]
             });
        }


//SERVER INDÍTÁSA  
if(halozatiServer){
    var port = process.env.PORT || 4000;
    app.listen(port, function () {
    console.log("MYNEWS Server Has Started!");
    });
} else {
    app.listen(process.env.PORT, process.env.IP, function () {
        console.log("SERVER IS RUNNING...");
    });
}
    
    
    
    
