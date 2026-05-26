
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'advertiser',
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teasers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  budget DECIMAL(10,2) DEFAULT 0,
  spent DECIMAL(10,2) DEFAULT 0,
  cpm DECIMAL(10,4) DEFAULT 10.00,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  token VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  earnings DECIMAL(10,2) DEFAULT 0,
  subscribers INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_subscribers (
  id SERIAL PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id),
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  browser VARCHAR(100),
  country VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(endpoint)
);

CREATE TABLE IF NOT EXISTS impressions (
  id SERIAL PRIMARY KEY,
  teaser_id INTEGER REFERENCES teasers(id),
  subscriber_id INTEGER REFERENCES push_subscribers(id),
  site_id INTEGER REFERENCES sites(id),
  clicked BOOLEAN DEFAULT FALSE,
  cost DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(30) NOT NULL,
  description TEXT,
  payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);
