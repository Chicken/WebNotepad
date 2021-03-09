const express = require("express");
const app = new express();
const cookieparser = require("cookie-parser");
const helmet = require("helmet");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const josh = require("@joshdb/core");
const provider = require("@joshdb/sqlite");
const { sessions, users } = josh.multi([ "sessions", "users" ], { provider });
const { port } = require("./config.json");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieparser());
app.use(helmet());

app.listen(port, () => {
    console.log("Server online.");
});

let auth = async (req, res, next, redirect = false) => {
    let { sid } = req.cookies;
    if(!sid || !(await sessions.has(sid))) {
        if(redirect) {
            res.redirect(301, "/login");
            return;
        }
        res
            .status(400)
            .clearCookie("sid")
            .send({
                status: 400,
                reason: "Invalid session"
            });
        return;
    }
    let session = await sessions.get(sid);
    if(session.exp < Date.now()) {
        await sessions.delete(sid);
        if(redirect) {
            res.redirect(301, "/login");
            return;
        }
        res
            .status(401)
            .clearCookie("sid")
            .send({
                status: 401,
                reason: "Session expired"
            });
        return;
    }
    req.user = await users.get(session.user);
    next();
};

app.use("/", async (req, res, next) => {
    switch(req.path) {
        case "/notepad/":
            auth(req, res, next, true);
            break;
        case "/login/":
        case "/":
            if(req.cookies.sid && await sessions.has(req.cookies.sid)) {
                res.redirect(301, "/notepad");
            } else next();
            break;
        default:
            next();
    }
}, express.static("web"));

app.post("/api/signup", async (req, res) => {
    try {
        let { name, password, passwordRepeat } = req.body;

        name = name.toLowerCase();

        if (password != passwordRepeat) {
            res.redirect(301, "/signup#repeat");
            return;
        }

        if (await users.has(name)) {
            res.redirect(301, "/signup#exists");
            return;
        }

        if (name.length > 32 || name.replace(/[^a-z0-9_-]/g, "") != name) {
            res.redirect(301, "/signup#invalid");
            return;
        }

        password = await bcrypt.hash(password, 10);
        await users.set(name, {
            name,
            password,
            created: Date.now(),
            admin: false,
            autonum: 1,
            notes: {}
        });

        let sid = nanoid(64);
        let exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
        await sessions.set(sid, {
            expires: exp,
            user: name
        });
        console.log(`New user "${name}" created.`);
        res
            .cookie("sid", sid, {
                maxAge: exp,
                secure: true
            })
            .redirect(301, "/notepad");
    } catch(e) {
        res.redirect(301, "/signup#error");
    }
});

app.post("/api/login", async (req, res) => {
    try {
        let { name, password } = req.body;

        if (
            !(await users.has(name)) ||
            !(await bcrypt.compare(password, (await users.get(name)).password))
        ) {
            res.redirect(301, "/login#invalid");
            return;
        }

        let sid = nanoid(64);
        let exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
        await sessions.set(sid, {
            expires: exp,
            user: name
        });
        res
            .cookie("sid", sid, {
                maxAge: exp,
                secure: true
            })
            .redirect(301, "/notepad");
    } catch(e) {
        res.redirect(301, "/login#error");
    }
});

app.get("/logout", auth, async (req, res) => {
    await sessions.delete(req.cookies.sid);
    res
        .clearCookie("sid")
        .redirect(301, "/");
});

app.get("/api/notes", auth, (req, res) => {
    res.status(200).send({
        status: 200,
        user: req.user.name,
        notes: req.user.notes
    });
});

app.post("/api/notes/", auth, async (req, res) => {
    let { title, content } = req.body;

    if(typeof title != "string" || typeof content != "string") {
        res.status(400).send({
            status: 400,
            reason: "Title or content are not strings"
        });
        return;
    }


    let id = req.user.autonum;
    await users.inc(req.user.name + ".autonum");

    let note = {
        id,
        title,
        content,
        created: Date.now(),
        modified: Date.now()
    };

    await users.set(req.user.name + ".notes." + id, note);

    res.status(201).send({
        status: 201,
        note
    });
});

let exists = async (req, res, next) => {
    let id = req.params.id;
    if(!Object.keys(req.user.notes).includes(id)){
        res.status(400).send({
            status: 400,
            reason: "Note doesn't exists"
        });
        return;
    }
    next();
};

app.get("/api/notes/:id", auth, exists, async (req, res) => {
    res.status(200).send({
        status: 200,
        data: req.user.notes[req.params.id]
    });
});

app.patch("/api/notes/:id", auth, exists, async (req, res) => {
    let { title, content } = req.body;

    if(typeof title != "string" || typeof content != "string") {
        res.status(400).send({
            status: 400,
            reason: "Title or content are not strings"
        });
        return;
    }

    await users.update(req.user.name + ".notes." + req.params.id, {
        title,
        content,
        modified: Date.now()
    });

    res.status(200).send({
        status: 200,
        note: await users.get(req.user.name + ".notes." + req.params.id)
    });
});

app.delete("/api/notes/:id", auth, exists, async (req, res) => {
    await users.delete(req.user.name + ".notes." + req.params.id);
    res.status(200).send({
        status: 200
    });
});
