const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const Clarifai = require('clarifai');

const appClar = new Clarifai.App({
	 apiKey: '2171cc0253e4468cbaa5e9a9753ef3db'
});

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'Xy971006',
    database : 'smart_brain'
  }
});

const app = express();
app.use(bodyParser.json());
app.use(cors());

const database = {
	users: [
		{
			id: '123',
			name: 'john',
			email: 'john@gmail.com',
			password: 'cookies',
			entries: 0,
			joined: new Date()
		},
		{
			id: '124',
			name: 'sally',
			email: 'sally@gmail.com',
			password: 'bananas',
			entries: 0,
			joined: new Date()
		}
	],
	login: [
		{
			id: '987',
			has: '',
			email: 'john@gmail.com'
		}
	]
}

app.get('/', (req, res) => {
	res.send(database.users);  
})
  
app.post('/signin', (req, res) => {
	const {email, password} = req.body;
	if (!email || !password) {
		return res.status(400).json('incorrect form submission')
	}
	db.select('email', 'hash').from('login')
	.where('email', '=', req.body.email)
	.then(data => {
		if (bcrypt.compareSync(req.body.password, data[0].hash)) {
			return db.select('*').from('users')
					.where('email', '=', req.body.email)
					.then(user => {
						res.json(user[0])
					})
					.catch(err => {
						res.status(400).json('unable to get user')
					})
		} else {
			res.status(400).json('wrong credentials')
		}
	})
	.catch(err => {
		res.status(400).json('wrong credentials')
	})
})

app.post('/register', (req, res) => {
	const {email, password, name} = req.body;
	if (!email || !passwaor || !name) {
		return res.status(400).json('incorrect form submission')
	}
	const hash = bcrypt.hashSync(password);
	db.transaction(trx => {
		trx.insert({
			hash: hash,
			email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			return trx('users')
					.returning('*')
					.insert({
						name: name,
						email: loginEmail[0],
						joined: new Date()
					})
					.then(response => {
						res.json(response[0]);
					})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err => {
		res.status(400).json('unable to register')
	})	
})

app.get('/profile/:id', (req, res) => {
	const { id } = req.params;
	db('users').where('id', id)
	.then(user => {
		if (user.length) {
			res.json(user[0])
		} else {
			res.status(400).json('no such user')
		}
	})
	.cathch(err => {
		res.status(400).json('error getting user')
	})
})

app.put('/image', (req, res) => {
	const { id } = req.body;
	db('users').where('id', '=', id)
	.increment('entries', 1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0]);
	})
	.catch(err => {
		res.status(400).json('unable to get entries');
	})
})

app.post('/imageurl', (req, res) => {
	appClar.models.predict(Clarifai.FACE_DETECT_MODEL, req.body.input)
	.then(data => {
		res.json(data);
	})
	.catch(err => {
		res.status(400).json('unable to work with API')
	})
})

app.listen(3000, () => {
	console.log('app is running');
})