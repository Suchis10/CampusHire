const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 10000;
const mongoose = require("mongoose");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campusHire")
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log(err));

const Question = require("./models/Question.js");
console.log("Imported Question:", Question);
console.log("Type:", typeof Question);

const User = require("./models/user.js");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;

app.use(session({
  secret: "campushire-secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({                   // ← ADD - saves session to MongoDB
    mongoUrl: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campusHire"
  }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// random number generator
function generateRandomData() {

  const solved = Math.floor(Math.random() * 80);

  return {
    dsaSolved: solved,
    mockScore: Math.floor(Math.random() * 100),
    overallProgress: Math.floor(solved / 2),

    topics: [
      { name: "DSA", solved, total: 200, color: "#2563eb" },
      { name: "Aptitude", solved: Math.floor(Math.random()*40), total: 100, color: "#10b981" }
    ]
  };
}

// login get route
app.get("/", (req, res) => {
  res.render("index", { error: null, formEmail: "" }); // ✅ pass error and formEmail
});

// login post route
app.post("/", async (req, res) => {
  try {
    const { email, password, role } = req.body; // ✅ also grab role

    const user = await User.findOne({ email, password });

    console.log("USER FOUND:", user);

    if (!user) {
      // ✅ render back the page with error instead of blank page
      return res.render("index", {
        error: "❌ Invalid email or password. Please try again.",
        formEmail: email,
      });
    }

    // ✅ check if selected role matches actual account role
    if (user.role !== role) {
      return res.render("index", {
        error: `❌ This account is registered as a ${user.role}. Please select the correct role.`,
        formEmail: email,
      });
    }

    req.session.userId   = user._id;
    req.session.userName = user.name;
    req.session.userRole = user.role;

    req.session.save((err) => {
      if (err) console.log(err);
      // ✅ role-based redirect
      if (user.role === "alumni") {
        res.redirect("/alumni/dashboard");
      } else {
        res.redirect("/main");
      }
    });

  } catch (err) {
    console.log(err);
    res.render("index", {
      error: "Something went wrong. Please try again.",
      formEmail: "",
    });
  }
});

// register route
app.get("/register", (req, res) => {
    res.render("register");
});
//register route for post
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, branch, batch, company, jobRole } = req.body;

    if (password !== confirmPassword) {
      return res.send("❌ Passwords do not match. <a href='/register'>Go back</a>");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.send("❌ Email already registered. <a href='/'>Login instead</a>");
    }

    const solved = Math.floor(Math.random() * 80);

    const newUser = new User({
      name,
      email,
      password,
      role:    role   || "student",
      branch:  branch || "CSE",
      batch:   Number(batch) || 2026,
      company: company  || "",
      jobRole: jobRole  || "",
      dsaSolved:       solved,
      mockScore:       Math.floor(Math.random() * 100),
      overallProgress: Math.floor(solved / 2),
      streak:          0,
      topics: [
        { name: "DSA",      solved: solved,                          total: 200, color: "#2563eb" },
        { name: "Aptitude", solved: Math.floor(Math.random() * 40), total: 100, color: "#10b981" },
        { name: "Core CS",  solved: Math.floor(Math.random() * 30), total: 120, color: "#f59e0b" },
        { name: "HR",       solved: Math.floor(Math.random() * 20), total: 60,  color: "#ef4444" }
      ]
    });

    await newUser.save();

    // ✅ ADD THESE 3 LINES
    req.session.userId   = newUser._id;
    req.session.userRole = newUser.role;

    // ✅ REPLACE res.redirect("/") WITH THIS
    return res.redirect(newUser.role === "alumni" ? "/alumni/dashboard" : "/");

  } catch (err) {
    console.log(err);
    res.send("Something went wrong during registration");
  }
});
// frontend route
app.get("/main", (req,res) =>{
    res.render("frontend");
})

