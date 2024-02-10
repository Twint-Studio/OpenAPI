const { randomBytes } = require("crypto");
const path = require("path");

const config = require("../config.json");

const mongoose = require('mongoose');
mongoose.connect(config.database.mongodb);

const shortenSchema = require("./models/shorten");
const codebinSchema = require("./models/codebin");

const fastify = require('fastify');
const app = fastify();

app.register(require('@fastify/static'), {
    root: path.join(__dirname, 'assets'),
    prefix: '/assets/',
})

app.register(require("@fastify/view"), {
    engine: {
        ejs: require("ejs"),
    }
});

app.register(require('@fastify/formbody'));

app.get('/', async (req, reply) => {
    return reply.view("/src/views/index.ejs");
});

app.get('/endpoint', async (req, reply) => {
    return reply.view("/src/views/endpoint.ejs");
});

// Shorten
app.get('/shorten', async (req, reply) => {
    return reply.view("/src/views/shorten/index.ejs");
});

app.post('/shorten/create', async (req, reply) => {
    let { code, url } = req.body;

    if (!url) return {
        success: false,
        message: "Missing url"
    }

    if (!code) code = randomBytes(5).toString("hex");

    if (await shortenSchema.findOne({ code })) return {
        success: false,
        message: "Shorten with code already exists"
    }

    await shortenSchema.create({ code, url });

    return {
        success: true,
        message: "Successfully created shorten",
        data: {
            code
        }
    }
});

app.get('/shorten/get', async (req, reply) => {
    const shorten = await shortenSchema.find({});

    return {
        success: true,
        message: "Successfully fetched all shorten",
        data: shorten
    }
});

app.get('/shorten/get/:code', async (req, reply) => {
    let { account_id, account_token } = req.cookies;

    await auth(reply, account_id, account_token);

    const { code } = req.params;

    const shorten = await shortenSchema.findOne({ code });
    if (!shorten) return {
        success: false,
        message: "Shorten not found"
    }

    return {
        success: true,
        message: "Successfully fetched shorten",
        data: shorten
    }
});

app.get('/shorten/:code', async (req, reply) => {
    try {
        const { code } = req.params;

        const shorten = await shortenSchema.findOne({ code });
        if (!shorten) return reply.view("/src/views/404.ejs");

        shorten.count++
        await shorten.save();

        return reply.redirect(shorten.url);
    } catch (err) {
        return reply.view("/src/views/404.ejs");
    }
});

// Codebin
app.get('/codebin', async (req, reply) => {
    return reply.view("/src/views/codebin/index.ejs");
});

app.post('/codebin/create', async (req, reply) => {
    let { content, type } = req.body;

    if (!content) return {
        success: false,
        message: "Missing content"
    }

    if (!type) type = "auto";

    const codebin = await codebinSchema.create({ content, type });

    return {
        success: true,
        message: "Successfully created codebin",
        data: {
            id: codebin.id
        }
    }
});

app.get('/codebin/get', async (req, reply) => {
    const codebin = await codebinSchema.find({});

    return {
        success: true,
        message: "Successfully fetched all codebin",
        data: codebin
    }
});

app.get('/codebin/get/:id', async (req, reply) => {
    const { id } = req.params;

    const codebin = await codebinSchema.findById(id);
    if (!codebin) return {
        success: false,
        message: "Codebin not found"
    }

    return {
        success: true,
        message: "Successfully fetched codebin",
        data: codebin
    }
});

app.get('/codebin/:id', async (req, reply) => {
    try {
        const { id } = req.params;

        const codebin = await codebinSchema.findById(id);
        if (!codebin) return reply.view("/src/views/404.ejs");

        codebin.count++
        await codebin.save();

        return reply.view("/src/views/codebin/view.ejs", {
            content: codebin.content,
            type: codebin.type
        });
    } catch (err) {
        return reply.view("/src/views/404.ejs");
    }
});

app.listen({ port: 3000 }).then(() => {
    console.log('Server running at http://localhost:3000/');
});