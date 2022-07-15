var clients = require("clients");

var express = require("express");
var client_routes = express.Router();

var Blog = require("blog");
var load = require("./load");
var Sync = require("sync");
var Fix = require("sync/fix");

// So the breadcrumbs look like: Settings > Client
client_routes.use(function (req, res, next) {
  res.locals.breadcrumbs.add("Folder", "client");
  next();
});

client_routes

  .route("/switch")

  .get(load.clients, load.client, function (req, res) {
    res.render("clients/switch", {
      title: "Switch to another client",
    });
  })

  .post(function (req, res, next) {
    var redirect = req.baseUrl + "/" + req.body.client;

    if (!req.body.client) {
      return next(new Error("Please select a client"));
    }

    if (req.body.client === req.blog.client) return res.redirect(redirect);

    clients[req.blog.client].disconnect(req.blog.id, function (err) {
      if (err) return next(err);
      Blog.set(req.blog.id, { client: req.body.client }, function (err) {
        if (err) return next(err);

        res.redirect(redirect);
      });
    });
  });

client_routes
  .route("/fix")
  .get(load.clients, load.client, function (req, res) {
    res.render("clients/fix", {
      title: "Reset your folder",
    });
  })
  .post(function (req, res, next) {
    Sync(req.blog.id, function (err, folder, done) {
      if (err) return next(err);
      Fix(req.blog, function (err) {
        if (err) return next(err);
        done(null, function (err) {
          if (err) return next(err);
          res.message(
            req.baseUrl + "/" + req.blog.client,
            "Fixed folder successfully"
          );
        });
      });
    });
  });

client_routes
  .route("/")

  .get(
    load.clients,
    load.client,
    function (req, res, next) {
      if (!req.blog.client) return next();
      res.redirect(req.baseUrl + "/" + req.blog.client);
    },
    function (req, res) {
      res.render("clients", { title: "Select a client", setup_client: true });
    }
  )

  .post(function (req, res, next) {
    var redirect;

    if (!req.body.client) {
      return next(new Error("Please select a client"));
    }

    if (clients[req.body.client] === undefined) {
      return next(new Error("Please select a client"));
    }

    redirect = req.baseUrl + "/" + req.body.client;

    if (req.body.setup) {
      redirect += "?setup=true";
    }

    Blog.set(req.blog.id, { client: req.body.client }, function (err) {
      if (err) return next(err);

      res.redirect(redirect);
    });
  });

client_routes.use("/:client", function (req, res, next) {
  if (!req.blog.client) {
    return res.redirect("/settings/client");
  }

  if (req.params.client !== req.blog.client) {
    return res.redirect(req.baseUrl + "/" + req.blog.client);
  }

  res.locals.base = req.baseUrl;

  next();
});

for (var client_name in clients) {
  var client = clients[client_name];

  if (!client.dashboard_routes) continue;

  client_routes.use("/" + client.name, client.dashboard_routes);
}

client_routes.use("/:client", function (req, res, next) {
  res.redirect(`/dashboard/${req.blog.handle}/client`);
});

module.exports = client_routes;
