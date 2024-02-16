const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;


mongoose.connect('SUA_URL_DE_CONEXAO_COM_MONGODB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


const FilmeSchema = new mongoose.Schema({
  titulo: String,
  ano: String,
});

const Filme = mongoose.model('Filme', FilmeSchema);

app.use(express.json());

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, 'SEU_SEGREDO_JWT', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const UsuarioSchema = new mongoose.Schema({
    username: String,
    password: String, 
  });
  
  const Usuario = mongoose.model('Usuario', UsuarioSchema);
  
  // Rota de login
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    const usuario = await Usuario.findOne({ username, password });
  
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
  
    const token = jwt.sign({ username: usuario.username }, 'SEU_SEGREDO_JWT', { expiresIn: '1h' });
  
    res.json({ token });
  });


app.get('/filmes/:titulo', authenticateToken, async (req, res) => {
  const { titulo } = req.params;
  
  try {
    const response = await axios.get(`URL_DA_API_DE_FILMES?titulo=${titulo}`);
    
    const filmeSalvo = await Filme.create(response.data);
    
    res.json(filmeSalvo);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao buscar o filme.');
  }
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
    app.get('/favoritos', authenticateToken, async (req, res) => {

        const favoritos = await Filme.find();
        res.json(favoritos);
      
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
});





app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