// prepare page
app.get('/prepare', async (req, res) => {
  const companies = [
    {name:"Google",       category:"tech",     package:40, questions:200, logo:"/google.png",    views:3200,   hireRate:19, type:"Product"},
    {name:"Amazon",       category:"tech",     package:32, questions:150, logo:"/amazon.png",    views:9000,   hireRate:20, type:"Product"},
    {name:"Microsoft",    category:"tech",     package:38, questions:180, logo:"/microsoft.png", views:10000,  hireRate:9,  type:"Product"},
    {name:"Infosys",      category:"it",       package:10, questions:120, logo:"/infosys.png",   views:500200, hireRate:78, type:"Service-Based"},
    {name:"TCS",          category:"it",       package:9,  questions:110, logo:"/tcs.png",       views:20000,  hireRate:89, type:"Service-Based"},
    {name:"Goldman Sachs",category:"finance",  package:30, questions:140, logo:"/goldman.jpg",   views:2900,   hireRate:34, type:"Bank"},
    {name:"Deloitte",     category:"consulting",package:25,questions:130, logo:"/deloitte.jpeg", views:80000,  hireRate:67, type:"Service-Based"},
    {name:"JPMorgan",     category:"Finance",  package:18, questions:180, logo:"/jpmorgan.png",  views:28000,  hireRate:42, type:"Bank"},
  ];

  const questions = await Question.find()
    .populate("addedBy", "name company jobRole")
    .sort({ createdAt: -1 });

  res.render('prepare', {
    companies,
    questions,
    userRole: req.session.userRole || "student",
  });
});

// question bank
app.get("/question-bank", async (req, res) => {
  try {
    const questions = await Question.find({
      company: "general"
    }).sort({ frequency: -1 }); // ⭐ important

    res.render("questionBank", { questions });

  } catch (err) {
    console.log(err);
    res.send("Error loading questions");
  }
});

// analytics page
app.get("/analytics", (req, res) => {
    res.render("analytics");
});

// add question page 
app.get("/add-question/:company", (req, res) => {
  const company = req.params.company;
  res.render("addQuestion", { company });
});

