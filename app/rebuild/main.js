var helper = require('../helper');
var ensure = helper.ensure;

var Entry = require('../models/entry');
var Entries = require('../models/entries');
var Blog = require('../models/blog');

// If require main = module ...

// setTimeout(function(){

//   throw 'REBUILD FAILED';

// }, 7 * 1000);

process.on('message', function(blogID) {

  main(blogID, function(err){

    if (err) console.log('REBUILD ERROR:', err);

  });
});

function main (blogID, callback) {

  Blog.get({id: blogID}, function(err, blog){

    if (err || !blog) return console.log('No blog with ID', blogID);

    var identifier = blog.handle + '\'s blog';
    var label = 'Rebuilt ' + identifier + ' in';

    console.log('Rebuilding ' + identifier + ' (' + blogID + ')');
    console.time(label);

    rebuild(blog, function(err){

      console.timeEnd(label);
      console.log();

      return callback(err);
    });
  });
}

function rebuild (blog, callback) {

  ensure(blog, 'object')
    .and(callback, 'function');

  Entries.each(blog.id, function(entry, next){

    single(blog, entry, next);

  }, callback);
}

function single (blog, entry, callback) {

  ensure(blog, 'object')
    .and(entry, 'object')
    .and(callback, 'function');

  if (!entry) {
    console.warn('No entry exists with path', entry.path);
    return callback();
  }

  // Otherwise this would
  // make the entry visible...
  if (entry.deleted) return callback();

  var path = entry.path;

  Entry.build(blog, path, function(err, entry){

    if (err && err.code === 'ENOENT') {
      console.warn('No local file exists for entry', path);
      return callback();
    }

    // don't know
    if (err) {
      console.log('-----> REBUILD ERROR');
      console.log(err);
      if (err.stack) console.log(err.stack);
      if (err.trace) console.log(err.trace);
      return callback();
    }

    Entry.set(blog.id, entry.path, entry, callback);
  });
}

module.exports = main;