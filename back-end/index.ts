import { Application } from './deps/oak.ts';

const app = new Application();

app.use((ctx) => {
    ctx.response.body = "Hello world!";
});

await app.listen({ port: 8000 });