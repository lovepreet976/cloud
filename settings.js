const settings = {
  development: {
    db: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || 5432,
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
      database: process.env.POSTGRES_DB || 'notejam'
    },
    dsn: `postgres://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'password'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'notejam'}`
  },

  production: {
    db: {
      host: process.env.POSTGRES_HOST || 'db',
      port: process.env.POSTGRES_PORT || 5432,
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
      database: process.env.POSTGRES_DB || 'notejam'
    },
    dsn: `postgres://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'password'}@${process.env.POSTGRES_HOST || 'db'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'notejam'}`
  }
};

let env = process.env.NODE_ENV || 'development';

if (!settings[env]) {
  console.warn(`❌ Unknown NODE_ENV "${env}". Falling back to 'development'.`);
  env = 'development';
}

console.log('🛠️ NODE_ENV:', env);
console.log('📦 Loaded DB Config:', settings[env].db);

module.exports = settings[env];
