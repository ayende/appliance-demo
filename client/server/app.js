const express = require("express");
const cors = require("cors");
const path = require("path");
const ravendb = require("ravendb");
const { performance } = require('perf_hooks');
const { cwd } = require("process");

const documentStore = new ravendb.DocumentStore("http://localhost:8080", "Hugin");
documentStore.initialize();

const app = express();

function getRouteCode(req) {
    // quick and dirty way to do self reflection to render the route code
    const code = req.route.stack[0].handle;
    return `app.${req.method.toLowerCase()}("${req.route.path}", ${code})`;
}

const isProdEnv = process.env.NODE_ENV === "production";
if (isProdEnv) {
    app.use(express.static(path.join(path.resolve(), "build", "public")));
} else {
    const corsOptions = {
        origin: [
            "http://127.0.0.1:5173",
            "http://localhost:5173",
        ],
        credentials: true,
    };

    app.use(cors(corsOptions));
}

app.get("/api/question", async (req, res) => {
    console.log(req.query);
    const session = documentStore.openSession();
    const question = await session.include("Owner")
        .include("Answers[].Owner")
        .include("Answers[].Comments[].User")
        .load(req.query.id);

    const userIds = question.Answers
        .map(a => a.Comments.map(c => c.User)
            .concat([a.Owner])).flat();
    const users = await session.load(userIds);
    res.send({
        data: { question, users },
        code: getRouteCode(req)
    })
});

app.get("/api/search", async (req, res) => {
    const session = documentStore.openSession();

    const tags = Array.isArray(req.query.tag) ?
        req.query.tags : [req.query.tag].filter(x => x);
    const page = req.query.page || 0;
    const pageSize = req.query.pageSize || 10;

    const query = session.query({ indexName: "Questions/Search" })
        .take(pageSize).skip(page * pageSize);

    if (tags.length > 0) {
        query.whereIn("Tags", tags);
    }
    if (req.query.community) {
        query.andAlso().whereEquals("Community", req.query.community);
    }
    if (req.query.search) {
        query.andAlso().search("Query", req.query.search);
    }

    var queryStart = performance.now();
    const results = await query
        .orderByDescending(req.query.orderBy || "CreationDate")
        .include("Owner")
        .all();

    var queryEnd = performance.now();

    var postTags = new Set(results.map(x => x.Tags).flat());

    var tagsStart = performance.now();
    const relatedTags = await session.query({ indexName: "Questions/Tags" })
        .whereIn("Tag", postTags)
        .orderByDescending("Count", "Long")
        .take(10)
        .all();
    var tagsEnd = performance.now();

    const users = await session.load(results.map(q => q.Owner));

    res.send({
        data: { results, users, relatedTags },
        code: getRouteCode(req),
        timings: {
            query: queryEnd - queryStart,
            tags: tagsEnd - tagsStart
        }
    })
})

app.get("/api/communities", async (req, res) => {
    const session = documentStore.openSession();
    var queryStart = performance.now();
    const results = await session
        .query({ collection: "Communities" })
        .all();
    var queryEnd = performance.now();

    res.send({
        data: results,
        code: getRouteCode(req),
        timings: {
            query: queryEnd - queryStart,
        }
    })

});

app.get("/**", (req, res) => {
    res.sendFile(path.join(path.resolve(), "build", "public", "index.html"));
});

app.all("*", (req, res, next) => {
    next(new Error(`Can't find ${req.originalUrl} on this server!`, 404));
});

module.exports = app;