app.post("/add-question", async (req, res) => {
  try {
    const { company, questionText, category, difficulty, approach } = req.body;

    await Question.create({
      company: company.toLowerCase(),
      questionText,
      category,
      difficulty,
      approach,
      frequency: Math.floor(Math.random() * 20) + 80 // optional
    });

    res.redirect("/company/" + company);

  } catch (err) {
    console.log(err);
    res.send("Error saving question");
  }
});
// student dashboard
app.get("/dashboard", async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect("/");

    const user = await User.findById(req.session.userId);
    if (!user) { req.session.destroy(); return res.redirect("/"); }

    // ← ADD THESE 3 LINES
    console.log("SOLVED QUESTIONS:", user.solvedQuestions);
    console.log("SOLVED COUNT:", user.solvedQuestions ? user.solvedQuestions.length : 0);
    console.log("FULL USER:", JSON.stringify(user, null, 2));

    const solvedCount = user.solvedQuestions ? user.solvedQuestions.length : 0;

    const student = {
      name:            user.name,
      branch:          user.branch,
      batch:           user.batch,
      role:            user.role,
      streak:          user.streak,
      dsaSolved:       solvedCount,
      mockScore:       user.mockScore,
      overallProgress: Math.min(Math.floor((solvedCount / 50) * 100), 100),
      topics: [
        { name: "DSA",      solved: solvedCount, total: 50,  color: "#2563eb" },
        { name: "Aptitude", solved: user.topics && user.topics[1] ? user.topics[1].solved : 0, total: 100, color: "#10b981" },
        { name: "Core CS",  solved: user.topics && user.topics[2] ? user.topics[2].solved : 0, total: 120, color: "#f59e0b" },
        { name: "HR",       solved: user.topics && user.topics[3] ? user.topics[3].solved : 0, total: 60,  color: "#ef4444" }
      ],
      upcomingCompanies: [
        { name: "TCS",     date: "10 Apr" },
        { name: "Infosys", date: "15 Apr" }
      ],
      targetCompanies: [
        { name: "Amazon", readiness: 75 },
        { name: "Wipro",  readiness: 50 }
      ],
      recentActivity: [
        { title: "Solved Binary Search",    time: "2 hrs ago" },
        { title: "Completed Aptitude Test", time: "1 day ago" }
      ],
      dailyTip: "Solve 2 DSA + 1 Aptitude daily to stay consistent."
    };

    res.render("studentdashboard", { student });

  } catch (err) {
    console.log("DASHBOARD ERROR:", err);
    res.redirect("/");
  }
});
// Toggle question solved
app.post("/toggle-solved", async (req, res) => {
  console.log("TOGGLE SESSION ID:", req.session.userId);
  try {
    if (!req.session.userId) return res.json({ success: false });

    const { questionId } = req.body;
    const user = await User.findById(req.session.userId);

    // ← ADD THIS: initialize if missing
    if (!user.solvedQuestions) {
      user.solvedQuestions = [];
    }

    const alreadySolved = user.solvedQuestions.map(id => id.toString()).includes(questionId);

    if (alreadySolved) {
      user.solvedQuestions = user.solvedQuestions.filter(
        id => id.toString() !== questionId
      );
    } else {
      user.solvedQuestions.push(questionId);
    }

    await user.save();

    res.json({ success: true, solved: !alreadySolved, total: user.solvedQuestions.length });

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
});

// Alumini experience 
const Experience = require("./models/Experience.js"); // new model (see Experience.js)
 
// ── AUTH GUARD ────────────────────────────────────────────────
function requireAlumni(req, res, next) {
  if (!req.session.userId || req.session.userRole !== "alumni") {
    return res.redirect("/");
  }
  next();
}
 
// ── ALUMNI DASHBOARD ─────────────────────────────────────────
app.get("/alumni/dashboard", requireAlumni, async (req, res) => {
  try {
    const alumni = await User.findById(req.session.userId);
    if (!alumni) { req.session.destroy(); return res.redirect("/"); }
 
    const myQuestions   = await Question.find({ addedBy: req.session.userId }).sort({ createdAt: -1 });
    const myExperiences = await Experience.find({ alumniId: req.session.userId }).sort({ createdAt: -1 });
 
    res.render("alumniDashboard", {
      alumni: {
        name:       alumni.name,
        email:      alumni.email,
        company:    alumni.company   || "N/A",
        jobRole:    alumni.jobRole   || "N/A",
        batch:      alumni.batch     || "N/A",
        branch:     alumni.branch    || "N/A",
      },
      myQuestions,
      myExperiences,
      stats: {
        questionsAdded:     myQuestions.length,
        experiencesShared:  myExperiences.length,
      }
    });
 
  } catch (err) {
    console.log("ALUMNI DASHBOARD ERROR:", err);
    res.send("Something went wrong");
  }
});
 
// ── ADD QUESTION (GET) ───────────────────────────────────────
app.get("/alumni/add-question", requireAlumni, (req, res) => {
  res.render("alumniAddQuestion", { error: null });
});

app.post("/alumni/add-question", requireAlumni, async (req, res) => {
  try {
    const { company, questionText, category, difficulty, approach, round, leetcode } = req.body; // ✅ add leetcode

    if (!company || !questionText || !category || !difficulty) {
      return res.status(400).json({ success: false, message: "Please fill all required fields." }); // ✅ json instead of render
    }

    const question = await Question.create({
      company:      company.toLowerCase().trim(),
      questionText: questionText.trim(),
      category,
      difficulty,
      approach:     approach || "",
      round:        round    || "Technical",
      leetcode:     leetcode || "",               // ✅ add this
      frequency:    Math.floor(Math.random() * 20) + 80,
      addedBy:      req.session.userId,
    });

    res.json({ success: true, id: question._id }); // ✅ json instead of redirect

  } catch (err) {
    console.log("ADD QUESTION ERROR:", err);
    res.status(500).json({ success: false, message: "Something went wrong. Please try again." }); // ✅ json instead of render
  }
});

// ── SHARE EXPERIENCE (GET) ───────────────────────────────────
app.get("/alumni/share-experience", requireAlumni, (req, res) => {
  res.render("alumniShareExperience", { error: null });
});
 
// ── SHARE EXPERIENCE (POST) ──────────────────────────────────
app.post("/alumni/share-experience", requireAlumni, async (req, res) => {
  try {
    const {
      company, jobRole, batch,
      offerReceived, ctc,
      rounds, tips, overallExperience
    } = req.body;
 
    if (!company || !jobRole || !rounds || !overallExperience) {
      return res.render("alumniShareExperience", {
        error: "Please fill all required fields."
      });
    }
 
    await Experience.create({
      alumniId:          req.session.userId,
      alumniName:        req.session.userName,
      company:           company.trim(),
      jobRole:           jobRole.trim(),
      batch:             batch || "",
      offerReceived:     offerReceived === "yes",
      ctc:               ctc || "Not disclosed",
      rounds:            rounds.trim(),
      tips:              tips || "",
      overallExperience: overallExperience.trim(),
    });
 
    res.redirect("/alumni/dashboard");
 
  } catch (err) {
    console.log("SHARE EXPERIENCE ERROR:", err);
    res.render("alumniShareExperience", {
      error: "Something went wrong. Please try again."
    });
  }
});
 
// ── PUBLIC: View all experiences ─────────────────────────────
app.get("/experiences", async (req, res) => {
  try {
    const experiences = await Experience.find({}).sort({ createdAt: -1 });
    res.render("experiences", { experiences });
  } catch (err) {
    console.log(err);
    res.send("Error loading experiences");
  }
});
// company page with questions
app.get("/company/:name", async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.name);

    const hardcodedCompanies = [
      { name:"Google",        category:"tech",       package:40, questions:200, logo:"/google.png",    views:3200,   hireRate:19,  type:"Product"       },
      { name:"Amazon",        category:"tech",       package:32, questions:150, logo:"/amazon.png",    views:9000,   hireRate:20,  type:"Product"       },
      { name:"Microsoft",     category:"tech",       package:38, questions:180, logo:"/microsoft.png", views:10000,  hireRate:9,   type:"Product"       },
      { name:"Infosys",       category:"it",         package:10, questions:120, logo:"/infosys.png",   views:500200, hireRate:78,  type:"Service-Based"  },
      { name:"TCS",           category:"it",         package:9,  questions:110, logo:"/tcs.png",       views:20000,  hireRate:89,  type:"Service-Based"  },
      { name:"Goldman Sachs", category:"finance",    package:30, questions:140, logo:"/goldman.jpg",   views:2900,   hireRate:34,  type:"Bank"          },
      { name:"Deloitte",      category:"consulting", package:25, questions:130, logo:"/deloitte.jpeg", views:80000,  hireRate:67,  type:"Service-Based"  },
      { name:"JPMorgan",      category:"Finance",    package:18, questions:180, logo:"/jpmorgan.png",  views:28000,  hireRate:42,  type:"Bank"          },
    ];

    const company = hardcodedCompanies.find(
      c => c.name.toLowerCase() === companyName.toLowerCase()
    ) || { name: companyName, logo: null, type: "Alumni", package: null, hireRate: null };

    const escaped = companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const dbQuestions = await Question.find({        // ✅ renamed to dbQuestions
      company: { $regex: new RegExp(`^${escaped}$`, 'i') }
    })
    .populate("addedBy", "name company jobRole")
    .sort({ createdAt: -1 });

    res.render("companyPage", {
      company,
      questions: dbQuestions,                        
      userRole: req.session.userRole || "student",
    });

  } catch (err) {
    console.log("COMPANY PAGE ERROR:", err);
    res.send("Something went wrong loading this company page.");
  }
});
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${port}`);
});
