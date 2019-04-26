'use strict';

const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require("./config");
const {Author, BlogPost} = require("./models");

const app = express();
app.use(morgan('common'));
app.use(express.json());

//Authors endpoints
app.get("/authors", (req, res) => {
    Author
        .find()
        .then(authors => {
            res.json(authors.map(author => {
                return {
                    id: author._id,
                    name: `${author.firstName} ${author.lastName}`,
                    userName: author.userName
                };
            }));
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Something went terribly wrong' });
        });
});

app.post("/authors", (req, res) => {
    const requiredFields = ['firstName', 'lastName', 'userName'];
    for(let i=0; i<requiredFields.length;i++) {
        const field = requiredFields[i];
        if(!(field in req.body)) {
            const message = `Missing \`${field}\` in request body`;
            console.error(message);
            return res.status(400).send(message);
        }
    }

    Author
    .findOne({ userName: req.body.userName })
    .then(author => {
        if(author) {
            const message = `Username already taken`;
            console.error(message);
            return res.status(400).send(message);
        }
        else {
            Author
                .create({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    userName: req.body.userName
                })
                .then(author => res.status(201).json({
                    id: author.id,
                    name: `${author.firstName} ${author.lastName}`,
                    userName: author.userName
                }))
                .catch(err => {
                    console.error(err);
                    res.status(500).json({ error: 'Something went terribly wrong' });
                });
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Something went very wrong' });
        });
});

app.put("/authors/:id", (req, res) => {
    if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        res.status(400).json({ 
            error: 'Request path id and request body id values must match'
        });
    }

    const updated = {};
    const updateableFields = ['firstName', 'lastName', 'userName'];
    updateableFields.forEach(field => {
        if(field in req.body) {
            updated[field] = req.body[field];
        }
    });

    Author
        .findOne({ userName: req.body.userName })
        .then(author => {
            if(author) {
                const message = `Username already taken`;
                console.log(message);
                return res.status(400).send(message);
            }
            else {
                Author
                    .findByIdAndUpdate(req.body.id, {$set: updated}, {new: true})
                    .then(author => res.status(200).json({
                        id: author.id,
                        name: `${author.firstName} ${author.lastName}`,
                        userName: author.userName
                    }))
                    .catch(err => res.status(500).json({ message: "Internal server error"}));
            }
        })
});

app.delete("/authors/:id", (req, res) => {
    let author = req.params.id;

    BlogPost
        //doesn't work with remove, deleteOne not properly working either
        .remove({author: req.params.id})
        .then(() => {
            Author
                .findByIdAndDelete(req.params.id)
                then(() => res.status(204).json({ message: 'success' }));
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: "Something went wrong"});
        });
});


//Blogpost endpoints
app.get("/blogposts", (req, res) => {
    console.log('Hello is this thing on?')
    BlogPost
        .find()
        .populate('author')
        .then(blogposts => {
            res.json({
             blogposts: blogposts.map(blogposts => blogposts.serialize())
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: "Internal server error" });
        });
});

app.get("/blogposts/:id", (req,res) => {
    BlogPost
        .findById(req.params.id)
        .then(post => {
            res.json(post.serialize())
            })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: "Internal server error"});
        });
});

app.post("/blogposts", (req, res) => {
    const requiredFields = ['title', 'content', 'author_id'];
    for(let i =0; i< requiredFields.length;i++) {
        const field = requiredFields[i];
        if(!(field in req.body)) {
            const message = `Missing \`${field}\` in request body`
            console.error(message);
            return res.status(400).send(message);
        }
    }


    Author 
        .findById(req.body.author_id)
        .then(author => {
            if (author) {
                BlogPost
                    .create({
                        title: req.body.title,
                        content: req.body.content,
                        author: req.body.id
                    })
                    .then(blogPost => res.status(201).json({
                        id: blogPost.id,
                        author: `${author.firstName} ${author.lastName}`,
                        content: blogPost.content,
                        title: blogPost.title,
                        comments: blogPost.comments
                    }))
                    .catch(err => {
                        console.error(err);
                        res.status(500).json({ error: 'something went very wrong' });
                    });
            }
            else {
                const message = `Author not found`;
                console.error(message);
                return res.status(400).send(message);
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Something went terribly wrong' });
        });
});

app.put("/blogposts/:id", (req, res) => {
    if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        res.status(400).json({
            error: 'Request path id and request body id values must match'
        });
    }

    const updated = {};
    const updateableFields = ['title', 'content'];
    updateableFields.forEach(field => {
        if(field in req.body) {
            updated[field] = req.body[field];
        }
    });

    BlogPost
        .findByIdAndUpdate(req.params.id, {$set: updated}, {new: true })
        .then(blogpost => res.status(200).json({
            title: blogpost.title,
            content: blogpost.content
        }))
        .catch(err => res.status(500).json({message: "Internal server error"}));
});

app.delete("/blogposts/:id", (req, res) => {
    BlogPost
        .findByIdAndDelete(req.params.id)
        .then(() => res.status(204).end())
        .catch(err => res.status(500).json({message: "Internal server error"}));
});

let server;

function runServer(databaseUrl, port = PORT) {
    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, { useNewUrlParser: true}, err => {
            if(err) {
                return reject(err);
            }
            server = app.listen(port, () => {
                console.log(`Your app is listening on port ${port}`);
                resolve();
            })
            .on('error', err => {
                mongoose.disconnect();
                reject(err);
            });
        });
    });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log('Closing server');
            server.close(err => {
                if(err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

if(require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = {runServer, app, closeServer};