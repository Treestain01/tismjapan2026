import app from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.listen(PORT, () => {
  console.log(`TISM Japan API running on http://localhost:${PORT}`);
});
