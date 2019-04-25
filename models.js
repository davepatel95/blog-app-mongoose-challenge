'use strict';

const mongoose = require("mongoose");

const authorSchema = mongoose.Schema({ 
    firstName: 'string',
    lastName: 'string',
    userName: {
        type: 'string',
        unique: true
    }
});

const commentSchema = mongoose.Schema({ content: 'string' });

const blogPostSchema = mongoose.Schema({
    title: {type: String},
    content: {type: String},
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author'},
    comments: [commentSchema]
});

blogPostSchema.virtual("authorName").get(function () {
    return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogPostSchema.methods.serialize = function () {
    return {
        id: this._id,
        title: this.title,
        author: this.authorName,
        content: this.content
    };
};

const Author = mongoose.model("Author", authorSchema);
const BlogPost = mongoose.model("BlogPost", blogPostSchema);

module.exports = { Author, BlogPost };