import express from 'express';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const app = express();

app.disable('x-powered-by');

app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf; // raw bytes, needed for Meta's signature check later
    },
  })
);

app.use(routes);
app.use(notFound);
app.use(errorHandler);

export default app;