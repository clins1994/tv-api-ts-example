import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { getTradingViewSession, signInPayloadSchema } from './tv';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.post('/signin', async (req: Request, res: Response) => {
  try {
    const { username, password } = await signInPayloadSchema.parse(req.body);

    const session = await getTradingViewSession(username, password);

    if (session === null) {
      res.send('Could not get a session with the provided credentials');
    } else {
      res.send(`Got a session for user (id: ${session.userId})`);
    }
  } catch (e) {
    console.error(e);
    res.status(400).send(e);
  }
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
