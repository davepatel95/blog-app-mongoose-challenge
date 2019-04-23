'use strict';

const mongoose = require("mongoose");

const blogPostSchema = mongoose.Schema({
    title: {type: String},
    content: {type: String},
    author: {
        firstName: String,
        lastName: String
    }
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

const Blogpost = mongoose.model("post", blogPostSchema);

module.exports = { Blogpost };