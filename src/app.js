const express = require('express');
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('conexãoMongoDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const FilmeSchema = new mongoose.Schema({
  titulo: String,
  ano: String,
});

const Filme = mongoose.model('Filme', FilmeSchema);

const UsuarioSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);

app.use(express.json());

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, 'Secret_Key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const usuario = await Usuario.findOne({ username, password });

  if (!usuario) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ username: usuario.username }, 'Secret_Key', { expiresIn: '1h' });

  res.json({ token });
});

app.get('/filmes/:titulo', authenticateToken, async (req, res) => {
  const { titulo } = req.params;

  try {
    const apiKey = 'API_KEY';
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${titulo}`;
    
    const response = await fetch(url);
    const filmeEncontrado = await response.json();

    if (filmeEncontrado.results.length === 0) {
      return res.status(404).send('Nenhum filme encontrado.');
    }

    const filmeSalvo = await Filme.create({
      titulo: filmeEncontrado.results[0].title,
      ano: filmeEncontrado.results[0].release_date,
    });

    res.json(filmeSalvo);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao buscar o filme.');
  }
});

app.put('/filmes/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { titulo, ano } = req.body;

  try {
    const filmeAtualizado = await Filme.findByIdAndUpdate(
      id,
      { titulo, ano },
      { new: true }
    );

    if (!filmeAtualizado) {
      return res.status(404).send('Filme não encontrado.');
    }

    res.json(filmeAtualizado);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao atualizar o filme.');
  }
});

app.get('/favoritos', authenticateToken, async (req, res) => {
  const favoritos = await Filme.find();
  res.json(favoritos);
});

app.get('/sorte', authenticateToken, async (req, res) => {
  try {
    const filmeAleatorio = await Filme.aggregate([{ $sample: { size: 1 } }]);

    if (!filmeAleatorio || filmeAleatorio.length === 0) {
      return res.status(404).send('Nenhum filme encontrado.');
    }

    res.json(filmeAleatorio[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao buscar um filme aleatório.');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

